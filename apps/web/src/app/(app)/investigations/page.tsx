import { FlaskConical } from "lucide-react";
import { ModuleStub } from "@/components/ModuleStub";

export default function InvestigationsPage() {
  return (
    <ModuleStub
      icon={FlaskConical}
      tone="info"
      title="Investigations"
      blurb="Lab and radiology orders, results review and urgent flags"
      source="Bibles 4.4 §7 and 4.5"
    />
  );
}
