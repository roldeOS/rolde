"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { Json } from "@rolde/db";
import { emailOk, phonePlausible, dobOk, nationalIdOk, asCountry } from "@/lib/validation";
import { sanitizeMarks } from "@/lib/richText";

/** B6 — a free note's inline formatting (sidecar marks), parsed + hostile-proofed
 *  against the FINAL text length at the door. Absent/empty → undefined (the
 *  payload simply carries no format_marks, and the note renders plain). */
function parseMarks(formData: FormData, textLen: number): Json | undefined {
  const raw = String(formData.get("marks") ?? "");
  if (!raw) return undefined;
  try {
    const marks = sanitizeMarks(JSON.parse(raw), textLen);
    return marks.length ? (marks as unknown as Json) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Create a patient in the caller's clinic. The clinic (tenant) comes from the
 * caller's own membership — never from the form — and RLS independently enforces
 * that they can only write into their own clinic.
 */
export async function createPatient(formData: FormData) {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!tenantId) throw new Error("No clinic context for this user.");

  const first_name = String(formData.get("first_name") ?? "").trim();
  const last_name = String(formData.get("last_name") ?? "").trim();
  const date_of_birth = String(formData.get("date_of_birth") ?? "");
  const sex_at_birth = String(formData.get("sex_at_birth") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const phone_mobile = String(formData.get("phone_mobile") ?? "").trim();
  const national_health_id = String(formData.get("national_health_id") ?? "").trim() || null;

  // Registration minimum (Roland 2026-06-11; GMC/CQC/NHS PDS): name, DOB, sex,
  // mobile and email are ALL required. The RolDe patient number auto-assigns.
  if (
    !first_name || !last_name || !date_of_birth || !sex_at_birth ||
    !phone_mobile || !email
  ) {
    throw new Error("All fields are required to register a patient.");
  }
  // The server's own validation floor (client formats per-country on top;
  // shared rules in lib/validation — 2026-07-03).
  if (!emailOk(email)) throw new Error("That email doesn't look right.");
  if (!phonePlausible(phone_mobile)) throw new Error("That phone number doesn't look right.");
  if (!dobOk(date_of_birth)) throw new Error("That date of birth doesn't look right.");
  if (national_health_id) {
    const supa = await createClient();
    const { data: tenant } = await supa
      .from("tenants")
      .select("country")
      .eq("id", tenantId)
      .maybeSingle();
    if (!nationalIdOk(national_health_id, asCountry(tenant?.country)))
      throw new Error("That health ID doesn't look right.");
  }

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("patients")
    .insert({
      tenant_id: tenantId,
      first_name,
      last_name,
      date_of_birth,
      sex_at_birth,
      email,
      phone_mobile,
      national_health_id,
      created_by: ctx?.user.id ?? null,
    })
    .select("id, patient_number")
    .single();
  if (error) throw new Error(error.message);

  // Activity Log: a new patient registration. The summary carries the clinic
  // PATIENT NUMBER (a non-identifying reference), never the name — the same row
  // is read platform-wide by a Custodian.
  await logAudit({
    tenantId,
    actorUserId: ctx?.user.id,
    action: "patient.create",
    resourceType: "patient",
    resourceId: created?.id,
    summary: created?.patient_number
      ? `Registered patient ${created.patient_number}`
      : "Registered a new patient",
  });

  revalidatePath("/patients");
  redirect("/patients");
}

/**
 * Save a clinical note into a patient's feed. The clinic comes from the caller's
 * membership; RLS independently enforces they can only write into their own clinic.
 */
export async function saveNote(formData: FormData) {
  const patientId = String(formData.get("patient_id") ?? "");
  // CRLF from browser form posts normalises to LF at the door (the
  // invisible-\r lesson, 2026-07-21) — stored records are clean text.
  const text = String(formData.get("text") ?? "").replace(/\r\n?/g, "\n").trim();
  if (!patientId || !text) return;

  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!tenantId) throw new Error("No clinic context for this user.");

  // Scribe Templates: the structured answers ride the payload so the pencil
  // can restore the FORM, not just the text (Roland 2026-07-04).
  let template: Json | undefined;
  const rawTemplate = String(formData.get("template_meta") ?? "");
  if (rawTemplate) {
    try {
      template = JSON.parse(rawTemplate) as Json;
    } catch {
      template = undefined;
    }
  }

  const marks = template === undefined ? parseMarks(formData, text.length) : undefined;

  const supabase = await createClient();
  const { error } = await supabase.from("patient_feed_entries").insert({
    tenant_id: tenantId,
    patient_id: patientId,
    entry_type: "clinical_note",
    payload: {
      text,
      word_count: text.split(/\s+/).filter(Boolean).length,
      ...(template !== undefined ? { template } : {}),
      ...(marks !== undefined ? { format_marks: marks } : {}),
    },
    created_by: ctx?.user.id ?? null,
  });
  if (error) throw new Error(error.message);

  // Activity Log: a clinical note was written. Summary is content-free metadata —
  // never the note text, never the patient name.
  await logAudit({
    tenantId,
    actorUserId: ctx?.user.id,
    action: "note.create",
    resourceType: "patient",
    resourceId: patientId,
    summary: "Added a clinical note",
  });

  revalidatePath(`/patients/${patientId}`);
}

const EDIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour (Roland 2026-06-10)

/**
 * Edit a note in place — ONLY by its author, ONLY within the hour after it was
 * written (Bible 4.6). After that the note locks; changes become amendments.
 * Author-only is also enforced at the database (RLS feed_update policy); the
 * time window is enforced here.
 */
export async function editNote(formData: FormData) {
  const entryId = String(formData.get("entry_id") ?? "");
  const patientId = String(formData.get("patient_id") ?? "");
  // CRLF from browser form posts normalises to LF at the door (the
  // invisible-\r lesson, 2026-07-21) — stored records are clean text.
  const text = String(formData.get("text") ?? "").replace(/\r\n?/g, "\n").trim();
  if (!entryId || !text) return;

  const ctx = await getSessionContext();
  const userId = ctx?.user.id;
  const tenantId = ctx?.membership?.tenant_id;
  if (!userId) throw new Error("Not signed in.");

  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("patient_feed_entries")
    .select("created_by, created_at, struck_at")
    .eq("id", entryId)
    .maybeSingle();
  if (!entry) throw new Error("Note not found.");
  if (entry.created_by !== userId)
    throw new Error("You can only edit your own notes.");
  if (entry.struck_at) throw new Error("A struck note can't be edited.");
  if (Date.now() - new Date(entry.created_at).getTime() > EDIT_WINDOW_MS)
    throw new Error("The edit window has closed. Add an amendment instead.");

  // A form-edit carries fresh template answers; a plain-text edit of a
  // template note DROPS them (the hand-edited text is now the truth).
  let template: Json | undefined;
  const rawTemplate = String(formData.get("template_meta") ?? "");
  if (rawTemplate) {
    try {
      template = JSON.parse(rawTemplate) as Json;
    } catch {
      template = undefined;
    }
  }

  const marks = template === undefined ? parseMarks(formData, text.length) : undefined;

  const { error } = await supabase
    .from("patient_feed_entries")
    .update({
      payload: {
        text,
        word_count: text.split(/\s+/).filter(Boolean).length,
        ...(template !== undefined ? { template } : {}),
        ...(marks !== undefined ? { format_marks: marks } : {}),
        },
      edited_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", entryId);
  if (error) throw new Error(error.message);

  await logAudit({
    tenantId,
    actorUserId: userId,
    action: "note.edit",
    resourceType: "patient",
    resourceId: patientId,
    summary: "Edited a clinical note within the edit window",
  });

  revalidatePath(`/patients/${patientId}`);
}

/** Toggle a strikethrough on a note — author-only (RLS-enforced). Never deletes. */
export async function strikeNote(formData: FormData) {
  const entryId = String(formData.get("entry_id") ?? "");
  const patientId = String(formData.get("patient_id") ?? "");
  const strike = String(formData.get("strike") ?? "") === "true";

  const ctx = await getSessionContext();
  const userId = ctx?.user.id;
  const tenantId = ctx?.membership?.tenant_id;
  if (!userId) throw new Error("Not signed in.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("patient_feed_entries")
    .update({
      struck_at: strike ? new Date().toISOString() : null,
      struck_by: strike ? userId : null,
    })
    .eq("id", entryId);
  if (error) throw new Error(error.message);

  await logAudit({
    tenantId,
    actorUserId: userId,
    action: strike ? "note.strike" : "note.unstrike",
    resourceType: "patient",
    resourceId: patientId,
    summary: strike ? "Struck through a clinical note" : "Lifted a strike on a clinical note",
  });

  revalidatePath(`/patients/${patientId}`);
}

/**
 * Add an amendment — a new note linked to an earlier one (related_entry_id).
 * How you correct the record once the edit window has closed; the original
 * stays put.
 */
export async function amendNote(formData: FormData) {
  const parentId = String(formData.get("parent_id") ?? "");
  const patientId = String(formData.get("patient_id") ?? "");
  // CRLF from browser form posts normalises to LF at the door (the
  // invisible-\r lesson, 2026-07-21) — stored records are clean text.
  const text = String(formData.get("text") ?? "").replace(/\r\n?/g, "\n").trim();
  if (!parentId || !patientId || !text) return;

  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!tenantId) throw new Error("No clinic context for this user.");

  const supabase = await createClient();
  // Same author = amendment · a DIFFERENT author = addendum (clinical records
  // law, Roland 2026-07-04) — the trail and audit name it truthfully.
  const { data: parent } = await supabase
    .from("patient_feed_entries")
    .select("created_by")
    .eq("id", parentId)
    .maybeSingle();
  const isAddendum = !!parent && parent.created_by !== (ctx?.user.id ?? null);

  const marks = parseMarks(formData, text.length);
  const { error } = await supabase.from("patient_feed_entries").insert({
    tenant_id: tenantId,
    patient_id: patientId,
    entry_type: "clinical_note",
    payload: {
      text,
      word_count: text.split(/\s+/).filter(Boolean).length,
      ...(marks !== undefined ? { format_marks: marks } : {}),
    },
    related_entry_id: parentId,
    created_by: ctx?.user.id ?? null,
  });
  if (error) throw new Error(error.message);

  await logAudit({
    tenantId,
    actorUserId: ctx?.user.id,
    action: isAddendum ? "note.addendum" : "note.amend",
    resourceType: "patient",
    resourceId: patientId,
    summary: isAddendum
      ? "Added an addendum to a colleague's note"
      : "Amended a clinical note",
  });

  revalidatePath(`/patients/${patientId}`);
}

/**
 * Body-Map v2 (Roland greenlit 2026-07-04) — save the annotated figure as a
 * typed feed entry: the rendered TEXT is the readable record; the structured
 * marks (pins + strokes, viewBox coordinates) ride the payload for the future
 * thumbnail + per-specialty tracking (derm lesions, injection points).
 */
export async function saveBodyMap(formData: FormData) {
  const patientId = String(formData.get("patient_id") ?? "");
  // CRLF from browser form posts normalises to LF at the door (the
  // invisible-\r lesson, 2026-07-21) — stored records are clean text.
  const text = String(formData.get("text") ?? "").replace(/\r\n?/g, "\n").trim();
  const raw = String(formData.get("body_map") ?? "");
  if (!patientId || !text || !raw) return;

  let bodyMap: Json;
  try {
    bodyMap = JSON.parse(raw) as Json;
  } catch {
    return;
  }

  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!tenantId) throw new Error("No clinic context for this user.");

  const supabase = await createClient();
  const { error } = await supabase.from("patient_feed_entries").insert({
    tenant_id: tenantId,
    patient_id: patientId,
    entry_type: "body_map",
    payload: { text, body_map: bodyMap },
    created_by: ctx?.user.id ?? null,
  });
  if (error) throw new Error(error.message);

  await logAudit({
    tenantId,
    actorUserId: ctx?.user.id,
    action: "note.body_map",
    resourceType: "patient",
    resourceId: patientId,
    summary: "Added a body map",
  });

  revalidatePath(`/patients/${patientId}`);
}

/**
 * RolDe Courier C1 (Roland 2026-07-02) — record that the CALLER has seen a feed
 * entry. Fired only by a deliberate click on the tile's "New" pill (never by
 * scrolling). Writes through the caller's own session, so RLS guarantees the
 * receipt is theirs, in their clinic; the unique (entry_id, user_id) makes it
 * idempotent. Append-only — an audited fact, never editable.
 */
export async function markEntrySeen(entryId: string) {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || !tenantId || !entryId) return;

  const supabase = await createClient();
  // Plain insert, no read-back (write-path stays role-blind; idempotent via the
  // unique index — a duplicate click is a no-op conflict we ignore).
  const { error } = await supabase.from("feed_entry_reads").insert({
    tenant_id: tenantId,
    entry_id: entryId,
    user_id: ctx.user.id,
  });
  if (error && error.code !== "23505") {
    console.error("[courier seen]", error.message);
  }
}
