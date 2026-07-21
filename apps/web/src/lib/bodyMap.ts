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

/** v2.2 (Roland 2026-07-21: "more colour choices... label what I draw"): a
 *  drawing now carries its own colour + a label, like a pin. LEGACY strokes
 *  were bare `[x,y]` point arrays — both shapes render forever (records law):
 *  a bare array is a coral, unlabelled drawing. */
export type BodyMapDrawing = {
  points: number[][]; // [x, y] points in viewBox space
  tone?: string;
  label?: string;
};
export type BodyMapStroke = number[][] | BodyMapDrawing;

/** Read either shape without a care for its era. */
export const strokePoints = (s: BodyMapStroke): number[][] =>
  Array.isArray(s) ? s : Array.isArray(s?.points) ? s.points : [];
export const strokeTone = (s: BodyMapStroke): string | undefined =>
  Array.isArray(s) ? undefined : s?.tone;
export const strokeLabel = (s: BodyMapStroke): string =>
  Array.isArray(s) ? "" : (s?.label ?? "");

export type BodyMapView = "anterior" | "posterior" | "face";
/** v3 artwork (Roland's own rights-owned figures, 2026-07-21): every NEW map
 *  names its figure; maps saved before this render on the ORIGINAL artwork —
 *  their pin coordinates belong to it (clinical records never re-project). */
export type BodyMapFigure = "woman" | "man";

export type BodyMapData = {
  view: BodyMapView;
  /** Missing = a legacy map (pre-figure artwork). */
  figure?: BodyMapFigure;
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
  { key: "plum", label: "Plum", fill: "#9C5A74" },
  { key: "teal", label: "Teal", fill: "#3E7F7C" },
  { key: "cocoa", label: "Cocoa", fill: "#8A6248" },
] as const;
export type PinToneKey = (typeof PIN_TONES)[number]["key"];

export const pinFill = (tone?: string): string =>
  PIN_TONES.find((t) => t.key === tone)?.fill ?? PIN_TONES[0].fill;

/** T3: the clinic's legend names win — coral becomes "Anti-Wrinkle" on the
 *  printed record when the Caretaker has named it. */
export type BodymapLegendNames = Record<string, string>;
export const pinToneLabel = (tone?: string, legend?: BodymapLegendNames): string => {
  const key = PIN_TONES.find((t) => t.key === tone)?.key ?? PIN_TONES[0].key;
  return legend?.[key] || PIN_TONES.find((t) => t.key === key)!.label;
};

/** The readable record — what the feed tile shows and the record keeps. When
 *  a map uses MORE than one pin colour, each line names its colour (the
 *  colours carry meaning — e.g. toxin vs filler — so the text must too). */
export function renderBodyMapText(data: BodyMapData, legend?: BodymapLegendNames): string {
  const title =
    data.view === "face" ? "Face Map" : data.view === "posterior" ? "Back Map" : "Body Map";
  const figure = data.figure === "man" ? " (Man)" : data.figure === "woman" ? " (Woman)" : "";
  const lines = [`${title}${figure} — ${data.pins.length} mark${data.pins.length === 1 ? "" : "s"}`];
  // Colours carry meaning (toxin vs filler), so when a map mixes them — across
  // pins AND drawings — every line names its colour.
  const multiTone =
    new Set([
      ...data.pins.map((p) => p.tone ?? "coral"),
      ...data.strokes.map((s) => strokeTone(s) ?? "coral"),
    ]).size > 1;
  data.pins.forEach((p, i) => {
    const site = p.site.trim();
    const note = p.note.trim();
    const toneTag = multiTone ? ` [${pinToneLabel(p.tone, legend)}]` : "";
    lines.push(`${i + 1}. ${site || "Unlabelled site"}${note ? ` — ${note}` : ""}${toneTag}`);
  });
  if (data.strokes.length) {
    // v2.2 — a labelled drawing reads into the record like a mark; bare/legacy
    // drawings just count.
    const labelled = data.strokes.filter((s) => strokeLabel(s).trim());
    if (labelled.length === 0) {
      lines.push(`Freehand markings: ${data.strokes.length}`);
    } else {
      lines.push(`Drawings: ${data.strokes.length}`);
      data.strokes.forEach((s) => {
        const lbl = strokeLabel(s).trim();
        if (!lbl) return;
        const toneTag = multiTone ? ` [${pinToneLabel(strokeTone(s), legend)}]` : "";
        lines.push(`• ${lbl}${toneTag}`);
      });
    }
  }
  return lines.join("\n");
}

export const bodyMapHasContent = (d: BodyMapData): boolean =>
  d.pins.length > 0 || d.strokes.length > 0;

export const EMPTY_BODY_MAP: BodyMapData = { view: "anterior", figure: "woman", pins: [], strokes: [] };

/** Type guard for a body-map answer riding a template's answers (v2.1 —
 *  the Body Map is a template PART; answers are Json at rest). */
export const isBodyMapData = (v: unknown): v is BodyMapData =>
  typeof v === "object" &&
  v !== null &&
  Array.isArray((v as BodyMapData).pins) &&
  Array.isArray((v as BodyMapData).strokes);
