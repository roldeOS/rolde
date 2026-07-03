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
      "id, first_name, last_name, date_of_birth, sex_at_birth, nhs_number, phone_mobile, email, address_line1, address_line2, city, postcode",
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
    .select("substance, reaction, severity")
    .eq("patient_id", id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("severity", { ascending: false });

  const { data: alerts } = await supabase
    .from("patient_alerts")
    .select("title, priority")
    .eq("patient_id", id)
    .eq("status", "active")
    .order("priority", { ascending: false });

  // Snapshot (Roland 2026-07-01) — the structured record behind the name-drop
  // sheet: PMH (active + resolved both read as history) + current medications.
  // + Clinical Modules (W1.1) — the clinic-level switches the workspace
  // reflows from (server-authoritative; no row = the full spine, all on).
  const [{ data: problems }, { data: medications }, { data: moduleRow }] = await Promise.all([
    supabase
      .from("patient_problems")
      .select("title, status")
      .eq("patient_id", id)
      .in("status", ["active", "resolved"])
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("patient_medications")
      .select("drug, dose, frequency")
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
          allergies: (allergies ?? []).map((a) => ({
            substance: a.substance,
            reaction: a.reaction,
            severity: a.severity,
          })),
          alerts: (alerts ?? []).map((al) => ({
            title: al.title,
            priority: al.priority,
          })),
          problems: (problems ?? []).map((p) => ({ title: p.title, status: p.status })),
          medications: (medications ?? []).map((m) => ({
            drug: m.drug,
            dose: m.dose,
            frequency: m.frequency,
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
