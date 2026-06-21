/**
 * Shared formatting for the Logs Hub tables (Export, Patient Access, Communications,
 * …) so every log reads its timestamps identically. One helper, every log.
 */

/** A log timestamp: "21 Jun 2026, 14:32" (UK, 24h). */
export function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
