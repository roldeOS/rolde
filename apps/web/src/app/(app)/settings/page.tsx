import Link from "next/link";
import { Settings } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { SETTINGS_GROUPS, SETTINGS_SECTIONS } from "./sections";
import { getSettingsAccess, SettingsRestricted } from "./access";
import { cn } from "@/lib/utils";

// A CHEERFUL tone wash per card (Roland 2026-06-19: "give the website some cheer —
// bright pastel colours, not death"). The gradient + hairline ring, turned up so
// the pastels actually read as colour, not a washed-out grey.
const TONE_WASH: Record<CardIconTone, string> = {
  critical: "bg-gradient-to-br from-critical/[0.26] to-critical/[0.09] ring-1 ring-critical/25",
  warning: "bg-gradient-to-br from-warning/[0.30] to-warning/[0.10] ring-1 ring-warning/25",
  success: "bg-gradient-to-br from-success/[0.26] to-success/[0.09] ring-1 ring-success/25",
  info: "bg-gradient-to-br from-info/[0.26] to-info/[0.09] ring-1 ring-info/25",
  accent: "bg-gradient-to-br from-accent/[0.34] to-accent/[0.11] ring-1 ring-accent/30",
  neutral: "bg-gradient-to-br from-slate-500/[0.20] to-slate-500/[0.06] ring-1 ring-slate-500/20",
  brand: "bg-gradient-to-br from-info/[0.24] to-accent/[0.12] ring-1 ring-info/25",
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
