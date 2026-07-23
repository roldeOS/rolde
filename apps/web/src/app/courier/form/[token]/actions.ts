"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import {
  sanitiseParts,
  sanitiseAnswers,
  renderTemplate,
  templateHasAnswers,
} from "@/lib/scribeTemplates";
import type { Json } from "@rolde/db";

/** WHO-WHEN-WHERE evidence (T4.1, the e-consent standard): IP + user agent
 *  captured at open and at submit, held on the request row. */
async function requestEvidence(): Promise<{ ip: string | null; ua: string | null }> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return {
    ip: (fwd ? fwd.split(",")[0].trim() : h.get("x-real-ip")) || null,
    ua: h.get("user-agent")?.slice(0, 300) || null,
  };
}

/**
 * The Courier FORM viewer's actions (T4) — token possession is the
 * authorisation (the letter-viewer law): a human's "Start The Form" press is
 * the honest Opened signal, and the submission is sanitised against the
 * FROZEN snapshot before it becomes a typed form_response feed entry.
 * One submission per request — a submitted form never reopens.
 */
export async function openFormRequest(token: string): Promise<void> {
  if (!token || token.length < 20) return;
  const admin = createAdminClient();
  const { data: r } = await admin
    .from("form_requests")
    .select("id, status, opened_at, token_expires_at, feed_entry_id")
    .eq("view_token", token)
    .maybeSingle();
  if (!r || r.opened_at || r.status === "submitted") {
    revalidatePath(`/courier/form/${token}`);
    return;
  }
  if (new Date(r.token_expires_at) < new Date()) return;
  const ev = await requestEvidence();
  const at = new Date().toISOString();
  await admin
    .from("form_requests")
    .update({
      status: "opened",
      opened_at: at,
      opened_ip: ev.ip,
      opened_user_agent: ev.ua,
      updated_at: at,
    })
    .eq("id", r.id);

  // Append an "Opened" line to the evolving courier entry's Status Trail (once).
  if (r.feed_entry_id) {
    const { data: ent } = await admin
      .from("patient_feed_entries")
      .select("payload")
      .eq("id", r.feed_entry_id)
      .maybeSingle();
    const payload = (ent?.payload ?? {}) as Record<string, unknown>;
    const courier = payload.courier as Record<string, unknown> | undefined;
    if (courier) {
      const events = Array.isArray(courier.events) ? courier.events : [];
      if (!events.some((x) => (x as { kind?: string }).kind === "opened")) {
        courier.events = [...events, { kind: "opened", at }];
        await admin
          .from("patient_feed_entries")
          .update({ payload: { ...payload, courier } as unknown as Json, edited_at: at })
          .eq("id", r.feed_entry_id);
      }
    }
  }
  revalidatePath(`/courier/form/${token}`);
}

export async function submitFormResponse(
  token: string,
  rawAnswers: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!token || token.length < 20) return { ok: false, error: "This link isn’t valid." };
  const admin = createAdminClient();
  const { data: r } = await admin
    .from("form_requests")
    .select(
      "id, tenant_id, patient_id, template_snapshot, recipient_name, status, token_expires_at, sent_by, feed_entry_id",
    )
    .eq("view_token", token)
    .maybeSingle();
  if (!r) return { ok: false, error: "This link isn’t valid." };
  if (new Date(r.token_expires_at) < new Date())
    return { ok: false, error: "This link has expired — ask the clinic to send the form again." };
  if (r.status === "submitted")
    return { ok: false, error: "This form has already been submitted — thank you." };

  const snap = r.template_snapshot as { name?: string; parts?: unknown } | null;
  const parts = snap?.parts ? sanitiseParts(snap.parts) : null;
  if (!parts) return { ok: false, error: "This form is no longer available." };
  const template = { id: "form", name: String(snap?.name ?? "Form"), specialty: "", parts };

  const answers = sanitiseAnswers(parts, rawAnswers);
  if (!templateHasAnswers(template, answers))
    return { ok: false, error: "Please answer at least one question before submitting." };

  const text = `${renderTemplate(template, answers)}\n\nSubmitted by ${r.recipient_name} via a secure RolDe Courier form.`;
  const at = new Date().toISOString();
  const responseTemplate = { id: "form", name: template.name, parts, answers };

  // The Courier evolving note (Roland 2026-07-23): the response UPDATES the same
  // entry the send created — advancing its Status Trail to Responded and rendering
  // the filled form in place. Legacy requests (sent before this change) have no
  // link, so they fall back to a standalone form_response entry as before.
  let entryId = r.feed_entry_id as string | null;
  if (entryId) {
    const { data: ent } = await admin
      .from("patient_feed_entries")
      .select("payload")
      .eq("id", entryId)
      .maybeSingle();
    const payload = (ent?.payload ?? {}) as Record<string, unknown>;
    const courier = (payload.courier as Record<string, unknown>) ?? {};
    const events = Array.isArray(courier.events) ? courier.events : [];
    courier.events = [...events, { kind: "responded", at }];
    courier.status = "responded";
    const { error: upErr } = await admin
      .from("patient_feed_entries")
      .update({
        payload: {
          ...payload,
          text,
          status: "Responded",
          patient_submitted: true,
          courier,
          template: responseTemplate,
        } as unknown as Json,
        edited_at: at,
        updated_at: at,
      })
      .eq("id", entryId);
    if (upErr) {
      console.error("[form submit] update entry", upErr.message);
      return { ok: false, error: "That didn’t save — please try again." };
    }
  } else {
    const { data: entry, error: entryErr } = await admin
      .from("patient_feed_entries")
      .insert({
        tenant_id: r.tenant_id,
        patient_id: r.patient_id,
        entry_type: "form_response",
        created_by: r.sent_by,
        payload: {
          text,
          patient_submitted: true,
          template: responseTemplate,
        } as unknown as Json,
      })
      .select("id")
      .single();
    if (entryErr || !entry) {
      console.error("[form submit] entry", entryErr?.message);
      return { ok: false, error: "That didn’t save — please try again." };
    }
    entryId = entry.id;
  }

  const ev = await requestEvidence();
  await admin
    .from("form_requests")
    .update({
      status: "submitted",
      submitted_at: at,
      submitted_ip: ev.ip,
      submitted_user_agent: ev.ua,
      response_entry_id: entryId,
      updated_at: at,
    })
    .eq("id", r.id);
  await logAudit({
    tenantId: r.tenant_id,
    actorUserId: r.sent_by,
    action: "form.submitted",
    resourceType: "patient",
    resourceId: r.patient_id,
    summary: `The patient submitted the “${template.name}” form`,
    metadata: { form_request_id: r.id, entry_id: entryId, submitted_ip: ev.ip },
  });
  revalidatePath(`/courier/form/${token}`);
  return { ok: true };
}
