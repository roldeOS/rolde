import { NextResponse } from "next/server";
import type { Database } from "@rolde/db";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ROLES } from "@/lib/roles";

/**
 * Update a member (W1.1.7 chunk 2, Caretaker-only). Handles BOTH a full edit
 * (the Edit modal) and a status flip (Deactivate/Activate). The write goes through
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
    .select("id, user_id, role, tenant_id, display_name, status, prescribing_rights")
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
    //   active = has access · deactivated = soft-revoked (restorable) · archived.
    const status = String(body.status);
    if (!["active", "deactivated", "archived"].includes(status)) return fail("bad_status");
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
      // The change itself is recorded in the Activity Log below (member.email_change) —
      // the event + actor + time, never the address (PII stays out of a platform-read log).
      didEmail = true;
    }
  }

  // ── Activity Log events ──────────────────────────────────────────────────
  // Each security-relevant change (access · role · prescribing · login email) is
  // its own audit row; a pure-detail edit gets one generic row. The member's name
  // is fine here — staff identity within their own clinic — and resource is the
  // membership, so the Custodian platform view shows the clinic, not patients.
  const label =
    (patch.display_name as string | undefined)?.trim() || target.display_name?.trim() || "a member";
  const roleName = (k: string) => ROLES.find((r) => r.key === k)?.label ?? k;
  const events: { action: string; summary: string }[] = [];
  if (patch.status && patch.status !== target.status) {
    if (patch.status === "deactivated") events.push({ action: "member.deactivate", summary: `Deactivated ${label}'s access` });
    else if (patch.status === "archived") events.push({ action: "member.archive", summary: `Archived ${label}` });
    else if (patch.status === "active") events.push({ action: "member.activate", summary: `Activated ${label}'s access` });
  }
  if (patch.role && patch.role !== target.role) {
    events.push({ action: "member.role_change", summary: `Changed ${label}'s role to ${roleName(patch.role as string)}` });
  }
  if (typeof patch.prescribing_rights === "boolean" && patch.prescribing_rights !== target.prescribing_rights) {
    events.push({
      action: "member.prescribing",
      summary: patch.prescribing_rights
        ? `Granted prescribing rights to ${label}`
        : `Removed prescribing rights from ${label}`,
    });
  }
  if (didEmail) events.push({ action: "member.email_change", summary: `Changed ${label}'s login email` });
  const DETAIL_KEYS = [
    "display_name", "designation", "preferred_name", "job_title",
    "license_type", "license_number", "access_starts_at", "access_ends_at",
  ];
  if (events.length === 0 && DETAIL_KEYS.some((k) => k in patch)) {
    events.push({ action: "member.update", summary: `Updated ${label}'s details` });
  }
  const flushAudit = () =>
    Promise.all(
      events.map((e) =>
        logAudit({
          tenantId,
          actorUserId: ctx.user.id,
          action: e.action,
          resourceType: "member",
          resourceId: target.id,
          summary: e.summary,
        }),
      ),
    );

  if (Object.keys(patch).length === 0) {
    if (didEmail) {
      await flushAudit();
      return NextResponse.json({ ok: true, emailChanged: true });
    }
    return fail("nothing_to_update");
  }
  patch.updated_at = new Date().toISOString();

  const { error: upErr } = await supabase.from("tenant_users").update(patch).eq("id", id);
  if (upErr) {
    console.error("[users/update]", upErr.message);
    return fail("update_failed", 500);
  }
  await flushAudit();
  return NextResponse.json({ ok: true, emailChanged: didEmail });
}
