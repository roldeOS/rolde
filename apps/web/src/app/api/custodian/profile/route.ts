import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * A Custodian edits their OWN profile (name + title). Custodian-gated; the admin
 * client updates only the caller's own custodian_users row (scoped by user_id).
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
  const displayName = String(body.display_name ?? "").trim();
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;
  if (!displayName) {
    return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("custodian_users")
    .update({ display_name: displayName, title })
    .eq("user_id", ctx.user.id);
  if (error) {
    console.error("[custodian profile]", error.message);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
