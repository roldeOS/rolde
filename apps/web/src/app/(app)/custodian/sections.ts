import {
  LayoutDashboard,
  Building2,
  MessagesSquare,
  LifeBuoy,
  SlidersHorizontal,
  Scale,
  MailCheck,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import type { CardIconTone } from "@/components/ui/CardIcon";

/**
 * The Custodian console registry (Bible 4.8 §16, W1.5.2). The God-View is the
 * platform owner's surface — a DISTINCT shell, not the clinic-operator UI.
 *
 *  - CONTROL_NAV  — the sidebar: the God-View surfaces + a single "Control" menu.
 *  - CONTROL_HUB  — the cards inside Control (/custodian/control): the platform
 *    levers the Custodian owns. Control is the Custodian's equivalent of a
 *    clinic's Settings — one destination that gathers everything he changes
 *    across the clinics, instead of scattering it (Roland 2026-06-16).
 *
 * Unbuilt surfaces render an honest "Coming Next" scaffold via `/custodian/[section]`
 * (a static segment overrides it once shipped); flip `status` to "ready" then.
 */

export type ControlSection = {
  key: string;
  label: string;
  blurb: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  status: "ready" | "soon";
};

/** The Custodian sidebar — God-View surfaces, then the Control menu. */
export const CONTROL_NAV: ControlSection[] = [
  {
    key: "overview",
    label: "Overview",
    blurb: "The whole platform at a glance — clinics, patients, escalations and health.",
    href: "/",
    icon: LayoutDashboard,
    tone: "brand",
    status: "ready",
  },
  {
    key: "clinics",
    label: "Clinics",
    blurb:
      "Every clinic signed up under you — open one for its profile, vitals and concerns, or to message its Caretaker.",
    href: "/custodian/clinics",
    icon: Building2,
    tone: "info",
    status: "soon",
  },
  {
    key: "confer",
    label: "Confer",
    blurb: "Your private conversations with the Caretaker of each clinic. Never patients.",
    href: "/custodian/confer",
    icon: MessagesSquare,
    tone: "success",
    status: "soon",
  },
  {
    key: "concerns",
    label: "Concerns",
    blurb: "Issues escalated to you from the clinics — triage, track and resolve.",
    href: "/custodian/concerns",
    icon: LifeBuoy,
    tone: "warning",
    status: "soon",
  },
  {
    key: "logs",
    label: "Email Log",
    blurb: "Every email the platform has sent, with its delivery status.",
    href: "/custodian/logs",
    icon: ScrollText,
    tone: "neutral",
    status: "ready",
  },
  {
    key: "control",
    label: "Control",
    blurb:
      "The platform levers you edit for the clinics under you — legal documents, email templates and your fellow Custodians.",
    href: "/custodian/control",
    icon: SlidersHorizontal,
    tone: "neutral",
    status: "ready",
  },
];

/** The cards inside Control (/custodian/control) — the levers we actually own. */
export const CONTROL_HUB: ControlSection[] = [
  {
    key: "legal",
    label: "Legal & Safety",
    blurb: "Edit and version the platform's legal and clinical-safety documents.",
    href: "/legal",
    icon: Scale,
    tone: "neutral",
    status: "ready",
  },
  {
    key: "emails",
    label: "Email Templates",
    blurb: "The platform's transactional email templates — auth, invites and notices.",
    href: "/custodian/emails",
    icon: MailCheck,
    tone: "info",
    status: "ready",
  },
  {
    key: "custodians",
    label: "Custodians",
    blurb: "You and your fellow Custodians — names, avatars and mandatory MFA.",
    href: "/custodian/custodians",
    icon: ShieldCheck,
    tone: "brand",
    status: "soon",
  },
];

export function getControlSection(key: string): ControlSection | undefined {
  return [...CONTROL_NAV, ...CONTROL_HUB].find((s) => s.key === key);
}
