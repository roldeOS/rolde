"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeft, Heart } from "lucide-react";
import { SidebarNav } from "@/components/SidebarNav";
import { Topbar } from "@/components/topbar/Topbar";
import { TopbarProvider } from "@/components/topbar/TopbarContext";
import { CardIcon } from "@/components/ui/CardIcon";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * The clinic app frame (Roland 2026-06-10):
 *  - DESKTOP: a collapsible sidebar (expanded w-48 ↔ icon rail w-14), the toggle
 *    in the topbar, remembered per browser.
 *  - MOBILE/TABLET (<lg): the sidebar is an off-canvas drawer (industry standard
 *    — Linear/Notion/Gmail) — hidden, slid in over a backdrop by the same toggle.
 *  - ONE overall content card holds the glass topbar + the scrolling page.
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
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("rolde:sidebar") === "collapsed");
    setReady(true);
  }, []);

  // Close the mobile drawer on navigation.
  useEffect(() => setMobileOpen(false), [pathname]);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function collapseToggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("rolde:sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  }

  function toggle() {
    // Desktop collapses the rail; mobile slides the drawer. (Topbar control is
    // now the MOBILE menu button only — desktop collapse lives in the sidebar.)
    if (window.matchMedia("(min-width: 1024px)").matches) {
      collapseToggle();
    } else {
      setMobileOpen((o) => !o);
    }
  }

  return (
    <TopbarProvider>
      <div className="flex h-screen overflow-hidden bg-sidebar">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={cn(
            // On desktop the sidebar IS the paper (transparent — the textured
            // paper shows through). On mobile it's an opaque off-canvas drawer.
            "z-50 flex shrink-0 flex-col bg-sidebar transition-transform duration-200 ease-out lg:bg-transparent lg:transition-[width]",
            "fixed inset-y-0 left-0 w-56 -translate-x-full lg:static lg:translate-x-0",
            mobileOpen && "translate-x-0 shadow-2xl",
            collapsed ? "lg:w-14" : "lg:w-48",
            !ready && "lg:transition-none",
          )}
        >
          <div
            className={cn(
              "pt-5 pb-4",
              collapsed ? "px-4 lg:px-0 lg:text-center" : "px-4",
            )}
          >
            {/* Wordmark — the ONLY place IBM Plex Serif lives (SVG to come). */}
            <p className="font-wordmark text-xl font-semibold tracking-tight">
              <span className={collapsed ? "lg:hidden" : ""}>RolDe</span>
              <span className={collapsed ? "hidden lg:inline" : "hidden"}>R</span>
            </p>
            <p
              className={cn(
                "mt-0.5 truncate text-xs text-muted-foreground",
                collapsed && "lg:hidden",
              )}
            >
              {clinic}
            </p>
          </div>
          <SidebarNav collapsed={collapsed} />

          {/* Collapse toggle — a separate nav-style row BELOW the nav (Roland
              2026-06-11: keep it off the header so it never squeezes the logo).
              Desktop only; mobile uses the topbar menu button + drawer. */}
          <button
            onClick={collapseToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "mt-1 hidden items-center gap-2 rounded-lg py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-hover hover:text-foreground lg:flex",
              collapsed ? "mx-2 justify-center px-0" : "mx-2 px-2",
            )}
          >
            <CardIcon
              icon={collapsed ? PanelLeft : PanelLeftClose}
              tone="neutral"
              variant="badge"
              size="sm"
            />
            {!collapsed && (
              <span>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
            )}
          </button>
          <div className="mt-auto px-2 py-3">
            <button
              onClick={signOut}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground",
                collapsed ? "px-2 lg:justify-center lg:px-0" : "px-2",
              )}
            >
              <CardIcon icon={LogOut} tone="critical" variant="badge" size="sm" />
              <span className={collapsed ? "lg:hidden" : ""}>Sign out</span>
            </button>
            <div
              className={cn(
                "mt-3 space-y-0.5 px-2 text-center text-[10px] leading-snug text-muted-foreground",
                collapsed && "lg:hidden",
              )}
            >
              <p className="inline-flex items-center gap-1">
                Made with
                <Heart
                  aria-label="love"
                  className="size-2.5 fill-[#e0533f] text-[#e0533f]"
                />
                at RolDe
              </p>
              <p>© {new Date().getFullYear()} RolDe Ltd</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-2 pl-2 lg:pl-0">
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
