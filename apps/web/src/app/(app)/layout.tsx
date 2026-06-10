import { getSessionContext } from "@/lib/auth";
import { SidebarNav } from "@/components/SidebarNav";
import { SignOutButton } from "@/components/SignOutButton";

/**
 * The clinic app shell (RDS ancestry): fixed narrow sidebar (w-48, soft tint,
 * no border) + the content pane as the ONLY scroll container. Document never
 * scrolls (mindate APPROVALS §1.1/§1.4).
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getSessionContext();
  const clinic = ctx?.membership?.tenants?.name ?? "RolDe";

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-48 shrink-0 flex-col bg-sidebar">
        <div className="px-4 pt-5 pb-4">
          <p className="font-heading text-xl font-semibold tracking-tight">
            RolDe
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{clinic}</p>
        </div>
        <SidebarNav />
        <div className="mt-auto border-t border-sidebar-border px-2 py-3">
          <SignOutButton />
          <p className="mt-3 px-2 text-center text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} RolDe Ltd
          </p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
