import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { logPatientAccess } from "@/lib/audit";
import { TopbarPatientSync } from "@/components/topbar/TopbarContext";
import { ConsultationWorkspace } from "@/components/consultation/ConsultationWorkspace";
import { ALL_MODULES_ON, MODULE_COLUMNS } from "@/lib/clinicalModules";
import { BreakGlassGate } from "./BreakGlassGate";
import type { FeedEntry, Author } from "@/components/consultation/ClinicalNotesFeed";

function age(d: string) {
  const dob = new Date(d);
  const now = new Date();
  let a = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) a--;
  return a;
}

/**
 * Entry families shown in the right Workup pane (order + track + results);
 * everything else — INCLUDING letters (Roland 2026-07-01) — lives in the left
 * Clinical Notes feed, the one-stop timeline, found via its type filter.
 */
const WORKUP_TYPES = new Set([
  "lab_order", "lab_result", "radiology_order", "radiology_result",
  "prescription", "photo_set", "consent_signed",
]);

/**
 * The consultation screen (Bible 4.2 §3). Identity + safety flags ride in the
 * global topbar (via TopbarPatientSync); the four-card resizable workspace fills
 * the rest — see ConsultationWorkspace.
 */
export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const ctx = await getSessionContext();
  const currentUserId = ctx?.user.id ?? "";

  const { data: patient } = await supabase
    .from("patients")
    .select(
      "id, first_name, last_name, date_of_birth, sex_at_birth, nhs_number, phone_mobile, email, address_line1, address_line2, city, postcode, title, middle_names, known_as, gender_identity, pronouns, ethnicity, preferred_language, interpreter_needed, communication_needs, contact_preference, occupation, nominated_pharmacy",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!patient) notFound();

  // Clinical-governance trail (§6.14 / §15.7b): record that this person opened this
  // record — who · role · from where · why. Purpose is inferred; a break-glass access
  // (no care link) returns a flag so we can capture the reason non-blockingly below.
  const access = await logPatientAccess({
    patientId: id,
    tenantId: ctx?.membership?.tenant_id,
    userId: currentUserId,
    role: ctx?.membership?.role,
  });

  const { data: entries } = await supabase
    .from("patient_feed_entries")
    .select(
      "id, entry_type, payload, created_at, created_by, edited_at, struck_at, related_entry_id",
    )
    .eq("patient_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const { data: allergies } = await supabase
    .from("patient_allergies")
    .select("id, substance, reaction, severity, notes")
    .eq("patient_id", id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("severity", { ascending: false });

  const { data: alerts } = await supabase
    .from("patient_alerts")
    .select("id, title, priority, category, description")
    .eq("patient_id", id)
    .eq("status", "active")
    .order("priority", { ascending: false });

  // Snapshot (Roland 2026-07-01) — the structured record behind the name-drop
  // sheet: PMH (active + resolved both read as history) + current medications.
  // + Clinical Modules (W1.1) — the clinic-level switches the workspace
  // reflows from (server-authoritative; no row = the full spine, all on).
  const [
    { data: problems },
    { data: medications },
    { data: moduleRow },
    { data: tenantRow },
    { data: contacts },
    { data: careTeam },
  ] = await Promise.all([
    supabase
      .from("patient_problems")
      .select("id, title, status, onset_date, notes")
      .eq("patient_id", id)
      .in("status", ["active", "resolved"])
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("patient_medications")
      .select("id, drug, dose, frequency, route, notes")
      .eq("patient_id", id)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    ctx?.membership?.tenant_id
      ? supabase
          .from("clinic_clinical_modules")
          .select(MODULE_COLUMNS)
          .eq("tenant_id", ctx.membership.tenant_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    // The clinic's country — drives phone/postcode validation in the overlay.
    ctx?.membership?.tenant_id
      ? supabase
          .from("tenants")
          .select("country")
          .eq("id", ctx.membership.tenant_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    // The Profile overlay (W1.2): NOK/personal contacts + the care team (the
    // Courier's per-patient address hooks — the GP row is C3's default target).
    supabase
      .from("patient_contacts")
      .select("id, name, relationship, role, phone, email, notes")
      .eq("patient_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("patient_care_providers")
      .select(
        "id, name, role, organisation, phone, email, address_line1, address_line2, city, postcode, is_gp, notes",
      )
      .eq("patient_id", id)
      .is("deleted_at", null)
      .order("is_gp", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);
  const modules = moduleRow ?? ALL_MODULES_ON;

  // Courier C1 — ALL read receipts on this patient's entries: they drive both
  // the caller's own unread state AND the "Seen by" thread on each tile
  // (who read what, when — Roland 2026-07-02).
  const entryIds = (entries ?? []).map((e) => e.id);
  const { data: reads } = entryIds.length
    ? await supabase
        .from("feed_entry_reads")
        .select("entry_id, user_id, read_at")
        .in("entry_id", entryIds)
        .order("read_at", { ascending: true })
    : { data: [] };

  const { data: members } = await supabase
    .from("tenant_users")
    .select("user_id, display_name, role");
  const authors: Record<string, Author> = {};
  for (const m of members ?? [])
    authors[m.user_id] = { name: m.display_name, role: m.role };

  const all = (entries ?? []) as FeedEntry[];
  const feedEntries = all.filter((e) => !WORKUP_TYPES.has(e.entry_type));
  const workupEntries = (entries ?? [])
    .filter((e) => WORKUP_TYPES.has(e.entry_type))
    .map((e) => ({ id: e.id, entry_type: e.entry_type }));

  const addressLines = [
    patient.address_line1,
    patient.address_line2,
    [patient.city, patient.postcode].filter(Boolean).join(" "),
  ].filter((l): l is string => Boolean(l && l.trim()));

  const workspace = (
    <ConsultationWorkspace
      patient={{ id: patient.id, firstName: patient.first_name }}
      feedEntries={feedEntries}
      workupEntries={workupEntries}
      authors={authors}
      currentUserId={currentUserId}
      reads={reads ?? []}
      modules={modules}
    />
  );

  return (
    <>
      <TopbarPatientSync
        locked={!!access?.breakGlass}
        patient={{
          id: patient.id,
          firstName: patient.first_name,
          lastName: patient.last_name,
          dob: patient.date_of_birth,
          age: age(patient.date_of_birth),
          sex: patient.sex_at_birth,
          nhs: patient.nhs_number,
          phone: patient.phone_mobile,
          email: patient.email,
          addressLines,
          clinicCountry: tenantRow?.country ?? "GB",
          demographics: {
            title: patient.title,
            middleNames: patient.middle_names,
            knownAs: patient.known_as,
            genderIdentity: patient.gender_identity,
            pronouns: patient.pronouns,
            ethnicity: patient.ethnicity,
            preferredLanguage: patient.preferred_language,
            interpreterNeeded: patient.interpreter_needed,
            communicationNeeds: patient.communication_needs,
            contactPreference: patient.contact_preference,
            occupation: patient.occupation,
            nominatedPharmacy: patient.nominated_pharmacy,
          },
          address: {
            line1: patient.address_line1,
            line2: patient.address_line2,
            city: patient.city,
            postcode: patient.postcode,
          },
          allergies: (allergies ?? []).map((a) => ({
            id: a.id,
            substance: a.substance,
            reaction: a.reaction,
            severity: a.severity,
            notes: a.notes,
          })),
          alerts: (alerts ?? []).map((al) => ({
            id: al.id,
            title: al.title,
            priority: al.priority,
            category: al.category,
            description: al.description,
          })),
          problems: (problems ?? []).map((p) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            onsetDate: p.onset_date,
            notes: p.notes,
          })),
          medications: (medications ?? []).map((m) => ({
            id: m.id,
            drug: m.drug,
            dose: m.dose,
            frequency: m.frequency,
            route: m.route,
            notes: m.notes,
          })),
          contacts: (contacts ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            relationship: c.relationship,
            role: c.role,
            phone: c.phone,
            email: c.email,
            notes: c.notes,
          })),
          careTeam: (careTeam ?? []).map((d) => ({
            id: d.id,
            name: d.name,
            role: d.role,
            organisation: d.organisation,
            phone: d.phone,
            email: d.email,
            addressLine1: d.address_line1,
            addressLine2: d.address_line2,
            city: d.city,
            postcode: d.postcode,
            isGp: d.is_gp,
            notes: d.notes,
          })),
        }}
      />
      {access?.breakGlass ? (
        // Opened with NO care link → the BLOCKING break-glass gate (clinical standard):
        // the record renders frosted behind a reason card and un-blurs once justified.
        <BreakGlassGate
          accessId={access.id}
          patientName={`${patient.first_name} ${patient.last_name}`}
        >
          {workspace}
        </BreakGlassGate>
      ) : (
        workspace
      )}
    </>
  );
}
