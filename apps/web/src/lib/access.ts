/**
 * Per-role module access (Bible 4.1 + Roland's detailed rules, 2026-06-16).
 *
 * - Clinical roles (Curator, Clinician, Clinician-Locum, Practitioner, Nurse,
 *   Chemist, Cunnere) share EQUAL access to all medical records + notes.
 * - Caretaker is God for the clinic; CodeWright (IT) reaches ALL areas (but
 *   clinical ACTIONS — prescribing, ordering tests — are separately gated, and
 *   every patient-record access is audit-logged).
 * - Concierge: front desk — patient list + records (to print), calendar, billing.
 *   No labs, no test requests, no prescribing.
 * - Cofferer: accounts only — billing/invoices. Not even the patient list.
 * - Prescribing is NOT role-based: it needs the caretaker-set `prescribing_rights`
 *   flag. Even a doctor can't prescribe without it (a medical student, say).
 *
 * Hiding the nav is only UX — the page guard (requireModuleAccess / requirePrescriber)
 * is the real gate. Pure + client-safe (no server imports).
 */
const MEDICAL = [
  "caretaker",
  "curator",
  "clinician",
  "locum",
  "practitioner",
  "nurse",
  "chemist",
  "cunnere",
  "codewright",
] as const;

export const MODULE_ACCESS: Record<string, readonly string[] | "all"> = {
  dashboard: "all",
  legal: "all",
  patients: [...MEDICAL, "concierge"],
  calendar: [...MEDICAL, "concierge"],
  investigations: MEDICAL,
  letters: MEDICAL,
  billing: ["caretaker", "curator", "concierge", "cofferer", "codewright"],
  reports: ["caretaker", "curator", "codewright"],
  settings: ["caretaker", "curator", "codewright"],
  // Logs Hub — the audit shelf. Caretaker-ONLY (Roland: "only a caretaker gets to
  // see the Logs"). Custodian reads platform-wide via their own area. Logging is
  // role-blind (every role's actions are recorded); this gates only the READING.
  logs: ["caretaker"],
  // prescribing — gated by the prescribing_rights flag (canPrescribe), not here.
};

/** Roles that may be GRANTED prescribing rights by their caretaker. */
const PRESCRIBER_ROLES = ["caretaker", "clinician", "locum", "practitioner", "nurse"];

export function roleCanAccess(role: string | undefined, moduleKey: string): boolean {
  if (moduleKey === "prescribing") return false; // gated separately, by the flag
  const allow = MODULE_ACCESS[moduleKey];
  if (!allow) return false; // unknown module → deny by default
  if (allow === "all") return true;
  return !!role && allow.includes(role);
}

/**
 * Prescribing — the caretaker-controlled safety gate (Roland 2026-06-16):
 * the role must be a clinical one AND hold the caretaker-set prescribing_rights.
 */
export function canPrescribe(
  role: string | undefined,
  prescribingRights: boolean | undefined,
): boolean {
  return !!prescribingRights && PRESCRIBER_ROLES.includes(role ?? "");
}
