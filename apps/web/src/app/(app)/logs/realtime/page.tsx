import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getLogsAccess, LogsRestricted } from "../access";
import { getLogSection } from "../sections";
import { RealtimeHealthTable, type RealtimeHealthRow } from "./RealtimeHealthTable";

/**
 * Logs → Realtime (Caretaker; Live Feed, Roland 2026-07-23). Static segment —
 * overrides the `[section]` scaffold for the `realtime` key.
 *
 * When a clinician's live feed connection drops, the client records it so the
 * Caretaker sees whether their clinic's realtime is flaky (the feed keeps working
 * via refetch-on-focus). Read by the Caretaker (page gate); RLS scopes the rows
 * to the tenant.
 */
export default async function RealtimeHealthLogPage() {
  const { allowed, ctx } = await getLogsAccess();
  if (!allowed) return <LogsRestricted />;
  const sec = getLogSection("realtime");
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

  const rows = await loadHealth(tenantId);
  return (
    <div className="w-full p-6 lg:p-8">
      <RealtimeHealthTable rows={rows} title={sec.title} blurb={sec.blurb} />
    </div>
  );
}

async function loadHealth(tenantId: string): Promise<RealtimeHealthRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("realtime_health")
    .select("id, user_id, reason, user_agent, occurred_at")
    .eq("tenant_id", tenantId)
    .order("occurred_at", { ascending: false })
    .limit(500);
  const log = data ?? [];
  if (!log.length) return [];

  const userIds = [...new Set(log.map((r) => r.user_id).filter(Boolean))] as string[];
  const { data: members } = userIds.length
    ? await supabase.from("tenant_users").select("user_id, display_name").in("user_id", userIds)
    : { data: [] as { user_id: string; display_name: string }[] };
  const nameOf = new Map((members ?? []).map((m) => [m.user_id, m.display_name]));

  return log.map((r) => ({
    id: r.id,
    clinician: nameOf.get(r.user_id) ?? null,
    reason: r.reason,
    user_agent: r.user_agent,
    occurred_at: r.occurred_at,
  }));
}
