"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  User,
  Users,
  Stethoscope,
  TriangleAlert,
  ClipboardList,
  Pill,
  Plus,
} from "lucide-react";
import { DialogHeaderRow } from "@/components/ui/DialogHeaderRow";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { CardIcon } from "@/components/ui/CardIcon";
import {
  useTopbar,
  type PatientContact,
  type PatientCareProvider,
} from "./TopbarContext";
import {
  type ActionResult,
  updatePatientDetails,
  addAllergy,
  updateAllergy,
  deactivateAllergy,
  addProblem,
  updateProblem,
  setProblemStatus,
  addMedication,
  updateMedication,
  stopMedication,
  saveContact,
  removeContact,
  saveCareProvider,
  removeCareProvider,
} from "@/app/(app)/patients/profileActions";
import { cn } from "@/lib/utils";

/**
 * The Profile overlay (W1.2, greenlit Roland 2026-07-02) — the patient's FULL
 * structured record, opened from the topbar island so the doctor NEVER leaves
 * the Consult Room ("keep the doctor grounded in one page"). A right-hand sheet
 * (tablet-first — full-screen on mobile), four sections on a Segmented:
 * Details (demographics, audited field-by-field) · Next of Kin · Care Team
 * (the GP & other doctors — RolDe Courier's address hooks) · Clinical Record
 * (the allergy/PMH/medication editors behind Snapshot's "+ Add").
 * Every save runs a server action: tenant from the session, RLS re-checked,
 * Activity-Logged; clinically significant changes also land in the feed.
 */
export type ProfileSection = "details" | "contacts" | "care-team" | "record";

const SECTIONS: { value: ProfileSection; label: string }[] = [
  { value: "details", label: "Details" },
  { value: "contacts", label: "Next Of Kin" },
  { value: "care-team", label: "Care Team" },
  { value: "record", label: "Clinical Record" },
];

export function PatientProfileOverlay({
  open,
  section,
  onSectionChange,
  onClose,
}: {
  open: boolean;
  section: ProfileSection;
  onSectionChange: (s: ProfileSection) => void;
  onClose: () => void;
}) {
  const { patient } = useTopbar();

  useEffect(() => {
    if (!open) return;
    // An inner layer (an open Select, the ⌘K palette) consumes its own Escape
    // via preventDefault — only an UNCLAIMED Escape closes the sheet, so a
    // half-typed allergy never dies to a keypress meant for a dropdown.
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && !e.defaultPrevented && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !patient) return null;

  // PORTALED to <body>: the island lives inside the topbar's .glass bar, whose
  // backdrop-filter makes it the containing block for fixed descendants — the
  // sheet would render trapped inside the bar without the portal.
  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-foreground/25" onClick={onClose} />
      {/* The sheet — full-screen on mobile, a right panel from sm up. */}
      <div className="absolute inset-y-0 right-0 flex w-full flex-col bg-background shadow-overlay sm:w-[min(720px,94vw)]">
        <div className="shrink-0 px-5 pt-5">
          <DialogHeaderRow
            icon={User}
            tone="brand"
            title="Patient Profile"
            subtitle={`${patient.firstName} ${patient.lastName} · ${patient.age}y`}
            onClose={onClose}
          />
          <Segmented
            options={SECTIONS}
            value={section}
            onChange={onSectionChange}
            className="mt-3"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {section === "details" && <DetailsForm />}
          {section === "contacts" && <ContactsSection />}
          {section === "care-team" && <CareTeamSection />}
          {section === "record" && <RecordSection />}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Shared little pieces ─────────────────────────────────────────────────────

/** Run a server action from a small form: pending + plain-English error.
 *  Expected failures come back as { ok: false, error } RETURN VALUES — Next
 *  masks thrown server-action messages in production, so throws are only the
 *  truly unexpected (network death etc.) and get the generic line. */
function useAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (
    action: (fd: FormData) => Promise<ActionResult>,
    fd: FormData,
    done?: () => void,
  ) => {
    setError(null);
    setPending(true);
    try {
      const res = await action(fd);
      if (res.ok) done?.();
      else setError(res.error);
    } catch {
      setError("That didn’t save — try again.");
    } finally {
      setPending(false);
    }
  };
  return { pending, error, run };
}

function ErrorLine({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="rounded-lg bg-critical/10 px-3 py-2 text-xs font-medium text-critical">
      {error}
    </p>
  );
}

function GroupHeader({
  icon,
  tone,
  title,
  count,
  onAdd,
  addLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "critical" | "peach" | "warning" | "info" | "brand";
  title: string;
  count: number;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <CardIcon icon={icon} tone={tone} variant="badge" size="sm" />
        {title}
        <span className="text-xs font-normal text-muted-foreground tabular-nums">{count}</span>
      </p>
      <Button variant="ghost" size="sm" onClick={onAdd}>
        <Plus className="size-3.5" /> {addLabel}
      </Button>
    </div>
  );
}

/** Two-step remove — the first click arms it, the second confirms. */
function RemoveButton({ onConfirm, pending }: { onConfirm: () => void; pending: boolean }) {
  const [armed, setArmed] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      onBlur={() => setArmed(false)}
      className={cn(armed && "text-critical")}
    >
      {armed ? "Confirm Remove" : "Remove"}
    </Button>
  );
}

