import { Settings } from "lucide-react";
import { ModuleStub } from "@/components/ModuleStub";

export default function SettingsPage() {
  return (
    <ModuleStub
      icon={Settings}
      tone="neutral"
      title="Settings"
      blurb="Clinic configuration for the Caretaker — users and roles, services, branding (including the clinic accent colour for sidebar + hover), pharmacy partners, letter routing"
      source="Bible 4.3 §5"
    />
  );
}
