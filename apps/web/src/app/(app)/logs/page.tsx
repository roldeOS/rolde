import { ScrollText } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { SectionHubGrid } from "@/components/ui/SectionHubGrid";
import { createClient } from "@/lib/supabase/server";
import { LOG_GROUPS, LOG_SECTIONS } from "./sections";
import { getLogsAccess, LogsRestricted } from "./access";

/**
 * Logs Hub — the Caretaker's audit shelf (Bible 4.1 §5.4 / 4.3 §5.12; URDS §9.5).
 * A grouped grid of mindate Counter cards (URDS §8.1): each shows its live entry
 * count as the hero. Settings is where you CONFIGURE the clinic; Logs is where you
 * REVIEW what happened — two jobs, two homes.
 */
export default async function LogsHubPage() {
  const { allowed, ctx } = await getLogsAccess();
  if (!allowed) return <LogsRestricted />;

  const tenantId = ctx?.membership?.tenant_id ?? null;
  const values: Record<string, { value: number; valueSub: string }> = {};
  if (tenantId) {
    const supabase = await createClient();
    const head = { count: "exact" as const, head: true };
    const [activity, signin, access, comms, exports] = await Promise.all([
      supabase.from("audit_log").select("id", head).eq("tenant_id", tenantId),
      supabase.from("auth_audit_log").select("id", head), // RLS scopes to this clinic's members
      supabase.from("patient_access_log").select("id", head).eq("tenant_id", tenantId),
      supabase.from("transactional_emails").select("id", head).eq("tenant_id", tenantId),
      supabase.from("export_log").select("id", head).eq("tenant_id", tenantId).is("deleted_at", null),
    ]);
    values.activity = { value: activity.count ?? 0, valueSub: "events" };
    values["sign-in"] = { value: signin.count ?? 0, valueSub: "events" };
    values.access = { value: access.count ?? 0, valueSub: "views" };
    values.communications = { value: comms.count ?? 0, valueSub: "emails" };
    values.exports = { value: exports.count ?? 0, valueSub: "exports" };
  }
  const sections = LOG_SECTIONS.map((s) => (values[s.key] ? { ...s, ...values[s.key] } : s));

  return (
    <div className="w-full space-y-8 p-6 lg:p-8">
      <PageHeaderRow
        icon={ScrollText}
        tone="neutral"
        title="Logs"
        explainer={{
          label: "Logs",
          description:
            "Your clinic's audit shelf — a calm record of what happened. Everyone's actions are logged; only you (the Caretaker) review them here.",
        }}
      />
      <SectionHubGrid groups={LOG_GROUPS} sections={sections} baseHref="/logs" cardVariant="counter" />
    </div>
  );
}
