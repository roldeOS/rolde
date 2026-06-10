/**
 * RolDe typography — the 5-tier system, inherited from the Roland Design System
 * (mindate dashboard, Roland 2026-05-13).
 *
 * FONT LAW (Roland 2026-06-10, APPROVALS §2): Inter EVERYWHERE — headings
 * included (`font-heading` resolves to Inter). IBM Plex Serif exists ONLY as
 * `font-wordmark`, reserved for the RolDe wordmark/icon. Never use it elsewhere.
 *
 * RULES (carried over verbatim):
 *   - No `text-base`, no `text-xl`, no arbitrary `text-[Npx]` sizes.
 *   - Card titles use Title; body uses Body; metrics use Metric.
 *   - Section labels = Caption + `font-medium uppercase tracking-wider`.
 */
export const TYPE = {
  /** 30px semibold — page H1 only (patient name, "Patients", greeting). */
  display: "font-heading text-3xl font-semibold tracking-tight",

  /** 18px semibold — card titles, modal headings. Bound into Card. */
  title: "font-heading text-lg font-semibold tracking-tight",

  /** 24px semibold tabular-nums — big numbers (counts, scores, NEWS2). */
  metric: "text-2xl font-semibold tabular-nums",

  /** 14px regular — body copy, table cells, descriptions, button labels. */
  body: "text-sm",

  /** 12px regular — helper text, table headers, chips, section labels. */
  caption: "text-xs",
} as const;

export type TypeToken = keyof typeof TYPE;
