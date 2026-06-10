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
} from "lucide-react";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { cn } from "@/lib/utils";

const NAV: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
}[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, tone: "brand" },
  { href: "/patients", label: "Patients", icon: Users, tone: "info" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, tone: "success" },
  { href: "/investigations", label: "Investigations", icon: FlaskConical, tone: "info" },
  { href: "/prescribing", label: "Prescribing", icon: Pill, tone: "warning" },
  { href: "/letters", label: "Letters", icon: Mail, tone: "neutral" },
  { href: "/billing", label: "Billing", icon: Receipt, tone: "warning" },
  { href: "/reports", label: "Reports", icon: BarChart3, tone: "neutral" },
  { href: "/settings", label: "Settings", icon: Settings, tone: "neutral" },
];

export function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg py-1.5 text-sm font-medium transition-colors",
              collapsed ? "justify-center px-0" : "px-2",
              active
                ? "bg-foreground/6 text-foreground"
                : "text-muted-foreground hover:bg-hover hover:text-foreground",
            )}
          >
            <CardIcon icon={item.icon} tone={item.tone} variant="badge" size="sm" />
            {!collapsed && item.label}
          </Link>
        );
      })}
    </nav>
  );
}
