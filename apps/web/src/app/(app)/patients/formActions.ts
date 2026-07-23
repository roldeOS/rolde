"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sendTemplatedEmail } from "@/lib/email";
import { emailOk } from "@/lib/validation";
import { sanitiseParts, type TemplatePart } from "@/lib/scribeTemplates";
import type { Json } from "@rolde/db";

/**
 * Scribe T4 — PATIENT-FACING FORMS, the send side (Roland "Go for T4",
 * 2026-07-21). A patient-facing template travels to the patient exactly the
 * way a letter does: a PHI-minimal RolDe-shell email carrying a Courier
 * secure link; the token viewer is envelope-first and the submission lands in
 * the feed as a typed form_response. THE SNAPSHOT LAW: the template is frozen
 * into the request at send — what the patient sees never changes underneath
 * them, and the response renders forever from its own copy.
 */
export type ActionResult = { ok: true } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

const TOKEN_DAYS = 30;

async function requireClinic() {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || !tenantId) return null;
  return { userId: ctx.user.id, tenantId, supabase: await createClient() };
}

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export type FormSendContext = {
  patient: { name: string; email: string | null };
  templates: { id: string; name: string; specialty: string; partsCount: number }[];
  requests: { templateName: string; status: string; sentAt: string | null }[];
};

/** What the Send-A-Form sheet needs: the patient's email, the PATIENT-FACING
 *  active templates (the Caretaker's T3 eligibility flag), recent requests. */
