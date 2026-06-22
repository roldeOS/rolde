import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLES } from "@/lib/roles";
import { getCustodianLogSection } from "../sections";
import { AccessLogTable, type AccessRow } from "@/app/(app)/logs/access/AccessLogTable";

const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.key, r.label]));

/**
 * Custodian → Logs → Patient Access (PLATFORM-WIDE). Same AccessLogTable as a
 * clinic sees, read across ALL clinics with a Clinic column. The patient is shown
 * by its clinic NUMBER, never name — across-clinic audit is metadata only.
 */
export default async function CustodianAccessLogPage() {
  const sec = getCustodianLogSection("access");
  if (!sec) notFound();
  const rows = await loadAccess();
  return (
    <div className="w-full p-6 lg:p-8">
      <AccessLogTable rows={rows} title={sec.title} blurb={sec.blurb} showClinic />
    </div>
  );
}

async function loadAccess(): Promise<AccessRow[]> {
  const supabase = await createClient();
  const { data: accesses } = await supabase
    .from("patient_access_log")
    .select("id, action, at, patient_id, user_id, tenant_id, actor_role, ip_address, user_agent, purpose, break_glass")
    .order("at", { ascending: false })
    .limit(500);

  const log = accesses ?? [];
  if (log.length === 0) return [];

  const userIds = [...new Set(log.map((r) => r.user_id))];
  const patientIds = [...new Set(log.map((r) => r.patient_id))];
  const tenantIds = [...new Set(log.map((r) => r.tenant_id))];
  const [{ data: members }, { data: patients }, { data: tenants }] = await Promise.all([
    supabase.from("tenant_users").select("user_id, tenant_id, display_name").in("user_id", userIds),
    supabase.from("patients").select("id, patient_number").in("id", patientIds),
    supabase.from("tenants").select("id, name").in("id", tenantIds),
  ]);
  const mMap = new Map((members ?? []).map((m) => [`${m.tenant_id}:${m.user_id}`, m.display_name]));
  const pMap = new Map((patients ?? []).map((p) => [p.id, p.patient_number]));
  const tMap = new Map((tenants ?? []).map((t) => [t.id, t.name]));

  return log.map((r) => ({
    id: r.id,
    who: mMap.get(`${r.tenant_id}:${r.user_id}`) ?? "Unknown",
    who_role: r.actor_role ? (ROLE_LABEL[r.actor_role] ?? r.actor_role) : "",
    patient: pMap.get(r.patient_id) ?? "—",
    patient_no: "",
    action: r.action,
    at: r.at,
    purpose: r.purpose ?? null,
    break_glass: r.break_glass ?? false,
    ip_address: r.ip_address ?? null,
    user_agent: r.user_agent ?? null,
    clinic: tMap.get(r.tenant_id) ?? "—",
  }));
}
