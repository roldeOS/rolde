"use client";

import { useState, useEffect, useRef } from "react";
import { PenLine, Maximize2, Minimize2, Strikethrough, LayoutTemplate, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardIcon } from "@/components/ui/CardIcon";
import { SectionExplainer } from "@/components/ui/SectionExplainer";
import { WorkupPanel } from "@/components/WorkupPanel";
import { AiPanel } from "@/components/AiPanel";
import {
  ClinicalNotesFeed,
  type FeedEntry,
  type Author,
} from "@/components/consultation/ClinicalNotesFeed";
import { useTopbar, DEFAULT_LAYOUT } from "@/components/topbar/TopbarContext";
import {
  ALL_MODULES_ON,
  workupEnabled,
  type ClinicalModules,
} from "@/lib/clinicalModules";
import { usePageActionBar, useSavedFlash } from "@/components/ui/PageActionBar";
import {
  saveNote,
  editNote,
  strikeNote,
  amendNote,
} from "@/app/(app)/patients/actions";
import { ScribeTemplateForm } from "@/components/consultation/ScribeTemplateForm";
import {
  ROLDE_TEMPLATE_LIBRARY,
  VITALS_FIELDS,
  renderTemplate,
  templateHasAnswers,
  type ScribeTemplate,
  type TemplateAnswers,
} from "@/lib/scribeTemplates";
import { AnchoredPopover } from "@/components/ui/AnchoredPopover";
import { cn } from "@/lib/utils";

type WorkupEntry = { id: string; entry_type: string };

/**
 * The consultation workspace (Roland 2026-06-10; Layouts 2026-07-03). The
 * geometry is USER-CONTROLLED (APPROVALS §4.2 — no auto-resize, ever): the
 * topbar "Layouts" menu applies Default (50/50) or a named layout; the two
 * DIVIDERS drag-resize (double-click = Default); everything persists per user.
 * Each column has its OWN row-split (Roland 2026-07-04 — dragging Scribe's
 * divider must never move RolDe's; supersedes the one-shared-split symmetry).
 * Four glassy, borderless, floating cards — responsive (2×2 on desktop,
 * stacked on mobile/tablet). The composer is the single place for new/edit/amend.
 */
type Mode = "split" | "top" | "bottom";
const EDIT_WINDOW_MS = 60 * 60 * 1000;
const COMPOSER_NAME = "Scribe"; // the writing card (Roland 2026-06-10)

type EditTarget = { id: string; original: string; locked: boolean } | null;

