"use client";

import { useSyncExternalStore } from "react";
import { Rows3, Rows2, Rows4 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TableDensityToggle — compact / cozy / comfortable (URDS table standard, ported
 * from mindate). The choice persists per `storageKey`; `useSyncExternalStore`
 * keeps every instance in this tab in sync (the toolbar toggle + the table read
 * the same value). SSR-safe: the server snapshot is always "cozy".
 */

export type TableDensity = "compact" | "cozy" | "comfortable";

const DENSITY_ICON: Record<TableDensity, typeof Rows2> = {
  compact: Rows4,
  cozy: Rows3,
  comfortable: Rows2,
};

const DENSITY_LABEL: Record<TableDensity, string> = {
  compact: "Compact",
  cozy: "Cozy",
  comfortable: "Comfortable",
};

export function TableDensityToggle({
  value,
  onChange,
  floating,
}: {
  value: TableDensity;
  onChange: (next: TableDensity) => void;
  /** Borderless floating chrome to match the floating table. */
  floating?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Table density"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md p-0.5",
        floating ? "bg-background shadow-sm" : "bg-muted/50",
      )}
    >
      {(Object.keys(DENSITY_ICON) as TableDensity[]).map((d) => {
        const Icon = DENSITY_ICON[d];
        const active = value === d;
        return (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={DENSITY_LABEL[d]}
            title={DENSITY_LABEL[d]}
            onClick={() => onChange(d)}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded transition-colors",
              active
                ? floating
                  ? "bg-hover text-foreground"
                  : "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

const EVENT_NAME = "rolde:density-change";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT_NAME, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT_NAME, callback);
  };
}

function readClient(storageKey: string): TableDensity {
  if (typeof window === "undefined") return "cozy";
  try {
    const v = window.localStorage.getItem(`density:${storageKey}`);
    if (v === "compact" || v === "cozy" || v === "comfortable") return v;
  } catch {
    /* ignore */
  }
  return "cozy";
}

function readServer(): TableDensity {
  return "cozy";
}

export function useTableDensity(storageKey: string): {
  density: TableDensity;
  setDensity: (d: TableDensity) => void;
} {
  const density = useSyncExternalStore(subscribe, () => readClient(storageKey), readServer);

  function setDensity(d: TableDensity) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(`density:${storageKey}`, d);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }

  return { density, setDensity };
}

/** Connected variant — wires itself to the shared hook for a storage key. */
export function DensityToggleConnected({ storageKey, floating }: { storageKey: string; floating?: boolean }) {
  const { density, setDensity } = useTableDensity(storageKey);
  return <TableDensityToggle value={density} onChange={setDensity} floating={floating} />;
}

/** Tailwind classes per density. */
export const DENSITY_CLASSES: Record<TableDensity, { rowPad: string; headerPad: string; textSize: string }> = {
  compact: { rowPad: "px-2.5 py-1", headerPad: "px-2.5 py-1.5", textSize: "text-xs" },
  cozy: { rowPad: "px-3 py-2.5", headerPad: "px-3 py-2", textSize: "text-sm" },
  comfortable: { rowPad: "px-3 py-4", headerPad: "px-3 py-3", textSize: "text-sm" },
};
