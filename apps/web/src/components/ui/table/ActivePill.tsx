"use client";

import { X as XIcon } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * ActivePill — the active-state chip for a table toolbar (URDS table standard,
 * ported from mindate). Shows one active sort axis or one active filter value and
 * removes just that one on click (the whole pill is the remove target; the ✕ is
 * the affordance). Borderless, sits on the `bg-hover` wash at button height so it
 * lines up with Filter / Sort / Export.
 */
export function ActivePill({
  onRemove,
  children,
  title,
  className,
}: {
  onRemove?: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium",
        "bg-hover text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      {children}
      <XIcon className="size-3 shrink-0" aria-hidden="true" />
    </button>
  );
}
