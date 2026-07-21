"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * NotePhotoGallery (Photo M2, Roland 2026-07-22) — a saved Clinical Note's
 * photos, shown as labelled BEFORE / AFTER rows of square thumbnails (5 of
 * each reads cleanly). Tap a tile for the full viewer; when a note has both a
 * before and an after, a drag-slider COMPARE overlays them.
 */
export type NotePhoto = { id: string; phase: string; thumbUrl: string; url: string };

function PhaseGroup({
  label,
  list,
  onOpen,
}: {
  label: string;
  list: NotePhoto[];
  onOpen: (list: NotePhoto[], index: number) => void;
}) {
  if (!list.length) return null;
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {list.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onOpen(list, i)}
            className="size-16 overflow-hidden rounded-lg bg-muted ring-1 ring-black/5 transition-transform hover:scale-[1.03]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.thumbUrl} alt={`${label} photo`} className="size-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function NotePhotoGallery({ photos }: { photos: NotePhoto[] }) {
  const [viewer, setViewer] = useState<{ list: NotePhoto[]; index: number } | null>(null);
  if (!photos.length) return null;
  const before = photos.filter((p) => p.phase === "before");
  const after = photos.filter((p) => p.phase === "after");
  const other = photos.filter((p) => p.phase !== "before" && p.phase !== "after");
  const open = (list: NotePhoto[], index: number) => setViewer({ list, index });
  // Roland 2026-07-22: Before and After sit SIDE BY SIDE (two columns) when a
  // note has both — the natural way to read a before/after set. Only one phase →
  // full width. A subtle divider separates the columns.
  const bothBA = before.length > 0 && after.length > 0;

  return (
    <div className="mt-2 space-y-2">
      {bothBA ? (
        <div className="grid grid-cols-2 gap-3">
          <PhaseGroup label="Before" list={before} onOpen={open} />
          <div className="border-l border-border/50 pl-3">
            <PhaseGroup label="After" list={after} onOpen={open} />
          </div>
        </div>
      ) : (
        <>
          <PhaseGroup label="Before" list={before} onOpen={open} />
          <PhaseGroup label="After" list={after} onOpen={open} />
        </>
      )}
      <PhaseGroup label="Photos" list={other} onOpen={open} />
      {viewer && (
        <PhotoViewer
          start={viewer}
          canCompare={before.length > 0 && after.length > 0}
          beforeUrl={before[0]?.url}
          afterUrl={after[0]?.url}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}

function PhotoViewer({
  start,
  canCompare,
  beforeUrl,
  afterUrl,
  onClose,
}: {
  start: { list: NotePhoto[]; index: number };
  canCompare: boolean;
  beforeUrl?: string;
  afterUrl?: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(start.index);
  const [mode, setMode] = useState<"single" | "compare">("single");
  const list = start.list;
  const current = list[index];

  return (
    <div
      className="fixed inset-0 z-[95] flex flex-col items-center justify-center gap-3 bg-foreground/80 p-6"
      onClick={onClose}
    >
      {canCompare && (
        <div
          className="flex gap-1 rounded-lg bg-background/90 p-1"
          onClick={(e) => e.stopPropagation()}
        >
          {(["single", "compare"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "single" ? "Single" : "Before / After"}
            </button>
          ))}
        </div>
      )}

      {mode === "single" ? (
        <div className="relative flex max-h-[80vh] max-w-3xl items-center" onClick={(e) => e.stopPropagation()}>
          {list.length > 1 && (
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + list.length) % list.length)}
              className="absolute -left-11 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.url} alt="Patient photo" className="max-h-[80vh] max-w-full rounded-lg shadow-overlay" />
          {list.length > 1 && (
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % list.length)}
              className="absolute -right-11 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow"
            >
              <ChevronRight className="size-5" />
            </button>
          )}
        </div>
      ) : (
        <CompareSlider beforeUrl={beforeUrl} afterUrl={afterUrl} onClick={(e) => e.stopPropagation()} />
      )}

      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow"
        aria-label="Close"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}

function CompareSlider({
  beforeUrl,
  afterUrl,
  onClick,
}: {
  beforeUrl?: string;
  afterUrl?: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  const [pos, setPos] = useState(50);
  if (!beforeUrl || !afterUrl) return null;
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-2" onClick={onClick}>
      <div className="relative w-full select-none overflow-hidden rounded-lg shadow-overlay">
        {/* AFTER is the base; BEFORE is clipped from the right to reveal it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterUrl} alt="After" className="block max-h-[72vh] w-full object-contain" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt="Before"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow"
          style={{ left: `${pos}%` }}
        />
        <span className="absolute top-2 left-2 rounded bg-foreground/70 px-1.5 py-0.5 text-[10px] font-semibold text-background">
          Before
        </span>
        <span className="absolute top-2 right-2 rounded bg-foreground/70 px-1.5 py-0.5 text-[10px] font-semibold text-background">
          After
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Compare slider"
        className="w-full max-w-md accent-foreground"
      />
    </div>
  );
}
