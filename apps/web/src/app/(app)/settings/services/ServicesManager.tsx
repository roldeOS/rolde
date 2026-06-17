"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Pencil, Trash2, Clock } from "lucide-react";
import { useSavedFlash } from "@/components/ui/PageActionBar";
import { cn } from "@/lib/utils";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  price_pence: number;
  duration_minutes: number | null;
  active: boolean;
};

type Editing = Service | "new" | null;

const money = (pence: number) =>
  `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const INPUT =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10";
const LABEL = "mb-1 block text-xs font-medium text-muted-foreground";

export function ServicesManager({ initial }: { initial: Service[] }) {
  const router = useRouter();
  const flashSaved = useSavedFlash();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [editing, setEditing] = useState<Editing>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
        </p>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90"
        >
          <Plus className="size-4" /> Add Service
        </button>
      </div>

      <ul className="divide-y divide-border/60">
        {initial.map((s) => (
          <li
            key={s.id}
            className={cn("flex items-center gap-3 px-5 py-3.5", !s.active && "opacity-55")}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                {!s.active && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Inactive
                  </span>
                )}
              </div>
              {s.description && (
                <p className="truncate text-xs text-muted-foreground">{s.description}</p>
              )}
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
              onClick={() => setEditing(s)}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
              aria-label={`Edit ${s.name}`}
            >
              <Pencil className="size-4" />
            </button>
            <button
              onClick={() => remove(s)}
              disabled={busyId === s.id}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-critical/10 hover:text-critical"
              aria-label={`Remove ${s.name}`}
            >
              {busyId === s.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            </button>
          </li>
        ))}
        {initial.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-muted-foreground">
            No services yet — add your first.
          </li>
        )}
      </ul>

      {editing !== null && mounted && (
        <ServiceModal
          service={editing === "new" ? null : editing}
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

function ServiceModal({
  service,
  onClose,
  onSaved,
}: {
  service: Service | null;
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [price, setPrice] = useState(service ? (service.price_pence / 100).toFixed(2) : "");
  const [duration, setDuration] = useState(
    service?.duration_minutes != null ? String(service.duration_minutes) : "",
  );
  const [active, setActive] = useState(service?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!name.trim()) return setError("Give the service a name.");
    const pricePence = Math.round(parseFloat(price || "0") * 100);
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
          price_pence: pricePence,
          duration_minutes: duration.trim() === "" ? null : Number(duration),
          active,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError("That didn’t save — check the details and try again.");
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
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-foreground/20 p-4 py-[10vh] backdrop-blur-sm"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-card shadow-overlay"
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
              placeholder="e.g. Consultation"
            />
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
