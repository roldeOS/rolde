import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile-server";
import { sendTemplatedEmail } from "@/lib/email";

/**
 * Forgot-password trigger. We mint the recovery link ourselves via the admin API
 * (so the email is OUR branded one, not Supabase's), which means we also verify
 * the Turnstile token here and rate-limiting is the secondary defence.
 *
 * No account enumeration: the response is ALWAYS `{ ok: true }` whether or not
 * the email belongs to a real account — only a captcha failure is surfaced.
 */
export async function POST(request: Request) {
  let body: { email?: string; captchaToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Captcha first — fail closed.
  if (!(await verifyTurnstile(body.captchaToken))) {
    return NextResponse.json({ ok: false, error: "captcha_failed" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const origin = new URL(request.url).origin;
  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${origin}/reset` },
    });
    const hashed = data?.properties?.hashed_token;
    if (!error && hashed) {
      const link = `${origin}/auth/confirm?token_hash=${hashed}&type=recovery&next=/reset`;
      // Personal first-name greeting where we know them; generic otherwise.
      let name = "there";
      const userId = data.user?.id;
      if (userId) {
        const { data: tu } = await admin
          .from("tenant_users")
          .select("display_name")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();
        if (tu?.display_name) name = tu.display_name.split(" ")[0];
      }
      await sendTemplatedEmail({
        slug: "auth_password_reset",
        to: email,
        toName: name,
        variables: { name, action_url: link },
        idempotencyKey: `reset:${userId ?? email}:${Math.floor(Date.now() / 60000)}`,
        source: "forgot-password",
      });
    }
  } catch (err) {
    // Never leak whether the account exists or why a send failed.
    console.error("[forgot-password] error:", err);
  }
  return NextResponse.json({ ok: true });
}
