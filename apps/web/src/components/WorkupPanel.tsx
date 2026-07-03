"use client";

import { useState } from "react";
import { FlaskConical, Maximize2, Minimize2 } from "lucide-react";
import { CardIcon } from "@/components/ui/CardIcon";
import { SectionExplainer } from "@/components/ui/SectionExplainer";
import { cn } from "@/lib/utils";
import { ALL_MODULES_ON, type ClinicalModules } from "@/lib/clinicalModules";

type Entry = { id: string; entry_type: string };

/**
 * Workup pane (Bible 4.2 §3.6; renamed from "Investigations + Orders", Roland
 * 2026-07-01) — top-right quadrant: order things + track them + see results.
 * Glassy sticky tab header (content blurs under). Tabs: Labs / Radiology /
 * Prescribing / Procedures; ordering arrives with Bible 4.5. Letters are NOT
 * here — they live in the Clinical Notes feed (composed in Scribe).
 */
const TABS: {
  key: string;
  label: string;
  types: string[];
  coming: string;
  /** The Clinical Modules switch (W1.1) that keeps this tab on. */
  module: keyof ClinicalModules;
}[] = [
  { key: "labs", label: "Labs", types: ["lab_order", "lab_result"], coming: "Lab ordering arrives with Bible 4.5.", module: "lab_enabled" },
  { key: "radiology", label: "Radiology", types: ["radiology_order", "radiology_result"], coming: "Radiology ordering arrives with Bible 4.5.", module: "radiology_enabled" },
  { key: "prescribing", label: "Prescribing", types: ["prescription"], coming: "Prescribing (with drug-safety checks) arrives with Bible 4.5.", module: "prescribing_enabled" },
  { key: "procedures", label: "Procedures", types: ["photo_set", "consent_signed"], coming: "Procedures and consents arrive with Bibles 4.5–4.6.", module: "procedures_enabled" },
];

export function WorkupPanel({
  entries,
  modules = ALL_MODULES_ON,
  maximized,
  onToggleMaximize,
}: {
  entries: Entry[];
  /** Clinical Modules (W1.1) — a switched-off module drops its tab here. */
  modules?: ClinicalModules;
  maximized?: boolean;
  onToggleMaximize?: () => void;
}) {
  // Only the tabs whose clinic module is ON exist (the whole card leaves the
  // workspace when all four are off — ConsultationWorkspace handles that).
  const tabs = TABS.filter((t) => modules[t.module]);
  const [tab, setTab] = useState(tabs[0]?.key ?? "labs");
  const active = tabs.find((t) => t.key === tab) ?? tabs[0] ?? TABS[0];
  const rows = entries.filter((e) => active.types.includes(e.entry_type));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="glass sticky top-0 z-10 flex items-center gap-1 px-3 py-2.5">
        {/* Flask squircle + the card's NAME on the LEFT (matching "Clinical Notes");
            tabs in the middle; the (i) on the RIGHT (Roland 2026-06-28 + 2026-07-01). */}
        <CardIcon icon={FlaskConical} tone="info" variant="badge" size="sm" />
        <span className="mr-1 text-sm font-semibold">Workup</span>
        <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "shrink-0 rounded-lg px-2 py-1 text-sm font-semibold transition-colors",
                active.key === t.key
                  ? "bg-foreground/6 text-foreground"
                  : "text-muted-foreground hover:bg-hover hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <SectionExplainer
          label="Workup"
          description="Order investigations and treatments, and review what's come back — grouped by type in the tabs. (Letters live in the Clinical Notes feed.)"
          terms={[
            { term: "Labs / Radiology", definition: "Order tests and read results as they return." },
            { term: "Prescribing", definition: "Prescribe medicines with built-in drug-safety checks." },
            { term: "Procedures", definition: "Consents and photos for procedures." },
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
