import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLES } from "@/lib/roles";
import { getCustodianLogSection } from "../sections";
import { ActivityLogTable, type ActivityRow } from "@/app/(app)/logs/activity/ActivityLogTable";

/**
 * Custodian → Logs → Activity Log (PLATFORM-WIDE). The same ActivityLogTable as a
 * clinic sees, but read across ALL clinics (custodian RLS) with a Clinic column.
 * Gated by the custodian layout (requireCustodian).
 */
const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.key, r.label]));

export default async function CustodianActivityLogPage() {
  const sec = getCustodianLogSection("activity");
  if (!sec) notFound();
  const rows = await loadActivity();
  return (
    <div className="w-full p-6 lg:p-8">
      <ActivityLogTable rows={rows} title={sec.title} blurb={sec.blurb} showClinic />
    </div>
  );
}

async function loadActivity(): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("audit_log")
    .select("id, action, summary, at:created_at, actor_user_id, tenant_id")
    .order("created_at", { ascending: false })
    .limit(500);

  const log = events ?? [];
  if (log.length === 0) return [];

  const userIds = [...new Set(log.map((r) => r.actor_user_id).filter(Boolean))] as string[];
  const tenantIds = [...new Set(log.map((r) => r.tenant_id))];
  const [{ data: members }, { data: tenants }] = await Promise.all([
    userIds.length
      ? supabase.from("tenant_users").select("user_id, tenant_id, display_name, designation, role").in("user_id", userIds)
      : Promise.resolve({ data: [] as { user_id: string; tenant_id: string; display_name: string | null; designation: string | null; role: string }[] }),
    supabase.from("tenants").select("id, name").in("id", tenantIds),
  ]);
  const mMap = new Map((members ?? []).map((m) => [`${m.tenant_id}:${m.user_id}`, m]));
  const tMap = new Map((tenants ?? []).map((t) => [t.id, t.name]));

  return log.map((r) => {
    const m = r.actor_user_id ? mMap.get(`${r.tenant_id}:${r.actor_user_id}`) : undefined;
    const dn = m?.display_name?.trim() ?? "";
    const desig = m?.designation?.trim() ?? "";
    const who =
      (desig && dn && !dn.toLowerCase().startsWith(desig.toLowerCase()) ? `${desig} ${dn}` : dn) || "System";
    return {
      id: r.id,
      who,
      who_role: m?.role ? (ROLE_LABEL[m.role] ?? m.role) : "",
      action: r.action,
      summary: r.summary ?? "",
      at: r.at,
      clinic: tMap.get(r.tenant_id) ?? "—",
    } satisfies ActivityRow;
  });
}
