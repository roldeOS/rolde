"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  feedDelta,
  reportRealtimeIssue,
  type FeedDelta,
} from "@/app/(app)/patients/feedLiveActions";

/**
 * Live Feed (Roland 2026-07-23) — the CLIENT half. It keeps this patient's
 * timeline current while the clinician works, without polling and without ever
 * touching the Scribe editor (that lives in a different subtree).
 *
 * Transport = Postgres Changes on the feed table, filtered to THIS patient and
 * RLS-scoped by the user's JWT (a client only ever receives changes to patients
 * it may access). Each change is only a NUDGE: we debounce, then fetch the delta
 * (only the rows newer than we hold) via `feedDelta`. Bounded by OPEN pages, not
 * patients — 200 clinicians on 200 records is 200 light channels, not millions.
 *
 * Fallback (option C): every time the tab regains focus we reconcile too — so
 * updates keep flowing even if realtime is completely down. A genuine channel
 * failure is reported once (which clinic) for the Custodian + Caretaker.
 */

/** The newest of an entry's timestamps — the cursor advances past this. */
function entryTs(e: {
  created_at: string;
  edited_at: string | null;
  struck_at: string | null;
}): number {
  return Math.max(
    Date.parse(e.created_at) || 0,
    e.edited_at ? Date.parse(e.edited_at) || 0 : 0,
    e.struck_at ? Date.parse(e.struck_at) || 0 : 0,
  );
}

export function useLiveFeed(opts: {
  patientId: string;
  /** Newest timestamp (ISO) the SSR feed already holds — the initial cursor. */
  initialSince: string;
  /** Each batch of new/changed entries (already RLS-scoped). */
  onDelta: (delta: FeedDelta) => void;
  /** Live channel dropped (true) or (re)connected (false). */
  onStatus?: (degraded: boolean) => void;
}) {
  const { patientId, initialSince, onDelta, onStatus } = opts;
  // Latest callbacks held in refs so the channel isn't torn down every render.
  const onDeltaRef = useRef(onDelta);
  const onStatusRef = useRef(onStatus);
  onDeltaRef.current = onDelta;
  onStatusRef.current = onStatus;

  const sinceRef = useRef(initialSince);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let again = false;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    let reported = false;

    async function pull() {
      if (cancelled) return;
      if (inFlight) {
        again = true;
        return;
      }
      inFlight = true;
      try {
        const r = await feedDelta(patientId, sinceRef.current);
        if (cancelled || !r.ok) return;
        if (r.data.entries.length) {
          let max = Date.parse(sinceRef.current) || 0;
          for (const e of r.data.entries) max = Math.max(max, entryTs(e));
          if (max > 0) sinceRef.current = new Date(max).toISOString();
          onDeltaRef.current(r.data);
        }
      } finally {
        inFlight = false;
        if (again && !cancelled) {
          again = false;
          schedule();
        }
      }
    }
    function schedule() {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => void pull(), 250);
    }

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void (async () => {
      // Authorise the socket with the user's JWT so Postgres-Changes RLS applies.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session?.access_token)
        supabase.realtime.setAuth(data.session.access_token);

      const sub = {
        schema: "public",
        table: "patient_feed_entries",
        filter: `patient_id=eq.${patientId}`,
      } as const;

      channel = supabase
        .channel(`feed:${patientId}`)
        .on("postgres_changes", { event: "INSERT", ...sub }, schedule)
        .on("postgres_changes", { event: "UPDATE", ...sub }, schedule)
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            onStatusRef.current?.(false);
            reported = false;
            // A (re)connect may have missed events — reconcile once.
            schedule();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            // A real failure (not a normal unmount CLOSED). Fall back to focus
            // refetch, and tell the Custodian + Caretaker which clinic — once.
            onStatusRef.current?.(true);
            if (!reported) {
              reported = true;
              void reportRealtimeIssue({
                patientId,
                reason: status === "TIMED_OUT" ? "timed_out" : "channel_error",
              });
            }
          }
        });
    })();

    // Fallback (option C): reconcile whenever the tab regains focus/visibility.
    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      cancelled = true;
      if (debounce) clearTimeout(debounce);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [patientId]);
}
