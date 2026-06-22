/**
 * Shared formatting for the Logs Hub tables (Export, Patient Access, Communications,
 * …) so every log reads its timestamps identically. One helper, every log.
 */

/**
 * A precise, unambiguous UTC timestamp for EXPORTS — "2026-06-21 14:32:07 UTC".
 * Auditors need an absolute time (not a viewer's local zone); the on-screen tables
 * keep the friendly `fmtWhen`, every export column uses this.
 */
export function fmtUtc(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, "") + " UTC";
}

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

/**
 * A compact, human "Browser · OS" from a raw user-agent (the Sign-in & Security
 * log's Device column); the full UA stays available on hover. Order matters —
 * Chrome's UA also contains "Safari", so the more specific browsers come first.
 */
export function deviceLabel(ua: string | null | undefined): string {
  if (!ua) return "—";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "";
  const os = /iPhone|iPad|iPod|iOS/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X|Macintosh/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return [browser, os].filter(Boolean).join(" · ") || "Unknown Device";
}
