"use client";

import { useState, useEffect, useRef } from "react";
import { PenLine, Maximize2, Minimize2, Strikethrough, LayoutTemplate, ChevronDown, X, PersonStanding } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardIcon } from "@/components/ui/CardIcon";
import { SectionExplainer } from "@/components/ui/SectionExplainer";
import { WorkupPanel } from "@/components/WorkupPanel";
import { AiPanel } from "@/components/AiPanel";
import {
  ClinicalNotesFeed,
  type FeedEntry,
  type Author,
  type CourierDispatchTrail,
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
  saveBodyMap,
} from "@/app/(app)/patients/actions";
import { ScribeTemplateForm } from "@/components/consultation/ScribeTemplateForm";
import {
  ROLDE_TEMPLATE_LIBRARY,
  VITALS_FIELDS,
  defaultTempUnit,
  renderTemplate,
  templateHasAnswers,
  templateAnswersValid,
  type ScribeTemplate,
  type TemplateAnswers,
} from "@/lib/scribeTemplates";
import { AnchoredPopover } from "@/components/ui/AnchoredPopover";
import { BodyMapPanel } from "@/components/consultation/BodyMapPanel";
import {
  renderBodyMapText,
  bodyMapHasContent,
  type BodyMapData,
} from "@/lib/bodyMap";
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

type EditTarget = {
  id: string;
  original: string;
  locked: boolean;
  /** true = someone ELSE's note → the entry becomes an ADDENDUM (clinical
   *  records law, Roland 2026-07-04: same author after the hour = amendment;
   *  a different author = addendum, any time). */
  foreign: boolean;
} | null;

