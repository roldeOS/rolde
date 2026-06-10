import { getSessionContext } from "@/lib/auth";
import { AppFrame } from "@/components/AppFrame";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getSessionContext();
  const clinic = ctx?.membership?.tenants?.name ?? "RolDe";
  const user = ctx?.membership?.display_name ?? ctx?.user.email ?? "";
  const role = ctx?.membership?.role ?? "";

  return (
    <AppFrame clinic={clinic} user={user} role={role}>
      {children}
    </AppFrame>
  );
}
