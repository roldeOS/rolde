"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronUp,
  ChevronDown,
  Trash2,
  LayoutTemplate,
  Heading2,
  Info,
  Type,
  AlignLeft,
  CalendarDays,
  HeartPulse,
  ListChecks,
  ChevronsUpDown,
  SlidersHorizontal,
  PersonStanding,
} from "lucide-react";
import { CardIcon } from "@/components/ui/CardIcon";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  sanitiseParts,
  MAX_TEMPLATE_PARTS,
  type TemplatePart,
} from "@/lib/scribeTemplates";
import {
  saveMyTemplate,
  deleteMyTemplate,
  type PersonalTemplate,
} from "@/app/(app)/patients/templateActions";

/**
 * Scribe T2 — the personal TEMPLATE BUILDER (Roland "go for Scribe T2",
 * 2026-07-13). A right-hand sheet over the consult room: name it, stack parts
 * from the same palette the curated library uses (Body Map included), reorder,
 * save — the picker's "My Templates" section carries it from then on. Personal
 * means personal: only its author sees it (clinic-official arrives at T3).
 */
type DraftPart = {
  kind: TemplatePart["kind"];
  label: string;
  text: string;
  placeholder: string;
  options: string; // one option per line
  min: string;
  max: string;
  minLabel: string;
  maxLabel: string;
};