export function ConsultationWorkspace({
  patient,
  feedEntries,
  workupEntries,
  authors,
  currentUserId,
  reads,
  dispatches = [],
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
  /** Courier C3 — each letter's dispatch journey, for the Status Trail. */
  dispatches?: CourierDispatchTrail[];
  /** Clinical Modules (W1.1, APPROVALS §4.2) — the CLINIC's switches; the grid
   *  reflows 4/3/2. Sits OVER the user's Layouts card toggles. */
  modules?: ClinicalModules;
}) {
  const { layout, setLayout, patient: topbarPatient } = useTopbar();
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
  // Body-Map v2 (greenlit 2026-07-04) — a Scribe MODE (APPROVALS §4.3: the
  // one sanctioned automatic move is Scribe expanding for the map).
  const [bodyMap, setBodyMap] = useState<BodyMapData | null>(null);
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

  const mode: "new" | "edit" | "amend" | "addendum" = !editTarget
    ? "new"
    : editTarget.foreign
      ? "addendum"
      : editTarget.locked
        ? "amend"
        : "edit";

  function handleEdit(e: FeedEntry) {
    setTemplate(null);
    setAnswers({});
    setBodyMap(null);
    const locked = Date.now() - new Date(e.created_at).getTime() > EDIT_WINDOW_MS;
    const foreign = !!currentUserId && e.created_by !== currentUserId;
    const original = e.payload?.text ?? "";
    setEditTarget({ id: e.id, original, locked, foreign });
    setStrikeOriginal(false);
    // A template-authored note restores its FORM within the edit window
    // (Roland 2026-07-04: "it did not load back the SOAP for me to edit") —
    // the saved answers ride the payload. Unknown template id → plain text.
    const meta = e.payload?.template;
    const t = meta ? ROLDE_TEMPLATE_LIBRARY.find((x) => x.id === meta.id) : undefined;
    if (!locked && !foreign && meta && t) {
      setTemplate(t);
      setAnswers(meta.answers ?? {});
      setDraft("");
    } else {
      setDraft(locked ? "" : original);
    }
  }

  function discard() {
    setDraft("");
    setEditTarget(null);
    setStrikeOriginal(false);
    setTemplate(null);
    setAnswers({});
    setBodyMap(null);
    setLeftMode("split");
  }

  const templateDirty = !!template && templateHasAnswers(template, answers);
  // Implausible vitals BLOCK Save (structural safety, Roland 2026-07-04).
  const templateValid = !template || templateAnswersValid(template, answers);
  const mapDirty = !!bodyMap && bodyMapHasContent(bodyMap);

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
    const usingTemplate = (mode === "new" || mode === "edit") && !!template;
    const usingMap = mode === "new" && !!bodyMap;
    if (
      (usingMap
        ? !mapDirty
        : usingTemplate
          ? !templateDirty || !templateValid
          : !draft.trim()) ||
      pending
    )
      return;
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("patient_id", patient.id);
      if (usingMap) {
        fd.set("text", renderBodyMapText(bodyMap));
        fd.set("body_map", JSON.stringify(bodyMap));
        await saveBodyMap(fd);
      } else if (mode === "new") {
        fd.set("text", usingTemplate ? renderTemplate(template, answers) : draft);
        if (usingTemplate)
          fd.set("template_meta", JSON.stringify({ id: template.id, answers }));
        await saveNote(fd);
      } else if (mode === "edit") {
        fd.set("entry_id", editTarget!.id);
        fd.set("text", usingTemplate ? renderTemplate(template, answers) : draft);
        if (usingTemplate)
          fd.set("template_meta", JSON.stringify({ id: template.id, answers }));
        await editNote(fd);
      } else {
        // Amendment (own, locked) may strike the original; an ADDENDUM never
        // touches someone else's original (author-only, RLS-enforced too).
        if (strikeOriginal && mode === "amend") {
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
      ? template
        ? `Editing · ${template.name}`
        : "Editing note"
      : mode === "addendum"
        ? "Adding addendum"
        : mode === "amend"
          ? "Amending note"
        : bodyMap
          ? `${COMPOSER_NAME} · Body Map`
          : template
            ? `${COMPOSER_NAME} · ${template.name}`
            : COMPOSER_NAME;
  const saveLabel =
    mode === "edit"
      ? "Save edit"
      : mode === "amend"
        ? "Save amendment"
        : mode === "addendum"
          ? "Save addendum"
          : bodyMap
            ? "Save body map"
            : "Save note";

  // Conversational bottom save bar (Roland 2026-06-11). It SPEAKS — "RolDe has
  // a note ready for Sarah's record" → "RolDe saved this to Sarah's record."
  usePageActionBar({
    dirty: (bodyMap ? mapDirty : template ? templateDirty : !!draft.trim()) && !pending,
    saving: pending,
    message:
      mode === "edit"
        ? `You’re editing a note in ${who}’s record.`
        : mode === "addendum"
          ? `You’re adding an addendum to a colleague’s note in ${who}’s record.`
          : mode === "amend"
            ? `You’re amending a note in ${who}’s record.`
          : bodyMap
            ? `RolDe has a body map ready for ${who}’s record.`
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
                // MOBILE expand (Roland 2026-07-04): stacked cards grow by
                // min-height — flex-grow has no track to fill below lg.
                leftMode === "top" && "min-h-[80dvh] lg:min-h-[140px]",
                dur,
              )}
            >
              <ClinicalNotesFeed
                entries={feedEntries}
                authors={authors}
                currentUserId={currentUserId}
                reads={reads}
                dispatches={dispatches}
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
                leftMode === "bottom" && "min-h-[75dvh] lg:min-h-[92px]",
                dur,
              )}
            >
              <div className="glass sticky top-0 z-10 flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5">
                <CardIcon icon={PenLine} tone="brand" variant="badge" size="sm" />
                <span className="min-w-0 truncate text-sm font-semibold">{composerTitle}</span>
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
                {mode === "new" && !bodyMap && (
                  <div className="ml-auto">
                    <button
                      ref={setPickerBtn}
                      onClick={() => setPickerOpen((v) => !v)}
                      className="flex h-7 items-center gap-1 rounded-lg bg-card px-2 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow"
                    >
                      <LayoutTemplate className="size-3.5" />
                      <span className={cn(!template && "hidden sm:inline")}>
                        {template ? template.name : "Template"}
                      </span>
                      <ChevronDown className={cn("size-3 transition-transform", pickerOpen && "rotate-180")} />
                    </button>
                    {/* PORTALED (AnchoredPopover) — Scribe is overflow-hidden;
                        the in-card version clipped (Roland 2026-07-04). */}
                    <AnchoredPopover
                      anchor={pickerBtn}
                      open={pickerOpen}
                      onClose={() => setPickerOpen(false)}
                      width={264}
                      icon={LayoutTemplate}
                      title="Templates"
                      subtitle="The curated RolDe library"
                      tone="periwinkle"
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
                {mode === "new" && (
                  <button
                    onClick={() => {
                      if (bodyMap) {
                        setBodyMap(null);
                        setLeftMode("split");
                      } else {
                        setTemplate(null);
                        setAnswers({});
                        setBodyMap({ view: "anterior", pins: [], strokes: [] });
                        // The ONE sanctioned automatic move (APPROVALS §4.2):
                        // opening the Body-Map expands Scribe — user-initiated.
                        setLeftMode("bottom");
                      }
                    }}
                    className={cn(
                      "flex h-7 items-center gap-1 rounded-lg bg-card px-2 text-xs font-medium shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:shadow",
                      bodyMap
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                      !bodyMap && "ml-1",
                    )}
                  >
                    <PersonStanding className="size-3.5" />
                    <span className={cn(!bodyMap && "hidden sm:inline")}>
                      {bodyMap ? "Close Body Map" : "Body Map"}
                    </span>
                  </button>
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
                {(mode === "amend" || mode === "addendum") && (
                  <div className="mb-2 rounded-lg bg-muted/50 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {mode === "addendum"
                          ? "A colleague’s note — your addendum attaches beneath it"
                          : "Original (locked after 1 hour)"}
                      </span>
                      {mode === "amend" && (
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
                      )}
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-sm whitespace-pre-wrap",
                        strikeOriginal && "text-muted-foreground line-through",
                      )}
                    >
                      {editTarget?.original}
                    </p>
                  </div>
                )}
                {/* No focus-grow: the layout NEVER moves on its own — typing
                    included (APPROVALS §4.2, Roland 2026-07-01). */}
                {mode === "new" && bodyMap ? (
                  <BodyMapPanel data={bodyMap} onChange={setBodyMap} />
                ) : (mode === "new" || mode === "edit") && template ? (
                  <ScribeTemplateForm
                    template={template}
                    answers={answers}
                    onChange={(i, v) => setAnswers((a) => ({ ...a, [i]: v }))}
                    tempUnit={defaultTempUnit(topbarPatient?.clinicCountry)}
                  />
                ) : (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    mode === "amend"
                      ? "Amendment…"
                      : mode === "addendum"
                        ? "Addendum…"
                        : `Note for ${patient.firstName}…`
                  }
                  className="min-h-0 w-full flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                )}
                <div className="flex shrink-0 items-center justify-end gap-2 pt-1">
                  {(editTarget || draft || template || bodyMap) && (
                    <Button variant="ghost" size="sm" onClick={discard}>
                      Discard
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={submit}
                    disabled={
                      pending ||
                      (bodyMap && mode === "new"
                        ? !mapDirty
                        : template
                          ? !templateDirty || !templateValid
                          : !draft.trim())
                    }
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
                rightMode === "top" && "min-h-[80dvh] lg:min-h-[140px]",
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
                rightMode === "bottom" && "min-h-[75dvh] lg:min-h-[92px]",
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
