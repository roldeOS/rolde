"use client";

import {
  ROLDE_TEMPLATE_LIBRARY,
  VITALS_FIELDS,
  TEMP_UNIT_INDEX,
  sanitiseParts,
  type TemplateAnswers,
} from "@/lib/scribeTemplates";
import { BodyFigureArt, resolveFigureArt } from "./BodyFigureArt";
import { isBodyMapData, bodyMapHasContent, pinFill, type BodyMapData } from "@/lib/bodyMap";
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
            Number.isFinite(d.getTime())
              ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
              : a,
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
                {a.strokes.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Freehand markings: {a.strokes.length}
                  </p>
                )}
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

/**
 * BodyMapThumbnail (Roland 2026-07-04: "the body map should show the body and
 * the markings on the tile") — a read-only mini render of the annotated
 * figure: same artwork, same coordinates, pins numbered, strokes drawn.
 */
export function BodyMapThumbnail({ data }: { data: BodyMapData }) {
  const view =
    data.view === "face" ? "face" : data.view === "posterior" ? "posterior" : "anterior";
  const art = resolveFigureArt(data);
  const strokePath = (pts: number[][]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  return (
    <svg
      viewBox={art.viewBox}
      preserveAspectRatio="xMidYMid meet"
      style={{ aspectRatio: `${art.w} / ${art.h}` }}
      className={cn("shrink-0 rounded-lg bg-muted/30", view === "face" ? "h-40" : "h-48")}
      aria-label={view === "face" ? "Face map thumbnail" : "Body map thumbnail"}
    >
      <BodyFigureArt art={art} view={view} />
      {data.strokes?.map((pts, i) => (
        <path
          key={i}
          d={strokePath(pts)}
          fill="none"
          stroke="#e0533f"
          strokeWidth={art.w * 0.0145}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />
      ))}
      {data.pins?.map((p, i) => {
        const r = art.w * 0.045;
        return (
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
        );
      })}
    </svg>
  );
}
