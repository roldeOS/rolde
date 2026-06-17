import { notFound } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { getLegalEditorData } from "@/lib/legalDb";
import { LegalEditor } from "./LegalEditor";

/**
 * Custodian → Legal & Safety editor (W1.5.2). The Campaigns-style workspace:
 * the document library on the left, the draft → preview → publish flow on the
 * right. Custodian-only (the platform legal docs are RolDe's own).
 */
export default async function CustodianLegalPage() {
  const ctx = await getSessionContext();
  if (!ctx?.isCustodian) notFound();
  const versionsByKey = await getLegalEditorData();
  return <LegalEditor versionsByKey={versionsByKey} />;
}
