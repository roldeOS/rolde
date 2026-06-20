import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { AuditPdf } from "@/components/ui/pdf/AuditPdf";
import { ROLDE_WORDMARK_PNG } from "@/lib/brandAssets";

/**
 * TEMPORARY smoke test (Wave C) — renders the REAL AuditPdf (with a PNG logo image)
 * in the lambda, proving the sharp-free export path works on prod. Remove once green.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1×1 transparent PNG — stands in for the clinic logo to exercise <Image>.
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export async function GET() {
  try {
    const el = AuditPdf({
      title: "Health Check",
      scope: "smoke test",
      columns: [{ key: "a", header: "A" }, { key: "b", header: "B" }],
      rows: [{ a: "1", b: "2" }],
      brand: { product: "RolDe OS", clinic: "Test", wordmarkPng: ROLDE_WORDMARK_PNG, logoPng: TINY_PNG },
      reference: "EXP-TEST",
      fingerprint: "test",
      generatedAt: "now",
    });
    const buf = await renderToBuffer(el);
    return NextResponse.json({ auditPdf: `ok (${buf.length} bytes)` });
  } catch (e) {
    return NextResponse.json({ auditPdf: `FAIL: ${e instanceof Error ? e.message : String(e)}` });
  }
}
