import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { seedLegalDocs } from "@/lib/legalSeed";

/**
 * Custodian-only: seed the legal documents' content into the DB from the
 * code-defined first drafts (idempotent). Run once to populate; the Custodian
 * editor owns the content thereafter.
 */
export async function POST() {
  const ctx = await getSessionContext();
  if (!ctx?.isCustodian) {
    return NextResponse.json({ ok: false, error: "not_allowed" }, { status: 403 });
  }
  try {
    const result = await seedLegalDocs();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[legal seed]", err);
    return NextResponse.json({ ok: false, error: "seed_failed" }, { status: 500 });
  }
}