export async function getFormSendContext(
  patientId: string,
): Promise<{ ok: true; data: FormSendContext } | { ok: false; error: string }> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  const [{ data: patient }, { data: templates }, { data: requests }] = await Promise.all([
    c.supabase
      .from("patients")
      .select("first_name, last_name, email")
      .eq("id", patientId)
      .is("deleted_at", null)
      .maybeSingle(),
    c.supabase
      .from("clinic_templates")
      .select("id, name, specialty, parts")
      .eq("tenant_id", c.tenantId)
      .eq("is_active", true)
      .eq("patient_facing", true)
      .is("deleted_at", null)
      .order("name"),
    c.supabase
      .from("form_requests")
      .select("template_snapshot, status, sent_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (!patient) return fail("That patient wasn’t found.");
  return {
    ok: true,
    data: {
      patient: { name: `${patient.first_name} ${patient.last_name}`.trim(), email: patient.email },
      templates: (templates ?? []).flatMap((t) => {
        const parts = sanitiseParts(t.parts);
        return parts
          ? [{ id: t.id, name: t.name, specialty: t.specialty, partsCount: parts.length }]
          : [];
      }),
      requests: (requests ?? []).map((r) => ({
        templateName: String((r.template_snapshot as { name?: string } | null)?.name ?? "Form"),
        status: r.status,
        sentAt: r.sent_at,
      })),
    },
  };
}

export async function sendFormRequest(input: {
  patientId: string;
  templateId: string;
}): Promise<ActionResult> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  const [{ data: patient }, { data: template }, { data: tenant }, { data: sender }] =
    await Promise.all([
      c.supabase
        .from("patients")
        .select("id, first_name, last_name, email")
        .eq("id", input.patientId)
        .is("deleted_at", null)
        .maybeSingle(),
      c.supabase
        .from("clinic_templates")
        .select("id, name, specialty, parts, is_active, patient_facing")
        .eq("id", input.templateId)
        .eq("tenant_id", c.tenantId)
        .is("deleted_at", null)
        .maybeSingle(),
      c.supabase.from("tenants").select("name").eq("id", c.tenantId).maybeSingle(),
      c.supabase
        .from("tenant_users")
        .select("display_name, designation")
        .eq("tenant_id", c.tenantId)
        .eq("user_id", c.userId)
        .maybeSingle(),
    ]);
  if (!patient) return fail("That patient wasn’t found.");
  if (!patient.email || !emailOk(patient.email))
    return fail("The patient has no valid email on file — add one in the Profile first.");
  if (!template) return fail("That template wasn’t found.");
  // The Caretaker's T3 governance decides what may face a patient — enforced
  // here even if a stale sheet offers it.
  if (!template.is_active || !template.patient_facing)
    return fail("That template isn’t marked Patient-Facing — the Caretaker governs this in Settings.");
  const parts = sanitiseParts(template.parts);
  if (!parts) return fail("That template has no usable parts.");

  const name = `${patient.first_name} ${patient.last_name}`.trim();
  const token = crypto.randomBytes(32).toString("base64url");
  const snapshot: { name: string; specialty: string; parts: TemplatePart[] } = {
    name: template.name,
    specialty: template.specialty,
    parts,
  };

  const { data: request, error: reqErr } = await c.supabase
    .from("form_requests")
    .insert({
      tenant_id: c.tenantId,
      patient_id: patient.id,
      template_id: template.id,
      template_snapshot: snapshot as unknown as Json,
      recipient_name: name,
      recipient_email: patient.email,
      status: "queued",
      view_token: token,
      token_expires_at: new Date(Date.now() + TOKEN_DAYS * 86400_000).toISOString(),
      sent_by: c.userId,
    })
    .select("id")
    .single();
  if (reqErr || !request) {
    if (reqErr) console.error("[form send] request", reqErr.message);
    return fail("That didn’t save — try again.");
  }

  // Clinic email dress if the clinic overrode the platform envelope.
  const admin = createAdminClient();
  const { data: clinicTpl } = await admin
    .from("email_templates")
    .select("id")
    .eq("slug", "courier-form")
    .eq("tenant_id", c.tenantId)
    .eq("is_active", true)
    .maybeSingle();

  const clinicName = tenant?.name ?? "your clinic";
  const dn = sender?.display_name?.trim() ?? "";
  const desig = sender?.designation?.trim() ?? "";
  const senderName =
    (desig && dn && !dn.toLowerCase().startsWith(desig.toLowerCase()) ? `${desig} ${dn}` : dn) ||
    "The clinical team";
  const senderLine = `${senderName} at ${clinicName} has asked you to complete “${template.name}” securely online.`;

  try {
    await sendTemplatedEmail({
      slug: "courier-form",
      to: patient.email,
      toName: name,
      tenantId: clinicTpl ? c.tenantId : null,
      variables: {
        clinic_name: clinicName,
        recipient_name: name,
        sender_line: senderLine,
        secure_link: `${siteUrl()}/courier/form/${token}`,
      },
      idempotencyKey: `form:${request.id}`,
      source: "form.send",
    });
  } catch (e) {
    console.error("[form send]", e instanceof Error ? e.message : e);
    await c.supabase
      .from("form_requests")
      .update({
        status: "failed",
        failed_reason: e instanceof Error ? e.message : "send error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id);
    return fail("The email couldn’t be sent — the request is marked Failed.");
  }

  const sentAt = new Date().toISOString();
  await c.supabase
    .from("form_requests")
    .update({ status: "sent", sent_at: sentAt, updated_at: sentAt })
    .eq("id", request.id);

  // The Courier evolving note (Roland 2026-07-23) — ONE feed entry that documents
  // the courier the moment it leaves, and EVOLVES: a resend appends a line, and
  // the patient's response updates THIS entry in place (never a separate note).
  const { data: entry } = await c.supabase
    .from("patient_feed_entries")
    .insert({
      tenant_id: c.tenantId,
      patient_id: patient.id,
      entry_type: "courier_form",
      created_by: c.userId,
      payload: {
        text: `RolDe Courier — “${template.name}” sent to ${name}. Awaiting the patient's response.`,
        status: "Awaiting Response",
        courier: {
          form_name: template.name,
          recipient: name,
          status: "sent",
          request_id: request.id,
          events: [{ kind: "sent", at: sentAt, by: c.userId }],
        },
      } as unknown as Json,
    })
    .select("id")
    .single();
  if (entry) {
    await c.supabase
      .from("form_requests")
      .update({ feed_entry_id: entry.id })
      .eq("id", request.id);
  }

  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "form.send",
    resourceType: "patient",
    resourceId: patient.id,
    summary: `Sent the “${template.name}” form to the patient`,
    metadata: { form_request_id: request.id, template_id: template.id, feed_entry_id: entry?.id },
  });
  revalidatePath(`/patients/${patient.id}`);
  return { ok: true };
}

/**
 * Resend a Courier form (Roland 2026-07-23) — re-emails the same secure link,
 * extends its expiry, and appends a "Resent" line to the SAME evolving courier
 * entry's Status Trail (its own audit line, with date + time). It never touches
 * the response: a submitted form can't be resent.
 */
export async function resendFormRequest(requestId: string): Promise<ActionResult> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  const { data: r } = await c.supabase
    .from("form_requests")
    .select(
      "id, patient_id, recipient_name, recipient_email, view_token, status, feed_entry_id, template_snapshot",
    )
    .eq("id", requestId)
    .eq("tenant_id", c.tenantId)
    .maybeSingle();
  if (!r) return fail("That Courier request wasn’t found.");
  if (r.status === "submitted")
    return fail("The patient has already responded — there's nothing to resend.");
  if (!r.recipient_email || !emailOk(r.recipient_email))
    return fail("The patient has no valid email on file.");

  const snap = r.template_snapshot as { name?: string } | null;
  const formName = String(snap?.name ?? "form");

  const [{ data: tenant }, { data: sender }] = await Promise.all([
    c.supabase.from("tenants").select("name").eq("id", c.tenantId).maybeSingle(),
    c.supabase
      .from("tenant_users")
      .select("display_name, designation")
      .eq("tenant_id", c.tenantId)
      .eq("user_id", c.userId)
      .maybeSingle(),
  ]);
  const admin = createAdminClient();
  const { data: clinicTpl } = await admin
    .from("email_templates")
    .select("id")
    .eq("slug", "courier-form")
    .eq("tenant_id", c.tenantId)
    .eq("is_active", true)
    .maybeSingle();

  const clinicName = tenant?.name ?? "your clinic";
  const dn = sender?.display_name?.trim() ?? "";
  const desig = sender?.designation?.trim() ?? "";
  const senderName =
    (desig && dn && !dn.toLowerCase().startsWith(desig.toLowerCase()) ? `${desig} ${dn}` : dn) ||
    "The clinical team";
  const senderLine = `${senderName} at ${clinicName} has asked you to complete “${formName}” securely online.`;

  const at = new Date().toISOString();
  try {
    await sendTemplatedEmail({
      slug: "courier-form",
      to: r.recipient_email,
      toName: r.recipient_name,
      tenantId: clinicTpl ? c.tenantId : null,
      variables: {
        clinic_name: clinicName,
        recipient_name: r.recipient_name,
        sender_line: senderLine,
        secure_link: `${siteUrl()}/courier/form/${r.view_token}`,
      },
      idempotencyKey: `form:${r.id}:resend:${at}`,
      source: "form.resend",
    });
  } catch (e) {
    console.error("[form resend]", e instanceof Error ? e.message : e);
    return fail("The email couldn’t be sent — try again.");
  }

  await c.supabase
    .from("form_requests")
    .update({
      status: "sent",
      sent_at: at,
      token_expires_at: new Date(Date.now() + TOKEN_DAYS * 86400_000).toISOString(),
      updated_at: at,
    })
    .eq("id", r.id);

  // Append a "Resent" line to the evolving entry's Status Trail.
  if (r.feed_entry_id) {
    const { data: ent } = await c.supabase
      .from("patient_feed_entries")
      .select("payload")
      .eq("id", r.feed_entry_id)
      .maybeSingle();
    const payload = (ent?.payload ?? {}) as Record<string, unknown>;
    const courier = (payload.courier as Record<string, unknown>) ?? {
      form_name: formName,
      recipient: r.recipient_name,
      request_id: r.id,
      events: [],
    };
    const events = Array.isArray(courier.events) ? courier.events : [];
    courier.events = [...events, { kind: "resent", at, by: c.userId }];
    courier.status = "sent";
    await c.supabase
      .from("patient_feed_entries")
      .update({
        payload: { ...payload, courier, status: "Awaiting Response" } as unknown as Json,
        edited_at: at,
      })
      .eq("id", r.feed_entry_id);
  }

  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "form.resend",
    resourceType: "patient",
    resourceId: r.patient_id,
    summary: `Resent the “${formName}” Courier form to the patient`,
    metadata: { form_request_id: r.id },
  });
  revalidatePath(`/patients/${r.patient_id}`);
  return { ok: true };
}
