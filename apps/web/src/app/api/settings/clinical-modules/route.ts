import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logFieldChanges } from "@/lib/audit";
import { CLINICAL_MODULES_FIELDS } from "@/lib/auditFields";
import { ALL_MODULES_ON, MODULE_COLUMNS } from "@/lib/clinicalModules";

/**
 * Clinical Modules (W1.1) — the Caretaker saves which clinical tools the clinic
 * uses (Lab · Radiology · Procedures · Prescribing · RolDe AI). POST upserts the
 * single per-tenant row. The write runs through the Caretaker's own session so
 * RLS (is_caretaker_of) re-checks; the tenant scope is taken from the session,
 * never the request. Every flip lands in the Activity Log, before→after.
 */
async function gate() {
  const ctx = await getSessionContext();
  const role = ctx?.membership?.role;
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || role !== "caretaker" || !tenantId) return null;
  return { tenantId, userId: ctx.user.id };
}

const asBool = (v: unknown) => v === true;

export async function POST(request: Request) {
  const g = await gate();
  if (!g) return NextResponse.json({ ok: false, error: "not_allowed" }, { status: 403 });
  const { tenantId, userId } = g;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const fields = {
    tenant_id: tenantId,
    lab_enabled: asBool(body.lab_enabled),
    radiology_enabled: asBool(body.radiology_enabled),
    procedures_enabled: asBool(body.procedures_enabled),
    prescribing_enabled: asBool(body.prescribing_enabled),
    rolde_ai_enabled: asBool(body.rolde_ai_enabled),
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();

  // The CURRENT switches, to diff against for the audit trail (server-
  // authoritative; no row yet = the all-on default).
  const { data: before } = await supabase
    .from("clinic_clinical_modules")
    .select(MODULE_COLUMNS)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const { error } = await supabase
    .from("clinic_clinical_modules")
    .upsert(fields, { onConflict: "tenant_id" });

  if (error) {
    console.error("[clinical-modules]", error.message);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  // Activity Log — record exactly which modules flipped, before→after.
  await logFieldChanges({
    tenantId,
    actorUserId: userId,
    action: "clinical-modules.update",
    subject: "clinical modules",
    before: (before ?? ALL_MODULES_ON) as unknown as Record<string, unknown>,
    after: { ...(before ?? ALL_MODULES_ON), ...fields } as unknown as Record<string, unknown>,
    fields: CLINICAL_MODULES_FIELDS,
    resourceType: "clinical_modules",
    resourceId: tenantId,
  });
  return NextResponse.json({ ok: true });
}
