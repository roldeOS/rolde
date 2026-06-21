import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { ROLES } from "@/lib/roles";
import { ROLDE_WORDMARK_PNG } from "@/lib/brandAssets";
import { AuditPdf, type AuditColumn } from "@/components/ui/pdf/AuditPdf";

/**
 * URDS PDF Kit — server-side render + AUDIT of a data export (Wave C/D; URDS §9.5).
 *
 * Handles BOTH formats — PDF (the audit-grade branded document) and CSV — through
 * one server path, so every export is owned by the server: it adds the clinic
 * name + logo, the exporter's name + role, a unique export reference and a SHA-256
 * fingerprint of the data, renders the file, and — unless this is the live PDF
 * preview — records it in `export_log` WITH THE ARTIFACT. CSV is audited exactly
 * like PDF: data leaving the building is data leaving the building.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.key, r.label]));

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || !tenantId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: {
    title?: string;
    scope?: string;
    columns?: AuditColumn[];
    rows?: Record<string, string>[];
    orientation?: "portrait" | "landscape";
    format?: "pdf" | "csv";
    /** The live in-dialog PDF preview renders but must NOT be logged as an export. */
    preview?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const format = body.format === "csv" ? "csv" : "pdf";
  const title = String(body.title ?? "Export").slice(0, 120);
  const columns = Array.isArray(body.columns) ? body.columns.slice(0, 40) : [];
  const rows = Array.isArray(body.rows) ? body.rows.slice(0, 10_000) : [];
  if (columns.length === 0) return NextResponse.json({ error: "no_columns" }, { status: 400 });

  // Identity the SERVER owns — clinic + logo, and the exporter's name + role.
  const supabase = await createClient();
  const [{ data: tenant }, { data: me }] = await Promise.all([
    supabase.from("tenants").select("name, logo_png").eq("id", tenantId).maybeSingle(),
    supabase
      .from("tenant_users")
      .select("display_name, designation, role")
      .eq("tenant_id", tenantId)
      .eq("user_id", ctx.user.id)
      .maybeSingle(),
  ]);

  const wordmarkPng = ROLDE_WORDMARK_PNG;
  const logoPng = typeof tenant?.logo_png === "string" && tenant.logo_png.startsWith("data:image/") ? tenant.logo_png : null;

  // Integrity — a deterministic fingerprint of exactly what's exported (format-
  // independent: the same data has the same fingerprint as PDF or CSV).
  const fpFull = crypto.createHash("sha256").update(JSON.stringify({ columns, rows })).digest("hex");
  const fingerprint = fpFull;
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const reference = `EXP-${yyyymmdd}-${fpFull.slice(0, 6).toUpperCase()}`;
  const generatedAt = `${now.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })} UTC`;

  const dn = me?.display_name?.trim() ?? "";
  const desig = me?.designation?.trim() ?? "";
  const exporterName =
    (desig && dn && !dn.toLowerCase().startsWith(desig.toLowerCase()) ? `${desig} ${dn}` : dn) || undefined;
  const exporterRole = me?.role ? (ROLE_LABEL[me.role] ?? me.role) : undefined;

  const scopeText = body.scope ? String(body.scope).slice(0, 200) : `${rows.length} ${rows.length === 1 ? "row" : "rows"}`;
  const orient = body.orientation === "portrait" ? "portrait" : "landscape";

  // Produce the artifact — CSV (text) or the branded PDF.
  let buffer: Buffer;
  let contentType: string;
  let ext: string;
  if (format === "csv") {
    buffer = Buffer.from(buildCsv(columns, rows), "utf8");
    contentType = "text/csv;charset=utf-8";
    ext = "csv";
  } else {
    const element = AuditPdf({
      title,
      scope: scopeText,
      columns,
      rows,
      orientation: orient,
      brand: { product: "RolDe OS", clinic: tenant?.name ?? undefined, wordmarkPng, logoPng, exporterName, exporterRole },
      reference,
      fingerprint,
      generatedAt,
    });
    try {
      buffer = (await renderToBuffer(element)) as Buffer;
    } catch (e) {
      console.error("[export]", e instanceof Error ? e.message : e);
      return NextResponse.json({ error: "render_failed" }, { status: 500 });
    }
    contentType = "application/pdf";
    ext = "pdf";
  }

  // Record the export (the audit trail), WITH the artifact, unless this is the
  // live PDF preview. Best-effort: a logging hiccup must never fail the download.
  if (!body.preview) {
    try {
      const admin = createAdminClient();
      await admin.from("export_log").insert({
        tenant_id: tenantId,
        user_id: ctx.user.id,
        reference,
        fingerprint,
        title,
        scope: scopeText,
        format,
        orientation: format === "pdf" ? orient : null,
        columns: columns.map((c) => c.header),
        row_count: rows.length,
        byte_size: buffer.length,
        exporter_name: exporterName ?? null,
        exporter_role: exporterRole ?? null,
        artifact_base64: buffer.toString("base64"),
      });
    } catch (e) {
      console.error("[export] log", e instanceof Error ? e.message : e);
    }
    // Activity Log (the unified timeline) — exports are significant data egress.
    await logAudit({
      tenantId,
      actorUserId: ctx.user.id,
      action: "export.create",
      resourceType: "export",
      resourceId: reference,
      summary: `Exported ${title} (${format.toUpperCase()}, ${rows.length} ${rows.length === 1 ? "row" : "rows"})`,
    });
  }

  const filename = `${slug(title)}.${ext}`;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Export-Reference": reference,
    },
  });
}

/** Excel-friendly CSV — UTF-8 BOM, CRLF rows, every field quoted + escaped. */
function buildCsv(columns: AuditColumn[], rows: Record<string, string>[]): string {
  const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const head = columns.map((c) => esc(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(",")).join("\r\n");
  return `﻿${head}\r\n${body}`;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "export";
}
