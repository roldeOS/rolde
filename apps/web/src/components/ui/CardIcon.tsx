import { CARD_ICON_TEXT } from "@/lib/cardTones";
import { cn } from "@/lib/utils";

/**
 * CardIcon — the signature RDS squircle icon badge (mindate ancestry; Roland:
 * "our icons have become almost like a signature"), re-toned for RolDe's
 * clinical palette (Bible 4.2 §2.2): colour carries CLINICAL meaning only.
 *
 * Variants (inherited):
 *   - "tinted" (default) — coloured rounded-square bg + tinted icon (white cards).
 *   - "badge" — white rounded-square + soft shadow + tinted icon (pops on
 *     tinted tiles AND anchors card headers; pair with CardHeaderRow).
 */
export type CardIconTone =
  | "critical" // red — allergies, critical flags, urgent
  | "warning"  // amber — action needed, moderate concern
  | "success"  // green — consents complete, normal, verified
  | "info"     // blue — informational, results, AI confidence
  | "accent"   // sage — the RolDe steward accent (Custodian, brand splash)
  | "neutral"  // slate — admin, documents, settings
  | "brand"    // near-black — RolDe chrome, patients, identity
  // — DECORATIVE pastels (Roland 2026-06-22): for cards where colour is variety,
  //   not clinical meaning. Widen the spectrum; always pastel, never fluorescent. —
  | "rose"
  | "sky"
  | "teal"
  | "peach"
  | "periwinkle";

// Icon-badge background per tone; the icon glyph colour is the shared CARD_ICON_TEXT
// (lib/cardTones) — one source of truth, so the breadcrumb crumb-icon matches the page.
const TONE_BG: Record<CardIconTone, string> = {
  critical: "bg-critical/10",
  warning:  "bg-warning/12",
  success:  "bg-success/10",
  info:     "bg-info/10",
  accent:   "bg-accent/15",
  neutral:  "bg-slate-500/10",
  brand:    "bg-foreground/8",
  rose:       "bg-rose/20",
  sky:        "bg-sky/25",
  teal:       "bg-teal/25",
  peach:      "bg-peach/25",
  periwinkle: "bg-periwinkle/25",
};

interface Props {
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  size?: "sm" | "md";
  variant?: "tinted" | "badge";
  className?: string;
}

export function CardIcon({
  icon: Icon,
  tone,
  size = "md",
  variant = "tinted",
  className,
}: Props) {
  const dims = size === "sm" ? "size-6 rounded-md" : "size-7 rounded-md";
  const iconSize = size === "sm" ? "size-3.5" : "size-4";
  const bg =
    variant === "badge"
      ? "bg-card shadow-sm border border-border/40"
      : TONE_BG[tone];
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center", dims, bg, className)}
    >
      <Icon className={cn(iconSize, CARD_ICON_TEXT[tone])} />
    </span>
  );
}
