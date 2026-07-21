"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Highlighter } from "lucide-react";
import {
  mergeMarks,
  toSegments,
  highlightBg,
  DEFAULT_HIGHLIGHT,
  type MarkKind,
  type NoteMark,
} from "@/lib/richText";

export type LineOp = "bullet" | "number" | "indent" | "outdent";
import { cn } from "@/lib/utils";

/**
 * RichNoteEditor (B6, Roland 2026-07-21 "elegant and beautiful in our own
 * design lingo") — a CONSTRAINED WYSIWYG for free notes: bold · italic ·
 * underline · highlight, offered as a selection bubble AND a slim toolbar,
 * with ⌘B/⌘I/⌘U. No syntax ever shows (clinicians-are-not-coders).
 *
 * It is UNCONTROLLED: the browser owns the caret, React never re-writes the
 * DOM on a keystroke (so the caret never jumps). On every change it serialises
 * the DOM to (plain text, sidecar marks) and reports up; discrete actions
 * (format toggle, list-continue, snippet, autotext) rebuild the DOM from the
 * model and restore the selection. Line structure (bullets, "Plan:", etc.)
 * stays plain text and is dressed by Calm Formatting B at display time — so
 * this editor only ever deals with INLINE marks.
 */

export type RichNoteHandle = {
  insertText: (s: string) => void;
  focus: () => void;
  isActive: () => boolean;
  /** Toggle bold/italic/underline/strikethrough on the selection. */
  format: (k: MarkKind) => void;
  /** Set (or toggle off) a highlight colour on the selection. */
  highlight: (colour: string) => void;
  /** Strip all formatting from the selection. */
  clearFormat: () => void;
  /** Bullet/number/indent/outdent the selected lines. */
  lineOp: (op: LineOp) => void;
};

const TAG_KIND: Record<string, MarkKind> = {
  STRONG: "b",
  B: "b",
  EM: "i",
  I: "i",
  U: "u",
  S: "s",
  STRIKE: "s",
  DEL: "s",
  MARK: "h",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** (text, marks) → the editor's inner HTML. Line breaks are real <br>s and a
 *  trailing FILLER <br> always closes the content, so the last line (even an
 *  empty one) is always reachable by the caret — the classic contentEditable
 *  trailing-newline trap, solved. fromDom strips exactly that one filler. */
function toHtml(text: string, marks: NoteMark[]): string {
  let html = "";
  for (const seg of toSegments(text, marks)) {
    const parts = seg.text.split("\n");
    parts.forEach((part, i) => {
      if (i > 0) html += "<br>";
      if (!part) return;
      let h = escapeHtml(part);
      if (seg.h)
        h = `<mark data-c="${seg.hc ?? DEFAULT_HIGHLIGHT}" style="background-color:${highlightBg(seg.hc)}">${h}</mark>`;
      if (seg.s) h = `<s>${h}</s>`;
      if (seg.u) h = `<u>${h}</u>`;
      if (seg.i) h = `<em>${h}</em>`;
      if (seg.b) h = `<strong>${h}</strong>`;
      html += h;
    });
  }
  return html + "<br>"; // trailing filler
}

/** Raw walk: text length + each <br> as one "\n". No filler stripping. The
 *  nearest <mark>'s data-c colour rides along so highlights keep their colour. */
function rawFromDom(root: Node): { text: string; marks: NoteMark[] } {
  let text = "";
  const marks: NoteMark[] = [];
  const walk = (node: Node, active: MarkKind[], hColour: string) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const t = child.textContent ?? "";
        if (!t) return;
        const start = text.length;
        text += t;
        for (const k of active)
          marks.push(k === "h" ? { s: start, e: text.length, k, c: hColour } : { s: start, e: text.length, k });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (el.tagName === "BR") {
          text += "\n";
          return;
        }
        const kind = TAG_KIND[el.tagName];
        const nextColour = el.tagName === "MARK" ? el.getAttribute("data-c") || DEFAULT_HIGHLIGHT : hColour;
        walk(el, kind ? [...active, kind] : active, nextColour);
      }
    });
  };
  walk(root, [], DEFAULT_HIGHLIGHT);
  return { text, marks };
}

