import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppFrame } from "@/components/AppFrame";
import { NoWorkspace } from "@/components/NoWorkspace";
import {
  ALL_MODULES_ON,
  MODULE_COLUMNS,
  type ClinicalModules,
} from "@/lib/clinicalModules";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getSessionContext();

  // Authenticated but attached to NOTHING — no clinic membership and not a
  // Custodian (e.g. a retired Custodian, or revoked access). An honest dead-end
  // beats the empty clinic shell where every query silently returns nothing.
  if (ctx && !ctx.isCustodian && !ctx.membership) {
    return <NoWorkspace email={ctx.user.email ?? ""} />;
  }

  const custodianOnly = !!ctx?.isCustodian && !ctx?.membership;
  // A Custodian has no clinic — both clinic-name slots are hidden for them in
  // AppFrame, so this stays empty rather than showing "Platform"/"Control".
  const clinic = ctx?.membership?.tenants?.name ?? (custodianOnly ? "" : "RolDe");
  const user =
    ctx?.membership?.display_name ?? ctx?.custodian?.display_name ?? ctx?.user.email ?? "";
  const role = ctx?.membership?.role ?? (custodianOnly ? "custodian" : "");
  const prescribingRights = ctx?.membership?.prescribing_rights ?? false;

  // Clinical Modules (W1.1, APPROVALS §4.2) — the clinic-level switches the
  // whole shell reflows from (sidebar · ⌘K · the Layouts menu). No row yet =
  // the full spine, all on. A Custodian has no clinic → all on.
  let modules: ClinicalModules = ALL_MODULES_ON;
  const tenantId = ctx?.membership?.tenant_id;
  if (tenantId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clinic_clinical_modules")
      .select(MODULE_COLUMNS)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (data) modules = data;
  }

  return (
    <AppFrame
      clinic={clinic}
      user={user}
      role={role}
      prescribingRights={prescribingRights}
      modules={modules}
    >
      {children}
    </AppFrame>
  );
}