// ── Details (demographics + contact + address — audited field-by-field) ──────

function DetailsForm() {
  const { patient } = useTopbar();
  const { pending, error, run } = useAction();
  const [saved, setSaved] = useState(false);
  const [v, setV] = useState(() => ({
    first_name: patient?.firstName ?? "",
    last_name: patient?.lastName ?? "",
    date_of_birth: patient?.dob ?? "",
    sex_at_birth: patient?.sex ?? "",
    nhs_number: patient?.nhs ?? "",
    phone_mobile: patient?.phone ?? "",
    email: patient?.email ?? "",
    address_line1: patient?.address.line1 ?? "",
    address_line2: patient?.address.line2 ?? "",
    city: patient?.address.city ?? "",
    postcode: patient?.address.postcode ?? "",
  }));
  if (!patient) return null;

  const set = (k: keyof typeof v) => (val: string) => {
    setSaved(false);
    setV((s) => ({ ...s, [k]: val }));
  };
  const submit = () => {
    const fd = new FormData();
    fd.set("patient_id", patient.id);
    for (const [k, val] of Object.entries(v)) fd.set(k, val);
    void run(updatePatientDetails, fd, () => setSaved(true));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Identity edits are recorded field-by-field in the Activity Log.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First Name" htmlFor="pf-first" required>
          <Input id="pf-first" value={v.first_name} onChange={(e) => set("first_name")(e.target.value)} />
        </Field>
        <Field label="Last Name" htmlFor="pf-last" required>
          <Input id="pf-last" value={v.last_name} onChange={(e) => set("last_name")(e.target.value)} />
        </Field>
        <Field label="Date Of Birth" htmlFor="pf-dob" required>
          <Input id="pf-dob" type="date" value={v.date_of_birth} onChange={(e) => set("date_of_birth")(e.target.value)} />
        </Field>
        <Field label="Sex At Birth" htmlFor="pf-sex" required>
          <Select id="pf-sex" value={v.sex_at_birth} onChange={set("sex_at_birth")}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="intersex">Intersex</option>
            <option value="unknown">Unknown</option>
          </Select>
        </Field>
        <Field label="NHS Number" htmlFor="pf-nhs">
          <Input id="pf-nhs" value={v.nhs_number} onChange={(e) => set("nhs_number")(e.target.value)} />
        </Field>
        <Field label="Mobile Phone" htmlFor="pf-phone" required>
          <Input id="pf-phone" value={v.phone_mobile} onChange={(e) => set("phone_mobile")(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="pf-email" required>
          <Input id="pf-email" type="email" value={v.email} onChange={(e) => set("email")(e.target.value)} />
        </Field>
        <Field label="Address Line 1" htmlFor="pf-a1">
          <Input id="pf-a1" value={v.address_line1} onChange={(e) => set("address_line1")(e.target.value)} />
        </Field>
        <Field label="Address Line 2" htmlFor="pf-a2">
          <Input id="pf-a2" value={v.address_line2} onChange={(e) => set("address_line2")(e.target.value)} />
        </Field>
        <Field label="City / Town" htmlFor="pf-city">
          <Input id="pf-city" value={v.city} onChange={(e) => set("city")(e.target.value)} />
        </Field>
        <Field label="Postcode" htmlFor="pf-post">
          <Input id="pf-post" value={v.postcode} onChange={(e) => set("postcode")(e.target.value)} />
        </Field>
      </div>
      <ErrorLine error={error} />
      <div className="flex items-center justify-end gap-2">
        {saved && <span className="text-xs text-success">Saved ✓</span>}
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : "Save Details"}
        </Button>
      </div>
    </div>
  );
}

// ── Next of kin & personal contacts ──────────────────────────────────────────

const CONTACT_ROLES = [
  { value: "next_of_kin", label: "Next Of Kin" },
  { value: "emergency_contact", label: "Emergency Contact" },
  { value: "carer", label: "Carer" },
  { value: "other", label: "Other" },
];
const contactRoleLabel = (v: string) =>
  CONTACT_ROLES.find((r) => r.value === v)?.label ?? "Contact";

function ContactForm({
  patientId,
  existing,
  onDone,
}: {
  patientId: string;
  existing?: PatientContact;
  onDone: () => void;
}) {
  const { pending, error, run } = useAction();
  const [v, setV] = useState({
    name: existing?.name ?? "",
    relationship: existing?.relationship ?? "",
    role: existing?.role ?? "next_of_kin",
    phone: existing?.phone ?? "",
    email: existing?.email ?? "",
    notes: existing?.notes ?? "",
  });
  const submit = () => {
    const fd = new FormData();
    fd.set("patient_id", patientId);
    if (existing) fd.set("id", existing.id);
    for (const [k, val] of Object.entries(v)) fd.set(k, val);
    void run(saveContact, fd, onDone);
  };
  return (
    <div className="space-y-3 rounded-xl bg-muted/40 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" htmlFor="ct-name" required>
          <Input id="ct-name" value={v.name} onChange={(e) => setV((s) => ({ ...s, name: e.target.value }))} />
        </Field>
        <Field label="Relationship" htmlFor="ct-rel" required hint="Spouse, daughter, friend…">
          <Input id="ct-rel" value={v.relationship} onChange={(e) => setV((s) => ({ ...s, relationship: e.target.value }))} />
        </Field>
        <Field label="Type" htmlFor="ct-role">
          <Select id="ct-role" value={v.role} onChange={(val) => setV((s) => ({ ...s, role: val }))}>
            {CONTACT_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Phone" htmlFor="ct-phone">
          <Input id="ct-phone" value={v.phone} onChange={(e) => setV((s) => ({ ...s, phone: e.target.value }))} />
        </Field>
        <Field label="Email" htmlFor="ct-email">
          <Input id="ct-email" type="email" value={v.email} onChange={(e) => setV((s) => ({ ...s, email: e.target.value }))} />
        </Field>
        <Field label="Notes" htmlFor="ct-notes">
          <Input id="ct-notes" value={v.notes} onChange={(e) => setV((s) => ({ ...s, notes: e.target.value }))} />
        </Field>
      </div>
      <ErrorLine error={error} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : existing ? "Save Contact" : "Add Contact"}
        </Button>
      </div>
    </div>
  );
}

function ContactsSection() {
  const { patient } = useTopbar();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const removeAction = useAction();
  if (!patient) return null;

  return (
    <div className="space-y-3">
      <GroupHeader
        icon={Users}
        tone="brand"
        title="Next Of Kin & Contacts"
        count={patient.contacts.length}
        onAdd={() => {
          setAdding(true);
          setEditingId(null);
        }}
        addLabel="Add Contact"
      />
      {adding && (
        <ContactForm patientId={patient.id} onDone={() => setAdding(false)} />
      )}
      {patient.contacts.length === 0 && !adding && (
        <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
          No contacts recorded yet — add the next of kin first.
        </p>
      )}
      <ul className="space-y-2">
        {patient.contacts.map((c) =>
          editingId === c.id ? (
            <li key={c.id}>
              <ContactForm
                patientId={patient.id}
                existing={c}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card p-3 shadow-float"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {c.name}
                  <span className="ml-2 rounded-md bg-foreground/6 px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                    {contactRoleLabel(c.role)}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[c.relationship, c.phone, c.email].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingId(c.id);
                    setAdding(false);
                  }}
                >
                  Edit
                </Button>
                <RemoveButton
                  pending={removeAction.pending}
                  onConfirm={() => {
                    const fd = new FormData();
                    fd.set("id", c.id);
                    fd.set("patient_id", patient.id);
                    void removeAction.run(removeContact, fd);
                  }}
                />
              </div>
            </li>
          ),
        )}
      </ul>
      <ErrorLine error={removeAction.error} />
    </div>
  );
}

