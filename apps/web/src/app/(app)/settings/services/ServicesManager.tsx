"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Pencil, Trash2, Clock, Hash, Stethoscope } from "lucide-react";
import { useSavedFlash } from "@/components/ui/PageActionBar";
import { Switch } from "@/components/ui/Switch";
import { Field, Input } from "@/components/ui/form";
import { DialogHeaderRow } from "@/components/ui/DialogHeaderRow";
import { cn } from "@/lib/utils";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  code: string | null;
  price_pence: number;
  duration_minutes: number | null;
  vat_exempt: boolean;
  deposit_pence: number | null;
  active: boolean;
};

/** The clinic's money switches — they decide which conditional fields show. */
export type CommercialContext = {
  vat_enabled: boolean;
  vat_rate_bps: number;
  deposit_enabled: boolean;
  deposit_default_pence: number;
};

type Editing = Service | "new" | null;

const UNCATEGORISED = "Uncategorised";

const money = (pence: number) =>
  `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ServicesManager({
  initial,
  commercial,
}: {
  initial: Service[];
  commercial: CommercialContext;
}) {
  const router = useRouter();
  const flashSaved = useSavedFlash();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [editing, setEditing] = useState<Editing>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Group by category — known categories alphabetically, Uncategorised last.
  const groups = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of initial) {
      const key = s.category?.trim() || UNCATEGORISED;
      (map.get(key) ?? map.set(key, []).get(key)!).push(s);
    }
    return [...map.entries()].sort((a, b) =>
      a[0] === UNCATEGORISED ? 1 : b[0] === UNCATEGORISED ? -1 : a[0].localeCompare(b[0]),
    );
  }, [initial]);

  const categories = useMemo(
    () =>
      [...new Set(initial.map((s) => s.category?.trim()).filter(Boolean))].sort() as string[],
    [initial],
  );

  async function remove(s: Service) {
    if (busyId) return;
    setBusyId(s.id);
    try {
      const res = await fetch("/api/clinic/services", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        flashSaved(`RolDe removed “${s.name}”.`);
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-float">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{initial.length}</span>{" "}
          {initial.length === 1 ? "service" : "services"}
          {groups.length > 1 && (
            <span className="text-muted-foreground"> · {groups.length} categories</span>
          )}
        </p>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90"
        >
          <Plus className="size-4" /> Add Service
        </button>
      </div>

      {initial.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          No services yet — add your first.
        </p>
      ) : (
        groups.map(([category, rows]) => (
          <section key={category}>
            <div className="sticky top-0 z-10 border-b border-border/60 bg-muted/40 px-5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
              {category}
            </div>
            <ul className="divide-y divide-border/60">
              {rows.map((s) => (
                <ServiceRow
                  key={s.id}
                  service={s}
                  commercial={commercial}
                  busy={busyId === s.id}
                  onEdit={() => setEditing(s)}
                  onRemove={() => remove(s)}
                />
              ))}
            </ul>
          </section>
        ))
      )}

      {editing !== null && mounted && (
        <ServiceModal
          service={editing === "new" ? null : editing}
          commercial={commercial}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(name) => {
            setEditing(null);
            flashSaved(`RolDe saved “${name}”.`);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function ServiceRow({
  service: s,
  commercial,
  busy,
  onEdit,
  onRemove,
}: {
  service: Service;
  commercial: CommercialContext;
  busy: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const showNoVat = commercial.vat_enabled && s.vat_exempt;
  const showDeposit = commercial.deposit_enabled && s.deposit_pence != null;
  return (
    <li className={cn("flex items-center gap-3 px-5 py-3.5", !s.active && "opacity-55")}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
          {s.code && (
            <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-muted-foreground">
              <Hash className="size-2.5" />
              {s.code}
            </span>
          )}
          {!s.active && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Inactive
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {s.description && <span className="truncate">{s.description}</span>}
          {showNoVat && <span className="text-warning">No VAT</span>}
          {showDeposit && <span>Deposit {money(s.deposit_pence!)}</span>}
        </div>
      </div>
      {s.duration_minutes != null && (
        <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
          <Clock className="size-3.5" /> {s.duration_minutes} min
        </span>
      )}
      <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
        {money(s.price_pence)}
      </span>
      <button
        onClick={onEdit}
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
        aria-label={`Edit ${s.name}`}
      >
        <Pencil className="size-4" />
      </button>
      <button
        onClick={onRemove}
        disabled={busy}
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-critical/10 hover:text-critical"
        aria-label={`Remove ${s.name}`}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </button>
    </li>
  );
}

/** A bordered switch row (Active, etc.) — our themed toggle, never a raw checkbox. */
function ToggleRow({
  title,
  hint,
  checked,
  onChange,
}: {
  title: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="field-float flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      <span className="text-sm">
        <span className="font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={checked} onChange={onChange} label={title} />
    </label>
  );
}

function ServiceModal({
  service,
  commercial,
  categories,
  onClose,
  onSaved,
}: {
  service: Service | null;
  commercial: CommercialContext;
  categories: string[];
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [category, setCategory] = useState(service?.category ?? "");
  const [code, setCode] = useState(service?.code ?? "");
  const [price, setPrice] = useState(service ? (service.price_pence / 100).toFixed(2) : "");
  const [duration, setDuration] = useState(
    service?.duration_minutes != null ? String(service.duration_minutes) : "",
  );
  const [chargeVat, setChargeVat] = useState(service ? !service.vat_exempt : true);
  const [depositStr, setDepositStr] = useState(
    service?.deposit_pence != null ? (service.deposit_pence / 100).toFixed(2) : "",
  );
  const [active, setActive] = useState(service?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pricePence = Math.round((parseFloat(price) || 0) * 100);
  const grossPence =
    commercial.vat_enabled && chargeVat
      ? Math.round(pricePence * (1 + commercial.vat_rate_bps / 10000))
      : pricePence;
  const vatPct = (commercial.vat_rate_bps / 100).toString();

  async function save() {
    setError(null);
    if (!name.trim()) return setError("Give the service a name.");
    if (!Number.isFinite(pricePence) || pricePence < 0) return setError("Enter a valid price.");

    setBusy(true);
    try {
      const res = await fetch("/api/clinic/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: service?.id,
          name: name.trim(),
          description,
          category: category.trim() || null,
          code: code.trim() || null,
          price_pence: pricePence,
          duration_minutes: duration.trim() === "" ? null : Number(duration),
          vat_exempt: commercial.vat_enabled ? !chargeVat : false,
          deposit_pence: commercial.deposit_enabled
            ? depositStr.trim() === ""
              ? null
              : Math.round((parseFloat(depositStr) || 0) * 100)
            : null,
          active,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(
          data.error === "code_taken"
            ? "That code’s already used by another service."
            : "That didn’t save — check the details and try again.",
        );
        setBusy(false);
        return;
      }
      onSaved(name.trim());
    } catch {
      setError("Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-foreground/20 p-4 py-[8vh] backdrop-blur-sm"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-card shadow-overlay"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeaderRow
          icon={Stethoscope}
          tone="success"
          title={service ? "Edit Service" : "Add Service"}
          subtitle="A treatment your clinic offers, with its price."
          onClose={() => !busy && onClose()}
        />

        <div className="space-y-4 px-6 py-5">
          <Field label="Name" htmlFor="svc_name">
            <Input
              id="svc_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anti-Wrinkle (3 Areas)"
            />
          </Field>

          <div>
            <Field label="Category" htmlFor="svc_category" hint="Type a new one or pick below">
              <Input
                id="svc_category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Injectables"
              />
            </Field>
            {categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      category.trim() === c
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-hover hover:text-foreground",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Field label="Code" htmlFor="svc_code" hint="Your short reference, shown on invoices & reports">
            <Input
              id="svc_code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Optional, e.g. BTX-3"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (£)" htmlFor="svc_price">
              <Input
                id="svc_price"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="Duration (min)" htmlFor="svc_duration" hint="Optional">
              <Input
                id="svc_duration"
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 30"
              />
            </Field>
          </div>

          <Field label="Description" htmlFor="svc_description" hint="Optional">
            <Input
              id="svc_description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          {/* Conditional — only when the clinic charges VAT */}
          {commercial.vat_enabled && (
            <ToggleRow
              title="Charge VAT On This Service"
              hint={
                chargeVat
                  ? `Adds ${vatPct}% — patients pay ${money(grossPence)}.`
                  : "This service is VAT-exempt."
              }
              checked={chargeVat}
              onChange={setChargeVat}
            />
          )}

          {/* Conditional — only when the clinic takes deposits */}
          {commercial.deposit_enabled && (
            <Field
              label="Deposit For This Service (£)"
              htmlFor="svc_deposit"
              hint={`Blank = clinic default (${money(commercial.deposit_default_pence)})`}
            >
              <Input
                id="svc_deposit"
                inputMode="decimal"
                value={depositStr}
                onChange={(e) => setDepositStr(e.target.value)}
                placeholder={money(commercial.deposit_default_pence)}
              />
            </Field>
          )}

          <ToggleRow
            title="Active"
            hint="Offered to patients now."
            checked={active}
            onChange={setActive}
          />

          {error && (
            <p className="rounded-lg bg-critical/10 px-3 py-2 text-xs font-medium text-critical">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            onClick={() => !busy && onClose()}
            disabled={busy}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90 disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? "Saving…" : "Save Service"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
