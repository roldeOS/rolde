"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/**
 * Settings → Patient Portal (P1). The clinic's master on/off + how patients get
 * access. Caretaker-only: checked here AND re-enforced by RLS
 * (`tenants_caretaker_update` / `is_caretaker_of`). Every change is audited.
 */
export type ActionResult = { ok: true } | { ok: false; error: string };

const MODES = ["invite_only", "open"] as const;

export async function savePatientPortalSettings(formData: FormData): Promise<ActionResult> {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || !tenantId) return { ok: false, error: "No clinic context for this user." };
  if (ctx.membership?.role !== "caretaker" && !ctx.isCustodian)
    return { ok: false, error: "Only your clinic’s Caretaker can change the patient portal." };

  const enabled = String(formData.get("portal_enabled")) === "true";
  const modeRaw = String(formData.get("portal_registration") ?? "invite_only");
  const mode = (MODES as readonly string[]).includes(modeRaw) ? modeRaw : "invite_only";

  const supabase = await createClient();
  // Writes ONLY the two portal columns on the caretaker's own tenant (definer
  // fn gated by is_caretaker_of) — no broad UPDATE grant on tenants.
  const { error } = await supabase.rpc("set_patient_portal", {
    p_enabled: enabled,
    p_mode: mode,
  });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    tenantId,
    actorUserId: ctx.user.id,
    action: "portal.settings",
    resourceType: "tenant",
    resourceId: tenantId,
    summary: `Patient portal ${enabled ? "enabled" : "disabled"} · ${
      mode === "open" ? "open sign-up" : "invite only"
    }`,
  });
  revalidatePath("/settings/patient-portal");
  return { ok: true };
}
