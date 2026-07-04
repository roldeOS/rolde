"use client";

import { useState } from "react";
import { BookUser, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardIcon } from "@/components/ui/CardIcon";
import { Field, Input } from "@/components/ui/form";
import { Select } from "@/components/ui/Select";
import {
  saveAddressBookEntry,
  removeAddressBookEntry,
  type ActionResult,
} from "./actions";
import {
  asCountry,
  emailOk,
  phoneOk,
  phoneHint,
  phoneMaxLen,
  sanitisePhone,
  postcodeLabel,
  postcodeHint,
  postcodeOk,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

export type AddressEntry = {
  id: string;
  kind: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  notes: string | null;
};

const KIND_OPTIONS = [
  { value: "gp_practice", label: "GP Practice" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "laboratory", label: "Laboratory" },
  { value: "hospital", label: "Hospital" },
  { value: "clinic", label: "Clinic" },
  { value: "specialist", label: "Specialist" },
  { value: "other", label: "Other" },
];
const kindLabel = (v: string) => KIND_OPTIONS.find((k) => k.value === v)?.label ?? "Other";

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

function EntryForm({
  existing,
  country,
  onDone,
}: {
  existing?: AddressEntry;
  country: string;
  onDone: () => void;
}) {
  const c = asCountry(country);
  const { pending, error, run } = useAction();
  const [v, setV] = useState({
    kind: existing?.kind ?? "gp_practice",
    name: existing?.name ?? "",
    contact_name: existing?.contact_name ?? "",
    email: existing?.email ?? "",
    phone: existing?.phone ?? "",
    address_line1: existing?.address_line1 ?? "",
    address_line2: existing?.address_line2 ?? "",
    city: existing?.city ?? "",
    postcode: existing?.postcode ?? "",
    notes: existing?.notes ?? "",
  });
  const set = (k: keyof typeof v) => (val: string) => setV((s) => ({ ...s, [k]: val }));
  const submit = () => {
    const fd = new FormData();
    if (existing) fd.set("id", existing.id);
    for (const [k, val] of Object.entries(v)) fd.set(k, val);
    void run(saveAddressBookEntry, fd, onDone);
  };
  return (
    <div className="space-y-3 rounded-xl bg-muted/40 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" htmlFor="ab-name" required hint="The Elms Surgery · Church Pharmacy">
          <Input id="ab-name" value={v.name} onChange={(e) => set("name")(e.target.value)} />
        </Field>
        <Field label="Type" htmlFor="ab-kind">
          <Select id="ab-kind" value={v.kind} onChange={set("kind")}>
            {KIND_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Contact Name" htmlFor="ab-contact">
          <Input id="ab-contact" value={v.contact_name} onChange={(e) => set("contact_name")(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="ab-email">
          <Input
            id="ab-email"
            type="email"
            value={v.email}
            error={v.email !== "" && !emailOk(v.email)}
            onChange={(e) => set("email")(e.target.value)}
          />
        </Field>
        <Field label="Phone" htmlFor="ab-phone" hint={phoneHint(c)}>
          <Input
            id="ab-phone"
            value={v.phone}
            error={v.phone !== "" && !phoneOk(v.phone, c)}
            maxLength={phoneMaxLen(c)}
            onChange={(e) => set("phone")(sanitisePhone(e.target.value))}
          />
        </Field>
        <Field label="Address Line 1" htmlFor="ab-a1">
          <Input id="ab-a1" value={v.address_line1} onChange={(e) => set("address_line1")(e.target.value)} />
        </Field>
        <Field label="Address Line 2" htmlFor="ab-a2">
          <Input id="ab-a2" value={v.address_line2} onChange={(e) => set("address_line2")(e.target.value)} />
        </Field>
        <Field label="City / Town" htmlFor="ab-city">
          <Input id="ab-city" value={v.city} onChange={(e) => set("city")(e.target.value)} />
        </Field>
        <Field label={postcodeLabel(c)} htmlFor="ab-post" hint={postcodeHint(c)}>
          <Input
            id="ab-post"
            value={v.postcode}
            error={v.postcode.trim() !== "" && !postcodeOk(v.postcode, c)}
            onChange={(e) => set("postcode")(e.target.value)}
          />
        </Field>
        <Field label="Notes" htmlFor="ab-notes">
          <Input id="ab-notes" value={v.notes} onChange={(e) => set("notes")(e.target.value)} />
        </Field>
      </div>
      {error && (
        <p className="rounded-lg bg-critical/10 px-3 py-2 text-xs font-medium text-critical">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} disabled={pending || !v.name.trim()}>
          {pending ? "Saving…" : existing ? "Save Entry" : "Add Entry"}
        </Button>
      </div>
    </div>
  );
}

/** Two-step remove — first click arms, second confirms. */
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

/**
 * The Courier Address Book (C2) — where the clinic's letters GO: GP practices,
 * pharmacies (Church · Fox · the patient's nominated), labs, hospitals. C3's
 * send sheet reads this list; entries are soft-removed only, so an old letter
 * always knows where it went.
 */
export function AddressBook({
  entries,
  country,
}: {
  entries: AddressEntry[];
  country: string;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const removeAction = useAction();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <CardIcon icon={BookUser} tone="accent" variant="badge" size="sm" />
          Address Book
          <span className="text-xs font-normal tabular-nums">{entries.length}</span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setAdding(true);
            setEditingId(null);
          }}
        >
          <Plus className="size-3.5" /> Add Entry
        </Button>
      </div>
      {adding && <EntryForm country={country} onDone={() => setAdding(false)} />}
      {entries.length === 0 && !adding && (
        <p className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground shadow-float">
          Nowhere to send yet — add the GP practices, pharmacies and labs your clinic writes to.
        </p>
      )}
      <ul className="space-y-2">
        {entries.map((en) =>
          editingId === en.id ? (
            <li key={en.id}>
              <EntryForm existing={en} country={country} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li
              key={en.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card p-3 shadow-float"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {en.name}
                  <span className="ml-2 rounded-md bg-foreground/6 px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                    {kindLabel(en.kind)}
                  </span>
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {[en.contact_name, en.email, en.phone, en.postcode]
                    .filter(Boolean)
                    .join(" · ") || "No contact details yet"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingId(en.id);
                    setAdding(false);
                  }}
                >
                  Edit
                </Button>
                <RemoveButton
                  pending={removeAction.pending}
                  onConfirm={() => {
                    const fd = new FormData();
                    fd.set("id", en.id);
                    void removeAction.run(removeAddressBookEntry, fd);
                  }}
                />
              </div>
            </li>
          ),
        )}
      </ul>
      {removeAction.error && (
        <p className="rounded-lg bg-critical/10 px-3 py-2 text-xs font-medium text-critical">
          {removeAction.error}
        </p>
      )}
    </div>
  );
}
