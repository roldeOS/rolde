import { NextResponse } from "next/server";
import { createElement } from "react";
import { render } from "@react-email/render";
import { getSessionContext } from "@/lib/auth";
import { RoldeEmailShell } from "@/emails/RoldeEmailShell";

/**
 * Render a live preview of the email shell from draft content (Custodian editor).
 * Custodian-only. Sample values stand in for `{{variables}}` so the Custodian
 * sees a realistic email; unknown variables are left visible as `{{name}}`.
 */
const SAMPLE_VARS: Record<string, string> = {
  name: "Roland",
  action_url: "https://rolde.app/reset?example",
  clinic: "Your Clinic",
  inviter: "Roland",
  role: "Clinician",
};

function fill(s: string): string {
  return s.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k: string) => SAMPLE_VARS[k] ?? `{{${k}}}`);
}

export async function POST(request: Request) {
  // Any authenticated user may preview — it only renders the content posted in
  // the request body (no DB read, nothing leaked). Both the Custodian editor and
  // the Caretaker clinic editor use it.
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const b = await request.json().catch(() => ({}));
  const props = {
    preheader: fill(b.preheader ?? ""),
    headline: fill(b.headline ?? ""),
    paragraphs: Array.isArray(b.paragraphs) ? b.paragraphs.map((p: string) => fill(p)) : [],
    ctaLabel: b.cta_label ? fill(b.cta_label) : undefined,
    ctaUrl: b.cta_url ? fill(b.cta_url) : undefined,
    footerNote: b.footer_note ? fill(b.footer_note) : undefined,
  };
  const html = await render(createElement(RoldeEmailShell, props));
  return NextResponse.json({ html });
}
