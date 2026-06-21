import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { ROLES } from "@/lib/roles";
import { getLogsAccess, LogsRestricted } from "../access";
import { getLogSection } from "../sections";
import { ActivityLogTable, type ActivityRow } from "./ActivityLogTable";

/**
 * Logs → Activity Log (Caretaker, Bible 4.1 §5.4 / 4.3 §5.12). Static segment —
 * overrides the `[section]` scaffold for the `activity` key.
 *
 * The clinic's unified timeline — every significant action (who · what · when),
 * read from the append-only `audit_log`. Caretaker reads their clinic's trail
 * (RLS); the actor names are resolved server-side. Coverage grows as more
 * actions are instrumented to write here.
 */
const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.key, r.label]));

export default async function ActivityLogPage() {
  const { allowed, ctx } = await getLogsAccess();
  if (!allowed) return <LogsRestricted />;
  const sec = getLogSection("activity");
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

  const rows = await loadActivity(tenantId);

  return (
    <div className="w-full p-6 lg:p-8">
      <ActivityLogTable rows={rows} title={sec.title} blurb={sec.blurb} />
    </div>
  );
}

async function loadActivity(tenantId: string): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("audit_log")
    .select("id, action, summary, at:created_at, actor_user_id")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(500);

  const log = events ?? [];
  if (log.length === 0) return [];

  // Resolve actor names from the members the Caretaker can already read.
  const userIds = [...new Set(log.map((r) => r.actor_user_id).filter(Boolean))] as string[];
  const { data: members } = userIds.length
    ? await supabase
        .from("tenant_users")
        .select("user_id, display_name, designation, role")
        .eq("tenant_id", tenantId)
        .in("user_id", userIds)
    : { data: [] };
  const mMap = new Map((members ?? []).map((m) => [m.user_id, m]));

  return log.map((r) => {
    const m = r.actor_user_id ? mMap.get(r.actor_user_id) : undefined;
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
    } satisfies ActivityRow;
  });
}
