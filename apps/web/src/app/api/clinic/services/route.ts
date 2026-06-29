import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit, logFieldChanges } from "@/lib/audit";
import { SERVICE_FIELDS } from "@/lib/auditFields";

/**
 * Services & Pricing (W1.1.8) — Caretaker manages the clinic's service list.
 * POST upserts a service (id present = update); DELETE removes one. Writes go
 * through the Caretaker's own session so RLS (is_caretaker_of) re-checks; the
 * tenant scope is taken from the session, never the request.
 *
 * Every change to the service catalogue is recorded in the Activity Log (Change
 * Describer): an update writes a before→after diff of the named service, a create
 * and a delete write a named event. The trail is built server-side from the real
 * old/new row (best-effort — never blocks the save).
 */
const SERVICE_COLS =
  "name, description, category, code, price_pence, duration_minutes, tax_exempt, deposit_pence, active";

async function gate() {
  const ctx = await getSessionContext();
  const role = ctx?.membership?.role;
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || role !== "caretaker" || !tenantId) return null;
  return { tenantId, userId: ctx.user.id };
}

const trimOrNull = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
};

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

  const name = String(body.name ?? "").trim();
  const pricePence = Math.round(Number(body.price_pence));
  const rawDuration = body.duration_minutes;
  const duration =
    rawDuration === null || rawDuration === undefined || rawDuration === ""
      ? null
      : Math.round(Number(rawDuration));
  const rawDeposit = body.deposit_pence;
  const depositPence =
    rawDeposit === null || rawDeposit === undefined ? null : Math.round(Number(rawDeposit));

  if (!name) return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
  if (!Number.isInteger(pricePence) || pricePence < 0) {
    return NextResponse.json({ ok: false, error: "bad_price" }, { status: 400 });
  }
  if (duration !== null && (!Number.isInteger(duration) || duration <= 0)) {
    return NextResponse.json({ ok: false, error: "bad_duration" }, { status: 400 });
  }
  if (depositPence !== null && (!Number.isInteger(depositPence) || depositPence < 0)) {
    return NextResponse.json({ ok: false, error: "bad_deposit" }, { status: 400 });
  }

  const supabase = await createClient();
  // service_type / course_sessions are owned by the Memberships & Packages module
  // (W1.1.10) — not written here, so existing values are preserved untouched.
  const fields = {
    name,
    description: trimOrNull(body.description),
    category: trimOrNull(body.category),
    code: trimOrNull(body.code),
    price_pence: pricePence,
    duration_minutes: duration,
    tax_exempt: body.tax_exempt === true,
    deposit_pence: depositPence,
    active: body.active !== false,
  };

  const errorOut = (error: { code?: string; message: string }) => {
    // The (tenant_id, lower(code)) unique index — a friendly "code taken".
    if (error.code === "23505") {
      return NextResponse.json({ ok: false, error: "code_taken" }, { status: 409 });
    }
    console.error("[services]", error.message);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  };

  if (body.id) {
    const id = String(body.id);
    // The OLD values, to diff against for the before→after audit trail.
    const { data: before } = await supabase
      .from("clinic_services")
      .select(SERVICE_COLS)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    const { error } = await supabase
      .from("clinic_services")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", tenantId);
    if (error) return errorOut(error);

    await logFieldChanges({
      tenantId,
      actorUserId: userId,
      action: "service.update",
      subject: fields.name,
      before: (before ?? {}) as Record<string, unknown>,
      after: { ...(before ?? {}), ...fields } as Record<string, unknown>,
      fields: SERVICE_FIELDS,
      resourceType: "service",
      resourceId: id,
    });
    return NextResponse.json({ ok: true });
  }

  // Create — a named event (everything is new, so no before→after to diff).
  const { data: created, error } = await supabase
    .from("clinic_services")
    .insert({ ...fields, tenant_id: tenantId })
    .select("id")
    .single();
  if (error) return errorOut(error);

  await logAudit({
    tenantId,
    actorUserId: userId,
    action: "service.create",
    resourceType: "service",
    resourceId: created?.id,
    summary: `Added the service “${fields.name}”`,
    metadata: { name: fields.name },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const g = await gate();
  if (!g) return NextResponse.json({ ok: false, error: "not_allowed" }, { status: 403 });
  const { tenantId, userId } = g;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

  const supabase = await createClient();
  // The name BEFORE we delete it — so the Activity Log can name what was removed.
  const { data: svc } = await supabase
    .from("clinic_services")
    .select("name")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const { error } = await supabase
    .from("clinic_services")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) {
    console.error("[services delete]", error.message);
    return NextResponse.json({ ok: false, error: "delete_failed" }, { status: 500 });
  }

  await logAudit({
    tenantId,
    actorUserId: userId,
    action: "service.delete",
    resourceType: "service",
    resourceId: id,
    summary: `Removed the service “${svc?.name ?? "a service"}”`,
    metadata: svc?.name ? { name: svc.name } : undefined,
  });
  return NextResponse.json({ ok: true });
}
