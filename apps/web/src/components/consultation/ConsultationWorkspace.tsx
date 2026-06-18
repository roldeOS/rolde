"use client";

import { useState, useEffect } from "react";
import { PenLine, Maximize2, Minimize2, Strikethrough } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardIcon } from "@/components/ui/CardIcon";
import { SectionExplainer } from "@/components/ui/SectionExplainer";
import { OrdersPanel } from "@/components/OrdersPanel";
import { AiPanel } from "@/components/AiPanel";
import {
  ClinicalNotesFeed,
  type FeedEntry,
  type Author,
} from "@/components/consultation/ClinicalNotesFeed";
import { useTopbar } from "@/components/topbar/TopbarContext";
import { usePageActionBar, useSavedFlash } from "@/components/ui/PageActionBar";
import {
  saveNote,
  editNote,
  strikeNote,
  amendNote,
} from "@/app/(app)/patients/actions";
import { cn } from "@/lib/utils";

type OrderEntry = { id: string; entry_type: string };

/**
 * The consultation workspace (Roland 2026-06-10). The view preset (Consult /
 * Document / Review) is driven from the TOPBAR; here we apply it as flex-grow
 * ratios + contextual growth (composer expands while writing). Four glassy,
 * borderless, floating cards — responsive (2×2 on desktop, stacked on
 * mobile/tablet). The composer is the single place for new / edit / amend.
 */
// ONE row-split per preset is applied to BOTH columns, so the top two cards end
// at the same level and the bottom two do too — visually symmetric (Roland
// 2026-06-10). Only deliberate actions (writing, manual maximise) break it.
const PRESETS = {
  consult: { split: 0.68, col: 0.5 },
  document: { split: 0.45, col: 0.55 },
  review: { split: 0.82, col: 0.5 },
} as const;
type Mode = "split" | "top" | "bottom";
const COMPOSE_LEFT = 0.42;
const EDIT_WINDOW_MS = 60 * 60 * 1000;
const COMPOSER_NAME = "Scribe"; // the writing card (Roland 2026-06-10)

type EditTarget = { id: string; original: string; locked: boolean } | null;

export function ConsultationWorkspace({
  patient,
  feedEntries,
  orderEntries,
  authors,
  currentUserId,
}: {
  patient: { id: string; firstName: string };
  feedEntries: FeedEntry[];
  orderEntries: OrderEntry[];
  authors: Record<string, Author>;
  currentUserId: string;
}) {
  const { view } = useTopbar();
  const [leftMode, setLeftMode] = useState<Mode>("split");
  const [rightMode, setRightMode] = useState<Mode>("split");
  const [composing, setComposing] = useState(false);
  const [ready, setReady] = useState(false);

  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [draft, setDraft] = useState("");
  const [strikeOriginal, setStrikeOriginal] = useState(false);
  const [pending, setPending] = useState(false);
  // Conversational "saved" flash lives in the provider so it survives the
  // remount a save's revalidate triggers (Roland 2026-06-11).
  const flashSaved = useSavedFlash();
  const who = patient.firstName;

  useEffect(() => setReady(true), []);
  useEffect(() => setLeftMode("split"), [view]);

  const p = PRESETS[view];
  const active = composing || !!editTarget;
  // At rest both columns use the SAME split → symmetric. Writing grows the
  // composer (left only); manual maximise affects one column. Both deliberate.
  const leftTop = active
    ? COMPOSE_LEFT
    : leftMode === "top"
      ? 0.85
      : leftMode === "bottom"
        ? 0.22
        : p.split;
  const rightTop =
    rightMode === "top" ? 0.85 : rightMode === "bottom" ? 0.25 : p.split;
  const dur = ready ? "duration-300" : "duration-0";
  const grow = (n: number) => ({ flexGrow: n * 100, flexBasis: 0 });

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
        <div className="flex flex-col gap-3 lg:h-full lg:flex-row">
          {/* Left column */}
          <div className="flex flex-col gap-3 lg:min-h-0" style={grow(p.col)}>
            {/* Clinical Notes */}
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
                maximized={leftMode === "top"}
                onToggleMaximize={() =>
                  setLeftMode((m) => (m === "top" ? "split" : "top"))
                }
                onEditNote={handleEdit}
                activeId={editTarget?.id ?? null}
              />
            </section>

            {/* Composer — borderless, the whole white space; Save + Discard */}
            <section
              style={grow(1 - leftTop)}
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
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onFocus={() => setComposing(true)}
                  onBlur={() => setComposing(false)}
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

          {/* Right column */}
          <div className="flex flex-col gap-3 lg:min-h-0" style={grow(1 - p.col)}>
            <section
              style={grow(rightTop)}
              className={cn(
                "flex min-h-[40vh] flex-col overflow-hidden rounded-2xl bg-card shadow-float transition-[flex-grow] ease-out lg:min-h-[140px]",
                dur,
              )}
            >
              <OrdersPanel
                entries={orderEntries}
                maximized={rightMode === "top"}
                onToggleMaximize={() =>
                  setRightMode((m) => (m === "top" ? "split" : "top"))
                }
              />
            </section>
            <section
              style={grow(1 - rightTop)}
              className={cn(
                "flex min-h-[200px] flex-col overflow-hidden rounded-2xl bg-card shadow-float transition-[flex-grow] ease-out lg:min-h-[92px]",
                dur,
              )}
            >
              <AiPanel />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
