import { Settings } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { SectionHubGrid } from "@/components/ui/SectionHubGrid";
import { createClient } from "@/lib/supabase/server";
import { SETTINGS_GROUPS, SETTINGS_SECTIONS } from "./sections";
import { getSettingsAccess, SettingsRestricted } from "./access";

/**
 * Settings hub — the Caretaker's control room (Bible 4.3 §5). A grouped grid of
 * section cards on the shared SectionHubGrid (the same component as the Logs Hub).
 * The cards that hold a collection carry a live COUNT (URDS §StatTile counter
 * pattern) so you see the shape of your clinic at a glance; sections still being
 * built show a "Coming Next" pill (honest scaffolding — never faked).
 */
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export default async function SettingsPage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;

  // Live counts for the collection cards (RLS scopes every count to this clinic).
  const tenantId = ctx?.membership?.tenant_id ?? null;
  const counts: Record<string, { count: number; countNoun: string }> = {};
  if (tenantId) {
    const supabase = await createClient();
    const [members, services, templates] = await Promise.all([
      supabase.from("tenant_users").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).neq("status", "archived"),
      supabase.from("clinic_services").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("email_templates").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    ]);
    counts.users = { count: members.count ?? 0, countNoun: plural(members.count ?? 0, "member", "members") };
    counts.services = { count: services.count ?? 0, countNoun: plural(services.count ?? 0, "service", "services") };
    counts.email = { count: templates.count ?? 0, countNoun: plural(templates.count ?? 0, "template", "templates") };
  }
  const sections = SETTINGS_SECTIONS.map((s) =>
    counts[s.key] && s.status === "ready" ? { ...s, ...counts[s.key] } : s,
  );

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
          terms: [
            { term: "The number on a card", definition: "A live count of what's inside — members, services, email templates — so you see the shape of your clinic at a glance." },
            { term: "Coming Next", definition: "That section's screen isn't built yet; the card lights up the moment we ship it." },
          ],
        }}
      />
      <SectionHubGrid groups={SETTINGS_GROUPS} sections={sections} baseHref="/settings" />
    </div>
  );
}
