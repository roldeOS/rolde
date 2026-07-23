"use client";

import { Radio } from "lucide-react";
import { TableShell, type SortOption } from "@/components/ui/table/TableShell";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { DENSITY_CLASSES } from "@/components/ui/table/TableDensityToggle";
import { fmtWhen, fmtUtc } from "@/lib/logFormat";

/**
 * RealtimeHealthTable (Live Feed, Roland 2026-07-23). When a clinician's live
 * feed channel drops, the client records it — WHICH clinic, who, when, why — so
 * the Caretaker (their clinic) and the Custodian (all clinics) can see a clinic
 * whose realtime is flaky. The feed itself has already fallen back to refetch-on-
 * focus by then: this is the visibility, not the failure. A quiet table with no
 * rows is the healthy state.
 */

export type RealtimeHealthRow = {
  id: string;
  clinician: string | null;
  reason: string;
  user_agent: string | null;
  occurred_at: string;
  /** Set only for the platform-wide (Custodian) view — adds a Clinic column. */
  clinic?: string;
};

const REASON_LABEL: Record<string, string> = {
  channel_error: "Channel error",
  timed_out: "Timed out",
  connect_failed: "Could not connect",
};
const reasonLabel = (r: string): string => REASON_LABEL[r] ?? "Channel error";

/** A short, human device line from the raw user-agent (the full string exports). */
function deviceOf(ua: string | null): string {
  if (!ua) return "—";
  const os =
    /iphone|ipad|ios/i.test(ua) ? "iOS" :
    /android/i.test(ua) ? "Android" :
    /mac os x|macintosh/i.test(ua) ? "macOS" :
    /windows/i.test(ua) ? "Windows" :
    /linux/i.test(ua) ? "Linux" : "";
  const browser =
    /edg\//i.test(ua) ? "Edge" :
    /chrome|crios/i.test(ua) ? "Chrome" :
    /firefox|fxios/i.test(ua) ? "Firefox" :
    /safari/i.test(ua) ? "Safari" : "Browser";
  return [browser, os].filter(Boolean).join(" · ") || "—";
}

export function RealtimeHealthTable({
  rows,
  title,
  blurb,
  showClinic = false,
}: {
  rows: RealtimeHealthRow[];
  title: string;
  blurb: string;
  /** The Custodian platform-wide view spans clinics — add a Clinic column. */
  showClinic?: boolean;
}) {
  const clinicCol: DataTableColumn<RealtimeHealthRow> = {
    id: "clinic",
    header: "Clinic",
    width: "12rem",
    truncate: true,
    title: (r) => r.clinic ?? "",
    cell: (r) => <span className="text-muted-foreground">{r.clinic ?? "—"}</span>,
  };
  const columns: DataTableColumn<RealtimeHealthRow>[] = [
    ...(showClinic ? [clinicCol] : []),
    {
      id: "clinician",
      header: "Clinician",
      width: "18%",
      truncate: true,
      title: (r) => r.clinician ?? "",
      cell: (r) => (
        <span className="text-foreground">{r.clinician ?? "—"}</span>
      ),
    },
    {
      id: "reason",
      header: "Reason",
      width: "11rem",
      cell: (r) => <span className="text-muted-foreground">{reasonLabel(r.reason)}</span>,
    },
    {
      id: "device",
      header: "Device",
      width: "14rem",
      truncate: true,
      title: (r) => r.user_agent ?? "",
      cell: (r) => <span className="text-muted-foreground">{deviceOf(r.user_agent)}</span>,
    },
    {
      id: "when",
      header: "When",
      width: "11rem",
      align: "right",
      cell: (r) => (
        <span className="tabular-nums text-muted-foreground">{fmtWhen(r.occurred_at)}</span>
      ),
    },
  ];

  const sortOptions: SortOption<RealtimeHealthRow>[] = [
    { key: "when", label: "When", compare: (a, b) => a.occurred_at.localeCompare(b.occurred_at) },
  ];

  const exportColumns = [
    ...(showClinic ? [{ header: "Clinic", w: 1.2, value: (r: RealtimeHealthRow) => r.clinic ?? "" }] : []),
    { header: "Clinician", w: 1.4, value: (r: RealtimeHealthRow) => r.clinician ?? "" },
    { header: "Reason", w: 1.0, value: (r: RealtimeHealthRow) => reasonLabel(r.reason) },
    { header: "Device", w: 1.2, value: (r: RealtimeHealthRow) => deviceOf(r.user_agent) },
    { header: "User Agent", w: 2.6, value: (r: RealtimeHealthRow) => r.user_agent ?? "" },
    { header: "When (UTC)", w: 1.5, value: (r: RealtimeHealthRow) => fmtUtc(r.occurred_at) },
  ];

  return (
    <TableShell<RealtimeHealthRow>
      items={rows}
      storageKey="realtime-health-log"
      label="events"
      header={{ variant: "page", icon: Radio, tone: "neutral", title, explainer: { label: title, description: blurb } }}
      sortOptions={sortOptions}
      exportColumns={exportColumns}
      exportTitle="Realtime Health"
      defaultPageSize={20}
    >
      {({ rows: slice, startIndex, density, freezeCount }) => (
        <DataTable<RealtimeHealthRow>
          columns={columns}
          rows={slice}
          rowKey={(r) => r.id}
          density={DENSITY_CLASSES[density]}
          minWidth="44rem"
          bare
          freezeCount={freezeCount}
          rowNumbers
          rowNumberStart={startIndex}
          empty="All clear — no live-feed drop-outs recorded. When a clinician's realtime connection fails, it appears here (the feed keeps working, refreshing on focus)."
        />
      )}
    </TableShell>
  );
}
