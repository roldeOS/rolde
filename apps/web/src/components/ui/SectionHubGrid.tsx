import Link from "next/link";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { cn } from "@/lib/utils";

/**
 * SectionHubGrid — the shared grouped card grid behind every Caretaker hub
 * (Settings, Logs, and whatever comes next). One implementation, so every hub
 * looks and behaves identically (URDS peer-consistency). A hub page supplies its
 * groups + sections + base href; cards route to `${baseHref}/${key}`, and any
 * section still `status: "soon"` shows an honest "Coming Next" pill.
 */

export type HubSection = {
  key: string;
  title: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  status: "ready" | "soon";
  group: string;
};

// WARM EARTH & BLOOM PASTELS per card (Roland 2026-06-20: warm, elegant, reduced
// opacity — soft washes of the iOS palette; never fluorescent or washed-out grey).
const TONE_WASH: Record<CardIconTone, string> = {
  critical: "bg-gradient-to-br from-coral/[0.18] to-coral/[0.05] ring-1 ring-coral/25",
  warning: "bg-gradient-to-br from-honey/[0.24] to-honey/[0.07] ring-1 ring-honey/30",
  success: "bg-gradient-to-br from-bloom/40 to-bloom/[0.12] ring-1 ring-bloom/45",
  info: "bg-gradient-to-br from-info/[0.14] to-info/[0.05] ring-1 ring-info/20",
  accent: "bg-gradient-to-br from-bloom/40 to-bloom/[0.12] ring-1 ring-bloom/45",
  neutral: "bg-gradient-to-br from-lavender/45 to-lavender/[0.14] ring-1 ring-lavender/45",
  brand: "bg-gradient-to-br from-cream/55 to-cream/[0.18] ring-1 ring-honey/25",
};

export function SectionHubGrid({
  groups,
  sections,
  baseHref,
}: {
  groups: readonly string[];
  sections: HubSection[];
  baseHref: string;
}) {
  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const inGroup = sections.filter((s) => s.group === group);
        if (inGroup.length === 0) return null;
        return (
          <section key={group} className="space-y-3">
            <h2 className="px-1 text-sm font-semibold text-muted-foreground">{group}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inGroup.map((s) => (
                <Link
                  key={s.key}
                  href={`${baseHref}/${s.key}`}
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
                    <h3 className="font-heading text-base font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.blurb}</p>
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
