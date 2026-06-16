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
  MailCheck,
  ScrollText,
} from "lucide-react";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
};

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

// Custodian-only platform surfaces (first slice of the console; the standalone
// /custodian console with its own chrome is W1.5.2).
const PLATFORM_NAV: NavItem[] = [
  { href: "/custodian/emails", label: "Email Templates", icon: MailCheck, tone: "info" },
  { href: "/custodian/logs", label: "Email Log", icon: ScrollText, tone: "neutral" },
];

export function SidebarNav({ collapsed, role }: { collapsed: boolean; role?: string }) {
  const pathname = usePathname();
  const renderItem = (item: NavItem) => {
    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
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
        {!collapsed && item.label}
      </Link>
    );
  };

  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV.map(renderItem)}
      {role === "custodian" && (
        <>
          {!collapsed && (
            <p className="mt-4 mb-1 px-2 text-[11px] font-semibold tracking-wide text-muted-foreground">
              Platform
            </p>
          )}
          {collapsed && <div className="mt-3 mb-1 border-t border-sidebar-border" />}
          {PLATFORM_NAV.map(renderItem)}
        </>
      )}
    </nav>
  );
}
