"use client";

import { classifyNotePlaced, type PlacedLine } from "@/lib/calmFormatting";
import { marksIn, hasMarks, type NoteMark } from "@/lib/richText";
import { InlineText } from "./InlineText";
import { cn } from "@/lib/utils";

/**
 * SmartNoteBody (Calm Formatting B + B6 inline formatting, Roland approved
 * 2026-07-21) — free-text notes DRESS THEMSELVES at display time: "Plan:" a
 * semibold label, dashes real bullets, numbers a numbered list, an UPPERCASE
 * line a section header — matching how clinicians already write, costing the
 * writer nothing, upgrading every EXISTING note retroactively.
 *
 * B6 layers the clinician's OWN inline formatting on top: bold · italic ·
 * underline · highlight ride as `marks` (character ranges over the plain
 * text). A line that would auto-dress as a Label/Header but carries explicit
 * marks renders as a marked paragraph instead — explicit formatting wins over
 * inferred. No marks → identical to before.
 */

export function SmartNoteBody({
  text,
  marks,
  struck,
  className,
}: {
  text: string;
  marks?: NoteMark[] | null;
  struck?: boolean;
  className?: string;
}) {
  const placed = classifyNotePlaced(text);
  const ms: NoteMark[] = hasMarks(marks) ? marks : [];

  /** The inline body of a line, marks rebased to the rendered `text`. */
  const inline = (textStart: number, t: string) =>
    ms.length ? <InlineText text={t} marks={marksIn(ms, textStart, textStart + t.length)} /> : t;

  /** Does any mark fall inside this line's raw span? (precedence check) */
  const lineHasMarks = (p: PlacedLine, i: number) => {
    if (!ms.length) return false;
    const end = i < placed.length - 1 ? placed[i + 1].start - 1 : text.length;
    return ms.some((m) => m.s < end && m.e > p.start);
  };

  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: PlacedLine[] } | null = null;
  const flush = (key: number) => {
    if (!list) return;
    const items = list.items;
    blocks.push(
      list.ordered ? (
        <ol key={`l${key}`} className="list-decimal space-y-0.5 pl-5">
          {items.map((it, j) => (
            <li key={j} value={it.line.kind === "numbered" ? it.line.n : undefined}>
              {it.line.kind === "numbered" || it.line.kind === "bullet"
                ? inline(it.textStart, it.line.text)
                : ""}
            </li>
          ))}
        </ol>
      ) : (
        <ul key={`l${key}`} className="list-disc space-y-0.5 pl-5">
          {items.map((it, j) => (
            <li key={j}>{it.line.kind === "bullet" ? inline(it.textStart, it.line.text) : ""}</li>
          ))}
        </ul>
      ),
    );
    list = null;
  };

  placed.forEach((p, i) => {
    const line = p.line;
    if (line.kind === "bullet" || line.kind === "numbered") {
      const ordered = line.kind === "numbered";
      if (!list || list.ordered !== ordered) {
        flush(i);
        list = { ordered, items: [] };
      }
      list.items.push(p);
      return;
    }
    flush(i);
    // Explicit inline formatting overrides inferred Label/Header dressing for
    // that line — so a highlighted "Plan:" reads as the clinician marked it,
    // never mangled by the auto-label split.
    const marked = lineHasMarks(p, i);
    switch (line.kind) {
      case "blank":
        blocks.push(<div key={i} className="h-2" />);
        break;
      case "header":
        blocks.push(
          marked ? (
            <p key={i}>{inline(p.start, p.raw)}</p>
          ) : (
            <p key={i} className="pt-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {line.text}
            </p>
          ),
        );
        break;
      case "label":
        blocks.push(
          marked ? (
            // The whole raw line, marks mapped 1:1 — explicit wins over the
            // auto-label split.
            <p key={i}>{inline(p.start, p.raw)}</p>
          ) : (
            <p key={i}>
              <span className="font-semibold">{line.label}: </span>
              {line.text}
            </p>
          ),
        );
        break;
      case "plain":
        blocks.push(<p key={i}>{inline(p.start, p.raw)}</p>);
        break;
    }
  });
  flush(placed.length);

  return (
    <div
      className={cn(
        "mt-2 space-y-0.5 text-sm",
        struck && "text-muted-foreground line-through",
        className,
      )}
    >
      {blocks}
    </div>
  );
}
