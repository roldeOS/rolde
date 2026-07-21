"use client";

import { useEffect, useRef, useState } from "react";
import { Undo2, Eraser, Shrink } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { BodyFigureArt, resolveFigureArt } from "./BodyFigureArt";
import {
  PIN_TONES,
  pinFill,
  pinToneLabel,
  bodyMapHasContent,
  type BodyMapData,
  type BodyMapPin,
  type BodyMapView,
  type BodyMapFigure,
  type BodymapLegendNames,
} from "@/lib/bodyMap";
import { cn } from "@/lib/utils";

/** Freehand thinning + marker sizes are RELATIVE to the figure's width —
 *  the assets differ (v3 images ~610–1320 units wide, legacy 970), so
 *  everything scales by art.w and looks identical across figures. */
const REL = { minDist: 0.0124, pin: 0.031, stroke: 0.0104 };

type Tool = "pin" | "draw" | "zoom";

/** Region zoom (v2.1) — one tap frames a close-up at 1/ZOOM_FACTOR of the
 *  figure, centred on the tap; taps while zoomed re-centre; Fit returns. */
const ZOOM_FACTOR = 3;

/**
 * The Body-Map annotator (v2 2026-07-04 · v2.1 zoom/colours · v3 2026-07-21:
 * Roland's OWN figure set) — a Scribe MODE (APPROVALS §4.3) and a template
 * PART: professional figure artwork (Body · Back · Face, Woman ⇄ Man),
 * numbered PINS in treatment colours (site + note each), freehand MARKER,
 * close-up ZOOM. Coordinates live in the figure's own viewBox space —
 * identical at every size, tablet-first. ONE figure per map: switching view
 * or figure clears after an honest confirm (marks belong to one geometry);
 * legacy maps (pre-figure) keep their original artwork forever.
 */
