import { CalendarDays } from "lucide-react";
import { ModuleStub } from "@/components/ModuleStub";

export default function CalendarPage() {
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
