/**
 * Title-Case display labels for stored record values (URDS + APPROVALS §2.3;
 * Roland 2026-07-03: "why is the s in safety lowercase?"). Chrome NEVER shows
 * a raw stored value — every enum-ish value maps through here to its proper
 * label. CSS text-transform is a last resort for truly dynamic strings, never
 * the mechanism for known values.
 */
export const severityLabel = (v: string): string =>
  ((
    {
      low: "Low",
      moderate: "Moderate",
      severe: "Severe",
      life_threatening: "Life-Threatening",
    } as Record<string, string>
  )[v] ?? v);

export const alertCategoryLabel = (v: string): string =>
  ((
    {
      safety: "Safety",
      clinical: "Clinical",
      infection: "Infection",
      social: "Social",
      other: "Other",
    } as Record<string, string>
  )[v] ?? v);

export const alertPriorityLabel = (v: string): string =>
  ((
    { info: "Info", warning: "Warning", critical: "Critical" } as Record<string, string>
  )[v] ?? v);

export const sexLabel = (v: string): string =>
  ((
    { female: "Female", male: "Male", intersex: "Intersex", unknown: "Unknown" } as Record<
      string,
      string
    >
  )[v] ?? v);

export const problemStatusLabel = (v: string): string =>
  ((
    { active: "Active", resolved: "Resolved", entered_in_error: "Entered In Error" } as Record<
      string,
      string
    >
  )[v] ?? v);
