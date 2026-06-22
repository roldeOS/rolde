import Link from "next/link";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { SectionExplainer } from "@/components/ui/SectionExplainer";
import { CARD_WASH as TONE_WASH, CARD_VALUE as VALUE } from "@/lib/cardTones";
import { cn } from "@/lib/utils";

/**
 * SectionHubGrid — the shared grouped card grid behind every Caretaker / Custodian
 * hub (Settings, Logs, Control). One implementation so every hub is peer-consistent
 * (URDS §0 rule 6: a standard lands → every hub uses it).
 *
 * Card shapes:
 *   - "counter" (the mindate Counter / URDS §8.1): SMALL tone-washed tile — icon-badge
 *     + label (+ `(i)`) on the top row, then ONE relevant value as the hero (a count,
 *     a config value like "Parchment" / "DFS" / "VAT 20%", or "Coming Next"). No prose
 *     on the card — the blurb lives in the `(i)`. The number/value is the hero.
 *   - "nav" (legacy): icon + title + blurb navigation tile.
 *
 * COLOUR: a FLAT solid tint of the Earth & Bloom hue (never a fade-to-transparent
 * gradient — that reads dead), deepening on hover, mindate-calibrated per hue.
 */

export type HubSection = {
  key: string;
  title: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  status: "ready" | "soon";
  group: string;
  /** The hero value: a count (number) or a short config value ("Parchment", "VAT 20%"). */
  value?: string | number;
  /** Optional small line under the value (e.g. "members", "events"). */
  valueSub?: string;
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

/**
 * The Counter tile (mindate Counter / URDS §8.1). Small, flat-tinted, the value is
 * the hero. Stretched-link clickability: an absolute `<Link>` overlay (z-0) makes
 * the whole tile navigate while the `(i)` button escapes via `relative z-10` (no
 * `<button>` inside `<a>` — Safari reparents it → hydration bug).
 */
export function CounterCard({
  section: s,
  href,
}: {
  section: Omit<HubSection, "group">;
  href: string;
}) {
  const hasValue = s.value !== undefined && s.value !== null;
  const isNum = typeof s.value === "number";
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl p-3 shadow-float transition-all hover:-translate-y-0.5 hover:shadow-raised",
        TONE_WASH[s.tone],
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
        <div className="relative z-10 shrink-0">
          <SectionExplainer label={s.title} description={s.blurb} />
        </div>
      </div>
      <div className="mt-2">
        {hasValue ? (
          <>
            <p
              className={cn(
                "font-semibold leading-none",
                isNum ? "text-2xl tabular-nums" : "text-lg",
                VALUE[s.tone],
              )}
            >
              {isNum ? (s.value as number).toLocaleString() : s.value}
            </p>
            {s.valueSub && <p className="mt-1 text-xs text-muted-foreground">{s.valueSub}</p>}
          </>
        ) : (
          <p className="text-sm font-medium text-muted-foreground">Coming Next</p>
        )}
      </div>
    </div>
  );
}

/** The legacy navigation tile — icon, title, blurb. Same flat tint. */
function NavCard({ section: s, href }: { section: HubSection; href: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-3 rounded-xl p-5 shadow-float transition-all hover:-translate-y-0.5 hover:shadow-raised",
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
