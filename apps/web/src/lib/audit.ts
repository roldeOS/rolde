import "server-only";
import { createClient } from "@/lib/supabase/server";

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