// ── The care team (GP & other doctors — Courier address hooks) ───────────────

function CareProviderForm({
  patientId,
  existing,
  onDone,
}: {
  patientId: string;
  existing?: PatientCareProvider;
  onDone: () => void;
}) {
  const { pending, error, run } = useAction();
  const [v, setV] = useState({
    name: existing?.name ?? "",
    role: existing?.role ?? "",
    organisation: existing?.organisation ?? "",
    phone: existing?.phone ?? "",
    email: existing?.email ?? "",
    address_line1: existing?.addressLine1 ?? "",
    address_line2: existing?.addressLine2 ?? "",
    city: existing?.city ?? "",
    postcode: existing?.postcode ?? "",
    notes: existing?.notes ?? "",
  });
  const [isGp, setIsGp] = useState(existing?.isGp ?? false);
  const submit = () => {
    const fd = new FormData();
    fd.set("patient_id", patientId);
    if (existing) fd.set("id", existing.id);
    fd.set("is_gp", String(isGp));
    for (const [k, val] of Object.entries(v)) fd.set(k, val);
    void run(saveCareProvider, fd, onDone);
  };
  return (
    <div className="space-y-3 rounded-xl bg-muted/40 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" htmlFor="cp-name" required hint="Dr Priya Patel">
          <Input id="cp-name" value={v.name} onChange={(e) => setV((s) => ({ ...s, name: e.target.value }))} />
        </Field>
        <Field label="Role" htmlFor="cp-role" hint="GP, consultant dermatologist…">
          <Input id="cp-role" value={v.role} onChange={(e) => setV((s) => ({ ...s, role: e.target.value }))} />
        </Field>
        <Field label="Practice / Organisation" htmlFor="cp-org">
          <Input id="cp-org" value={v.organisation} onChange={(e) => setV((s) => ({ ...s, organisation: e.target.value }))} />
        </Field>
        <Field label="Phone" htmlFor="cp-phone">
          <Input id="cp-phone" value={v.phone} onChange={(e) => setV((s) => ({ ...s, phone: e.target.value }))} />
        </Field>
        <Field label="Email" htmlFor="cp-email">
          <Input id="cp-email" type="email" value={v.email} onChange={(e) => setV((s) => ({ ...s, email: e.target.value }))} />
        </Field>
        <Field label="Address Line 1" htmlFor="cp-a1">
          <Input id="cp-a1" value={v.address_line1} onChange={(e) => setV((s) => ({ ...s, address_line1: e.target.value }))} />
        </Field>
        <Field label="Address Line 2" htmlFor="cp-a2">
          <Input id="cp-a2" value={v.address_line2} onChange={(e) => setV((s) => ({ ...s, address_line2: e.target.value }))} />
        </Field>
        <Field label="City / Town" htmlFor="cp-city">
          <Input id="cp-city" value={v.city} onChange={(e) => setV((s) => ({ ...s, city: e.target.value }))} />
        </Field>
        <Field label="Postcode" htmlFor="cp-post">
          <Input id="cp-post" value={v.postcode} onChange={(e) => setV((s) => ({ ...s, postcode: e.target.value }))} />
        </Field>
        <Field label="Notes" htmlFor="cp-notes">
          <Input id="cp-notes" value={v.notes} onChange={(e) => setV((s) => ({ ...s, notes: e.target.value }))} />
        </Field>
      </div>
      <label className="flex items-center justify-between rounded-lg bg-card px-3 py-2 text-sm shadow-sm">
        <span>
          The Patient&apos;s Registered GP
          <span className="block text-xs font-normal text-muted-foreground">
            Letters to “the GP” go here — one per patient.
          </span>
        </span>
        <Switch checked={isGp} onChange={setIsGp} label="The Patient's Registered GP" />
      </label>
      <ErrorLine error={error} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : existing ? "Save Doctor" : "Add Doctor"}
        </Button>
      </div>
    </div>
  );
}

