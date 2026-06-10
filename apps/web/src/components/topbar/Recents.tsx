"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
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
        className="flex size-8 items-center justify-center rounded-lg text-info transition-colors hover:bg-info/10"
        aria-label="Recent patients"
      >
        <Clock className="size-[18px]" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-64 rounded-xl bg-card p-1.5 shadow-float">
          <p className="px-2.5 py-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Recent patients
          </p>
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
      )}
    </div>
  );
}
