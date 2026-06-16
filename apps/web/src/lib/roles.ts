/**
 * The RolDe OS role lexicon — each role's NAME, the meaning of the word itself
 * (its origin), what they DO, and where they sit in the hierarchy of stewardship.
 * One source of truth for the "Who's Who" glossary (so a newcomer who meets
 * "Cunnere" or "CodeWright" instantly gets it) and, later, role gating.
 * Order within a tier is intentional (Roland 2026-06-16).
 */
export type RoleTier = "platform" | "clinic-lead" | "clinic-team" | "patient";

export type RoleDef = {
  key: string;
  label: string;
  /** What the word itself means — its origin. */
  origin: string;
  /** What they do. */
  meaning: string;
  tier: RoleTier;
  /** Not yet a live role — documented ahead of W1.6.2. */
  soon?: boolean;
};

export const ROLES: RoleDef[] = [
  {
    key: "custodian",
    label: "Custodian",
    origin: "Latin custos — a guardian, a keeper",
    meaning: "Looks after the whole RolDe OS.",
    tier: "platform",
  },
  {
    key: "caretaker",
    label: "Caretaker",
    origin: "English — one who takes care",
    meaning: "Runs a clinic — its people, settings and money.",
    tier: "clinic-lead",
  },
  {
    key: "curator",
    label: "Curator",
    origin: "Latin curare — to care for",
    meaning: "Practice manager; day-to-day operations.",
    tier: "clinic-team",
  },
  {
    key: "clinician",
    label: "Clinician",
    origin: "Greek klinikos — at the bedside",
    meaning: "Doctor; sees patients and writes the clinical record.",
    tier: "clinic-team",
  },
  {
    key: "locum",
    label: "Clinician — Locum",
    origin: "Latin locum tenens — holding the place",
    meaning: "A visiting clinician, with access for a set period.",
    tier: "clinic-team",
  },
  {
    key: "nurse",
    label: "Nurse",
    origin: "Latin nutrire — to nourish",
    meaning: "Nursing care, observations and procedures.",
    tier: "clinic-team",
  },
  {
    key: "chemist",
    label: "Chemist",
    origin: "from alchemist — a pharmacist",
    meaning: "Pharmacist; medicines and dispensing.",
    tier: "clinic-team",
  },
  {
    key: "cunnere",
    label: "Cunnere",
    origin: "Old English — one who tests",
    meaning: "Lab Technician; investigations and results.",
    tier: "clinic-team",
  },
  {
    key: "cofferer",
    label: "Cofferer",
    origin: "keeper of the coffer — the treasury",
    meaning: "Accounts and finance.",
    tier: "clinic-team",
  },
  {
    key: "concierge",
    label: "Concierge",
    origin: "French — keeper of the keys",
    meaning: "Front desk — bookings, registration and payments.",
    tier: "clinic-team",
  },
  {
    key: "codewright",
    label: "CodeWright",
    origin: "wright — Old English for a maker, a mender",
    meaning: "IT Support — fixes the clinic's tech, the digital handyperson.",
    tier: "clinic-team",
    soon: true,
  },
  {
    key: "patient",
    label: "Patient",
    origin: "Latin patiens — one who endures",
    meaning: "The person receiving care.",
    tier: "patient",
  },
];

export const TIER_ORDER: RoleTier[] = ["platform", "clinic-lead", "clinic-team", "patient"];

export const TIER_LABEL: Record<RoleTier, string> = {
  platform: "Platform",
  "clinic-lead": "Clinic Lead",
  "clinic-team": "Clinic Team",
  patient: "Patient",
};
