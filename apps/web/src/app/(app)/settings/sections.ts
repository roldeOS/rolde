import {
  Building2,
  Palette,
  Hash,
  LayoutPanelTop,
  DoorOpen,
  UsersRound,
  Stethoscope,
  FileText,
  MailCheck,
  BadgePoundSterling,
  Plug,
  Globe,
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
    tone: "info",
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
    tone: "neutral",
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
    tone: "info",
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
    tone: "neutral",
    source: "Bible 4.4 §3",
    status: "soon",
    group: "Spaces & People",
  },
  {
    key: "users",
    title: "Users & Roles",
    blurb: "Invite your team and set what each person can see and do.",
    icon: UsersRound,
    tone: "brand",
    source: "Bible 4.3 §5",
    status: "ready",
    group: "Spaces & People",
  },
  // — Clinical & Services —
  {
    key: "services",
    title: "Services & Pricing",
    blurb: "The treatments and services you offer, with their prices.",
    icon: Stethoscope,
    tone: "success",
    source: "Bible 4.4 §3",
    status: "soon",
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
    key: "memberships",
    title: "Memberships & Packages",
    blurb: "Recurring plans and multi-session packages for your patients.",
    icon: BadgePoundSterling,
    tone: "warning",
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
    tone: "warning",
    source: "Bible 4.3 §4.6",
    status: "soon",
    group: "Money & Growth",
  },
  {
    key: "website",
    title: "Website & Domain",
    blurb: "Build a simple clinic site and connect your own domain.",
    icon: Globe,
    tone: "neutral",
    source: "Bible 4.8 §15.5",
    status: "soon",
    group: "Money & Growth",
  },
];

export function getSection(key: string): SettingsSection | undefined {
  return SETTINGS_SECTIONS.find((s) => s.key === key);
}
