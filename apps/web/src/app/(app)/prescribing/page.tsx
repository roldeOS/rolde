import { Pill } from "lucide-react";
import { ModuleStub } from "@/components/ModuleStub";

export default function PrescribingPage() {
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
