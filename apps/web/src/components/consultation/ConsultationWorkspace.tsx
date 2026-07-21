"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { PenLine, Maximize2, Minimize2, Strikethrough, LayoutTemplate, ChevronDown, X, PersonStanding, Pencil, Plus, Zap, Type, List, ListOrdered, IndentIncrease, IndentDecrease, RemoveFormatting } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardIcon } from "@/components/ui/CardIcon";
import { CARD_ICON_TEXT } from "@/lib/cardTones";
import { SectionExplainer } from "@/components/ui/SectionExplainer";
import { WorkupPanel } from "@/components/WorkupPanel";
import { AiPanel } from "@/components/AiPanel";
import {
  ClinicalNotesFeed,
  LETTER_KINDS,
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
  sanitiseParts,
  type ScribeTemplate,
  type TemplateAnswers,
} from "@/lib/scribeTemplates";
import { TemplateBuilder } from "@/components/consultation/TemplateBuilder";
import {
  listClinicTemplates,
  listMyShortcuts,
  getBodymapLegend,
  type ClinicTemplate,
  type AutotextShortcut,
} from "@/app/(app)/patients/templateActions";
import { ShortcutsManager } from "@/components/consultation/ShortcutsManager";
import { FormSendSheet } from "@/components/consultation/FormSendSheet";
import { CourierMenu, type UnsentLetter } from "@/components/consultation/CourierMenu";
import { CourierSendSheet } from "@/components/consultation/CourierSendSheet";
import { PhotoCaptureButton } from "@/components/consultation/PhotoCaptureButton";
import { type NotePhoto } from "@/components/consultation/NotePhotoGallery";
import {
  attachPhotosToEntry,
  discardStagedPhotos,
  type PatientPhoto,
} from "@/app/(app)/patients/photoActions";
import { formatDay } from "@/lib/dates";
import { expandAutotext } from "@/lib/autotext";
import { continueListOnEnter } from "@/lib/calmFormatting";
import { RichNoteEditor, MarkGlyph, type RichNoteHandle, type LineOp } from "@/components/consultation/RichNoteEditor";
import { sanitizeMarks, HIGHLIGHT_COLOURS, type NoteMark, type MarkKind } from "@/lib/richText";
import { AnchoredPopover } from "@/components/ui/AnchoredPopover";
import { BodyMapPanel } from "@/components/consultation/BodyMapPanel";
import {
  renderBodyMapText,
  bodyMapHasContent,
  type BodyMapData,
  type BodymapLegendNames,
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

/** An instant hover label for the Scribe header icons (Roland 2026-07-21:
 *  native `title` is slow / absent). Renders BELOW the chip (never clipped at
 *  the card's top); `align` keeps the rightmost chips inside the card edge.
 *  The parent button must carry `relative group/tip`. */
function ChipTip({ label, align = "center" }: { label: string; align?: "center" | "right" }) {
  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute top-[calc(100%+7px)] z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background opacity-0 shadow-md transition-opacity duration-100 group-hover/tip:opacity-100",
        align === "right" ? "right-0" : "left-1/2 -translate-x-1/2",
      )}
    >
      {label}
    </span>
  );
}

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
  photosByEntry = {},
  canManageTemplates = false,
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
  /** Photo M2 — each note's attached before/after photos (signed URLs). */
  photosByEntry?: Record<string, NotePhoto[]>;
  /** Roland's governance ruling (2026-07-13): only the Caretaker designs
   *  clinic templates — gates the builder's entry points (server re-checks). */
  canManageTemplates?: boolean;
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
  // B6 — the free note's inline formatting (sidecar marks over `draft`).
  const [draftMarks, setDraftMarks] = useState<NoteMark[]>([]);
  // The rich editor is UNCONTROLLED, so clearing `draft` alone won't wipe its
  // DOM — bump this on discard/after-save and it's in the editor's docKey, so
  // the editor remounts empty (Roland 2026-07-21: "Scribe still held the text").
  const [editorNonce, setEditorNonce] = useState(0);
  // Photo M2 — photos captured for the note being written; attached to the
  // Clinical Note on Save, discarded (soft-deleted) if the draft is dropped.
  const [stagedPhotos, setStagedPhotos] = useState<PatientPhoto[]>([]);
  // RolDe Scribe Templates T1 (GREENLIT 2026-07-04): pick from the curated
  // library → Scribe MORPHS into the structured form in place; Save renders
  // the answers into a clean readable note. New notes only (edit/amend stay
  // verbatim text).
  const [template, setTemplate] = useState<ScribeTemplate | null>(null);
  const [answers, setAnswers] = useState<TemplateAnswers>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerBtn, setPickerBtn] = useState<HTMLElement | null>(null);
  // Scribe T2 — the CLINIC's templates (Caretaker-designed, team-filled) +
  // the builder sheet. Loaded the first time the picker opens; refreshed
  // after every builder save.
  const [clinicTemplates, setClinicTemplates] = useState<ClinicTemplate[]>([]);
  const [clinicLoaded, setClinicLoaded] = useState(false);
  const [builder, setBuilder] = useState<{ open: boolean; editing: ClinicTemplate | null }>({
    open: false,
    editing: null,
  });
  useEffect(() => {
    if (!pickerOpen || clinicLoaded) return;
    setClinicLoaded(true);
    void listClinicTemplates().then((r) => {
      if (r.ok) setClinicTemplates(r.data);
    });
  }, [pickerOpen, clinicLoaded]);
  // Scribe T2.5 — the writer's PERSONAL autotext (".sn" + space → their
  // sentence). Loaded once on mount; the manager hands back fresh lists.
  const [shortcuts, setShortcuts] = useState<AutotextShortcut[]>([]);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  // B2 — the COURIER door (Scribe header): both send sheets anchor to it.
  // T4 form sends ride the library rail; C3 letter sends ride the authored rail.
  const [formSheet, setFormSheet] = useState<{ open: boolean; anchor: HTMLElement | null }>({
    open: false,
    anchor: null,
  });
  const [letterSheet, setLetterSheet] = useState<{
    open: boolean;
    anchor: HTMLElement | null;
    entryId: string | null;
  }>({ open: false, anchor: null, entryId: null });
  // The authored rail's queue: letters in this feed with no dispatch yet.
  const unsentLetters = useMemo<UnsentLetter[]>(
    () =>
      feedEntries
        .filter(
          (e) =>
            e.entry_type in LETTER_KINDS &&
            !dispatches.some((d) => d.entry_id === e.id),
        )
        .map((e) => ({
          id: e.id,
          label: LETTER_KINDS[e.entry_type],
          when: formatDay(e.created_at),
        }))
        .reverse(),
    [feedEntries, dispatches],
  );
  // T3 — the clinic's colour legend: names print on the record + label the
  // annotator's swatches.
  const [legend, setLegend] = useState<BodymapLegendNames>({});
  useEffect(() => {
    void listMyShortcuts().then((r) => {
      if (r.ok) setShortcuts(r.data);
    });
    void getBodymapLegend().then((r) => {
      if (r.ok) setLegend(r.data);
    });
  }, []);
  /** Expansion for any Scribe-owned text surface: returns the next value and
   *  restores the caret after React re-renders. */
  const withAutotext = useCallback(
    (el: HTMLTextAreaElement | HTMLInputElement, apply: (v: string) => void) => {
      const hit = expandAutotext(el.value, el.selectionStart ?? el.value.length, shortcuts);
      if (!hit) {
        apply(el.value);
        return;
      }
      apply(hit.value);
      requestAnimationFrame(() => el.setSelectionRange(hit.caret, hit.caret));
    },
    [shortcuts],
  );
  // T2.5b — the SNIPPET MENU (Roland 2026-07-21: "people may forget the
  // shortcuts… add this as a dropdown too"): the Zap chip lists the saved
  // snippets; a click INSERTS at the caret of the last-focused Scribe field.
  // The insert drives the element's native setter + an input event, so it
  // flows through React's own onChange — every field, present or future,
  // works with zero per-field wiring.
  const [snippetBtn, setSnippetBtn] = useState<HTMLElement | null>(null);
  const [snippetsMenuOpen, setSnippetsMenuOpen] = useState(false);
  // B6.2 — the Format panel (one header chip → the full rich-text palette).
  const [formatBtn, setFormatBtn] = useState<HTMLElement | null>(null);
  const [formatOpen, setFormatOpen] = useState(false);
  // Chips collapse to ICONS when the Scribe header is narrow (Roland 2026-07-21)
  // — measured on the CARD, not the viewport (a ResizeObserver, since Turbopack
  // wasn't emitting the container-query utilities here).
  const scribeHeaderRef = useRef<HTMLDivElement | null>(null);
  const [chipsWide, setChipsWide] = useState(true);
  useEffect(() => {
    const el = scribeHeaderRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      // Five labelled chips + title + expand need ~660px to sit on one line;
      // below that, collapse to icons so the header never wraps.
      for (const e of entries) setChipsWide(e.contentRect.width >= 660);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const lastTextRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  // B6 — the free-note editor (contentEditable). A snippet insert routes here
  // when the rich editor was the last-focused Scribe surface, else to the
  // last-focused template input.
  const richRef = useRef<RichNoteHandle | null>(null);
  const lastWasRichRef = useRef(false);
  const trackFocus = useCallback((e: React.FocusEvent) => {
    const t = e.target as HTMLElement;
    if (
      t instanceof HTMLTextAreaElement ||
      (t instanceof HTMLInputElement && (t.type === "text" || t.type === ""))
    ) {
      lastTextRef.current = t;
      lastWasRichRef.current = false;
    }
  }, []);
  const insertSnippet = useCallback((expansion: string) => {
    // Prefer the rich note editor when it was last active; else a template input.
    if (lastWasRichRef.current && richRef.current) {
      richRef.current.insertText(expansion);
      return;
    }
    const el = lastTextRef.current;
    if (el && document.contains(el)) {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? start;
      const next = el.value.slice(0, start) + expansion + el.value.slice(end);
      const proto =
        el instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, next);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      const caret = start + expansion.length;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(caret, caret);
      });
      return;
    }
    // No input in play → the free note.
    richRef.current?.insertText(expansion);
  }, []);
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
    // the saved answers ride the payload. T2: the payload's parts SNAPSHOT is
    // the first truth (personal templates + library notes alike); the library
    // lookup remains for pre-snapshot notes. Unknown → plain text.
    const meta = e.payload?.template;
    const snapParts = meta?.parts ? sanitiseParts(meta.parts) : null;
    const t = snapParts
      ? { id: meta!.id, name: meta!.name ?? "Template", specialty: "", parts: snapParts }
      : meta
        ? ROLDE_TEMPLATE_LIBRARY.find((x) => x.id === meta.id)
        : undefined;
    if (!locked && !foreign && meta && t) {
      setTemplate(t);
      setAnswers(meta.answers ?? {});
      setDraft("");
      setDraftMarks([]);
    } else {
      setDraft(locked ? "" : original);
      // B6 — the note's own inline formatting loads back for editing.
      setDraftMarks(locked ? [] : sanitizeMarks(e.payload?.format_marks, original.length));
    }
  }

  // Clear the composer WITHOUT touching staged photos (used after a save, when
  // the photos have already been attached to the new note).
  function resetComposer() {
    setDraft("");
    setDraftMarks([]);
    setStagedPhotos([]);
    setEditTarget(null);
    setStrikeOriginal(false);
    setTemplate(null);
    setAnswers({});
    setBodyMap(null);
    setLeftMode("split");
    setEditorNonce((n) => n + 1); // remount the uncontrolled editor empty
  }

  function discard() {
    // Photos staged for a DROPPED draft are soft-deleted (never orphaned).
    if (stagedPhotos.length)
      void discardStagedPhotos(stagedPhotos.map((p) => p.id), patient.id);
    resetComposer();
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
          : // a free note saves with text OR with staged photos (a photo note)
            !draft.trim() && stagedPhotos.length === 0) ||
      pending
    )
      return;
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("patient_id", patient.id);
      if (usingMap) {
        fd.set("text", renderBodyMapText(bodyMap, legend));
        fd.set("body_map", JSON.stringify(bodyMap));
        await saveBodyMap(fd);
      } else if (mode === "new") {
        fd.set("text", usingTemplate ? renderTemplate(template, answers, legend) : draft);
        // T2: the template's NAME + PARTS ride the payload as a snapshot — the
        // note renders structured forever, even if the template is later
        // edited or removed (a clinical record never depends on a live lookup).
        if (usingTemplate)
          fd.set(
            "template_meta",
            JSON.stringify({ id: template.id, name: template.name, parts: template.parts, answers }),
          );
        // B6 — a free note's inline formatting (sidecar marks over the text).
        else if (draftMarks.length) fd.set("marks", JSON.stringify(draftMarks));
        // Photo M2 — let a photos-only note save (empty text is fine) and
        // attach the staged photos to it once it's created.
        fd.set("photo_count", String(stagedPhotos.length));
        const res = await saveNote(fd);
        if (res?.id && stagedPhotos.length)
          await attachPhotosToEntry(stagedPhotos.map((p) => p.id), res.id, patient.id);
      } else if (mode === "edit") {
        fd.set("entry_id", editTarget!.id);
        fd.set("text", usingTemplate ? renderTemplate(template, answers, legend) : draft);
        if (usingTemplate)
          fd.set(
            "template_meta",
            JSON.stringify({ id: template.id, name: template.name, parts: template.parts, answers }),
          );
        else fd.set("marks", JSON.stringify(draftMarks));
        await editNote(fd);
        // Photo M2 — new photos added while editing attach to THIS note.
        if (stagedPhotos.length)
          await attachPhotosToEntry(stagedPhotos.map((p) => p.id), editTarget!.id, patient.id);
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
        if (draftMarks.length) fd.set("marks", JSON.stringify(draftMarks));
        fd.set("photo_count", String(stagedPhotos.length));
        const res = await amendNote(fd);
        // Photos added while amending ride on the amendment entry.
        if (res?.id && stagedPhotos.length)
          await attachPhotosToEntry(stagedPhotos.map((p) => p.id), res.id, patient.id);
      }
      // Photos are already attached above — reset WITHOUT soft-deleting them.
      resetComposer();
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
          ? `${COMPOSER_NAME} · Anatomy`
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
    dirty:
      (bodyMap ? mapDirty : template ? templateDirty : !!draft.trim() || stagedPhotos.length > 0) &&
      !pending,
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
    onDiscard: editTarget || draft || stagedPhotos.length ? discard : undefined,
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
                photosByEntry={photosByEntry}
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

            {/* Composer — borderless, the whole white space; Save + Discard.
                onFocusCapture feeds the snippet menu's insert target: the
                last text field the writer was in. */}
            <section
              onFocusCapture={trackFocus}
              style={grow(showNotes ? 1 - leftTop : 1)}
              className={cn(
                "flex min-h-[220px] flex-col overflow-hidden rounded-2xl bg-card shadow-float transition-[flex-grow] ease-out lg:min-h-[92px]",
                leftMode === "bottom" && "min-h-[75dvh] lg:min-h-[92px]",
                dur,
              )}
            >
              {/* Chips collapse to ICONS when the CARD is narrow (measured by
                  ResizeObserver, Roland 2026-07-21); `order` puts Format first
                  (his ask), the spacer right-aligns the whole cluster. */}
              <div
                ref={scribeHeaderRef}
                className="glass sticky top-0 z-10 flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5"
              >
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
                {/* Spacer: right-aligns the chip cluster (replaces per-chip ml-auto). */}
                <div aria-hidden className="ml-auto" />
                {/* RolDe Scribe Templates (T1): the picker lives IN Scribe's
                    header — never a separate page (Roland 2026-07-04). */}
                {mode === "new" && !bodyMap && (
                  <div className="order-2">
                    <button
                      ref={setPickerBtn}
                      onClick={() => setPickerOpen((v) => !v)}
                      aria-label="Templates"
                      className="group/tip relative flex h-7 items-center gap-1 rounded-lg bg-card px-2 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow"
                    >
                      {/* B3 (Roland 2026-07-21): chip icons wear their popover's
                          Earth & Bloom tone — the colour teaches the feature. */}
                      <LayoutTemplate className={cn("size-3.5", CARD_ICON_TEXT.periwinkle)} />
                      <span className={cn(!chipsWide && "hidden")}>
                        {template ? template.name : "Templates"}
                      </span>
                      <ChevronDown className={cn("size-3 transition-transform", pickerOpen && "rotate-180")} />
                      {!chipsWide && <ChipTip label={template ? template.name : "Templates"} />}
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
                      subtitle="The curated library + your clinic's own"
                      tone="periwinkle"
                    >
                        <button
                          onClick={() => {
                            setTemplate(null);
                            setAnswers({});
                            if (bodyMap) {
                              setBodyMap(null);
                              setLeftMode("split");
                            }
                            setPickerOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-hover",
                            !template && !bodyMap ? "font-medium text-foreground" : "text-muted-foreground",
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
                                      if (bodyMap) {
                                        setBodyMap(null);
                                        setLeftMode("split");
                                      }
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
                        {/* T2 — the CLINIC's templates (Caretaker-designed,
                            team-filled); the builder is the Caretaker's. */}
                        {clinicTemplates.length > 0 && (
                          <p className="px-2.5 pb-0.5 pt-2 text-xs font-semibold tracking-wide text-foreground uppercase">
                            Clinic Templates
                          </p>
                        )}
                        {clinicTemplates.map((t) => (
                          <div
                            key={t.id}
                            className="group flex w-full items-center rounded-lg transition-colors hover:bg-hover"
                          >
                            <button
                              onClick={() => {
                                setTemplate(t);
                                setAnswers(prefillFor(t));
                                setDraft("");
                                if (bodyMap) {
                                  setBodyMap(null);
                                  setLeftMode("split");
                                }
                                setPickerOpen(false);
                              }}
                              className={cn(
                                "min-w-0 flex-1 truncate px-2.5 py-1.5 text-left text-sm",
                                template?.id === t.id
                                  ? "font-medium text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {t.name}
                            </button>
                            {canManageTemplates && (
                              <button
                                onClick={() => {
                                  setBuilder({ open: true, editing: t });
                                  setPickerOpen(false);
                                }}
                                title="Edit This Template"
                                className="mr-1 hidden size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground group-hover:flex"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {canManageTemplates && (
                          <button
                            onClick={() => {
                              setBuilder({ open: true, editing: null });
                              setPickerOpen(false);
                            }}
                            className="mt-1 flex w-full items-center gap-1.5 rounded-lg border-t border-border/60 px-2.5 pt-2 pb-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                          >
                            <Plus className="size-3.5" /> New Template…
                          </button>
                        )}
                    </AnchoredPopover>
                  </div>
                )}
                {/* Photo M2 (Roland 2026-07-22): the camera lives next to
                    Templates; captures STAGE for this note and attach on Save.
                    Shown in every note-composing mode (new · edit · amend ·
                    addendum) so photos can be added to any note — hidden only in
                    the body-map annotator. */}
                {!bodyMap && (
                  <PhotoCaptureButton
                    patientId={patient.id}
                    staged={stagedPhotos}
                    onStage={(p) => setStagedPhotos((s) => [...s, p])}
                    onUnstage={(id) => setStagedPhotos((s) => s.filter((x) => x.id !== id))}
                    showLabel={chipsWide}
                  />
                )}
                {mode === "new" && (
                  <button
                    aria-label={bodyMap ? "Close Anatomy" : "Anatomy"}
                    onClick={() => {
                      if (bodyMap) {
                        setBodyMap(null);
                        setLeftMode("split");
                      } else {
                        setTemplate(null);
                        setAnswers({});
                        setBodyMap({ view: "anterior", figure: "woman", pins: [], strokes: [] });
                        // The ONE sanctioned automatic move (APPROVALS §4.2):
                        // opening the Body-Map expands Scribe — user-initiated.
                        setLeftMode("bottom");
                      }
                    }}
                    className={cn(
                      "group/tip relative order-2 flex h-7 items-center gap-1 rounded-lg bg-card px-2 text-xs font-medium shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:shadow",
                      bodyMap
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <PersonStanding className={cn("size-3.5", CARD_ICON_TEXT.peach)} />
                    <span className={cn(!chipsWide && "hidden")}>
                      {bodyMap ? "Close Anatomy" : "Anatomy"}
                    </span>
                    {!chipsWide && <ChipTip label={bodyMap ? "Close Anatomy" : "Anatomy"} />}
                  </button>
                )}
                {mode !== "new" || !bodyMap ? (
                  <>
                    <button
                      ref={setSnippetBtn}
                      onClick={() => setSnippetsMenuOpen((v) => !v)}
                      aria-label="Snips"
                      className="group/tip relative order-2 flex h-7 items-center gap-1 rounded-lg bg-card px-2 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow"
                    >
                      <Zap className={cn("size-3.5", CARD_ICON_TEXT.teal)} />
                      <span className={cn(!chipsWide && "hidden")}>Snips</span>
                      {!chipsWide && <ChipTip label="Snips" />}
                    </button>
                    <AnchoredPopover
                      anchor={snippetBtn}
                      open={snippetsMenuOpen}
                      onClose={() => setSnippetsMenuOpen(false)}
                      width={300}
                      icon={Zap}
                      title="My Shortcuts"
                      subtitle="Click to insert where you were typing"
                      tone="teal"
                      className="p-1.5"
                    >
                      {shortcuts.length === 0 && (
                        <p className="px-2.5 py-3 text-xs text-muted-foreground">
                          No shortcuts yet — save the sentences you type every
                          day, then insert them from here or with “.shortcut”.
                        </p>
                      )}
                      {shortcuts.map((sc) => (
                        <button
                          key={sc.id}
                          onClick={() => {
                            insertSnippet(sc.expansion);
                            setSnippetsMenuOpen(false);
                          }}
                          className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-hover"
                        >
                          <span className="shrink-0 rounded-md bg-foreground/6 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                            .{sc.shortcut}
                          </span>
                          <span className="line-clamp-2 min-w-0 flex-1 text-xs text-muted-foreground">
                            {sc.expansion}
                          </span>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setSnippetsMenuOpen(false);
                          setShortcutsOpen(true);
                        }}
                        className="mt-1 flex w-full items-center gap-1.5 rounded-lg border-t border-border/60 px-2.5 pt-2 pb-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                      >
                        Manage Shortcuts…
                      </button>
                    </AnchoredPopover>
                    {/* B2 (Roland 2026-07-21 "Go"): the COURIER door — one
                        branded menu for everything that leaves the clinic. */}
                    <span className="order-2 flex items-center">
                      <CourierMenu
                        onSendForm={(el) => setFormSheet({ open: true, anchor: el })}
                        unsentLetters={unsentLetters}
                        onSendLetter={(entryId, el) =>
                          setLetterSheet({ open: true, anchor: el, entryId })
                        }
                        showLabel={chipsWide}
                      />
                    </span>
                    {/* B6.2 (Roland 2026-07-21 "Go"): the FORMAT panel — one chip
                        opens the full palette (B/I/U/S · highlight colours ·
                        lists · indent · clear). The quick bubble handles inline
                        select-to-format. Only when the rich editor is live. */}
                    {!template && (
                      <>
                        <button
                          ref={setFormatBtn}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setFormatOpen((v) => !v)}
                          aria-label="Format"
                          className="group/tip relative order-1 flex h-7 items-center gap-1 rounded-lg bg-card px-2 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow"
                        >
                          <Type className={cn("size-3.5", CARD_ICON_TEXT.rose)} />
                          <span className={cn(!chipsWide && "hidden")}>Format</span>
                          {!chipsWide && <ChipTip label="Format" />}
                        </button>
                        <AnchoredPopover
                          anchor={formatBtn}
                          open={formatOpen}
                          onClose={() => setFormatOpen(false)}
                          width={212}
                          icon={Type}
                          title="Format"
                          subtitle="Style the selected text"
                          tone="rose"
                          className="space-y-1.5 p-1.5"
                        >
                          <div className="flex gap-0.5">
                            {(["b", "i", "u", "s"] as MarkKind[]).map((k) => (
                              <button
                                key={k}
                                type="button"
                                aria-label={
                                  k === "b" ? "Bold" : k === "i" ? "Italic" : k === "u" ? "Underline" : "Strikethrough"
                                }
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => richRef.current?.format(k)}
                                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                              >
                                <MarkGlyph k={k} />
                              </button>
                            ))}
                          </div>
                          <div>
                            <p className="pb-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                              Highlight
                            </p>
                            <div className="flex items-center gap-1">
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
                            </div>
                          </div>
                          <div>
                            <p className="pb-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                              Lists
                            </p>
                            <div className="flex gap-0.5">
                              {(
                                [
                                  { op: "bullet", icon: List, label: "Bullet List" },
                                  { op: "number", icon: ListOrdered, label: "Numbered List" },
                                  { op: "outdent", icon: IndentDecrease, label: "Outdent" },
                                  { op: "indent", icon: IndentIncrease, label: "Indent" },
                                ] as { op: LineOp; icon: typeof List; label: string }[]
                              ).map(({ op, icon: Icon, label }) => (
                                <button
                                  key={op}
                                  type="button"
                                  title={label}
                                  aria-label={label}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => richRef.current?.lineOp(op)}
                                  className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                                >
                                  <Icon className="size-4" />
                                </button>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => richRef.current?.clearFormat()}
                            className="flex w-full items-center gap-1.5 rounded-lg border-t border-border/60 px-2 pt-1.5 pb-0.5 text-left text-xs text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                          >
                            <RemoveFormatting className="size-3.5" /> Clear Formatting
                          </button>
                        </AnchoredPopover>
                      </>
                    )}
                  </>
                ) : null}
                <button
                  onClick={() =>
                    setLeftMode((m) => (m === "bottom" ? "split" : "bottom"))
                  }
                  aria-label={leftMode === "bottom" ? "Restore" : "Expand"}
                  className="group/tip relative order-2 flex size-7 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow"
                >
                  {leftMode === "bottom" ? (
                    <Minimize2 className="size-4" />
                  ) : (
                    <Maximize2 className="size-4" />
                  )}
                  <ChipTip label={leftMode === "bottom" ? "Restore" : "Expand"} align="right" />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col px-4 pb-2.5">
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
                  <BodyMapPanel data={bodyMap} onChange={setBodyMap} legend={legend} />
                ) : (mode === "new" || mode === "edit") && template ? (
                  <ScribeTemplateForm
                    template={template}
                    answers={answers}
                    onChange={(i, v) => setAnswers((a) => ({ ...a, [i]: v }))}
                    expandText={withAutotext}
                    legend={legend}
                    tempUnit={defaultTempUnit(topbarPatient?.clinicCountry)}
                  />
                ) : (
                  // B6 — the rich free-note editor (bold/italic/underline/
                  // highlight); Calm Formatting A (self-continuing lists) and
                  // autotext run through it, snippets insert at its caret.
                  <RichNoteEditor
                    ref={richRef}
                    docKey={`${mode}-${editTarget?.id ?? "new"}-${editorNonce}`}
                    initialText={draft}
                    initialMarks={draftMarks}
                    onChange={(text, marks) => {
                      setDraft(text);
                      setDraftMarks(marks);
                    }}
                    expand={(text, caret) => expandAutotext(text, caret, shortcuts)}
                    continueList={continueListOnEnter}
                    onFocusCapture={() => {
                      lastWasRichRef.current = true;
                    }}
                    bubbleHidden={formatOpen}
                    placeholder={
                      mode === "amend"
                        ? "Amendment…"
                        : mode === "addendum"
                          ? "Addendum…"
                          : `Note for ${patient.firstName}…`
                    }
                  />
                )}
                {/* Symmetric breathing room above and below the buttons
                    (Roland 2026-07-21): footer pt matches the card's pb-2.5. */}
                <div className="flex shrink-0 items-center justify-end gap-2 pt-2.5">
                  {(editTarget || draft || template || bodyMap || stagedPhotos.length > 0) && (
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
                          : !draft.trim() && stagedPhotos.length === 0)
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
      {/* Scribe T2 — the personal template builder (portaled sheet). A save
          refreshes the picker; if the ACTIVE template was edited, the form
          picks up its new shape (answers reset — honest, never misaligned). */}
      <FormSendSheet
        patientId={patient.id}
        anchor={formSheet.anchor}
        open={formSheet.open}
        onClose={() => setFormSheet({ open: false, anchor: null })}
      />
      {/* B2 — the Courier door's letter rail: the C3 Send sheet, anchored to
          the Courier chip for the letter picked in the menu. */}
      {letterSheet.entryId && (
        <CourierSendSheet
          entryId={letterSheet.entryId}
          anchor={letterSheet.anchor}
          open={letterSheet.open}
          onClose={() => setLetterSheet({ open: false, anchor: null, entryId: null })}
        />
      )}
      {shortcutsOpen && (
        <ShortcutsManager
          onClose={() => setShortcutsOpen(false)}
          onChanged={setShortcuts}
        />
      )}
      {builder.open && (
        <TemplateBuilder
          editing={builder.editing}
          onClose={() => setBuilder({ open: false, editing: null })}
          onSaved={async (id) => {
            setBuilder({ open: false, editing: null });
            const r = await listClinicTemplates();
            if (r.ok) {
              setClinicTemplates(r.data);
              if (template && template.id === id) {
                const fresh = r.data.find((t) => t.id === id);
                if (fresh) {
                  setTemplate(fresh);
                  setAnswers(prefillFor(fresh));
                }
              }
            }
            flashSaved("RolDe saved your template.");
          }}
          onDeleted={(id) => {
            setBuilder({ open: false, editing: null });
            setClinicTemplates((ts) => ts.filter((t) => t.id !== id));
            if (template?.id === id) {
              setTemplate(null);
              setAnswers({});
            }
          }}
        />
      )}
    </div>
  );
}
