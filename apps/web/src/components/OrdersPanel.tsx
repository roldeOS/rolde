"use client";

import { useState } from "react";
import { FlaskConical, Maximize2, Minimize2 } from "lucide-react";
import { CardIcon } from "@/components/ui/CardIcon";
import { cn } from "@/lib/utils";

type Entry = { id: string; entry_type: string };

/**
 * Investigations + Orders pane (Bible 4.2 §3.6) — the top-right quadrant of the
 * consultation screen. Tabs: Labs / Radiology / Prescribing / Procedures /
 * Letters. Each tab lists that family's feed entries; ordering itself arrives
 * with the Clinical Orders module (Bible 4.5).
 */
const TABS: { key: string; label: string; types: string[]; coming: string }[] = [
  { key: "labs", label: "Labs", types: ["lab_order", "lab_result"], coming: "Lab ordering arrives with Bible 4.5." },
  { key: "radiology", label: "Radiology", types: ["radiology_order", "radiology_result"], coming: "Radiology ordering arrives with Bible 4.5." },
  { key: "prescribing", label: "Prescribing", types: ["prescription"], coming: "Prescribing (with drug-safety checks) arrives with Bible 4.5." },
  { key: "procedures", label: "Procedures", types: ["photo_set", "consent_signed"], coming: "Procedures and consents arrive with Bibles 4.5–4.6." },
  { key: "letters", label: "Letters", types: ["referral_letter", "discharge_summary", "sick_note", "gp_letter"], coming: "Letters and the closed-loop referral pipeline arrive with Bible 4.4 §5–6." },
];

export function OrdersPanel({
  entries,
  maximized,
  onToggleMaximize,
}: {
  entries: Entry[];
  maximized?: boolean;
  onToggleMaximize?: () => void;
}) {
  const [tab, setTab] = useState("labs");
  const active = TABS.find((t) => t.key === tab)!;
  const rows = entries.filter((e) => active.types.includes(e.entry_type));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-3 pb-2">
        <CardIcon icon={FlaskConical} tone="info" variant="badge" size="sm" />
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-lg px-2 py-1 text-xs font-medium transition-colors",
              tab === t.key
                ? "bg-foreground/6 text-foreground"
                : "text-muted-foreground hover:bg-hover hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
        {onToggleMaximize && (
          <button
            onClick={onToggleMaximize}
            title={maximized ? "Restore" : "Expand"}
            className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
          >
            {maximized ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Nothing in {active.label.toLowerCase()} yet. {active.coming}
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((e) => (
              <div key={e.id} className="rounded-lg border border-border p-3 text-sm">
                <span className="font-medium capitalize">
                  {e.entry_type.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
