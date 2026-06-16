import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

/**
 * Canonical seed for RolDe's PLATFORM (Custodian) email templates. Lives in code
 * so DEV/PROD re-seed from one source instead of hand-editing DB rows; the
 * Custodian dashboard's "Re-seed from code" (W1.5.2) calls `reseedPlatformTemplates`.
 * Content only — the React Email shell supplies the brand wrapper + dark mode.
 *
 * `{{variables}}` are substituted at send time. Auth-link variables (`action_url`)
 * are minted per-send by Supabase `generateLink` and passed in by the route.
 */
export type EmailTemplateSeed = {
  slug: string;
  name: string;
  description: string;
  category: "auth" | "system" | "operational" | "clinical";
  subject: string;
  preheader: string;
  headline: string;
  paragraphs: string[];
  cta_label?: string;
  cta_url?: string;
  footer_note?: string;
  variables: string[];
};

export const PLATFORM_TEMPLATES: EmailTemplateSeed[] = [
  {
    slug: "auth_password_reset",
    name: "Password Reset",
    description: "Sent when someone requests a password reset from the sign-in screen.",
    category: "auth",
    subject: "Reset your RolDe password",
    preheader: "Set a new password for your RolDe account.",
    headline: "Reset your password",
    paragraphs: [
      "Hi {{name}},",
      "We got a request to set a new password for your RolDe account. Tap the button below and you’ll be choosing a new one in seconds.",
    ],
    cta_label: "Set a new password",
    cta_url: "{{action_url}}",
    footer_note:
      "This link expires in 1 hour. If you didn’t request this, you can safely ignore this email.",
    variables: ["name", "action_url"],
  },
  {
    slug: "auth_invite",
    name: "Team Invite",
    description: "Sent when a Caretaker (or Custodian) invites someone to a clinic.",
    category: "auth",
    subject: "You’re invited to {{clinic}} on RolDe",
    preheader: "Set your password to join {{clinic}} on RolDe.",
    headline: "Set up your account",
    paragraphs: [
      "Hi {{name}},",
      "{{inviter}} has invited you to join {{clinic}} on RolDe as {{role}}. Tap below to choose a password and you’re in.",
    ],
    cta_label: "Set your password",
    cta_url: "{{action_url}}",
    footer_note:
      "This invite link expires in 24 hours. If you weren’t expecting it, you can safely ignore this email.",
    variables: ["name", "clinic", "inviter", "role", "action_url"],
  },
];

/**
 * Default CLINIC templates — the operational clinic→patient emails a Caretaker
 * starts from and then edits in Settings → Email Templates. Clinical/operational
 * only (never marketing). Seeded per-clinic on demand; each clinic owns its own
 * editable copy (tenant_id set).
 */
export const CLINIC_TEMPLATES: EmailTemplateSeed[] = [
  {
    slug: "clinic_appointment_reminder",
    name: "Appointment Reminder",
    description: "Reminds a patient of an upcoming appointment.",
    category: "operational",
    subject: "Your appointment at {{clinic}}",
    preheader: "A reminder of your upcoming appointment.",
    headline: "Your appointment is coming up",
    paragraphs: [
      "Hi {{name}},",
      "This is a reminder of your appointment at {{clinic}} on {{date}} at {{time}}.",
      "If you need to change or cancel it, just tap below.",
    ],
    cta_label: "View or reschedule",
    cta_url: "{{action_url}}",
    footer_note: "If you have any questions, reply to this email and we’ll help.",
    variables: ["name", "clinic", "date", "time", "action_url"],
  },
  {
    slug: "clinic_results_ready",
    name: "Results Ready",
    description: "Tells a patient their results are available.",
    category: "clinical",
    subject: "Your results are ready",
    preheader: "Your results from {{clinic}} are available.",
    headline: "Your results are ready",
    paragraphs: [
      "Hi {{name}},",
      "Your results from {{clinic}} are ready. Tap below to view them securely.",
    ],
    cta_label: "View my results",
    cta_url: "{{action_url}}",
    footer_note: "If anything needs discussing, we’ll be in touch — or reply here.",
    variables: ["name", "clinic", "action_url"],
  },
  {
    slug: "clinic_follow_up",
    name: "Follow-up Due",
    description: "Invites a patient to book a follow-up.",
    category: "operational",
    subject: "Time for a follow-up at {{clinic}}",
    preheader: "It’s time to book your follow-up.",
    headline: "Time for a follow-up",
    paragraphs: [
      "Hi {{name}},",
      "It’s time for your follow-up at {{clinic}}. Tap below to find a time that suits you.",
    ],
    cta_label: "Book a follow-up",
    cta_url: "{{action_url}}",
    footer_note: "Not sure if you need this? Reply and we’ll let you know.",
    variables: ["name", "clinic", "action_url"],
  },
];

/**
 * Seed a CLINIC's templates (tenant_id = p_tenant) from CLINIC_TEMPLATES. Only
 * inserts the ones a clinic doesn't have yet, so it never overwrites a Caretaker's
 * edits. Returns how many were added.
 */
export async function setupClinicTemplates(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
): Promise<{ inserted: number }> {
  let inserted = 0;
  for (const t of CLINIC_TEMPLATES) {
    const { data: existing } = await admin
      .from("email_templates")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("slug", t.slug)
      .maybeSingle();
    if (existing) continue;
    const { error } = await admin.from("email_templates").insert({
      tenant_id: tenantId,
      slug: t.slug,
      name: t.name,
      description: t.description,
      category: t.category,
      subject: t.subject,
      preheader: t.preheader,
      headline: t.headline,
      paragraphs: t.paragraphs,
      cta_label: t.cta_label ?? null,
      cta_url: t.cta_url ?? null,
      footer_note: t.footer_note ?? null,
      variables: t.variables,
      is_active: true,
    });
    if (error) throw new Error(`clinic seed ${t.slug}: ${error.message}`);
    inserted++;
  }
  return { inserted };
}

/**
 * Upsert the platform templates (tenant_id NULL) from the seed. Check-then-write
 * per slug (the platform-slug uniqueness is a PARTIAL index, so we don't rely on
 * ON CONFLICT). Idempotent + re-runnable.
 */
export async function reseedPlatformTemplates(
  admin: ReturnType<typeof createAdminClient>,
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;
  for (const t of PLATFORM_TEMPLATES) {
    const row = {
      tenant_id: null,
      slug: t.slug,
      name: t.name,
      description: t.description,
      category: t.category,
      subject: t.subject,
      preheader: t.preheader,
      headline: t.headline,
      paragraphs: t.paragraphs,
      cta_label: t.cta_label ?? null,
      cta_url: t.cta_url ?? null,
      footer_note: t.footer_note ?? null,
      variables: t.variables,
      is_active: true,
    };
    const { data: existing } = await admin
      .from("email_templates")
      .select("id")
      .is("tenant_id", null)
      .eq("slug", t.slug)
      .maybeSingle();
    if (existing) {
      const { error } = await admin.from("email_templates").update(row).eq("id", existing.id);
      if (error) throw new Error(`reseed update ${t.slug}: ${error.message}`);
      updated++;
    } else {
      const { error } = await admin.from("email_templates").insert(row);
      if (error) throw new Error(`reseed insert ${t.slug}: ${error.message}`);
      inserted++;
    }
  }
  return { inserted, updated };
}
