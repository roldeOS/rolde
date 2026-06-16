import {
  ShieldCheck,
  KeyRound,
  ClipboardList,
  Stethoscope,
  CalendarClock,
  HeartPulse,
  Pill,
  FlaskConical,
  Coins,
  ConciergeBell,
  Wrench,
  HeartHandshake,
} from "lucide-react";
import type { CardIconTone } from "@/components/ui/CardIcon";

/**
 * The RolDe OS role lexicon — each role's NAME, its icon, the origin of the word
 * (dictionary-style: source, root, gloss — Roland 2026-06-16), what they DO, and
 * where it sits in the hierarchy. One source of truth for the "Who's Who"
 * glossary and, later, role gating. Order within a tier is intentional.
 */
export type RoleTier = "platform" | "clinic-lead" | "clinic-team" | "patient";

export type RoleDef = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  /** Where the word comes from — dictionary style. */
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
    icon: ShieldCheck,
    tone: "brand",
    origin: "Latin custos — ‘a guardian’",
    meaning: "Looks after the whole RolDe OS.",
    tier: "platform",
  },
  {
    key: "caretaker",
    label: "Caretaker",
    icon: KeyRound,
    tone: "warning",
    origin: "English — ‘one who takes care’",
    meaning: "Runs a clinic — its people, settings and money.",
    tier: "clinic-lead",
  },
  {
    key: "curator",
    label: "Curator",
    icon: ClipboardList,
    tone: "neutral",
    origin: "Latin curare — ‘to care for’",
    meaning: "Practice manager; day-to-day operations.",
    tier: "clinic-team",
  },
  {
    key: "clinician",
    label: "Clinician",
    icon: Stethoscope,
    tone: "success",
    origin: "Greek klinikos — ‘at the bedside’",
    meaning: "Doctor; sees patients and writes the clinical record.",
    tier: "clinic-team",
  },
  {
    key: "locum",
    label: "Clinician — Locum",
    icon: CalendarClock,
    tone: "success",
    origin: "Latin locum tenens — ‘place-holder’",
    meaning: "A visiting clinician, with access for a set period.",
    tier: "clinic-team",
  },
  {
    key: "nurse",
    label: "Nurse",
    icon: HeartPulse,
    tone: "critical",
    origin: "Latin nutrire — ‘to nourish’",
    meaning: "Nursing care, observations and procedures.",
    tier: "clinic-team",
  },
  {
    key: "chemist",
    label: "Chemist",
    icon: Pill,
    tone: "warning",
    origin: "from alchemist — Arabic al-kīmiyāʾ",
    meaning: "Pharmacist; medicines and dispensing.",
    tier: "clinic-team",
  },
  {
    key: "cunnere",
    label: "Cunnere",
    icon: FlaskConical,
    tone: "success",
    origin: "Old English cunnan — ‘to test’",
    meaning: "Lab Technician; investigations and results.",
    tier: "clinic-team",
  },
  {
    key: "cofferer",
    label: "Cofferer",
    icon: Coins,
    tone: "warning",
    origin: "Old French cofre — ‘a treasure chest’",
    meaning: "Accounts and finance.",
    tier: "clinic-team",
  },
  {
    key: "concierge",
    label: "Concierge",
    icon: ConciergeBell,
    tone: "neutral",
    origin: "French — ‘keeper of the keys’",
    meaning: "Front desk — bookings, registration and payments.",
    tier: "clinic-team",
  },
  {
    key: "codewright",
    label: "CodeWright",
    icon: Wrench,
    tone: "brand",
    origin: "Wright — Old English for ‘a maker’",
    meaning: "IT Support — fixes the clinic's tech, the digital handyperson.",
    tier: "clinic-team",
    soon: true,
  },
  {
    key: "patient",
    label: "Patient",
    icon: HeartHandshake,
    tone: "critical",
    origin: "Latin patiens — ‘one who endures’",
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
