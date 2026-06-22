"use server";

import { getSessionContext } from "@/lib/auth";
import { fillBreakGlassReason } from "@/lib/audit";
import { isAccessPurpose } from "@/lib/patientAccess";

/**
 * Record the break-glass REASON for an access (Bible 4.8 §15.7b). Called by the
 * non-blocking chip on the patient page. Resolves the caller from their session
 * (never trusts a client-supplied user id), validates the purpose vocabulary, and
 * fills the reason onto the caller's OWN still-pending break-glass row.
 */
export async function recordBreakGlassReason(input: {
  accessId: string;
  purpose: string;
  reason?: string;
}): Promise<{ ok: boolean }> {
  const ctx = await getSessionContext();
  if (!ctx?.user?.id) return { ok: false };
  if (!isAccessPurpose(input.purpose)) return { ok: false };

  const ok = await fillBreakGlassReason({
    accessId: input.accessId,
    userId: ctx.user.id,
    purpose: input.purpose,
    reason: input.reason ?? null,
  });
  return { ok };
}
