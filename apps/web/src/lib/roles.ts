/**
 * The RolDe role lexicon — names + plain-English meanings + where each sits in
 * the hierarchy of stewardship. One source of truth for the "Who's Who" glossary
 * (so a newcomer who sees "Cunnere" or "CodeWright" instantly knows what it is)
 * and, later, role-based gating. Meanings are deliberately plain (Bible 4.1 §;
 * design law: instantly clear).
 */
export type RoleTier = "platform" | "clinic-lead" | "clinic-team" | "patient";

export type RoleDef = {
  key: string;
  label: string;
  meaning: string;
  tier: RoleTier;
  /** Not yet a live role — documented ahead of W1.6.2. */
  soon?: boolean;
};

export const ROLES: RoleDef[] = [
  { key: "custodian", label: "Custodian", meaning: "Looks after the whole RolDe platform.", tier: "platform" },
  { key: "caretaker", label: "Caretaker", meaning: "Runs a clinic — its people, settings and money.", tier: "clinic-lead" },
  { key: "curator", label: "Curator", meaning: "Practice manager; day-to-day operations.", tier: "clinic-team" },
  { key: "concierge", label: "Concierge", meaning: "Front desk — bookings, registration and payments.", tier: "clinic-team" },
  { key: "clinician", label: "Clinician", meaning: "Doctor; sees patients and writes the clinical record.", tier: "clinic-team" },
  { key: "locum", label: "Locum", meaning: "A visiting clinician, with access for a set period.", tier: "clinic-team" },
  { key: "nurse", label: "Nurse", meaning: "Nursing care, observations and procedures.", tier: "clinic-team" },
  { key: "chemist", label: "Chemist", meaning: "Pharmacist; medicines and dispensing.", tier: "clinic-team" },
  { key: "cunnere", label: "Cunnere", meaning: "Lab technician; investigations and results.", tier: "clinic-team" },
  { key: "cofferer", label: "Cofferer", meaning: "Accounts and finance.", tier: "clinic-team" },
  { key: "codewright", label: "CodeWright", meaning: "Fixes the clinic's tech — the digital handyperson.", tier: "clinic-team", soon: true },
  { key: "patient", label: "Patient", meaning: "The person receiving care.", tier: "patient" },
];

export const TIER_ORDER: RoleTier[] = ["platform", "clinic-lead", "clinic-team", "patient"];

export const TIER_LABEL: Record<RoleTier, string> = {
  platform: "Platform",
  "clinic-lead": "Clinic Lead",
  "clinic-team": "Clinic Team",
  patient: "Patient",
};
