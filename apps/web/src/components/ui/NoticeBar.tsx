"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * NoticeBar — RolDe's NON-BLOCKING MODAL (Roland 2026-06-23). A slim, dismissible bar
 * pinned to the bottom edge of a surface: non-blocking (the content behind stays fully
 * usable) yet unmissable (full-width), and it doesn't push the top content down. The
 * light tier — for "for-your-awareness" prompts — opposite the Blocking Modal (the
 * frosted break-glass gate, `BreakGlassGate`). See memory: blocking-vs-nonblocking-modal.
 */
const TONE: Record<"info" | "warning" | "neutral", { wrap: string; icon: string }> = {
  info: { wrap: "border-info/20 bg-info/[0.07]", icon: "bg-info/12 text-info" },
  warning: { wrap: "border-warning/25 bg-warning/[0.08]", icon: "bg-warning/12 text-warning" },
  neutral: { wrap: "border-border bg-card", icon: "bg-muted text-muted-foreground" },
};

export function NoticeBar({
  icon,
  tone = "warning",
  children,
  action,
  onDismiss,
}: {
  /** A RENDERED icon element (e.g. `<Info className="size-3.5" />`) — not a component
   *  reference, so Server Components can pass it across the client boundary. */
  icon?: ReactNode;
  tone?: "info" | "warning" | "neutral";
  children: ReactNode;
  /** Optional inline action (a button/link); the user can act or simply dismiss. */
  action?: ReactNode;
  onDismiss?: () => void;
}) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  const t = TONE[tone];
  return (
    <div className={cn("flex shrink-0 items-center gap-3 border-t px-4 py-2.5 sm:px-6", t.wrap)}>
      {icon && (
        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-md", t.icon)}>
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1 text-sm text-foreground">{children}</div>
      {action}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          setOpen(false);
          onDismiss?.();
        }}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
