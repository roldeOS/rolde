import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Publish a legal document's draft (Custodian-only). The atomic RPC
 * publish_legal_draft() supersedes the current published version and promotes
 * the draft — so a document is never left with zero or two published versions.
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
  if (!docKey) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: draft } = await supabase
    .from("legal_doc_versions")
    .select("id")
    .eq("doc_key", docKey)
    .eq("status", "draft")
    .maybeSingle();
  if (!draft) {
    return NextResponse.json({ ok: false, error: "no_draft" }, { status: 400 });
  }

  const { error } = await supabase.rpc("publish_legal_draft", { p_doc_key: docKey });
  if (error) {
    console.error("[legal publish]", error.message);
    return NextResponse.json({ ok: false, error: "publish_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
