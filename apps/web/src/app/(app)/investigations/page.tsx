import { FlaskConical } from "lucide-react";
import { ModuleStub } from "@/components/ModuleStub";
import { requireModuleAccess } from "@/lib/auth";
import { getClinicalModulesForSession } from "@/lib/clinicalModules.server";

export default async function InvestigationsPage() {
  await requireModuleAccess("investigations");
  // Clinical Modules (W1.1) — with Lab AND Radiology both off, the clinic has
  // no investigations; a direct visit says so honestly.
  const m = await getClinicalModulesForSession();
  return (
    <ModuleStub
      icon={FlaskConical}
      tone="info"
      title="Investigations"
      blurb="Lab and radiology orders, results review and urgent flags"
      source="Bibles 4.4 §7 and 4.5"
      switchedOff={!m.lab_enabled && !m.radiology_enabled}
    />
  );
}