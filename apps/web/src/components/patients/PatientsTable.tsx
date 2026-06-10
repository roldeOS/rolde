"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  Download,
  ArrowUp,
  ArrowDown,
  TriangleAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardHeaderRow } from "@/components/ui/CardHeaderRow";
import { Button } from "@/components/ui/button";
import { fieldInput } from "@/components/ui/form";
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
  has_active_alerts: boolean;
};

type SortKey = "number" | "name" | "dob";

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

/** A floating, sortable, searchable data-table — the mindate TableShell pattern
 * (Roland 2026-06-11), brought to RolDe for the patients register. */
export function PatientsTable({ rows }: { rows: PatientRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = rows.filter((r) =>
      !term
        ? true
        : `${r.first_name} ${r.last_name} ${r.patient_number ?? ""}`
            .toLowerCase()
            .includes(term),
    );
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")
        cmp = `${a.last_name} ${a.first_name}`.localeCompare(
          `${b.last_name} ${b.first_name}`,
        );
      else if (sortKey === "number")
        cmp = (a.patient_number ?? "").localeCompare(b.patient_number ?? "");
      else cmp = a.date_of_birth.localeCompare(b.date_of_birth);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, q, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  function exportCsv() {
    const head = ["Number", "Last name", "First name", "DOB", "Sex", "Mobile", "Email"];
    const lines = filtered.map((r) =>
      [
        r.patient_number ?? "",
        r.last_name,
        r.first_name,
        r.date_of_birth,
        r.sex_at_birth,
        r.phone_mobile ?? "",
        r.email ?? "",
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
    <div className="mx-auto w-full max-w-4xl p-8">
      <Card>
        <CardHeader>
          <CardHeaderRow
            icon={Users}
            tone="brand"
            title="Patients"
            count={rows.length}
            rightSlot={
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search…"
                    className={cn(fieldInput, "h-8 w-40 pl-8")}
                  />
                </div>
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
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">
              {q ? "No patients match your search." : "No patients yet."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <SortHead k="number" label="Number" />
                  <SortHead k="name" label="Name" />
                  <SortHead k="dob" label="Date of birth" />
                  <th className="px-3 py-2 font-semibold">Sex</th>
                  <th className="px-3 py-2 font-semibold">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/patients/${p.id}`)}
                    className="cursor-pointer transition-colors hover:bg-hover"
                  >
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                      {p.patient_number ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      <span className="flex items-center gap-1.5">
                        {p.has_active_alerts && (
                          <TriangleAlert className="size-3.5 shrink-0 text-critical" />
                        )}
                        {p.last_name}, {p.first_name}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {fmtDob(p.date_of_birth)}{" "}
                      <span className="text-muted-foreground">
                        ({age(p.date_of_birth)}y)
                      </span>
                    </td>
                    <td className="px-3 py-2.5 capitalize">{p.sex_at_birth}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {p.phone_mobile ?? p.email ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
