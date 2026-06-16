import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resend delivery webhook → the Email Log shows TRUE delivery, not just "accepted".
 * Resend signs every event (Svix scheme): we verify the signature against
 * RESEND_WEBHOOK_SECRET before trusting anything, reject replays, then map the
 * event onto the matching `transactional_emails` row by provider_message_id.
 *
 * Setup (Roland): Resend → Webhooks → add `https://<prod>/api/webhooks/resend`,
 * subscribe email.sent/delivered/bounced/complained/delivery_delayed, copy the
 * Signing Secret into the Vercel env var RESEND_WEBHOOK_SECRET.
 */
const STATUS_BY_EVENT: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delayed",
  "email.bounced": "bounced",
  "email.complained": "complained",
};
const TERMINAL = ["delivered", "bounced", "complained"];

/** Svix signature: HMAC-SHA256 over `id.timestamp.body`, key = base64 after `whsec_`. */
function signatureValid(secret: string, id: string, ts: string, body: string, header: string): boolean {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = Buffer.from(
    crypto.createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64"),
  );
  // Header is a space-separated list of `v1,<sig>` — accept if any matches.
  return header.split(" ").some((part) => {
    const sig = Buffer.from(part.split(",")[1] ?? "");
    return sig.length === expected.length && crypto.timingSafeEqual(sig, expected);
  });
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const id = request.headers.get("svix-id");
  const ts = request.headers.get("svix-timestamp");
  const sig = request.headers.get("svix-signature");
  const body = await request.text();

  if (!id || !ts || !sig || !signatureValid(secret, id, ts, body, sig)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }
  // Replay guard — reject timestamps more than 5 minutes from now.
  const tsMs = Number(ts) * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
    return NextResponse.json({ error: "stale" }, { status: 401 });
  }

  let event: { type?: string; data?: { email_id?: string; bounce?: { type?: string } } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const status = event.type ? STATUS_BY_EVENT[event.type] : undefined;
  const emailId = event.data?.email_id;
  // Ack unknown/unmapped events so Resend doesn't retry them.
  if (!status || !emailId) return NextResponse.json({ ok: true, ignored: true });

  const update: { status: string; delivered_at?: string; error_message?: string } = { status };
  if (event.type === "email.delivered") update.delivered_at = new Date().toISOString();
  if (event.type === "email.bounced") {
    update.error_message = event.data?.bounce?.type ? `bounced: ${event.data.bounce.type}` : "bounced";
  }

  let query = createAdminClient()
    .from("transactional_emails")
    .update(update)
    .eq("provider_message_id", emailId);
  // A late, non-terminal event (sent/delayed) must never clobber a terminal one.
  if (!TERMINAL.includes(status)) query = query.not("status", "in", `(${TERMINAL.join(",")})`);
  await query;

  return NextResponse.json({ ok: true });
}
