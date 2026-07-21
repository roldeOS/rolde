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
export type MarkKind = "b" | "i" | "u" | "s" | "h";
export const MARK_KINDS: MarkKind[] = ["b", "i", "u", "s", "h"];

/** A formatting range: [s, e) in UTF-16 code units over the plain text. `c` is
 *  the highlight COLOUR key (only meaningful for k="h"). */
export type NoteMark = { s: number; e: number; k: MarkKind; c?: string };

/** The highlighter palette — soft Earth & Bloom tints (a marker, never
 *  fluorescent). Honey is the default. Both the editor and the record render
 *  the exact hex, so a highlight looks identical wherever it appears. */
export const HIGHLIGHT_COLOURS: { key: string; label: string; bg: string }[] = [
  { key: "honey", label: "Honey", bg: "#F6E4B0" },
  { key: "sage", label: "Sage", bg: "#D6E4CE" },
  { key: "sky", label: "Sky", bg: "#CFE0EF" },
  { key: "rose", label: "Rose", bg: "#F3D7DB" },
  { key: "plum", label: "Plum", bg: "#E4D3E4" },
];
export const DEFAULT_HIGHLIGHT = "honey";
export const highlightBg = (c?: string): string =>
  HIGHLIGHT_COLOURS.find((h) => h.key === c)?.bg ?? HIGHLIGHT_COLOURS[0].bg;
const isHlColour = (c: unknown): c is string =>
  typeof c === "string" && HIGHLIGHT_COLOURS.some((h) => h.key === c);

const MAX_MARKS = 400; // a hard ceiling — a note can't carry an abusive payload

/** Hostile-proof + tidy: clamp to the text, drop empties, merge touching runs
 *  of the same kind, cap the count. Used at the door (server) and on read. */
export function sanitizeMarks(raw: unknown, textLen: number): NoteMark[] {
  if (!Array.isArray(raw)) return [];
  const clean: NoteMark[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const k = (m as NoteMark).k;
    if (!MARK_KINDS.includes(k)) continue;
    let s = Math.round(Number((m as NoteMark).s));
    let e = Math.round(Number((m as NoteMark).e));
    if (!Number.isFinite(s) || !Number.isFinite(e)) continue;
    s = Math.max(0, Math.min(s, textLen));
    e = Math.max(0, Math.min(e, textLen));
    if (e <= s) continue;
    const c = (m as NoteMark).c;
    clean.push(k === "h" && isHlColour(c) ? { s, e, k, c } : { s, e, k });
    if (clean.length > MAX_MARKS * 2) break;
  }
  return mergeMarks(clean).slice(0, MAX_MARKS);
}

/** Merge overlapping/adjacent ranges of the SAME kind into the fewest runs.
 *  Highlights merge only when the COLOUR also matches (two colours stay two
 *  runs), so a honey run beside a sage run is never fused. */
export function mergeMarks(marks: NoteMark[]): NoteMark[] {
  const out: NoteMark[] = [];
  const groups = new Set(marks.map((m) => (m.k === "h" ? `h:${m.c ?? DEFAULT_HIGHLIGHT}` : m.k)));
  for (const g of groups) {
    const isH = g.startsWith("h:");
    const colour = isH ? g.slice(2) : undefined;
    const same = marks
      .filter((m) => (isH ? m.k === "h" && (m.c ?? DEFAULT_HIGHLIGHT) === colour : m.k === g))
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
    if (e > s) out.push({ s: s - start, e: e - start, k: m.k, ...(m.c ? { c: m.c } : {}) });
  }
  return out;
}

export type InlineSeg = {
  text: string;
  b?: boolean;
  i?: boolean;
  u?: boolean;
  s?: boolean;
  h?: boolean;
  /** highlight colour key, when h is set */
  hc?: string;
};

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
      if (m.s <= s && m.e >= e) {
        if (m.k === "h") {
          seg.h = true;
          seg.hc = m.c ?? DEFAULT_HIGHLIGHT;
        } else {
          seg[m.k] = true;
        }
      }
    }
    segs.push(seg);
  }
  return segs;
}
