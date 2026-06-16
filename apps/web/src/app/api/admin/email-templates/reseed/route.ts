import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { reseedPlatformTemplates } from "@/emails/seed";

/**
 * Rebuild the platform email templates from the code seed (Content → Emails →
 * "Re-seed from code"). Custodian-only. Idempotent: upserts each template by
 * slug. Returns how many were inserted vs updated.
 */
export async function POST() {
  const ctx = await getSessionContext();
  if (!ctx?.isCustodian) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const result = await reseedPlatformTemplates(createAdminClient());
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "reseed failed" },
      { status: 500 },
    );
  }
}
