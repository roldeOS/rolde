"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * NumberedPagination — Previous | 1 | 2 | [3] | … | Next (URDS table standard,
 * ported from mindate). Sliding window: always first + last + current ±1, with
 * ellipses for gaps; prev/next disable at the edges. Client-state pager —
 * `onNavigate(page)` drives it (RolDe tables page in memory).
 */
export function NumberedPagination({
  current,
  total,
  onNavigate,
  alwaysShow = false,
  siblings = 1,
  className,
}: {
  current: number;
  total: number;
  onNavigate: (page: number) => void;
  alwaysShow?: boolean;
  siblings?: number;
  className?: string;
}) {
  if (total <= 1 && !alwaysShow) return null;
  const pages = buildPageList(current, total, siblings);

  return (
    <nav className={cn("inline-flex items-center gap-1", className)} aria-label="Pagination">
      <PagerButton onClick={current > 1 ? () => onNavigate(current - 1) : undefined} ariaLabel="Previous page">
        <ChevronLeft className="size-3.5" />
        <span>Previous</span>
      </PagerButton>

      {pages.map((entry, idx) => {
        if (entry === "ellipsis") {
          return (
            <span
              key={`gap-${idx}`}
              aria-hidden="true"
              className="inline-flex size-8 items-center justify-center text-muted-foreground"
            >
              <MoreHorizontal className="size-3.5" />
            </span>
          );
        }
        const isCurrent = entry === current;
        return (
          <PagerButton
            key={entry}
            onClick={isCurrent ? undefined : () => onNavigate(entry)}
            ariaLabel={`Page ${entry}`}
            ariaCurrent={isCurrent}
            isCurrent={isCurrent}
          >
            <span className="tabular-nums">{entry}</span>
          </PagerButton>
        );
      })}

      <PagerButton onClick={current < total ? () => onNavigate(current + 1) : undefined} ariaLabel="Next page">
        <span>Next</span>
        <ChevronRight className="size-3.5" />
      </PagerButton>
    </nav>
  );
}

function PagerButton({
  onClick,
  children,
  ariaLabel,
  ariaCurrent,
  isCurrent,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  ariaCurrent?: boolean;
  isCurrent?: boolean;
}) {
  const cls = cn(
    "inline-flex min-w-[2rem] items-center justify-center gap-1 rounded-md px-2 h-8 text-xs font-medium transition-colors",
    isCurrent
      ? "bg-foreground text-background"
      : onClick
        ? "text-foreground hover:bg-hover"
        : "cursor-not-allowed text-muted-foreground/40",
  );
  if (onClick && !isCurrent) {
    return (
      <button type="button" onClick={onClick} aria-label={ariaLabel} className={cls}>
        {children}
      </button>
    );
  }
  return (
    <span aria-label={ariaLabel} aria-current={ariaCurrent ? "page" : undefined} aria-disabled={!isCurrent} className={cls}>
      {children}
    </span>
  );
}

/** Which page numbers + ellipses to render (siblings=1):
 *   total=10, current=5 → [1, …, 4, 5, 6, …, 10] */
function buildPageList(current: number, total: number, siblings: number): Array<number | "ellipsis"> {
  const totalSlots = siblings * 2 + 5;
  if (total <= totalSlots) return Array.from({ length: total }, (_, i) => i + 1);

  const leftSibling = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, total);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  const pages: Array<number | "ellipsis"> = [1];
  if (showLeftDots) pages.push("ellipsis");
  for (let p = Math.max(leftSibling, 2); p <= Math.min(rightSibling, total - 1); p++) pages.push(p);
  if (showRightDots) pages.push("ellipsis");
  if (total > 1) pages.push(total);
  return pages;
}
