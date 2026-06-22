"use client";

import { Send } from "lucide-react";
import { TableShell, type SortOption } from "@/components/ui/table/TableShell";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { DENSITY_CLASSES } from "@/components/ui/table/TableDensityToggle";
import { fmtWhen, fmtUtc } from "@/lib/logFormat";

/**
 * CommsLogTable — the clinic's operational-email trail (Logs Hub; Bible 4.4 §6).
 * Every email the clinic sent a patient + how far it got (delivered → opened →
 * clicked), because "sent" is not "delivered". Comms are clinical-adjacent
 * records; read by the Caretaker only.
 *
 * Lean on screen (Recipient · Type · Subject · Status · Sent); the EXPORT carries
 * the full forensic set an auditor needs — the provider Message ID (to trace with
 * the email provider), the delivery timeline in UTC, the failure reason, the source.
 */

export type CommsRow = {
  id: string;
  to_name: string | null;
  to_email: string;
  subject: string;
  status: string;
  template_slug: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  source: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
  /** Set only for the platform-wide (Custodian) view — adds a Clinic column. */
  clinic?: string;
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

/** Friendly name for the email's type, from its template slug. */
const TYPE_LABEL: Record<string, string> = {
  auth_password_reset: "Password Reset",
  auth_invite: "Invitation",
};
function typeLabel(slug: string | null): string {
  if (!slug) return "—";
  return (
    TYPE_LABEL[slug] ??
    slug.replace(/^auth_/, "").replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function CommsLogTable({
  rows,
  title,
  blurb,
  showClinic = false,
}: {
  rows: CommsRow[];
  title: string;
  blurb: string;
  /** The Custodian platform-wide view spans clinics — add a Clinic column. */
  showClinic?: boolean;
}) {
  const clinicCol: DataTableColumn<CommsRow> = {
    id: "clinic",
    header: "Clinic",
    width: "11rem",
    truncate: true,
    title: (r) => r.clinic ?? "",
    cell: (r) => <span className="text-muted-foreground">{r.clinic ?? "—"}</span>,
  };
  const columns: DataTableColumn<CommsRow>[] = [
    ...(showClinic ? [clinicCol] : []),
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
      id: "type",
      header: "Type",
      width: "10rem",
      truncate: true,
      title: (r) => typeLabel(r.template_slug),
      cell: (r) => <span className="text-muted-foreground">{typeLabel(r.template_slug)}</span>,
    },
    {
      id: "subject",
      header: "Subject",
      width: "24%",
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
      id: "msgid",
      header: "Message ID",
      width: "10rem",
      truncate: true,
      title: (r) => r.provider_message_id ?? "",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">{r.provider_message_id ?? "—"}</span>
      ),
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

  // Export = the full forensic set (more than the screen) so an auditor has
  // everything: the type, the provider Message ID to trace with, the delivery
  // timeline in UTC, the failure reason, and the source flow.
  const exportColumns = [
    ...(showClinic ? [{ header: "Clinic", w: 1.1, value: (r: CommsRow) => r.clinic ?? "" }] : []),
    { header: "Type", w: 1.0, value: (r: CommsRow) => typeLabel(r.template_slug) },
    { header: "Recipient", w: 1.6, value: (r: CommsRow) => `${r.to_name ? `${r.to_name} ` : ""}<${r.to_email}>` },
    { header: "Subject", w: 2.2, value: (r: CommsRow) => r.subject },
    { header: "Status", w: 0.8, value: (r: CommsRow) => delivery(r) },
    { header: "Message ID", w: 1.8, value: (r: CommsRow) => r.provider_message_id ?? "" },
    { header: "Sent (UTC)", w: 1.5, value: (r: CommsRow) => fmtUtc(r.created_at) },
    { header: "Delivered (UTC)", w: 1.5, value: (r: CommsRow) => fmtUtc(r.delivered_at) },
    { header: "Opened (UTC)", w: 1.5, value: (r: CommsRow) => fmtUtc(r.opened_at) },
    { header: "Clicked (UTC)", w: 1.5, value: (r: CommsRow) => fmtUtc(r.clicked_at) },
    { header: "Failure Reason", w: 1.6, value: (r: CommsRow) => r.error_message ?? "" },
    { header: "Source", w: 1.0, value: (r: CommsRow) => r.source ?? "" },
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
