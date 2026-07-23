"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import type {
  FeedEntry,
  CourierDispatchTrail,
} from "@/components/consultation/ClinicalNotesFeed";
import type { NotePhoto } from "@/components/consultation/NotePhotoGallery";

/**
 * Live Feed (Roland 2026-07-23) — the SERVER half of "the timeline updates in
 * real time." The browser subscribes to Postgres Changes on the feed table
 * (RLS-filtered per patient); each change is only a NUDGE. On a nudge — or when
 * the tab regains focus (the fallback) — the client calls `feedDelta`, which
 * returns ONLY the visible entries newer than what it already holds, plus the
 * photos + dispatch trails for exactly those entries. Every read is RLS-scoped,
 * so a delta can never surface a patient the caller may not see.
 *
 * Why a delta and not a refetch-everything: it keeps the wire tiny (usually one
 * row), never re-signs the whole photo set (no flicker), and the load scales
 * with OPEN pages, not with a patient's history.
 */

// The workup entry types the visible timeline hides — mirror of the page loader
// (app/(app)/patients/[id]/page.tsx). Kept in lock-step by intent.
const WORKUP_TYPES = new Set([
  "lab_order",
  "lab_result",
  "radiology_order",
  "radiology_result",
  "prescription",
  "photo_set",
  "consent_signed",
]);

const FEED_COLUMNS =
  "id, entry_type, payload, created_at, created_by, edited_at, struck_at, related_entry_id, shared_with_patient";

async function requireClinic() {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || !tenantId) return null;
  return {
    userId: ctx.user.id,
    tenantId,
    role: ctx.membership?.role ?? "",
    supabase: await createClient(),
  };
}

export type FeedDelta = {
  entries: FeedEntry[];
  photosByEntry: Record<string, NotePhoto[]>;
  dispatches: CourierDispatchTrail[];
};

/**
 * The entries created/edited/struck AFTER `sinceIso` (the newest timestamp the
 * client already holds), with their photos + dispatch trails. A valid cursor is
 * required — this never dumps a whole feed.
 */
export async function feedDelta(
  patientId: string,
  sinceIso: string,
): Promise<{ ok: true; data: FeedDelta } | { ok: false; error: string }> {
  const c = await requireClinic();
  if (!c) return { ok: false, error: "No clinic context." };
  const since = new Date(sinceIso);
  if (Number.isNaN(since.getTime())) return { ok: false, error: "Bad cursor." };
  const s = since.toISOString();

  // created OR edited OR struck after the cursor — catches new notes, amendments
  // and strikes alike. Values are quoted so the millisecond dot can't be mistaken
  // for a PostgREST separator. deleted_at IS NULL: soft-deletes reconcile on the
  // next full load, not live (a rare, non-urgent case).
  const { data: rows, error } = await c.supabase
    .from("patient_feed_entries")
    .select(FEED_COLUMNS)
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .or(`created_at.gt."${s}",edited_at.gt."${s}",struck_at.gt."${s}"`)
    .order("created_at", { ascending: true })
    .limit(300);
  if (error) return { ok: false, error: "Could not load updates." };

  const entries = ((rows ?? []) as FeedEntry[]).filter(
    (e) => !WORKUP_TYPES.has(e.entry_type),
  );
  const ids = entries.map((e) => e.id);
  if (!ids.length)
    return { ok: true, data: { entries: [], photosByEntry: {}, dispatches: [] } };

  const [{ data: photos }, { data: dispatches }] = await Promise.all([
    c.supabase
      .from("patient_photo")
      .select("id, feed_entry_id, phase, view, storage_path, thumb_path")
      .in("feed_entry_id", ids)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    c.supabase
      .from("courier_dispatches")
      .select(
        "entry_id, recipient_name, status, created_at, courier_dispatch_events(event, created_at)",
      )
      .in("entry_id", ids)
      .order("created_at", { ascending: true }),
  ]);

  const photosByEntry: Record<string, NotePhoto[]> = {};
  if (photos && photos.length) {
    const paths = photos.flatMap((p) => [p.thumb_path, p.storage_path]);
    const { data: signed } = await c.supabase.storage
      .from("patient-photos")
      .createSignedUrls(paths, 3600);
    const urlOf = new Map((signed ?? []).map((x) => [x.path, x.signedUrl]));
    for (const p of photos) {
      if (!p.feed_entry_id) continue;
      (photosByEntry[p.feed_entry_id] ??= []).push({
        id: p.id,
        phase: p.phase,
        view: p.view,
        thumbUrl: urlOf.get(p.thumb_path) ?? "",
        url: urlOf.get(p.storage_path) ?? "",
      });
    }
  }

  return {
    ok: true,
    data: {
      entries,
      photosByEntry,
      dispatches: (dispatches ?? []) as CourierDispatchTrail[],
    },
  };
}

const HEALTH_REASONS = new Set(["channel_error", "timed_out", "connect_failed"]);

/**
 * A client records that its live channel failed — tagged with the clinic — so the
 * Custodian (all clinics) and that clinic's Caretaker can see a clinic whose live
 * updates are flaky. Best-effort: it never throws into the UI, and the feed has
 * already fallen back to refetch-on-focus by the time this is called.
 */
export async function reportRealtimeIssue(input: {
  patientId?: string;
  reason: string;
}): Promise<{ ok: boolean }> {
  const c = await requireClinic();
  if (!c) return { ok: false };
  const reason = HEALTH_REASONS.has(input.reason) ? input.reason : "channel_error";
  const ua = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  const { error } = await c.supabase.from("realtime_health").insert({
    tenant_id: c.tenantId,
    patient_id: input.patientId ?? null,
    user_id: c.userId,
    reason,
    user_agent: ua,
  });
  return { ok: !error };
}