function CareTeamSection() {
  const { patient } = useTopbar();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const removeAction = useAction();
  if (!patient) return null;

  return (
    <div className="space-y-3">
      <GroupHeader
        icon={Stethoscope}
        tone="info"
        title="GP & Other Doctors"
        count={patient.careTeam.length}
        onAdd={() => {
          setAdding(true);
          setEditingId(null);
        }}
        addLabel="Add Doctor"
      />
      <p className="text-xs text-muted-foreground">
        RolDe Courier sends letters to these addresses — the registered GP is the
        default for “send to GP”.
      </p>
      {adding && (
        <CareProviderForm patientId={patient.id} onDone={() => setAdding(false)} />
      )}
      {patient.careTeam.length === 0 && !adding && (
        <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
          No doctors recorded yet — add the patient&apos;s GP first.
        </p>
      )}
      <ul className="space-y-2">
        {patient.careTeam.map((d) =>
          editingId === d.id ? (
            <li key={d.id}>
              <CareProviderForm
                patientId={patient.id}
                existing={d}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card p-3 shadow-float"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {d.name}
                  {d.isGp && (
                    <span className="ml-2 rounded-md bg-info/10 px-1.5 py-0.5 text-xs font-semibold text-info">
                      GP
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[d.role, d.organisation, d.postcode].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingId(d.id);
                    setAdding(false);
                  }}
                >
                  Edit
                </Button>
                <RemoveButton
                  pending={removeAction.pending}
                  onConfirm={() => {
                    const fd = new FormData();
                    fd.set("id", d.id);
                    fd.set("patient_id", patient.id);
                    void removeAction.run(removeCareProvider, fd);
                  }}
                />
              </div>
            </li>
          ),
        )}
      </ul>
      <ErrorLine error={removeAction.error} />
    </div>
  );
}

