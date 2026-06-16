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
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  soon?: boolean;
};

// The clinic-operator nav (Caretaker / clinician / concierge …).
const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, tone: "brand" },
  { href: "/patients", label: "Patients", icon: Users, tone: "info" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, tone: "success" },
  { href: "/investigations", label: "Investigations", icon: FlaskConical, tone: "info" },
  { href: "/prescribing", label: "Prescribing", icon: Pill, tone: "warning" },
  { href: "/letters", label: "Letters", icon: Mail, tone: "neutral" },
  { href: "/billing", label: "Billing", icon: Receipt, tone: "warning" },
  { href: "/reports", label: "Reports", icon: BarChart3, tone: "neutral" },
  { href: "/settings", label: "Settings", icon: Settings, tone: "neutral" },
  // Legal & Safety — the single home for Privacy, Terms, Disclaimer, Clinical
  // Safety & consent docs, each versioned (Roland 2026-06-11).
  { href: "/legal", label: "Legal & Safety", icon: Scale, tone: "neutral" },
];

export function SidebarNav({ collapsed, role }: { collapsed: boolean; role?: string }) {
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
            ? "bg-foreground/6 text-foreground"
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
            soon: s.status === "soon",
          }),
        )}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5 px-2">{NAV.map(renderItem)}</nav>
  );
}
