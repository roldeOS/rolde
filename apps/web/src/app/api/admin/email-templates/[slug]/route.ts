import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Update a PLATFORM email template's content (Custodian editor → Save).
 * Custodian-only. Touches content fields only — slug / category / tenant scope
 * are immutable here.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx?.isCustodian) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { slug } = await params;
  const b = await request.json().catch(() => ({}));

  const { error } = await createAdminClient()
    .from("email_templates")
    .update({
      name: b.name,
      subject: b.subject,
      preheader: b.preheader ?? null,
      headline: b.headline ?? null,
      paragraphs: Array.isArray(b.paragraphs) ? b.paragraphs : [],
      cta_label: b.cta_label || null,
      cta_url: b.cta_url || null,
      footer_note: b.footer_note || null,
      is_active: Boolean(b.is_active),
    })
    .is("tenant_id", null)
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
