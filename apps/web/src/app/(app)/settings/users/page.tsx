import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getSettingsAccess, SettingsRestricted } from "../access";
import { getSection } from "../sections";
import { UsersTable, type StaffMember } from "./UsersTable";

/**
 * Settings → Users & Roles (Caretaker, W1.1.7). Static segment — overrides the
 * `[section]` scaffold for the `users` key.
 *
 * The clinic's STAFF ROSTER, read from `tenant_users` (RLS lets any member read
 * their own clinic's memberships; emails come from the service-role auth lookup,
 * server-only). Rendered as a URDS table (`UsersTable`) — the first RolDe port of
 * the mindate TableShell/DataTable standard: filter (role · status · joined),
 * sort, freeze, density, CSV/PDF export. The server loads + shapes the data; the
 * client component owns the table chrome.
 */
export default async function UsersRolesPage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const sec = getSection("users");
  if (!sec) notFound();

  const tenantId = ctx?.membership?.tenant_id ?? null;
  const meId = ctx?.user?.id ?? null;

  // A Custodian has no clinic of their own — the roster is per-tenant.
  if (!tenantId) {
    return (
      <div className="w-full space-y-6 p-6 lg:p-8">
        <PageHeaderRow
          icon={sec.icon}
          tone={sec.tone}
          title={sec.title}
          explainer={{ label: sec.title, description: sec.blurb }}
        />
        <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-float">
          This is a per-clinic team. As a Custodian you don&apos;t have a clinic of your own —
          open a specific clinic from{" "}
          <Link href="/custodian" className="font-medium text-foreground underline">
            Platform
          </Link>
          .
        </div>
      </div>
    );
  }

  const { staff, nowMs, country } = await loadStaff(tenantId);

  return (
    <div className="w-full p-6 lg:p-8">
      <UsersTable
        staff={staff}
        meId={meId}
        nowMs={nowMs}
        country={country}
        title={sec.title}
        blurb={sec.blurb}
      />
    </div>
  );
}

async function loadStaff(tenantId: string) {
  const supabase = await createClient();
  const [{ data }, { data: tenant }] = await Promise.all([
    supabase
      .from("tenant_users")
      .select(
        "id, user_id, display_name, designation, preferred_name, job_title, role, prescribing_rights, license_type, license_number, status, access_starts_at, access_ends_at, last_login_at, created_at",
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true }),
    supabase.from("tenants").select("country").eq("id", tenantId).maybeSingle(),
  ]);

  const rows = data ?? [];
  const emails = await resolveEmails(rows.map((r) => r.user_id));
  // Stamp "now" here, off the render path — the access-window badge + last-seen
  // are computed against this single instant (keeps the render pure).
  return {
    staff: rows.map((r) => ({ ...r, email: emails.get(r.user_id) ?? null })) as StaffMember[],
    nowMs: Date.now(),
    country: tenant?.country ?? "GB",
  };
}

/**
 * Email lives in `auth.users`, not readable via RLS — so resolve it server-side
 * with the service-role client, one lookup per listed member (a clinic's staff
 * is a small set). Email is a nicety: a failed lookup never blocks the roster.
 */
async function resolveEmails(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const admin = createAdminClient();
  await Promise.all(
    ids.map(async (id) => {
      try {
        const { data } = await admin.auth.admin.getUserById(id);
        if (data?.user?.email) map.set(id, data.user.email);
      } catch {
        /* ignore — email is a nicety, not load-bearing */
      }
    }),
  );
  return map;
}
