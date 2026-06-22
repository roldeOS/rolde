"use client";

import { ShieldCheck } from "lucide-react";
import { TableShell, type SortOption } from "@/components/ui/table/TableShell";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { DENSITY_CLASSES } from "@/components/ui/table/TableDensityToggle";
import { fmtWhen, fmtUtc } from "@/lib/logFormat";

/**
 * SignInLogTable — the clinic's authentication trail (Logs Hub; Bible 4.1 §5.4).
 * Who signed in / out, who FAILED, who changed a password — and from which IP and
 * device. Fed by the durable mirror of GoTrue's journal + our own failed-attempt
 * writer. Append-only; Caretaker reads their members', Custodian all.
 */

export type SignInRow = {
  id: string;
  who: string;
  /** raw GoTrue/app action verb, e.g. 'login', 'login_failed'. */
  action: string;
  ip: string;
  device: string;
  at: string;
  /** The login identifier + auth method — export (the unambiguous "who" + "how"). */
  email?: string | null;
  method?: string | null;
  /** Set only for the platform-wide (Custodian) view — adds a Clinic column. */
  clinic?: string;
};

/** Success / Failure — the audit "outcome" of the auth event. */
function outcome(action: string): string {
  if (action === "login_failed") return "Failed";
  if (action === "token_revoked" || action === "factor_unenrolled") return "—";
  return "Success";
}

const EVENT_LABEL: Record<string, string> = {
  login: "Signed In",
  logout: "Signed Out",
  login_failed: "Failed Sign-in",
  mfa_code_login: "Signed In With MFA",
  user_updated_password: "Changed Password",
  user_recovery_requested: "Requested a Password Reset",
  user_reauthenticate_requested: "Re-authentication Required",
  user_modified: "Account Updated",
  factor_in_progress: "Started MFA Setup",
  factor_unenrolled: "Removed an MFA Factor",
  verification_attempted: "MFA Verification Attempt",
  token_revoked: "Session Revoked",
};

function eventLabel(action: string): string {
  return (
    EVENT_LABEL[action] ??
    action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function SignInLogTable({
  rows,
  title,
  blurb,
  showClinic = false,
}: {
  rows: SignInRow[];
  title: string;
  blurb: string;
  showClinic?: boolean;
}) {
  const clinicCol: DataTableColumn<SignInRow> = {
    id: "clinic",
    header: "Clinic",
    width: "12rem",
    truncate: true,
    title: (r) => r.clinic ?? "",
    cell: (r) => <span className="text-muted-foreground">{r.clinic ?? "—"}</span>,
  };
  const columns: DataTableColumn<SignInRow>[] = [
    ...(showClinic ? [clinicCol] : []),
    {
      id: "who",
      header: "Person",
      width: "13rem",
      truncate: true,
      title: (r) => r.who,
      cell: (r) => <span className="font-medium text-foreground">{r.who}</span>,
    },
    {
      id: "email",
      header: "Email",
      width: "14rem",
      truncate: true,
      title: (r) => r.email ?? "",
      cell: (r) => <span className="text-muted-foreground">{r.email || "—"}</span>,
    },
    {
      id: "event",
      header: "Event",
      width: "13rem",
      truncate: true,
      title: (r) => eventLabel(r.action),
      cell: (r) => (
        <span className={r.action === "login_failed" ? "text-warning" : "text-foreground"}>
          {eventLabel(r.action)}
        </span>
      ),
    },
    {
      id: "ip",
      header: "IP Address",
      width: "10rem",
      truncate: true,
      title: (r) => r.ip,
      cell: (r) => <span className="tabular-nums text-muted-foreground">{r.ip || "—"}</span>,
    },
    {
      id: "device",
      header: "Device",
      width: "11rem",
      truncate: true,
      title: (r) => r.device,
      cell: (r) => <span className="text-muted-foreground">{r.device || "—"}</span>,
    },
    {
      id: "when",
      header: "When",
      width: "11rem",
      align: "right",
      cell: (r) => <span className="tabular-nums text-muted-foreground">{fmtWhen(r.at)}</span>,
    },
  ];

  const sortOptions: SortOption<SignInRow>[] = [
    { key: "when", label: "When", compare: (a, b) => a.at.localeCompare(b.at) },
    { key: "person", label: "Person", compare: (a, b) => a.who.localeCompare(b.who) },
  ];

  // Export = the forensic set: the login email, the auth method, the outcome, and
  // an unambiguous UTC time, alongside the IP + device already on screen.
  const exportColumns = [
    ...(showClinic ? [{ header: "Clinic", w: 1.1, value: (r: SignInRow) => r.clinic ?? "" }] : []),
    { header: "Person", w: 1.3, value: (r: SignInRow) => r.who },
    { header: "Email", w: 1.6, value: (r: SignInRow) => r.email ?? "" },
    { header: "Event", w: 1.2, value: (r: SignInRow) => eventLabel(r.action) },
    { header: "Outcome", w: 0.8, value: (r: SignInRow) => outcome(r.action) },
    { header: "Method", w: 1, value: (r: SignInRow) => r.method ?? "" },
    { header: "IP Address", w: 1, value: (r: SignInRow) => r.ip },
    { header: "Device", w: 1.1, value: (r: SignInRow) => r.device },
    { header: "When (UTC)", w: 1.5, value: (r: SignInRow) => fmtUtc(r.at) },
  ];

  return (
    <TableShell<SignInRow>
      items={rows}
      storageKey="sign-in-log"
      label="events"
      header={{ variant: "page", icon: ShieldCheck, tone: "info", title, explainer: { label: title, description: blurb } }}
      sortOptions={sortOptions}
      exportColumns={exportColumns}
      exportTitle="Sign-in & Security Log"
      defaultPageSize={20}
    >
      {({ rows: slice, startIndex, density, freezeCount }) => (
        <DataTable<SignInRow>
          columns={columns}
          rows={slice}
          rowKey={(r) => r.id}
          density={DENSITY_CLASSES[density]}
          minWidth="52rem"
          bare
          freezeCount={freezeCount}
          rowNumbers
          rowNumberStart={startIndex}
          empty="No sign-in activity yet — logins, sign-outs and failed attempts will appear here."
        />
      )}
    </TableShell>
  );
}
