/**
 * RolDe Scribe Templates (Roland's concept, GREENLIT 2026-07-04) — T1: the
 * PARTS model + the curated RolDe library. A template is an ordered list of
 * typed parts; filling one in Scribe renders a clean, readable clinical note
 * (the record of truth stays the rendered TEXT — structured answers join the
 * payload at T2). Curation beats volume (Roland on Jane's 50,000: "a landfill,
 * not a library") — this set stays small, excellent, and blessed; personal +
 * clinic templates arrive at T2/T3 on the same parts.
 *
 * Enriched 2026-07-04 (Roland: "elegant and rich… make SOAP the ABSOLUTE
 * BEST"): + date parts, heading-aware rendering (no more "SUBJECTIVE /
 * Subjective:" doubling), ICE in the GP consult, Fitzpatrick in derm, review
 * intervals in aesthetics, risk notes in therapy, outcome measures in physio.
 * Product dropdowns become DATA-BOUND (the clinic's own stock list) when W6.1
 * Inventory lands — options here are the sane starting set.
 */
import {
  isBodyMapData,
  bodyMapHasContent,
  renderBodyMapText,
  type BodyMapData,
  type BodymapLegendNames,
} from "@/lib/bodyMap";
export type TemplatePart =
  | { kind: "heading"; label: string }
  | { kind: "instruction"; text: string }
  | { kind: "text"; label: string; placeholder?: string }
  | { kind: "textarea"; label: string; placeholder?: string }
  | { kind: "date"; label: string }
  | { kind: "vitals"; label: string }
  | { kind: "checkboxes"; label: string; options: string[] }
  | { kind: "dropdown"; label: string; options: string[] }
  /** Body-Map v2.1 (Roland "Get me?" → approved): the annotator IS a template
   *  part — a lesion chart inside Lesion Review, injection sites inside the
   *  toxin record; T2/T3 builders offer it like any other part. */
  | { kind: "body_map"; label: string }
  | {
      kind: "range";
      label: string;
      min: number;
      max: number;
      minLabel?: string;
      maxLabel?: string;
    };

export type ScribeTemplate = {
  id: string;
  name: string;
  specialty: string;
  parts: TemplatePart[];
};

export type TemplateAnswers = Record<number, string | string[] | number | BodyMapData>;

/** The canonical vitals shape (Roland 2026-07-04: "Vital Signs should
 *  auto-populate") — the SAME keys a vital_signs feed entry carries, so the
 *  form pre-fills from the latest recorded set today and from the W1.2.7
 *  Vitals module when it lands. Stored per-template as a fixed-order array. */
export const VITALS_FIELDS = [
  { key: "bp", label: "BP", unit: "", placeholder: "128/82", maxLen: 7 },
  { key: "hr", label: "HR", unit: "bpm", placeholder: "72", maxLen: 3 },
  { key: "temp", label: "Temp", unit: "°C", placeholder: "36.8", maxLen: 5 },
  { key: "spo2", label: "SpO₂", unit: "%", placeholder: "98", maxLen: 3 },
  { key: "rr", label: "RR", unit: "/min", placeholder: "16", maxLen: 2 },
  { key: "weight", label: "Weight", unit: "kg", placeholder: "72", maxLen: 5 },
] as const;
export type VitalKey = (typeof VITALS_FIELDS)[number]["key"];
/** The temp unit rides the vitals array as a 7th slot ("c" | "f") — flipped on
 *  the field itself; the default follows the clinic's country (US/CA → °F). */
export type TempUnit = "c" | "f";
export const TEMP_UNIT_INDEX = VITALS_FIELDS.length;
export const defaultTempUnit = (country: string | null | undefined): TempUnit =>
  country === "US" ? "f" : "c";

/** Keep only what each vital is MADE of while typing (Roland 2026-07-04 —
 *  "I thought you were smart enough to know what values can be entered in a
 *  blood-pressure field"): BP = digits + one slash; temp/weight = digits + one
 *  dot; the rest digits only. */
