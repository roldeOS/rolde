import { BarChart3 } from "lucide-react";
import { ModuleStub } from "@/components/ModuleStub";

export default function ReportsPage() {
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