/** DOM → (text, marks), stripping the one trailing filler newline. */
function fromDom(root: HTMLElement): { text: string; marks: NoteMark[] } {
  const raw = rawFromDom(root);
  let text = raw.text;
  if (text.endsWith("\n")) text = text.slice(0, -1);
  // Clamp marks to the (possibly shortened) text and merge (colour preserved).
  const marks = raw.marks
    .map((m) => ({
      s: Math.min(m.s, text.length),
      e: Math.min(m.e, text.length),
      k: m.k,
      ...(m.c ? { c: m.c } : {}),
    }))
    .filter((m) => m.e > m.s);
  return { text, marks: mergeMarks(marks) };
}

/** A DOM (node, offset) → plain-text offset, measured with the SAME counting as
 *  fromDom by cloning the prefix range (delegates traversal to the browser). */
function domToOffset(root: HTMLElement, node: Node, nodeOffset: number): number {
  const range = document.createRange();
  range.setStart(root, 0);
  try {
    range.setEnd(node, nodeOffset);
  } catch {
    return fromDom(root).text.length;
  }
  const holder = document.createElement("div");
  holder.appendChild(range.cloneContents());
  const len = rawFromDom(holder).text.length;
  return Math.min(len, fromDom(root).text.length);
}

/** Plain-text offset → a DOM (node, offset), for restoring the selection. */
function offsetToDom(root: HTMLElement, target: number): { node: Node; offset: number } {
  const leaves: { type: "t" | "br"; node: Node }[] = [];
  const collect = (n: Node) => {
    n.childNodes.forEach((c) => {
      if (c.nodeType === Node.TEXT_NODE) leaves.push({ type: "t", node: c });
      else if ((c as HTMLElement).tagName === "BR") leaves.push({ type: "br", node: c });
      else collect(c);
    });
  };
  collect(root);
  let remaining = target;
  for (const leaf of leaves) {
    if (leaf.type === "t") {
      const len = (leaf.node.textContent ?? "").length;
      if (remaining <= len) return { node: leaf.node, offset: remaining };
      remaining -= len;
    } else {
      const parent = leaf.node.parentNode as Node;
      const idx = Array.prototype.indexOf.call(parent.childNodes, leaf.node);
      if (remaining === 0) return { node: parent, offset: idx };
      remaining -= 1;
      if (remaining === 0) return { node: parent, offset: idx + 1 };
    }
  }
  return { node: root, offset: root.childNodes.length };
}

function getSelectionOffsets(root: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!root.contains(r.startContainer) || !root.contains(r.endContainer)) return null;
  const start = domToOffset(root, r.startContainer, r.startOffset);
  const end = domToOffset(root, r.endContainer, r.endOffset);
  return start <= end ? { start, end } : { start: end, end: start };
}

