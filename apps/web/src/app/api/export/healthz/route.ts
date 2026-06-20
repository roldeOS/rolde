import { NextResponse } from "next/server";
import sharp from "sharp";
import { Document, Page, Text } from "@react-pdf/renderer";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";

/**
 * TEMPORARY smoke test (Wave C) — confirms sharp + @react-pdf actually load and
 * run in the Vercel lambda (the prod 500 was a missing sharp linux binary).
 * Unauthenticated + harmless (no data). Remove once prod is confirmed green.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};
  try {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#000"/></svg>';
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    out.sharp = `ok (${png.length} bytes)`;
  } catch (e) {
    out.sharp = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }
  try {
    const doc = createElement(Document, null, createElement(Page, null, createElement(Text, null, "ok")));
    const buf = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
    out.reactPdf = `ok (${buf.length} bytes)`;
  } catch (e) {
    out.reactPdf = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }
  return NextResponse.json(out);
}
