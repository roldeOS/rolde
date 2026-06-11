import { getSessionContext } from "@/lib/auth";
import { AppFrame } from "@/components/AppFrame";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getSessionContext();
  const custodianOnly = !!ctx?.isCustodian && !ctx?.membership;
  const clinic =
    ctx?.membership?.tenants?.name ?? (custodianOnly ? "Platform" : "RolDe");
  const user = ctx?.membership?.display_name ?? ctx?.user.email ?? "";
  const role = ctx?.membership?.role ?? (custodianOnly ? "custodian" : "");

  return (
    <AppFrame clinic={clinic} user={user} role={role}>
      {children}
    </AppFrame>
  );
}
