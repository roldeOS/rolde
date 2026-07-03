"use client";

import { useState, useEffect, useRef } from "react";
import { PenLine, Maximize2, Minimize2, Strikethrough } from "lucide-react";
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
import { usePageActionBar, useSavedFlash } from "@/components/ui/PageActionBar";
import {
  saveNote,
  editNote,
  strikeNote,
  amendNote,
} from "@/app/(app)/patients/actions";
import { cn } from "@/lib/utils";

type WorkupEntry = { id: string; entry_type: string };

/**
 * The consultation workspace (Roland 2026-06-10; Layouts 2026-07-03). The
 * geometry is USER-CONTROLLED (APPROVALS §4.2 — no auto-resize, ever): the
 * topbar "Layouts" menu applies Default (50/50) or a named layout; the two
 * DIVIDERS drag-resize (double-click = Default); everything persists per user.
 * ONE row-split serves BOTH columns — visually symmetric (Roland 2026-06-10).
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
}: {
  patient: { id: string; firstName: string };
  feedEntries: FeedEntry[];
  workupEntries: WorkupEntry[];
  authors: Record<string, Author>;
  currentUserId: string;
  /** Courier C1 — every read receipt on this patient's entries (unread state +
   *  the per-tile "Seen by" thread). */
  reads: { entry_id: string; user_id: string; read_at: string }[];
}) {
  const { layout, setLayout } = useTopbar();
  const [leftMode, setLeftMode] = useState<Mode>("split");
  const [rightMode, setRightMode] = useState<Mode>("split");
  const [ready, setReady] = useState(false);
  // Which divider is mid-drag ("col" | "split" | null) — transitions pause so
  // the cards track the pointer 1:1.
  const [dragging, setDragging] = useState<"col" | "split" | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [draft, setDraft] = useState("");
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
    leftMode === "top" ? 0.85 : leftMode === "bottom" ? 0.22 : layout.split;
  const rightTop =
    rightMode === "top" ? 0.85 : rightMode === "bottom" ? 0.25 : layout.split;
  const dur = ready && !dragging ? "duration-300" : "duration-0";
  const grow = (n: number) => ({ flexGrow: n * 100, flexBasis: 0 });

  // ── Divider drag (lg+ only — stacked layouts have no dividers). WINDOW-level
  // move/up listeners from pointerdown to release (Roland 2026-07-03 — the
  // capture-based version could go dead on some dividers/browsers; window
  // listeners track everywhere, robustly). The vertical divider re-balances the
  // columns; each column's horizontal divider drives the ONE shared split.
  // Double-click resets to Default.
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  function startDrag(kind: "col" | "split", e: React.PointerEvent) {
    e.preventDefault();
    setDragging(kind);
    const colEl = (e.currentTarget as HTMLElement).closest("[data-col]");
    const onMove = (ev: PointerEvent) => {
      if (kind === "col") {
        const rect = rowRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0) return;
        setLayout({ ...layoutRef.current, col: (ev.clientX - rect.left) / rect.width });
      } else {
        const rect = colEl?.getBoundingClientRect();
        if (!rect || rect.height === 0) return;
        setLayout({ ...layoutRef.current, split: (ev.clientY - rect.top) / rect.height });
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

  // Card visibility (Roland 2026-07-03) — toggled in the Layouts menu, saved
  // with named layouts. Scribe is always on. A hidden card hands its space to
  // its column-mate; both right cards hidden → the right column goes entirely.
  const hidden = new Set(layout.hidden);
  const showNotes = !hidden.has("notes");
  const showWorkup = !hidden.has("workup");
  const showAi = !hidden.has("ai");
  const showRight = showWorkup || showAi;

  const mode: "new" | "edit" | "amend" = !editTarget
    ? "new"
    : editTarget.locked
      ? "amend"
      : "edit";

  function handleEdit(e: FeedEntry) {
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
  }

  async function submit() {
    if (!draft.trim() || pending) return;
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("patient_id", patient.id);
      if (mode === "new") {
        fd.set("text", draft);
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
    mode === "edit" ? "Editing note" : mode === "amend" ? "Amending note" : COMPOSER_NAME;
  const saveLabel =
    mode === "edit" ? "Save edit" : mode === "amend" ? "Save amendment" : "Save note";

  // Conversational bottom save bar (Roland 2026-06-11). It SPEAKS — "RolDe has
  // a note ready for Sarah's record" → "RolDe saved this to Sarah's record."
  usePageActionBar({
    dirty: !!draft.trim() && !pending,
    saving: pending,
    message:
      mode === "edit"
        ? `You’re editing a note in ${who}’s record.`
        : mode === "amend"
          ? `You’re amending a note in ${who}’s record.`
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

            {/* The shared row divider (left column) — drag to resize BOTH
                columns' split; double-click = Default (APPROVALS §4.2). */}
            {showNotes && (
            <div
              onPointerDown={(e) => startDrag("split", e)}
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
                <button
                  onClick={() =>
                    setLeftMode((m) => (m === "bottom" ? "split" : "bottom"))
                  }
                  title={leftMode === "bottom" ? "Restore" : "Expand"}
                  className="ml-auto flex size-7 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow"
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
                <div className="flex shrink-0 items-center justify-end gap-2 pt-1">
                  {(editTarget || draft) && (
                    <Button variant="ghost" size="sm" onClick={discard}>
                      Discard
                    </Button>
                  )}
                  <Button size="sm" onClick={submit} disabled={pending || !draft.trim()}>
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
                maximized={rightMode === "top"}
                onToggleMaximize={() =>
                  setRightMode((m) => (m === "top" ? "split" : "top"))
                }
              />
            </section>
            )}

            {/* The shared row divider (right column) — the same ONE split. */}
            {showWorkup && showAi && (
            <div
              onPointerDown={(e) => startDrag("split", e)}
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
