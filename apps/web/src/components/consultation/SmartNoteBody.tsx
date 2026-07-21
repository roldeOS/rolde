"use client";

import { Fragment } from "react";
import { classifyNote, type SmartLine } from "@/lib/calmFormatting";
import { cn } from "@/lib/utils";

/**
 * SmartNoteBody (Calm Formatting B+C, Roland approved 2026-07-21) — free-text
 * notes DRESS THEMSELVES at display time: "Plan:" renders as a semibold
 * label, dashed lines as real bullets, numbered lines as a numbered list, an
 * UPPERCASE line as a section header — matching how clinicians already
 * write, costing the writer nothing, and upgrading every EXISTING note
 * retroactively (the stored record stays plain readable text). Key Findings
 * (C) are phrases the author marked — emphasised with a soft amber wash.
 */
function withHighlights(text: string, highlights: string[]): React.ReactNode {
  if (!highlights.length || !text) return text;
  const escaped = highlights
    .filter((h) => h.trim())
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return text;
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(re);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    re.test(part) ? (
      <span key={i} className="rounded bg-warning/20 px-0.5 font-semibold text-foreground">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function SmartNoteBody({
  text,
  struck,
  highlights = [],
  className,
}: {
  text: string;
  struck?: boolean;
  /** Key Findings — exact phrases the author marked (payload.key_findings). */
  highlights?: string[];
  className?: string;
}) {
  const lines = classifyNote(text);

  // Group consecutive list items into real lists.
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: SmartLine[] } | null = null;
  const flush = (key: number) => {
    if (!list) return;
    const items = list.items;
    blocks.push(
      list.ordered ? (
        <ol key={`l${key}`} className="list-decimal space-y-0.5 pl-5">
          {items.map((it, j) => (
            <li key={j} value={it.kind === "numbered" ? it.n : undefined}>
              {withHighlights(it.kind === "numbered" || it.kind === "bullet" ? it.text : "", highlights)}
            </li>
          ))}
        </ol>
      ) : (
        <ul key={`l${key}`} className="list-disc space-y-0.5 pl-5">
          {items.map((it, j) => (
            <li key={j}>{withHighlights(it.kind === "bullet" ? it.text : "", highlights)}</li>
          ))}
        </ul>
      ),
    );
    list = null;
  };

  lines.forEach((line, i) => {
    if (line.kind === "bullet" || line.kind === "numbered") {
      const ordered = line.kind === "numbered";
      if (!list || list.ordered !== ordered) {
        flush(i);
        list = { ordered, items: [] };
      }
      list.items.push(line);
      return;
    }
    flush(i);
    switch (line.kind) {
      case "blank":
        blocks.push(<div key={i} className="h-2" />);
        break;
      case "header":
        blocks.push(
          <p key={i} className="pt-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {line.text}
          </p>,
        );
        break;
      case "label":
        blocks.push(
          <p key={i}>
            <span className="font-semibold">{line.label}: </span>
            {withHighlights(line.text, highlights)}
          </p>,
        );
        break;
      case "plain":
        blocks.push(<p key={i}>{withHighlights(line.text, highlights)}</p>,);
        break;
    }
  });
  flush(lines.length);

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
