import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { LEGAL_DOCS } from "@/lib/legal";

/**
 * Seed the editable legal CONTENT into `legal_doc_versions` from the code-defined
 * LEGAL_DOCS (the v1.0 first drafts RolDe wrote). Idempotent: a doc+version that
 * already exists is skipped, so re-running never duplicates or clobbers a
 * Custodian's later edits. The catalog (title/icon/tone) stays in code; only the
 * intro + sections live in the DB from here on.
 */
const STATUS_MAP: Record<string, "draft" | "published" | "superseded"> = {
  current: "published",
  superseded: "superseded",
  draft: "draft",
};

export async function seedLegalDocs(): Promise<{ inserted: number; skipped: number }> {
  const admin = createAdminClient();
  let inserted = 0;
  let skipped = 0;

  for (const doc of LEGAL_DOCS) {
    for (const v of doc.versions) {
      const { data: existing } = await admin
        .from("legal_doc_versions")
        .select("id")
        .eq("doc_key", doc.key)
        .eq("version", v.v)
        .maybeSingle();
      if (existing) {
        skipped++;
        continue;
      }
      const status = STATUS_MAP[v.status] ?? "draft";
      const { error } = await admin.from("legal_doc_versions").insert({
        doc_key: doc.key,
        version: v.v,
        status,
        intro: v.intro,
        sections: v.sections,
        published_at: status === "published" ? new Date(v.date).toISOString() : null,
      });
      if (error) throw new Error(`legal seed ${doc.key} v${v.v}: ${error.message}`);
      inserted++;
    }
  }
  return { inserted, skipped };
}
