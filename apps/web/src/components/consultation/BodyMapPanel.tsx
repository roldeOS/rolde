"use client";

import { useRef, useState } from "react";
import { Undo2, Eraser } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { BODY_PATH, BODY_VIEWBOX } from "./bodyFigure";
import { type BodyMapData, type BodyMapPin } from "@/lib/bodyMap";
import { cn } from "@/lib/utils";

const VB_W = 970;
const VB_H = 2200;
/** Freehand points are thinned to every ~12 viewBox units — smooth to the eye,
 *  small in the payload. */
const MIN_DIST = 12;

type Tool = "pin" | "draw";

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
    return [
      Math.round(((e.clientX - r.left) / r.width) * VB_W),
      Math.round(((e.clientY - r.top) / r.height) * VB_H),
    ];
  };

  function onPointerDown(e: React.PointerEvent) {
    const pt = toViewBox(e);
    if (!pt) return;
    if (tool === "pin") {
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
    if (Math.hypot(pt[0] - last[0], pt[1] - last[1]) < MIN_DIST) return;
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
            ]}
            value={tool}
            onChange={setTool}
            className="w-40"
          />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={undo} disabled={!data.pins.length && !data.strokes.length}>
              <Undo2 className="size-3.5" /> Undo
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} disabled={!data.pins.length && !data.strokes.length}>
              <Eraser className="size-3.5" /> Clear
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={BODY_VIEWBOX}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={cn(
              "h-full max-h-full w-auto touch-none select-none",
              tool === "pin" ? "cursor-crosshair" : "cursor-cell",
            )}
            aria-label="Body map — tap to mark"
          >
            {/* PD figure (Häggström/RexxS, Wikimedia Commons) in Earth & Bloom. */}
            <path d={BODY_PATH} fill="#E7E2D6" stroke="#C9C2B0" strokeWidth={4} />
            {data.strokes.map((pts, i) => (
              <path
                key={i}
                d={strokePath(pts)}
                fill="none"
                stroke="#e0533f"
                strokeWidth={10}
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
                strokeWidth={10}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.5}
              />
            )}
            {data.pins.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={34} fill="#e0533f" opacity={0.2} />
                <circle cx={p.x} cy={p.y} r={22} fill="#e0533f" />
                <text
                  x={p.x}
                  y={p.y + 10}
                  textAnchor="middle"
                  fontSize={30}
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
            a note. Switch to Draw for freehand marking.
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
