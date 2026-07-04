import crypto from "node:crypto";
import { renderToBuffer } from "@react-pdf/renderer";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rolde/db";
import { ROLES } from "@/lib/roles";
import { ROLDE_WORDMARK_PNG } from "@/lib/brandAssets";
import { LETTER_TITLES } from "@/lib/letters";
import { LetterPdf } from "@/components/ui/pdf/LetterPdf";

/**
 * The ONE letter-PDF builder (Courier C3, Roland 2026-07-04: a sent letter and
 * a printed letter must be the SAME elegant URDS artefact) — extracted from the
 * clinician PDF route so the token-gated Courier viewer renders the identical
 * document. Callers choose the Supabase client: the clinician route passes the
 * session client (RLS decides visibility); the Courier viewer passes the admin
 * client because the capability token IS the authorisation.
 */

const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.key, r.label]));

export type BuiltLetterPdf = {
  buffer: Buffer;
  title: string;
  reference: string;
  fingerprint: string;
  patientName: string;
  patientId: string;
  tenantId: string;
  authorName?: string;
  authorRole?: string;
};

export async function buildLetterPdf(
  db: SupabaseClient<Database>,
  entryId: string,
): Promise<{ ok: true; pdf: BuiltLetterPdf } | { ok: false; error: "not_found" | "render_failed" }> {
  const { data: entry } = await db
    .from("patient_feed_entries")
    .select("id, tenant_id, patient_id, entry_type, payload, created_at, created_by")
    .eq("id", entryId)
    .is("deleted_at", null)
    .maybeSingle();
  const title = entry ? LETTER_TITLES[entry.entry_type] : undefined;
  if (!entry || !title) return { ok: false, error: "not_found" };

  const [{ data: patient }, { data: tenant }, { data: author }] = await Promise.all([
    db
      .from("patients")
      .select("first_name, last_name, date_of_birth, patient_number, address_line1, address_line2, city, postcode")
      .eq("id", entry.patient_id)
      .maybeSingle(),
    db.from("tenants").select("name, logo_png").eq("id", entry.tenant_id).maybeSingle(),
    entry.created_by
      ? db
          .from("tenant_users")
          .select("display_name, designation, role")
          .eq("tenant_id", entry.tenant_id)
          .eq("user_id", entry.created_by)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!patient) return { ok: false, error: "not_found" };

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
    return { ok: false, error: "render_failed" };
  }

  return {
    ok: true,
    pdf: {
      buffer,
      title,
      reference,
      fingerprint: fpFull,
      patientName,
      patientId: entry.patient_id,
      tenantId: entry.tenant_id,
      authorName,
      authorRole,
    },
  };
}
