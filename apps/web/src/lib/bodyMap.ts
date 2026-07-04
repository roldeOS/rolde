/**
 * Body-Map v2 (Roland greenlit 2026-07-04) — the annotation model. A body-map
 * entry = numbered PINS (each with a site + note, the structured sub-notes)
 * plus optional freehand STROKES, on a named view. Coordinates live in the
 * figure's own viewBox space so they re-render identically at any size.
 * Saved to the feed as a typed `body_map` entry: payload carries the rendered
 * TEXT (the readable record) + the structured marks (the future thumbnail +
 * per-specialty tracking — a derm lesion, an injection point with batch/lot).
 */
export type BodyMapPin = {
  x: number;
  y: number;
  site: string;
  note: string;
};

export type BodyMapStroke = number[][]; // [x, y] points in viewBox space

export type BodyMapData = {
  view: "anterior";
  pins: BodyMapPin[];
  strokes: BodyMapStroke[];
};

/** The readable record — what the feed tile shows and the record keeps. */
export function renderBodyMapText(data: BodyMapData): string {
  const lines = [`Body Map — ${data.pins.length} mark${data.pins.length === 1 ? "" : "s"}`];
  data.pins.forEach((p, i) => {
    const site = p.site.trim();
    const note = p.note.trim();
    lines.push(`${i + 1}. ${site || "Unlabelled site"}${note ? ` — ${note}` : ""}`);
  });
  if (data.strokes.length)
    lines.push(`Freehand markings: ${data.strokes.length}`);
  return lines.join("\n");
}

export const bodyMapHasContent = (d: BodyMapData): boolean =>
  d.pins.length > 0 || d.strokes.length > 0;

export const EMPTY_BODY_MAP: BodyMapData = { view: "anterior", pins: [], strokes: [] };

/** Type guard for a body-map answer riding a template's answers (v2.1 —
 *  the Body Map is a template PART; answers are Json at rest). */
export const isBodyMapData = (v: unknown): v is BodyMapData =>
  typeof v === "object" &&
  v !== null &&
  Array.isArray((v as BodyMapData).pins) &&
  Array.isArray((v as BodyMapData).strokes);
