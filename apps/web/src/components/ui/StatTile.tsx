import Link from "next/link";
import type { ComponentType } from "react";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { cn } from "@/lib/utils";

/**
 * StatTile — the universal stat tile (mindate "Counter", Roland 2026-06-11):
 * a tone-washed card with a white icon badge + label, a big tinted number, and
 * an optional sub-line. Optionally a clickable surface (href). Colour gives a
 * calm splash without shouting.
 */
// A real splash of colour (Roland 2026-06-16: the flat /8 washes "looked like
// death") — a tinted gradient + a hairline tone ring so each tile reads alive.
const TONE: Record<
  CardIconTone,
  { bg: string; value: string }
> = {
  critical: { bg: "bg-gradient-to-br from-coral/[0.18] to-coral/[0.05] ring-1 ring-coral/25", value: "text-rose-700" },
  warning: { bg: "bg-gradient-to-br from-honey/[0.24] to-honey/[0.07] ring-1 ring-honey/30", value: "text-amber-800" },
  success: { bg: "bg-gradient-to-br from-bloom/40 to-bloom/[0.12] ring-1 ring-bloom/45", value: "text-emerald-800" },
  info: { bg: "bg-gradient-to-br from-info/[0.14] to-info/[0.05] ring-1 ring-info/20", value: "text-sky-700" },
  accent: { bg: "bg-gradient-to-br from-bloom/40 to-bloom/[0.12] ring-1 ring-bloom/45", value: "text-emerald-800" },
  neutral: { bg: "bg-gradient-to-br from-lavender/45 to-lavender/[0.14] ring-1 ring-lavender/45", value: "text-violet-800" },
  brand: { bg: "bg-gradient-to-br from-cream/55 to-cream/[0.18] ring-1 ring-honey/25", value: "text-amber-900" },
};

export function StatTile({
  icon,
  label,
  value,
  sub,
  tone,
  href,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  tone: CardIconTone;
  href?: string;
}) {
  const t = TONE[tone];
  const body = (
    <div
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl p-4 shadow-float transition-shadow",
        t.bg,
        href && "hover:shadow-lg",
      )}
    >
      <div className="flex items-center gap-2">
        <CardIcon icon={icon} tone={tone} variant="badge" size="sm" />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div>
        <p className={cn("text-2xl font-semibold tabular-nums", t.value)}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
