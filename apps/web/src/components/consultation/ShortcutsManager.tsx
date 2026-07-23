"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Zap,
  Trash2,
  Plus,
  Pencil,
  List,
  ListOrdered,
  IndentIncrease,
  IndentDecrease,
  RemoveFormatting,
} from "lucide-react";
import { CardIcon } from "@/components/ui/CardIcon";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  RichNoteEditor,
  MarkGlyph,
  type RichNoteHandle,
  type LineOp,
} from "@/components/consultation/RichNoteEditor";
import { HIGHLIGHT_COLOURS, type MarkKind, type NoteMark } from "@/lib/richText";
import { cn } from "@/lib/utils";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [shortcut, setShortcut] = useState("");
  const [expansion, setExpansion] = useState("");
  const [expansionMarks, setExpansionMarks] = useState<NoteMark[]>([]);
  // The editor is uncontrolled — it (re)mounts from these on nonce bump.
  const [editText, setEditText] = useState("");
  const [editMarks, setEditMarks] = useState<NoteMark[]>([]);
  const [snipNonce, setSnipNonce] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const richRef = useRef<RichNoteHandle | null>(null);
  const LISTS: { op: LineOp; icon: typeof List; label: string }[] = [
    { op: "bullet", icon: List, label: "Bullet List" },
    { op: "number", icon: ListOrdered, label: "Numbered List" },
    { op: "outdent", icon: IndentDecrease, label: "Outdent" },
    { op: "indent", icon: IndentIncrease, label: "Indent" },
  ];

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

  function resetForm() {
    setEditingId(null);
    setShortcut("");
    setExpansion("");
    setExpansionMarks([]);
    setEditText("");
    setEditMarks([]);
    setSnipNonce((n) => n + 1);
  }

  function edit(sc: AutotextShortcut) {
    setEditingId(sc.id);
    setShortcut(sc.shortcut);
    setExpansion(sc.expansion);
    setExpansionMarks(sc.expansionMarks);
    setEditText(sc.expansion);
    setEditMarks(sc.expansionMarks);
    setSnipNonce((n) => n + 1); // remount the editor with this content loaded
  }

  async function add() {
    if (pending || !shortcut.trim() || !expansion.trim()) return;
    setPending(true);
    setError(null);
    const r = await saveMyShortcut({
      id: editingId ?? undefined,
      shortcut,
      expansion,
      marks: expansionMarks,
    });
    setPending(false);
    if (!r.ok) return setError(r.error);
    const next = [...items.filter((i) => i.id !== r.data.id), r.data].sort((a, b) =>
      a.shortcut.localeCompare(b.shortcut),
    );
    setItems(next);
    onChanged(next);
    resetForm();
  }

  async function remove(id: string) {
    if (editingId === id) resetForm();
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
            <div
              key={i.id}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                editingId === i.id ? "bg-teal/20 ring-1 ring-teal/40" : "hover:bg-hover",
              )}
            >
              <span className="shrink-0 rounded-md bg-foreground/6 px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                .{i.shortcut}
              </span>
              <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {i.expansion}
              </p>
              <button
                onClick={() => edit(i)}
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                aria-label={`Edit .${i.shortcut}`}
                title="Edit"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                onClick={() => remove(i.id)}
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-critical"
                aria-label={`Remove .${i.shortcut}`}
                title="Remove"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="shrink-0 space-y-2 border-t border-black/5 p-4">
          {error && <p className="rounded-lg bg-critical/10 p-2 text-xs text-critical">{error}</p>}
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-muted-foreground">.</span>
            <Input
              value={shortcut}
              placeholder="shortcut (e.g. sn)"
              onChange={(e) => setShortcut(e.target.value)}
              className="w-40"
            />
          </div>
          {/* Full format toolbar (the Scribe palette) — write a whole formatted
              standard letter here, not just quick marks. */}
          <div className="flex items-center gap-0.5 overflow-x-auto rounded-lg bg-muted/40 p-1">
            {(["b", "i", "u", "s"] as MarkKind[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-label={k === "b" ? "Bold" : k === "i" ? "Italic" : k === "u" ? "Underline" : "Strikethrough"}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => richRef.current?.format(k)}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
              >
                <MarkGlyph k={k} />
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-border" />
            {HIGHLIGHT_COLOURS.map((c) => (
              <button
                key={c.key}
                type="button"
                title={c.label}
                aria-label={`Highlight ${c.label}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => richRef.current?.highlight(c.key)}
                className="size-5 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110"
                style={{ backgroundColor: c.bg }}
              />
            ))}
            <span className="mx-1 h-5 w-px bg-border" />
            {LISTS.map(({ op, icon: Icon, label }) => (
              <button
                key={op}
                type="button"
                title={label}
                aria-label={label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => richRef.current?.lineOp(op)}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
              >
                <Icon className="size-4" />
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-border" />
            <button
              type="button"
              title="Clear Formatting"
              aria-label="Clear Formatting"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => richRef.current?.clearFormat()}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
            >
              <RemoveFormatting className="size-4" />
            </button>
          </div>
          {/* A big editor — room for a full multi-paragraph letter. */}
          <div className="max-h-[42vh] min-h-[180px] overflow-y-auto rounded-lg bg-muted/40 px-3 py-2 text-sm focus-within:bg-muted/60">
            <RichNoteEditor
              ref={richRef}
              docKey={`snip-${snipNonce}`}
              initialText={editText}
              initialMarks={editMarks}
              placeholder="Write the sentence — or a whole formatted letter — you insert every day. Select text, then use the toolbar above."
              onChange={(text, marks) => {
                setExpansion(text);
                setExpansionMarks(marks);
              }}
            />
          </div>
          {/* A live length hint (Roland 2026-07-23) — so writers keep a shortcut
              short. Not a hard limit; a whole letter is fine, so it only turns
              amber past ~5k chars (well beyond a one-page letter). */}
          <div className="flex justify-end px-0.5">
            <span
              className={cn(
                "text-[11px] tabular-nums",
                expansion.length > 5000 ? "text-amber-600" : "text-muted-foreground",
              )}
            >
              {expansion.length.toLocaleString()} characters
              {expansion.length > 5000 ? " · long — shortcuts are usually a line or two" : ""}
            </span>
          </div>
          <div className="flex gap-2">
            {editingId && (
              <Button variant="ghost" size="sm" onClick={resetForm} className="flex-1">
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={add}
              disabled={pending || !shortcut.trim() || !expansion.trim()}
              className="flex-1"
            >
              {editingId ? (
                <>Save changes</>
              ) : (
                <>
                  <Plus className="size-3.5" /> Add shortcut
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
