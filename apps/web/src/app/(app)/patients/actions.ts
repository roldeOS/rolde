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
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone_mobile = String(formData.get("phone_mobile") ?? "").trim() || null;

  if (!first_name || !last_name || !date_of_birth || !sex_at_birth) {
    throw new Error("First name, last name, date of birth and sex are required.");
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
