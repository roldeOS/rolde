"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ZoomIn, X } from "lucide-react";
import { formatDay2 } from "@/lib/dates";
import {
  ROLDE_TEMPLATE_LIBRARY,
  VITALS_FIELDS,
  TEMP_UNIT_INDEX,
  sanitiseParts,
  type TemplateAnswers,
} from "@/lib/scribeTemplates";
import { BodyFigureArt, resolveFigureArt } from "./BodyFigureArt";
import {
  isBodyMapData,
  bodyMapHasContent,
  pinFill,
  strokePoints,
  strokeTone,
  strokeLabel,
  type BodyMapData,
} from "@/lib/bodyMap";
import { cn } from "@/lib/utils";

/**
 * StructuredNoteBody (Roland 2026-07-04, URDS law) — a template-authored note
 * renders on its tile with REAL typography, never a text gumbo: section
 * headings as semibold micro-headers, each answer as a "Label: value" row
 * with the label semibold, checkbox picks joined with middots, vitals inline
 * with their units. The plain payload.text stays the CANONICAL record (PDF,
 * exports, search) — this is its display form. Falls back to pre-wrapped text
 * for notes without structured answers.
 */
export function StructuredNoteBody({
  template,
  answers,
  struck,
}: {
  /** The payload's template meta — T2 notes carry a NAME + PARTS snapshot
   *  (personal templates render forever, however the template later changes);
   *  pre-snapshot notes fall back to the library by id. */
  template: { id: string; name?: string; parts?: unknown };
  answers: TemplateAnswers;
  struck?: boolean;
}) {
  const snapParts = template.parts ? sanitiseParts(template.parts) : null;
  const lib = snapParts ? undefined : ROLDE_TEMPLATE_LIBRARY.find((x) => x.id === template.id);
  const t = snapParts
    ? { name: template.name ?? lib?.name ?? "Template", parts: snapParts }
    : lib;
  if (!t) return null;

  const rows: React.ReactNode[] = [
    <p key="name" className="text-sm font-semibold">
      {t.name}
    </p>,
  ];
  let heading = "";
  t.parts.forEach((p, i) => {
    const a = answers[i];
    const labelled = (label: string, value: string) => {
      const dedup = label.trim().toLowerCase() === heading.trim().toLowerCase();
      rows.push(
        <p key={i} className="text-sm">
          {!dedup && <span className="font-semibold">{label}: </span>}
          <span className="whitespace-pre-wrap">{value}</span>
        </p>,
      );
    };
    switch (p.kind) {
      case "heading":
        heading = p.label;
        rows.push(
          <p
            key={i}
            className="pt-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            {p.label}
          </p>,
        );
        break;
      case "instruction":
        break;
      case "text":
      case "textarea":
      case "dropdown":
        if (typeof a === "string" && a.trim()) labelled(p.label, a.trim());
        break;
      case "date":
        if (typeof a === "string" && a.trim()) {
          const d = new Date(a);
          labelled(
            p.label,
            Number.isFinite(d.getTime()) ? formatDay2(d) : a,
          );
        }
        break;
      case "vitals": {
        if (!Array.isArray(a)) break;
        const unit = String(a[TEMP_UNIT_INDEX] ?? "c") === "f" ? "°F" : "°C";
        const bits = VITALS_FIELDS.map((f, j) => {
          const v = String(a[j] ?? "").trim();
          if (!v) return null;
          const u = f.key === "temp" ? unit : f.unit;
          return `${f.label} ${v}${u ? ` ${u}` : ""}`;
        }).filter(Boolean);
        if (bits.length) labelled(p.label, bits.join(" · "));
        break;
      }
      case "checkboxes":
        if (Array.isArray(a) && a.length && a.every((v) => typeof v === "string"))
          labelled(p.label, a.join(" · "));
        break;
      case "body_map":
        // The template part renders like the body-map tile: the FIGURE with
        // its marks beside the numbered pin notes (URDS structured-tile law).
        if (isBodyMapData(a) && bodyMapHasContent(a)) {
          rows.push(
            <div key={i} className="flex flex-wrap items-start gap-3 pt-1">
              <BodyMapThumbnail data={a} />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm">
                  <span className="font-semibold">{p.label}: </span>
                  {a.pins.length} mark{a.pins.length === 1 ? "" : "s"}
                </p>
                {a.pins.map((pin, j) => (
                  <p key={j} className="text-sm">
                    {j + 1}. {pin.site.trim() || "Unlabelled site"}
                    {pin.note.trim() ? ` — ${pin.note.trim()}` : ""}
                  </p>
                ))}
                {a.strokes.length > 0 &&
                  (a.strokes.some((s) => strokeLabel(s).trim()) ? (
                    a.strokes.map((s, j) =>
                      strokeLabel(s).trim() ? (
                        <p key={`d${j}`} className="text-sm">
                          <span
                            className="mr-1 inline-block size-2.5 shrink-0 rounded-full align-middle"
                            style={{ backgroundColor: pinFill(strokeTone(s)) }}
                          />
                          {strokeLabel(s).trim()}
                        </p>
                      ) : null,
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Freehand markings: {a.strokes.length}
                    </p>
                  ))}
              </div>
            </div>,
          );
        }
        break;
      case "range":
        if (typeof a === "number") labelled(p.label, `${a}/${p.max}`);
        break;
    }
  });

  return (
    <div className={cn("mt-2 space-y-1", struck && "text-muted-foreground line-through")}>
      {rows}
    </div>
  );
}

const strokePathOf = (pts: number[][]) =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");

type FigureArt = ReturnType<typeof resolveFigureArt>;

/** The figure + its strokes + numbered pins in figure-space — shared by the tile
 *  thumbnail and the zoom lightbox, so they can never drift. `scale` grows the
 *  pin/stroke sizes when the view is cropped in close (#6.4 auto-frame). */
function FigureMarks({
  data,
  view,
  art,
  scale = 1,
}: {
  data: BodyMapData;
  view: "anterior" | "posterior" | "face";
  art: FigureArt;
  scale?: number;
}) {
  const r = art.w * 0.045 * scale;
  return (
    <>
      <BodyFigureArt art={art} view={view} />
      {data.strokes?.map((s, i) => (
        <path
          key={i}
          d={strokePathOf(strokePoints(s))}
          fill="none"
          stroke={pinFill(strokeTone(s))}
          strokeWidth={art.w * 0.0145 * scale}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />
      ))}
      {data.pins?.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={r} fill={pinFill(p.tone)} />
          <text
            x={p.x}
            y={p.y + r * 0.39}
            textAnchor="middle"
            fontSize={r * 1.27}
            fontWeight={600}
            fill="#fff"
          >
            {i + 1}
          </text>
        </g>
      ))}
    </>
  );
}

