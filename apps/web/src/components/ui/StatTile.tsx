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
const TONE: Record<
  CardIconTone,
  { bg: string; value: string }
> = {
  critical: { bg: "bg-critical/8", value: "text-critical" },
  warning: { bg: "bg-warning/10", value: "text-warning" },
  success: { bg: "bg-success/8", value: "text-success" },
  info: { bg: "bg-info/8", value: "text-info" },
  neutral: { bg: "bg-slate-500/8", value: "text-slate-600" },
  brand: { bg: "bg-foreground/[0.05]", value: "text-foreground" },
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
