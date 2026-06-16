import { FlaskConical } from "lucide-react";
import { ModuleStub } from "@/components/ModuleStub";
import { requireModuleAccess } from "@/lib/auth";

export default async function InvestigationsPage() {
  await requireModuleAccess("investigations");
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