// ── The clinical record editors (allergies · PMH · medications) ──────────────

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
  { value: "life_threatening", label: "Life-Threatening" },
];

function AllergyForm({
  patientId,
  existing,
  onDone,
}: {
  patientId: string;
  existing?: { id: string; substance: string; reaction: string; severity: string; notes: string | null };
  onDone: () => void;
}) {
  const { pending, error, run } = useAction();
  const [v, setV] = useState({
    substance: existing?.substance ?? "",
    reaction: existing?.reaction ?? "",
    severity: existing?.severity ?? "moderate",
    notes: existing?.notes ?? "",
  });
  const submit = () => {
    const fd = new FormData();
    fd.set("patient_id", patientId);
    if (existing) fd.set("id", existing.id);
    for (const [k, val] of Object.entries(v)) fd.set(k, val);
    void run(existing ? updateAllergy : addAllergy, fd, onDone);
  };
  return (
    <div className="space-y-3 rounded-xl bg-critical/5 p-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Substance" htmlFor="al-sub" required>
          <Input id="al-sub" value={v.substance} onChange={(e) => setV((s) => ({ ...s, substance: e.target.value }))} />
        </Field>
        <Field label="Reaction" htmlFor="al-re" required>
          <Input id="al-re" value={v.reaction} onChange={(e) => setV((s) => ({ ...s, reaction: e.target.value }))} />
        </Field>
        <Field label="Severity" htmlFor="al-sev" required>
          <Select id="al-sev" value={v.severity} onChange={(val) => setV((s) => ({ ...s, severity: val }))}>
            {SEVERITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Notes" htmlFor="al-notes">
        <Input id="al-notes" value={v.notes} onChange={(e) => setV((s) => ({ ...s, notes: e.target.value }))} />
      </Field>
      <ErrorLine error={error} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : existing ? "Save Allergy" : "Add Allergy"}
        </Button>
      </div>
    </div>
  );
}

