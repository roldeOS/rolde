import Link from "next/link";
import { Settings } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { SETTINGS_GROUPS, SETTINGS_SECTIONS } from "./sections";
import { getSettingsAccess, SettingsRestricted } from "./access";
import { cn } from "@/lib/utils";

// A calm tone wash per card (Roland 2026-06-17: "make this a bit more colour") —
// the gradient + hairline ring parity with the dashboard StatTiles, kept light.
const TONE_WASH: Record<CardIconTone, string> = {
  critical: "bg-gradient-to-br from-critical/[0.15] to-critical/[0.04] ring-1 ring-critical/15",
  warning: "bg-gradient-to-br from-warning/[0.18] to-warning/[0.05] ring-1 ring-warning/15",
  success: "bg-gradient-to-br from-success/[0.15] to-success/[0.04] ring-1 ring-success/15",
  info: "bg-gradient-to-br from-info/[0.15] to-info/[0.04] ring-1 ring-info/15",
  accent: "bg-gradient-to-br from-accent/20 to-accent/[0.05] ring-1 ring-accent/20",
  neutral: "bg-gradient-to-br from-slate-500/[0.12] to-slate-500/[0.03] ring-1 ring-slate-500/15",
  brand: "bg-gradient-to-br from-info/[0.14] to-accent/[0.06] ring-1 ring-info/15",
};

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
                  className={cn(
                    "flex flex-col gap-3 rounded-xl p-5 shadow-float transition-shadow hover:shadow-raised",
                    TONE_WASH[s.tone],
                  )}
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
