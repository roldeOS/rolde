import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { buildLetterPdf } from "@/lib/letterPdf";

/**
 * Render a clinical LETTER feed entry as the official branded PDF (URDS PDF Kit;
 * Roland 2026-07-01) — so a referral / sick note / discharge summary / GP letter
 * can be printed or emailed (Courier C3 sends the SAME artefact via the shared
 * builder in lib/letterPdf.ts).
 *
 * The entry is read through the CALLER'S session, so RLS decides visibility
 * (their clinic only). A letter PDF is patient data leaving the building —
 * audited exactly like every export: export_log (with the artifact) +
 * the Activity Log, and the patient-access trail already covers the record view.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || !tenantId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { entryId } = await params;
  const supabase = await createClient();

  // The letter, through the caller's own session (RLS re-checks the clinic).
  const built = await buildLetterPdf(supabase, entryId);
  if (!built.ok) {
    return NextResponse.json(
      { error: built.error },
      { status: built.error === "not_found" ? 404 : 500 },
    );
  }
  const { buffer, title, reference, fingerprint, patientName, patientId, authorName, authorRole } =
    built.pdf;

  // Audit — a letter PDF is patient data leaving the building (export_log with the
  // artifact + the Activity Log). Best-effort: never blocks the download.
  try {
    const admin = createAdminClient();
    await admin.from("export_log").insert({
      tenant_id: tenantId,
      user_id: ctx.user.id,
      reference,
      fingerprint,
      title: `${title} — ${patientName}`,
      scope: `Letter ${entryId}`,
      format: "pdf",
      orientation: "portrait",
      columns: ["letter"],
      row_count: 1,
      byte_size: buffer.length,
      exporter_name: authorName ?? null,
      exporter_role: authorRole ?? null,
      artifact_base64: buffer.toString("base64"),
    });
  } catch (e) {
    console.error("[letter pdf] log", e instanceof Error ? e.message : e);
  }
  await logAudit({
    tenantId,
    actorUserId: ctx.user.id,
    action: "letter.pdf",
    resourceType: "patient",
    resourceId: patientId,
    summary: `Generated a ${title} PDF`,
    metadata: { entry_id: entryId, reference },
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${title.toLowerCase().replace(/\s+/g, "-")}-${reference}.pdf"`,
      "X-Export-Reference": reference,
    },
  });
}
