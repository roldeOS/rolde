"use client";

import { useRef, useState } from "react";
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
      <div className="relative rounded-2xl border border-border/60 bg-muted/25 p-3">
        {/* Compare lives as a quiet corner control (Roland disliked the pill):
            drag-slider on tap, out of the way. */}
        {bothBA && (
          <button
            type="button"
            onClick={() => open([...before, ...after], 0, "compare")}
            title="Compare before & after"
            aria-label="Compare before & after"
            className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <ArrowLeftRight className="size-4" />
          </button>
        )}
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
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  if (!beforeUrl || !afterUrl) return null;

  const setFromClientX = (clientX: number) => {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div className="w-full max-w-3xl" onClick={onClick}>
      {/* Drag anywhere on the image — the handle rides the split (no separate
          slider control). Elegant + direct, the RolDe way. */}
      <div
        ref={frameRef}
        className="relative w-full cursor-ew-resize touch-none overflow-hidden rounded-2xl shadow-overlay select-none"
        onPointerDown={(e) => {
          dragging.current = true;
          frameRef.current?.setPointerCapture(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging.current) setFromClientX(e.clientX);
        }}
        onPointerUp={(e) => {
          dragging.current = false;
          frameRef.current?.releasePointerCapture(e.pointerId);
        }}
      >
        {/* AFTER is the base; BEFORE is clipped from the right to reveal it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterUrl}
          alt="After"
          className="pointer-events-none block max-h-[72vh] w-full object-contain"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt="Before"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.35)]"
          style={{ left: `${pos}%` }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Reveal before or after"
          aria-valuenow={Math.round(pos)}
          aria-valuemin={0}
          aria-valuemax={100}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 2));
            if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 2));
          }}
          className="absolute top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-lg ring-1 ring-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          style={{ left: `${pos}%` }}
        >
          <ChevronLeft className="-mr-1 size-4" />
          <ChevronRight className="-ml-1 size-4" />
        </div>
        <span className="pointer-events-none absolute top-3 left-3 rounded-md bg-foreground/70 px-2 py-0.5 text-[11px] font-semibold text-background">
          Before
        </span>
        <span className="pointer-events-none absolute top-3 right-3 rounded-md bg-foreground/70 px-2 py-0.5 text-[11px] font-semibold text-background">
          After
        </span>
      </div>
    </div>
  );
}
