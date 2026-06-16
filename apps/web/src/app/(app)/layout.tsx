import { getSessionContext } from "@/lib/auth";
import { AppFrame } from "@/components/AppFrame";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getSessionContext();
  const custodianOnly = !!ctx?.isCustodian && !ctx?.membership;
  // A Custodian has no clinic — both clinic-name slots are hidden for them in
  // AppFrame, so this stays empty rather than showing "Platform"/"Control".
  const clinic = ctx?.membership?.tenants?.name ?? (custodianOnly ? "" : "RolDe");
  const user =
    ctx?.membership?.display_name ?? ctx?.custodian?.display_name ?? ctx?.user.email ?? "";
  const role = ctx?.membership?.role ?? (custodianOnly ? "custodian" : "");

  return (
    <AppFrame clinic={clinic} user={user} role={role}>
      {children}
    </AppFrame>
  );
}