function restoreSelection(root: HTMLElement, start: number, end: number) {
  const a = offsetToDom(root, start);
  const b = offsetToDom(root, end);
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.setStart(a.node, a.offset);
  range.setEnd(b.node, b.offset);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Is [start,end) already fully covered by kind k? (→ toggle removes it). */
function fullyCovered(marks: NoteMark[], start: number, end: number, k: MarkKind): boolean {
  if (end <= start) return false;
  let pos = start;
  const runs = marks
    .filter((m) => m.k === k && m.e > start && m.s < end)
    .sort((a, b) => a.s - b.s);
  for (const m of runs) {
    if (m.s > pos) return false;
    pos = Math.max(pos, m.e);
    if (pos >= end) return true;
  }
  return pos >= end;
}

function toggleMark(marks: NoteMark[], start: number, end: number, k: MarkKind): NoteMark[] {
  if (end <= start) return marks;
  const others = marks.filter((m) => m.k !== k);
  const same = marks.filter((m) => m.k === k);
  if (fullyCovered(marks, start, end, k)) {
    const kept: NoteMark[] = [];
    for (const m of same) {
      if (m.e <= start || m.s >= end) kept.push(m);
      else {
        if (m.s < start) kept.push({ s: m.s, e: start, k });
        if (m.e > end) kept.push({ s: end, e: m.e, k });
      }
    }
    return mergeMarks([...others, ...kept]);
  }
  return mergeMarks([...others, ...same, { s: start, e: end, k }]);
}

/** Shift marks for a text splice [start, oldEnd) → newLen chars (colour kept). */
function spliceMarks(marks: NoteMark[], start: number, oldEnd: number, newLen: number): NoteMark[] {
  const delta = newLen - (oldEnd - start);
  const out: NoteMark[] = [];
  for (const m of marks) {
    const c = m.c ? { c: m.c } : {};
    if (m.e <= start) out.push(m);
    else if (m.s >= oldEnd) out.push({ s: m.s + delta, e: m.e + delta, k: m.k, ...c });
    else {
      // Overlaps the edit — keep the part before the splice (edits happen in
      // unformatted regions in practice; this never grows a mark over new text).
      const s = Math.min(m.s, start);
      const e = m.e > oldEnd ? m.e + delta : start;
      if (e > s) out.push({ s, e, k: m.k, ...c });
    }
  }
  return mergeMarks(out);
}

/** Is [start,end) fully covered by highlight of THIS colour? */
function fullyCoveredHighlight(marks: NoteMark[], start: number, end: number, colour: string): boolean {
  if (end <= start) return false;
  let pos = start;
  const runs = marks
    .filter((m) => m.k === "h" && (m.c ?? DEFAULT_HIGHLIGHT) === colour && m.e > start && m.s < end)
    .sort((a, b) => a.s - b.s);
  for (const m of runs) {
    if (m.s > pos) return false;
    pos = Math.max(pos, m.e);
    if (pos >= end) return true;
  }
  return pos >= end;
}

/** Set (or toggle off) a highlight COLOUR over [start,end): removes any other
 *  highlight in the range first, so a range never carries two colours. */
function setHighlight(marks: NoteMark[], start: number, end: number, colour: string): NoteMark[] {
  if (end <= start) return marks;
  const others = marks.filter((m) => m.k !== "h");
  const hs = marks.filter((m) => m.k === "h");
  const covered = fullyCoveredHighlight(hs, start, end, colour);
  const kept: NoteMark[] = [];
  for (const m of hs) {
    const c = m.c ?? DEFAULT_HIGHLIGHT;
    if (m.e <= start || m.s >= end) kept.push(m);
    else {
      if (m.s < start) kept.push({ s: m.s, e: start, k: "h", c });
      if (m.e > end) kept.push({ s: end, e: m.e, k: "h", c });
    }
  }
  if (!covered) kept.push({ s: start, e: end, k: "h", c: colour });
  return mergeMarks([...others, ...kept]);
}

/** Remove every mark overlapping [start,end) (clear formatting). */
function clearMarks(marks: NoteMark[], start: number, end: number): NoteMark[] {
  if (end <= start) return marks;
  const out: NoteMark[] = [];
  for (const m of marks) {
    if (m.e <= start || m.s >= end) out.push(m);
    else {
      const c = m.c ? { c: m.c } : {};
      if (m.s < start) out.push({ s: m.s, e: start, k: m.k, ...c });
      if (m.e > end) out.push({ s: end, e: m.e, k: m.k, ...c });
    }
  }
  return mergeMarks(out);
}

/** Bullet/number/indent/outdent the lines overlapping [selStart,selEnd].
 *  Returns the new text + the shifted marks + the new selection. Operates on
 *  the PLAIN text (line prefixes) — bullets/numbers render as real lists via
 *  Calm Formatting B; indent is two leading spaces. */
function applyLineOp(
  text: string,
  marks: NoteMark[],
  selStart: number,
  selEnd: number,
  op: LineOp,
): { text: string; marks: NoteMark[]; selStart: number; selEnd: number } {
  // Line spans of the whole note.
  const lines: { start: number; end: number; text: string }[] = [];
  let pos = 0;
  for (const part of text.split("\n")) {
    lines.push({ start: pos, end: pos + part.length, text: part });
    pos += part.length + 1;
  }
  const touched = lines.filter((l) => l.start <= selEnd && l.end >= selStart);
  if (touched.length === 0) return { text, marks, selStart, selEnd };

  let outText = text;
  let outMarks = marks;
  let dSel = 0; // net shift applied at/before selStart
  let dSelEnd = 0;
  // Edit from LAST line to FIRST so earlier offsets stay valid as we splice.
  for (let idx = touched.length - 1; idx >= 0; idx--) {
    const l = touched[idx];
    const num = idx + 1; // 1-based for numbered lists
    const cur = l.text;
    let removeLen = 0;
    let insert = "";
    if (op === "bullet") {
      const m = /^(\s*)([-•]\s|(\d{1,3})\.\s)?/.exec(cur);
      removeLen = m?.[2] ? m[2].length : 0; // strip an existing marker
      const already = /^\s*[-•]\s/.test(cur);
      insert = already ? "" : "- ";
      // toggle off if every line was already a bullet
    } else if (op === "number") {
      const m = /^(\s*)([-•]\s|(\d{1,3})\.\s)?/.exec(cur);
      removeLen = m?.[2] ? m[2].length : 0;
      const already = /^\s*\d{1,3}\.\s/.test(cur);
      insert = already ? "" : `${num}. `;
    } else if (op === "indent") {
      insert = "  ";
    } else {
      // outdent: remove up to 2 leading spaces (or a bullet/number marker)
      const sp = /^(\s{1,2})/.exec(cur);
      removeLen = sp ? sp[1].length : 0;
    }
    const at = l.start;
    // splice: replace [at, at+removeLen) with insert
    outText = outText.slice(0, at) + insert + outText.slice(at + removeLen);
    outMarks = spliceMarks(outMarks, at, at + removeLen, insert.length);
    const delta = insert.length - removeLen;
    if (at < selStart) dSel += delta;
    if (at < selEnd) dSelEnd += delta;
  }
  return {
    text: outText,
    marks: outMarks,
    selStart: Math.max(0, selStart + dSel),
    selEnd: Math.max(0, selEnd + dSelEnd),
  };
}

/** Longest-common-prefix/suffix diff → the single changed span. */
function diffSplice(a: string, b: string): { start: number; oldEnd: number; newLen: number } {
  let start = 0;
  const min = Math.min(a.length, b.length);
  while (start < min && a[start] === b[start]) start++;
  let ae = a.length;
  let be = b.length;
  while (ae > start && be > start && a[ae - 1] === b[be - 1]) {
    ae--;
    be--;
  }
  return { start, oldEnd: ae, newLen: be - start };
}

const BUBBLE: { k: MarkKind; label: string; sc: string }[] = [
  { k: "b", label: "Bold", sc: "⌘B" },
  { k: "i", label: "Italic", sc: "⌘I" },
  { k: "u", label: "Underline", sc: "⌘U" },
  { k: "h", label: "Highlight", sc: "⌘⇧H" },
];

/** The button face — crisp typographic letters in the app's own font (Inter)
 *  for B/I/U/S (Roland 2026-07-21: the chunky icon glyphs "looked like Comic
 *  Sans"), a marker icon for Highlight (the word-processor convention). */
export function MarkGlyph({ k }: { k: MarkKind }) {
  if (k === "b") return <span className="text-[15px] leading-none font-bold">B</span>;
  if (k === "i") return <span className="text-[15px] leading-none italic">I</span>;
  if (k === "u") return <span className="text-[15px] leading-none underline underline-offset-[3px]">U</span>;
  if (k === "s") return <span className="text-[15px] leading-none line-through">S</span>;
  return <Highlighter className="size-4" />;
}

export const RichNoteEditor = forwardRef<
  RichNoteHandle,
  {
    initialText: string;
    initialMarks?: NoteMark[];
    /** Reset the DOM when this changes (new note / mode / template switch). */
    docKey: string;
    placeholder?: string;
    onChange: (text: string, marks: NoteMark[]) => void;
    /** Autotext: given the plain text + caret, the expansion (or null). */
    expand?: (text: string, caret: number) => { value: string; caret: number } | null;
    /** Enter-to-continue-lists: given text + caret, the next value (or null). */
    continueList?: (text: string, caret: number) => { value: string; caret: number } | null;
    onFocusCapture?: () => void;
    /** Suppress the floating bubble (e.g. while the header Format panel is open). */
    bubbleHidden?: boolean;
    className?: string;
  }
>(function RichNoteEditor(
  { initialText, initialMarks, docKey, placeholder, onChange, expand, continueList, onFocusCapture, bubbleHidden, className },
  ref,
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(!initialText);
  // Bubble coords are VIEWPORT (client) coords — it renders in a body portal so
  // the card edge can never clip it (Roland 2026-07-21: "B gets cut off").
  const [bubble, setBubble] = useState<{ cx: number; top: number; active: Set<MarkKind> } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const activeRef = useRef(false);

  // Render the DOM from a model + report up + optionally place the caret.
  const render = useCallback(
    (text: string, marks: NoteMark[], caret?: number) => {
      const el = editorRef.current;
      if (!el) return;
      el.innerHTML = toHtml(text, marks);
      if (caret != null) restoreSelection(el, caret, caret);
      setEmpty(!text);
      onChange(text, marks);
    },
    [onChange],
  );

  // Initial paint + reset on docKey. UNCONTROLLED thereafter (so the caret is
  // the browser's, never re-written on a keystroke).
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = toHtml(initialText, initialMarks ?? []);
    setEmpty(!initialText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey]);

  const refreshBubble = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const sel = window.getSelection();
    const off = getSelectionOffsets(el);
    if (!sel || sel.isCollapsed || !off || off.start === off.end) {
      setBubble(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const { marks } = fromDom(el);
    const active = new Set<MarkKind>();
    for (const b of BUBBLE) if (fullyCovered(marks, off.start, off.end, b.k)) active.add(b.k);
    // Clamp the centre so the ~150px bubble stays fully on-screen (never clipped).
    const HALF = 80;
    const cx = Math.max(HALF + 4, Math.min(rect.left + rect.width / 2, window.innerWidth - HALF - 4));
    setBubble({ cx, top: rect.top, active });
  }, []);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const { text, marks } = fromDom(el);
    // Autotext runs on the collapsed caret; a hit rebuilds + restores.
    if (expand) {
      const off = getSelectionOffsets(el);
      if (off && off.start === off.end) {
        const hit = expand(text, off.start);
        if (hit) {
          const d = diffSplice(text, hit.value);
          const shifted = spliceMarks(marks, d.start, d.oldEnd, d.newLen);
          render(hit.value, shifted, hit.caret);
          return;
        }
      }
    }
    setEmpty(!text);
    onChange(text, marks);
  }, [expand, onChange, render]);

  const applyKind = useCallback(
    (k: MarkKind) => {
      const el = editorRef.current;
      if (!el) return;
      const off = getSelectionOffsets(el);
      if (!off || off.start === off.end) return; // nothing selected
      const { text, marks } = fromDom(el);
      const next = toggleMark(marks, off.start, off.end, k);
      render(text, next);
      restoreSelection(el, off.start, off.end);
      refreshBubble();
    },
    [render, refreshBubble],
  );

  const applyHighlight = useCallback(
    (colour: string) => {
      const el = editorRef.current;
      if (!el) return;
      const off = getSelectionOffsets(el);
      if (!off || off.start === off.end) return;
      const { text, marks } = fromDom(el);
      render(text, setHighlight(marks, off.start, off.end, colour));
      restoreSelection(el, off.start, off.end);
      refreshBubble();
    },
    [render, refreshBubble],
  );

  const clearFormat = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const off = getSelectionOffsets(el);
    if (!off || off.start === off.end) return;
    const { text, marks } = fromDom(el);
    render(text, clearMarks(marks, off.start, off.end));
    restoreSelection(el, off.start, off.end);
    refreshBubble();
  }, [render, refreshBubble]);

  const doLineOp = useCallback(
    (op: LineOp) => {
      const el = editorRef.current;
      if (!el) return;
      const { text, marks } = fromDom(el);
      const off = getSelectionOffsets(el) ?? { start: text.length, end: text.length };
      const r = applyLineOp(text, marks, off.start, off.end, op);
      render(r.text, r.marks);
      restoreSelection(el, r.selStart, r.selEnd);
    },
    [render],
  );

  const insertPlain = useCallback(
    (s: string) => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      const end = fromDom(el).text.length;
      const off = getSelectionOffsets(el) ?? { start: end, end };
      const { text, marks } = fromDom(el);
      const value = text.slice(0, off.start) + s + text.slice(off.end);
      const shifted = spliceMarks(marks, off.start, off.end, s.length);
      render(value, shifted, off.start + s.length);
    },
    [render],
  );

  useImperativeHandle(ref, () => ({
    insertText: insertPlain,
    focus: () => editorRef.current?.focus(),
    isActive: () => activeRef.current,
    format: applyKind,
    highlight: applyHighlight,
    clearFormat,
    lineOp: doLineOp,
  }));

  useEffect(() => {
    const onSel = () => {
      if (activeRef.current) refreshBubble();
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, [refreshBubble]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const el = editorRef.current;
      if (!el) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && (e.key === "b" || e.key === "i" || e.key === "u")) {
        e.preventDefault();
        applyKind(e.key === "b" ? "b" : e.key === "i" ? "i" : "u");
        return;
      }
      if (mod && e.shiftKey && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        applyHighlight(DEFAULT_HIGHLIGHT);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        const off = getSelectionOffsets(el);
        const { text, marks } = fromDom(el);
        if (off && off.start === off.end && continueList) {
          const hit = continueList(text, off.start);
          if (hit) {
            e.preventDefault();
            const d = diffSplice(text, hit.value);
            render(hit.value, spliceMarks(marks, d.start, d.oldEnd, d.newLen), hit.caret);
            return;
          }
        }
        // Plain Enter → a literal "\n" (pre-wrap), no browser <div> soup.
        if (off) {
          e.preventDefault();
          const value = text.slice(0, off.start) + "\n" + text.slice(off.end);
          render(value, spliceMarks(marks, off.start, off.end, 1), off.start + 1);
        }
      }
    },
    [applyKind, applyHighlight, continueList, render],
  );

  // Paste as PLAIN text only (no foreign formatting into the record).
  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const s = e.clipboardData.getData("text/plain");
      if (s) insertPlain(s);
    },
    [insertPlain],
  );

  return (
    // The whole editor is the writing surface now — the formatting lives in the
    // Scribe header's Format panel (Roland 2026-07-21); the quick bubble stays.
    // The text SCROLLS in its own box so long notes never slide under the
    // Save/Discard footer (the caret stays reachable in a short card).
    <div className={cn("relative min-h-0 flex-1 overflow-y-auto pb-1", className)}>
      {empty && (
        <p className="pointer-events-none absolute left-0 top-0 text-sm text-muted-foreground">
          {placeholder}
        </p>
      )}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Note"
        spellCheck
        onInput={handleInput}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onFocus={() => {
          activeRef.current = true;
          onFocusCapture?.();
        }}
        onBlur={() => {
          activeRef.current = false;
          // Let a bubble click land before it vanishes.
          setTimeout(() => setBubble(null), 150);
        }}
        className="min-h-full w-full text-sm whitespace-pre-wrap outline-none"
      />

      {/* The selection bubble — PORTALED to <body>, viewport-fixed + clamped, so
          the card edge can never clip it (Roland 2026-07-21). Quick B/I/U +
          highlight (default colour); the full palette is the header panel. */}
      {mounted &&
        bubble &&
        !bubbleHidden &&
        createPortal(
          <div
            className="fixed z-[80] flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-lg border border-border/50 bg-card p-0.5 shadow-overlay"
            style={{ left: bubble.cx, top: bubble.top - 8 }}
          >
            {BUBBLE.map((b) => (
              <button
                key={b.k}
                type="button"
                title={`${b.label} · ${b.sc}`}
                aria-label={b.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => (b.k === "h" ? applyHighlight(DEFAULT_HIGHLIGHT) : applyKind(b.k))}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors",
                  bubble.active.has(b.k)
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-hover hover:text-foreground",
                )}
              >
                <MarkGlyph k={b.k} />
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
});
