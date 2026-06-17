import { NextResponse } from "next/server";
import type { Database } from "@rolde/db";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

/**
 * Update a member (W1.1.7 chunk 2, Caretaker-only). Handles BOTH a full edit
 * (the Edit modal) and a status flip (Revoke/Restore). The write goes through
 * the caretaker's own session so RLS (`is_caretaker_of`) re-checks it; a target
 * outside their clinic 404s. Self-lockout guards: a Caretaker can't revoke
 * themselves or change their own role.
 */
type UserRole = Database["public"]["Enums"]["user_role"];
type Patch = Database["public"]["Tables"]["tenant_users"]["Update"];

const ASSIGNABLE = new Set(
  ROLES.filter((r) => r.tier !== "platform" && r.tier !== "patient").map((r) => r.key),
);
const PRESCRIBER = new Set(["caretaker", "clinician", "locum", "practitioner", "nurse"]);

const trimOrNull = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
};
const isoOrNull = (v: unknown): string | null => {
  if (typeof v !== "string" || !v.trim()) return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
};
const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || ctx.membership?.role !== "caretaker" || !tenantId) return fail("not_allowed", 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("bad_request");
  }
  const id = String(body.id ?? "");
  if (!id) return fail("bad_request");

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("tenant_users")
    .select("id, user_id, role, tenant_id")
    .eq("id", id)
    .maybeSingle();
  if (!target || target.tenant_id !== tenantId) return fail("not_found", 404);
  const isSelf = target.user_id === ctx.user.id;

  const patch: Patch = {};

  if ("display_name" in body) {
    const dn = String(body.display_name ?? "").trim();
    if (!dn) return fail("name_required");
    patch.display_name = dn;
  }
  if ("role" in body) {
    const newRole = String(body.role);
    if (!ASSIGNABLE.has(newRole)) return fail("bad_role");
    if (isSelf && newRole !== target.role) return fail("self_role_locked");
    patch.role = newRole as UserRole;
  }
  if ("prescribing_rights" in body) {
    const effectiveRole = (patch.role as string | undefined) ?? target.role;
    patch.prescribing_rights = Boolean(body.prescribing_rights) && PRESCRIBER.has(effectiveRole);
  }
  if ("designation" in body) patch.designation = trimOrNull(body.designation);
  if ("preferred_name" in body) patch.preferred_name = trimOrNull(body.preferred_name);
  if ("job_title" in body) patch.job_title = trimOrNull(body.job_title);
  if ("license_type" in body) patch.license_type = trimOrNull(body.license_type);
  if ("license_number" in body) patch.license_number = trimOrNull(body.license_number);
  if ("access_starts_at" in body) patch.access_starts_at = isoOrNull(body.access_starts_at);
  if ("access_ends_at" in body) patch.access_ends_at = isoOrNull(body.access_ends_at);
  if (
    patch.access_starts_at &&
    patch.access_ends_at &&
    Date.parse(patch.access_ends_at) <= Date.parse(patch.access_starts_at)
  ) {
    return fail("bad_window");
  }
  if ("status" in body) {
    // The schema's membership states (CHECK tenant_users_status_valid):
    //   active = has access · paused = soft-revoked (restorable) · archived.
    const status = String(body.status);
    if (!["active", "paused", "archived"].includes(status)) return fail("bad_status");
    if (isSelf && status !== "active") return fail("self_lock");
    patch.status = status;
  }

  if (Object.keys(patch).length === 0) return fail("nothing_to_update");
  patch.updated_at = new Date().toISOString();

  const { error: upErr } = await supabase.from("tenant_users").update(patch).eq("id", id);
  if (upErr) {
    console.error("[users/update]", upErr.message);
    return fail("update_failed", 500);
  }
  return NextResponse.json({ ok: true });
}
