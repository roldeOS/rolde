"use client";

import { cn } from "@/lib/utils";

/**
 * Switch — RolDe's shared pill toggle (Roland 2026-06-18). The toggle-first
 * surfaces (Commercial Settings, Integrations, future feature switches) all use
 * this one component so "on/off" reads identically everywhere. Monochrome on
 * state (calm clinical), a soft sliding knob.
 */
export function Switch({
  checked,
  onChange,
  disabled,
  id,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
  /** Accessible name when there's no visible <label htmlFor>. */
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-foreground" : "bg-border",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