export function sanitiseVital(key: VitalKey, v: string): string {
  const f = VITALS_FIELDS.find((x) => x.key === key)!;
  let out: string;
  if (key === "bp") {
    const kept = v.replace(/[^\d/]/g, "");
    const [a, ...rest] = kept.split("/");
    out = rest.length ? `${a}/${rest.join("").replace(/\//g, "")}` : a;
  } else if (key === "temp" || key === "weight") {
    const kept = v.replace(/[^\d.]/g, "");
    const [a, ...rest] = kept.split(".");
    out = rest.length ? `${a}.${rest.join("").replace(/\./g, "")}` : a;
  } else {
    out = v.replace(/\D/g, "");
  }
  return out.slice(0, f.maxLen);
}

/** Clinically PLAUSIBLE ranges — wide enough for real extremes, closed to
 *  nonsense. Empty = fine (unanswered); implausible blocks Save. */
export function vitalOk(key: VitalKey, v: string, tempUnit: TempUnit = "c"): boolean {
  const t = v.trim();
  if (!t) return true;
  switch (key) {
    case "bp": {
      const m = /^(\d{2,3})\/(\d{2,3})$/.exec(t);
      if (!m) return false;
      const sys = Number(m[1]);
      const dia = Number(m[2]);
      return sys >= 40 && sys <= 300 && dia >= 20 && dia <= 200 && sys > dia;
    }
    case "hr": {
      const n = Number(t);
      return n >= 10 && n <= 300;
    }
    case "temp": {
      const n = Number(t);
      // °C 25–45 · °F 77–113 (the same physiological window).
      return tempUnit === "f" ? n >= 77 && n <= 113 : n >= 25 && n <= 45;
    }
    case "spo2": {
      const n = Number(t);
      return n >= 40 && n <= 100;
    }
    case "rr": {
      const n = Number(t);
      return n >= 4 && n <= 80;
    }
    case "weight": {
      const n = Number(t);
      return n >= 0.5 && n <= 500;
    }
  }
}

/** True when every ANSWERED validating part is plausible — Save requires it. */
export function templateAnswersValid(t: ScribeTemplate, answers: TemplateAnswers): boolean {
  return t.parts.every((p, i) => {
    if (p.kind !== "vitals") return true;
    const a = answers[i];
    if (!Array.isArray(a)) return true;
    const unit: TempUnit = String(a[TEMP_UNIT_INDEX] ?? "c") === "f" ? "f" : "c";
    return VITALS_FIELDS.every((f, j) => vitalOk(f.key, String(a[j] ?? ""), unit));
  });
}

const fmtDate = (iso: string) => {
  const t = new Date(iso);
  return Number.isFinite(t.getTime())
    ? t.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : iso;
};

/** Compose the note TEXT from a filled template — plain, readable, verbatim.
 *  Unanswered parts are omitted (an honest note never says "N/A"), and a field
 *  whose label repeats its section heading renders WITHOUT the label prefix
 *  (no "SUBJECTIVE / Subjective:" doubling — Roland 2026-07-04). */