function ProblemForm({
  patientId,
  existing,
  onDone,
}: {
  patientId: string;
  existing?: { id: string; title: string; onsetDate: string | null; notes: string | null };
  onDone: () => void;
}) {
  const { pending, error, run } = useAction();
  const [v, setV] = useState({
    title: existing?.title ?? "",
    onset_date: existing?.onsetDate ?? "",
    notes: existing?.notes ?? "",
  });
  const submit = () => {
    const fd = new FormData();
    fd.set("patient_id", patientId);
    if (existing) fd.set("id", existing.id);
    for (const [k, val] of Object.entries(v)) fd.set(k, val);
    void run(existing ? updateProblem : addProblem, fd, onDone);
  };
  return (
    <div className="space-y-3 rounded-xl bg-muted/40 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Problem" htmlFor="pb-title" required hint="Hypertension, appendicectomy 1974…">
          <Input id="pb-title" value={v.title} onChange={(e) => setV((s) => ({ ...s, title: e.target.value }))} />
        </Field>
        <Field label="Onset Date" htmlFor="pb-onset">
          <Input id="pb-onset" type="date" value={v.onset_date} onChange={(e) => setV((s) => ({ ...s, onset_date: e.target.value }))} />
        </Field>
      </div>
      <Field label="Notes" htmlFor="pb-notes">
        <Input id="pb-notes" value={v.notes} onChange={(e) => setV((s) => ({ ...s, notes: e.target.value }))} />
      </Field>
      <ErrorLine error={error} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : existing ? "Save Problem" : "Add Problem"}
        </Button>
      </div>
    </div>
  );
}

function MedicationForm({
  patientId,
  existing,
  onDone,
}: {
  patientId: string;
  existing?: {
    id: string;
    drug: string;
    dose: string | null;
    frequency: string | null;
    route: string | null;
    notes: string | null;
  };
  onDone: () => void;
}) {
  const { pending, error, run } = useAction();
  const [v, setV] = useState({
    drug: existing?.drug ?? "",
    dose: existing?.dose ?? "",
    frequency: existing?.frequency ?? "",
    route: existing?.route ?? "",
    notes: existing?.notes ?? "",
  });
  const submit = () => {
    const fd = new FormData();
    fd.set("patient_id", patientId);
    if (existing) fd.set("id", existing.id);
    for (const [k, val] of Object.entries(v)) fd.set(k, val);
    void run(existing ? updateMedication : addMedication, fd, onDone);
  };
  return (
    <div className="space-y-3 rounded-xl bg-muted/40 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Drug" htmlFor="md-drug" required hint="Amlodipine">
          <Input id="md-drug" value={v.drug} onChange={(e) => setV((s) => ({ ...s, drug: e.target.value }))} />
        </Field>
        <Field label="Dose" htmlFor="md-dose" hint="5 mg">
          <Input id="md-dose" value={v.dose} onChange={(e) => setV((s) => ({ ...s, dose: e.target.value }))} />
        </Field>
        <Field label="Frequency" htmlFor="md-freq" hint="Once daily">
          <Input id="md-freq" value={v.frequency} onChange={(e) => setV((s) => ({ ...s, frequency: e.target.value }))} />
        </Field>
        <Field label="Route" htmlFor="md-route" hint="Oral">
          <Input id="md-route" value={v.route} onChange={(e) => setV((s) => ({ ...s, route: e.target.value }))} />
        </Field>
      </div>
      <Field label="Notes" htmlFor="md-notes">
        <Input id="md-notes" value={v.notes} onChange={(e) => setV((s) => ({ ...s, notes: e.target.value }))} />
      </Field>
      <ErrorLine error={error} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : existing ? "Save Medication" : "Add Medication"}
        </Button>
      </div>
    </div>
  );
}

