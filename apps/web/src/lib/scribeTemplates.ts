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
export type TemplatePart =
  | { kind: "heading"; label: string }
  | { kind: "instruction"; text: string }
  | { kind: "text"; label: string; placeholder?: string }
  | { kind: "textarea"; label: string; placeholder?: string }
  | { kind: "date"; label: string }
  | { kind: "checkboxes"; label: string; options: string[] }
  | { kind: "dropdown"; label: string; options: string[] }
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

export type TemplateAnswers = Record<number, string | string[] | number>;

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
export function renderTemplate(t: ScribeTemplate, answers: TemplateAnswers): string {
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
      case "checkboxes":
        if (Array.isArray(a) && a.length) push(p.label, a.join(" · "));
        break;
      case "range":
        if (typeof a === "number") push(p.label, `${a}/${p.max}`);
        break;
    }
  });
  return lines.join("\n");
}

export function templateHasAnswers(t: ScribeTemplate, answers: TemplateAnswers): boolean {
  return t.parts.some((p, i) => {
    const a = answers[i];
    if (p.kind === "checkboxes") return Array.isArray(a) && a.length > 0;
    if (p.kind === "range") return typeof a === "number";
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
      { kind: "text", label: "Vital Signs", placeholder: "e.g. BP 128/82 · HR 72 · T 36.8 °C · SpO₂ 98%" },
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
