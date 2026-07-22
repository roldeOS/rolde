"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { savePhotoProtocol, deletePhotoProtocol, type PhotoProtocol } from "./actions";

function ViewEditor({ views, setViews }: { views: string[]; setViews: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim().slice(0, 40);
    if (v && !views.includes(v)) setViews([...views, v]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {views.length === 0 && (
          <span className="text-xs text-muted-foreground">No views yet — add the angles below.</span>
        )}
        {views.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="flex items-center gap-1 rounded-md bg-teal/25 py-0.5 pr-1 pl-2 text-xs font-medium text-teal-800"
          >
            {v}
            <button
              type="button"
              onClick={() => setViews(views.filter((_, j) => j !== i))}
              className="rounded p-0.5 hover:bg-black/5"
              aria-label={`Remove ${v}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder="Add a view (e.g. Front, Left 45) then Enter"
        className="w-full rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-teal-400"
      />
    </div>
  );
}

function ProtocolCard({ p }: { p: PhotoProtocol }) {
  const router = useRouter();
  const [name, setName] = useState(p.name);
  const [views, setViews] = useState<string[]>(p.views);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dirty = name !== p.name || JSON.stringify(views) !== JSON.stringify(p.views);

  const save = () =>
    start(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("id", p.id);
      fd.set("name", name);
      fd.set("views", JSON.stringify(views));
      const res = await savePhotoProtocol(fd);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  const del = () =>
    start(async () => {
      const res = await deletePhotoProtocol(p.id);
      if (res.ok) router.refresh();
      else setError(res.error);
    });

  return (
    <div className="rounded-2xl bg-card p-4 shadow-float">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-base font-semibold tracking-tight outline-none hover:border-border focus:border-border"
        />
        <button
          type="button"
          onClick={del}
          disabled={pending}
          title="Remove protocol"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-critical/10 hover:text-critical"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="mt-3">
        <ViewEditor views={views} setViews={setViews} />
      </div>
      {error && <p className="mt-2 text-xs text-critical">{error}</p>}
      {dirty && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}

function AddProtocol() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [views, setViews] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const create = () =>
    start(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("name", name);
      fd.set("views", JSON.stringify(views));
      const res = await savePhotoProtocol(fd);
      if (res.ok) {
        setName("");
        setViews([]);
        router.refresh();
      } else setError(res.error);
    });

  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4">
      <p className="text-sm font-semibold text-foreground">New protocol</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (e.g. Full Face · 5-view)"
        className="mt-2 w-full rounded-md border border-border bg-card px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-teal-400"
      />
      <div className="mt-3">
        <ViewEditor views={views} setViews={setViews} />
      </div>
      {error && <p className="mt-2 text-xs text-critical">{error}</p>}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={create}
          disabled={pending || !name.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="size-3.5" />
          Add protocol
        </button>
      </div>
    </div>
  );
}

export function PhotoProtocolsManager({ initial }: { initial: PhotoProtocol[] }) {
  return (
    <div className="space-y-4">
      {initial.map((p) => (
        <ProtocolCard key={p.id} p={p} />
      ))}
      <AddProtocol />
    </div>
  );
}
