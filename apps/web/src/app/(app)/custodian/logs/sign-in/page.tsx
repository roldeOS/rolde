import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deviceLabel } from "@/lib/logFormat";
import { getCustodianLogSection } from "../sections";
import { SignInLogTable, type SignInRow } from "@/app/(app)/logs/sign-in/SignInLogTable";

/**
 * Custodian → Logs → Sign-in & Security (PLATFORM-WIDE). The same SignInLogTable as
 * a clinic sees, read across ALL clinics (custodian RLS) with a Clinic column. The
 * platform's authentication trail — every login, sign-out and failed attempt, with
 * its IP + device. Gated by the custodian layout (requireCustodian).
 */
export default async function CustodianSignInLogPage() {
  const sec = getCustodianLogSection("sign-in");
  if (!sec) notFound();
  const rows = await loadSignIn();
  return (
    <div className="w-full p-6 lg:p-8">
      <SignInLogTable rows={rows} title={sec.title} blurb={sec.blurb} showClinic />
    </div>
  );
}

async function loadSignIn(): Promise<SignInRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("auth_audit_log")
    .select("id, user_id, actor_email, action, ip_address, user_agent, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const log = data ?? [];
  if (log.length === 0) return [];

  const userIds = [...new Set(log.map((r) => r.user_id).filter(Boolean))] as string[];
  // The actor's clinic comes from their membership (an auth event has no clinic of
  // its own); a multi-clinic user is shown by their first membership.
  const { data: members } = userIds.length
    ? await supabase
        .from("tenant_users")
        .select("user_id, display_name, designation, tenant_id")
        .in("user_id", userIds)
    : { data: [] as { user_id: string; display_name: string | null; designation: string | null; tenant_id: string }[] };

  const firstMembership = new Map<string, { display_name: string | null; designation: string | null; tenant_id: string }>();
  for (const m of members ?? []) {
    if (!firstMembership.has(m.user_id)) firstMembership.set(m.user_id, m);
  }
  const tenantIds = [...new Set([...firstMembership.values()].map((m) => m.tenant_id))];
  const { data: tenants } = tenantIds.length
    ? await supabase.from("tenants").select("id, name").in("id", tenantIds)
    : { data: [] as { id: string; name: string }[] };
  const tMap = new Map((tenants ?? []).map((t) => [t.id, t.name]));

  return log.map((r) => {
    const m = r.user_id ? firstMembership.get(r.user_id) : undefined;
    const dn = m?.display_name?.trim() ?? "";
    const desig = m?.designation?.trim() ?? "";
    const who =
      (desig && dn && !dn.toLowerCase().startsWith(desig.toLowerCase()) ? `${desig} ${dn}` : dn) ||
      r.actor_email ||
      "Unknown";
    return {
      id: r.id,
      who,
      action: r.action,
      ip: r.ip_address ?? "",
      device: deviceLabel(r.user_agent),
      at: r.created_at,
      clinic: m ? (tMap.get(m.tenant_id) ?? "—") : "Platform",
    } satisfies SignInRow;
  });
}
