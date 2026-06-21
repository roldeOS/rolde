import { Settings } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { SectionHubGrid } from "@/components/ui/SectionHubGrid";
import { createClient } from "@/lib/supabase/server";
import { SETTINGS_GROUPS, SETTINGS_SECTIONS } from "./sections";
import { getSettingsAccess, SettingsRestricted } from "./access";

/**
 * Settings hub — the Caretaker's control room (Bible 4.3 §5). A grouped grid of
 * mindate Counter cards (URDS §8.1): each carries ONE relevant value as the hero —
 * a live count (members · services · templates), a config value (the accent name,
 * the patient-number prefix, the tax), or "Coming Next". Read the shape of your
 * clinic at a glance; no prose to wade through mid-clinic.
 */
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export default async function SettingsPage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;

  // Each card's hero value, RLS-scoped to this clinic. Undefined → "Coming Next".
  const tenantId = ctx?.membership?.tenant_id ?? null;
  const values: Record<string, { value: string | number; valueSub?: string }> = {};
  if (tenantId) {
    const supabase = await createClient();
    const [members, services, templates, aPatient, commercial] = await Promise.all([
      supabase.from("tenant_users").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).neq("status", "archived"),
      supabase.from("clinic_services").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("email_templates").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("patients").select("patient_number").eq("tenant_id", tenantId).limit(1).maybeSingle(),
      supabase.from("clinic_commercial_settings").select("tax_enabled, tax_name, tax_rate_bps").eq("tenant_id", tenantId).maybeSingle(),
    ]);
    const m = members.count ?? 0, sv = services.count ?? 0, tp = templates.count ?? 0;
    values.users = { value: m, valueSub: plural(m, "member", "members") };
    values.services = { value: sv, valueSub: plural(sv, "service", "services") };
    values.email = { value: tp, valueSub: plural(tp, "template", "templates") };
    // Patient-number prefix, derived from an existing number (e.g. "DFS-00001" → "DFS").
    const prefix = aPatient.data?.patient_number?.split("-")[0];
    if (prefix) values.numbering = { value: prefix, valueSub: "Prefix" };
    // Tax, from Commercial Settings (Tax v2): "VAT 20%", or "Off" when not charged.
    const c = commercial.data;
    values.commercial = c?.tax_enabled
      ? { value: `${c.tax_name} ${(c.tax_rate_bps / 100).toString()}%`, valueSub: "Tax" }
      : { value: "Off", valueSub: "Tax" };
    // Branding accent — parchment is the system default until W1.1.4 lands.
    values.branding = { value: "Parchment", valueSub: "Accent" };
    // Clinic Profile is always set up to reach this screen.
    values.profile = { value: "Set", valueSub: "Profile" };
  }
  const sections = SETTINGS_SECTIONS.map((s) => (values[s.key] ? { ...s, ...values[s.key] } : s));

  return (
    <div className="w-full space-y-8 p-6 lg:p-8">
      <PageHeaderRow
        icon={Settings}
        tone="neutral"
        title="Settings"
        explainer={{
          label: "Settings",
          description:
            "Your clinic's control room. Each card shows one thing at a glance — a count, a setting, or what's coming next.",
          terms: [
            { term: "The value on a card", definition: "The one number or setting that matters most for that section — members, services, your tax rate, your patient-number prefix — so you read your clinic at a glance." },
            { term: "Coming Next", definition: "That section's screen isn't built yet; the card lights up the moment we ship it." },
          ],
        }}
      />
      <SectionHubGrid groups={SETTINGS_GROUPS} sections={sections} baseHref="/settings" cardVariant="counter" />
    </div>
  );
}
