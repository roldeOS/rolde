import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth";
import { sendTemplatedEmail } from "@/lib/email";

/**
 * Send a member a password-reset link (W1.1.7 chunk 2, Caretaker-only). The
 * Caretaker can trigger a reset for anyone in THEIR clinic — we mint the recovery
 * link via the admin API and send our branded email (reusing auth_password_reset).
 * Nobody sets anyone's password; the member chooses their own on /reset.
 */
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
    .select("user_id, display_name, tenant_id")
    .eq("id", id)
    .maybeSingle();
  if (!target || target.tenant_id !== tenantId) return fail("not_found", 404);

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(target.user_id);
  const email = authUser?.user?.email;
  if (!email) return fail("no_email", 500);

  const origin = new URL(request.url).origin;
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${origin}/reset` },
  });
  const hashed = link?.properties?.hashed_token;
  if (linkErr || !hashed) return fail("link_failed", 500);

  const firstName = (target.display_name ?? "there").split(/\s+/)[0];
  const actionUrl = `${origin}/auth/confirm?token_hash=${hashed}&type=recovery&next=/reset`;
  try {
    await sendTemplatedEmail({
      slug: "auth_password_reset",
      to: email,
      toName: firstName,
      variables: { name: firstName, action_url: actionUrl },
      idempotencyKey: `caretaker-reset:${target.user_id}:${Math.floor(Date.now() / 60000)}`,
      source: "caretaker-reset",
    });
  } catch (err) {
    console.error("[users/reset-link]", err);
    return fail("send_failed", 500);
  }
  return NextResponse.json({ ok: true });
}
