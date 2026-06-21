import { Activity, ShieldCheck, FileSearch, Send, TriangleAlert, Webhook } from "lucide-react";
import type { HubSection } from "@/components/ui/SectionHubGrid";

/**
 * The Custodian Logs Hub registry — the PLATFORM-wide mirror of the clinic Logs
 * Hub (same SectionHubGrid layout, so the Logs page looks identical for every
 * role; Roland 2026-06-21). The custodian reads across ALL clinics (RLS via
 * is_custodian), so each platform log carries a Clinic column. Cards light up as
 * their stream lands; a shipped one gets a static segment + status "ready".
 */
export type CustodianLogSection = HubSection & { source: string };

export const CUSTODIAN_LOG_GROUPS = [
  "Activity & Security",
  "Records & Access",
  "Platform Health",
] as const;

export const CUSTODIAN_LOG_SECTIONS: CustodianLogSection[] = [
  {
    key: "activity",
    title: "Activity Log",
    blurb: "Every significant action across every clinic — who did what, where, and when.",
    icon: Activity,
    tone: "brand",
    source: "Bible 4.1 §5.4",
    status: "ready",
    group: "Activity & Security",
  },
  {
    key: "sign-in",
    title: "Sign-in & Security",
    blurb: "Logins, failed attempts and sessions across the platform — the security record.",
    icon: ShieldCheck,
    tone: "info",
    source: "Bible 4.1 §13",
    status: "soon",
    group: "Activity & Security",
  },
  {
    key: "access",
    title: "Patient Access",
    blurb: "Who opened which patient record, in which clinic, and when — the governance trail.",
    icon: FileSearch,
    tone: "info",
    source: "W1.1.7 §6.14",
    status: "ready",
    group: "Records & Access",
  },
  {
    key: "communications",
    title: "Communications",
    blurb: "Every email RolDe OS sent — across all clinics — with its delivery and open status.",
    icon: Send,
    tone: "neutral",
    source: "Bible 4.4 §6",
    status: "ready",
    group: "Records & Access",
  },
  {
    key: "errors",
    title: "Errors",
    blurb: "Crashes and client errors, fed by the self-hosted beacon — never a 3rd-party monitor.",
    icon: TriangleAlert,
    tone: "warning",
    source: "W1.6.3",
    status: "soon",
    group: "Platform Health",
  },
  {
    key: "webhooks",
    title: "Webhooks",
    blurb: "Incoming events from Resend and payment partners, and how each was handled.",
    icon: Webhook,
    tone: "neutral",
    source: "Bible 4.1",
    status: "soon",
    group: "Platform Health",
  },
];

export function getCustodianLogSection(key: string): CustodianLogSection | undefined {
  return CUSTODIAN_LOG_SECTIONS.find((s) => s.key === key);
}
