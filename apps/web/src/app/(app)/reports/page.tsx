import { BarChart3 } from "lucide-react";
import { ModuleStub } from "@/components/ModuleStub";
import { requireModuleAccess } from "@/lib/auth";

export default async function ReportsPage() {
  await requireModuleAccess("reports");
  return (
    <ModuleStub
      icon={BarChart3}
      tone="neutral"
      title="Reports"
      blurb="Clinic activity, financial summaries and audit views"
      source="Bibles 4.3 §5 and 4.4 §9"
    />
  );
}
