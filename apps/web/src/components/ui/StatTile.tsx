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
  critical: { bg: "bg-gradient-to-br from-critical/[0.18] to-critical/[0.05] ring-1 ring-critical/15", value: "text-critical" },
  warning: { bg: "bg-gradient-to-br from-warning/20 to-warning/[0.06] ring-1 ring-warning/15", value: "text-warning" },
  success: { bg: "bg-gradient-to-br from-success/[0.18] to-success/[0.05] ring-1 ring-success/15", value: "text-success" },
  info: { bg: "bg-gradient-to-br from-info/[0.18] to-info/[0.05] ring-1 ring-info/15", value: "text-info" },
  accent: { bg: "bg-gradient-to-br from-accent/25 to-accent/[0.06] ring-1 ring-accent/20", value: "text-accent" },
  neutral: { bg: "bg-gradient-to-br from-slate-500/[0.14] to-slate-500/[0.04] ring-1 ring-slate-500/15", value: "text-slate-600" },
  brand: { bg: "bg-gradient-to-br from-info/[0.16] to-accent/[0.06] ring-1 ring-info/15", value: "text-info" },
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
