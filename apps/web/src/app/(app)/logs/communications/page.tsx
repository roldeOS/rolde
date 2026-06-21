import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getLogsAccess, LogsRestricted } from "../access";
import { getLogSection } from "../sections";
import { CommsLogTable, type CommsRow } from "./CommsLogTable";

/**
 * Logs → Communications (Caretaker, Bible 4.4 §6). Static segment — overrides the
 * `[section]` scaffold for the `communications` key.
 *
 * Every operational email the clinic sent a patient, and how far it got
 * (delivered → opened → clicked) — "sent" is not "delivered". Comms are
 * clinical-adjacent records. Read by the Caretaker (page gate); RLS scopes the
 * rows to the tenant.
 */
export default async function CommunicationsLogPage() {
  const { allowed, ctx } = await getLogsAccess();
  if (!allowed) return <LogsRestricted />;
  const sec = getLogSection("communications");
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

  const rows = await loadComms(tenantId);

  return (
    <div className="w-full p-6 lg:p-8">
      <CommsLogTable rows={rows} title={sec.title} blurb={sec.blurb} />
    </div>
  );
}

async function loadComms(tenantId: string): Promise<CommsRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactional_emails")
    .select("id, to_name, to_email, subject, status, delivered_at, opened_at, clicked_at, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(500);
  return (data ?? []) as CommsRow[];
}
