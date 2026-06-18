"use client";

import { Pill } from "lucide-react";
import { ROLES } from "@/lib/roles";
import { licenseTypesFor, defaultLicenseType } from "@/lib/licenses";
import { PRESCRIBER_ROLES, type MemberForm, type WindowMode } from "@/lib/memberForm";
import { Field, Input, Select } from "@/components/ui/form";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";

/**
 * The shared field set behind Invite + Edit (W1.1.7 chunk 2) — one controlled
 * component so the two flows can never drift. `showEmail` adds the login field
 * (invite only); an edit never changes the login identity. All fields are RolDe's
 * themed components (Field / Input / Select / Switch) — never raw HTML controls.
 */
const ASSIGNABLE = ROLES.filter((r) => r.tier !== "platform" && r.tier !== "patient");
const DESIGNATIONS = ["", "Dr", "Mr", "Mrs", "Ms", "Miss", "Nr"];

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
          <Field label="Full Name" htmlFor="mf_name">
            <Input
              id="mf_name"
              value={form.displayName}
              onChange={(e) => onChange({ displayName: e.target.value })}
              placeholder="Jordan Avery"
            />
          </Field>
        </div>
        {showEmail && (
          <div className="col-span-2 sm:col-span-1">
            <Field label="Email" htmlFor="mf_email">
              <Input
                id="mf_email"
                type="email"
                value={form.email}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="jordan@example.com"
              />
            </Field>
          </div>
        )}
        <div className="col-span-2 sm:col-span-1">
          <Field label="Role" htmlFor="mf_role">
            <Select id="mf_role" value={form.role} onChange={(e) => onRoleChange(e.target.value)}>
              {ASSIGNABLE.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Designation" htmlFor="mf_designation">
            <Select
              id="mf_designation"
              value={form.designation}
              onChange={(e) => onChange({ designation: e.target.value })}
            >
              {DESIGNATIONS.map((d) => (
                <option key={d} value={d}>
                  {d || "—"}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Preferred Name" htmlFor="mf_preferred">
            <Input
              id="mf_preferred"
              value={form.preferredName}
              onChange={(e) => onChange({ preferredName: e.target.value })}
              placeholder="Shown on the clinical note"
            />
          </Field>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Job Title" htmlFor="mf_jobtitle">
            <Input
              id="mf_jobtitle"
              value={form.jobTitle}
              onChange={(e) => onChange({ jobTitle: e.target.value })}
              placeholder="e.g. Consultant Dermatologist"
            />
          </Field>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Licence Type" htmlFor="mf_licensetype">
            <Select
              id="mf_licensetype"
              value={form.licenseType}
              onChange={(e) => onChange({ licenseType: e.target.value })}
            >
              <option value="">— None —</option>
              {licenseTypes.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Licence Number" htmlFor="mf_licensenumber">
            <Input
              id="mf_licensenumber"
              value={form.licenseNumber}
              onChange={(e) => onChange({ licenseNumber: e.target.value })}
              placeholder="e.g. 7654321"
            />
          </Field>
        </div>
      </div>

      {/* Prescribing — themed switch, never a raw checkbox */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5",
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
        <Switch
          checked={form.prescribing}
          onChange={(next) => onChange({ prescribing: next })}
          disabled={!canPrescribe}
          label="Prescriber"
        />
      </div>

      {/* Access window */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Access</label>
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
            <Field label="Access Ends" htmlFor="mf_to">
              <Input
                id="mf_to"
                type="date"
                value={form.toDate}
                onChange={(e) => onChange({ toDate: e.target.value })}
              />
            </Field>
          </div>
        )}
        {form.windowMode === "period" && (
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Field label="From" htmlFor="mf_from">
              <Input
                id="mf_from"
                type="date"
                value={form.fromDate}
                onChange={(e) => onChange({ fromDate: e.target.value })}
              />
            </Field>
            <Field label="To" htmlFor="mf_to_period">
              <Input
                id="mf_to_period"
                type="date"
                value={form.toDate}
                onChange={(e) => onChange({ toDate: e.target.value })}
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
