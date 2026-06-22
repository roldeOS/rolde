import Link from "next/link";
import type { ComponentType } from "react";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { CARD_WASH, CARD_VALUE } from "@/lib/cardTones";
import { cn } from "@/lib/utils";

/**
 * StatTile — the universal stat tile (mindate "Counter", Roland 2026-06-11):
 * a tone-washed card with a white icon badge + label, a big tinted number, and
 * an optional sub-line. Optionally a clickable surface (href). Shares the ONE
 * card-tone system (lib/cardTones) with the hub counter cards — flat pastel tint,
 * never a fade-to-transparent gradient (Roland 2026-06-22, universal cards).
 */
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
  const body = (
    <div
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl p-4 shadow-float transition-all",
        CARD_WASH[tone],
        href && "hover:-translate-y-0.5 hover:shadow-raised",
      )}
    >
      <div className="flex items-center gap-2">
        <CardIcon icon={icon} tone={tone} variant="badge" size="sm" />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div>
        <p className={cn("text-2xl font-semibold tabular-nums", CARD_VALUE[tone])}>{value}</p>
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
