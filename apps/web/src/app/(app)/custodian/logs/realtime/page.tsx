import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCustodianLogSection } from "../sections";
import {
  RealtimeHealthTable,
  type RealtimeHealthRow,
} from "@/app/(app)/logs/realtime/RealtimeHealthTable";

/**
 * Custodian → Logs → Realtime (PLATFORM-WIDE; Live Feed, Roland 2026-07-23). Same
 * table a clinic sees, read across ALL clinics with a Clinic column — so the
 * Custodian can see exactly which clinic's live feed is dropping out. Gated by
 * the custodian layout; RLS (is_custodian) spans clinics.
 */
export default async function CustodianRealtimeHealthLogPage() {
  const sec = getCustodianLogSection("realtime");
  if (!sec) notFound();
  const rows = await loadHealth();
  return (
    <div className="w-full p-6 lg:p-8">
      <RealtimeHealthTable rows={rows} title={sec.title} blurb={sec.blurb} showClinic />
    </div>
  );
}

async function loadHealth(): Promise<RealtimeHealthRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("realtime_health")
    .select("id, tenant_id, user_id, reason, user_agent, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(500);
  const log = data ?? [];
  if (!log.length) return [];

  const tenantIds = [...new Set(log.map((r) => r.tenant_id).filter(Boolean))] as string[];
  const userIds = [...new Set(log.map((r) => r.user_id).filter(Boolean))] as string[];
  const [{ data: tenants }, { data: members }] = await Promise.all([
    tenantIds.length
      ? supabase.from("tenants").select("id, name").in("id", tenantIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    userIds.length
      ? supabase.from("tenant_users").select("user_id, display_name").in("user_id", userIds)
      : Promise.resolve({ data: [] as { user_id: string; display_name: string }[] }),
  ]);
  const tName = new Map((tenants ?? []).map((t) => [t.id, t.name]));
  const uName = new Map((members ?? []).map((m) => [m.user_id, m.display_name]));

  return log.map((r) => ({
    id: r.id,
    clinic: tName.get(r.tenant_id) ?? "—",
    clinician: uName.get(r.user_id) ?? null,
    reason: r.reason,
    user_agent: r.user_agent,
    occurred_at: r.occurred_at,
  }));
}
