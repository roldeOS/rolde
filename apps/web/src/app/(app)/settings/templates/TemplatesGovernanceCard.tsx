"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, PersonStanding, LayoutTemplate } from "lucide-react";
import { CardIcon } from "@/components/ui/CardIcon";
import { Switch } from "@/components/ui/Switch";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TemplateBuilder } from "@/components/consultation/TemplateBuilder";
import { PIN_TONES } from "@/lib/bodyMap";
import {
  setTemplateFlags,
  saveBodymapLegend,
  listClinicTemplatesAdmin,
  type ClinicTemplate,
} from "@/app/(app)/patients/templateActions";
import { type TemplatePart } from "@/lib/scribeTemplates";
import { cn } from "@/lib/utils";

export type AdminTemplate = {
  id: string;
  name: string;
  specialty: string;
  parts: TemplatePart[];
  is_active: boolean;
  patient_facing: boolean;
  usage: number;
};

/**
 * The T3 governance card (Caretaker-only writes; settings-capable roles read):
 * the clinic's template library — usage counts, activate/retire, the T4
 * patient-facing eligibility flag, the same builder sheet the consult room
 * uses — and the body-map COLOUR LEGEND: the Caretaker names the clinic's pin
 * colours and those names print on every record (renderBodyMapText).
 */
export function TemplatesGovernanceCard({
  initialTemplates,
  initialLegend,
  isCaretaker,
}: {
  initialTemplates: AdminTemplate[];
  initialLegend: Record<string, string>;
  isCaretaker: boolean;
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [builder, setBuilder] = useState<{ open: boolean; editing: ClinicTemplate | null }>({
    open: false,
    editing: null,
  });
  const [legend, setLegend] = useState<Record<string, string>>(initialLegend);
  const [legendPending, setLegendPending] = useState(false);
  const [legendSaved, setLegendSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function flip(id: string, patch: { is_active?: boolean; patient_facing?: boolean }) {
    setError(null);
    setTemplates((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const r = await setTemplateFlags({ id, ...patch });
    if (!r.ok) {
      setError(r.error);
      // honest revert — the switch never lies about the saved state
      setTemplates((ts) =>
        ts.map((t) =>
          t.id === id
            ? {
                ...t,
                ...(patch.is_active !== undefined ? { is_active: !patch.is_active } : {}),
                ...(patch.patient_facing !== undefined
                  ? { patient_facing: !patch.patient_facing }
                  : {}),
              }
            : t,
        ),
      );
    }
  }

  async function refresh() {
    const r = await listClinicTemplatesAdmin();
    if (r.ok)
      setTemplates((prev) =>
        r.data.map((t) => ({
          ...t,
          usage: prev.find((p) => p.id === t.id)?.usage ?? 0,
        })),
      );
    router.refresh();
  }

  async function saveLegend() {
    setLegendPending(true);
    setError(null);
    const r = await saveBodymapLegend(legend);
    setLegendPending(false);
    if (!r.ok) return setError(r.error);
    setLegendSaved(true);
    setTimeout(() => setLegendSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl bg-critical/10 p-3 text-sm text-critical">{error}</p>
      )}

      {/* ── The clinic's template library ── */}
      <section className="rounded-2xl bg-card p-5 shadow-float">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CardIcon icon={LayoutTemplate} tone="periwinkle" />
            <span>
              <span className="block text-sm font-semibold">Clinic Templates</span>
              <span className="block text-xs text-muted-foreground">
                {isCaretaker
                  ? "You design them; your whole team fills them"
                  : "Designed by the Caretaker; the whole team fills them"}
              </span>
            </span>
          </span>
          {isCaretaker && (
            <Button size="sm" onClick={() => setBuilder({ open: true, editing: null })}>
              <Plus className="size-3.5" /> New Template
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {templates.length === 0 && (
            <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
              No clinic templates yet — the curated RolDe library always remains
              available in Scribe{isCaretaker ? "; build your first with New Template" : ""}.
            </p>
          )}
          {templates.map((t) => (
            <div
              key={t.id}
              className={cn(
                "flex flex-col gap-2 rounded-xl bg-muted/40 px-3.5 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4",
                !t.is_active && "opacity-60",
              )}
            >
              <span className="min-w-0 sm:flex-1">
                <span className="block truncate text-sm font-medium">
                  {t.name}
                  {!t.is_active && (
                    <span className="ml-2 rounded bg-foreground/8 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                      Retired
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t.specialty} · {t.parts.length} part{t.parts.length === 1 ? "" : "s"} ·{" "}
                  {t.usage} note{t.usage === 1 ? "" : "s"} written
                </span>
              </span>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Active
                <Switch
                  checked={t.is_active}
                  disabled={!isCaretaker}
                  onChange={(next) => flip(t.id, { is_active: next })}
                  label={`${t.name} active`}
                />
              </label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Patient-Facing
                <Switch
                  checked={t.patient_facing}
                  disabled={!isCaretaker}
                  onChange={(next) => flip(t.id, { patient_facing: next })}
                  label={`${t.name} patient-facing`}
                />
              </label>
              {isCaretaker && (
                <button
                  onClick={() => setBuilder({ open: true, editing: t })}
                  title="Edit This Template"
                  className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Retiring a template removes it from Scribe&apos;s picker — every note already
          written keeps rendering exactly as recorded. Patient-Facing marks a template
          eligible for patient intake &amp; consent when that arrives.
        </p>
      </section>

      {/* ── The body-map colour legend ── */}
      <section className="rounded-2xl bg-card p-5 shadow-float">
        <div className="flex items-center gap-2">
          <CardIcon icon={PersonStanding} tone="peach" />
          <span>
            <span className="block text-sm font-semibold">Body-Map Colour Legend</span>
            <span className="block text-xs text-muted-foreground">
              Name each pin colour — the names print on every record
            </span>
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {PIN_TONES.map((tone) => (
            <label key={tone.key} className="flex items-center gap-2">
              <span
                className="size-5 shrink-0 rounded-full shadow-sm"
                style={{ backgroundColor: tone.fill }}
              />
              <Input
                value={legend[tone.key] ?? ""}
                placeholder={`${tone.label} — e.g. ${
                  tone.key === "coral" ? "Anti-Wrinkle" : tone.key === "sage" ? "Filler" : "…"
                }`}
                disabled={!isCaretaker}
                onChange={(e) =>
                  setLegend((l) => ({ ...l, [tone.key]: e.target.value }))
                }
              />
            </label>
          ))}
        </div>
        {isCaretaker && (
          <div className="mt-3 flex items-center justify-end gap-2">
            {legendSaved && (
              <span className="text-xs font-medium text-success">Saved — the record now speaks your names.</span>
            )}
            <Button size="sm" onClick={saveLegend} disabled={legendPending}>
              {legendPending ? "Saving…" : "Save Legend"}
            </Button>
          </div>
        )}
      </section>

      {builder.open && (
        <TemplateBuilder
          editing={builder.editing}
          onClose={() => setBuilder({ open: false, editing: null })}
          onSaved={() => {
            setBuilder({ open: false, editing: null });
            void refresh();
          }}
          onDeleted={(id) => {
            setBuilder({ open: false, editing: null });
            setTemplates((ts) => ts.filter((t) => t.id !== id));
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
