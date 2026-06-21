import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Log a patient-record access (W1.1.7 §6.14) — the clinical-governance trail:
 * every time anyone opens a patient record it's recorded (who, which record,
 * when, what). BEST-EFFORT: a failed audit write must NEVER block a clinician
 * from seeing the record. Inserts through the member's own session, so RLS only
 * ever lets them log their own access in their own clinic.
 */
export async function logPatientAccess(opts: {
  patientId: string;
  tenantId: string | null | undefined;
  userId: string | null | undefined;
  action?: string;
}): Promise<void> {
  if (!opts.tenantId || !opts.userId) return;
  try {
    const supabase = await createClient();
    await supabase.from("patient_access_log").insert({
      tenant_id: opts.tenantId,
      patient_id: opts.patientId,
      user_id: opts.userId,
      action: opts.action ?? "view",
    });
  } catch {
    /* never block the page on audit logging */
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
