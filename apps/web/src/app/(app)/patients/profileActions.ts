"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { logAudit, logFieldChanges } from "@/lib/audit";
import {
  PATIENT_DETAILS_FIELDS,
  ALLERGY_FIELDS,
  PROBLEM_FIELDS,
  MEDICATION_FIELDS,
  ALERT_FIELDS,
} from "@/lib/auditFields";
import { emailOk, phonePlausible, dobOk, nationalIdOk, asCountry } from "@/lib/validation";

/**
 * The Profile overlay's server actions (W1.2, Roland 2026-07-03) — demographics,
 * next of kin, the patient's care team (the Courier's address hooks) and the
 * allergy/PMH/medication editors. The grammar everywhere:
 *  - the tenant comes from the CALLER's membership (never the form), RLS
 *    independently re-checks, and the patient is verified to be IN the
 *    caller's clinic before any write;
 *  - every by-id mutation is BOUND to that patient (id + patient_id) and
 *    read-back-checked, so a wrong/foreign/soft-deleted id is an honest error,
 *    never a silent no-op;
 *  - EXPECTED failures return { error } — Next masks thrown server-action
 *    messages in production, so a throw is reserved for the unexpected;
 *  - every write lands in the Activity Log (content-free summaries; the
 *    field-level detail carries the before→after), and clinically significant
 *    record changes ALSO post a typed entry into the Clinical Notes feed
 *    (the gold-mine timeline law).
 */
export type ActionResult = { ok: true } | { ok: false; error: string };
const fail = (error: string): ActionResult => ({ ok: false, error });
const SAVE_FAILED = "That didn’t save — try again.";

async function requireClinic() {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || !tenantId) return null;
  return { userId: ctx.user.id, tenantId, supabase: await createClient() };
}
type Clinic = NonNullable<Awaited<ReturnType<typeof requireClinic>>>;

/** The patient must be VISIBLE in the caller's clinic (RLS-scoped read) —
 *  otherwise a crafted patient_id could write rows against a foreign patient. */
async function patientInClinic(c: Clinic, patientId: string): Promise<boolean> {
  const { data } = await c.supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .is("deleted_at", null)
    .maybeSingle();
  return !!data;
}

/** A record change is a FEED entry — typed, verbatim, in the timeline. A
 *  failure can't un-save the already-committed record row, so it degrades
 *  LOUDLY: an Activity-Log row marks the missing timeline note. */
