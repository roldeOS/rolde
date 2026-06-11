"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Download,
  ArrowUp,
  ArrowDown,
  TriangleAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardHeaderRow } from "@/components/ui/CardHeaderRow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PatientRow = {
  id: string;
  patient_number: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex_at_birth: string;
  phone_mobile: string | null;
  email: string | null;
  status: string;
  has_active_alerts: boolean;
  created_at: string;
};

type SortKey = "number" | "name" | "dob" | "registered";

/** Status → pill styling (patients.status). */
const STATUS_PILL: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-slate-500/10 text-slate-600",
  deceased: "bg-critical/10 text-critical",
  merged: "bg-warning/12 text-warning",
};

function age(d: string) {
  const dob = new Date(d);
  const now = new Date();
  let a = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) a--;
  return a;
}
function fmtDob(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** A floating, sortable data-table — the mindate TableShell pattern (Roland
 * 2026-06-11). NO per-table search box: the universal ⌘K search is the one
 * search (Roland: "universal search solves that"). */
export function PatientsTable({ rows }: { rows: PatientRow[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")
        cmp = `${a.last_name} ${a.first_name}`.localeCompare(
          `${b.last_name} ${b.first_name}`,
        );
      else if (sortKey === "number")
        cmp = (a.patient_number ?? "").localeCompare(b.patient_number ?? "");
      else if (sortKey === "dob")
        cmp = a.date_of_birth.localeCompare(b.date_of_birth);
      else cmp = a.created_at.localeCompare(b.created_at);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  function exportCsv() {
    const head = ["Number", "Last name", "First name", "DOB", "Sex", "Mobile", "Email", "Registered", "Status"];
    const lines = sorted.map((r) =>
      [
        r.patient_number ?? "",
        r.last_name,
        r.first_name,
        r.date_of_birth,
        r.sex_at_birth,
        r.phone_mobile ?? "",
        r.email ?? "",
        r.created_at.slice(0, 10),
        r.status,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "patients.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const SortHead = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <th className={cn("px-3 py-2 font-semibold", className)}>
      <button
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
      >
        {label}
        {sortKey === k &&
          (sortDir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          ))}
      </button>
    </th>
  );

  const chip =
    "flex h-8 items-center gap-1.5 rounded-lg bg-card px-2.5 text-sm font-medium text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow";

  return (
    <div className="mx-auto w-full max-w-6xl p-8">
      <Card>
        <CardHeader>
          <CardHeaderRow
            icon={Users}
            tone="brand"
            title="Patients"
            count={rows.length}
            rightSlot={
              <div className="flex items-center gap-1.5">
                <button onClick={exportCsv} className={chip} title="Export to CSV">
                  <Download className="size-3.5" /> Export
                </button>
                <Link href="/patients/new">
                  <Button>
                    <UserPlus /> New patient
                  </Button>
                </Link>
              </div>
            }
          />
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">No patients yet.</p>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <SortHead k="number" label="Number" />
                    <SortHead k="name" label="Name" />
                    <SortHead k="dob" label="Date of birth" />
                    <th className="px-3 py-2 font-semibold">Sex</th>
                    <th className="px-3 py-2 font-semibold">Mobile</th>
                    <th className="px-3 py-2 font-semibold">Email</th>
                    <SortHead k="registered" label="Registered" />
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {sorted.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/patients/${p.id}`)}
                      className="cursor-pointer transition-colors hover:bg-hover"
                    >
                      <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap text-muted-foreground">
                        {p.patient_number ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {p.has_active_alerts && (
                            <TriangleAlert
                              className="size-3.5 shrink-0 text-critical"
                              aria-label="Has active alerts"
                            />
                          )}
                          {p.last_name}, {p.first_name}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                        {fmtDob(p.date_of_birth)}{" "}
                        <span className="text-muted-foreground">
                          ({age(p.date_of_birth)}y)
                        </span>
                      </td>
                      <td className="px-3 py-2.5 capitalize">{p.sex_at_birth}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                        {p.phone_mobile ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {p.email ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                        {fmtDob(p.created_at)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                            STATUS_PILL[p.status] ?? "bg-slate-500/10 text-slate-600",
                          )}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
