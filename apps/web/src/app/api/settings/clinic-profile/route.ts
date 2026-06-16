import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Update the CALLER'S clinic profile (Settings → Clinic Profile → Save).
 * The clinic comes from the session, so a Caretaker can only edit their own
 * clinic — and only the identity / contact / registration fields, never the
 * billing or lifecycle columns. The matching DB guards are the column-scoped
 * GRANT + the `tenants_caretaker_update` RLS policy
 * (supabase/migrations/20260616120000_clinic_profile.sql), which together block
 * any attempt to reach those columns via the raw API.
 */
export async function PATCH(request: Request) {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!tenantId || ctx?.membership?.role !== "caretaker") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const b = await request.json().catch(() => ({}));
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const orNull = (v: unknown) => str(v) || null;

  const name = str(b.name);
  const legalName = str(b.legal_name);
  if (!name || !legalName) {
    return NextResponse.json(
      { ok: false, error: "Clinic name and legal name are both required." },
      { status: 400 },
    );
  }

  const { error } = await createAdminClient()
    .from("tenants")
    .update({
      name,
      legal_name: legalName,
      contact_email: orNull(b.contact_email),
      contact_phone: orNull(b.contact_phone),
      address_line1: orNull(b.address_line1),
      address_line2: orNull(b.address_line2),
      city: orNull(b.city),
      postcode: orNull(b.postcode),
      ico_registration: orNull(b.ico_registration),
      his_registration: orNull(b.his_registration),
      cqc_registration: orNull(b.cqc_registration),
    })
    .eq("id", tenantId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
