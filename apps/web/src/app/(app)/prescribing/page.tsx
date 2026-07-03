import { Pill } from "lucide-react";
import { ModuleStub } from "@/components/ModuleStub";
import { requirePrescriber } from "@/lib/auth";
import { getClinicalModulesForSession } from "@/lib/clinicalModules.server";

export default async function PrescribingPage() {
  await requirePrescriber();
  // Clinical Modules (W1.1) — the clinic may not prescribe at all; a direct
  // visit says so honestly.
  const m = await getClinicalModulesForSession();
  return (
    <ModuleStub
      icon={Pill}
      tone="warning"
      title="Prescribing"
      blurb="Unified clinical orders with allergy, interaction, renal and pregnancy safety checks"
      source="Bible 4.5 (patient-safety-critical)"
      switchedOff={!m.prescribing_enabled}
    />
  );
}