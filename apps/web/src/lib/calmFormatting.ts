/**
 * Calm Formatting (Roland approved A+B+C, 2026-07-21 — under the
 * clinicians-are-not-coders law: no syntax to learn, ever).
 *
 * A — SELF-CONTINUING LISTS: typing behaviour. A line begun with "- " (or
 *     "1. ") carries on by itself on Enter; Enter on an empty item ends the
 *     list. Plain text in, plain text out.
 * B — the LINE CLASSIFIER for display-time dressing: notes render the way
 *     clinicians already write them — "Plan:" as a semibold label, dashes as
 *     real bullets, an UPPERCASE line as a section header. The stored record
 *     stays plain readable text; every existing note benefits retroactively.
 * (C — Key Findings — stores selected PHRASES in the payload; the renderer
 *     emphasises them. No ranges, no markup in the record.)
 */

/** A: called on Enter in a Scribe text surface. Returns the next value +
 *  caret, or null to let the browser handle Enter normally. */
export function continueListOnEnter(
  value: string,
  caret: number,
): { value: string; caret: number } | null {
  const lineStart = value.lastIndexOf("\n", caret - 1) + 1;
  const line = value.slice(lineStart, caret);

  const bullet = /^(\s*)-\s(.*)$/.exec(line);
  if (bullet) {
    if (bullet[2].trim() === "") {
      // Empty item + Enter = the list is finished — drop the dangling marker.
      const next = value.slice(0, lineStart) + value.slice(caret);
      return { value: next, caret: lineStart };
    }
    const insert = `\n${bullet[1]}- `;
    return {
      value: value.slice(0, caret) + insert + value.slice(caret),
      caret: caret + insert.length,
    };
  }

  const numbered = /^(\s*)(\d{1,3})\.\s(.*)$/.exec(line);
  if (numbered) {
    if (numbered[3].trim() === "") {
      const next = value.slice(0, lineStart) + value.slice(caret);
      return { value: next, caret: lineStart };
    }
    const insert = `\n${numbered[1]}${Number(numbered[2]) + 1}. `;
    return {
      value: value.slice(0, caret) + insert + value.slice(caret),
      caret: caret + insert.length,
    };
  }
  return null;
}

/** B: one classified line of a plain-text note. */
export type SmartLine =
  | { kind: "blank" }
  | { kind: "header"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "numbered"; n: number; text: string }
  | { kind: "label"; label: string; text: string }
  | { kind: "plain"; text: string };

const HEADER_RE = /^[A-Z][A-Z0-9 &/()'-]{2,}$/;
const LABEL_RE = /^([A-Za-z][A-Za-z0-9 ()/&'-]{0,31}):\s+(\S.*)$/;

export function classifyLine(raw: string): SmartLine {
  // Browsers post textarea content with CRLF line endings, and `.` in a JS
  // regex refuses to match \r — the invisible character that made Roland's
  // numbered lines fall through as plain text (2026-07-21). Strip it first;
  // notes already stored with CRLF stay fully readable.
  const line = raw.replace(/\r$/, "");
  if (line.trim() === "") return { kind: "blank" };
  const bullet = /^\s*[-•]\s+(.*)$/.exec(line);
  if (bullet) return { kind: "bullet", text: bullet[1] };
  const numbered = /^\s*(\d{1,3})\.\s+(.*)$/.exec(line);
  if (numbered) return { kind: "numbered", n: Number(numbered[1]), text: numbered[2] };
  const trimmed = line.trim();
  if (HEADER_RE.test(trimmed) && !/[a-z]/.test(trimmed))
    return { kind: "header", text: trimmed };
  const label = LABEL_RE.exec(trimmed);
  if (label) return { kind: "label", label: label[1], text: label[2] };
  return { kind: "plain", text: line };
}

export const classifyNote = (text: string): SmartLine[] =>
  text.split(/\r?\n/).map(classifyLine);

/**
 * B6 — the same classification, plus each line's absolute [start] in the full
 * text and the absolute offset where its rendered `text` begins, so inline
 * formatting marks (sidecar model, offsets over the plain text) map onto the
 * dressed line. New notes are LF; a legacy CRLF line keeps its \r stripped by
 * classifyLine, and offsets over such notes don't matter (they carry no marks).
 */
export type PlacedLine = {
  line: SmartLine;
  /** The \r-stripped raw line (marks over it map 1:1 from `start`). */
  raw: string;
  /** Absolute offset of the raw line in the full text. */
  start: number;
  /** Absolute offset where the rendered `text` begins (marker/number dropped). */
  textStart: number;
};

function relTextStart(raw: string, line: SmartLine): number {
  const stripped = raw.replace(/\r$/, "");
  switch (line.kind) {
    // `text` is a suffix of the stripped line (the marker/number is dropped).
    case "bullet":
    case "numbered":
    case "plain":
      return Math.max(0, stripped.length - line.text.length);
    case "header":
      return stripped.length - stripped.trimStart().length;
    default:
      return 0;
  }
}

export function classifyNotePlaced(text: string): PlacedLine[] {
  let offset = 0;
  const parts = text.split("\n");
  return parts.map((rawWithCr, idx) => {
    const line = classifyLine(rawWithCr);
    const raw = rawWithCr.replace(/\r$/, "");
    const placed: PlacedLine = {
      line,
      raw,
      start: offset,
      textStart: offset + relTextStart(rawWithCr, line),
    };
    // Advance past the raw line incl. its \n (and the \r if it was CRLF).
    offset += rawWithCr.length + (idx < parts.length - 1 ? 1 : 0);
    return placed;
  });
}
