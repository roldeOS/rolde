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

const TONES: Record<CardIconTone, { bg: string; text: string }> = {
  critical: { bg: "bg-critical/10", text: "text-critical" },
  warning:  { bg: "bg-warning/12",  text: "text-warning" },
  success:  { bg: "bg-success/10",  text: "text-success" },
  info:     { bg: "bg-info/10",     text: "text-info" },
  accent:   { bg: "bg-accent/15",   text: "text-accent" },
  neutral:  { bg: "bg-slate-500/10", text: "text-slate-600" },
  brand:    { bg: "bg-foreground/8", text: "text-foreground" },
  rose:       { bg: "bg-rose/20",       text: "text-rose-700" },
  sky:        { bg: "bg-sky/25",        text: "text-sky-700" },
  teal:       { bg: "bg-teal/25",       text: "text-teal-700" },
  peach:      { bg: "bg-peach/25",      text: "text-orange-700" },
  periwinkle: { bg: "bg-periwinkle/25", text: "text-indigo-600" },
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
  const t = TONES[tone];
  const dims = size === "sm" ? "size-6 rounded-md" : "size-7 rounded-md";
  const iconSize = size === "sm" ? "size-3.5" : "size-4";
  const bg =
    variant === "badge" ? "bg-card shadow-sm border border-border/40" : t.bg;
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center", dims, bg, className)}
    >
      <Icon className={cn(iconSize, t.text)} />
    </span>
  );
}
