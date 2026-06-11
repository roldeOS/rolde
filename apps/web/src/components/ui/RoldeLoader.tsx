import { cn } from "@/lib/utils";

/**
 * RoldeLoader — the brand spinner (Roland 2026-06-11). The wordmark "rolde" is
 * DRAWN one letter at a time: each glyph's outline traces, then fills, then the
 * next begins. Use ANYWHERE a generic spinner would go — though it should be a
 * RARE sight (the app is text-light-and-fast; this is for cold boot + heavy
 * media like dermatology images).
 */
const LETTERS = [
  { ch: "r", x: 36, delay: 0 },
  { ch: "o", x: 57, delay: 0.13 },
  { ch: "l", x: 72, delay: 0.26 },
  { ch: "d", x: 92, delay: 0.39 },
  { ch: "e", x: 112, delay: 0.52 },
];

export function RoldeLoader({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 150 52"
      role="status"
      aria-label={label}
      className={cn("h-10 w-auto text-foreground", className)}
    >
      {LETTERS.map((l) => (
        <text
          key={l.ch}
          x={l.x}
          y="38"
          textAnchor="middle"
          className="rolde-letter"
          style={{
            animationDelay: `${l.delay}s`,
            fontFamily: "var(--font-wordmark), Georgia, serif",
            fontSize: "40px",
            fontWeight: 600,
          }}
        >
          {l.ch}
        </text>
      ))}
    </svg>
  );
}
