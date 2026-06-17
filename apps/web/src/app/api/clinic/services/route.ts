import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Services & Pricing (W1.1.8) — Caretaker manages the clinic's service list.
 * POST upserts a service (id present = update); DELETE removes one. Writes go
 * through the Caretaker's own session so RLS (is_caretaker_of) re-checks; the
 * tenant scope is taken from the session, never the request.
 */
async function gate() {
  const ctx = await getSessionContext();
  const role = ctx?.membership?.role;
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || role !== "caretaker" || !tenantId) return null;
  return tenantId;
}

const trimOrNull = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
};

export async function POST(request: Request) {
  const tenantId = await gate();
  if (!tenantId) return NextResponse.json({ ok: false, error: "not_allowed" }, { status: 403 });

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
  if (!name) return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
  if (!Number.isInteger(pricePence) || pricePence < 0) {
    return NextResponse.json({ ok: false, error: "bad_price" }, { status: 400 });
  }
  if (duration !== null && (!Number.isInteger(duration) || duration <= 0)) {
    return NextResponse.json({ ok: false, error: "bad_duration" }, { status: 400 });
  }

  const supabase = await createClient();
  const fields = {
    name,
    description: trimOrNull(body.description),
    price_pence: pricePence,
    duration_minutes: duration,
    active: body.active !== false,
  };

  const error = body.id
    ? (
        await supabase
          .from("clinic_services")
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq("id", String(body.id))
          .eq("tenant_id", tenantId)
      ).error
    : (await supabase.from("clinic_services").insert({ ...fields, tenant_id: tenantId })).error;

  if (error) {
    console.error("[services]", error.message);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const tenantId = await gate();
  if (!tenantId) return NextResponse.json({ ok: false, error: "not_allowed" }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase
    .from("clinic_services")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) {
    console.error("[services delete]", error.message);
    return NextResponse.json({ ok: false, error: "delete_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
