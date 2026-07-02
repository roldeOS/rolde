import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { ROLES } from "@/lib/roles";
import { ROLDE_WORDMARK_PNG } from "@/lib/brandAssets";
import { LetterPdf } from "@/components/ui/pdf/LetterPdf";

/**
 * Render a clinical LETTER feed entry as the official branded PDF (URDS PDF Kit;
 * Roland 2026-07-01) — so a referral / sick note / discharge summary / GP letter
 * can be printed or, later, emailed (the same artifact attaches to the send).
 *
 * The entry is read through the CALLER'S session, so RLS decides visibility
 * (their clinic only). A letter PDF is patient data leaving the building —
 * audited exactly like every export: export_log (with the artifact) +
 * the Activity Log, and the patient-access trail already covers the record view.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.key, r.label]));

const LETTER_TITLES: Record<string, string> = {
  referral_letter: "Referral Letter",
  discharge_summary: "Discharge Summary",
  sick_note: "Sick Note",
  gp_letter: "GP Letter",
};

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
  const { data: entry } = await supabase
    .from("patient_feed_entries")
    .select("id, tenant_id, patient_id, entry_type, payload, created_at, created_by")
    .eq("id", entryId)
    .is("deleted_at", null)
    .maybeSingle();
  const title = entry ? LETTER_TITLES[entry.entry_type] : undefined;
  if (!entry || !title) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [{ data: patient }, { data: tenant }, { data: author }] = await Promise.all([
    supabase
      .from("patients")
      .select("first_name, last_name, date_of_birth, patient_number, address_line1, address_line2, city, postcode")
      .eq("id", entry.patient_id)
      .maybeSingle(),
    supabase.from("tenants").select("name, logo_png").eq("id", tenantId).maybeSingle(),
    entry.created_by
      ? supabase
          .from("tenant_users")
          .select("display_name, designation, role")
          .eq("tenant_id", tenantId)
          .eq("user_id", entry.created_by)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!patient) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const bodyText = String((entry.payload as { text?: string } | null)?.text ?? "").trim();
  const patientName = `${patient.first_name} ${patient.last_name}`.trim();
  const dob = patient.date_of_birth
    ? new Date(patient.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : undefined;
  const addressLines = [
    patient.address_line1,
    patient.address_line2,
    [patient.city, patient.postcode].filter(Boolean).join(" "),
  ].filter((l): l is string => Boolean(l && l.trim()));

  const dn = author?.display_name?.trim() ?? "";
  const desig = author?.designation?.trim() ?? "";
  const authorName =
    (desig && dn && !dn.toLowerCase().startsWith(desig.toLowerCase()) ? `${desig} ${dn}` : dn) || undefined;
  const authorRole = author?.role ? (ROLE_LABEL[author.role] ?? author.role) : undefined;

  // Integrity + reference — the same grammar as every RolDe export.
  const fpFull = crypto
    .createHash("sha256")
    .update(JSON.stringify({ entry: entry.id, type: entry.entry_type, text: bodyText }))
    .digest("hex");
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const reference = `LTR-${yyyymmdd}-${fpFull.slice(0, 6).toUpperCase()}`;
  const generatedAt = `${now.toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  })} UTC`;
  const letterDate = new Date(entry.created_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const element = LetterPdf({
    title,
    bodyText,
    letterDate,
    patient: {
      name: patientName,
      dob,
      patientNo: patient.patient_number ?? undefined,
      addressLines,
    },
    author: { name: authorName, role: authorRole },
    brand: {
      product: "RolDe OS",
      clinic: tenant?.name ?? undefined,
      wordmarkPng: ROLDE_WORDMARK_PNG,
      logoPng:
        typeof tenant?.logo_png === "string" && tenant.logo_png.startsWith("data:image/") ? tenant.logo_png : null,
    },
    reference,
    fingerprint: fpFull,
    generatedAt,
  });

  let buffer: Buffer;
  try {
    buffer = (await renderToBuffer(element)) as Buffer;
  } catch (e) {
    console.error("[letter pdf]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "render_failed" }, { status: 500 });
  }

  // Audit — a letter PDF is patient data leaving the building (export_log with the
  // artifact + the Activity Log). Best-effort: never blocks the download.
  try {
    const admin = createAdminClient();
    await admin.from("export_log").insert({
      tenant_id: tenantId,
      user_id: ctx.user.id,
      reference,
      fingerprint: fpFull,
      title: `${title} — ${patientName}`,
      scope: `Letter ${entry.id}`,
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
    resourceId: entry.patient_id,
    summary: `Generated a ${title} PDF`,
    metadata: { entry_id: entry.id, reference },
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
