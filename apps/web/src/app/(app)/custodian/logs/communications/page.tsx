import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCustodianLogSection } from "../sections";
import { CommsLogTable, type CommsRow } from "@/app/(app)/logs/communications/CommsLogTable";

/**
 * Custodian → Logs → Communications (PLATFORM-WIDE). Same CommsLogTable as a
 * clinic sees, read across ALL clinics with a Clinic column (a null tenant is a
 * platform-level email). Gated by the custodian layout.
 */
export default async function CustodianCommsLogPage() {
  const sec = getCustodianLogSection("communications");
  if (!sec) notFound();
  const rows = await loadComms();
  return (
    <div className="w-full p-6 lg:p-8">
      <CommsLogTable rows={rows} title={sec.title} blurb={sec.blurb} showClinic />
    </div>
  );
}

async function loadComms(): Promise<CommsRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactional_emails")
    .select(
      "id, to_name, to_email, subject, status, template_slug, provider_message_id, error_message, source, delivered_at, opened_at, clicked_at, created_at, tenant_id",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const log = data ?? [];
  if (log.length === 0) return [];

  const tenantIds = [...new Set(log.map((r) => r.tenant_id).filter(Boolean))] as string[];
  const { data: tenants } = tenantIds.length
    ? await supabase.from("tenants").select("id, name").in("id", tenantIds)
    : { data: [] as { id: string; name: string }[] };
  const tMap = new Map((tenants ?? []).map((t) => [t.id, t.name]));

  return log.map((r) => ({
    id: r.id,
    to_name: r.to_name,
    to_email: r.to_email,
    subject: r.subject,
    status: r.status,
    template_slug: r.template_slug,
    provider_message_id: r.provider_message_id,
    error_message: r.error_message,
    source: r.source,
    delivered_at: r.delivered_at,
    opened_at: r.opened_at,
    clicked_at: r.clicked_at,
    created_at: r.created_at,
    clinic: r.tenant_id ? (tMap.get(r.tenant_id) ?? "—") : "Platform",
  }));
}
