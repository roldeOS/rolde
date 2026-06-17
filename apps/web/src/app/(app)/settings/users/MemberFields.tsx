"use client";

import { Pill } from "lucide-react";
import { ROLES } from "@/lib/roles";
import { licenseTypesFor, defaultLicenseType } from "@/lib/licenses";
import { PRESCRIBER_ROLES, type MemberForm, type WindowMode } from "@/lib/memberForm";
import { cn } from "@/lib/utils";

/**
 * The shared field set behind Invite + Edit (W1.1.7 chunk 2) — one controlled
 * component so the two flows can never drift. `showEmail` adds the login field
 * (invite only); an edit never changes the login identity.
 */
const ASSIGNABLE = ROLES.filter((r) => r.tier !== "platform" && r.tier !== "patient");
const DESIGNATIONS = ["", "Dr", "Mr", "Mrs", "Ms", "Miss", "Nr"];

export const FIELD_INPUT =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10";
export const FIELD_LABEL = "mb-1 block text-xs font-medium text-muted-foreground";

const MODES: [WindowMode, string][] = [
  ["indefinite", "Indefinite"],
  ["until", "Until a Date"],
  ["period", "Set Period"],
];

export function MemberFields({
  form,
  onChange,
  country,
  showEmail = false,
}: {
  form: MemberForm;
  onChange: (patch: Partial<MemberForm>) => void;
  country: string;
  showEmail?: boolean;
}) {
  const licenseTypes = licenseTypesFor(country);
  const canPrescribe = PRESCRIBER_ROLES.has(form.role);

  function onRoleChange(next: string) {
    const patch: Partial<MemberForm> = { role: next, licenseType: defaultLicenseType(next, country) };
    if (!PRESCRIBER_ROLES.has(next)) patch.prescribing = false;
    onChange(patch);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className={showEmail ? "col-span-2 sm:col-span-1" : "col-span-2"}>
          <label className={FIELD_LABEL}>Full Name</label>
          <input
            className={FIELD_INPUT}
            value={form.displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
            placeholder="Jordan Avery"
          />
        </div>
        {showEmail && (
          <div className="col-span-2 sm:col-span-1">
            <label className={FIELD_LABEL}>Email</label>
            <input
              className={FIELD_INPUT}
              type="email"
              value={form.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="jordan@example.com"
            />
          </div>
        )}
        <div className="col-span-2 sm:col-span-1">
          <label className={FIELD_LABEL}>Role</label>
          <select className={FIELD_INPUT} value={form.role} onChange={(e) => onRoleChange(e.target.value)}>
            {ASSIGNABLE.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={FIELD_LABEL}>Designation</label>
          <select
            className={FIELD_INPUT}
            value={form.designation}
            onChange={(e) => onChange({ designation: e.target.value })}
          >
            {DESIGNATIONS.map((d) => (
              <option key={d} value={d}>
                {d || "—"}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={FIELD_LABEL}>Preferred Name</label>
          <input
            className={FIELD_INPUT}
            value={form.preferredName}
            onChange={(e) => onChange({ preferredName: e.target.value })}
            placeholder="Shown on the clinical note"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={FIELD_LABEL}>Job Title</label>
          <input
            className={FIELD_INPUT}
            value={form.jobTitle}
            onChange={(e) => onChange({ jobTitle: e.target.value })}
            placeholder="e.g. Consultant Dermatologist"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={FIELD_LABEL}>Licence Type</label>
          <select
            className={FIELD_INPUT}
            value={form.licenseType}
            onChange={(e) => onChange({ licenseType: e.target.value })}
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
          <label className={FIELD_LABEL}>Licence Number</label>
          <input
            className={FIELD_INPUT}
            value={form.licenseNumber}
            onChange={(e) => onChange({ licenseNumber: e.target.value })}
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
          checked={form.prescribing}
          onChange={(e) => onChange({ prescribing: e.target.checked })}
        />
      </label>

      {/* Access window */}
      <div>
        <label className={FIELD_LABEL}>Access</label>
        <div className="flex gap-1.5">
          {MODES.map(([m, lbl]) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ windowMode: m })}
              className={cn(
                "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                form.windowMode === m
                  ? "border-foreground/30 bg-foreground/8 text-foreground"
                  : "border-border text-muted-foreground hover:bg-hover",
              )}
            >
              {lbl}
            </button>
          ))}
        </div>
        {form.windowMode === "until" && (
          <div className="mt-2">
            <label className={FIELD_LABEL}>Access Ends</label>
            <input
              type="date"
              className={FIELD_INPUT}
              value={form.toDate}
              onChange={(e) => onChange({ toDate: e.target.value })}
            />
          </div>
        )}
        {form.windowMode === "period" && (
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label className={FIELD_LABEL}>From</label>
              <input
                type="date"
                className={FIELD_INPUT}
                value={form.fromDate}
                onChange={(e) => onChange({ fromDate: e.target.value })}
              />
            </div>
            <div>
              <label className={FIELD_LABEL}>To</label>
              <input
                type="date"
                className={FIELD_INPUT}
                value={form.toDate}
                onChange={(e) => onChange({ toDate: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
