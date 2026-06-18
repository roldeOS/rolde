import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Commercial Settings (W1.1.16) — the Caretaker saves the clinic's money policy.
 * POST upserts the single per-tenant row. The write runs through the Caretaker's
 * own session so RLS (is_caretaker_of) re-checks; the tenant scope is taken from
 * the session, never the request. Money is integer pence; the VAT rate is bps.
 */
async function gate() {
  const ctx = await getSessionContext();
  const role = ctx?.membership?.role;
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || role !== "caretaker" || !tenantId) return null;
  return tenantId;
}

const asBool = (v: unknown) => v === true;
const intMin0 = (v: unknown) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : 0;
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

  const label =
    (typeof body.consult_credit_label === "string" ? body.consult_credit_label.trim() : "") ||
    "Consultation Credit";

  const fields = {
    tenant_id: tenantId,
    vat_enabled: asBool(body.vat_enabled),
    vat_rate_bps: Math.min(10000, intMin0(body.vat_rate_bps)),
    deposit_enabled: asBool(body.deposit_enabled),
    deposit_default_pence: intMin0(body.deposit_default_pence),
    consult_credit_enabled: asBool(body.consult_credit_enabled),
    consult_credit_pence: intMin0(body.consult_credit_pence),
    consult_credit_label: label.slice(0, 60),
    discount_codes_enabled: asBool(body.discount_codes_enabled),
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clinic_commercial_settings")
    .upsert(fields, { onConflict: "tenant_id" });

  if (error) {
    console.error("[commercial]", error.message);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
