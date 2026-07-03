import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getSettingsAccess, SettingsRestricted } from "../access";
import { getSection } from "../sections";
import { ALL_MODULES_ON, MODULE_COLUMNS, type ClinicalModules } from "@/lib/clinicalModules";
import { ClinicalModulesForm } from "./ClinicalModulesForm";

/**
 * Settings → Clinical Modules (Caretaker, W1.1; APPROVALS §4.2). Static segment
 * overriding the `clinical-modules` scaffold. The clinic names which clinical
 * tools it uses — Lab · Radiology · Procedures · Prescribing · RolDe AI. Off =
 * out of sight for the whole team: the Consult Room reflows to 4/3/2 cards,
 * Workup drops the disabled tabs, and the sidebar/search hide the matching
 * sections. No row yet = everything on (the full common spine).
 */
export default async function ClinicalModulesPage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const sec = getSection("clinical-modules");
  if (!sec) notFound();

  const tenantId = ctx?.membership?.tenant_id ?? null;
  let initial: ClinicalModules = ALL_MODULES_ON;
  if (tenantId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clinic_clinical_modules")
      .select(MODULE_COLUMNS)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    initial = data ?? ALL_MODULES_ON;
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
          Clinical modules are per-clinic. As a Custodian you don&apos;t have a clinic of your own.
        </div>
      ) : (
        <ClinicalModulesForm initial={initial} />
      )}
    </div>
  );
}
