import { NextResponse } from "next/server";

/**
 * TEMPORARY smoke test (Wave C) — confirms sharp + @react-pdf actually load and
 * run in the Vercel lambda. DYNAMIC imports inside try/catch so a load failure is
 * reported as JSON (not a bare 500), pinpointing which module fails. Remove once
 * prod is green.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};
  try {
    const sharp = (await import("sharp")).default;
    const png = await sharp(
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#000"/></svg>'),
    )
      .png()
      .toBuffer();
    out.sharp = `ok (${png.length} bytes)`;
  } catch (e) {
    out.sharp = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }
  try {
    const { renderToBuffer, Document, Page, Text } = await import("@react-pdf/renderer");
    const { createElement } = await import("react");
    const doc = createElement(Document, null, createElement(Page, null, createElement(Text, null, "ok")));
    const buf = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
    out.reactPdf = `ok (${buf.length} bytes)`;
  } catch (e) {
    out.reactPdf = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }
  return NextResponse.json(out);
}
