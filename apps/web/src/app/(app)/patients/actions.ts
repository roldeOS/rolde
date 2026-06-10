"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";

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
  const nhs_number = String(formData.get("nhs_number") ?? "").trim() || null;

  // Registration minimum (Roland 2026-06-11; GMC/CQC/NHS PDS): name, DOB, sex,
  // mobile and email are ALL required. The RolDe patient number auto-assigns.
  if (
    !first_name || !last_name || !date_of_birth || !sex_at_birth ||
    !phone_mobile || !email
  ) {
    throw new Error("All fields are required to register a patient.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("patients").insert({
    tenant_id: tenantId,
    first_name,
    last_name,
    date_of_birth,
    sex_at_birth,
    email,
    phone_mobile,
    nhs_number,
    created_by: ctx?.user.id ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/patients");
  redirect("/patients");
}

/**
 * Save a clinical note into a patient's feed. The clinic comes from the caller's
 * membership; RLS independently enforces they can only write into their own clinic.
 */
export async function saveNote(formData: FormData) {
  const patientId = String(formData.get("patient_id") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!patientId || !text) return;

  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!tenantId) throw new Error("No clinic context for this user.");

  const supabase = await createClient();
  const { error } = await supabase.from("patient_feed_entries").insert({
    tenant_id: tenantId,
    patient_id: patientId,
    entry_type: "clinical_note",
    payload: { text, word_count: text.split(/\s+/).filter(Boolean).length },
    created_by: ctx?.user.id ?? null,
  });
  if (error) throw new Error(error.message);

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
  const text = String(formData.get("text") ?? "").trim();
  if (!entryId || !text) return;

  const ctx = await getSessionContext();
  const userId = ctx?.user.id;
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

  const { error } = await supabase
    .from("patient_feed_entries")
    .update({
      payload: { text, word_count: text.split(/\s+/).filter(Boolean).length },
      edited_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", entryId);
  if (error) throw new Error(error.message);

  revalidatePath(`/patients/${patientId}`);
}

/** Toggle a strikethrough on a note — author-only (RLS-enforced). Never deletes. */
export async function strikeNote(formData: FormData) {
  const entryId = String(formData.get("entry_id") ?? "");
  const patientId = String(formData.get("patient_id") ?? "");
  const strike = String(formData.get("strike") ?? "") === "true";

  const ctx = await getSessionContext();
  const userId = ctx?.user.id;
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
  const text = String(formData.get("text") ?? "").trim();
  if (!parentId || !patientId || !text) return;

  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!tenantId) throw new Error("No clinic context for this user.");

  const supabase = await createClient();
  const { error } = await supabase.from("patient_feed_entries").insert({
    tenant_id: tenantId,
    patient_id: patientId,
    entry_type: "clinical_note",
    payload: { text, word_count: text.split(/\s+/).filter(Boolean).length },
    related_entry_id: parentId,
    created_by: ctx?.user.id ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/patients/${patientId}`);
}
