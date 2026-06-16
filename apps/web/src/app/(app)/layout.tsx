import { getSessionContext } from "@/lib/auth";
import { AppFrame } from "@/components/AppFrame";
import { NoWorkspace } from "@/components/NoWorkspace";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getSessionContext();

  // Authenticated but attached to NOTHING — no clinic membership and not a
  // Custodian (e.g. a retired Custodian, or revoked access). An honest dead-end
  // beats the empty clinic shell where every query silently returns nothing.
  if (ctx && !ctx.isCustodian && !ctx.membership) {
    return <NoWorkspace email={ctx.user.email ?? ""} />;
  }

  const custodianOnly = !!ctx?.isCustodian && !ctx?.membership;
  // A Custodian has no clinic — both clinic-name slots are hidden for them in
  // AppFrame, so this stays empty rather than showing "Platform"/"Control".
  const clinic = ctx?.membership?.tenants?.name ?? (custodianOnly ? "" : "RolDe");
  const user =
    ctx?.membership?.display_name ?? ctx?.custodian?.display_name ?? ctx?.user.email ?? "";
  const role = ctx?.membership?.role ?? (custodianOnly ? "custodian" : "");
  const prescribingRights = ctx?.membership?.prescribing_rights ?? false;

  return (
    <AppFrame clinic={clinic} user={user} role={role} prescribingRights={prescribingRights}>
      {children}
    </AppFrame>
  );
}
