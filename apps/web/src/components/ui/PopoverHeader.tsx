import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { cn } from "@/lib/utils";

/**
 * PopoverHeader (Roland 2026-07-04: dialog boxes "need a heading of sorts and
 * a splash of colour") — the ONE header anatomy every popover/menu wears: the
 * squircle CardIcon signature + a Title Case heading (+ optional subtitle) on
 * a soft Earth & Bloom wash, hairline beneath. Rides inside AnchoredPopover's
 * structured mode AND the topbar's anchored menus, so every floating surface
 * in RolDe reads as one family. PENDING Roland's blessing before it enters
 * the URDS (his call, 2026-07-04) — design here, law later.
 */
const TONE_WASH: Record<CardIconTone, string> = {
  critical: "bg-critical/8",
  warning: "bg-warning/10",
  success: "bg-success/8",
  info: "bg-info/8",
  accent: "bg-accent/12",
  neutral: "bg-slate-500/8",
  brand: "bg-foreground/5",
  rose: "bg-rose/15",
  sky: "bg-sky/20",
  teal: "bg-teal/20",
  peach: "bg-peach/20",
  periwinkle: "bg-periwinkle/20",
};

export function PopoverHeader({
  icon,
  title,
  subtitle,
  tone = "brand",
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  tone?: CardIconTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-b border-black/5 px-3 py-2.5",
        TONE_WASH[tone],
        className,
      )}
    >
      <CardIcon icon={icon} tone={tone} size="sm" className="bg-card/70 shadow-sm" />
      <div className="min-w-0">
        <p className="truncate text-sm leading-tight font-semibold text-foreground">{title}</p>
        {subtitle && (
          <p className="truncate text-xs leading-tight text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
