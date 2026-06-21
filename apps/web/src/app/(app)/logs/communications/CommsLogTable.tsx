"use client";

import { Send } from "lucide-react";
import { TableShell, type SortOption } from "@/components/ui/table/TableShell";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { DENSITY_CLASSES } from "@/components/ui/table/TableDensityToggle";
import { fmtWhen } from "@/lib/logFormat";

/**
 * CommsLogTable — the clinic's operational-email trail (Logs Hub; Bible 4.4 §6).
 * Every email the clinic sent a patient + how far it got (delivered → opened →
 * clicked), because "sent" is not "delivered". Comms are clinical-adjacent
 * records; read by the Caretaker only.
 */

export type CommsRow = {
  id: string;
  to_name: string | null;
  to_email: string;
  subject: string;
  status: string;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
};

/** The furthest the email got — "sent" is not "delivered" (email-deliverability). */
function delivery(r: CommsRow): string {
  if (r.status === "bounced" || r.status === "failed" || r.status === "complained") return "Failed";
  if (r.clicked_at) return "Clicked";
  if (r.opened_at) return "Opened";
  if (r.delivered_at) return "Delivered";
  if (r.status === "sent" || r.status === "queued" || r.status === "processed") return "Sent";
  return r.status ? r.status[0].toUpperCase() + r.status.slice(1) : "—";
}

export function CommsLogTable({
  rows,
  title,
  blurb,
}: {
  rows: CommsRow[];
  title: string;
  blurb: string;
}) {
  const columns: DataTableColumn<CommsRow>[] = [
    {
      id: "to",
      header: "Recipient",
      width: "20%",
      truncate: true,
      title: (r) => `${r.to_name ? `${r.to_name} · ` : ""}${r.to_email}`,
      cell: (r) => (
        <span>
          {r.to_name ? <span className="font-medium text-foreground">{r.to_name}</span> : null}
          <span className={r.to_name ? "text-muted-foreground" : "text-foreground"}>
            {r.to_name ? ` · ${r.to_email}` : r.to_email}
          </span>
        </span>
      ),
    },
    {
      id: "subject",
      header: "Subject",
      width: "26%",
      truncate: true,
      title: (r) => r.subject,
      cell: (r) => <span className="text-foreground">{r.subject || "—"}</span>,
    },
    {
      id: "status",
      header: "Status",
      width: "7.5rem",
      cell: (r) => <span className="text-muted-foreground">{delivery(r)}</span>,
    },
    {
      id: "sent",
      header: "Sent",
      width: "11rem",
      align: "right",
      cell: (r) => <span className="tabular-nums text-muted-foreground">{fmtWhen(r.created_at)}</span>,
    },
  ];

  const sortOptions: SortOption<CommsRow>[] = [
    { key: "sent", label: "Sent", compare: (a, b) => a.created_at.localeCompare(b.created_at) },
    { key: "recipient", label: "Recipient", compare: (a, b) => a.to_email.localeCompare(b.to_email) },
  ];

  const exportColumns = [
    { header: "Recipient", w: 1.6, value: (r: CommsRow) => `${r.to_name ? `${r.to_name} ` : ""}<${r.to_email}>` },
    { header: "Subject", w: 2.2, value: (r: CommsRow) => r.subject },
    { header: "Status", w: 0.8, value: (r: CommsRow) => delivery(r) },
    { header: "Sent", w: 1.1, align: "right" as const, value: (r: CommsRow) => fmtWhen(r.created_at) },
  ];

  return (
    <TableShell<CommsRow>
      items={rows}
      storageKey="comms-log"
      label="emails"
      header={{ variant: "page", icon: Send, tone: "neutral", title, explainer: { label: title, description: blurb } }}
      sortOptions={sortOptions}
      exportColumns={exportColumns}
      exportTitle="Communications Log"
      defaultPageSize={20}
    >
      {({ rows: slice, startIndex, density, freezeCount }) => (
        <DataTable<CommsRow>
          columns={columns}
          rows={slice}
          rowKey={(r) => r.id}
          density={DENSITY_CLASSES[density]}
          minWidth="52rem"
          bare
          freezeCount={freezeCount}
          rowNumbers
          rowNumberStart={startIndex}
          empty="No emails sent yet — operational emails to patients (reminders, results, follow-ups) will appear here."
        />
      )}
    </TableShell>
  );
}
