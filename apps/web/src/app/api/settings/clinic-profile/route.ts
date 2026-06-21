import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { sanitizeSvg } from "@/lib/sanitizeSvg";

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

  // Brand logos — two variants (light-bg coloured + dark-bg). Each is only touched
  // when its key is present: an empty string clears it; a non-empty value is
  // SANITISED (script vectors stripped) before storage and rejected if it isn't a
  // plausible SVG (Wave B / URDS PDF Kit §9.5).
  const logoPatch: Record<string, string | null> = {};
  for (const key of ["logo_svg", "logo_svg_dark"] as const) {
    if (!(key in b)) continue;
    const raw = str(b[key]);
    if (!raw) {
      logoPatch[key] = null;
    } else {
      const clean = sanitizeSvg(raw);
      if (!clean) {
        return NextResponse.json(
          { ok: false, error: "That doesn't look like a valid SVG logo." },
          { status: 400 },
        );
      }
      logoPatch[key] = clean;
    }
  }
  // logo_png — the browser-rasterised PNG of the light logo (for the PDF Kit; the
  // lambda can't rasterise). A raster can't carry script, but validate the shape
  // + cap the size. '' clears it; only stored when present.
  if ("logo_png" in b) {
    const png = str(b.logo_png);
    if (!png) {
      logoPatch.logo_png = null;
    } else if (/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(png) && png.length < 3_000_000) {
      logoPatch.logo_png = png;
    } else {
      return NextResponse.json({ ok: false, error: "The logo image wasn't valid." }, { status: 400 });
    }
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
      ...logoPatch,
    })
    .eq("id", tenantId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  // Activity Log (Bible 4.1 §5.4) — a clinically-significant settings change.
  await logAudit({
    tenantId,
    actorUserId: ctx.user.id,
    action: "profile.update",
    resourceType: "clinic_profile",
    resourceId: tenantId,
    summary: "Updated the clinic profile",
  });
  return NextResponse.json({ ok: true });
}
