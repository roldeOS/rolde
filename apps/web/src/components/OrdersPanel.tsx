"use client";

import { useState } from "react";
import { FlaskConical, Maximize2, Minimize2 } from "lucide-react";
import { CardIcon } from "@/components/ui/CardIcon";
import { SectionExplainer } from "@/components/ui/SectionExplainer";
import { cn } from "@/lib/utils";

type Entry = { id: string; entry_type: string };

/**
 * Investigations + Orders pane (Bible 4.2 §3.6) — top-right quadrant. Glassy
 * sticky tab header (content blurs under). Tabs: Labs / Radiology / Prescribing
 * / Procedures / Letters; ordering arrives with Bible 4.5.
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
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="glass sticky top-0 z-10 flex items-center gap-1 px-3 py-2.5">
        {/* Tabs on the LEFT, same font size as "Clinical Notes" (text-sm); the
            card's flask squircle + (i) move to the RIGHT (Roland 2026-06-28). */}
        <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "shrink-0 rounded-lg px-2 py-1 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-foreground/6 text-foreground"
                  : "text-muted-foreground hover:bg-hover hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <CardIcon icon={FlaskConical} tone="info" variant="badge" size="sm" />
        <SectionExplainer
          label="Investigations & Orders"
          description="Request investigations and treatments, and review what's come back — grouped by type in the tabs."
          terms={[
            { term: "Labs / Radiology", definition: "Order tests and read results as they return." },
            { term: "Prescribing", definition: "Prescribe medicines with built-in drug-safety checks." },
            { term: "Procedures / Letters", definition: "Consents, photos, referrals and letters." },
          ]}
        />
        {onToggleMaximize && (
          <button
            onClick={onToggleMaximize}
            title={maximized ? "Restore" : "Expand"}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow"
          >
            {maximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        )}
      </div>

      <div className="px-4 pb-4 pt-1">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Nothing in {active.label.toLowerCase()} yet. {active.coming}
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((e) => (
              <div key={e.id} className="rounded-xl bg-card p-3 text-sm shadow-sm ring-1 ring-black/[0.04]">
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
