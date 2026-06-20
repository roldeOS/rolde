import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * URDS PDF Kit — retrieve a stored export artifact (Wave D; URDS §9.5).
 *
 * Streams the PDF kept in `export_log.pdf_base64` for one row, opened inline for
 * audit review. The SELECT runs on the caller's RLS session, so the export_log
 * read policy (Caretaker of that clinic, or Custodian; live rows only) is what
 * authorises access — a stranger simply gets no row → 404. No public URL, ever.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || !tenantId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("export_log")
    .select("reference, title, pdf_base64")
    .eq("id", id)
    .maybeSingle();

  if (!row || !row.pdf_base64) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const buffer = Buffer.from(row.pdf_base64, "base64");
  const filename = `${slug(row.title || row.reference)}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "X-Export-Reference": row.reference,
    },
  });
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "export";
}
