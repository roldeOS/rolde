"use client";

import { useState, useCallback } from "react";
import {
  ChevronDown,
  MapPin,
  Phone,
  Mail,
  TriangleAlert,
  IdCard,
} from "lucide-react";
import { useClickAway } from "@/lib/useClickAway";
import { useTopbar } from "./TopbarContext";
import { cn } from "@/lib/utils";

function fmtDob(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * The patient identity in the breadcrumb (Roland 2026-06-10) — replaces the old
 * separate chip (no more duplication). The allergy flag shows AT REST (safety,
 * never hidden); clicking drops a wide glassy "dynamic island" with the full
 * patient record laid out beautifully — no modal, no navigation.
 */
export function PatientIsland() {
  const { patient } = useTopbar();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickAway<HTMLDivElement>(close);

  if (!patient) return null;
  const hasAllergy = patient.allergies.length > 0;

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-8 min-w-0 items-center gap-2 rounded-lg px-2 text-sm transition-colors",
          hasAllergy ? "hover:bg-critical/10" : "hover:bg-hover",
        )}
      >
        {/* The view's name in chrome — "Consult" (prose: the Consult Room;
            LOCKED Roland 2026-07-02) — sits just before the patient's name. */}
        <span className="hidden shrink-0 text-muted-foreground sm:inline">Consult ·</span>
        <span className="truncate font-medium">
          {patient.firstName} {patient.lastName}
        </span>
        {hasAllergy && (
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-critical">
            <TriangleAlert className="size-3.5" />
            <span className="hidden md:inline">
              {patient.allergies.map((a) => a.substance).join(" · ")}
            </span>
          </span>
        )}
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(680px,92vw)] overflow-hidden rounded-2xl bg-card shadow-overlay">
          {/* Identity */}
          <div className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-lg font-semibold tracking-tight">
                {patient.firstName} {patient.lastName}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {fmtDob(patient.dob)} · {patient.age}y ·{" "}
                <span className="capitalize">{patient.sex}</span>
              </p>
            </div>
            {patient.nhs && (
              <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-card/70 px-2.5 py-1 font-mono text-xs text-muted-foreground">
                <IdCard className="size-3.5" /> NHS {patient.nhs}
              </span>
            )}
          </div>

          {/* Allergy band — loud, never hidden */}
          {hasAllergy && (
            <div className="mx-4 mb-3 rounded-xl bg-critical/10 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-critical">
                <TriangleAlert className="size-3.5" /> Allergies
              </p>
              <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                {patient.allergies.map((a) => (
                  <li key={a.substance} className="text-sm text-critical/90">
                    <span className="font-medium">{a.substance}</span> — {a.reaction}{" "}
                    <span className="text-critical/70">
                      ({a.severity.replace(/_/g, " ")})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alerts */}
          {patient.alerts.length > 0 && (
            <div className="mx-4 mb-3 flex flex-wrap gap-1.5">
              {patient.alerts.map((al) => (
                <span
                  key={al.title}
                  className={cn(
                    "rounded-md px-2.5 py-0.5 text-xs font-medium",
                    al.priority === "critical"
                      ? "bg-critical/10 text-critical"
                      : al.priority === "warning"
                        ? "bg-warning/12 text-warning"
                        : "bg-info/10 text-info",
                  )}
                >
                  {al.title}
                </span>
              ))}
            </div>
          )}

          {/* Snapshot (Roland 2026-07-01) — PMH + current meds: counted, scrollable
              lists that hold 2 items or 20 equally well (allergies stay pinned
              above, always in full — safety). */}
          <div className="grid gap-3 border-t border-border/50 p-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 flex items-center justify-between text-xs font-medium tracking-wider text-muted-foreground uppercase">
                <span>Past Medical History</span>
                <span className="tabular-nums">{patient.problems.length}</span>
              </p>
              {patient.problems.length > 0 ? (
                <ul className="max-h-36 space-y-1 overflow-y-auto pr-1">
                  {patient.problems.map((p, i) => (
                    <li
                      key={i}
                      className={cn(
                        "rounded-md bg-muted/50 px-2 py-1 text-sm",
                        p.status === "resolved" && "text-muted-foreground",
                      )}
                    >
                      {p.title}
                      {p.status === "resolved" && (
                        <span className="ml-1 text-xs text-muted-foreground">· resolved</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">None recorded.</p>
              )}
            </div>
            <div>
              <p className="mb-1 flex items-center justify-between text-xs font-medium tracking-wider text-muted-foreground uppercase">
                <span>Current Medications</span>
                <span className="tabular-nums">{patient.medications.length}</span>
              </p>
              {patient.medications.length > 0 ? (
                <ul className="max-h-36 space-y-1 overflow-y-auto pr-1">
                  {patient.medications.map((m, i) => (
                    <li key={i} className="rounded-md bg-muted/50 px-2 py-1 text-sm">
                      <span className="font-medium">{m.drug}</span>
                      {m.dose && ` ${m.dose}`}
                      {m.frequency && (
                        <span className="text-muted-foreground"> · {m.frequency}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">None recorded.</p>
              )}
            </div>
          </div>

          {/* Contact + address */}
          <div className="grid gap-3 border-t border-border/50 p-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Address
              </p>
              <div className="flex items-start gap-1.5 text-sm">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div>
                  {patient.addressLines.length > 0 ? (
                    patient.addressLines.map((l, i) => <p key={i}>{l}</p>)
                  ) : (
                    <p className="text-muted-foreground">No address on file.</p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Contact
              </p>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-1.5">
                  <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                  {patient.phone ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                  {patient.email ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