function RecordSection() {
  const { patient } = useTopbar();
  const [addingAllergy, setAddingAllergy] = useState(false);
  const [editAllergyId, setEditAllergyId] = useState<string | null>(null);
  const [addingProblem, setAddingProblem] = useState(false);
  const [editProblemId, setEditProblemId] = useState<string | null>(null);
  const [addingMed, setAddingMed] = useState(false);
  const [editMedId, setEditMedId] = useState<string | null>(null);
  const rowAction = useAction();
  if (!patient) return null;

  const rowFd = (id: string, extra?: Record<string, string>) => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("patient_id", patient.id);
    for (const [k, val] of Object.entries(extra ?? {})) fd.set(k, val);
    return fd;
  };

  return (
    <div className="space-y-6">
      {/* Allergies — safety-critical: changes are feed-noted, never deleted. */}
      <section className="space-y-2">
        <GroupHeader
          icon={TriangleAlert}
          tone="critical"
          title="Allergies"
          count={patient.allergies.length}
          onAdd={() => {
            setAddingAllergy(true);
            setEditAllergyId(null);
          }}
          addLabel="Add Allergy"
        />
        {addingAllergy && (
          <AllergyForm patientId={patient.id} onDone={() => setAddingAllergy(false)} />
        )}
        {patient.allergies.length === 0 && !addingAllergy && (
          <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
            No known allergies recorded.
          </p>
        )}
        <ul className="space-y-2">
          {patient.allergies.map((a) =>
            editAllergyId === a.id ? (
              <li key={a.id}>
                <AllergyForm
                  patientId={patient.id}
                  existing={a}
                  onDone={() => setEditAllergyId(null)}
                />
              </li>
            ) : (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-critical/5 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-critical">
                    {a.substance}
                    <span className="ml-2 text-xs font-normal text-critical/80">
                      {a.severity.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.reaction}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditAllergyId(a.id);
                      setAddingAllergy(false);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={rowAction.pending}
                    onClick={() => void rowAction.run(deactivateAllergy, rowFd(a.id))}
                    title="Marks it inactive and notes it in the record — never deleted"
                  >
                    Mark Inactive
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      </section>

      {/* Past Medical History */}
      <section className="space-y-2">
        <GroupHeader
          icon={ClipboardList}
          tone="peach"
          title="Past Medical History"
          count={patient.problems.length}
          onAdd={() => {
            setAddingProblem(true);
            setEditProblemId(null);
          }}
          addLabel="Add Problem"
        />
        {addingProblem && (
          <ProblemForm patientId={patient.id} onDone={() => setAddingProblem(false)} />
        )}
        {patient.problems.length === 0 && !addingProblem && (
          <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
            Nothing recorded yet.
          </p>
        )}
        <ul className="space-y-2">
          {patient.problems.map((p) =>
            editProblemId === p.id ? (
              <li key={p.id}>
                <ProblemForm
                  patientId={patient.id}
                  existing={p}
                  onDone={() => setEditProblemId(null)}
                />
              </li>
            ) : (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card p-3 shadow-float"
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      p.status === "resolved" && "text-muted-foreground",
                    )}
                  >
                    {p.title}
                    {p.status === "resolved" && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        · resolved
                      </span>
                    )}
                  </p>
                  {p.onsetDate && (
                    <p className="mt-0.5 text-xs text-muted-foreground">Since {p.onsetDate}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditProblemId(p.id);
                      setAddingProblem(false);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={rowAction.pending}
                    onClick={() =>
                      void rowAction.run(
                        setProblemStatus,
                        rowFd(p.id, {
                          status: p.status === "resolved" ? "active" : "resolved",
                        }),
                      )
                    }
                  >
                    {p.status === "resolved" ? "Reactivate" : "Resolve"}
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      </section>

      {/* Current medications */}
      <section className="space-y-2">
        <GroupHeader
          icon={Pill}
          tone="warning"
          title="Current Medications"
          count={patient.medications.length}
          onAdd={() => {
            setAddingMed(true);
            setEditMedId(null);
          }}
          addLabel="Add Medication"
        />
        {addingMed && (
          <MedicationForm patientId={patient.id} onDone={() => setAddingMed(false)} />
        )}
        {patient.medications.length === 0 && !addingMed && (
          <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
            No current medications recorded.
          </p>
        )}
        <ul className="space-y-2">
          {patient.medications.map((m) =>
            editMedId === m.id ? (
              <li key={m.id}>
                <MedicationForm
                  patientId={patient.id}
                  existing={m}
                  onDone={() => setEditMedId(null)}
                />
              </li>
            ) : (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card p-3 shadow-float"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {m.drug}
                    {m.dose && <span className="font-normal"> {m.dose}</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[m.frequency, m.route].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditMedId(m.id);
                      setAddingMed(false);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={rowAction.pending}
                    onClick={() =>
                      void rowAction.run(
                        stopMedication,
                        rowFd(m.id, {
                          // The clinician's local calendar date (not UTC's).
                          stopped_on: new Date().toLocaleDateString("en-CA"),
                        }),
                      )
                    }
                    title="Stops it today and notes it in the record"
                  >
                    Stop
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      </section>
      <ErrorLine error={rowAction.error} />
    </div>
  );
}
