import { getSessionContext } from "@/lib/auth";
import { SidebarNav } from "@/components/SidebarNav";
import { SignOutButton } from "@/components/SignOutButton";
import { Topbar } from "@/components/Topbar";

/**
 * The clinic app shell (RDS ancestry, Roland 2026-06-10):
 *  - fixed narrow sidebar (w-48) on the sunny clinic tint — the ONLY thing
 *    outside the card;
 *  - ONE overall content card (rounded, floating) encompassing everything else;
 *  - a floating glass topbar inset at the top of the card;
 *  - the card's inner pane is the ONLY scroll container (document never scrolls).
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getSessionContext();
  const clinic = ctx?.membership?.tenants?.name ?? "RolDe";
  const user = ctx?.membership?.display_name ?? ctx?.user.email ?? "";

  return (
    <div className="flex h-screen overflow-hidden bg-sidebar">
      <aside className="flex w-48 shrink-0 flex-col">
        <div className="px-4 pt-5 pb-4">
          {/* Wordmark — the ONLY place IBM Plex Serif lives (SVG logo to come). */}
          <p className="font-wordmark text-xl font-semibold tracking-tight">
            RolDe
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {clinic}
          </p>
        </div>
        <SidebarNav />
        <div className="mt-auto border-t border-sidebar-border px-2 py-3">
          <SignOutButton />
          <p className="mt-3 px-2 text-center text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} RolDe Ltd
          </p>
        </div>
      </aside>

      {/* The overall content card — everything except the sidebar lives inside. */}
      <main className="min-w-0 flex-1 p-2 pl-0">
        <div className="h-full overflow-hidden rounded-xl bg-background shadow-float">
          <div className="flex h-full flex-col overflow-y-auto" data-app-scroll>
            <Topbar clinic={clinic} user={user} />
            <div className="min-h-0 flex-1">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
