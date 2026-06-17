import { getAllDbLegalDocs } from "@/lib/legalDb";
import { LegalReader } from "./LegalReader";

/**
 * Legal & Safety — in-app, versioned home for every policy / safety document
 * (Roland 2026-06-11 / APPROVALS §1.9). Content is read LIVE from the DB (RLS
 * gives clinic users published + superseded for the history rail); the catalog
 * (title/icon/tone) stays in code. Custodians edit the content from their console.
 */
export default async function LegalPage() {
  const docs = await getAllDbLegalDocs();
  const versionsByKey = Object.fromEntries(docs.map((d) => [d.key, d.versions]));
  return <LegalReader versionsByKey={versionsByKey} />;
}