export function renderTemplate(t: ScribeTemplate, answers: TemplateAnswers, legend?: BodymapLegendNames): string {
  const lines: string[] = [t.name];
  let heading = "";
  const push = (label: string, value: string) => {
    if (label.trim().toLowerCase() === heading.trim().toLowerCase()) lines.push(value);
    else lines.push(`${label}: ${value}`);
  };
  t.parts.forEach((p, i) => {
    const a = answers[i];
    switch (p.kind) {
      case "heading":
        heading = p.label;
        lines.push("", p.label.toUpperCase());
        break;
      case "instruction":
        break; // guidance for the writer — never part of the record
      case "text":
      case "textarea":
      case "dropdown":
        if (typeof a === "string" && a.trim()) push(p.label, a.trim());
        break;
      case "date":
        if (typeof a === "string" && a.trim()) push(p.label, fmtDate(a));
        break;
      case "vitals":
        if (Array.isArray(a) && a.slice(0, VITALS_FIELDS.length).some((v) => String(v).trim())) {
          const unit = String(a[TEMP_UNIT_INDEX] ?? "c") === "f" ? "°F" : "°C";
          const bits = VITALS_FIELDS.map((f, j) => {
            const v = String(a[j] ?? "").trim();
            if (!v) return null;
            const u = f.key === "temp" ? unit : f.unit;
            return `${f.label} ${v}${u ? ` ${u}` : ""}`;
          }).filter(Boolean);
          push(p.label, bits.join(" · "));
        }
        break;
      case "checkboxes":
        if (Array.isArray(a) && a.length && a.every((v) => typeof v === "string"))
          push(p.label, a.join(" · "));
        break;
      case "body_map":
        if (isBodyMapData(a) && bodyMapHasContent(a)) {
          // renderBodyMapText opens with "Body Map — N marks"; the part's own
          // label takes that headline's place, the marks follow line by line.
          const mapLines = renderBodyMapText(a, legend).split("\n");
          push(p.label, mapLines[0].replace(/^Body Map — /, ""));
          lines.push(...mapLines.slice(1));
        }
        break;
      case "range":
        if (typeof a === "number") push(p.label, `${a}/${p.max}`);
        break;
    }
  });
  return lines.join("\n");
}

/** T2 — sanitise a PERSONAL template's parts (client draft or server write):
 *  whitelist kinds, coerce every field, drop malformed parts, cap the count.
 *  The server never trusts a crafted payload; the note renderers never meet
 *  a part shape they don't know. Returns null when nothing usable remains. */
export const MAX_TEMPLATE_PARTS = 40;
export function sanitiseParts(raw: unknown): TemplatePart[] | null {
  if (!Array.isArray(raw)) return null;
  const out: TemplatePart[] = [];
  const str = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);
  const opts = (v: unknown) =>
    Array.isArray(v)
      ? v.map((o) => str(o, 60)).filter(Boolean).slice(0, 12)
      : [];
  for (const p of raw.slice(0, MAX_TEMPLATE_PARTS)) {
    if (typeof p !== "object" || p === null) continue;
    const q = p as Record<string, unknown>;
    const label = str(q.label);
    switch (q.kind) {
      case "heading":
        if (label) out.push({ kind: "heading", label });
        break;
      case "instruction": {
        const text = str(q.text, 240);
        if (text) out.push({ kind: "instruction", text });
        break;
      }
      case "text":
      case "textarea":
        if (label)
          out.push({
            kind: q.kind,
            label,
            ...(str(q.placeholder, 160) ? { placeholder: str(q.placeholder, 160) } : {}),
          });
        break;
      case "date":
        if (label) out.push({ kind: "date", label });
        break;
      case "vitals":
        out.push({ kind: "vitals", label: label || "Vital Signs" });
        break;
      case "body_map":
        out.push({ kind: "body_map", label: label || "Body Map" });
        break;
      case "checkboxes":
      case "dropdown": {
        const options = opts(q.options);
        if (label && options.length >= 2) out.push({ kind: q.kind, label, options });
        break;
      }
      case "range": {
        const min = Number(q.min);
        const max = Number(q.max);
        if (label && Number.isFinite(min) && Number.isFinite(max) && min < max)
          out.push({
            kind: "range",
            label,
            min: Math.max(-1000, Math.trunc(min)),
            max: Math.min(1000, Math.trunc(max)),
            ...(str(q.minLabel, 40) ? { minLabel: str(q.minLabel, 40) } : {}),
            ...(str(q.maxLabel, 40) ? { maxLabel: str(q.maxLabel, 40) } : {}),
          });
        break;
      }
    }
  }
  return out.length ? out : null;
}

export function templateHasAnswers(t: ScribeTemplate, answers: TemplateAnswers): boolean {
  return t.parts.some((p, i) => {
    const a = answers[i];
    if (p.kind === "checkboxes") return Array.isArray(a) && a.length > 0;
    if (p.kind === "vitals")
      return (
        Array.isArray(a) &&
        a.slice(0, VITALS_FIELDS.length).some((v) => String(v).trim() !== "")
      );
    if (p.kind === "range") return typeof a === "number";
    if (p.kind === "body_map") return isBodyMapData(a) && bodyMapHasContent(a);
    if (p.kind === "text" || p.kind === "textarea" || p.kind === "dropdown" || p.kind === "date")
      return typeof a === "string" && a.trim() !== "";
    return false;
  });
}

