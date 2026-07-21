/**
 * Rich notes (B6, Roland 2026-07-21 "make it elegant and beautiful") — the
 * SIDECAR-MARKS model, chosen for clinical safety.
 *
 * The note's canonical text stays EXACTLY plain (payload.text) — search,
 * Courier, the letter PDF, exports and every existing note are untouched, and
 * "clinicians are not coders" holds (no syntax ever enters the record).
 * Formatting rides ALONGSIDE as presentation metadata: an array of character
 * ranges over that plain text. Drop the marks and you have a perfectly
 * readable note — nothing is ever lost. A note with no marks renders exactly
 * as it does today (Calm Formatting B), so the change is fully backward
 * compatible.
 *
 * Four inline kinds only — bold · italic · underline · highlight — the
 * alphabet of 2026 that needs no explanation (Roland's own point).
 */
export type MarkKind = "b" | "i" | "u" | "h";
export const MARK_KINDS: MarkKind[] = ["b", "i", "u", "h"];

/** A formatting range: [s, e) in UTF-16 code units over the plain text. */
export type NoteMark = { s: number; e: number; k: MarkKind };

const MAX_MARKS = 400; // a hard ceiling — a note can't carry an abusive payload

/** Hostile-proof + tidy: clamp to the text, drop empties, merge touching runs
 *  of the same kind, cap the count. Used at the door (server) and on read. */
export function sanitizeMarks(raw: unknown, textLen: number): NoteMark[] {
  if (!Array.isArray(raw)) return [];
  const clean: NoteMark[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const k = (m as NoteMark).k;
    if (k !== "b" && k !== "i" && k !== "u" && k !== "h") continue;
    let s = Math.round(Number((m as NoteMark).s));
    let e = Math.round(Number((m as NoteMark).e));
    if (!Number.isFinite(s) || !Number.isFinite(e)) continue;
    s = Math.max(0, Math.min(s, textLen));
    e = Math.max(0, Math.min(e, textLen));
    if (e <= s) continue;
    clean.push({ s, e, k });
    if (clean.length > MAX_MARKS * 2) break;
  }
  return mergeMarks(clean).slice(0, MAX_MARKS);
}

/** Merge overlapping/adjacent ranges of the SAME kind into the fewest runs. */
export function mergeMarks(marks: NoteMark[]): NoteMark[] {
  const out: NoteMark[] = [];
  for (const k of MARK_KINDS) {
    const same = marks
      .filter((m) => m.k === k)
      .sort((a, b) => a.s - b.s || a.e - b.e);
    let cur: NoteMark | null = null;
    for (const m of same) {
      if (cur && m.s <= cur.e) {
        cur.e = Math.max(cur.e, m.e);
      } else {
        cur = { ...m };
        out.push(cur);
      }
    }
  }
  return out.sort((a, b) => a.s - b.s || a.e - b.e);
}

export const hasMarks = (marks?: NoteMark[] | null): marks is NoteMark[] =>
  Array.isArray(marks) && marks.length > 0;

/** Marks overlapping the window [start, end), clipped and REBASED to 0 — so a
 *  line renderer can apply whole-note marks to just its slice. */
export function marksIn(marks: NoteMark[], start: number, end: number): NoteMark[] {
  const out: NoteMark[] = [];
  for (const m of marks) {
    const s = Math.max(m.s, start);
    const e = Math.min(m.e, end);
    if (e > s) out.push({ s: s - start, e: e - start, k: m.k });
  }
  return out;
}

export type InlineSeg = { text: string; b?: boolean; i?: boolean; u?: boolean; h?: boolean };

/** Split `text` into the fewest runs where each run's set of active kinds is
 *  constant — the shared segmentation for the display renderer. */
export function toSegments(text: string, marks: NoteMark[]): InlineSeg[] {
  if (!text) return [];
  if (!marks.length) return [{ text }];
  const cuts = new Set<number>([0, text.length]);
  for (const m of marks) {
    if (m.s > 0 && m.s < text.length) cuts.add(m.s);
    if (m.e > 0 && m.e < text.length) cuts.add(m.e);
  }
  const points = [...cuts].sort((a, b) => a - b);
  const segs: InlineSeg[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const s = points[i];
    const e = points[i + 1];
    if (e <= s) continue;
    const seg: InlineSeg = { text: text.slice(s, e) };
    for (const m of marks) {
      if (m.s <= s && m.e >= e) seg[m.k] = true;
    }
    segs.push(seg);
  }
  return segs;
}
