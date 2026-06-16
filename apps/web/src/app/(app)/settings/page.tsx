import Link from "next/link";
import { Settings } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { CardIcon } from "@/components/ui/CardIcon";
import { SETTINGS_GROUPS, SETTINGS_SECTIONS } from "./sections";
import { getSettingsAccess, SettingsRestricted } from "./access";

/**
 * Settings hub — the Caretaker's control room (Bible 4.3 §5). A grouped grid of
 * section cards; each routes into its own page. Sections show a "Coming next"
 * pill until their module is built (honest scaffolding — never faked).
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

      {SETTINGS_GROUPS.map((group) => {
        const sections = SETTINGS_SECTIONS.filter((s) => s.group === group);
        if (sections.length === 0) return null;
        return (
          <section key={group} className="space-y-3">
            <h2 className="px-1 text-sm font-semibold text-muted-foreground">
              {group}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map((s) => (
                <Link
                  key={s.key}
                  href={`/settings/${s.key}`}
                  className="flex flex-col gap-3 rounded-xl bg-card p-5 shadow-float transition-shadow hover:shadow-raised"
                >
                  <div className="flex items-center justify-between gap-2">
                    <CardIcon icon={s.icon} tone={s.tone} variant="badge" />
                    {s.status === "soon" && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Coming Next
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-semibold tracking-tight">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {s.blurb}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
