import {
  Blocks,
  Building2,
  Send,
  Palette,
  Hash,
  LayoutPanelTop,
  DoorOpen,
  UsersRound,
  Stethoscope,
  FileText,
  MailCheck,
  BadgePoundSterling,
  Coins,
  Plug,
  Globe,
  LayoutTemplate,
  MonitorSmartphone,
  Images,
} from "lucide-react";
import type { CardIconTone } from "@/components/ui/CardIcon";

/**
 * The Caretaker Settings registry — one entry per section (Bible 4.3 §5 +
 * 4.8 §15.2/§15.6). The hub (`/settings`) renders cards from this list, grouped;
 * the dynamic scaffold (`/settings/[section]`) renders an honest "Coming Next"
 * page for any section whose real module isn't built yet. When a section ships,
 * give it a static segment (e.g. `settings/ward-map/page.tsx` — it overrides the
 * dynamic route) and flip its `status` to "ready" so the "Coming Next" pill drops.
 *
 * Titles + groups are Title Case (APPROVALS §2.3); blurbs are sentences (exempt).
 */

export type SettingsSection = {
  key: string;
  title: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  source: string; // owning Bible — shown on the section scaffold
  status: "ready" | "soon";
  group: SettingsGroup;
};

export const SETTINGS_GROUPS = [
  "Your Clinic",
  "Spaces & People",
  "Clinical & Services",
  "Money & Growth",
] as const;
export type SettingsGroup = (typeof SETTINGS_GROUPS)[number];

