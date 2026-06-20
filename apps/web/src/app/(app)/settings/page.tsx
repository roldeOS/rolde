import Link from "next/link";
import { Settings } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { SETTINGS_GROUPS, SETTINGS_SECTIONS } from "./sections";
import { getSettingsAccess, SettingsRestricted } from "./access";
import { cn } from "@/lib/utils";

// WARM EARTH & BLOOM PASTELS per card (Roland 2026-06-20: warm, elegant, reduced
// opacity — like the mindate dashboard, "not fluorescent"). Soft washes of the
// iOS palette: coral, honey, cream, lavender, sage. Warm-leaning + varied hue so
// the grid feels alive and elegant, never washed-out grey or jarring neon.
const TONE_WASH: Record<CardIconTone, string> = {
  critical: "bg-gradient-to-br from-coral/[0.18] to-coral/[0.05] ring-1 ring-coral/25",
  warning: "bg-gradient-to-br from-honey/[0.24] to-honey/[0.07] ring-1 ring-honey/30",
  success: "bg-gradient-to-br from-bloom/40 to-bloom/[0.12] ring-1 ring-bloom/45",
  info: "bg-gradient-to-br from-info/[0.14] to-info/[0.05] ring-1 ring-info/20",
  accent: "bg-gradient-to-br from-bloom/40 to-bloom/[0.12] ring-1 ring-bloom/45",
  neutral: "bg-gradient-to-br from-lavender/45 to-lavender/[0.14] ring-1 ring-lavender/45",
  brand: "bg-gradient-to-br from-cream/55 to-cream/[0.18] ring-1 ring-honey/25",
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