const KIND_META: {
  kind: TemplatePart["kind"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}[] = [
  { kind: "heading", label: "Heading", icon: Heading2 },
  { kind: "instruction", label: "Instruction", icon: Info, hint: "Guidance for the writer — never part of the note" },
  { kind: "text", label: "Short Text", icon: Type },
  { kind: "textarea", label: "Long Text", icon: AlignLeft },
  { kind: "date", label: "Date", icon: CalendarDays },
  { kind: "vitals", label: "Vitals", icon: HeartPulse, hint: "BP · HR · Temp · SpO₂ · RR · Weight — auto-populates from the record" },
  { kind: "checkboxes", label: "Checkboxes", icon: ListChecks },
  { kind: "dropdown", label: "Dropdown", icon: ChevronsUpDown },
  { kind: "range", label: "Scale", icon: SlidersHorizontal },
  { kind: "body_map", label: "Body Map", icon: PersonStanding, hint: "The annotator embeds here — Body ⇄ Face, pins in colour" },
];
const kindMeta = (k: TemplatePart["kind"]) => KIND_META.find((m) => m.kind === k)!;

const blank = (kind: TemplatePart["kind"]): DraftPart => ({
  kind,
  label:
    kind === "vitals" ? "Vital Signs" : kind === "body_map" ? "Body Map" : "",
  text: "",
  placeholder: "",
  options: "",
  min: "0",
  max: "10",
  minLabel: "",
  maxLabel: "",
});

const toDraft = (p: TemplatePart): DraftPart => ({
  kind: p.kind,
  label: "label" in p ? p.label : "",
  text: p.kind === "instruction" ? p.text : "",
  placeholder: "placeholder" in p ? (p.placeholder ?? "") : "",
  options: "options" in p ? p.options.join("\n") : "",
  min: p.kind === "range" ? String(p.min) : "0",
  max: p.kind === "range" ? String(p.max) : "10",
  minLabel: p.kind === "range" ? (p.minLabel ?? "") : "",
  maxLabel: p.kind === "range" ? (p.maxLabel ?? "") : "",
});

const fromDrafts = (drafts: DraftPart[]): TemplatePart[] | null =>
  sanitiseParts(
    drafts.map((d) => ({
      kind: d.kind,
      label: d.label,
      text: d.text,
      placeholder: d.placeholder,
      options: d.options.split("\n").map((s) => s.trim()).filter(Boolean),
      min: Number(d.min),
      max: Number(d.max),
      minLabel: d.minLabel,
      maxLabel: d.maxLabel,
    })),
  );

export function TemplateBuilder({
  editing,
  onClose,
  onSaved,
  onDeleted,
}: {
  /** null = building a new template; a PersonalTemplate = editing it. */
  editing: PersonalTemplate | null;
  onClose: () => void;
  onSaved: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [specialty, setSpecialty] = useState(editing?.specialty ?? "");
  const [parts, setParts] = useState<DraftPart[]>(editing ? editing.parts.map(toDraft) : []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // The sheet claims its Escape so the consult room beneath survives it.
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

  const move = (i: number, dir: -1 | 1) =>
    setParts((ps) => {
      const j = i + dir;
      if (j < 0 || j >= ps.length) return ps;
      const next = [...ps];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const patch = (i: number, p: Partial<DraftPart>) =>
    setParts((ps) => ps.map((d, j) => (j === i ? { ...d, ...p } : d)));

  const savable = name.trim().length > 0 && fromDrafts(parts) !== null;

  async function save() {
    if (pending) return;
    const clean = fromDrafts(parts);
    if (!name.trim()) return setError("The template needs a name.");
    if (!clean) return setError("Add at least one complete part — labels filled, choices given.");
    setPending(true);
    setError(null);
    const r = await saveMyTemplate({
      id: editing?.id,
      name: name.trim(),
      specialty: specialty.trim() || "Personal",
      parts: clean,
    });
    setPending(false);
    if (r.ok) onSaved(r.id);
    else setError(r.error);
  }

  async function remove() {
    if (!editing || pending) return;
    setPending(true);
    const r = await deleteMyTemplate(editing.id);
    setPending(false);
    if (r.ok) onDeleted(editing.id);
    else setError(r.error);
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        aria-label="Close the builder"
        onClick={onClose}
        className="absolute inset-0 bg-black/20"
      />
      <div className="relative flex h-full w-full max-w-xl flex-col bg-card shadow-overlay">
        {/* Header — the Popover Anatomy's grammar, sheet-sized. */}
        <div className="flex shrink-0 items-center gap-2.5 border-b border-black/5 bg-periwinkle/20 px-4 py-3">
          <CardIcon icon={LayoutTemplate} tone="periwinkle" className="bg-card/70 shadow-sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-tight font-semibold">
              {editing ? "Edit Template" : "New Template"}
            </p>
            <p className="truncate text-xs leading-tight text-muted-foreground">
              Yours alone — clinic-wide templates arrive with the Caretaker builder
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

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Template Name" htmlFor="tb-name">
              <Input
                id="tb-name"
                value={name}
                placeholder="e.g. Follow-Up Review"
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Specialty" htmlFor="tb-spec">
              <Input
                id="tb-spec"
                value={specialty}
                placeholder="Personal"
                onChange={(e) => setSpecialty(e.target.value)}
              />
            </Field>
          </div>

          {/* The parts, in note order */}
          {parts.length === 0 && (
            <p className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
              Stack the parts your note needs — headings to structure it, fields
              to fill, a Body Map to mark. The finished note reads top to bottom
              in this order.
            </p>
          )}
          {parts.map((d, i) => {
            const meta = kindMeta(d.kind);
            return (
              <div key={i} className="space-y-2 rounded-xl bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <meta.icon className="size-3.5 text-muted-foreground" />
                    {meta.label}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === parts.length - 1}
                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setParts((ps) => ps.filter((_, j) => j !== i))}
                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-critical"
                      aria-label="Remove part"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                </div>
                {d.kind === "instruction" ? (
                  <Input
                    value={d.text}
                    placeholder="Guidance for the writer…"
                    onChange={(e) => patch(i, { text: e.target.value })}
                  />
                ) : (
                  <Input
                    value={d.label}
                    placeholder={d.kind === "heading" ? "Section heading — e.g. Assessment" : "Field label"}
                    onChange={(e) => patch(i, { label: e.target.value })}
                  />
                )}
                {(d.kind === "text" || d.kind === "textarea") && (
                  <Input
                    value={d.placeholder}
                    placeholder="Placeholder hint (optional)"
                    onChange={(e) => patch(i, { placeholder: e.target.value })}
                  />
                )}
                {(d.kind === "checkboxes" || d.kind === "dropdown") && (
                  <textarea
                    value={d.options}
                    rows={3}
                    placeholder={"One choice per line — at least two:\nOption A\nOption B"}
                    onChange={(e) => patch(i, { options: e.target.value })}
                    className="w-full resize-y rounded-lg bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                  />
                )}
                {d.kind === "range" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={d.min} inputMode="numeric" placeholder="Min — e.g. 0" onChange={(e) => patch(i, { min: e.target.value })} />
                    <Input value={d.max} inputMode="numeric" placeholder="Max — e.g. 10" onChange={(e) => patch(i, { max: e.target.value })} />
                    <Input value={d.minLabel} placeholder="Low label (optional)" onChange={(e) => patch(i, { minLabel: e.target.value })} />
                    <Input value={d.maxLabel} placeholder="High label (optional)" onChange={(e) => patch(i, { maxLabel: e.target.value })} />
                  </div>
                )}
                {meta.hint && <p className="text-xs text-muted-foreground">{meta.hint}</p>}
              </div>
            );
          })}

          {/* The palette */}
          <div>
            <p className="mb-1.5 text-xs font-semibold tracking-wider text-foreground uppercase">
              Add A Part
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {KIND_META.map((m) => (
                <button
                  key={m.kind}
                  disabled={parts.length >= MAX_TEMPLATE_PARTS}
                  onClick={() => setParts((ps) => [...ps, blank(m.kind)])}
                  className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:opacity-40"
                >
                  <m.icon className="size-3.5 shrink-0" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer — save / delete, honest errors inline */}
        <div className="shrink-0 space-y-2 border-t border-black/5 p-4">
          {error && (
            <p className="rounded-lg bg-critical/10 p-2 text-xs text-critical">{error}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            {editing ? (
              confirmingDelete ? (
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">Remove this template?</span>
                  <button
                    onClick={remove}
                    disabled={pending}
                    className="rounded-md bg-critical px-2 py-1 font-semibold text-white"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className="rounded-md px-2 py-1 font-medium text-muted-foreground hover:text-foreground"
                  >
                    Keep
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-critical"
                >
                  <Trash2 className="size-3.5" /> Remove Template
                </button>
              )
            ) : (
              <span />
            )}
            <span className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={!savable || pending}>
                {pending ? "Saving…" : "Save Template"}
              </Button>
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
