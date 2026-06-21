import { ScrollText } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { SectionHubGrid } from "@/components/ui/SectionHubGrid";
import { createClient } from "@/lib/supabase/server";
import { CUSTODIAN_LOG_GROUPS, CUSTODIAN_LOG_SECTIONS } from "./sections";

/**
 * Custodian → Logs. The PLATFORM-wide audit shelf, on the SAME SectionHubGrid as
 * the clinic Logs Hub (mindate Counter cards, URDS §8.1) — identical for every role
 * (Roland 2026-06-21), each card showing its platform-wide entry count. The custodian
 * layout (requireCustodian) gates the area; RLS reads across all clinics.
 */
export default async function CustodianLogsHubPage() {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const [activity, signin, access, comms] = await Promise.all([
    supabase.from("audit_log").select("id", head),
    supabase.from("auth_audit_log").select("id", head),
    supabase.from("patient_access_log").select("id", head),
    supabase.from("transactional_emails").select("id", head),
  ]);
  const values: Record<string, { value: number; valueSub: string }> = {
    activity: { value: activity.count ?? 0, valueSub: "events" },
    "sign-in": { value: signin.count ?? 0, valueSub: "events" },
    access: { value: access.count ?? 0, valueSub: "views" },
    communications: { value: comms.count ?? 0, valueSub: "emails" },
  };
  const sections = CUSTODIAN_LOG_SECTIONS.map((s) => (values[s.key] ? { ...s, ...values[s.key] } : s));

  return (
    <div className="w-full space-y-8 p-6 lg:p-8">
      <PageHeaderRow
        icon={ScrollText}
        tone="neutral"
        title="Logs"
        explainer={{
          label: "Logs",
          description:
            "The platform's audit shelf — what happened across every clinic. The same shelves a clinic sees, platform-wide.",
        }}
      />
      <SectionHubGrid groups={CUSTODIAN_LOG_GROUPS} sections={sections} baseHref="/custodian/logs" cardVariant="counter" />
    </div>
  );
}
