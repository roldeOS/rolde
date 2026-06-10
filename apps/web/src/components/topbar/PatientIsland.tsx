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
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(680px,92vw)] overflow-hidden rounded-2xl bg-card shadow-float">
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
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
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
