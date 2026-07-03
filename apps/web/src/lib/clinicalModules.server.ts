import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { ALL_MODULES_ON, MODULE_COLUMNS, type ClinicalModules } from "./clinicalModules";

/**
 * The session clinic's Clinical Modules (W1.1) — server-side. No membership or
 * no row yet = the full spine, all on (a Custodian browsing has no clinic to
 * trim). Used by route pages that must answer "has this clinic switched me
 * off?" honestly on a direct URL visit — the sidebar/⌘K hide the entrance, but
 * a bookmark still lands here.
 */
export async function getClinicalModulesForSession(): Promise<ClinicalModules> {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!tenantId) return ALL_MODULES_ON;
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinic_clinical_modules")
    .select(MODULE_COLUMNS)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return data ?? ALL_MODULES_ON;
}
