"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { PopoverHeader } from "@/components/ui/PopoverHeader";
import { getRecents, type Recent } from "@/lib/recents";
import { useClickAway } from "@/lib/useClickAway";

/** Recently-viewed patients (per browser). Fully functional. */
export function Recents() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Recent[]>([]);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickAway<HTMLDivElement>(close);

  useEffect(() => {
    const refresh = () => setItems(getRecents());
    refresh();
    window.addEventListener("rolde:recents", refresh);
    return () => window.removeEventListener("rolde:recents", refresh);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-lg bg-card text-info shadow-sm ring-1 ring-border/50 transition-shadow hover:shadow-md"
        aria-label="Recent patients"
      >
        <Clock className="size-[18px]" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-64 overflow-hidden rounded-xl bg-card shadow-overlay">
          <PopoverHeader
            icon={Clock}
            title="Recent Patients"
            subtitle="Your last-opened records"
            tone="teal"
          />
          <div className="p-1.5">
          {items.length === 0 ? (
            <p className="px-2.5 py-3 text-center text-xs text-muted-foreground">
              No recent patients yet.
            </p>
          ) : (
            items.map((r) => (
              <Link
                key={r.id}
                href={`/patients/${r.id}`}
                onClick={close}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-hover"
              >
                <span className="font-medium">{r.name}</span>
                <span className="text-xs text-muted-foreground">{r.meta}</span>
              </Link>
            ))
          )}
          </div>
        </div>
      )}
    </div>
  );
}
