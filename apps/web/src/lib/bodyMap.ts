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
  /** v2.1 (Roland: "different colours... fillers / anti-wrinkle / PRP") — an
   *  Earth & Bloom tone per pin, so treatment families read at a glance.
   *  Missing = coral (every pre-colour pin stays exactly as recorded). */
  tone?: string;
};

export type BodyMapStroke = number[][]; // [x, y] points in viewBox space

export type BodyMapView = "anterior" | "face";

export type BodyMapData = {
  view: BodyMapView;
  pins: BodyMapPin[];
  strokes: BodyMapStroke[];
};

/** The pin palette — deepened Earth & Bloom (pins need presence on parchment;
 *  the pastels stay for washes). Coral remains the signature default. */
export const PIN_TONES = [
  { key: "coral", label: "Coral", fill: "#e0533f" },
  { key: "amber", label: "Amber", fill: "#C4841D" },
  { key: "sage", label: "Sage", fill: "#63805F" },
  { key: "lavender", label: "Lavender", fill: "#7E71B5" },
  { key: "sky", label: "Sky", fill: "#43799E" },
] as const;
export type PinToneKey = (typeof PIN_TONES)[number]["key"];

export const pinFill = (tone?: string): string =>
  PIN_TONES.find((t) => t.key === tone)?.fill ?? PIN_TONES[0].fill;

const pinToneLabel = (tone?: string): string =>
  PIN_TONES.find((t) => t.key === tone)?.label ?? PIN_TONES[0].label;

/** The readable record — what the feed tile shows and the record keeps. When
 *  a map uses MORE than one pin colour, each line names its colour (the
 *  colours carry meaning — e.g. toxin vs filler — so the text must too). */
export function renderBodyMapText(data: BodyMapData): string {
  const title = data.view === "face" ? "Face Map" : "Body Map";
  const lines = [`${title} — ${data.pins.length} mark${data.pins.length === 1 ? "" : "s"}`];
  const multiTone = new Set(data.pins.map((p) => p.tone ?? "coral")).size > 1;
  data.pins.forEach((p, i) => {
    const site = p.site.trim();
    const note = p.note.trim();
    const toneTag = multiTone ? ` [${pinToneLabel(p.tone)}]` : "";
    lines.push(`${i + 1}. ${site || "Unlabelled site"}${note ? ` — ${note}` : ""}${toneTag}`);
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
