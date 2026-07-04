import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logFieldChanges } from "@/lib/audit";
import { COURIER_FIELDS } from "@/lib/auditFields";

/**
 * RolDe Courier settings (C2) — the Caretaker saves the clinic's sending
 * policy. POST upserts the single per-tenant row; the write runs through the
 * caller's own session so RLS (is_caretaker_of) re-checks; the tenant scope is
 * the session's, never the request's. Every flip lands in the Activity Log.
 */
async function gate() {
  const ctx = await getSessionContext();
  const role = ctx?.membership?.role;
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || role !== "caretaker" || !tenantId) return null;
  return { tenantId, userId: ctx.user.id };
}

const asBool = (v: unknown) => v === true;
const asTime = (v: unknown, fallback: string) =>
  typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : fallback;

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

  const days = Math.round(Number(body.chase_after_days));
  const fields = {
    tenant_id: tenantId,
    secure_link_default: asBool(body.secure_link_default),
    typo_guard: asBool(body.typo_guard),
    countersign_required: asBool(body.countersign_required),
    delegated_sending: asBool(body.delegated_sending),
    quiet_hours_enabled: asBool(body.quiet_hours_enabled),
    quiet_start: asTime(body.quiet_start, "20:00"),
    quiet_end: asTime(body.quiet_end, "08:00"),
    chase_after_days: Number.isFinite(days) ? Math.min(30, Math.max(1, days)) : 7,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("clinic_courier_settings")
    .select(
      "secure_link_default, typo_guard, countersign_required, delegated_sending, quiet_hours_enabled, quiet_start, quiet_end, chase_after_days",
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const { error } = await supabase
    .from("clinic_courier_settings")
    .upsert(fields, { onConflict: "tenant_id" });
  if (error) {
    console.error("[courier settings]", error.message);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  await logFieldChanges({
    tenantId,
    actorUserId: userId,
    action: "courier.settings_update",
    subject: "Courier settings",
    before: (before ?? {}) as Record<string, unknown>,
    after: { ...(before ?? {}), ...fields } as Record<string, unknown>,
    fields: COURIER_FIELDS,
    resourceType: "courier_settings",
    resourceId: tenantId,
  });
  return NextResponse.json({ ok: true });
}