/** #6.4 auto-frame — the viewBox cropped to the marks (with padding + a minimum
 *  size so one small lesion doesn't over-zoom), clamped inside the figure. No
 *  marks → the whole figure. Returns the viewBox, its aspect, and the zoom scale
 *  (how much tighter than the full figure), so marks stay legibly sized. */
function framing(data: BodyMapData, art: FigureArt) {
  const [vx, vy, vw, vh] = art.viewBox.split(/\s+/).map(Number);
  const pts: number[][] = [
    ...(data.pins?.map((p) => [p.x, p.y]) ?? []),
    ...(data.strokes?.flatMap((s) => strokePoints(s)) ?? []),
  ];
  if (!pts.length) return { viewBox: art.viewBox, aspect: `${art.w} / ${art.h}`, scale: 1 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  minX -= art.w * 0.14; maxX += art.w * 0.14;
  minY -= art.h * 0.08; maxY += art.h * 0.08;
  // Minimum framed size — a single pin keeps useful surrounding context.
  const minW = vw * 0.42, minH = vh * 0.42;
  if (maxX - minX < minW) { const c = (minX + maxX) / 2; minX = c - minW / 2; maxX = c + minW / 2; }
  if (maxY - minY < minH) { const c = (minY + maxY) / 2; minY = c - minH / 2; maxY = c + minH / 2; }
  // Clamp inside the figure, preserving the box size where possible.
  if (minX < vx) { maxX += vx - minX; minX = vx; }
  if (minY < vy) { maxY += vy - minY; minY = vy; }
  if (maxX > vx + vw) { minX -= maxX - (vx + vw); maxX = vx + vw; }
  if (maxY > vy + vh) { minY -= maxY - (vy + vh); maxY = vy + vh; }
  minX = Math.max(vx, minX); minY = Math.max(vy, minY);
  const w = maxX - minX, h = maxY - minY;
  return { viewBox: `${minX} ${minY} ${w} ${h}`, aspect: `${w} / ${h}`, scale: Math.min(vw / w, 2.2) };
}

/**
 * BodyMapThumbnail (Roland 2026-07-04 "show the body and the markings on the
 * tile"; #6.4 2026-07-24) — a read-only mini render of the annotated figure,
 * AUTO-FRAMED to the marks so a small lesion is actually visible, and TAP-TO-ZOOM
 * into a full-figure lightbox with a numbered legend.
 */
export function BodyMapThumbnail({ data }: { data: BodyMapData }) {
  const [zoom, setZoom] = useState(false);
  const view =
    data.view === "face" ? "face" : data.view === "posterior" ? "posterior" : "anterior";
  const art = resolveFigureArt(data);
  const frame = framing(data, art);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoom]);

  return (
    <>
      <button
        type="button"
        onClick={() => setZoom(true)}
        title="Tap to zoom"
        className={cn(
          "group/bm relative shrink-0 overflow-hidden rounded-lg bg-muted/30 ring-1 ring-black/[0.04] transition-shadow hover:shadow",
          view === "face" ? "h-40" : "h-48",
        )}
      >
        <svg
          viewBox={frame.viewBox}
          preserveAspectRatio="xMidYMid meet"
          style={{ aspectRatio: frame.aspect }}
          className={cn("block", view === "face" ? "h-40" : "h-48")}
          aria-label={view === "face" ? "Face map thumbnail" : "Body map thumbnail"}
        >
          <FigureMarks data={data} view={view} art={art} scale={frame.scale} />
        </svg>
        <span className="absolute right-1 bottom-1 flex size-5 items-center justify-center rounded-md bg-foreground/55 text-background opacity-0 transition-opacity group-hover/bm:opacity-100">
          <ZoomIn className="size-3" />
        </span>
      </button>

      {zoom &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setZoom(false)}
          >
            <div
              className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-card shadow-overlay"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
                <p className="text-sm font-semibold">
                  {data.view === "face" ? "Face Map" : data.view === "posterior" ? "Body Map (Back)" : "Body Map"}
                </p>
                <button
                  onClick={() => setZoom(false)}
                  aria-label="Close"
                  className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4 sm:flex-row">
                <svg
                  viewBox={art.viewBox}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ aspectRatio: `${art.w} / ${art.h}` }}
                  className="mx-auto max-h-[72vh] w-auto shrink-0 rounded-lg bg-muted/30"
                  aria-label="Full body map"
                >
                  <FigureMarks data={data} view={view} art={art} />
                </svg>
                {(data.pins?.length ?? 0) + (data.strokes?.length ?? 0) > 0 && (
                  <ul className="min-w-0 flex-1 space-y-1.5 text-sm sm:max-w-[16rem]">
                    {data.pins?.map((p, i) => (
                      <li key={`p${i}`} className="flex items-start gap-2">
                        <span
                          className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                          style={{ backgroundColor: pinFill(p.tone) }}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0">
                          {p.site && <span className="font-medium">{p.site}</span>}
                          {p.site && p.note ? " — " : ""}
                          {p.note && <span className="text-muted-foreground">{p.note}</span>}
                        </span>
                      </li>
                    ))}
                    {data.strokes?.map((s, i) => (
                      <li key={`s${i}`} className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className="h-1 w-4 shrink-0 rounded-full"
                          style={{ backgroundColor: pinFill(strokeTone(s)) }}
                        />
                        {strokeLabel(s) || "Drawing"}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
