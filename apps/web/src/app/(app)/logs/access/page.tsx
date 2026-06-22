import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { ROLES } from "@/lib/roles";
import { getLogsAccess, LogsRestricted } from "../access";
import { getLogSection } from "../sections";
import { AccessLogTable, type AccessRow } from "./AccessLogTable";

/**
 * Logs → Patient Access (Caretaker, W1.1.7 §6.14). Static segment — overrides the
 * `[section]` scaffold for the `access` key.
 *
 * The clinical-governance trail: every time anyone opens a patient record it's
 * recorded (who · which patient · what action · when). Access metadata only —
 * never clinical content. Caretaker reads their clinic's trail (RLS); the names
 * are resolved server-side (the log stores ids, not names).
 */
const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.key, r.label]));

export default async function PatientAccessLogPage() {
  const { allowed, ctx } = await getLogsAccess();
  if (!allowed) return <LogsRestricted />;
  const sec = getLogSection("access");
  if (!sec) notFound();

  const tenantId = ctx?.membership?.tenant_id ?? null;

  if (!tenantId) {
    return (
      <div className="w-full space-y-6 p-6 lg:p-8">
        <PageHeaderRow icon={sec.icon} tone={sec.tone} title={sec.title} explainer={{ label: sec.title, description: sec.blurb }} />
        <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-float">
          This is a per-clinic record. As a Custodian you don&apos;t have a clinic of your own —
          open a specific clinic from{" "}
          <Link href="/custodian" className="font-medium text-foreground underline">
            Platform
          </Link>
          .
        </div>
      </div>
    );
  }

  const rows = await loadAccessLog(tenantId);

  return (
    <div className="w-full p-6 lg:p-8">
      <AccessLogTable rows={rows} title={sec.title} blurb={sec.blurb} />
    </div>
  );
}

async function loadAccessLog(tenantId: string): Promise<AccessRow[]> {
  const supabase = await createClient();
  const { data: accesses } = await supabase
    .from("patient_access_log")
    .select("id, action, at, patient_id, user_id, actor_role, ip_address, user_agent, purpose, break_glass")
    .eq("tenant_id", tenantId)
    .order("at", { ascending: false })
    .limit(500);

  const log = accesses ?? [];
  if (log.length === 0) return [];

  const patientIds = [...new Set(log.map((r) => r.patient_id))];
  const userIds = [...new Set(log.map((r) => r.user_id))];

  // The log stores ids; resolve the human names from the records the Caretaker
  // can already read (RLS-scoped to this tenant).
  const [{ data: patients }, { data: members }] = await Promise.all([
    supabase.from("patients").select("id, first_name, last_name, patient_number").in("id", patientIds),
    supabase
      .from("tenant_users")
      .select("user_id, display_name, designation, role")
      .eq("tenant_id", tenantId)
      .in("user_id", userIds),
  ]);

  const pMap = new Map((patients ?? []).map((p) => [p.id, p]));
  const mMap = new Map((members ?? []).map((m) => [m.user_id, m]));

  return log.map((r) => {
    const p = pMap.get(r.patient_id);
    const m = mMap.get(r.user_id);
    const dn = m?.display_name?.trim() ?? "";
    const desig = m?.designation?.trim() ?? "";
    const who =
      (desig && dn && !dn.toLowerCase().startsWith(desig.toLowerCase()) ? `${desig} ${dn}` : dn) || "Unknown";
    // Prefer the role recorded AT access time (point-in-time, forensic), falling
    // back to the member's current role for rows logged before the column existed.
    const roleKey = r.actor_role ?? m?.role ?? null;
    return {
      id: r.id,
      who,
      who_role: roleKey ? (ROLE_LABEL[roleKey] ?? roleKey) : "",
      patient: p ? `${p.first_name} ${p.last_name}` : "Unknown patient",
      patient_no: p?.patient_number ?? "",
      action: r.action,
      at: r.at,
      purpose: r.purpose ?? null,
      break_glass: r.break_glass ?? false,
      ip_address: r.ip_address ?? null,
      user_agent: r.user_agent ?? null,
    } satisfies AccessRow;
  });
}
