/**
 * RolDe Scribe Templates (Roland's concept, GREENLIT 2026-07-04) — T1: the
 * PARTS model + the curated RolDe library. A template is an ordered list of
 * typed parts; filling one in Scribe renders a clean, readable clinical note
 * (the record of truth stays the rendered TEXT — structured answers join the
 * payload at T2). Curation beats volume (Roland on Jane's 50,000: "a landfill,
 * not a library") — this set stays small, excellent, and blessed; personal +
 * clinic templates arrive at T2/T3 on the same parts.
 */
export type TemplatePart =
  | { kind: "heading"; label: string }
  | { kind: "instruction"; text: string }
  | { kind: "text"; label: string; placeholder?: string }
  | { kind: "textarea"; label: string; placeholder?: string }
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

/** Compose the note TEXT from a filled template — plain, readable, verbatim.
 *  Unanswered parts are simply omitted (an honest note never says "N/A"). */
export function renderTemplate(t: ScribeTemplate, answers: TemplateAnswers): string {
  const lines: string[] = [`${t.name}`];
  t.parts.forEach((p, i) => {
    const a = answers[i];
    switch (p.kind) {
      case "heading":
        lines.push("", p.label.toUpperCase());
        break;
      case "instruction":
        break; // guidance for the writer — never part of the record
      case "text":
      case "textarea":
      case "dropdown":
        if (typeof a === "string" && a.trim()) lines.push(`${p.label}: ${a.trim()}`);
        break;
      case "checkboxes":
        if (Array.isArray(a) && a.length) lines.push(`${p.label}: ${a.join(" · ")}`);
        break;
      case "range":
        if (typeof a === "number") lines.push(`${p.label}: ${a}/${p.max}`);
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
    if (p.kind === "text" || p.kind === "textarea" || p.kind === "dropdown")
      return typeof a === "string" && a.trim() !== "";
    return false;
  });
}

/** The curated RolDe library — one excellent template per common job. Each
 *  specialty pack ships its own blessed additions as the packs land. */
export const ROLDE_TEMPLATE_LIBRARY: ScribeTemplate[] = [
  {
    id: "soap",
    name: "SOAP Note",
    specialty: "General",
    parts: [
      { kind: "heading", label: "Subjective" },
      { kind: "textarea", label: "Subjective", placeholder: "What the patient reports — symptoms, concerns, history in their words…" },
      { kind: "heading", label: "Objective" },
      { kind: "textarea", label: "Objective", placeholder: "Examination findings, vitals, investigation results…" },
      { kind: "heading", label: "Assessment" },
      { kind: "textarea", label: "Assessment", placeholder: "Clinical impression and differentials…" },
      { kind: "heading", label: "Plan" },
      { kind: "textarea", label: "Plan", placeholder: "Investigations, treatment, follow-up, safety-netting…" },
    ],
  },
  {
    id: "gp-consult",
    name: "GP Consultation",
    specialty: "General",
    parts: [
      { kind: "textarea", label: "Presenting Complaint", placeholder: "Why they came in today…" },
      { kind: "textarea", label: "History", placeholder: "Onset, course, relevant PMH, medications, allergies reviewed…" },
      { kind: "textarea", label: "Examination", placeholder: "Findings on examination…" },
      { kind: "textarea", label: "Impression" },
      { kind: "textarea", label: "Plan" },
      { kind: "textarea", label: "Safety-Netting", placeholder: "What to watch for and when to return…" },
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
      { kind: "instruction", text: "ABCDE — tick every feature present." },
      { kind: "checkboxes", label: "ABCDE Features", options: ["Asymmetry", "Border Irregularity", "Colour Variegation", "Diameter Over 6 mm", "Evolving"] },
      { kind: "textarea", label: "Dermoscopy", placeholder: "Dermoscopic findings…" },
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
      { kind: "checkboxes", label: "Pre-Treatment", options: ["Consent Confirmed", "Cooling-Off Period Observed", "Photographs Taken", "Medical History Reviewed"] },
      { kind: "dropdown", label: "Product", options: ["Botox", "Azzalure", "Bocouture", "Letybo", "Other"] },
      { kind: "text", label: "Batch Number" },
      { kind: "text", label: "Expiry Date" },
      { kind: "text", label: "Total Units" },
      { kind: "checkboxes", label: "Areas Treated", options: ["Glabella", "Frontalis", "Crow's Feet", "Bunny Lines", "Masseter", "Other"] },
      { kind: "textarea", label: "Injection Notes", placeholder: "Points, units per point, technique, any immediate reactions…" },
      { kind: "checkboxes", label: "Aftercare", options: ["Aftercare Leaflet Given", "Verbal Advice Given", "Review Booked"] },
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
      { kind: "textarea", label: "Objective Findings", placeholder: "ROM, strength, special tests, palpation…" },
      { kind: "textarea", label: "Treatment Today" },
      { kind: "textarea", label: "Home Exercise Programme" },
    ],
  },
];
