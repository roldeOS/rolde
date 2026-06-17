import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Save (or update) the working DRAFT for a legal document (Custodian-only). One
 * draft per document — re-saving overwrites it. Writes through the Custodian's
 * own session so RLS (legal_custodian_all) re-checks the right.
 */
export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx?.isCustodian) {
    return NextResponse.json({ ok: false, error: "not_allowed" }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const docKey = String(body.doc_key ?? "");
  const version = String(body.version ?? "").trim();
  const intro = String(body.intro ?? "");
  const sections = Array.isArray(body.sections) ? body.sections : [];
  if (!docKey || !version) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("legal_doc_versions")
    .select("id")
    .eq("doc_key", docKey)
    .eq("status", "draft")
    .maybeSingle();

  const error = existing
    ? (
        await supabase
          .from("legal_doc_versions")
          .update({ version, intro, sections, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
      ).error
    : (
        await supabase.from("legal_doc_versions").insert({
          doc_key: docKey,
          version,
          status: "draft",
          intro,
          sections,
          created_by: ctx.user.id,
        })
      ).error;

  if (error) {
    console.error("[legal draft]", error.message);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
