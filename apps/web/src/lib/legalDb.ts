import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  LEGAL_DOCS,
  type LegalDoc,
  type LegalSection,
  type LegalVersion,
} from "@/lib/legal";

/**
 * Read legal-document CONTENT from the DB (the editable source of truth) and
 * merge it onto the code catalog (title / icon / tone / summary). RLS scopes
 * what each caller sees: anon → published only; authenticated clinic user →
 * published + superseded (the in-app version history); Custodian → all incl.
 * drafts. Versions come back newest-first.
 */
type DbRow = {
  doc_key: string;
  version: string;
  status: string;
  intro: string;
  sections: LegalSection[] | null;
  published_at: string | null;
  created_at: string;
};

const COLS = "doc_key, version, status, intro, sections, published_at, created_at";

function toVersion(row: DbRow): LegalVersion {
  return {
    v: row.version,
    date: (row.published_at ?? row.created_at).slice(0, 10),
    status: row.status === "published" ? "current" : (row.status as LegalVersion["status"]),
    intro: row.intro,
    sections: row.sections ?? [],
  };
}

export type DbLegalDoc = LegalDoc & { versions: LegalVersion[] };

export async function getDbLegalDoc(key: string): Promise<DbLegalDoc | null> {
  const catalog = LEGAL_DOCS.find((d) => d.key === key);
  if (!catalog) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("legal_doc_versions")
    .select(COLS)
    .eq("doc_key", key)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return { ...catalog, versions: ((data as DbRow[] | null) ?? []).map(toVersion) };
}

export async function getAllDbLegalDocs(): Promise<DbLegalDoc[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("legal_doc_versions")
    .select(COLS)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  const byKey = new Map<string, DbRow[]>();
  for (const r of (data as DbRow[] | null) ?? []) {
    const list = byKey.get(r.doc_key) ?? [];
    list.push(r);
    byKey.set(r.doc_key, list);
  }
  return LEGAL_DOCS.map((doc) => ({ ...doc, versions: (byKey.get(doc.key) ?? []).map(toVersion) }));
}
