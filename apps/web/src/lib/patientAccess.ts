/**
 * Patient Access — the shared purpose vocabulary for the break-glass trail
 * (Bible 4.8 §15.7b Phase 2). ONE source so the capture (lib/audit), the chip,
 * the server action, and the log table can never drift. Not server-only — the
 * client break-glass chip imports the labels + options.
 */

export const ACCESS_PURPOSES = [
  "direct_care",
  "administrative",
  "records_request",
  "safeguarding",
  "emergency",
  "other",
] as const;
export type AccessPurpose = (typeof ACCESS_PURPOSES)[number];

/** Plain-English label for the log screen + the auditor's export. */
export const ACCESS_PURPOSE_LABEL: Record<AccessPurpose, string> = {
  direct_care: "Direct care",
  administrative: "Administrative",
  records_request: "Records request",
  safeguarding: "Safeguarding",
  emergency: "Emergency access",
  other: "Other",
};

/**
 * The non-blocking break-glass chip's options — the reason a user picks when they
 * open a record they have NO existing care link to. Each maps to a purpose; "other"
 * additionally asks for a free-text reason.
 */
export const BREAK_GLASS_OPTIONS: { purpose: AccessPurpose; label: string }[] = [
  { purpose: "direct_care", label: "Continuing care" },
  { purpose: "records_request", label: "Records / SAR request" },
  { purpose: "safeguarding", label: "Safeguarding" },
  { purpose: "administrative", label: "Administrative" },
  { purpose: "other", label: "Other…" },
];

export function isAccessPurpose(v: unknown): v is AccessPurpose {
  return typeof v === "string" && (ACCESS_PURPOSES as readonly string[]).includes(v);
}

/** How a purpose reads on screen/export, accounting for pending break-glass rows. */
export function accessPurposeLabel(
  purpose: string | null,
  breakGlass: boolean,
): string {
  if (isAccessPurpose(purpose)) return ACCESS_PURPOSE_LABEL[purpose];
  // No purpose recorded: a break-glass access whose reason was never given is the
  // auditor's red flag; a non-break-glass null is just a legacy pre-migration row.
  return breakGlass ? "Break-glass — reason not given" : "—";
}
