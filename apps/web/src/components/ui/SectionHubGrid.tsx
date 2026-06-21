import Link from "next/link";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { SectionExplainer } from "@/components/ui/SectionExplainer";
import { cn } from "@/lib/utils";

/**
 * SectionHubGrid — the shared grouped card grid behind every Caretaker hub
 * (Settings, Logs, and whatever comes next). One implementation, so every hub
 * looks and behaves identically (URDS peer-consistency). A hub page supplies its
 * groups + sections + base href; cards route to `${baseHref}/${key}`.
 *
 * Two card shapes:
 *   - "nav" (default): icon + title + blurb — a navigation tile (the Logs Hub).
 *   - "counter": the mindate Counter / URDS StatTile — icon-badge + label on the
 *     top row (with the (i) glossary beside it), then a BIG tinted number as the
 *     hero, with the noun beneath. A section with no count shows its blurb instead.
 *     This is the canonical "card that catches the eye" (mindate Dashboard parity).
 * Any section still `status: "soon"` shows an honest "Coming Next" pill.
 */

export type HubSection = {
  key: string;
  title: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  status: "ready" | "soon";
  group: string;
  /** Counter pattern (mindate Counter): a live count shown as the big number. */
  count?: number;
  /** The thing being counted, e.g. "members" — shown small under the number. */
  countNoun?: string;
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

// The big-number colour per tone (mirrors the mindate Counter value colour).
const VALUE: Record<CardIconTone, string> = {
  critical: "text-rose-700",
  warning: "text-amber-800",
  success: "text-emerald-800",
  info: "text-sky-700",
  accent: "text-emerald-800",
  neutral: "text-violet-800",
  brand: "text-amber-900",
};

export function SectionHubGrid({
  groups,
  sections,
  baseHref,
  cardVariant = "nav",
}: {
  groups: readonly string[];
  sections: HubSection[];
  baseHref: string;
  cardVariant?: "nav" | "counter";
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
              {inGroup.map((s) =>
                cardVariant === "counter" ? (
                  <CounterCard key={s.key} section={s} href={`${baseHref}/${s.key}`} />
                ) : (
                  <NavCard key={s.key} section={s} href={`${baseHref}/${s.key}`} />
                ),
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** The navigation tile — icon, title, blurb (the Logs Hub). Unchanged. */
function NavCard({ section: s, href }: { section: HubSection; href: string }) {
  return (
    <Link
      href={href}
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
  );
}

/**
 * The Counter tile (mindate Counter / URDS StatTile) — icon-badge + label on top,
 * then the big tinted number as the hero. Stretched-link clickability so the whole
 * tile navigates while the (i) glossary stays its own button (no <button> inside
 * <a>, which Safari reparents — mindate's hydration fix).
 */
function CounterCard({ section: s, href }: { section: HubSection; href: string }) {
  const soon = s.status === "soon";
  const hasCount = s.count !== undefined && !soon;
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl p-4 shadow-float transition-all hover:-translate-y-0.5 hover:shadow-raised",
        TONE_WASH[s.tone],
        soon && "opacity-70",
      )}
    >
      <Link
        href={href}
        aria-label={s.title}
        className="absolute inset-0 z-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      <div className="flex items-center gap-2">
        <CardIcon icon={s.icon} tone={s.tone} variant="badge" size="sm" />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{s.title}</p>
        {soon ? (
          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Coming Next
          </span>
        ) : hasCount ? (
          <div className="relative z-10">
            <SectionExplainer label={s.title} description={s.blurb} />
          </div>
        ) : null}
      </div>
      {hasCount ? (
        <div className="mt-3">
          <p className={cn("text-2xl font-semibold leading-none tabular-nums", VALUE[s.tone])}>
            {s.count}
          </p>
          {s.countNoun && <p className="mt-1 text-xs text-muted-foreground">{s.countNoun}</p>}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.blurb}</p>
      )}
    </div>
  );
}
