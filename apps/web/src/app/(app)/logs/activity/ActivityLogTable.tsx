"use client";

import { Activity } from "lucide-react";
import { TableShell, type SortOption } from "@/components/ui/table/TableShell";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { DENSITY_CLASSES } from "@/components/ui/table/TableDensityToggle";
import { fmtWhen } from "@/lib/logFormat";

/**
 * ActivityLogTable — the clinic's unified activity timeline (Logs Hub; Bible 4.1
 * §5.4 / 4.3 §5.12). Every clinically-significant action: who did what, when.
 * Append-only, Caretaker-read. Coverage grows as more actions are instrumented.
 */

export type ActivityRow = {
  id: string;
  who: string;
  who_role: string;
  action: string;
  summary: string;
  at: string;
  /** Set only for the platform-wide (Custodian) view — adds a Clinic column. */
  clinic?: string;
};

/** Fallback when an action wasn't given a human summary — humanise the verb. */
function humanise(action: string): string {
  return action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function activityText(r: ActivityRow): string {
  return r.summary || humanise(r.action);
}

export function ActivityLogTable({
  rows,
  title,
  blurb,
  showClinic = false,
}: {
  rows: ActivityRow[];
  title: string;
  blurb: string;
  /** The Custodian platform-wide view spans clinics — add a Clinic column. */
  showClinic?: boolean;
}) {
  const clinicCol: DataTableColumn<ActivityRow> = {
    id: "clinic",
    header: "Clinic",
    width: "12rem",
    truncate: true,
    title: (r) => r.clinic ?? "",
    cell: (r) => <span className="text-muted-foreground">{r.clinic ?? "—"}</span>,
  };
  const columns: DataTableColumn<ActivityRow>[] = [
    ...(showClinic ? [clinicCol] : []),
    {
      id: "who",
      header: "Person",
      width: "15rem",
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
      id: "activity",
      header: "Activity",
      width: "40%",
      truncate: true,
      title: (r) => activityText(r),
      cell: (r) => <span className="text-foreground">{activityText(r)}</span>,
    },
    {
      id: "when",
      header: "When",
      width: "11rem",
      align: "right",
      cell: (r) => <span className="tabular-nums text-muted-foreground">{fmtWhen(r.at)}</span>,
    },
  ];

  const sortOptions: SortOption<ActivityRow>[] = [
    { key: "when", label: "When", compare: (a, b) => a.at.localeCompare(b.at) },
    { key: "person", label: "Person", compare: (a, b) => a.who.localeCompare(b.who) },
  ];

  const exportColumns = [
    ...(showClinic ? [{ header: "Clinic", w: 1.1, value: (r: ActivityRow) => r.clinic ?? "" }] : []),
    { header: "Person", w: 1.3, value: (r: ActivityRow) => `${r.who}${r.who_role ? ` (${r.who_role})` : ""}` },
    { header: "Activity", w: 3, value: (r: ActivityRow) => activityText(r) },
    { header: "When", w: 1.1, align: "right" as const, value: (r: ActivityRow) => fmtWhen(r.at) },
  ];

  return (
    <TableShell<ActivityRow>
      items={rows}
      storageKey="activity-log"
      label="events"
      header={{ variant: "page", icon: Activity, tone: "brand", title, explainer: { label: title, description: blurb } }}
      sortOptions={sortOptions}
      exportColumns={exportColumns}
      exportTitle="Activity Log"
      defaultPageSize={20}
    >
      {({ rows: slice, startIndex, density, freezeCount }) => (
        <DataTable<ActivityRow>
          columns={columns}
          rows={slice}
          rowKey={(r) => r.id}
          density={DENSITY_CLASSES[density]}
          minWidth="48rem"
          bare
          freezeCount={freezeCount}
          rowNumbers
          rowNumberStart={startIndex}
          empty="No activity recorded yet — significant actions in your clinic will appear here."
        />
      )}
    </TableShell>
  );
}
