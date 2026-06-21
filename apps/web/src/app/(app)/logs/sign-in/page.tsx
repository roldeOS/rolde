import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { deviceLabel } from "@/lib/logFormat";
import { getLogsAccess, LogsRestricted } from "../access";
import { getLogSection } from "../sections";
import { SignInLogTable, type SignInRow } from "./SignInLogTable";

/**
 * Logs → Sign-in & Security (Caretaker; Bible 4.1 §5.4). Static segment — overrides
 * the `[section]` scaffold for the `sign-in` key.
 *
 * The clinic's authentication trail: who signed in / out, who FAILED, who changed a
 * password — and from which IP and device. Rows are RLS-scoped to this clinic's own
 * members; names are resolved server-side (the log stores ids, not names).
 */
export default async function SignInLogPage() {
  const { allowed, ctx } = await getLogsAccess();
  if (!allowed) return <LogsRestricted />;
  const sec = getLogSection("sign-in");
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

  const rows = await loadSignInLog(tenantId);

  return (
    <div className="w-full p-6 lg:p-8">
      <SignInLogTable rows={rows} title={sec.title} blurb={sec.blurb} />
    </div>
  );
}

async function loadSignInLog(tenantId: string): Promise<SignInRow[]> {
  const supabase = await createClient();
  // RLS returns only sign-in events for THIS clinic's members (no tenant_id on the
  // row — an auth event isn't clinic-scoped; the policy scopes by membership).
  const { data } = await supabase
    .from("auth_audit_log")
    .select("id, user_id, actor_email, action, ip_address, user_agent, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const log = data ?? [];
  if (log.length === 0) return [];

  const userIds = [...new Set(log.map((r) => r.user_id).filter(Boolean))] as string[];
  const { data: members } = userIds.length
    ? await supabase
        .from("tenant_users")
        .select("user_id, display_name, designation")
        .eq("tenant_id", tenantId)
        .in("user_id", userIds)
    : { data: [] as { user_id: string; display_name: string | null; designation: string | null }[] };
  const mMap = new Map((members ?? []).map((m) => [m.user_id, m]));

  return log.map((r) => {
    const m = r.user_id ? mMap.get(r.user_id) : undefined;
    const dn = m?.display_name?.trim() ?? "";
    const desig = m?.designation?.trim() ?? "";
    const who =
      (desig && dn && !dn.toLowerCase().startsWith(desig.toLowerCase()) ? `${desig} ${dn}` : dn) ||
      r.actor_email ||
      "Unknown";
    return {
      id: r.id,
      who,
      action: r.action,
      ip: r.ip_address ?? "",
      device: deviceLabel(r.user_agent),
      at: r.created_at,
    } satisfies SignInRow;
  });
}
