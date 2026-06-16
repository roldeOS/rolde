/**
 * Per-role module access (Bible 4.1 § access matrix; W1.1.7 per-role gating).
 * Which clinic-staff roles may use each clinic module. A role absent from a
 * module's list is BLOCKED — the nav item is hidden AND the page is guarded
 * (hiding alone is not security). Custodians use the Control console, not this
 * clinic nav; Patients use the portal. Pure + client-safe (no server imports).
 *
 * These are sensible defaults derived from the matrix — Roland can tune any cell.
 */
export const MODULE_ACCESS: Record<string, readonly string[] | "all"> = {
  dashboard: "all",
  legal: "all",
  patients: ["caretaker", "curator", "concierge", "clinician", "locum", "nurse", "chemist", "cunnere"],
  calendar: ["caretaker", "curator", "concierge", "clinician", "locum", "nurse"],
  investigations: ["caretaker", "clinician", "locum", "nurse", "cunnere"],
  prescribing: ["caretaker", "clinician", "locum", "chemist"],
  letters: ["caretaker", "clinician", "locum", "nurse"],
  billing: ["caretaker", "curator", "concierge", "cofferer"],
  reports: ["caretaker", "curator", "cofferer"],
  settings: ["caretaker", "curator"],
};

export function roleCanAccess(role: string | undefined, moduleKey: string): boolean {
  const allow = MODULE_ACCESS[moduleKey];
  if (!allow) return false; // unknown module → deny by default
  if (allow === "all") return true;
  return !!role && allow.includes(role);
}
