"use client";

import { classifyNote, type SmartLine } from "@/lib/calmFormatting";
import { cn } from "@/lib/utils";

/**
 * SmartNoteBody (Calm Formatting B+C, Roland approved 2026-07-21) — free-text
 * notes DRESS THEMSELVES at display time: "Plan:" renders as a semibold
 * label, dashed lines as real bullets, numbered lines as a numbered list, an
 * UPPERCASE line as a section header — matching how clinicians already
 * write, costing the writer nothing, and upgrading every EXISTING note
 * retroactively (the stored record stays plain readable text).
 */

export function SmartNoteBody({
  text,
  struck,
  className,
}: {
  text: string;
  struck?: boolean;
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
              {it.kind === "numbered" || it.kind === "bullet" ? it.text : ""}
            </li>
          ))}
        </ol>
      ) : (
        <ul key={`l${key}`} className="list-disc space-y-0.5 pl-5">
          {items.map((it, j) => (
            <li key={j}>{it.kind === "bullet" ? it.text : ""}</li>
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
            {line.text}
          </p>,
        );
        break;
      case "plain":
        blocks.push(<p key={i}>{line.text}</p>);
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
