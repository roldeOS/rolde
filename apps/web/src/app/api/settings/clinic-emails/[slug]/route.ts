import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Update one of the CALLER'S clinic email templates (Caretaker editor → Save).
 * The clinic comes from the session, so a Caretaker can only edit their own
 * clinic's rows. Content fields only.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!tenantId || ctx?.membership?.role !== "caretaker") {
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
    .eq("tenant_id", tenantId)
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
