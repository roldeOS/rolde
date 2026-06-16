import "server-only";
import { createElement } from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { RoldeEmailShell } from "@/emails/RoldeEmailShell";

/**
 * The one way RolDe sends email (auth + operational). Looks up a content-managed
 * `email_templates` row (platform OR clinic), substitutes `{{variables}}` into
 * its structured content, renders the React Email shell to HTML + plain text,
 * sends via Resend, and logs every attempt to `transactional_emails`.
 *
 * Idempotency is atomic: when an `idempotencyKey` is given we INSERT a `queued`
 * log row FIRST (the unique index makes the claim race-safe) — a duplicate call
 * loses the claim and returns `skipped` WITHOUT a second send. Server-only
 * (service-role DB writes + RESEND_API_KEY).
 */

let resendClient: Resend | null = null;
function resend(): Resend {
  if (resendClient) return resendClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is missing — set it in .env.local and Vercel.");
  resendClient = new Resend(key);
  return resendClient;
}

function fromAddress(): string {
  const name = process.env.EMAIL_FROM_NAME ?? "RolDe";
  const addr = process.env.EMAIL_FROM_ADDRESS ?? "team@rolde.app";
  return `${name} <${addr}>`;
}

/** `{{ key }}` → variables[key] (empty string if absent — never leak a raw placeholder). */
function fill(s: string, vars: Record<string, string>): string {
  return s.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k: string) => vars[k] ?? "");
}

export interface SendTemplatedEmailArgs {
  slug: string;
  to: string;
  toName?: string;
  /** Clinic template scope; omit/null for a platform (Custodian) template. */
  tenantId?: string | null;
  variables?: Record<string, string>;
  /** Provide to make the send exactly-once (e.g. `reset:<userId>:<hour>`). */
  idempotencyKey?: string;
  source?: string;
}

export async function sendTemplatedEmail(
  args: SendTemplatedEmailArgs,
): Promise<{ id: string | null; skipped?: boolean }> {
  const {
    slug,
    to,
    toName,
    tenantId = null,
    variables = {},
    idempotencyKey,
    source = "sendTemplatedEmail",
  } = args;
  const admin = createAdminClient();

  // 1. Fetch the active template (clinic row if scoped, else the platform row).
  const base = admin.from("email_templates").select("*").eq("slug", slug).eq("is_active", true);
  const { data: tpl, error: tplErr } = tenantId
    ? await base.eq("tenant_id", tenantId).maybeSingle()
    : await base.is("tenant_id", null).maybeSingle();
  if (tplErr) throw new Error(`Email template read failed (${slug}): ${tplErr.message}`);
  if (!tpl) {
    throw new Error(
      `Email template not found/active: ${slug} (${tenantId ? `clinic ${tenantId}` : "platform"})`,
    );
  }

  // 2. Substitute variables into the structured content + render the shell.
  const subject = fill(tpl.subject, variables);
  const props = {
    preheader: fill(tpl.preheader ?? "", variables),
    headline: fill(tpl.headline ?? "", variables),
    paragraphs: tpl.paragraphs.map((p) => fill(p, variables)),
    ctaLabel: tpl.cta_label ? fill(tpl.cta_label, variables) : undefined,
    ctaUrl: tpl.cta_url ? fill(tpl.cta_url, variables) : undefined,
    footerNote: tpl.footer_note ? fill(tpl.footer_note, variables) : undefined,
  };
  const element = createElement(RoldeEmailShell, props);
  const html = await render(element);
  const text = await render(element, { plainText: true });

  // 3. Idempotency claim — INSERT a queued row; the unique index makes it atomic.
  let logId: string | null = null;
  if (idempotencyKey) {
    const { data: claimed, error: claimErr } = await admin
      .from("transactional_emails")
      .insert({
        tenant_id: tenantId,
        template_slug: slug,
        to_email: to,
        to_name: toName ?? null,
        subject,
        status: "queued",
        idempotency_key: idempotencyKey,
        variables_used: variables,
        source,
        rendered_html: html,
        rendered_text: text,
      })
      .select("id")
      .single();
    if (claimErr || !claimed) return { id: null, skipped: true }; // already claimed/sent
    logId = claimed.id;
  }

  // 4. Send.
  let messageId: string | null = null;
  try {
    const result = await resend().emails.send({ from: fromAddress(), to, subject, html, text });
    if (result.error) throw new Error(`${result.error.name}: ${result.error.message}`);
    messageId = result.data?.id ?? null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown send error";
    await finalizeLog(admin, {
      logId,
      tenantId,
      slug,
      to,
      toName,
      subject,
      status: "failed",
      errorMessage: message,
      variables,
      source,
      idempotencyKey,
      html,
      text,
    });
    throw err;
  }

  // 5. Finalize the log (update the claimed row, or insert a fresh one).
  await finalizeLog(admin, {
    logId,
    tenantId,
    slug,
    to,
    toName,
    subject,
    status: "sent",
    providerMessageId: messageId,
    variables,
    source,
    idempotencyKey,
    html,
    text,
  });
  return { id: messageId };
}

type FinalizeArgs = {
  logId: string | null;
  tenantId: string | null;
  slug: string;
  to: string;
  toName?: string;
  subject: string;
  status: "sent" | "failed";
  errorMessage?: string;
  providerMessageId?: string | null;
  variables: Record<string, string>;
  source: string;
  idempotencyKey?: string;
  html: string;
  text: string;
};

/** Best-effort — a logging failure never masks (or unsends) the email itself. */
async function finalizeLog(
  admin: ReturnType<typeof createAdminClient>,
  a: FinalizeArgs,
): Promise<void> {
  const row = {
    status: a.status,
    error_message: a.errorMessage ?? null,
    provider_message_id: a.providerMessageId ?? null,
    delivered_at: a.status === "sent" ? new Date().toISOString() : null,
  };
  try {
    if (a.logId) {
      await admin.from("transactional_emails").update(row).eq("id", a.logId);
    } else {
      await admin.from("transactional_emails").insert({
        tenant_id: a.tenantId,
        template_slug: a.slug,
        to_email: a.to,
        to_name: a.toName ?? null,
        subject: a.subject,
        idempotency_key: a.idempotencyKey ?? null,
        variables_used: a.variables,
        source: a.source,
        rendered_html: a.html,
        rendered_text: a.text,
        ...row,
      });
    }
  } catch (err) {
    console.error("[email] transactional log failed:", err);
  }
}
