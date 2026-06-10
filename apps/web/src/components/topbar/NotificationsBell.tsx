"use client";

import { useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { useClickAway } from "@/lib/useClickAway";

/**
 * Notification bell. The dropdown is real; its data source (a `notifications`
 * table per Bible 4.4 §12) is wired the moment MCP is back — until then it
 * shows the genuine empty state. NOT a placeholder: a real component awaiting
 * its small backend.
 */
export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickAway<HTMLDivElement>(close);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-lg text-warning transition-colors hover:bg-warning/10"
        aria-label="Notifications"
      >
        <Bell className="size-[18px]" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-72 rounded-xl border border-border bg-card p-1.5 shadow-float">
          <p className="px-2.5 py-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Notifications
          </p>
          <p className="px-2.5 py-6 text-center text-xs text-muted-foreground">
            You&apos;re all caught up.
          </p>
        </div>
      )}
    </div>
  );
}