export const SETTINGS_SECTIONS: SettingsSection[] = [
  // — Your Clinic —
  {
    key: "profile",
    title: "Clinic Profile",
    blurb:
      "Your clinic's name, contact details and regulator registrations — the identity shown across RolDe OS, invoices and letters.",
    icon: Building2,
    tone: "brand",
    source: "Bible 4.3 §5",
    status: "ready",
    group: "Your Clinic",
  },
  {
    key: "branding",
    title: "Branding & Accent",
    blurb:
      "The sunny accent colour for your sidebar and highlights — make RolDe OS feel like yours.",
    icon: Palette,
    tone: "periwinkle",
    source: "Bible 4.2 §1.10 / APPROVALS §3.1",
    status: "soon",
    group: "Your Clinic",
  },
  {
    key: "numbering",
    title: "Patient Numbering",
    blurb:
      "How patient numbers are formatted — a prefix and the number to start from.",
    icon: Hash,
    tone: "rose",
    source: "Bible 4.4 §2",
    status: "soon",
    group: "Your Clinic",
  },
  // — Spaces & People —
  {
    key: "ward-map",
    title: "Ward Map",
    blurb:
      "Draw your clinic's layout — rooms, beds and chairs — for the live ward board.",
    icon: LayoutPanelTop,
    tone: "sky",
    source: "Bible 4.8 §15.6",
    status: "soon",
    group: "Spaces & People",
  },
  {
    key: "rooms",
    title: "Rooms & Hours",
    blurb:
      "Your consulting rooms and opening hours, used across the calendar.",
    icon: DoorOpen,
    tone: "teal",
    source: "Bible 4.4 §3",
    status: "soon",
    group: "Spaces & People",
  },
  {
    key: "users",
    title: "Users & Roles",
    blurb: "Invite your team and set what each person can see and do.",
    icon: UsersRound,
    tone: "peach",
    source: "Bible 4.3 §5",
    status: "ready",
    group: "Spaces & People",
  },
  // — Clinical & Services —
  {
    key: "courier",
    title: "RolDe Courier",
    blurb:
      "How your clinic sends — the address book Courier delivers to (GP practices, pharmacies, labs), secure-link defaults, countersigning, delegated sending and quiet hours.",
    icon: Send,
    tone: "accent",
    source: "Bible 4.8 §15.7c (Courier C2)",
    status: "ready",
    group: "Clinical & Services",
  },
  {
    key: "photo-protocols",
    title: "Photo Protocols",
    blurb:
      "The angle sets your clinic shoots for before/after photos — name them and list the views (any count). They drive the capture grid and how photos pair up.",
    icon: Images,
    tone: "teal",
    source: "Bible 4.8 §15.5 (Photo tool, multi-angle B)",
    status: "ready",
    group: "Clinical & Services",
  },
  {
    key: "patient-portal",
    title: "Patient Portal",
    blurb:
      "Let patients see their own record — approved notes, photos and profile — on a secure page. Switch it on per clinic and choose how patients get access.",
    icon: MonitorSmartphone,
    tone: "info",
    source: "Bible 4.8 §15.5 (Patient Portal P1)",
    status: "ready",
    group: "Clinical & Services",
  },
  {
    key: "templates",
    title: "Scribe Templates",
    blurb:
      "The clinic's documentation library — the templates your team fills (only the Caretaker designs them), what's active, and the body-map colour legend that names each pin colour on the record.",
    icon: LayoutTemplate,
    tone: "periwinkle",
    source: "Bible 4.8 §15.7 (Scribe T3)",
    status: "ready",
    group: "Clinical & Services",
  },
  {
    key: "clinical-modules",
    title: "Clinical Modules",
    blurb:
      "Which clinical tools your clinic uses — Lab, Radiology, Procedures, Prescribing and RolDe AI. Switch off what you don't do and it stays out of sight for your whole team.",
    icon: Blocks,
    tone: "sky",
    source: "Bible 4.8 §W1.1 / APPROVALS §4.2",
    status: "ready",
    group: "Clinical & Services",
  },
  {
    key: "services",
    title: "Services & Pricing",
    blurb: "The treatments and services you offer, with their prices.",
    icon: Stethoscope,
    tone: "success",
    source: "Bible 4.4 §3",
    status: "ready",
    group: "Clinical & Services",
  },
  {
    key: "templates",
    title: "Templates",
    blurb:
      "Reusable note, letter and consent templates your team starts from.",
    icon: FileText,
    tone: "neutral",
    source: "Bible 4.6",
    status: "soon",
    group: "Clinical & Services",
  },
  {
    key: "email",
    title: "Email Templates",
    blurb:
      "The operational emails your clinic sends patients — reminders, results, follow-ups, issue notices. Never marketing.",
    icon: MailCheck,
    tone: "info",
    source: "Bible 4.4 §6 / 4.8 §15.5",
    status: "ready",
    group: "Clinical & Services",
  },
  // — Money & Growth —
  {
    key: "commercial",
    title: "Commercial Settings",
    blurb:
      "Your money policy — tax, deposits, consultation credit and discount codes. Switch on only what your clinic uses; everything else stays out of sight.",
    icon: Coins,
    tone: "success",
    source: "Bible 4.8 §W1.1.16",
    status: "ready",
    group: "Money & Growth",
  },
  {
    key: "memberships",
    title: "Memberships & Packages",
    blurb: "Recurring plans and multi-session packages for your patients.",
    icon: BadgePoundSterling,
    tone: "rose",
    source: "Bible 4.3 §4",
    status: "soon",
    group: "Money & Growth",
  },
  {
    key: "integrations",
    title: "Integrations",
    blurb:
      "Connect your own payment gateway, SMS and pharmacy partners. RolDe OS takes 0% — you keep every penny.",
    icon: Plug,
    tone: "teal",
    source: "Bible 4.3 §4.6",
    status: "soon",
    group: "Money & Growth",
  },
  {
    key: "website",
    title: "Website & Domain",
    blurb: "Build a simple clinic site and connect your own domain.",
    icon: Globe,
    tone: "periwinkle",
    source: "Bible 4.8 §15.5",
    status: "soon",
    group: "Money & Growth",
  },
];

export function getSection(key: string): SettingsSection | undefined {
  return SETTINGS_SECTIONS.find((s) => s.key === key);
}
