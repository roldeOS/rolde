import "server-only";
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Does the accessor have a LEGITIMATE RELATIONSHIP with this patient? (Bible 4.8
 * §15.7b.) Drives zero-friction purpose inference: a care link → `direct_care`,
 * its absence → break-glass. Today's available signals (no appointments/consults
 * table yet): the user CREATED the patient record, or AUTHORED a clinical note for
 * them. Read through the member's own session (RLS-safe — they can already read
 * both on the patient page).
 */
async function inferPurpose(
  supabase: SupabaseClient,
  patientId: string,
  userId: string,
): Promise<{ purpose: string | null; breakGlass: boolean }> {
  const [{ data: createdByMe }, { data: authored }] = await Promise.all([
    supabase.from("patients").select("id").eq("id", patientId).eq("created_by", userId).maybeSingle(),
    supabase
      .from("patient_feed_entries")
      .select("id")
      .eq("patient_id", patientId)
      .eq("created_by", userId)
      .limit(1)
      .maybeSingle(),
  ]);
  if (createdByMe || authored) return { purpose: "direct_care", breakGlass: false };
  return { purpose: null, breakGlass: true };
}

/**
 * Log a patient-record access (W1.1.7 §6.14 / Bible 4.8 §15.7b) — the clinical-
 * governance trail: who (+ role) · which record · when · from where (IP/device) ·
 * why (purpose). BEST-EFFORT: a failed audit write must NEVER block a clinician
 * from seeing the record. Inserts through the member's own session, so RLS only
 * ever lets them log their own access in their own clinic.
 *
 * Purpose is INFERRED at access time (zero friction): `direct_care` when a care
 * link exists, else the access is flagged `break_glass` with a NULL purpose and
 * the caller surfaces a non-blocking reason chip. Returns the row id + whether it
 * was break-glass, so the page can render the chip; null if logging was skipped.
 */
export async function logPatientAccess(opts: {
  patientId: string;
  tenantId: string | null | undefined;
  userId: string | null | undefined;
  /** The accessor's role AT access time, recorded point-in-time. */
  role?: string | null;
  action?: string;
}): Promise<{ id: string; breakGlass: boolean } | null> {
  if (!opts.tenantId || !opts.userId) return null;
  try {
    const supabase = await createClient();
    const { purpose, breakGlass } = await inferPurpose(supabase, opts.patientId, opts.userId);

    // IP + device off the request (never trust the client for these), mirroring the
    // sign-in capture: first x-forwarded-for, else x-real-ip.
    const h = await headers();
    const ip =
      (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || null;

    // Pre-generate the id so the insert needs NO RETURNING read-back. The access log is
    // readable only by Caretakers/Custodians (RLS), so a clinician/nurse logging their
    // OWN access can't read the row back — an `.insert().select()` would fail RLS for
    // them (only caretakers passed). Inserting their own row is allowed; reading the
    // log isn't. Generating the id here keeps the write role-blind AND yields the id
    // the break-glass chip needs.
    const id = crypto.randomUUID();
    const { error } = await supabase.from("patient_access_log").insert({
      id,
      tenant_id: opts.tenantId,
      patient_id: opts.patientId,
      user_id: opts.userId,
      action: opts.action ?? "view",
      actor_role: opts.role ?? null,
      ip_address: ip,
      user_agent: h.get("user-agent"),
      purpose,
      break_glass: breakGlass,
    });
    if (error) return null;

    return { id, breakGlass };
  } catch {
    /* never block the page on audit logging */
    return null;
  }
}

/**
 * Fill the just-in-time break-glass REASON onto the access row (Bible 4.8 §15.7b).
 * The access was already logged immutably (who/what/when/that-it-was-break-glass);
 * this completes the pending `purpose` (+ free-text `reason` for "other") ONCE.
 * Gated server-side via the service role to the accessor's OWN still-pending
 * break-glass row — a one-time completion of the same event, never a rewrite of
 * recorded facts (so the table stays append-only for users).
 */
export async function fillBreakGlassReason(opts: {
  accessId: string;
  userId: string;
  purpose: string;
  reason?: string | null;
}): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("patient_access_log")
      .update({
        purpose: opts.purpose,
        reason: opts.purpose === "other" ? (opts.reason?.trim() || null) : null,
      })
      .eq("id", opts.accessId)
      .eq("user_id", opts.userId)
      .eq("break_glass", true)
      .is("purpose", null);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Record a clinically-significant action in the central append-only audit_log
 * (Bible 4.1 §5.4) — the spine behind Logs → Activity Log. Role-blind: the SERVER
 * writes via the service-role client (there is no client write path), so every
 * role's actions are captured. BEST-EFFORT — a failed audit write must NEVER
 * block the action it describes. Call AFTER the action succeeds.
 */
export async function logAudit(opts: {
  tenantId: string | null | undefined;
  actorUserId: string | null | undefined;
  /** dotted verb, e.g. 'profile.update', 'patient.create', 'member.pause'. */
  action: string;
  resourceType?: string;
  resourceId?: string;
  /** human one-liner shown in the Activity Log, e.g. "Updated the clinic profile". */
  summary?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!opts.tenantId) return;
  try {
    const admin = createAdminClient();
    await admin.from("audit_log").insert({
      tenant_id: opts.tenantId,
      actor_user_id: opts.actorUserId ?? null,
      action: opts.action,
      resource_type: opts.resourceType ?? null,
      resource_id: opts.resourceId ?? null,
      summary: opts.summary ?? null,
      metadata: (opts.metadata ?? {}) as never,
    });
  } catch {
    /* audit logging is best-effort — never block the action */
  }
}
