import { NextResponse } from "next/server";
import type { Database } from "@rolde/db";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sendTemplatedEmail } from "@/lib/email";
import { accessSentence } from "@/lib/accessWindow";
import { ROLES } from "@/lib/roles";

/**
 * Invite a teammate to the clinic (W1.1.7 chunk 2, Caretaker-only). One step from
 * invite to in: we create the auth login if the email is new (passwordless), add
 * the clinic membership with everything the Caretaker set (role, designation,
 * job title, licence, prescribing flag, access window), and email them a single-
 * use SET-PASSWORD link — they choose their own password, nobody sets it for them.
 *
 * Security: the endpoint gates on Caretaker, AND the membership INSERT goes
 * through the caretaker's own session so RLS (`is_caretaker_of`) re-checks it.
 * The login is created via the service-role admin client.
 */
type UserRole = Database["public"]["Enums"]["user_role"];

const ASSIGNABLE = new Set(
  ROLES.filter((r) => r.tier !== "platform" && r.tier !== "patient").map((r) => r.key),
);
// Prescribing can only be granted to a role that could ever prescribe (mirrors
// lib/access.ts PRESCRIBER_ROLES) — a concierge can't be flagged a prescriber.
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

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  const role = ctx?.membership?.role;
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || role !== "caretaker" || !tenantId) {
    return NextResponse.json({ ok: false, error: "not_allowed" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const displayName = String(body.display_name ?? "").trim();
  const newRole = String(body.role ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "bad_email" }, { status: 400 });
  }
  if (!displayName) {
    return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
  }
  if (!ASSIGNABLE.has(newRole)) {
    return NextResponse.json({ ok: false, error: "bad_role" }, { status: 400 });
  }

  const startsAt = isoOrNull(body.access_starts_at);
  const endsAt = isoOrNull(body.access_ends_at);
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
    return NextResponse.json({ ok: false, error: "bad_window" }, { status: 400 });
  }
  const prescribing = Boolean(body.prescribing_rights) && PRESCRIBER.has(newRole);

  const admin = createAdminClient();
  const origin = new URL(request.url).origin;

  try {
    // 1. Resolve or create the login, then mint a one-time set-password link.
    const { data: exists } = await admin.rpc("email_exists", { p_email: email });
    if (!exists) {
      const { error: cuErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (cuErr) {
        console.error("[invite] createUser:", cuErr.message);
        return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
      }
    }
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${origin}/reset` },
    });
    const userId = link?.user?.id;
    const hashed = link?.properties?.hashed_token;
    if (linkErr || !userId || !hashed) {
      return NextResponse.json({ ok: false, error: "link_failed" }, { status: 500 });
    }

    // 2. Already a member of THIS clinic? Don't duplicate — send them to Edit.
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("tenant_users")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: false, error: "already_member" }, { status: 409 });
    }

    // 3. Add the membership through the caretaker's session (RLS re-checks).
    const { data: membership, error: insErr } = await supabase
      .from("tenant_users")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        role: newRole as UserRole,
        display_name: displayName,
        designation: trimOrNull(body.designation),
        preferred_name: trimOrNull(body.preferred_name),
        job_title: trimOrNull(body.job_title),
        license_type: trimOrNull(body.license_type),
        license_number: trimOrNull(body.license_number),
        prescribing_rights: prescribing,
        access_starts_at: startsAt,
        access_ends_at: endsAt,
        status: "active",
        invited_by: ctx.user.id,
        invited_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (insErr) {
      console.error("[invite] membership insert:", insErr.message);
      return NextResponse.json({ ok: false, error: "membership_failed" }, { status: 500 });
    }

    // Activity Log: a teammate was added to the clinic.
    await logAudit({
      tenantId,
      actorUserId: ctx.user.id,
      action: "member.invite",
      resourceType: "member",
      resourceId: membership?.id,
      summary: `Invited ${displayName} as ${ROLES.find((r) => r.key === newRole)?.label ?? newRole}`,
    });

    // 4. Onboarding email — role, clinic, access duration, set-password link.
    const tRel = ctx.membership?.tenants as
      | { name?: string }
      | { name?: string }[]
      | null
      | undefined;
    const clinic = (Array.isArray(tRel) ? tRel[0]?.name : tRel?.name) ?? "your clinic";
    const roleLabel = ROLES.find((r) => r.key === newRole)?.label ?? newRole;
    const firstName = displayName.split(/\s+/)[0];
    const actionUrl = `${origin}/auth/confirm?token_hash=${hashed}&type=recovery&next=/reset`;
    try {
      await sendTemplatedEmail({
        slug: "auth_invite",
        to: email,
        toName: firstName,
        variables: {
          name: firstName,
          clinic,
          inviter: ctx.membership?.display_name ?? "Your Caretaker",
          role: roleLabel,
          access_note: accessSentence(startsAt, endsAt),
          action_url: actionUrl,
        },
        idempotencyKey: `invite:${tenantId}:${userId}:${Math.floor(Date.now() / 60000)}`,
        source: "staff-invite",
      });
    } catch (mailErr) {
      // The member is added; surface a soft warning so the Caretaker can resend.
      console.error("[invite] email send:", mailErr);
      return NextResponse.json({ ok: true, emailed: false });
    }

    return NextResponse.json({ ok: true, emailed: true });
  } catch (err) {
    console.error("[invite] error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
