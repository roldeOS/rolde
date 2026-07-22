import { cn } from "@/lib/utils";

/**
 * Meter — the shared horizontal utilisation bar (URDS §8.x, Roland 2026-07-22).
 * A calm, flat, rounded track with a semantic-tone fill for any 0–100 proportion
 * — storage headroom, quota use, a completion ratio. Flat tint, never a gradient
 * (the card colour law); the fill hue carries the clinical meaning (sage = fine,
 * amber = plan, coral = act). Accessible as a progressbar. An optional marker
 * draws a hairline at a threshold (e.g. a target line).
 */
export type MeterTone = "success" | "warning" | "critical" | "info" | "neutral";

const FILL: Record<MeterTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  critical: "bg-critical",
  info: "bg-info",
  neutral: "bg-foreground/40",
};

export function Meter({
  value,
  tone = "neutral",
  label,
  markerAt,
  className,
}: {
  /** 0–100. Clamped. */
  value: number;
  tone?: MeterTone;
  /** Screen-reader label for the bar. */
  label?: string;
  /** Optional hairline marker at a 0–100 position (e.g. a target line). */
  markerAt?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", FILL[tone])}
        // A sliver stays visible for any non-zero use, so "barely used" never
        // reads as "empty/broken".
        style={{ width: pct > 0 ? `max(${pct}%, 0.375rem)` : "0%" }}
      />
      {markerAt != null && (
        <div
          className="absolute inset-y-0 w-px bg-foreground/25"
          style={{ left: `${Math.max(0, Math.min(100, markerAt))}%` }}
        />
      )}
    </div>
  );
}
