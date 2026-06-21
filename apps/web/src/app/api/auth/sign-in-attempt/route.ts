import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Record a FAILED sign-in in the Sign-in & Security log (Bible 4.1 §5.4). This is
 * the one auth event GoTrue's own journal doesn't stamp with an IP — and a failed
 * attempt is the whole point of a security log ("who tried to get in, from where").
 * So our login layer reports the failure here, and the SERVER reads the IP + device
 * off the request (never trusting the client for those).
 *
 * Privacy + safety:
 *  - Always returns 204 — the response never reveals whether the email exists
 *    (no account enumeration), mirroring /api/auth/forgot-password.
 *  - Only logs attempts against a REAL account, so random probing can't flood the
 *    log; an unknown email is silently ignored.
 *  - Best-effort: a logging failure must never affect the sign-in flow.
 *
 * Successful sign-ins, sign-outs and password changes are NOT logged here — those
 * come from the durable mirror of GoTrue's journal (with their own IP + device).
 */
export async function POST(request: Request) {
  const done = () => new NextResponse(null, { status: 204 });

  let email = "";
  try {
    email = String((await request.json())?.email ?? "").trim().toLowerCase();
  } catch {
    return done();
  }
  if (!email) return done();

  try {
    const admin = createAdminClient();
    const { data: userId } = await admin.rpc("user_id_for_email", { p_email: email });
    if (!userId) return done(); // unknown account — don't log noise (or enumerate)

    const ip =
      (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      null;

    await admin.from("auth_audit_log").insert({
      user_id: userId,
      actor_email: email,
      action: "login_failed",
      ip_address: ip,
      user_agent: request.headers.get("user-agent"),
    });
  } catch {
    /* best-effort — never block sign-in on audit logging */
  }
  return done();
}
