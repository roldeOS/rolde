"use client";

import { useRef, useState } from "react";
import { Undo2, Eraser, Shrink } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { BODY_PATH } from "./bodyFigure";
import { type BodyMapData, type BodyMapPin } from "@/lib/bodyMap";
import { cn } from "@/lib/utils";

const VB_W = 970;
const VB_H = 2200;
/** Freehand points are thinned to every ~12 viewBox units — smooth to the eye,
 *  small in the payload. */
const MIN_DIST = 12;

type Tool = "pin" | "draw" | "zoom";

/** Region zoom (v2.1) — one tap frames a close-up at 1/ZOOM_FACTOR of the
 *  figure, centred on the tap; taps while zoomed re-centre; Fit returns. */
const ZOOM_FACTOR = 3;
const FULL_VB = { x: 0, y: 0, w: VB_W, h: VB_H };

/**
 * The Body-Map annotator (Body-Map v2 prototype, Roland greenlit 2026-07-04) —
 * a Scribe MODE (APPROVALS §4.3): the real public-domain anatomical figure,
 * restyled Earth & Bloom, with numbered PINS that open structured sub-notes
 * (site + note) and a freehand MARKER. Tap the figure to mark; the pin list
 * rides beside it (beneath on narrow screens). Coordinates live in viewBox
 * space — identical at every size, tablet-first.
 */
export function BodyMapPanel({
  data,
  onChange,
}: {
  data: BodyMapData;
  onChange: (next: BodyMapData) => void;
}) {
  const [tool, setTool] = useState<Tool>("pin");
  const [vb, setVb] = useState(FULL_VB);
  const zoomed = vb.w < VB_W;
  // Marks keep a CONSTANT apparent size: their viewBox-unit sizes shrink with
  // the window so a close-up shows finer pins/lines, not comically fat ones.
  const scale = vb.w / VB_W;
  const svgRef = useRef<SVGSVGElement>(null);
  const drawing = useRef<number[][] | null>(null);
  const [liveStroke, setLiveStroke] = useState<number[][] | null>(null);
  // One undo history across both tools: what got added last comes off first.
  const history = useRef<("pin" | "stroke")[]>([]);

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
    const w = VB_W / ZOOM_FACTOR;
    const h = VB_H / ZOOM_FACTOR;
    setVb({
      x: Math.max(0, Math.min(pt[0] - w / 2, VB_W - w)),
      y: Math.max(0, Math.min(pt[1] - h / 2, VB_H - h)),
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
        pins: [...data.pins, { x: pt[0], y: pt[1], site: "", note: "" }],
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
    if (Math.hypot(pt[0] - last[0], pt[1] - last[1]) < MIN_DIST * scale) return;
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

  const strokePath = (pts: number[][]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
      {/* The figure */}
      <div className="flex min-h-0 flex-1 flex-col items-center gap-2">
        <div className="flex w-full items-center justify-between gap-2">
          <Segmented
            options={[
              { value: "pin", label: "Pin" },
              { value: "draw", label: "Draw" },
              { value: "zoom", label: "Zoom" },
            ]}
            value={tool}
            onChange={setTool}
            className="w-56"
          />
          <div className="flex items-center gap-1">
            {zoomed && (
              <Button variant="ghost" size="sm" onClick={() => setVb(FULL_VB)}>
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
        {/* Sizing (the second blank-map bug, Roland 2026-07-04): an svg with
            h-full + w-auto inside nested min-h-0 flex resolves to ZERO width
            in real browsers — the width must come from an explicit
            aspect-ratio, and the wrapper guarantees a floor height. */}
        <div className="flex min-h-[340px] w-full min-w-0 flex-1 justify-center overflow-hidden lg:min-h-0">
          <svg
            ref={svgRef}
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ aspectRatio: "970 / 2200" }}
            className={cn(
              "h-full touch-none select-none",
              tool === "pin" ? "cursor-crosshair" : tool === "draw" ? "cursor-cell" : "cursor-zoom-in",
            )}
            aria-label="Body map — tap to mark"
          >
            {/* PD figure (Häggström/RexxS, Wikimedia Commons) in Earth & Bloom.
                The source path is authored around a translate — without it the
                figure draws 625 units above the canvas (the blank-map bug,
                Roland 2026-07-04). */}
            <g transform="translate(41.500029,630.92312)">
              <path d={BODY_PATH} fill="#E7E2D6" stroke="#C9C2B0" strokeWidth={4} />
            </g>
            {data.strokes.map((pts, i) => (
              <path
                key={i}
                d={strokePath(pts)}
                fill="none"
                stroke="#e0533f"
                strokeWidth={10 * scale}
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
                strokeWidth={10 * scale}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.5}
              />
            )}
            {data.pins.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={34 * scale} fill="#e0533f" opacity={0.2} />
                <circle cx={p.x} cy={p.y} r={22 * scale} fill="#e0533f" />
                <text
                  x={p.x}
                  y={p.y + 10 * scale}
                  textAnchor="middle"
                  fontSize={30 * scale}
                  fontWeight={600}
                  fill="#fff"
                >
                  {i + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* The marks — structured sub-notes */}
      <div className="w-full space-y-2 overflow-y-auto lg:w-72">
        <p className="text-xs font-semibold tracking-wider text-foreground uppercase">
          Marks
        </p>
        {data.pins.length === 0 && (
          <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            Tap the figure to drop a numbered pin — each pin carries a site and
            a note. Switch to Draw for freehand marking, or Zoom for close-up
            work (Fit brings the whole figure back).
          </p>
        )}
        {data.pins.map((p, i) => (
          <div key={i} className="space-y-1.5 rounded-xl bg-muted/40 p-2.5">
            <p className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#e0533f] text-[11px] font-semibold text-white">
                  {i + 1}
                </span>
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
              placeholder="Site — e.g. left forearm"
              onChange={(e) => setPin(i, { site: e.target.value })}
            />
            <Input
              value={p.note}
              placeholder="Note — e.g. lesion, 4 mm, irregular border"
              onChange={(e) => setPin(i, { note: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
