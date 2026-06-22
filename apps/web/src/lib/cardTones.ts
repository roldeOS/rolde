import type { CardIconTone } from "@/components/ui/CardIcon";

/**
 * The ONE card-tone system, shared by every card surface (URDS §8.1) — the hub
 * counter cards (SectionHubGrid), the Dashboard stat tiles (StatTile), anywhere a
 * tone-washed card lives. One source of truth = universal + consistent (Roland
 * 2026-06-22: "anywhere there is a card, we implement this").
 *
 * COLOUR LAW: a FLAT solid tint of the hue (never a fade-to-transparent gradient —
 * that reads dead), pastel, never fluorescent; deepens on hover. Calibrated per hue
 * (saturated hues lighter, pale hues heavier) so every card reads alive.
 */
export const CARD_WASH: Record<CardIconTone, string> = {
  critical: "bg-coral/[0.18] hover:bg-coral/[0.28]",
  warning: "bg-honey/[0.26] hover:bg-honey/[0.38]",
  success: "bg-bloom/[0.55] hover:bg-bloom/[0.72]",
  info: "bg-info/[0.20] hover:bg-info/[0.32]",
  accent: "bg-bloom/[0.55] hover:bg-bloom/[0.72]",
  neutral: "bg-lavender/[0.55] hover:bg-lavender/[0.72]",
  brand: "bg-cream/70 hover:bg-cream/90",
  rose: "bg-rose/[0.30] hover:bg-rose/[0.44]",
  sky: "bg-sky/[0.38] hover:bg-sky/[0.54]",
  teal: "bg-teal/[0.38] hover:bg-teal/[0.54]",
  peach: "bg-peach/[0.38] hover:bg-peach/[0.54]",
  periwinkle: "bg-periwinkle/[0.42] hover:bg-periwinkle/[0.58]",
};

/**
 * The ICON colour per tone — what a CardIcon's glyph is tinted, and what the
 * breadcrumb crumb-icon mirrors so it matches its page (Roland 2026-06-22).
 */
export const CARD_ICON_TEXT: Record<CardIconTone, string> = {
  critical: "text-critical",
  warning: "text-warning",
  success: "text-success",
  info: "text-info",
  accent: "text-accent",
  neutral: "text-slate-600",
  brand: "text-foreground",
  rose: "text-rose-700",
  sky: "text-sky-700",
  teal: "text-teal-700",
  peach: "text-orange-700",
  periwinkle: "text-indigo-600",
};

/** The hero-value (big number / stat) colour per tone — a darker shade of the hue. */
export const CARD_VALUE: Record<CardIconTone, string> = {
  critical: "text-rose-700",
  warning: "text-amber-800",
  success: "text-emerald-800",
  info: "text-sky-700",
  accent: "text-emerald-800",
  neutral: "text-violet-800",
  brand: "text-amber-900",
  rose: "text-rose-700",
  sky: "text-sky-800",
  teal: "text-teal-800",
  peach: "text-orange-800",
  periwinkle: "text-indigo-700",
};
