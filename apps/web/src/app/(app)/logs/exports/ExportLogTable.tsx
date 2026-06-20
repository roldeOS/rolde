"use client";

import { FileClock, ExternalLink } from "lucide-react";
import { TableShell, type SortOption } from "@/components/ui/table/TableShell";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { DENSITY_CLASSES } from "@/components/ui/table/TableDensityToggle";

/**
 * ExportLogTable — the clinic's audit trail of PDF exports (URDS §9.5 / Wave D),
 * rendered on the shared URDS table standard. The row click (and the Open action)
 * streams the stored artifact from `/api/export/log/[id]` — RLS-gated, inline.
 */

export type ExportRow = {
  id: string;
  reference: string;
  fingerprint: string;
  title: string;
  scope: string | null;
  format: string;
  orientation: string | null;
  columns: unknown;
  row_count: number;
  byte_size: number;
  exporter_name: string | null;
  exporter_role: string | null;
  created_at: string;
};

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtBytes(n: number): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function fieldList(columns: unknown): string {
  return Array.isArray(columns) ? columns.map(String).join(", ") : "";
}

function exporter(r: ExportRow): string {
  return [r.exporter_name, r.exporter_role ? `(${r.exporter_role})` : ""].filter(Boolean).join(" ") || "—";
}

export function ExportLogTable({
  rows,
  title,
  blurb,
}: {
  rows: ExportRow[];
  title: string;
  blurb: string;
}) {
  const open = (r: ExportRow) => window.open(`/api/export/log/${r.id}`, "_blank", "noopener");

  const columns: DataTableColumn<ExportRow>[] = [
    {
      id: "reference",
      header: "Reference",
      width: "11rem",
      truncate: true,
      title: (r) => r.reference,
      cell: (r) => <span className="font-mono text-xs text-foreground">{r.reference}</span>,
    },
    {
      id: "title",
      header: "Document",
      width: "15%",
      truncate: true,
      title: (r) => r.title,
      cell: (r) => <span className="font-medium text-foreground">{r.title}</span>,
    },
    {
      id: "format",
      header: "Format",
      width: "5rem",
      cell: (r) => <span className="font-medium uppercase text-muted-foreground">{r.format}</span>,
    },
    {
      id: "scope",
      header: "Scope",
      width: "15%",
      truncate: true,
      title: (r) => r.scope ?? "",
      cell: (r) => <span className="text-muted-foreground">{r.scope || "—"}</span>,
    },
    {
      id: "fields",
      header: "Fields",
      width: "16%",
      truncate: true,
      title: (r) => fieldList(r.columns),
      cell: (r) => <span className="text-muted-foreground">{fieldList(r.columns) || "—"}</span>,
    },
    {
      id: "rows",
      header: "Rows",
      width: "5rem",
      align: "right",
      cell: (r) => <span className="tabular-nums text-muted-foreground">{r.row_count}</span>,
    },
    {
      id: "by",
      header: "Exported By",
      width: "12rem",
      truncate: true,
      title: (r) => exporter(r),
      cell: (r) => <span className="text-muted-foreground">{exporter(r)}</span>,
    },
    {
      id: "when",
      header: "When",
      width: "10.5rem",
      cell: (r) => <span className="tabular-nums text-muted-foreground">{fmtWhen(r.created_at)}</span>,
    },
    {
      id: "integrity",
      header: "Integrity",
      width: "8.5rem",
      truncate: true,
      title: (r) => `SHA-256 ${r.fingerprint} · ${fmtBytes(r.byte_size)}`,
      cell: (r) => <span className="font-mono text-[11px] text-muted-foreground/80">{r.fingerprint.slice(0, 10)}…</span>,
    },
    {
      id: "open",
      header: "",
      width: "5.5rem",
      align: "center",
      stopRowClick: true,
      cell: (r) => (
        <a
          href={`/api/export/log/${r.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
        >
          <ExternalLink className="size-3.5" /> Open
        </a>
      ),
    },
  ];

  const sortOptions: SortOption<ExportRow>[] = [
    { key: "when", label: "When", compare: (a, b) => a.created_at.localeCompare(b.created_at) },
    { key: "rows", label: "Rows", compare: (a, b) => a.row_count - b.row_count },
    { key: "size", label: "File Size", compare: (a, b) => a.byte_size - b.byte_size },
  ];

  const exportColumns = [
    { header: "Reference", w: 1.2, value: (r: ExportRow) => r.reference },
    { header: "Document", w: 1.4, value: (r: ExportRow) => r.title },
    { header: "Format", w: 0.6, value: (r: ExportRow) => r.format.toUpperCase() },
    { header: "Scope", w: 1.6, value: (r: ExportRow) => r.scope ?? "" },
    { header: "Fields", w: 1.8, value: (r: ExportRow) => fieldList(r.columns) },
    { header: "Rows", w: 0.6, align: "right" as const, value: (r: ExportRow) => r.row_count },
    { header: "Exported By", w: 1.4, value: (r: ExportRow) => exporter(r) },
    { header: "When", w: 1.2, value: (r: ExportRow) => fmtWhen(r.created_at) },
    { header: "Integrity SHA-256", w: 2.4, value: (r: ExportRow) => r.fingerprint },
  ];

  return (
    <TableShell<ExportRow>
      items={rows}
      storageKey="export-log"
      label="exports"
      header={{ variant: "page", icon: FileClock, tone: "neutral", title, explainer: { label: title, description: blurb } }}
      sortOptions={sortOptions}
      exportColumns={exportColumns}
      exportTitle="Export Log"
      defaultPageSize={20}
    >
      {({ rows: slice, startIndex, density, freezeCount }) => (
        <DataTable<ExportRow>
          columns={columns}
          rows={slice}
          rowKey={(r) => r.id}
          density={DENSITY_CLASSES[density]}
          onRowClick={open}
          minWidth="78rem"
          bare
          freezeCount={freezeCount}
          rowNumbers
          rowNumberStart={startIndex}
          empty="No exports yet — they'll appear here the moment someone exports a PDF."
        />
      )}
    </TableShell>
  );
}
