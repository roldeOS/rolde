import { Settings } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { SectionHubGrid } from "@/components/ui/SectionHubGrid";
import { SETTINGS_GROUPS, SETTINGS_SECTIONS } from "./sections";
import { getSettingsAccess, SettingsRestricted } from "./access";

/**
 * Settings hub — the Caretaker's control room (Bible 4.3 §5). A grouped grid of
 * section cards on the shared SectionHubGrid (the same component as the Logs Hub).
 * Sections show a "Coming Next" pill until their module is built (honest
 * scaffolding — never faked).
 */
export default async function SettingsPage() {
  const { allowed } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;

  return (
    <div className="w-full space-y-8 p-6 lg:p-8">
      <PageHeaderRow
        icon={Settings}
        tone="neutral"
        title="Settings"
        explainer={{
          label: "Settings",
          description:
            "Your clinic's control room. Each section is looked after by the Caretaker — they light up as we build them.",
        }}
      />
      <SectionHubGrid groups={SETTINGS_GROUPS} sections={SETTINGS_SECTIONS} baseHref="/settings" />
    </div>
  );
}
