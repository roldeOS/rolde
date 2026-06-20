import { NextResponse } from "next/server";
import crypto from "node:crypto";
import sharp from "sharp";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ROLES } from "@/lib/roles";
import { ROLDE_WORDMARK_SVG } from "@/lib/brandAssets";
import { AuditPdf, type AuditColumn } from "@/components/ui/pdf/AuditPdf";

/**
 * URDS PDF Kit — server-side render of an audit-grade export (Wave C; URDS §9.5).
 *
 * The client posts the table it's looking at (title, columns, the FILTERED rows,
 * scope). The server adds the identity it owns — the clinic name + the clinic's
 * own logo (rasterised SVG→PNG via sharp), the exporter's name + role, a unique
 * export reference and a SHA-256 fingerprint of the data — renders the branded
 * @react-pdf document, and streams back the PDF. (Wave D will log this + store
 * the artifact from the same pipeline.)
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
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const title = String(body.title ?? "Export").slice(0, 120);
  const columns = Array.isArray(body.columns) ? body.columns.slice(0, 40) : [];
  const rows = Array.isArray(body.rows) ? body.rows.slice(0, 10_000) : [];
  if (columns.length === 0) return NextResponse.json({ error: "no_columns" }, { status: 400 });

  // Identity the SERVER owns — clinic + logo, and the exporter's name + role.
  const supabase = await createClient();
  const [{ data: tenant }, { data: me }] = await Promise.all([
    supabase.from("tenants").select("name, logo_svg").eq("id", tenantId).maybeSingle(),
    supabase
      .from("tenant_users")
      .select("display_name, designation, role")
      .eq("tenant_id", tenantId)
      .eq("user_id", ctx.user.id)
      .maybeSingle(),
  ]);

  // Rasterise SVGs → PNG (sharp can't run inside @react-pdf, so we pre-bake them).
  // The RolDe OS wordmark + the clinic's own logo both go in the header. A failure
  // is a nicety lost, never a blocked export.
  const rasterize = async (svg: string, width: number): Promise<string | null> => {
    try {
      const png = await sharp(Buffer.from(svg)).resize({ width }).png().toBuffer();
      return `data:image/png;base64,${png.toString("base64")}`;
    } catch {
      return null;
    }
  };
  const [wordmarkPng, logoPng] = await Promise.all([
    rasterize(ROLDE_WORDMARK_SVG, 600),
    tenant?.logo_svg ? rasterize(tenant.logo_svg, 440) : Promise.resolve(null),
  ]);

  // Integrity — a deterministic fingerprint of exactly what's exported, and a
  // human export reference derived from it (both will be logged in Wave D).
  const fpFull = crypto.createHash("sha256").update(JSON.stringify({ columns, rows })).digest("hex");
  const fingerprint = `${fpFull.slice(0, 16)}…`;
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

  // Don't double a title the name already carries ("Dr" + "Dr Roland …" → "Dr Roland …").
  const dn = me?.display_name?.trim() ?? "";
  const desig = me?.designation?.trim() ?? "";
  const exporterName =
    (desig && dn && !dn.toLowerCase().startsWith(desig.toLowerCase()) ? `${desig} ${dn}` : dn) || undefined;
  const exporterRole = me?.role ? (ROLE_LABEL[me.role] ?? me.role) : undefined;

  const element = AuditPdf({
    title,
    scope: body.scope ? String(body.scope).slice(0, 200) : `${rows.length} ${rows.length === 1 ? "row" : "rows"}`,
    columns,
    rows,
    orientation: body.orientation === "portrait" ? "portrait" : "landscape",
    brand: { product: "RolDe OS", clinic: tenant?.name ?? undefined, wordmarkPng, logoPng, exporterName, exporterRole },
    reference,
    fingerprint,
    generatedAt,
  });

  let buffer: Buffer;
  try {
    buffer = (await renderToBuffer(element)) as Buffer;
  } catch (e) {
    console.error("[export/pdf]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "render_failed" }, { status: 500 });
  }

  const filename = `${slug(title)}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Export-Reference": reference,
    },
  });
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "export";
}
