"use client";

import { FileSearch } from "lucide-react";
import { TableShell, type SortOption } from "@/components/ui/table/TableShell";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { DENSITY_CLASSES } from "@/components/ui/table/TableDensityToggle";
import { fmtWhen } from "@/lib/logFormat";

/**
 * AccessLogTable — the clinic's Patient Access trail (Logs Hub; W1.1.7 §6.14).
 * Every time anyone opens a patient record it's recorded — the clinical-governance
 * "who saw this patient" answer every patient is entitled to ask. Read by the
 * Caretaker only (RLS). Access metadata only — never any clinical content.
 */

export type AccessRow = {
  id: string;
  who: string;
  who_role: string;
  patient: string;
  patient_no: string;
  action: string;
  at: string;
  /** Set only for the platform-wide (Custodian) view — adds a Clinic column. */
  clinic?: string;
};

const ACTION_LABEL: Record<string, string> = {
  view: "Viewed",
  edit: "Edited",
  create: "Created",
  print: "Printed",
  export: "Exported",
};

function actionLabel(a: string): string {
  return ACTION_LABEL[a] ?? (a ? a[0].toUpperCase() + a.slice(1) : "—");
}

export function AccessLogTable({
  rows,
  title,
  blurb,
  showClinic = false,
}: {
  rows: AccessRow[];
  title: string;
  blurb: string;
  /** The Custodian platform-wide view spans clinics — add a Clinic column. */
  showClinic?: boolean;
}) {
  const clinicCol: DataTableColumn<AccessRow> = {
    id: "clinic",
    header: "Clinic",
    width: "12rem",
    truncate: true,
    title: (r) => r.clinic ?? "",
    cell: (r) => <span className="text-muted-foreground">{r.clinic ?? "—"}</span>,
  };
  const columns: DataTableColumn<AccessRow>[] = [
    ...(showClinic ? [clinicCol] : []),
    {
      id: "who",
      header: "Person",
      width: "16%",
      truncate: true,
      title: (r) => `${r.who}${r.who_role ? ` (${r.who_role})` : ""}`,
      cell: (r) => (
        <span>
          <span className="font-medium text-foreground">{r.who}</span>
          {r.who_role ? <span className="text-muted-foreground"> · {r.who_role}</span> : null}
        </span>
      ),
    },
    {
      id: "patient",
      header: "Patient",
      width: "16%",
      truncate: true,
      title: (r) => `${r.patient}${r.patient_no ? ` (${r.patient_no})` : ""}`,
      cell: (r) => (
        <span>
          <span className="text-foreground">{r.patient}</span>
          {r.patient_no ? (
            <span className="font-mono text-[11px] text-muted-foreground"> · {r.patient_no}</span>
          ) : null}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      width: "7rem",
      cell: (r) => <span className="text-muted-foreground">{actionLabel(r.action)}</span>,
    },
    {
      id: "when",
      header: "When",
      width: "11rem",
      align: "right",
      cell: (r) => <span className="tabular-nums text-muted-foreground">{fmtWhen(r.at)}</span>,
    },
  ];

  const sortOptions: SortOption<AccessRow>[] = [
    { key: "when", label: "When", compare: (a, b) => a.at.localeCompare(b.at) },
    { key: "person", label: "Person", compare: (a, b) => a.who.localeCompare(b.who) },
    { key: "patient", label: "Patient", compare: (a, b) => a.patient.localeCompare(b.patient) },
  ];

  const exportColumns = [
    ...(showClinic ? [{ header: "Clinic", w: 1.1, value: (r: AccessRow) => r.clinic ?? "" }] : []),
    { header: "Person", w: 1.4, value: (r: AccessRow) => `${r.who}${r.who_role ? ` (${r.who_role})` : ""}` },
    { header: "Patient", w: 1.4, value: (r: AccessRow) => `${r.patient}${r.patient_no ? ` (${r.patient_no})` : ""}` },
    { header: "Action", w: 0.7, value: (r: AccessRow) => actionLabel(r.action) },
    { header: "When", w: 1.1, align: "right" as const, value: (r: AccessRow) => fmtWhen(r.at) },
  ];

  return (
    <TableShell<AccessRow>
      items={rows}
      storageKey="access-log"
      label="accesses"
      header={{ variant: "page", icon: FileSearch, tone: "info", title, explainer: { label: title, description: blurb } }}
      sortOptions={sortOptions}
      exportColumns={exportColumns}
      exportTitle="Patient Access Log"
      defaultPageSize={20}
    >
      {({ rows: slice, startIndex, density, freezeCount }) => (
        <DataTable<AccessRow>
          columns={columns}
          rows={slice}
          rowKey={(r) => r.id}
          density={DENSITY_CLASSES[density]}
          minWidth="48rem"
          bare
          freezeCount={freezeCount}
          rowNumbers
          rowNumberStart={startIndex}
          empty="No record accesses logged yet — they'll appear here as your team opens patient files."
        />
      )}
    </TableShell>
  );
}
