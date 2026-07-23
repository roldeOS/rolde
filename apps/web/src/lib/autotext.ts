/**
 * Autotext expansion (Scribe T2.5, the Carebit steal) — the writer types
 * ".sn" then a space (or newline) and the shortcut becomes their own saved
 * sentence, inline, caret landing after the expansion. Pure and client-safe;
 * the caller owns state and caret restoration. A dot-word with no matching
 * shortcut is left exactly as typed — never guess, never mangle.
 */
import type { NoteMark } from "@/lib/richText";

export type AutotextEntry = { shortcut: string; expansion: string; marks?: NoteMark[] };

/** Matches "…(start or whitespace/bracket) .shortcut" right before the caret. */
const TRIGGER = /(^|[\s([{])\.([a-z][a-z0-9-]{0,23})$/i;

export function expandAutotext(
  value: string,
  caret: number,
  shortcuts: AutotextEntry[],
): { value: string; caret: number; marks?: NoteMark[] } | null {
  if (!shortcuts.length || caret < 3) return null;
  const typed = value[caret - 1];
  if (typed !== " " && typed !== "\n") return null;
  const before = value.slice(0, caret - 1);
  const m = TRIGGER.exec(before);
  if (!m) return null;
  const hit = shortcuts.find((s) => s.shortcut.toLowerCase() === m[2].toLowerCase());
  if (!hit) return null;
  const start = caret - 1 - (m[2].length + 1); // the "." position
  const next = value.slice(0, start) + hit.expansion + typed + value.slice(caret);
  // Rich Snips — the expansion's marks land at `start` in the new text.
  const marks = (hit.marks ?? [])
    .filter((mk) => mk.e > mk.s)
    .map((mk) => ({ ...mk, s: start + mk.s, e: start + mk.e }));
  return { value: next, caret: start + hit.expansion.length + 1, marks };
}
