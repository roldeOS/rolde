import { CalendarDays } from "lucide-react";
import { ModuleStub } from "@/components/ModuleStub";
import { requireModuleAccess } from "@/lib/auth";

export default async function CalendarPage() {
  await requireModuleAccess("calendar");
  return (
    <ModuleStub
      icon={CalendarDays}
      tone="success"
      title="Calendar"
      blurb="Appointments and scheduling — day, week, month and clinician views"
      source="Bible 4.4 §3"
    />
  );
}
