import Link from "next/link";
import { Settings } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { SETTINGS_GROUPS, SETTINGS_SECTIONS } from "./sections";
import { getSettingsAccess, SettingsRestricted } from "./access";
import { cn } from "@/lib/utils";

// BRILLIANT SPRING PASTELS per card (Roland 2026-06-19: "brilliant spring colours,
// in pastel… give the website some cheer"). Tailwind 100/50 tints read as fresh,
// bright pastel — varied hue per tone so the grid feels alive, not a grey morgue.
const TONE_WASH: Record<CardIconTone, string> = {
  critical: "bg-gradient-to-br from-rose-100 to-rose-50 ring-1 ring-rose-200/70",
  warning: "bg-gradient-to-br from-amber-100 to-amber-50 ring-1 ring-amber-200/70",
  success: "bg-gradient-to-br from-emerald-100 to-emerald-50 ring-1 ring-emerald-200/70",
  info: "bg-gradient-to-br from-sky-100 to-sky-50 ring-1 ring-sky-200/70",
  accent: "bg-gradient-to-br from-teal-100 to-teal-50 ring-1 ring-teal-200/70",
  neutral: "bg-gradient-to-br from-violet-100 to-violet-50 ring-1 ring-violet-200/70",
  brand: "bg-gradient-to-br from-indigo-100 to-sky-50 ring-1 ring-indigo-200/70",
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
