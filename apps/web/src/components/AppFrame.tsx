"use client";

import { useState, useEffect } from "react";
import { SidebarNav } from "@/components/SidebarNav";
import { Topbar } from "@/components/topbar/Topbar";
import { TopbarProvider } from "@/components/topbar/TopbarContext";
import { cn } from "@/lib/utils";

/**
 * The clinic app frame (Roland 2026-06-10):
 *  - a COLLAPSIBLE sidebar (expanded w-48 ↔ icon rail w-14) — the toggle lives
 *    in the topbar; the state is remembered per browser. Collapsing frees the
 *    horizontal space the consultation screen needs.
 *  - ONE overall content card holding the glass topbar + the scrolling page.
 */
export function AppFrame({
  clinic,
  user,
  role,
  children,
}: {
  clinic: string;
  user: string;
  role: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("rolde:sidebar") === "collapsed");
    setReady(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("rolde:sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  }

  return (
    <TopbarProvider>
      <div className="flex h-screen overflow-hidden bg-sidebar">
        <aside
          className={cn(
            "flex shrink-0 flex-col transition-[width] duration-200 ease-out",
            collapsed ? "w-14" : "w-48",
            !ready && "duration-0",
          )}
        >
          <div className={cn("pt-5 pb-4", collapsed ? "px-0 text-center" : "px-4")}>
            {/* Wordmark — the ONLY place IBM Plex Serif lives (SVG to come). */}
            <p className="font-wordmark text-xl font-semibold tracking-tight">
              {collapsed ? "R" : "RolDe"}
            </p>
            {!collapsed && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {clinic}
              </p>
            )}
          </div>
          <SidebarNav collapsed={collapsed} />
          <div className="mt-auto px-2 py-3">
            {!collapsed && (
              <p className="px-2 text-center text-[10px] text-muted-foreground">
                © {new Date().getFullYear()} RolDe Ltd
              </p>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-2 pl-0">
          <div className="h-full overflow-hidden rounded-xl bg-background shadow-float">
            <div className="flex h-full flex-col overflow-y-auto" data-app-scroll>
              <Topbar
                clinic={clinic}
                user={user}
                role={role}
                onToggleSidebar={toggle}
              />
              <div className="min-h-0 flex-1">{children}</div>
            </div>
          </div>
        </main>
      </div>
    </TopbarProvider>
  );
}
