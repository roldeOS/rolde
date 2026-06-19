"use client";

import { cn } from "@/lib/utils";

/**
 * Segmented — RolDe's themed segmented control (Roland 2026-06-18). A soft muted
 * track with the SELECTED segment lifting onto a white card with a gentle shadow
 * (iOS-style) — never the drab grey buttons-with-a-border look. The one toggle a
 * pick-one-of-few choice uses everywhere (access window, view presets, filters).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 rounded-lg bg-muted/60 p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all outline-none",
            "focus-visible:ring-2 focus-visible:ring-foreground/20",
            value === o.value
              ? "bg-accent/25 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
