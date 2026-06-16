import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { setupClinicTemplates } from "@/emails/seed";

/**
 * Seed the caller's clinic with the default email templates (Settings → Email
 * Templates → "Set Up Default Emails"). The clinic is taken from the SESSION
 * (never the request), so a Caretaker can only ever seed their own clinic.
 */
export async function POST() {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!tenantId || ctx?.membership?.role !== "caretaker") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const result = await setupClinicTemplates(createAdminClient(), tenantId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "setup failed" },
      { status: 500 },
    );
  }
}
