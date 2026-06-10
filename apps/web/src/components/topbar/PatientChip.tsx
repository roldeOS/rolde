"use client";

import { useState, useCallback } from "react";
import { ChevronDown, MapPin, TriangleAlert } from "lucide-react";
import { useClickAway } from "@/lib/useClickAway";
import { useTopbar } from "./TopbarContext";
import { cn } from "@/lib/utils";

/**
 * The patient identity chip in the topbar (Roland 2026-06-10). Sits left of the
 * search. When the patient has allergies the chip tints RED through the glass —
 * the safety zone, never hidden (Bible 4.2 §3.2). Click → a "dynamic island"
 * drops the address inline (no modal, no navigation — Epic Storyboard style).
 */
export function PatientChip() {
  const { patient } = useTopbar();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickAway<HTMLDivElement>(close);

  if (!patient) return null;

  const hasAllergy = patient.allergies.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-8 items-center gap-2 rounded-lg border px-2.5 text-sm transition-colors",
          hasAllergy
            ? "border-critical/30 bg-critical/10 hover:bg-critical/15"
            : "border-border/60 bg-card/60 hover:bg-hover",
        )}
      >
        <span className="font-medium">
          {patient.firstName} {patient.lastName}
        </span>
        <span className={cn("text-xs", hasAllergy ? "text-critical/80" : "text-muted-foreground")}>
          {patient.age}y · <span className="capitalize">{patient.sex}</span>
        </span>
        {hasAllergy && (
          <span className="flex items-center gap-1 text-xs font-medium text-critical">
            <TriangleAlert className="size-3.5" />
            {patient.allergies.map((a) => a.substance).join(" · ")}
          </span>
        )}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-72 rounded-xl border border-border bg-card p-3 shadow-float">
          <p className="text-sm font-semibold">
            {patient.firstName} {patient.lastName}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {new Date(patient.dob).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}{" "}
            · {patient.age}y · <span className="capitalize">{patient.sex}</span>
            {patient.nhs && <> · NHS {patient.nhs}</>}
          </p>

          {hasAllergy && (
            <div className="mt-3 rounded-lg bg-critical/10 p-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-critical">
                <TriangleAlert className="size-3.5" /> Allergies
              </p>
              <ul className="mt-1 space-y-0.5">
                {patient.allergies.map((a) => (
                  <li key={a.substance} className="text-xs text-critical/90">
                    {a.substance} — {a.reaction} ({a.severity.replace(/_/g, " ")})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex items-start gap-1.5">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <div className="text-xs text-foreground">
              {patient.addressLines.length > 0 ? (
                patient.addressLines.map((l, i) => <p key={i}>{l}</p>)
              ) : (
                <p className="text-muted-foreground">No address on file.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
