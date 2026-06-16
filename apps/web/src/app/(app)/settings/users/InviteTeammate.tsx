"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { UserPlus, X, Loader2, Pill } from "lucide-react";
import { ROLES } from "@/lib/roles";
import { licenseTypesFor, defaultLicenseType } from "@/lib/licenses";
import { cn } from "@/lib/utils";

/**
 * Invite a teammate (W1.1.7 chunk 2) — the Caretaker fills name + email + role +
 * the identity/licence/prescribing/access-window details, and RolDe emails a
 * single-use set-password link. POSTs to /api/clinic/users/invite; on success it
 * refreshes the roster. One step from invite to in.
 */
const ASSIGNABLE = ROLES.filter((r) => r.tier !== "platform" && r.tier !== "patient");
const PRESCRIBER = new Set(["caretaker", "clinician", "locum", "practitioner", "nurse"]);
const DESIGNATIONS = ["", "Dr", "Mr", "Mrs", "Ms", "Miss", "Nr"];

type WindowMode = "indefinite" | "until" | "period";

const INPUT =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10";
const LABEL = "mb-1 block text-xs font-medium text-muted-foreground";

export function InviteTeammate({ country }: { country: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const licenseTypes = useMemo(() => licenseTypesFor(country), [country]);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("clinician");
  const [designation, setDesignation] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [licenseType, setLicenseType] = useState(defaultLicenseType("clinician", country));
  const [licenseNumber, setLicenseNumber] = useState("");
  const [prescribing, setPrescribing] = useState(false);
  const [mode, setMode] = useState<WindowMode>("indefinite");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPrescribe = PRESCRIBER.has(role);

  function reset() {
    setDisplayName("");
    setEmail("");
    setRole("clinician");
    setDesignation("");
    setPreferredName("");
    setJobTitle("");
    setLicenseType(defaultLicenseType("clinician", country));
    setLicenseNumber("");
    setPrescribing(false);
    setMode("indefinite");
    setFromDate("");
    setToDate("");
    setError(null);
  }

  function onRoleChange(next: string) {
    setRole(next);
    // Re-suggest the licence type for the new role, and drop a now-impossible
    // prescribing flag.
    setLicenseType(defaultLicenseType(next, country));
    if (!PRESCRIBER.has(next)) setPrescribing(false);
  }

  function close() {
    if (busy) return;
    setOpen(false);
    reset();
  }

  function buildWindow(): { access_starts_at: string | null; access_ends_at: string | null } | null {
    if (mode === "indefinite") return { access_starts_at: null, access_ends_at: null };
    if (mode === "until") {
      if (!toDate) return null;
      return { access_starts_at: null, access_ends_at: new Date(`${toDate}T23:59:59`).toISOString() };
    }
    if (!fromDate || !toDate) return null;
    const start = new Date(`${fromDate}T00:00:00`).getTime();
    const end = new Date(`${toDate}T23:59:59`).getTime();
    if (end <= start) return null;
    return {
      access_starts_at: new Date(start).toISOString(),
      access_ends_at: new Date(end).toISOString(),
    };
  }

  async function submit() {
    setError(null);
    if (!displayName.trim()) return setError("Add their full name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError("Add a valid email.");
    const window = buildWindow();
    if (!window) return setError("Set the access dates.");

    setBusy(true);
    try {
      const res = await fetch("/api/clinic/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          display_name: displayName.trim(),
          role,
          designation,
          preferred_name: preferredName,
          job_title: jobTitle,
          license_type: licenseType,
          license_number: licenseNumber,
          prescribing_rights: prescribing,
          ...window,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(
          data.error === "already_member"
            ? "They're already in this clinic — edit them from the list."
            : "That didn't go through. Check the details and try again.",
        );
        setBusy(false);
        return;
      }
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90"
      >
        <UserPlus className="size-4" /> Invite Teammate
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-foreground/20 p-4 py-[8vh] backdrop-blur-sm"
            onClick={close}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-card shadow-overlay"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <h2 className="font-heading text-base font-semibold tracking-tight">
                  Invite a Teammate
                </h2>
                <button
                  onClick={close}
                  className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 px-5 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className={LABEL}>Full Name</label>
                    <input
                      className={INPUT}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Jordan Avery"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className={LABEL}>Email</label>
                    <input
                      className={INPUT}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan@example.com"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className={LABEL}>Role</label>
                    <select className={INPUT} value={role} onChange={(e) => onRoleChange(e.target.value)}>
                      {ASSIGNABLE.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className={LABEL}>Designation</label>
                    <select
                      className={INPUT}
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    >
                      {DESIGNATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d || "—"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className={LABEL}>Preferred Name</label>
                    <input
                      className={INPUT}
                      value={preferredName}
                      onChange={(e) => setPreferredName(e.target.value)}
                      placeholder="Shown on the clinical note"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className={LABEL}>Job Title</label>
                    <input
                      className={INPUT}
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Consultant Dermatologist"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className={LABEL}>Licence Type</label>
                    <select
                      className={INPUT}
                      value={licenseType}
                      onChange={(e) => setLicenseType(e.target.value)}
                    >
                      <option value="">— None —</option>
                      {licenseTypes.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className={LABEL}>Licence Number</label>
                    <input
                      className={INPUT}
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. 7654321"
                    />
                  </div>
                </div>

                {/* Prescribing */}
                <label
                  className={cn(
                    "flex items-center justify-between rounded-lg border border-border px-3 py-2.5",
                    !canPrescribe && "opacity-50",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Pill className="size-4 text-success" />
                    <span>
                      <span className="font-medium">Prescriber</span>
                      <span className="block text-xs text-muted-foreground">
                        {canPrescribe
                          ? "Let this person prescribe — even a doctor needs this ticked."
                          : "This role can't be a prescriber."}
                      </span>
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="size-4 accent-success"
                    disabled={!canPrescribe}
                    checked={prescribing}
                    onChange={(e) => setPrescribing(e.target.checked)}
                  />
                </label>

                {/* Access window */}
                <div>
                  <label className={LABEL}>Access</label>
                  <div className="flex gap-1.5">
                    {(
                      [
                        ["indefinite", "Indefinite"],
                        ["until", "Until a Date"],
                        ["period", "Set Period"],
                      ] as [WindowMode, string][]
                    ).map(([m, lbl]) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={cn(
                          "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                          mode === m
                            ? "border-foreground/30 bg-foreground/8 text-foreground"
                            : "border-border text-muted-foreground hover:bg-hover",
                        )}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                  {mode === "until" && (
                    <div className="mt-2">
                      <label className={LABEL}>Access Ends</label>
                      <input
                        type="date"
                        className={INPUT}
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </div>
                  )}
                  {mode === "period" && (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL}>From</label>
                        <input
                          type="date"
                          className={INPUT}
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={LABEL}>To</label>
                        <input
                          type="date"
                          className={INPUT}
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <p className="rounded-lg bg-critical/10 px-3 py-2 text-xs font-medium text-critical">
                    {error}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
                <button
                  onClick={close}
                  disabled={busy}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90 disabled:opacity-60"
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  {busy ? "Sending…" : "Send Invite"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