export function ConsultationWorkspace({
  patient,
  feedEntries,
  workupEntries,
  authors,
  currentUserId,
  reads,
  modules = ALL_MODULES_ON,
}: {
  patient: { id: string; firstName: string };
  feedEntries: FeedEntry[];
  workupEntries: WorkupEntry[];
  authors: Record<string, Author>;
  currentUserId: string;
  /** Courier C1 — every read receipt on this patient's entries (unread state +
   *  the per-tile "Seen by" thread). */
  reads: { entry_id: string; user_id: string; read_at: string }[];
  /** Clinical Modules (W1.1, APPROVALS §4.2) — the CLINIC's switches; the grid
   *  reflows 4/3/2. Sits OVER the user's Layouts card toggles. */
  modules?: ClinicalModules;
}) {
  const { layout, setLayout } = useTopbar();
  const [leftMode, setLeftMode] = useState<Mode>("split");
  const [rightMode, setRightMode] = useState<Mode>("split");
  const [ready, setReady] = useState(false);
  // Which divider is mid-drag ("col" | "split" | null) — transitions pause so
  // the cards track the pointer 1:1.
  const [dragging, setDragging] = useState<"col" | "splitLeft" | "splitRight" | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [draft, setDraft] = useState("");
  // RolDe Scribe Templates T1 (GREENLIT 2026-07-04): pick from the curated
  // library → Scribe MORPHS into the structured form in place; Save renders
  // the answers into a clean readable note. New notes only (edit/amend stay
  // verbatim text).
  const [template, setTemplate] = useState<ScribeTemplate | null>(null);
  const [answers, setAnswers] = useState<TemplateAnswers>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerBtn, setPickerBtn] = useState<HTMLElement | null>(null);
  const [strikeOriginal, setStrikeOriginal] = useState(false);
  const [pending, setPending] = useState(false);
  // Conversational "saved" flash lives in the provider so it survives the
  // remount a save's revalidate triggers (Roland 2026-06-11).
  const flashSaved = useSavedFlash();
  const who = patient.firstName;

  useEffect(() => setReady(true), []);
  // Applying a layout from the menu restores any maximised card to the split.
  useEffect(() => {
    setLeftMode("split");
    setRightMode("split");
  }, [layout]);

  // The layout is the USER'S — it never moves on its own (APPROVALS §4.2).
  // Manual maximise is the only per-card override, and it's deliberate too.
  const leftTop =
    leftMode === "top" ? 0.85 : leftMode === "bottom" ? 0.22 : layout.splitLeft;
  const rightTop =
    rightMode === "top" ? 0.85 : rightMode === "bottom" ? 0.25 : layout.splitRight;
  const dur = ready && !dragging ? "duration-300" : "duration-0";
  const grow = (n: number) => ({ flexGrow: n * 100, flexBasis: 0 });

  // ── Divider drag (lg+ only — stacked layouts have no dividers). WINDOW-level
  // move/up listeners from pointerdown to release (Roland 2026-07-03 — the
  // capture-based version could go dead on some dividers/browsers; window
  // listeners track everywhere, robustly). The vertical divider re-balances the
  // columns; each column's horizontal divider drives ITS OWN split (Roland
  // 2026-07-04). Double-click resets to Default.
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  function startDrag(kind: "col" | "splitLeft" | "splitRight", e: React.PointerEvent) {
    e.preventDefault();
    setDragging(kind);
    const colEl = (e.currentTarget as HTMLElement).closest("[data-col]");
    const onMove = (ev: PointerEvent) => {
      if (kind === "col") {
        const rect = rowRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0) return;
        setLayout({ ...layoutRef.current, col: (ev.clientX - rect.left) / rect.width });
      } else {
        // INDEPENDENT splits (Roland 2026-07-04): each column's divider moves
        // ONLY its own column — Scribe scrolls up without dragging RolDe along.
        const rect = colEl?.getBoundingClientRect();
        if (!rect || rect.height === 0) return;
        setLayout({ ...layoutRef.current, [kind]: (ev.clientY - rect.top) / rect.height });
      }
    };
    const onUp = () => {
      setDragging(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }
  const resetLayout = () => setLayout(DEFAULT_LAYOUT);

  // Card visibility — TWO layers (APPROVALS §4.2). The CLINIC's Clinical
  // Modules (W1.1) decide which cards exist at all; the user's Layouts card
  // toggles (Roland 2026-07-03) hide within that. Scribe is always on. A
  // hidden card hands its space to its column-mate; both right cards gone →
  // the right column goes entirely.
  const hidden = new Set(layout.hidden);
  const showNotes = !hidden.has("notes");
  const showWorkup = workupEnabled(modules) && !hidden.has("workup");
  const showAi = modules.rolde_ai_enabled && !hidden.has("ai");
  const showRight = showWorkup || showAi;

  const mode: "new" | "edit" | "amend" = !editTarget
    ? "new"
    : editTarget.locked
      ? "amend"
      : "edit";

  function handleEdit(e: FeedEntry) {
    setTemplate(null);
    setAnswers({});
    const locked = Date.now() - new Date(e.created_at).getTime() > EDIT_WINDOW_MS;
    const original = e.payload?.text ?? "";
    setEditTarget({ id: e.id, original, locked });
    setDraft(locked ? "" : original);
    setStrikeOriginal(false);
  }

  function discard() {
    setDraft("");
    setEditTarget(null);
    setStrikeOriginal(false);
    setTemplate(null);
    setAnswers({});
  }

  const templateDirty = !!template && templateHasAnswers(template, answers);

  // Vital Signs AUTO-POPULATE (Roland 2026-07-04): picking a template seeds
  // its vitals part from the patient's LATEST recorded vital_signs entry
  // (canonical keys bp/hr/temp/spo2/rr/weight — W1.2.7 Vitals writes the same
  // shape, so this gets richer for free when it lands). Editable after seeding.
  function prefillFor(t: ScribeTemplate): TemplateAnswers {
    const latest = [...feedEntries].reverse().find((e) => e.entry_type === "vital_signs");
    const pay = latest?.payload as Record<string, unknown> | null | undefined;
    const seeded: TemplateAnswers = {};
    if (pay) {
      t.parts.forEach((part, i) => {
        if (part.kind === "vitals")
          seeded[i] = VITALS_FIELDS.map((f) => String(pay[f.key] ?? ""));
      });
    }
    return seeded;
  }

  async function submit() {
    const usingTemplate = mode === "new" && !!template;
    if ((usingTemplate ? !templateDirty : !draft.trim()) || pending) return;
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("patient_id", patient.id);
      if (mode === "new") {
        fd.set("text", usingTemplate ? renderTemplate(template, answers) : draft);
        await saveNote(fd);
      } else if (mode === "edit") {
        fd.set("entry_id", editTarget!.id);
        fd.set("text", draft);
        await editNote(fd);
      } else {
        if (strikeOriginal) {
          const sf = new FormData();
          sf.set("entry_id", editTarget!.id);
          sf.set("patient_id", patient.id);
          sf.set("strike", "true");
          await strikeNote(sf);
        }
        fd.set("parent_id", editTarget!.id);
        fd.set("text", draft);
        await amendNote(fd);
      }
      discard();
      flashSaved(`RolDe saved this to ${who}’s record.`);
    } finally {
      setPending(false);
    }
  }

  const composerTitle =
    mode === "edit"
      ? "Editing note"
      : mode === "amend"
        ? "Amending note"
        : template
          ? `${COMPOSER_NAME} · ${template.name}`
          : COMPOSER_NAME;
  const saveLabel =
    mode === "edit" ? "Save edit" : mode === "amend" ? "Save amendment" : "Save note";

  // Conversational bottom save bar (Roland 2026-06-11). It SPEAKS — "RolDe has
  // a note ready for Sarah's record" → "RolDe saved this to Sarah's record."
  usePageActionBar({
    dirty: (template ? templateDirty : !!draft.trim()) && !pending,
    saving: pending,
    message:
      mode === "edit"
        ? `You’re editing a note in ${who}’s record.`
        : mode === "amend"
          ? `You’re amending a note in ${who}’s record.`
          : template
            ? `RolDe has a ${template.name} ready for ${who}’s record.`
            : `RolDe has a note ready for ${who}’s record.`,
    saveLabel,
    onSave: submit,
    onDiscard: editTarget || draft ? discard : undefined,
    // Scribe owns its in-card Save/Discard buttons; the bar keeps only the
    // nav guard + the conversational confirmation (no pinned Save).
    pinned: false,
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:overflow-hidden">
        <div ref={rowRef} className="flex flex-col gap-3 lg:h-full lg:flex-row lg:gap-0">
          {/* Left column */}
          <div data-col className="flex flex-col gap-3 lg:min-h-0 lg:gap-0" style={grow(showRight ? layout.col : 1)}>
            {/* Clinical Notes */}
            {showNotes && (
            <section
              style={grow(leftTop)}
              className={cn(
                "flex min-h-[55vh] flex-col overflow-hidden rounded-2xl bg-card shadow-float transition-[flex-grow] ease-out lg:min-h-[140px]",
                dur,
              )}
            >
              <ClinicalNotesFeed
                entries={feedEntries}
                authors={authors}
                currentUserId={currentUserId}
                reads={reads}
                maximized={leftMode === "top"}
                onToggleMaximize={() =>
                  setLeftMode((m) => (m === "top" ? "split" : "top"))
                }
                onEditNote={handleEdit}
                activeId={editTarget?.id ?? null}
              />
            </section>
            )}

            {/* The left column's OWN divider — moves Notes/Scribe only;
                double-click = Default (APPROVALS §4.2). */}
            {showNotes && (
            <div
              onPointerDown={(e) => startDrag("splitLeft", e)}
              onDoubleClick={resetLayout}
              title="Drag to resize · double-click for Default"
              className="group hidden shrink-0 cursor-row-resize touch-none items-center justify-center lg:flex lg:h-4"
            >
              <div className="h-1.5 w-16 rounded-full bg-foreground/15 transition-colors group-hover:bg-foreground/35" />
            </div>
            )}

            {/* Composer — borderless, the whole white space; Save + Discard */}
            <section
              style={grow(showNotes ? 1 - leftTop : 1)}
              className={cn(
                "flex min-h-[220px] flex-col overflow-hidden rounded-2xl bg-card shadow-float transition-[flex-grow] ease-out lg:min-h-[92px]",
                dur,
              )}
            >
              <div className="glass sticky top-0 z-10 flex items-center gap-2 px-4 py-2.5">
                <CardIcon icon={PenLine} tone="brand" variant="badge" size="sm" />
                <span className="text-sm font-semibold">{composerTitle}</span>
                <SectionExplainer
                  label="Scribe"
                  description="Where you write. New notes, edits and amendments all happen here — the card adapts to what you're doing."
                  terms={[
                    { term: "New note", definition: "Type and Save — it lands in Clinical Notes, stamped with your role." },
                    { term: "Edit", definition: "Within 1 hour of writing, your note loads here fully editable." },
                    { term: "Amend", definition: "After an hour the note locks; add an amendment and optionally strike the original (it's never deleted)." },
                  ]}
                />
                {/* RolDe Scribe Templates (T1): the picker lives IN Scribe's
                    header — never a separate page (Roland 2026-07-04). */}
                {mode === "new" && (
                  <div className="ml-auto">
                    <button
                      ref={setPickerBtn}
                      onClick={() => setPickerOpen((v) => !v)}
                      className="flex h-7 items-center gap-1 rounded-lg bg-card px-2 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow"
                    >
                      <LayoutTemplate className="size-3.5" />
                      {template ? template.name : "Template"}
                      <ChevronDown className={cn("size-3 transition-transform", pickerOpen && "rotate-180")} />
                    </button>
                    {/* PORTALED (AnchoredPopover) — Scribe is overflow-hidden;
                        the in-card version clipped (Roland 2026-07-04). */}
                    <AnchoredPopover
                      anchor={pickerBtn}
                      open={pickerOpen}
                      onClose={() => setPickerOpen(false)}
                      width={264}
                    >
                        <button
                          onClick={() => {
                            setTemplate(null);
                            setAnswers({});
                            setPickerOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-hover",
                            !template ? "font-medium text-foreground" : "text-muted-foreground",
                          )}
                        >
                          <X className="size-3.5" /> Blank Note
                        </button>
                        {[...new Set(ROLDE_TEMPLATE_LIBRARY.map((t) => t.specialty))].map(
                          (spec) => (
                            <div key={spec}>
                              <p className="px-2.5 pb-0.5 pt-2 text-xs font-semibold tracking-wide text-foreground uppercase">
                                {spec}
                              </p>
                              {ROLDE_TEMPLATE_LIBRARY.filter((t) => t.specialty === spec).map(
                                (t) => (
                                  <button
                                    key={t.id}
                                    onClick={() => {
                                      setTemplate(t);
                                      setAnswers(prefillFor(t));
                                      setDraft("");
                                      setPickerOpen(false);
                                    }}
                                    className={cn(
                                      "flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-hover",
                                      template?.id === t.id
                                        ? "font-medium text-foreground"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {t.name}
                                  </button>
                                ),
                              )}
                            </div>
                          ),
                        )}
                    </AnchoredPopover>
                  </div>
                )}
                <button
                  onClick={() =>
                    setLeftMode((m) => (m === "bottom" ? "split" : "bottom"))
                  }
                  title={leftMode === "bottom" ? "Restore" : "Expand"}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow",
                    mode !== "new" && "ml-auto",
                  )}
                >
                  {leftMode === "bottom" ? (
                    <Minimize2 className="size-4" />
                  ) : (
                    <Maximize2 className="size-4" />
                  )}
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col px-4 pb-3">
                {mode === "amend" && (
                  <div className="mb-2 rounded-lg bg-muted/50 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Original (locked after 1 hour)
                      </span>
                      <button
                        onClick={() => setStrikeOriginal((v) => !v)}
                        className={cn(
                          "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition-colors hover:bg-hover",
                          strikeOriginal ? "text-warning" : "text-muted-foreground",
                        )}
                      >
                        <Strikethrough className="size-3.5" />
                        {strikeOriginal ? "Will strike" : "Strike out"}
                      </button>
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-sm",
                        strikeOriginal && "text-muted-foreground line-through",
                      )}
                    >
                      {editTarget?.original}
                    </p>
                  </div>
                )}
                {/* No focus-grow: the layout NEVER moves on its own — typing
                    included (APPROVALS §4.2, Roland 2026-07-01). */}
                {mode === "new" && template ? (
                  <ScribeTemplateForm
                    template={template}
                    answers={answers}
                    onChange={(i, v) => setAnswers((a) => ({ ...a, [i]: v }))}
                  />
                ) : (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    mode === "amend"
                      ? "Amendment…"
                      : `Note for ${patient.firstName}…`
                  }
                  className="min-h-0 w-full flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                )}
                <div className="flex shrink-0 items-center justify-end gap-2 pt-1">
                  {(editTarget || draft || template) && (
                    <Button variant="ghost" size="sm" onClick={discard}>
                      Discard
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={submit}
                    disabled={pending || (template && mode === "new" ? !templateDirty : !draft.trim())}
                  >
                    {saveLabel}
                  </Button>
                </div>
              </div>
            </section>
          </div>

          {/* The column divider — drag to re-balance left/right; double-click
              = Default. */}
          {showRight && (
          <div
            onPointerDown={(e) => startDrag("col", e)}
            onDoubleClick={resetLayout}
            title="Drag to resize · double-click for Default"
            className="group hidden shrink-0 cursor-col-resize touch-none items-center justify-center lg:flex lg:w-4"
          >
            <div className="h-16 w-1.5 rounded-full bg-foreground/15 transition-colors group-hover:bg-foreground/35" />
          </div>
          )}

          {/* Right column */}
          {showRight && (
          <div data-col className="flex flex-col gap-3 lg:min-h-0 lg:gap-0" style={grow(1 - layout.col)}>
            {showWorkup && (
            <section
              style={grow(showAi ? rightTop : 1)}
              className={cn(
                "flex min-h-[40vh] flex-col overflow-hidden rounded-2xl bg-card shadow-float transition-[flex-grow] ease-out lg:min-h-[140px]",
                dur,
              )}
            >
              <WorkupPanel
                entries={workupEntries}
                modules={modules}
                maximized={rightMode === "top"}
                onToggleMaximize={() =>
                  setRightMode((m) => (m === "top" ? "split" : "top"))
                }
              />
            </section>
            )}

            {/* The right column's OWN divider (independent of the left). */}
            {showWorkup && showAi && (
            <div
              onPointerDown={(e) => startDrag("splitRight", e)}
              onDoubleClick={resetLayout}
              title="Drag to resize · double-click for Default"
              className="group hidden shrink-0 cursor-row-resize touch-none items-center justify-center lg:flex lg:h-4"
            >
              <div className="h-1.5 w-16 rounded-full bg-foreground/15 transition-colors group-hover:bg-foreground/35" />
            </div>
            )}

            {showAi && (
            <section
              style={grow(showWorkup ? 1 - rightTop : 1)}
              className={cn(
                "flex min-h-[200px] flex-col overflow-hidden rounded-2xl bg-card shadow-float transition-[flex-grow] ease-out lg:min-h-[92px]",
                dur,
              )}
            >
              <AiPanel />
            </section>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
