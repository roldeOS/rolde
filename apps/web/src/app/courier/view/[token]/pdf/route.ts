import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildLetterPdf } from "@/lib/letterPdf";

/**
 * The Courier recipient's PDF (C3) — the SAME URDS PDF Kit artefact the clinic
 * prints, rendered through the shared builder, gated by the same capability
 * token as the viewer. Every download lands in the dispatch's journey
 * (pdf_downloaded), so the clinic's record of where the letter went is whole.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token || token.length < 20) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const admin = createAdminClient();

  const { data: d } = await admin
    .from("courier_dispatches")
    .select("id, tenant_id, entry_id, opened_at, token_expires_at")
    .eq("view_token", token)
    .maybeSingle();
  if (!d || new Date(d.token_expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  // The PDF sits BEHIND the envelope — Open Letter first (that's the honest
  // Opened signal), then the download link exists at all.
  if (!d.opened_at) {
    return NextResponse.redirect(new URL(`/courier/view/${token}`, _request.url));
  }

  const built = await buildLetterPdf(admin, d.entry_id);
  if (!built.ok) {
    return NextResponse.json(
      { error: built.error },
      { status: built.error === "not_found" ? 404 : 500 },
    );
  }
  const { buffer, title, reference } = built.pdf;

  await admin.from("courier_dispatch_events").insert({
    dispatch_id: d.id,
    tenant_id: d.tenant_id,
    event: "pdf_downloaded",
    meta: { reference },
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${title.toLowerCase().replace(/\s+/g, "-")}-${reference}.pdf"`,
    },
  });
}
