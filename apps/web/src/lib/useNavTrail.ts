"use client";

import { useEffect, useState } from "react";

/**
 * useNavTrail — the topbar's JOURNEY breadcrumb (Roland 2026-06-11). Not a
 * static URL hierarchy: it records the path the user actually walked, rooted at
 * the Dashboard, so they can step back to where they started.
 *
 *   Dashboard → Patients → Sarah Jones            ⇒  🏠 › Patients › Sarah Jones
 *   …then jump to Legal & Safety                  ⇒  🏠 › 👥 › Sarah Jones › Legal & Safety
 *
 * Rules: visiting a page already in the trail TRUNCATES back to it (you walked
 * back); visiting a new page APPENDS; the Dashboard always resets to the root.
 * Persisted in sessionStorage so it survives a refresh within the session.
 */

export interface TrailEntry {
  href: string;
  label: string;
  kind: string;
}

const KEY = "rolde:nav-trail";
const MAX = 6;
const DASH: TrailEntry = { href: "/", label: "Dashboard", kind: "dashboard" };

function read(): TrailEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(trail: TrailEntry[]): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(trail));
  } catch {
    /* quota — ignore */
  }
}

/**
 * @param current  the page being viewed (null while a label is still resolving
 *                 — e.g. a patient name loading — so we don't push a placeholder)
 * @param parents  hierarchical parents to seed on a COLD load (refresh straight
 *                 onto a deep page) so the trail still reads sensibly
 */
export function useNavTrail(
  current: TrailEntry | null,
  parents: TrailEntry[] = [],
  /** The "/" home crumb — Dashboard for clinic roles, Overview for a Custodian.
   *  Defaults to DASH, so existing (clinic-role) callers behave identically. */
  root: TrailEntry = DASH,
): TrailEntry[] {
  const [trail, setTrail] = useState<TrailEntry[]>([]);

  // Serialise the seed so the effect re-runs if a cold-load parent appears.
  const parentSig = parents.map((p) => p.href).join("|");

  useEffect(() => {
    if (!current) {
      setTrail(read());
      return;
    }
    const prev = read();
    let next: TrailEntry[];

    if (current.href === "/") {
      next = [root];
    } else {
      const idx = prev.findIndex((e) => e.href === current.href);
      if (idx >= 0) {
        // Walked back to a page already in the trail → truncate to it, refresh
        // its label (a patient name may have resolved since).
        next = prev.slice(0, idx + 1);
        next[idx] = { ...next[idx], label: current.label, kind: current.kind };
      } else if (prev.length === 0) {
        // Cold load — seed home + inferred parents + current.
        next = [root, ...parents, current];
      } else {
        next = [...prev, current];
      }
    }

    // Always rooted at home ("/"); its label/kind follows the role (Dashboard ↔ Overview).
    if (next[0]?.href !== "/") next = [root, ...next];
    if (next[0]?.href === "/") next[0] = root;
    // Cap length: keep the root + the most recent crumbs.
    if (next.length > MAX) next = [next[0], ...next.slice(next.length - (MAX - 1))];

    write(next);
    setTrail(next);
    // root is stable per session (role doesn't change mid-session) — not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.href, current?.label, current?.kind, parentSig]);

  return trail;
}
