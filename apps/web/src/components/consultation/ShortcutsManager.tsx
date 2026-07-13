"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Zap, Trash2, Plus } from "lucide-react";
import { CardIcon } from "@/components/ui/CardIcon";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  listMyShortcuts,
  saveMyShortcut,
  deleteMyShortcut,
  type AutotextShortcut,
} from "@/app/(app)/patients/templateActions";

/**
 * My Shortcuts (Scribe T2.5) — the personal autotext manager: a compact
 * right-hand sheet listing the writer's ".shortcut → sentence" expansions.
 * Personal by design (unlike clinic templates): a shortcut is a typing aid —
 * its text lands under the author's own eyes and signature.
 */
export function ShortcutsManager({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  /** Hands the fresh list back so Scribe expands with it immediately. */
  onChanged: (shortcuts: AutotextShortcut[]) => void;
}) {
  const [items, setItems] = useState<AutotextShortcut[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [shortcut, setShortcut] = useState("");
  const [expansion, setExpansion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void listMyShortcuts().then((r) => {
      if (r.ok) setItems(r.data);
      else setError(r.error);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  async function add() {
    if (pending || !shortcut.trim() || !expansion.trim()) return;
    setPending(true);
    setError(null);
    const r = await saveMyShortcut({ shortcut, expansion });
    setPending(false);
    if (!r.ok) return setError(r.error);
    const next = [...items, r.data].sort((a, b) => a.shortcut.localeCompare(b.shortcut));
    setItems(next);
    onChanged(next);
    setShortcut("");
    setExpansion("");
  }

  async function remove(id: string) {
    const r = await deleteMyShortcut(id);
    if (!r.ok) return setError(r.error);
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    onChanged(next);
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button aria-label="Close shortcuts" onClick={onClose} className="absolute inset-0 bg-black/20" />
      <div className="relative flex h-full w-full max-w-md flex-col bg-card shadow-overlay">
        <div className="flex shrink-0 items-center gap-2.5 border-b border-black/5 bg-teal/20 px-4 py-3">
          <CardIcon icon={Zap} tone="teal" className="bg-card/70 shadow-sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-tight font-semibold">My Shortcuts</p>
            <p className="truncate text-xs leading-tight text-muted-foreground">
              Type “.shortcut” then space — your sentence appears
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-4">
          {loaded && items.length === 0 && (
            <p className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
              Save the sentences you type every day — “.sn” for your
              safety-netting advice, “.fu2w” for your two-week follow-up line.
              They expand anywhere you write in Scribe, and only for you.
            </p>
          )}
          {items.map((i) => (
            <div key={i.id} className="flex items-start gap-2 rounded-xl bg-muted/40 p-2.5">
              <span className="shrink-0 rounded-md bg-foreground/6 px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                .{i.shortcut}
              </span>
              <p className="min-w-0 flex-1 text-xs whitespace-pre-wrap text-muted-foreground">
                {i.expansion}
              </p>
              <button
                onClick={() => remove(i.id)}
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-critical"
                aria-label={`Remove .${i.shortcut}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="shrink-0 space-y-2 border-t border-black/5 p-4">
          {error && <p className="rounded-lg bg-critical/10 p-2 text-xs text-critical">{error}</p>}
          <div className="flex items-start gap-2">
            <Input
              value={shortcut}
              placeholder="sn"
              onChange={(e) => setShortcut(e.target.value)}
              className="w-24"
            />
            <textarea
              value={expansion}
              rows={2}
              placeholder="Safety-netting advice given; return or call if symptoms worsen."
              onChange={(e) => setExpansion(e.target.value)}
              className="min-w-0 flex-1 resize-y rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:bg-muted/60"
            />
            <Button size="sm" onClick={add} disabled={pending || !shortcut.trim() || !expansion.trim()}>
              <Plus className="size-3.5" /> Add
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
