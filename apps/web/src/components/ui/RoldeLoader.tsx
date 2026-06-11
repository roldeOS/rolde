import { cn } from "@/lib/utils";

/**
 * RoldeLoader — the brand spinner (Roland 2026-06-11). The wordmark "rolde" is
 * TRACED into existence (the stroke draws, then the letters fill), looping.
 * Use ANYWHERE a generic loading spinner would otherwise go.
 */
export function RoldeLoader({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 170 56"
      role="status"
      aria-label={label}
      className={cn("h-10 w-auto text-foreground", className)}
    >
      <text
        x="85"
        y="40"
        textAnchor="middle"
        className="rolde-trace"
        style={{
          fontFamily: "var(--font-wordmark), Georgia, serif",
          fontSize: "40px",
          fontWeight: 600,
          letterSpacing: "0.5px",
        }}
      >
        rolde
      </text>
    </svg>
  );
}
