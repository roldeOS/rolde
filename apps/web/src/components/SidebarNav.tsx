"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FlaskConical,
  Pill,
  Mail,
  Receipt,
  BarChart3,
  Settings,
  Scale,
} from "lucide-react";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { CONTROL_NAV } from "@/app/(app)/custodian/sections";
import { roleCanAccess, canPrescribe } from "@/lib/access";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  /** Access-matrix module key (Bible 4.1) — gates who sees this item. */
  module: string;
  soon?: boolean;
};

// The clinic-operator nav (Caretaker / clinician / concierge …), filtered per
// role by the access matrix (Bible 4.1 / lib/access.ts). The matching page guard
// (requireModuleAccess) is the real gate; this hides what a role can't reach.
const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, tone: "brand", module: "dashboard" },
  { href: "/patients", label: "Patients", icon: Users, tone: "info", module: "patients" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, tone: "success", module: "calendar" },
  { href: "/investigations", label: "Investigations", icon: FlaskConical, tone: "info", module: "investigations" },
  { href: "/prescribing", label: "Prescribing", icon: Pill, tone: "warning", module: "prescribing" },
  { href: "/letters", label: "Letters", icon: Mail, tone: "neutral", module: "letters" },
  { href: "/billing", label: "Billing", icon: Receipt, tone: "warning", module: "billing" },
  { href: "/reports", label: "Reports", icon: BarChart3, tone: "neutral", module: "reports" },
  { href: "/settings", label: "Settings", icon: Settings, tone: "neutral", module: "settings" },
  // Legal & Safety — the single home for Privacy, Terms, Disclaimer, Clinical
  // Safety & consent docs, each versioned (Roland 2026-06-11).
  { href: "/legal", label: "Legal & Safety", icon: Scale, tone: "neutral", module: "legal" },
];

export function SidebarNav({
  collapsed,
  role,
  prescribingRights,
}: {
  collapsed: boolean;
  role?: string;
  prescribingRights?: boolean;
}) {
  const pathname = usePathname();
  const renderItem = (item: NavItem) => {
    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href + item.label}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex items-center gap-2 rounded-lg py-1.5 text-sm font-medium transition-colors",
          collapsed ? "justify-center px-0" : "px-2",
          // Sidebar labels are BLACK for visibility (Roland 2026-06-11),
          // not the muted grey — active just adds the wash + weight.
          active
            ? "bg-selected text-foreground"
            : "text-foreground/80 hover:bg-hover hover:text-foreground",
        )}
      >
        <CardIcon icon={item.icon} tone={item.tone} variant="badge" size="sm" />
        {!collapsed && <span className="flex-1">{item.label}</span>}
        {!collapsed && item.soon && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Soon
          </span>
        )}
      </Link>
    );
  };

  // Custodians get the platform God-View — NOT the clinic-operator nav. The
  // last item, "Control", is the hub for every platform lever (Bible 4.8 §16).
  if (role === "custodian") {
    return (
      <nav className="flex flex-col gap-0.5 px-2">
        {CONTROL_NAV.map((s) =>
          renderItem({
            href: s.href,
            label: s.label,
            icon: s.icon,
            tone: s.tone,
            module: s.key,
            soon: s.status === "soon",
          }),
        )}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV.filter((item) =>
        item.module === "prescribing"
          ? canPrescribe(role, prescribingRights)
          : roleCanAccess(role, item.module),
      ).map(renderItem)}
    </nav>
  );
}