async function postRecordEntry(
  c: Clinic,
  args: {
    patientId: string;
    type: "allergy_recorded" | "problem_recorded" | "medication_recorded";
    text: string;
  },
) {
  const { error } = await c.supabase.from("patient_feed_entries").insert({
    tenant_id: c.tenantId,
    patient_id: args.patientId,
    entry_type: args.type,
    payload: { text: args.text },
    created_by: c.userId,
  });
  if (error) {
    console.error("[profile feed]", error.message);
    await logAudit({
      tenantId: c.tenantId,
      actorUserId: c.userId,
      action: "record.feed_note_failed",
      resourceType: "patient",
      resourceId: args.patientId,
      summary: `A record change saved but its timeline note failed (${args.type})`,
    });
  }
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const orNull = (v: string) => (v ? v : null);
/** A browser-supplied local calendar date (YYYY-MM-DD) — else today in UTC. */
const localDateOr = (v: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : new Date().toISOString().slice(0, 10);

// ── Demographics & contact (the patients row) ────────────────────────────────

export async function updatePatientDetails(formData: FormData): Promise<ActionResult> {
  const patientId = str(formData, "patient_id");
  if (!patientId) return fail("Missing patient.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  if (!(await patientInClinic(c, patientId))) return fail("Patient not found.");

  const fields = {
    title: orNull(str(formData, "title")),
    first_name: str(formData, "first_name"),
    middle_names: orNull(str(formData, "middle_names")),
    last_name: str(formData, "last_name"),
    known_as: orNull(str(formData, "known_as")),
    date_of_birth: str(formData, "date_of_birth"),
    sex_at_birth: str(formData, "sex_at_birth"),
    gender_identity: orNull(str(formData, "gender_identity")),
    pronouns: orNull(str(formData, "pronouns")),
    national_health_id: orNull(str(formData, "national_health_id")),
    ethnicity: orNull(str(formData, "ethnicity")),
    preferred_language: orNull(str(formData, "preferred_language")),
    interpreter_needed: str(formData, "interpreter_needed") === "true",
    communication_needs: orNull(str(formData, "communication_needs")),
    contact_preference: orNull(str(formData, "contact_preference")),
    occupation: orNull(str(formData, "occupation")),
    nominated_pharmacy: orNull(str(formData, "nominated_pharmacy")),
    phone_mobile: str(formData, "phone_mobile"),
    email: str(formData, "email"),
    address_line1: orNull(str(formData, "address_line1")),
    address_line2: orNull(str(formData, "address_line2")),
    city: orNull(str(formData, "city")),
    postcode: orNull(str(formData, "postcode")),
  };
  // The registration minimum stays the minimum (GMC/CQC/NHS PDS): identity +
  // reachability are never blanked.
  if (
    !fields.first_name || !fields.last_name || !fields.date_of_birth ||
    !fields.sex_at_birth || !fields.phone_mobile || !fields.email
  ) {
    return fail("Name, date of birth, sex, mobile and email are required.");
  }
  // The server's own validation floor (the client formats per-country on top).
  if (!emailOk(fields.email)) return fail("That email doesn’t look right.");
  if (!phonePlausible(fields.phone_mobile))
    return fail("That phone number doesn’t look right.");
  if (!dobOk(fields.date_of_birth))
    return fail("That date of birth doesn’t look right.");
  if (fields.national_health_id) {
    // Validate the national health ID against the CLINIC's country (NHS/CHI
    // Modulus-11 for GB · ABHA for IN · IHI for AU · …).
    const { data: tenant } = await c.supabase
      .from("tenants")
      .select("country")
      .eq("id", c.tenantId)
      .maybeSingle();
    if (!nationalIdOk(fields.national_health_id, asCountry(tenant?.country)))
      return fail("That health ID doesn’t look right — please re-check it.");
  }

  // The CURRENT row, to diff for the audit trail (server-authoritative).
  const { data: before } = await c.supabase
    .from("patients")
    .select(
      "title, first_name, middle_names, last_name, known_as, date_of_birth, sex_at_birth, gender_identity, pronouns, national_health_id, ethnicity, preferred_language, interpreter_needed, communication_needs, contact_preference, occupation, nominated_pharmacy, phone_mobile, email, address_line1, address_line2, city, postcode",
    )
    .eq("id", patientId)
    .maybeSingle();
  if (!before) return fail("Patient not found.");

  const { error } = await c.supabase
    .from("patients")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", patientId);
  if (error) {
    console.error("[profile details]", error.message);
    return fail(SAVE_FAILED);
  }

  await logFieldChanges({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "patient.update",
    subject: "patient details",
    before: before as Record<string, unknown>,
    after: fields as Record<string, unknown>,
    fields: PATIENT_DETAILS_FIELDS,
    resourceType: "patient",
    resourceId: patientId,
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

// ── Allergies (safety-critical — every change is a feed entry) ───────────────

const SEVERITIES = ["low", "moderate", "severe", "life_threatening"] as const;
type Severity = (typeof SEVERITIES)[number];
const asSeverity = (v: string): Severity =>
  (SEVERITIES as readonly string[]).includes(v) ? (v as Severity) : "moderate";
const sevLabel = (v: string) => v.replace(/_/g, " ");

export async function addAllergy(formData: FormData): Promise<ActionResult> {
  const patientId = str(formData, "patient_id");
  const substance = str(formData, "substance");
  const reaction = str(formData, "reaction");
  if (!patientId || !substance || !reaction)
    return fail("Substance and reaction are required.");
  const severity = asSeverity(str(formData, "severity"));
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  if (!(await patientInClinic(c, patientId))) return fail("Patient not found.");

  const { error } = await c.supabase.from("patient_allergies").insert({
    tenant_id: c.tenantId,
    patient_id: patientId,
    substance,
    reaction,
    severity,
    notes: orNull(str(formData, "notes")),
    created_by: c.userId,
  });
  if (error) {
    console.error("[allergy add]", error.message);
    return fail(SAVE_FAILED);
  }

  await postRecordEntry(c, {
    patientId,
    type: "allergy_recorded",
    text: `Allergy recorded: ${substance} — ${reaction} (${sevLabel(severity)}).`,
  });
  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "allergy.add",
    resourceType: "patient",
    resourceId: patientId,
    summary: "Recorded an allergy",
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

export async function updateAllergy(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id");
  const patientId = str(formData, "patient_id");
  const substance = str(formData, "substance");
  const reaction = str(formData, "reaction");
  if (!id || !patientId || !substance || !reaction)
    return fail("Substance and reaction are required.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  // Before-read (also proves the row belongs to THIS patient in THIS clinic).
  const { data: before } = await c.supabase
    .from("patient_allergies")
    .select("substance, reaction, severity, notes")
    .eq("id", id)
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!before) return fail("That allergy record wasn’t found.");

  const after = {
    substance,
    reaction,
    severity: asSeverity(str(formData, "severity")),
    notes: orNull(str(formData, "notes")),
  };
  const { data: updated, error } = await c.supabase
    .from("patient_allergies")
    .update(after)
    .eq("id", id)
    .eq("patient_id", patientId)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    if (error) console.error("[allergy edit]", error.message);
    return fail(SAVE_FAILED);
  }

  // An allergy EDIT is safety-relevant — timeline-noted + field-level audit.
  await postRecordEntry(c, {
    patientId,
    type: "allergy_recorded",
    text: `Allergy updated: ${substance} — ${reaction} (${sevLabel(after.severity)}).`,
  });
  await logFieldChanges({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "allergy.edit",
    subject: "an allergy record",
    before: before as Record<string, unknown>,
    after: after as Record<string, unknown>,
    fields: ALLERGY_FIELDS,
    resourceType: "patient",
    resourceId: patientId,
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

/** Mark an allergy inactive (e.g. disproved) — never deleted; feed-noted. */
export async function deactivateAllergy(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id");
  const patientId = str(formData, "patient_id");
  if (!id || !patientId) return fail("Missing allergy.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  const { data: row, error } = await c.supabase
    .from("patient_allergies")
    .update({ status: "inactive" })
    .eq("id", id)
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .select("substance")
    .maybeSingle();
  if (error || !row) {
    if (error) console.error("[allergy deactivate]", error.message);
    return fail(error ? SAVE_FAILED : "That allergy record wasn’t found.");
  }

  await postRecordEntry(c, {
    patientId,
    type: "allergy_recorded",
    text: `Allergy marked inactive: ${row.substance}.`,
  });
  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "allergy.deactivate",
    resourceType: "patient",
    resourceId: patientId,
    summary: "Marked an allergy inactive",
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

// ── Past Medical History / problems ──────────────────────────────────────────

export async function addProblem(formData: FormData): Promise<ActionResult> {
  const patientId = str(formData, "patient_id");
  const title = str(formData, "title");
  if (!patientId || !title) return fail("The problem needs a name.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  if (!(await patientInClinic(c, patientId))) return fail("Patient not found.");

  const { error } = await c.supabase.from("patient_problems").insert({
    tenant_id: c.tenantId,
    patient_id: patientId,
    title,
    onset_date: orNull(str(formData, "onset_date")),
    notes: orNull(str(formData, "notes")),
    created_by: c.userId,
  });
  if (error) {
    console.error("[problem add]", error.message);
    return fail(SAVE_FAILED);
  }

  await postRecordEntry(c, {
    patientId,
    type: "problem_recorded",
    text: `Problem recorded: ${title}.`,
  });
  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "problem.add",
    resourceType: "patient",
    resourceId: patientId,
    summary: "Recorded a problem in the medical history",
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

export async function updateProblem(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id");
  const patientId = str(formData, "patient_id");
  const title = str(formData, "title");
  if (!id || !patientId || !title) return fail("The problem needs a name.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  const { data: before } = await c.supabase
    .from("patient_problems")
    .select("title, onset_date, notes")
    .eq("id", id)
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!before) return fail("That problem wasn’t found.");

  const after = {
    title,
    onset_date: orNull(str(formData, "onset_date")),
    notes: orNull(str(formData, "notes")),
  };
  const { data: updated, error } = await c.supabase
    .from("patient_problems")
    .update({ ...after, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("patient_id", patientId)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    if (error) console.error("[problem edit]", error.message);
    return fail(SAVE_FAILED);
  }

  await logFieldChanges({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "problem.edit",
    subject: "a problem in the medical history",
    before: before as Record<string, unknown>,
    after: after as Record<string, unknown>,
    fields: PROBLEM_FIELDS,
    resourceType: "patient",
    resourceId: patientId,
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

/** Flip a problem between active ↔ resolved — resolution is feed-noted. */
export async function setProblemStatus(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id");
  const patientId = str(formData, "patient_id");
  const status = str(formData, "status");
  if (!id || !patientId || !["active", "resolved"].includes(status))
    return fail("Missing problem.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  const { data: row, error } = await c.supabase
    .from("patient_problems")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .select("title")
    .maybeSingle();
  if (error || !row) {
    if (error) console.error("[problem status]", error.message);
    return fail(error ? SAVE_FAILED : "That problem wasn’t found.");
  }

  if (status === "resolved") {
    await postRecordEntry(c, {
      patientId,
      type: "problem_recorded",
      text: `Problem resolved: ${row.title}.`,
    });
  }
  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: status === "resolved" ? "problem.resolve" : "problem.reactivate",
    resourceType: "patient",
    resourceId: patientId,
    summary:
      status === "resolved"
        ? "Resolved a problem in the medical history"
        : "Reactivated a problem in the medical history",
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

// ── Medications ──────────────────────────────────────────────────────────────

export async function addMedication(formData: FormData): Promise<ActionResult> {
  const patientId = str(formData, "patient_id");
  const drug = str(formData, "drug");
  if (!patientId || !drug) return fail("The medication needs a drug name.");
  const dose = orNull(str(formData, "dose"));
  const frequency = orNull(str(formData, "frequency"));
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  if (!(await patientInClinic(c, patientId))) return fail("Patient not found.");

  const { error } = await c.supabase.from("patient_medications").insert({
    tenant_id: c.tenantId,
    patient_id: patientId,
    drug,
    dose,
    frequency,
    route: orNull(str(formData, "route")),
    notes: orNull(str(formData, "notes")),
    created_by: c.userId,
  });
  if (error) {
    console.error("[medication add]", error.message);
    return fail(SAVE_FAILED);
  }

  await postRecordEntry(c, {
    patientId,
    type: "medication_recorded",
    text: `Medication recorded: ${[drug, dose, frequency].filter(Boolean).join(" · ")}.`,
  });
  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "medication.add",
    resourceType: "patient",
    resourceId: patientId,
    summary: "Recorded a medication",
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

export async function updateMedication(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id");
  const patientId = str(formData, "patient_id");
  const drug = str(formData, "drug");
  if (!id || !patientId || !drug) return fail("The medication needs a drug name.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  const { data: before } = await c.supabase
    .from("patient_medications")
    .select("drug, dose, frequency, route, notes")
    .eq("id", id)
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!before) return fail("That medication wasn’t found.");

  const after = {
    drug,
    dose: orNull(str(formData, "dose")),
    frequency: orNull(str(formData, "frequency")),
    route: orNull(str(formData, "route")),
    notes: orNull(str(formData, "notes")),
  };
  const { data: updated, error } = await c.supabase
    .from("patient_medications")
    .update({ ...after, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("patient_id", patientId)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    if (error) console.error("[medication edit]", error.message);
    return fail(SAVE_FAILED);
  }

  await logFieldChanges({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "medication.edit",
    subject: "a medication record",
    before: before as Record<string, unknown>,
    after: after as Record<string, unknown>,
    fields: MEDICATION_FIELDS,
    resourceType: "patient",
    resourceId: patientId,
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

/** Stop a medication — clinically significant, so it's feed-noted. The stop
 *  date is the CLINICIAN's calendar date (sent by the browser), not UTC's. */
export async function stopMedication(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id");
  const patientId = str(formData, "patient_id");
  if (!id || !patientId) return fail("Missing medication.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  const { data: row, error } = await c.supabase
    .from("patient_medications")
    .update({
      status: "stopped",
      stopped_on: localDateOr(str(formData, "stopped_on")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .select("drug")
    .maybeSingle();
  if (error || !row) {
    if (error) console.error("[medication stop]", error.message);
    return fail(error ? SAVE_FAILED : "That medication wasn’t found.");
  }

  await postRecordEntry(c, {
    patientId,
    type: "medication_recorded",
    text: `Medication stopped: ${row.drug}.`,
  });
  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "medication.stop",
    resourceType: "patient",
    resourceId: patientId,
    summary: "Stopped a medication",
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

// ── Next of kin & personal contacts ──────────────────────────────────────────

const CONTACT_ROLES = ["next_of_kin", "emergency_contact", "carer", "other"] as const;
const asContactRole = (v: string) =>
  (CONTACT_ROLES as readonly string[]).includes(v) ? v : "next_of_kin";

export async function saveContact(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id"); // empty = add
  const patientId = str(formData, "patient_id");
  const name = str(formData, "name");
  const relationship = str(formData, "relationship");
  if (!patientId || !name || !relationship)
    return fail("Name and relationship are required.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  if (!(await patientInClinic(c, patientId))) return fail("Patient not found.");

  const fields = {
    name,
    relationship,
    role: asContactRole(str(formData, "role")),
    phone: orNull(str(formData, "phone")),
    email: orNull(str(formData, "email")),
    notes: orNull(str(formData, "notes")),
  };
  if (fields.email && !emailOk(fields.email))
    return fail("That email doesn’t look right.");
  if (fields.phone && !phonePlausible(fields.phone))
    return fail("That phone number doesn’t look right.");
  if (id) {
    const { data: updated, error } = await c.supabase
      .from("patient_contacts")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("patient_id", patientId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error || !updated) {
      if (error) console.error("[contact edit]", error.message);
      return fail(error ? SAVE_FAILED : "That contact wasn’t found.");
    }
  } else {
    const { error } = await c.supabase.from("patient_contacts").insert({
      ...fields,
      tenant_id: c.tenantId,
      patient_id: patientId,
      created_by: c.userId,
    });
    if (error) {
      console.error("[contact add]", error.message);
      return fail(SAVE_FAILED);
    }
  }

  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: id ? "patient_contact.edit" : "patient_contact.add",
    resourceType: "patient",
    resourceId: patientId,
    summary: id ? "Edited a personal contact" : "Added a personal contact",
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

export async function removeContact(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id");
  const patientId = str(formData, "patient_id");
  if (!id || !patientId) return fail("Missing contact.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  // Soft-delete — the row (and its authorship) stays for the record.
  const { data: removed, error } = await c.supabase
    .from("patient_contacts")
    .update({ deleted_at: new Date().toISOString(), deleted_by: c.userId })
    .eq("id", id)
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error || !removed) {
    if (error) console.error("[contact remove]", error.message);
    return fail(error ? SAVE_FAILED : "That contact was already removed.");
  }

  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "patient_contact.remove",
    resourceType: "patient",
    resourceId: patientId,
    summary: "Removed a personal contact",
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

// ── The care team (GP & other doctors — the Courier's address hooks) ─────────

export async function saveCareProvider(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id"); // empty = add
  const patientId = str(formData, "patient_id");
  const name = str(formData, "name");
  if (!patientId || !name) return fail("The doctor needs a name.");
  const isGp = str(formData, "is_gp") === "true";
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  if (!(await patientInClinic(c, patientId))) return fail("Patient not found.");

  const fields = {
    name,
    role: orNull(str(formData, "role")),
    organisation: orNull(str(formData, "organisation")),
    phone: orNull(str(formData, "phone")),
    email: orNull(str(formData, "email")),
    address_line1: orNull(str(formData, "address_line1")),
    address_line2: orNull(str(formData, "address_line2")),
    city: orNull(str(formData, "city")),
    postcode: orNull(str(formData, "postcode")),
    notes: orNull(str(formData, "notes")),
  };
  if (fields.email && !emailOk(fields.email))
    return fail("That email doesn’t look right.");
  if (fields.phone && !phonePlausible(fields.phone))
    return fail("That phone number doesn’t look right.");

  // Save the ROW first (never touching the GP flag here), then hand the flag
  // over ATOMICALLY via assign_patient_gp — one transaction, so a failure can
  // never strand the patient GP-less (review finding, 2026-07-03).
  let rowId = id;
  if (id) {
    const { data: updated, error } = await c.supabase
      .from("patient_care_providers")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("patient_id", patientId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error || !updated) {
      if (error) console.error("[care provider edit]", error.message);
      return fail(error ? SAVE_FAILED : "That doctor wasn’t found.");
    }
  } else {
    const { data: created, error } = await c.supabase
      .from("patient_care_providers")
      .insert({
        ...fields,
        tenant_id: c.tenantId,
        patient_id: patientId,
        created_by: c.userId,
      })
      .select("id")
      .single();
    if (error || !created) {
      if (error) console.error("[care provider add]", error.message);
      return fail(SAVE_FAILED);
    }
    rowId = created.id;
  }

  if (isGp) {
    const { error } = await c.supabase.rpc("assign_patient_gp", {
      p_patient: patientId,
      p_row: rowId,
    });
    if (error) {
      console.error("[care provider gp]", error.message);
      // The doctor IS saved; only the flag handoff failed — say so honestly.
      revalidatePath(`/patients/${patientId}`);
      return fail("The doctor saved, but setting them as the GP failed — try the GP switch again.");
    }
  } else if (id) {
    // An explicit un-tick on an existing row.
    await c.supabase
      .from("patient_care_providers")
      .update({ is_gp: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("patient_id", patientId)
      .eq("is_gp", true);
  }

  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: id ? "care_provider.edit" : "care_provider.add",
    resourceType: "patient",
    resourceId: patientId,
    summary: id
      ? isGp
        ? "Edited the patient's registered GP"
        : "Edited a care-team doctor"
      : isGp
        ? "Added the patient's GP"
        : "Added a care-team doctor",
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

export async function removeCareProvider(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id");
  const patientId = str(formData, "patient_id");
  if (!id || !patientId) return fail("Missing doctor.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  const { data: removed, error } = await c.supabase
    .from("patient_care_providers")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: c.userId,
      is_gp: false,
    })
    .eq("id", id)
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error || !removed) {
    if (error) console.error("[care provider remove]", error.message);
    return fail(error ? SAVE_FAILED : "That doctor was already removed.");
  }

  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "care_provider.remove",
    resourceType: "patient",
    resourceId: patientId,
    summary: "Removed a care-team doctor",
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}


// ── Patient alerts (needle phobia · infection risk · safeguarding…) ──────────

const ALERT_CATEGORIES = ["safety", "clinical", "infection", "social", "other"] as const;
const asAlertCategory = (v: string) =>
  (ALERT_CATEGORIES as readonly string[]).includes(v) ? v : "other";
const ALERT_PRIORITIES = ["info", "warning", "critical"] as const;
type AlertPriority = (typeof ALERT_PRIORITIES)[number];
const asAlertPriority = (v: string): AlertPriority =>
  (ALERT_PRIORITIES as readonly string[]).includes(v) ? (v as AlertPriority) : "warning";

export async function addAlert(formData: FormData): Promise<ActionResult> {
  const patientId = str(formData, "patient_id");
  const title = str(formData, "title");
  if (!patientId || !title) return fail("The alert needs a name.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  if (!(await patientInClinic(c, patientId))) return fail("Patient not found.");

  const priority = asAlertPriority(str(formData, "priority"));
  const { error } = await c.supabase.from("patient_alerts").insert({
    tenant_id: c.tenantId,
    patient_id: patientId,
    title,
    category: asAlertCategory(str(formData, "category")),
    description: orNull(str(formData, "description")),
    priority,
    created_by: c.userId,
  });
  if (error) {
    console.error("[alert add]", error.message);
    return fail(SAVE_FAILED);
  }

  // alert_recorded is a first-class feed type (gold-mine law).
  const { error: feedErr } = await c.supabase.from("patient_feed_entries").insert({
    tenant_id: c.tenantId,
    patient_id: patientId,
    entry_type: "alert_recorded",
    payload: { text: `Alert recorded: ${title} (${priority}).` },
    created_by: c.userId,
  });
  if (feedErr) console.error("[alert feed]", feedErr.message);

  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "alert.add",
    resourceType: "patient",
    resourceId: patientId,
    summary: "Recorded a patient alert",
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

export async function updateAlert(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id");
  const patientId = str(formData, "patient_id");
  const title = str(formData, "title");
  if (!id || !patientId || !title) return fail("The alert needs a name.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  const { data: before } = await c.supabase
    .from("patient_alerts")
    .select("title, category, priority, description")
    .eq("id", id)
    .eq("patient_id", patientId)
    .maybeSingle();
  if (!before) return fail("That alert wasn’t found.");

  const after = {
    title,
    category: asAlertCategory(str(formData, "category")),
    priority: asAlertPriority(str(formData, "priority")),
    description: orNull(str(formData, "description")),
  };
  const { data: updated, error } = await c.supabase
    .from("patient_alerts")
    .update(after)
    .eq("id", id)
    .eq("patient_id", patientId)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    if (error) console.error("[alert edit]", error.message);
    return fail(SAVE_FAILED);
  }

  await logFieldChanges({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "alert.edit",
    subject: "a patient alert",
    before: before as Record<string, unknown>,
    after: after as Record<string, unknown>,
    fields: ALERT_FIELDS,
    resourceType: "patient",
    resourceId: patientId,
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

/** Resolve an alert — it leaves the banner but stays in the record. */
export async function resolveAlert(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id");
  const patientId = str(formData, "patient_id");
  if (!id || !patientId) return fail("Missing alert.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  const { data: row, error } = await c.supabase
    .from("patient_alerts")
    .update({
      status: "resolved",
      resolved_by: c.userId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("patient_id", patientId)
    .eq("status", "active")
    .select("title")
    .maybeSingle();
  if (error || !row) {
    if (error) console.error("[alert resolve]", error.message);
    return fail(error ? SAVE_FAILED : "That alert was already resolved.");
  }

  const { error: feedErr } = await c.supabase.from("patient_feed_entries").insert({
    tenant_id: c.tenantId,
    patient_id: patientId,
    entry_type: "alert_recorded",
    payload: { text: `Alert resolved: ${row.title}.` },
    created_by: c.userId,
  });
  if (feedErr) console.error("[alert feed]", feedErr.message);

  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "alert.resolve",
    resourceType: "patient",
    resourceId: patientId,
    summary: "Resolved a patient alert",
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}
