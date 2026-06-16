import type { CardIconTone } from "@/components/ui/CardIcon";

/**
 * Time-limited access — turn a membership's window (`access_starts_at` /
 * `access_ends_at`, both nullable) into a calm badge (W1.1.7, Roland 2026-06-16).
 * The window is the SOURCE OF TRUTH; access lapses by time, not a cron. Shapes:
 *   - both null              → "Indefinite"
 *   - ends set, in the past  → "Expired"            (the Caretaker still sees them, to re-grant)
 *   - starts set, in future  → "From 29 Aug"
 *   - starts + ends, current → "29–30 Aug"          (a Locum span)
 *   - ends set, current      → "5 days left" / "Until 30 Nov"
 *
 * Dates render in en-GB; once a clinic sets its timezone the formatting can take
 * it. Pure + nowMs-injected so it's deterministic and testable.
 */
export type AccessBadge = { label: string; tone: CardIconTone };

const DAY = 86_400_000;

function fmtDate(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(ms);
}

/** "29–30 Aug" when same month, else "29 Aug – 2 Sep". */
function fmtSpan(startMs: number, endMs: number): string {
  const s = new Date(startMs);
  const e = new Date(endMs);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(e);
    return `${s.getDate()}–${e.getDate()} ${month}`;
  }
  return `${fmtDate(startMs)} – ${fmtDate(endMs)}`;
}

export function accessWindowBadge(
  startsAt: string | null,
  endsAt: string | null,
  nowMs: number,
): AccessBadge {
  const start = startsAt ? Date.parse(startsAt) : null;
  const end = endsAt ? Date.parse(endsAt) : null;

  if (end !== null && end <= nowMs) return { label: "Expired", tone: "critical" };
  if (start !== null && start > nowMs) return { label: `From ${fmtDate(start)}`, tone: "info" };
  if (start !== null && end !== null) return { label: fmtSpan(start, end), tone: "warning" };
  if (end !== null) {
    const days = Math.ceil((end - nowMs) / DAY);
    if (days <= 14) {
      return { label: `${days} day${days === 1 ? "" : "s"} left`, tone: days <= 7 ? "warning" : "neutral" };
    }
    return { label: `Until ${fmtDate(end)}`, tone: "neutral" };
  }
  return { label: "Indefinite", tone: "neutral" };
}
