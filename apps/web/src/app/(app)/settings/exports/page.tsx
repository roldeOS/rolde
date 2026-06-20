import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getSettingsAccess, SettingsRestricted } from "../access";
import { getSection } from "../sections";
import { ExportLogTable, type ExportRow } from "./ExportLogTable";

/**
 * Settings → Export Log (Caretaker, URDS §9.5 / Wave D). Static segment —
 * overrides the `[section]` scaffold for the `exports` key.
 *
 * The clinic's audit trail of every PDF export — who · when · what (title +
 * scope + the columns that left) · the export reference · the SHA-256 of the
 * data — with the original file retrievable. Rows are read RLS-scoped (Caretaker
 * of this clinic, or Custodian); the heavy artifact (pdf_base64) is NEVER loaded
 * into the list — only the per-row download route streams it.
 */
export default async function ExportLogPage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const sec = getSection("exports");
  if (!sec) notFound();

  const tenantId = ctx?.membership?.tenant_id ?? null;

  if (!tenantId) {
    return (
      <div className="w-full space-y-6 p-6 lg:p-8">
        <PageHeaderRow
          icon={sec.icon}
          tone={sec.tone}
          title={sec.title}
          explainer={{ label: sec.title, description: sec.blurb }}
        />
        <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-float">
          This is a per-clinic record. As a Custodian you don&apos;t have a clinic of your own —
          open a specific clinic from{" "}
          <Link href="/custodian" className="font-medium text-foreground underline">
            Platform
          </Link>
          .
        </div>
      </div>
    );
  }

  const rows = await loadExports(tenantId);

  return (
    <div className="w-full p-6 lg:p-8">
      <ExportLogTable rows={rows} title={sec.title} blurb={sec.blurb} />
    </div>
  );
}

async function loadExports(tenantId: string): Promise<ExportRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("export_log")
    .select(
      "id, reference, fingerprint, title, scope, format, orientation, columns, row_count, byte_size, exporter_name, exporter_role, created_at",
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(500);
  return (data ?? []) as ExportRow[];
}
