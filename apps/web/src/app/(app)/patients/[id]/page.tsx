import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { logPatientAccess } from "@/lib/audit";
import { TopbarPatientSync } from "@/components/topbar/TopbarContext";
import { ConsultationWorkspace } from "@/components/consultation/ConsultationWorkspace";
import { BreakGlassPrompt } from "./BreakGlassPrompt";
import type { FeedEntry, Author } from "@/components/consultation/ClinicalNotesFeed";

function age(d: string) {
  const dob = new Date(d);
  const now = new Date();
  let a = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) a--;
  return a;
}

/** Entry families shown in the left Clinical Notes feed vs the right Orders pane. */
const ORDER_TYPES = new Set([
  "lab_order", "lab_result", "radiology_order", "radiology_result",
  "prescription", "photo_set", "consent_signed", "referral_letter",
  "discharge_summary", "sick_note", "gp_letter",
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

  const { data: members } = await supabase
    .from("tenant_users")
    .select("user_id, display_name, role");
  const authors: Record<string, Author> = {};
  for (const m of members ?? [])
    authors[m.user_id] = { name: m.display_name, role: m.role };

  const all = (entries ?? []) as FeedEntry[];
  const feedEntries = all.filter((e) => !ORDER_TYPES.has(e.entry_type));
  const orderEntries = (entries ?? [])
    .filter((e) => ORDER_TYPES.has(e.entry_type))
    .map((e) => ({ id: e.id, entry_type: e.entry_type }));

  const addressLines = [
    patient.address_line1,
    patient.address_line2,
    [patient.city, patient.postcode].filter(Boolean).join(" "),
  ].filter((l): l is string => Boolean(l && l.trim()));

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
        }}
      />
      <ConsultationWorkspace
        patient={{ id: patient.id, firstName: patient.first_name }}
        feedEntries={feedEntries}
        orderEntries={orderEntries}
        authors={authors}
        currentUserId={currentUserId}
      />
      {access?.breakGlass && (
        <BreakGlassPrompt
          accessId={access.id}
          patientName={`${patient.first_name} ${patient.last_name}`}
        />
      )}
    </>
  );
}
