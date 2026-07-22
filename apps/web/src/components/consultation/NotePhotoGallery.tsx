"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * NotePhotoGallery (Photo M2, refined M3 — Roland 2026-07-22) — a saved Clinical
 * Note's photos, shown the RolDe way: a calm, softly-bordered panel holding the
 * BEFORE and AFTER sets SIDE BY SIDE (a hairline between them), each under a
 * small tinted chip — slate for Before, sage for After (the clinical-colour
 * splash reads as "progress"). Framed square thumbnails; tap any for the full
 * viewer, and a single Compare control opens the drag-slider overlay.
 */
export type NotePhoto = { id: string; phase: string; thumbUrl: string; url: string };

const PHASE: Record<string, { label: string; dot: string; text: string }> = {
  before: { label: "Before", dot: "bg-slate-400", text: "text-slate-600" },
  after: { label: "After", dot: "bg-success", text: "text-success" },
  other: { label: "Photos", dot: "bg-slate-300", text: "text-muted-foreground" },
};

function PhaseColumn({
  phase,
  list,
  onOpen,
}: {
  phase: string;
  list: NotePhoto[];
  onOpen: (list: NotePhoto[], index: number) => void;
}) {
  if (!list.length) return null;
  const s = PHASE[phase] ?? PHASE.other;
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-1.5">
        <span className={cn("size-1.5 rounded-full", s.dot)} />
        <span className={cn("text-xs font-semibold tracking-wide", s.text)}>{s.label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onOpen(list, i)}
            className="group relative aspect-square w-20 overflow-hidden rounded-xl bg-muted ring-1 ring-black/[0.06] transition-all hover:shadow-float"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.thumbUrl}
              alt={`${s.label} photo`}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function NotePhotoGallery({ photos }: { photos: NotePhoto[] }) {
  const [viewer, setViewer] = useState<{
    list: NotePhoto[];
    index: number;
    mode: "single" | "compare";
  } | null>(null);
  if (!photos.length) return null;

  const before = photos.filter((p) => p.phase === "before");
  const after = photos.filter((p) => p.phase === "after");
  const other = photos.filter((p) => p.phase !== "before" && p.phase !== "after");
  const bothBA = before.length > 0 && after.length > 0;
  const hasBA = before.length > 0 || after.length > 0;
  const open = (list: NotePhoto[], index: number, mode: "single" | "compare" = "single") =>
    setViewer({ list, index, mode });

  return (
    <div className="mt-3">
      <div className="rounded-2xl border border-border/60 bg-muted/25 p-3">
        {bothBA ? (
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
            <PhaseColumn phase="before" list={before} onOpen={open} />
            <div className="w-px self-stretch bg-border/70" />
            <PhaseColumn phase="after" list={after} onOpen={open} />
          </div>
        ) : (
          <div className="space-y-3">
            <PhaseColumn phase="before" list={before} onOpen={open} />
            <PhaseColumn phase="after" list={after} onOpen={open} />
          </div>
        )}

        {other.length > 0 && (
          <div className={cn(hasBA && "mt-3 border-t border-border/60 pt-3")}>
            <PhaseColumn phase="other" list={other} onOpen={open} />
          </div>
        )}

        {bothBA && (
          <button
            type="button"
            onClick={() => open([...before, ...after], 0, "compare")}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <ArrowLeftRight className="size-3.5" />
            Compare
          </button>
        )}
      </div>

      {viewer && (
        <PhotoViewer
          start={viewer}
          canCompare={bothBA}
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
  start: { list: NotePhoto[]; index: number; mode: "single" | "compare" };
  canCompare: boolean;
  beforeUrl?: string;
  afterUrl?: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(start.index);
  const [mode, setMode] = useState<"single" | "compare">(start.mode);
  const list = start.list;
  const current = list[index];

  return (
    <div
      className="fixed inset-0 z-[95] flex flex-col items-center justify-center gap-3 bg-foreground/80 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      {canCompare && (
        <div
          className="flex gap-1 rounded-xl bg-background/90 p-1 shadow-float"
          onClick={(e) => e.stopPropagation()}
        >
          {(["single", "compare"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                mode === m
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "single" ? "Single" : "Before / After"}
            </button>
          ))}
        </div>
      )}

      {mode === "single" ? (
        <div
          className="relative flex max-h-[80vh] max-w-3xl items-center"
          onClick={(e) => e.stopPropagation()}
        >
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
          <img
            src={current.url}
            alt="Patient photo"
            className="max-h-[80vh] max-w-full rounded-2xl shadow-overlay"
          />
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
        <CompareSlider
          beforeUrl={beforeUrl}
          afterUrl={afterUrl}
          onClick={(e) => e.stopPropagation()}
        />
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
    <div className="flex w-full max-w-3xl flex-col items-center gap-3" onClick={onClick}>
      <div className="relative w-full select-none overflow-hidden rounded-2xl shadow-overlay">
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
        <span className="absolute top-2 left-2 rounded-md bg-foreground/70 px-1.5 py-0.5 text-[10px] font-semibold text-background">
          Before
        </span>
        <span className="absolute top-2 right-2 rounded-md bg-foreground/70 px-1.5 py-0.5 text-[10px] font-semibold text-background">
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
