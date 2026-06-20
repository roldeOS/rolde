"use client";

import { cn } from "@/lib/utils";
import { PAGE_SIZES, type PageSize } from "@/lib/page-sizes";

/**
 * PageSizeSelector — segmented control 10 | 20 | 50 | 100 | 500 (URDS table
 * standard). Controlled; parent owns the size + persistence. Renders beside
 * "Showing 1–20 of 4,006" in the bottom bar.
 */
export function PageSizeSelector({
  value,
  onChange,
}: {
  value: PageSize;
  onChange: (size: PageSize) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Rows"
      className="inline-flex items-center gap-0.5 rounded-md bg-muted/50 p-0.5"
    >
      {PAGE_SIZES.map((n) => {
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${n} rows per page`}
            onClick={() => onChange(n)}
            className={cn(
              "inline-flex min-w-[2.25rem] items-center justify-center rounded px-2 h-7 text-xs font-medium tabular-nums transition-colors",
              active
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