export function BodyMapPanel({
  data,
  onChange,
  embedded = false,
  legend,
}: {
  data: BodyMapData;
  onChange: (next: BodyMapData) => void;
  /** Inside a template form (no card height to fill) — the figure keeps a
   *  real floor height and the Marks rail stacks beneath. */
  embedded?: boolean;
  /** T3 — the clinic's colour names (Caretaker-set); swatches + record wear them. */
  legend?: BodymapLegendNames;
}) {
  const view: BodyMapView =
    data.view === "face" ? "face" : data.view === "posterior" ? "posterior" : "anterior";
  // v3 artwork: figure-era maps render Roland's image set; legacy maps keep
  // their original artwork (the resolver owns that law).
  const art = resolveFigureArt(data);
  const dims = { w: art.w, h: art.h };
  const [tool, setTool] = useState<Tool>("pin");
  const [vb, setVb] = useState({ x: 0, y: 0, w: dims.w, h: dims.h });
  const [activeTone, setActiveTone] = useState<string>(PIN_TONES[0].key);
  // Switching view OR figure clears the map (marks belong to one figure's
  // geometry) — never silently.
  const [pending, setPending] = useState<{ view: BodyMapView; figure?: BodyMapFigure } | null>(null);
  const zoomed = vb.w < dims.w;
  // Marks scale with the SQUARE ROOT of the window: close-ups get visibly
  // bigger pins (Roland: "the number 1 on the pin looks very small") while
  // still gaining detail room.
  const scale = Math.sqrt(vb.w / dims.w);
  const svgRef = useRef<SVGSVGElement>(null);
  const drawing = useRef<number[][] | null>(null);
  const [liveStroke, setLiveStroke] = useState<number[][] | null>(null);
  // One undo history across tools: what got added last comes off first.
  const history = useRef<("pin" | "stroke")[]>([]);

  // A view change resets the window to Fit for THAT figure.
  useEffect(() => {
    setVb({ x: 0, y: 0, w: dims.w, h: dims.h });
  }, [dims.w, dims.h]);

  const toViewBox = (e: React.PointerEvent): [number, number] | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    // Through the CURRENT window (zoom-aware) — coordinates always land in
    // full-figure space, so marks placed in a close-up render right at Fit.
    return [
      Math.round(vb.x + ((e.clientX - r.left) / r.width) * vb.w),
      Math.round(vb.y + ((e.clientY - r.top) / r.height) * vb.h),
    ];
  };

  function zoomTo(pt: [number, number]) {
    const w = dims.w / ZOOM_FACTOR;
    const h = dims.h / ZOOM_FACTOR;
    setVb({
      x: Math.max(0, Math.min(pt[0] - w / 2, dims.w - w)),
      y: Math.max(0, Math.min(pt[1] - h / 2, dims.h - h)),
      w,
      h,
    });
  }

  function onPointerDown(e: React.PointerEvent) {
    const pt = toViewBox(e);
    if (!pt) return;
    if (tool === "zoom") {
      zoomTo(pt);
    } else if (tool === "pin") {
      history.current.push("pin");
      onChange({
        ...data,
        pins: [...data.pins, { x: pt[0], y: pt[1], site: "", note: "", tone: activeTone }],
      });
    } else {
      e.currentTarget.setPointerCapture(e.pointerId);
      drawing.current = [pt];
      setLiveStroke([pt]);
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (tool !== "draw" || !drawing.current) return;
    const pt = toViewBox(e);
    if (!pt) return;
    const last = drawing.current[drawing.current.length - 1];
    // Thinning follows the zoom — close-up work keeps finer detail.
    if (Math.hypot(pt[0] - last[0], pt[1] - last[1]) < dims.w * REL.minDist * scale) return;
    drawing.current = [...drawing.current, pt];
    setLiveStroke(drawing.current);
  }
  function onPointerUp() {
    if (tool !== "draw" || !drawing.current) return;
    if (drawing.current.length > 1) {
      history.current.push("stroke");
      onChange({ ...data, strokes: [...data.strokes, drawing.current] });
    }
    drawing.current = null;
    setLiveStroke(null);
  }

  function undo() {
    const last = history.current.pop();
    if (last === "pin") onChange({ ...data, pins: data.pins.slice(0, -1) });
    else if (last === "stroke") onChange({ ...data, strokes: data.strokes.slice(0, -1) });
  }
  function clearAll() {
    history.current = [];
    onChange({ ...data, pins: [], strokes: [] });
  }
  function setPin(i: number, patch: Partial<BodyMapPin>) {
    onChange({
      ...data,
      pins: data.pins.map((p, j) => (j === i ? { ...p, ...patch } : p)),
    });
  }
  function removePin(i: number) {
    history.current = history.current.filter((_, idx) => idx !== history.current.lastIndexOf("pin"));
    onChange({ ...data, pins: data.pins.filter((_, j) => j !== i) });
  }
  function cycleTone(i: number) {
    const current = data.pins[i]?.tone ?? PIN_TONES[0].key;
    const idx = PIN_TONES.findIndex((t) => t.key === current);
    setPin(i, { tone: PIN_TONES[(idx + 1) % PIN_TONES.length].key });
  }
  function requestChange(nextView: BodyMapView, nextFigure?: BodyMapFigure) {
    const figure = nextFigure ?? data.figure;
    if (nextView === view && figure === data.figure) return;
    if (bodyMapHasContent(data)) setPending({ view: nextView, figure });
    else {
      history.current = [];
      onChange({ view: nextView, figure, pins: [], strokes: [] });
    }
  }

  const strokePath = (pts: number[][]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", !embedded && "lg:flex-row")}>
      {/* The figure */}
      <div className="flex min-h-0 flex-1 flex-col items-center gap-2">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Segmented
              options={
                data.figure
                  ? [
                      { value: "anterior", label: "Body" },
                      { value: "posterior", label: "Back" },
                      { value: "face", label: "Face" },
                    ]
                  : [
                      { value: "anterior", label: "Body" },
                      { value: "face", label: "Face" },
                    ]
              }
              value={view}
              onChange={(v) => requestChange(v as BodyMapView)}
              className={data.figure ? "w-44" : "w-32"}
            />
            {data.figure && (
              <Segmented
                options={[
                  { value: "woman", label: "Woman" },
                  { value: "man", label: "Man" },
                ]}
                value={data.figure}
                onChange={(f) => requestChange(view, f as BodyMapFigure)}
                className="w-36"
              />
            )}
            <Segmented
              options={[
                { value: "pin", label: "Pin" },
                { value: "draw", label: "Draw" },
                { value: "zoom", label: "Zoom" },
              ]}
              value={tool}
              onChange={setTool}
              className="w-44"
            />
            {/* The pin palette — treatment families in colour (v2.1). */}
            {tool === "pin" && (
              <span className="flex items-center gap-1.5">
                {PIN_TONES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    title={pinToneLabel(t.key, legend)}
                    onClick={() => setActiveTone(t.key)}
                    className={cn(
                      "size-5 rounded-full transition-transform",
                      activeTone === t.key
                        ? "scale-110 ring-2 ring-foreground/60 ring-offset-1"
                        : "opacity-70 hover:opacity-100",
                    )}
                    style={{ backgroundColor: t.fill }}
                  />
                ))}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {zoomed && (
              <Button variant="ghost" size="sm" onClick={() => setVb({ x: 0, y: 0, w: dims.w, h: dims.h })}>
                <Shrink className="size-3.5" /> Fit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={undo} disabled={!data.pins.length && !data.strokes.length}>
              <Undo2 className="size-3.5" /> Undo
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} disabled={!data.pins.length && !data.strokes.length}>
              <Eraser className="size-3.5" /> Clear
            </Button>
          </div>
        </div>
        {/* The clinic's legend (T3): named colours read at a glance. */}
        {legend && Object.keys(legend).length > 0 && (
          <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
            {PIN_TONES.filter((t) => legend[t.key]).map((t) => (
              <span key={t.key} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: t.fill }} />
                {legend[t.key]}
              </span>
            ))}
          </div>
        )}
        {/* Switching views clears the marks — say so before doing it. */}
        {pending && (
          <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-warning/10 px-2.5 py-1.5 text-xs text-foreground">
            <span>
              Switching the figure clears this map&apos;s marks.
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  history.current = [];
                  onChange({ view: pending.view, figure: pending.figure, pins: [], strokes: [] });
                  setPending(null);
                }}
                className="rounded-md bg-foreground px-2 py-1 font-semibold text-background"
              >
                Switch & Clear
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-md px-2 py-1 font-medium text-muted-foreground hover:text-foreground"
              >
                Keep
              </button>
            </span>
          </div>
        )}
        {/* Sizing (the second blank-map bug, Roland 2026-07-04): an svg with
            h-full + w-auto inside nested min-h-0 flex resolves to ZERO width
            in real browsers — the width must come from an explicit
            aspect-ratio, and the wrapper guarantees a floor height. Embedded
            (template part) keeps the floor at EVERY breakpoint — there is no
            card height to fill (the "sooo tiny" figure, Roland 2026-07-04). */}
        {/* EMBEDDED SIZING, take two (Roland: "NO I still do not see a body
            map"): h-full is a PERCENTAGE — against a parent whose height comes
            only from min-h it is indefinite, and Safari resolves it to
            nothing (the min-h floor fixed the WRAPPER, not the svg inside).
            Embedded now sets an EXPLICIT pixel height on the svg itself —
            definite by construction, no percentage left to resolve. */}
        <div
          className={cn(
            "flex w-full min-w-0 flex-1 justify-center overflow-hidden",
            !embedded && "min-h-[340px] lg:min-h-0",
          )}
        >
          <svg
            ref={svgRef}
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ aspectRatio: `${dims.w} / ${dims.h}` }}
            className={cn(
              embedded ? (view === "face" ? "h-[400px]" : "h-[480px]") : "h-full",
              "touch-none select-none",
              tool === "pin" ? "cursor-crosshair" : tool === "draw" ? "cursor-cell" : "cursor-zoom-in",
            )}
            aria-label={view === "face" ? "Face map — tap to mark" : "Body map — tap to mark"}
          >
            <BodyFigureArt art={art} view={view} />
            {data.strokes.map((pts, i) => (
              <path
                key={i}
                d={strokePath(pts)}
                fill="none"
                stroke="#e0533f"
                strokeWidth={dims.w * REL.stroke * scale}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            ))}
            {liveStroke && (
              <path
                d={strokePath(liveStroke)}
                fill="none"
                stroke="#e0533f"
                strokeWidth={dims.w * REL.stroke * scale}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.5}
              />
            )}
            {data.pins.map((p, i) => {
              const r = dims.w * REL.pin * scale;
              return (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={r * 1.45} fill={pinFill(p.tone)} opacity={0.2} />
                  <circle cx={p.x} cy={p.y} r={r} fill={pinFill(p.tone)} />
                  <text
                    x={p.x}
                    y={p.y + r * 0.43}
                    textAnchor="middle"
                    fontSize={r * 1.26}
                    fontWeight={600}
                    fill="#fff"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* The marks — structured sub-notes */}
      <div className={cn("w-full space-y-2 overflow-y-auto", !embedded && "lg:w-72")}>
        <p className="text-xs font-semibold tracking-wider text-foreground uppercase">
          Marks
        </p>
        {data.pins.length === 0 && (
          <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            Tap the figure to drop a numbered pin — each pin carries a site, a
            note and a colour (pick one per treatment family). Switch to Draw
            for freehand marking, or Zoom for close-up work — and flip Body ⇄
            Face for facial treatments.
          </p>
        )}
        {data.pins.map((p, i) => (
          <div key={i} className="space-y-1.5 rounded-xl bg-muted/40 p-2.5">
            <p className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => cycleTone(i)}
                  title={`Change Colour — ${pinToneLabel(p.tone, legend)}`}
                  className="flex size-5 items-center justify-center rounded-full text-[11px] font-semibold text-white transition-transform hover:scale-110"
                  style={{ backgroundColor: pinFill(p.tone) }}
                >
                  {i + 1}
                </button>
                Mark {i + 1}
              </span>
              <button
                onClick={() => removePin(i)}
                className="rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:text-critical"
              >
                Remove
              </button>
            </p>
            <Input
              value={p.site}
              placeholder={view === "face" ? "Site — e.g. glabella" : "Site — e.g. left forearm"}
              onChange={(e) => setPin(i, { site: e.target.value })}
            />
            <Input
              value={p.note}
              placeholder={
                view === "face" ? "Note — e.g. 4 units, 30G needle" : "Note — e.g. lesion, 4 mm, irregular border"
              }
              onChange={(e) => setPin(i, { note: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
