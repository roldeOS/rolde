import { Pill } from "lucide-react";
import { ModuleStub } from "@/components/ModuleStub";
import { requirePrescriber } from "@/lib/auth";

export default async function PrescribingPage() {
  await requirePrescriber();
  return (
    <ModuleStub
      icon={Pill}
      tone="warning"
      title="Prescribing"
      blurb="Unified clinical orders with allergy, interaction, renal and pregnancy safety checks"
      source="Bible 4.5 (patient-safety-critical)"
    />
  );
}
