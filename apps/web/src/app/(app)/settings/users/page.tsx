import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pill } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { ROLES } from "@/lib/roles";
import { accessWindowBadge } from "@/lib/accessWindow";
import type { CardIconTone } from "@/components/ui/CardIcon";
import { getSettingsAccess, SettingsRestricted } from "../access";
import { getSection } from "../sections";
import { cn } from "@/lib/utils";

/**
 * Settings → Users & Roles (Caretaker, W1.1.7). Static segment — overrides the
 * `[section]` scaffold for the `users` key.
 *
 * Chunk 1 (this slice): the clinic's STAFF ROSTER, read from `tenant_users`
 * (RLS lets any member read their own clinic's memberships; emails come from the
 * service-role auth lookup, server-only). Each person shows their name + role +
 * job title, whether they're a prescriber, and their access window as a calm
 * badge (Indefinite · Until 30 Nov · a Locum span · Expired). Inviting, editing
 * and revoking (the write path) land in the next chunk.
 */
const ROLE_BY_KEY: Record<string, (typeof ROLES)[number]> = Object.fromEntries(
  ROLES.map((r) => [r.key, r]),
);

// tone → calm pill classes (static literals so Tailwind keeps them at build).
const TONE_PILL: Record<CardIconTone, string> = {
  critical: "bg-critical/12 text-critical",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/12 text-success",
  info: "bg-info/12 text-info",
  accent: "bg-accent/20 text-accent",
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-info/12 text-info",
};

// A small, warm, parchment-friendly avatar palette (never the cold blues) —
// keeps the roster lively + each person distinguishable until photo upload +
// generated avatars land (W1.1.14).
const AVATAR_TINTS = [
  "from-[#c4895c] to-[#a96b41]", // terracotta
  "from-[#8fa06b] to-[#71834f]", // sage
  "from-[#c9a45c] to-[#ad8740]", // amber
  "from-[#bd6f60] to-[#9c5246]", // clay
  "from-[#a88598] to-[#8a677b]", // mauve
  "from-[#6f8f8a] to-[#577471]", // slate-teal
];

function tintFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

function initialsOf(name: string): string {
  return name
    .replace(/^(dr|mr|mrs|ms|miss|nr|prof)\.?\s+/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function lastSeen(iso: string | null, nowMs: number): string {
  if (!iso) return "Never signed in";
  const m = Math.floor((nowMs - Date.parse(iso)) / 60_000);
  if (m < 1) return "Active just now";
  if (m < 60) return `Last seen ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Last seen ${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `Last seen ${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `Last seen ${mo}mo ago`;
  return `Last seen ${Math.floor(mo / 12)}y ago`;
}

type Staff = Awaited<ReturnType<typeof loadStaff>>["staff"][number];

export default async function UsersRolesPage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const sec = getSection("users");
  if (!sec) notFound();

  const tenantId = ctx?.membership?.tenant_id ?? null;
  const meId = ctx?.user?.id ?? null;
  const { staff, nowMs } = tenantId
    ? await loadStaff(tenantId)
    : { staff: [], nowMs: 0 };

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <PageHeaderRow
        icon={sec.icon}
        tone={sec.tone}
        title={sec.title}
        explainer={{ label: sec.title, description: sec.blurb }}
        actions={
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> All Settings
          </Link>
        }
      />

      {!tenantId ? (
        <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-float">
          This is a per-clinic team. As a Custodian you don&apos;t have a clinic of your own —
          open a specific clinic from{" "}
          <Link href="/custodian" className="font-medium text-foreground underline">
            Platform
          </Link>
          .
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-card shadow-float">
          <div className="border-b border-border px-5 py-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{staff.length}</span>{" "}
              {staff.length === 1 ? "person" : "people"} in this clinic
            </p>
          </div>
          <ul className="divide-y divide-border/60">
            {staff.map((s) => (
              <StaffRow key={s.id} s={s} isMe={s.user_id === meId} nowMs={nowMs} />
            ))}
            {staff.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                No one here yet.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function StaffRow({ s, isMe, nowMs }: { s: Staff; isMe: boolean; nowMs: number }) {
  const role = ROLE_BY_KEY[s.role];
  const revoked = s.status !== "active";
  const name = [s.designation, s.display_name].filter(Boolean).join(" ");
  const subtitle = s.job_title || role?.meaning || "";
  const license = [s.license_type, s.license_number].filter(Boolean).join(" ");
  const window = accessWindowBadge(s.access_starts_at, s.access_ends_at, nowMs);

  return (
    <li className={cn("flex items-center gap-3 px-5 py-3.5", revoked && "opacity-60")}>
      {/* Avatar */}
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white shadow-sm ring-2 ring-white",
          tintFor(s.user_id),
        )}
        aria-hidden
      >
        {initialsOf(s.display_name) || "—"}
      </span>

      {/* Identity */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          {isMe && (
            <span className="shrink-0 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
              You
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {subtitle}
          {s.email && <span className="text-muted-foreground/70"> · {s.email}</span>}
        </p>
      </div>

      {/* Status cluster */}
      <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
        <div className="flex items-center gap-1.5">
          {role && (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium",
                TONE_PILL[role.tone],
              )}
            >
              {role.label}
            </span>
          )}
          {s.prescribing_rights && (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-success/12 px-2 py-0.5 text-xs font-medium text-success"
              title="Caretaker has granted prescribing rights"
            >
              <Pill className="size-3" /> Prescriber
            </span>
          )}
          {revoked ? (
            <span className="rounded-md bg-critical/12 px-2 py-0.5 text-xs font-medium text-critical">
              Revoked
            </span>
          ) : (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium",
                TONE_PILL[window.tone],
              )}
            >
              {window.label}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/70">
          {license && <span className="font-mono">{license}</span>}
          {license && " · "}
          {lastSeen(s.last_login_at, nowMs)}
        </p>
      </div>
    </li>
  );
}

async function loadStaff(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenant_users")
    .select(
      "id, user_id, display_name, designation, job_title, role, prescribing_rights, license_type, license_number, status, access_starts_at, access_ends_at, last_login_at, created_at",
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  const rows = data ?? [];
  const emails = await resolveEmails(rows.map((r) => r.user_id));
  // Stamp "now" here, off the render path — the access-window badge + last-seen
  // are computed against this single instant (keeps the render pure).
  return {
    staff: rows.map((r) => ({ ...r, email: emails.get(r.user_id) ?? null })),
    nowMs: Date.now(),
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
