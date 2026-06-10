"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users } from "lucide-react";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { cn } from "@/lib/utils";

/**
 * Sidebar nav — RDS signature pattern (mindate APPROVALS §1.9): every nav item's
 * icon is a CardIcon "badge" squircle (white rounded-square + soft shadow +
 * tinted icon). Active route gets a subtle dark wash; hover gets the one
 * --hover token. No coloured indicators, no shouting.
 */
const NAV: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
}[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, tone: "brand" },
  { href: "/patients", label: "Patients", icon: Users, tone: "info" },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-foreground/6 text-foreground"
                : "text-muted-foreground hover:bg-hover hover:text-foreground",
            )}
          >
            <CardIcon icon={item.icon} tone={item.tone} variant="badge" size="sm" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