const FOLLOW_UP = [
  "No Follow-Up Needed",
  "48 Hours",
  "1 Week",
  "2 Weeks",
  "1 Month",
  "3 Months",
  "As Required",
];

/** The curated RolDe library — one excellent template per common job. Each
 *  specialty pack ships its own blessed additions as the packs land. */
export const ROLDE_TEMPLATE_LIBRARY: ScribeTemplate[] = [
  {
    id: "soap",
    name: "SOAP Note",
    specialty: "General",
    parts: [
      { kind: "heading", label: "Subjective" },
      { kind: "text", label: "Presenting Complaint", placeholder: "One line — why they're here today" },
      { kind: "textarea", label: "History", placeholder: "Onset · course · severity · modifying factors · impact on daily life — in the patient's words where it matters…" },
      { kind: "checkboxes", label: "Reviewed", options: ["Past Medical History", "Medications", "Allergies", "Family History", "Social History"] },
      { kind: "textarea", label: "Review Notes", placeholder: "Anything from the review worth recording…" },
      { kind: "heading", label: "Objective" },
      { kind: "vitals", label: "Vital Signs" },
      { kind: "textarea", label: "Examination", placeholder: "General appearance · focused system examination findings…" },
      { kind: "textarea", label: "Investigations Reviewed", placeholder: "Results seen today, with their dates…" },
      { kind: "heading", label: "Assessment" },
      { kind: "textarea", label: "Impression", placeholder: "Working diagnosis and reasoning…" },
      { kind: "textarea", label: "Differentials", placeholder: "What else this could be, and why less likely…" },
      { kind: "heading", label: "Plan" },
      { kind: "textarea", label: "Investigations Ordered" },
      { kind: "textarea", label: "Treatment", placeholder: "Started · changed · stopped, with doses…" },
      { kind: "textarea", label: "Patient Advice", placeholder: "What was explained and agreed…" },
      { kind: "textarea", label: "Safety-Netting", placeholder: "Red flags discussed and when to come back…" },
      { kind: "dropdown", label: "Follow-Up", options: FOLLOW_UP },
    ],
  },
  {
    id: "gp-consult",
    name: "GP Consultation",
    specialty: "General",
    parts: [
      { kind: "textarea", label: "Presenting Complaint", placeholder: "Why they came in today…" },
      { kind: "textarea", label: "History", placeholder: "Onset, course, relevant PMH, medications, allergies reviewed…" },
      { kind: "textarea", label: "Ideas, Concerns And Expectations", placeholder: "What the patient thinks is going on, what worries them, what they hope for…" },
      { kind: "textarea", label: "Examination", placeholder: "Findings on examination…" },
      { kind: "textarea", label: "Impression" },
      { kind: "textarea", label: "Plan" },
      { kind: "textarea", label: "Safety-Netting", placeholder: "What to watch for and when to return…" },
      { kind: "dropdown", label: "Follow-Up", options: FOLLOW_UP },
    ],
  },
  {
    id: "derm-lesion",
    name: "Lesion Review",
    specialty: "Dermatology",
    parts: [
      { kind: "text", label: "Site", placeholder: "e.g. left forearm, extensor aspect" },
      { kind: "body_map", label: "Lesion Map" },
      { kind: "text", label: "Duration", placeholder: "e.g. 6 months, enlarging over 8 weeks" },
      { kind: "text", label: "Size", placeholder: "e.g. 7 × 5 mm" },
      { kind: "dropdown", label: "Fitzpatrick Skin Type", options: ["I", "II", "III", "IV", "V", "VI"] },
      { kind: "instruction", text: "ABCDE — tick every feature present." },
      { kind: "checkboxes", label: "ABCDE Features", options: ["Asymmetry", "Border Irregularity", "Colour Variegation", "Diameter Over 6 mm", "Evolving"] },
      { kind: "checkboxes", label: "Performed Today", options: ["Photographed", "Dermoscopy Performed", "Full Skin Check Completed"] },
      { kind: "textarea", label: "Dermoscopy Findings", placeholder: "Pattern · network · structures · vessels…" },
      { kind: "textarea", label: "Impression" },
      { kind: "dropdown", label: "Plan", options: ["Reassure With Safety-Netting", "Photograph And Review In 3 Months", "Biopsy", "Excise", "Refer — Urgent Suspected Cancer Pathway"] },
      { kind: "textarea", label: "Plan Notes" },
    ],
  },
  {
    id: "aesthetics-toxin",
    name: "Toxin Treatment Record",
    specialty: "Aesthetics",
    parts: [
      { kind: "checkboxes", label: "Pre-Treatment", options: ["Consent Confirmed", "Cooling-Off Period Observed", "Photographs Taken", "Medical History Reviewed", "Contraindications Excluded"] },
      { kind: "dropdown", label: "Product", options: ["Botox", "Azzalure", "Bocouture", "Letybo", "Other"] },
      { kind: "text", label: "Batch Number" },
      { kind: "date", label: "Expiry Date" },
      { kind: "text", label: "Total Units", placeholder: "e.g. 24" },
      { kind: "text", label: "Dilution", placeholder: "e.g. 2.5 ml 0.9% saline per 100 units" },
      { kind: "checkboxes", label: "Areas Treated", options: ["Glabella", "Frontalis", "Crow's Feet", "Bunny Lines", "Masseter", "Other"] },
      { kind: "body_map", label: "Injection Sites" },
      { kind: "textarea", label: "Injection Notes", placeholder: "Points and units per area · technique · any immediate reactions…" },
      { kind: "checkboxes", label: "Aftercare", options: ["Aftercare Leaflet Given", "Verbal Advice Given", "Review Booked"] },
      { kind: "dropdown", label: "Review Interval", options: ["2 Weeks", "3 Weeks", "1 Month", "As Required"] },
    ],
  },
  {
    id: "mh-session",
    name: "Therapy Session Note",
    specialty: "Mental Health",
    parts: [
      { kind: "textarea", label: "Presentation", placeholder: "Appearance, engagement, mental state…" },
      { kind: "range", label: "Mood (Patient-Rated)", min: 1, max: 10, minLabel: "Very Low", maxLabel: "Very Good" },
      { kind: "dropdown", label: "Risk Review", options: ["No Risk Identified", "Passive Ideation — No Plan Or Intent", "Active Ideation — Escalated Per Protocol"] },
      { kind: "textarea", label: "Risk Notes", placeholder: "Protective factors · changes since last session · actions taken…" },
      { kind: "textarea", label: "Session Themes" },
      { kind: "checkboxes", label: "Interventions", options: ["CBT Techniques", "Behavioural Activation", "Psychoeducation", "Grounding Techniques", "Homework Set", "Other"] },
      { kind: "textarea", label: "Plan And Next Session" },
    ],
  },
  {
    id: "physio-initial",
    name: "Initial Assessment",
    specialty: "Physiotherapy & MSK",
    parts: [
      { kind: "textarea", label: "Presenting Problem", placeholder: "Mechanism, onset, functional impact…" },
      { kind: "range", label: "Pain Score", min: 0, max: 10, minLabel: "No Pain", maxLabel: "Worst Pain" },
      { kind: "textarea", label: "Aggravating And Easing Factors" },
      { kind: "textarea", label: "Objective Findings", placeholder: "ROM · strength · special tests · palpation…" },
      { kind: "text", label: "Outcome Measure", placeholder: "e.g. PSFS 4/10 · Oswestry 32%" },
      { kind: "textarea", label: "Treatment Today" },
      { kind: "textarea", label: "Home Exercise Programme" },
      { kind: "dropdown", label: "Follow-Up", options: FOLLOW_UP },
    ],
  },
];
