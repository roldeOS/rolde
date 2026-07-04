"use client";

import {
  ROLDE_TEMPLATE_LIBRARY,
  VITALS_FIELDS,
  TEMP_UNIT_INDEX,
  type TemplateAnswers,
} from "@/lib/scribeTemplates";
import { BODY_PATH, BODY_VIEWBOX } from "./bodyFigure";
import { type BodyMapData } from "@/lib/bodyMap";
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
  templateId,
  answers,
  struck,
}: {
  templateId: string;
  answers: TemplateAnswers;
  struck?: boolean;
}) {
  const t = ROLDE_TEMPLATE_LIBRARY.find((x) => x.id === templateId);
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
        if (Array.isArray(a) && a.length) labelled(p.label, a.join(" · "));
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
  const strokePath = (pts: number[][]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  return (
    <svg
      viewBox={BODY_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      style={{ aspectRatio: "970 / 2200" }}
      className="h-48 shrink-0 rounded-lg bg-muted/30"
      aria-label="Body map thumbnail"
    >
      <g transform="translate(41.500029,630.92312)">
        <path d={BODY_PATH} fill="#E7E2D6" stroke="#C9C2B0" strokeWidth={4} />
      </g>
      {data.strokes?.map((pts, i) => (
        <path
          key={i}
          d={strokePath(pts)}
          fill="none"
          stroke="#e0533f"
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />
      ))}
      {data.pins?.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={40} fill="#e0533f" />
          <text
            x={p.x}
            y={p.y + 16}
            textAnchor="middle"
            fontSize={52}
            fontWeight={600}
            fill="#fff"
          >
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
