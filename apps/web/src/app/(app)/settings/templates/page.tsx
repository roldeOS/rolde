import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getSettingsAccess, SettingsRestricted } from "../access";
import { getSection } from "../sections";
import { sanitiseParts } from "@/lib/scribeTemplates";
import { TemplatesGovernanceCard, type AdminTemplate } from "./TemplatesGovernanceCard";

/**
 * Settings → Scribe Templates (T3, Roland "Go for it" 2026-07-21) — the
 * Caretaker's governance home for the clinic's documentation library: the
 * template list with usage counts and activate/retire + patient-facing
 * switches, the builder (same sheet as the consult room), and the clinic-named
 * body-map COLOUR LEGEND (approved 2026-07-13) whose names print on the
 * record. Writes are Caretaker-only (server + RLS); other settings-capable
 * roles see the library read-only.
 */
export default async function TemplatesSettingsPage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const sec = getSection("templates");
  if (!sec) notFound();

  const tenantId = ctx?.membership?.tenant_id ?? null;
  const isCaretaker = ctx?.membership?.role === "caretaker";

  let templates: AdminTemplate[] = [];
  const legend: Record<string, string> = {};
  if (tenantId) {
    const supabase = await createClient();
    const [{ data: rows }, { data: legendRow }] = await Promise.all([
      supabase
        .from("clinic_templates")
        .select("id, name, specialty, parts, is_active, patient_facing")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("name"),
      supabase
        .from("clinic_bodymap_legend")
        .select("labels")
        .eq("tenant_id", tenantId)
        .maybeSingle(),
    ]);
    const clean = (rows ?? []).flatMap((t) => {
      const parts = sanitiseParts(t.parts);
      return parts
        ? [{ id: t.id, name: t.name, specialty: t.specialty, parts,
             is_active: t.is_active, patient_facing: t.patient_facing, usage: 0 }]
        : [];
    });
    // Usage counts — how many notes were written FROM each template (the
    // snapshot in the payload is the truth). A handful of head-counts.
    await Promise.all(
      clean.map(async (t) => {
        const { count } = await supabase
          .from("patient_feed_entries")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .filter("payload->template->>id", "eq", t.id);
        t.usage = count ?? 0;
      }),
    );
    templates = clean;
    const raw = (legendRow?.labels ?? {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(raw))
      if (typeof v === "string" && v.trim()) legend[k] = v.trim();
  }

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <PageHeaderRow
        icon={sec.icon}
        tone={sec.tone}
        title={sec.title}
        explainer={{ label: sec.title, description: sec.blurb }}
      />

      {!tenantId ? (
        <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-float">
          Scribe Templates are per-clinic. As a Custodian you don&apos;t have a clinic of your own.
        </div>
      ) : (
        <TemplatesGovernanceCard
          initialTemplates={templates}
          initialLegend={legend}
          isCaretaker={isCaretaker}
        />
      )}
    </div>
  );
}
