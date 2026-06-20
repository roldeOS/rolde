import { NextResponse } from "next/server";
import type { Database } from "@rolde/db";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

/**
 * Update a member (W1.1.7 chunk 2, Caretaker-only). Handles BOTH a full edit
 * (the Edit modal) and a status flip (Revoke/Restore). The write goes through
 * the caretaker's own session so RLS (`is_caretaker_of`) re-checks it; a target
 * outside their clinic 404s. Self-lockout guards: a Caretaker can't revoke
 * themselves or change their own role.
 *
 * Email change (Roland 2026-06-21): a member can lose access to the email they
 * signed up with — losing the email must NOT mean losing the account. So a
 * Caretaker can change a member's LOGIN email here; the change goes through the
 * service-role admin client (auth.users isn't writable via RLS), is marked
 * confirmed (the Caretaker is vouching), and the Caretaker then sends a reset
 * link so the member sets a password against the new address.
 */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
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

  // ── Login email change (admin) ──────────────────────────────────────────
  // auth.users is not writable via RLS, so route through the service-role client.
  // Only fires when a valid, DIFFERENT email is supplied; marked confirmed (the
  // Caretaker vouches) — they then send a reset link so the member sets a password.
  let didEmail = false;
  if (typeof body.email === "string" && body.email.trim()) {
    const newEmail = body.email.trim().toLowerCase();
    if (!EMAIL_RE.test(newEmail)) return fail("bad_email");
    const admin = createAdminClient();
    const { data: cur } = await admin.auth.admin.getUserById(target.user_id);
    const curEmail = cur?.user?.email?.toLowerCase() ?? "";
    if (newEmail !== curEmail) {
      const { error: emailErr } = await admin.auth.admin.updateUserById(target.user_id, {
        email: newEmail,
        email_confirm: true,
      });
      if (emailErr) {
        const taken = /already|exist|registered|in use/i.test(emailErr.message);
        if (!taken) console.error("[users/update email]", emailErr.message);
        return fail(taken ? "email_taken" : "email_failed", taken ? 400 : 500);
      }
      // Audit breadcrumb in the server log until a dedicated user-admin audit
      // table lands (the access-log covers patient records, not staff identity).
      console.warn(`[users/update] ${ctx.user.id} changed login email of ${target.user_id} to ${newEmail}`);
      didEmail = true;
    }
  }

  if (Object.keys(patch).length === 0) {
    return didEmail ? NextResponse.json({ ok: true, emailChanged: true }) : fail("nothing_to_update");
  }
  patch.updated_at = new Date().toISOString();

  const { error: upErr } = await supabase.from("tenant_users").update(patch).eq("id", id);
  if (upErr) {
    console.error("[users/update]", upErr.message);
    return fail("update_failed", 500);
  }
  return NextResponse.json({ ok: true, emailChanged: didEmail });
}
