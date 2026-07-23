import {
  FileClock,
  Activity,
  ShieldCheck,
  FileSearch,
  Send,
  FileCheck,
  ShieldQuestion,
  Pill,
  Radio,
} from "lucide-react";
import type { HubSection } from "@/components/ui/SectionHubGrid";

/**
 * The Logs Hub registry (URDS §9.5 logs family; Bible 4.1 §5.4 / 4.3 §5.12). The
 * Caretaker's audit shelf — one card per log stream. Each card lights up as its
 * module is built (honest "Coming Next" until then); a shipped log gets a static
 * segment (e.g. `logs/exports/page.tsx`) and flips to `status: "ready"`.
 *
 * Access is Caretaker-only (Roland: "only a caretaker gets to see the Logs");
 * Custodian reads platform-wide. Logging itself is role-blind — every role's
 * actions are recorded; this hub is only the READING surface.
 *
 * Titles + groups are Title Case (APPROVALS §2.3); blurbs are sentences (exempt).
 */

export type LogSection = HubSection & { source: string };

export const LOG_GROUPS = [
  "Activity & Security",
  "Records & Access",
  "Data & Compliance",
] as const;
export type LogGroup = (typeof LOG_GROUPS)[number];

export const LOG_SECTIONS: LogSection[] = [
  // — Activity & Security —
  {
    key: "activity",
    title: "Activity Log",
    blurb:
      "Every significant action in your clinic — who did what, to which record, and when.",
    icon: Activity,
    tone: "brand",
    source: "Bible 4.1 §5.4 / 4.3 §5.12",
    status: "ready",
    group: "Activity & Security",
  },
  {
    key: "sign-in",
    title: "Sign-in & Security",
    blurb:
      "Logins, sign-outs, failed attempts and password changes — your clinic's security trail.",
    icon: ShieldCheck,
    tone: "info",
    source: "Bible 4.1 §5.4 / §13",
    status: "ready",
    group: "Activity & Security",
  },
  {
    key: "realtime",
    title: "Realtime",
    blurb:
      "Live-feed drop-outs in your clinic — when a clinician's real-time updates paused and fell back to refresh-on-focus.",
    icon: Radio,
    tone: "periwinkle",
    source: "Live Feed 2026-07-23",
    status: "ready",
    group: "Activity & Security",
  },
  // — Records & Access —
  {
    key: "access",
    title: "Patient Access",
    blurb:
      "Who opened which patient record, and when — the clinical-governance trail every patient can ask about.",
    icon: FileSearch,
    tone: "sky",
    source: "W1.1.7 §6.14",
    status: "ready",
    group: "Records & Access",
  },
  {
    key: "communications",
    title: "Communications",
    blurb:
      "Every operational email your clinic sent a patient, with its delivery and open status.",
    icon: Send,
    tone: "teal",
    source: "Bible 4.4 §6",
    status: "ready",
    group: "Records & Access",
  },
  // — Data & Compliance —
  {
    key: "exports",
    title: "Export Log",
    blurb:
      "Every PDF and CSV exported from your clinic — who, when, what — with the original file kept.",
    icon: FileClock,
    tone: "periwinkle",
    source: "URDS §9.5",
    status: "ready",
    group: "Data & Compliance",
  },
  {
    key: "consent",
    title: "Consent & Legal",
    blurb:
      "Which policy and consent version each patient accepted, and when — the lawful-basis record.",
    icon: FileCheck,
    tone: "success",
    source: "Bible 4.0 / Legal & Safety",
    status: "soon",
    group: "Data & Compliance",
  },
  {
    key: "data-rights",
    title: "Data Rights",
    blurb:
      "Subject-access and erasure requests, and exactly how each one was handled.",
    icon: ShieldQuestion,
    tone: "warning",
    source: "Bible 4.3 §15 / UK GDPR",
    status: "soon",
    group: "Data & Compliance",
  },
  {
    key: "prescribing",
    title: "Prescribing Log",
    blurb:
      "Every prescription issued, approved or cancelled — the controlled-drug oversight trail.",
    icon: Pill,
    tone: "rose",
    source: "Bible 4.5",
    status: "soon",
    group: "Data & Compliance",
  },
];

export function getLogSection(key: string): LogSection | undefined {
  return LOG_SECTIONS.find((s) => s.key === key);
}
