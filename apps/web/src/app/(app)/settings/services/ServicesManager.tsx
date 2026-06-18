"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Pencil, Trash2, Clock, Hash } from "lucide-react";
import { useSavedFlash } from "@/components/ui/PageActionBar";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  code: string | null;
  service_type: string;
  course_sessions: number | null;
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

const TYPE_LABEL: Record<string, string> = {
  one_off: "One-off",
  course: "Course",
  membership: "Membership",
};
const TYPES = ["one_off", "course", "membership"] as const;
const UNCATEGORISED = "Uncategorised";

const money = (pence: number) =>
  `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const INPUT =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10";
const LABEL = "mb-1 block text-xs font-medium text-muted-foreground";

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
          {s.service_type !== "one_off" && (
            <span className="rounded bg-info/12 px-1.5 py-0.5 text-[10px] font-semibold text-info">
              {TYPE_LABEL[s.service_type]}
              {s.service_type === "course" && s.course_sessions ? ` ×${s.course_sessions}` : ""}
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
  const [type, setType] = useState<string>(service?.service_type ?? "one_off");
  const [sessions, setSessions] = useState(
    service?.course_sessions != null ? String(service.course_sessions) : "",
  );
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
          service_type: type,
          course_sessions: type === "course" && sessions.trim() ? Number(sessions) : null,
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
        className="w-full max-w-lg rounded-2xl bg-card shadow-overlay"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="font-heading text-base font-semibold tracking-tight">
            {service ? "Edit Service" : "Add Service"}
          </h2>
          <button
            onClick={() => !busy && onClose()}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className={LABEL}>Name</label>
            <input
              className={INPUT}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anti-Wrinkle (3 Areas)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Category</label>
              <input
                className={INPUT}
                list="service-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Injectables"
              />
              <datalist id="service-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={LABEL}>Code</label>
              <input
                className={INPUT}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Optional, e.g. BTX-3"
              />
            </div>
          </div>

          <div className={cn("grid gap-3", type === "course" ? "grid-cols-2" : "grid-cols-1")}>
            <div>
              <label className={LABEL}>Type</label>
              <select className={INPUT} value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            {type === "course" && (
              <div>
                <label className={LABEL}>Sessions In The Course</label>
                <input
                  className={INPUT}
                  inputMode="numeric"
                  value={sessions}
                  onChange={(e) => setSessions(e.target.value)}
                  placeholder="e.g. 6"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Price (£)</label>
              <input
                className={INPUT}
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={LABEL}>Duration (min)</label>
              <input
                className={INPUT}
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Description</label>
            <input
              className={INPUT}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>

          {/* Conditional — only when the clinic charges VAT */}
          {commercial.vat_enabled && (
            <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
              <span className="text-sm">
                <span className="font-medium">Charge VAT On This Service</span>
                <span className="block text-xs text-muted-foreground">
                  {chargeVat
                    ? `Adds ${vatPct}% — patients pay ${money(grossPence)}.`
                    : "This service is VAT-exempt."}
                </span>
              </span>
              <Switch checked={chargeVat} onChange={setChargeVat} label="Charge VAT on this service" />
            </label>
          )}

          {/* Conditional — only when the clinic takes deposits */}
          {commercial.deposit_enabled && (
            <div>
              <label className={LABEL}>Deposit For This Service (£)</label>
              <input
                className={INPUT}
                inputMode="decimal"
                value={depositStr}
                onChange={(e) => setDepositStr(e.target.value)}
                placeholder={`Default ${money(commercial.deposit_default_pence)}`}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Leave blank to use the clinic default ({money(commercial.deposit_default_pence)}).
              </p>
            </div>
          )}

          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <span className="text-sm">
              <span className="font-medium">Active</span>
              <span className="block text-xs text-muted-foreground">Offered to patients now.</span>
            </span>
            <input
              type="checkbox"
              className="size-4 accent-success"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
          </label>

          {error && (
            <p className="rounded-lg bg-critical/10 px-3 py-2 text-xs font-medium text-critical">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
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
