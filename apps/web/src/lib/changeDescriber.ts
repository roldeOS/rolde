/**
 * The RolDe Change Describer (Roland 2026-06-29) — ONE place that turns a form's
 * before/after into (a) a precise, conversational save-bar message and (b) a
 * structured before→after list for the Activity Log. Built once, used by every
 * form + every save endpoint, so the save message is always specific ("RolDe
 * updated the Postcode in Contact details") and every save leaves an audit trail.
 *
 * Standard: a page declares its fields ONCE (key → label + section) and gets
 * precise-save + auto-audit for free. See URDS §11 + memory: save-and-audit-standard.
 */

/** A field's plain-English label, the card/section it lives in, and whether its
 *  value is a blob we must NOT print verbatim (logos, long bodies). */
export type FieldSpec = {
  label: string;
  section?: string;
  redact?: boolean;
  /**
   * Render a raw value for DISPLAY only — e.g. pence → "£50.00", boolean → "On",
   * a role key → "Clinician". Change-detection always compares the raw value, so a
   * formatter never affects whether a field counts as changed. Ignored when redact.
   */
  format?: (raw: unknown) => string;
};
export type FieldMap = Record<string, FieldSpec>;

export type FieldChange = {
  key: string;
  label: string;
  section?: string;
  /** Display values — already redacted for blob fields. */
  from: string;
  to: string;
};

const norm = (v: unknown): string => (v == null ? "" : String(v));
const redactValue = (v: string): string => (v.trim() === "" ? "(empty)" : "(set)");

/** The changed fields between before/after, in the order they appear in the map. */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: FieldMap,
): FieldChange[] {
  const out: FieldChange[] = [];
  for (const key of Object.keys(fields)) {
    const spec = fields[key];
    const fromN = norm(before[key]);
    const toN = norm(after[key]);
    if (fromN === toN) continue; // change-detection always on the RAW value
    const show = (raw: unknown, n: string): string =>
      spec.redact ? redactValue(n) : spec.format ? spec.format(raw) : n;
    out.push({
      key,
      label: spec.label,
      section: spec.section,
      from: show(before[key], fromN),
      to: show(after[key], toN),
    });
  }
  return out;
}

const joinLabels = (labels: string[]): string =>
  labels.length <= 1
    ? (labels[0] ?? "")
    : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;

/** A field whose name already carries its section ("Tax charging" in "Tax") — so we
 *  don't write the clumsy "the Tax in Tax". */
const carriesSection = (label: string, section: string): boolean => {
  const a = label.toLowerCase();
  const b = section.toLowerCase();
  return a.includes(b) || b.includes(a);
};

/**
 * The conversational save-bar line, e.g.
 *   "RolDe updated the Postcode in Contact details."
 *   "RolDe updated 2 things in Contact details — Address Line 1 and Postcode."
 *   "RolDe saved 3 changes to your clinic profile."  (when they span sections)
 * `subject` is the page's plain name, e.g. "clinic profile".
 */
export function describeSave(changes: FieldChange[], subject: string): string {
  if (changes.length === 0) return `RolDe saved your ${subject}.`;
  const sections = [...new Set(changes.map((c) => c.section).filter(Boolean))] as string[];
  const labels = changes.map((c) => c.label);

  if (sections.length === 1) {
    const sec = sections[0];
    if (changes.length === 1) {
      const where = carriesSection(labels[0], sec) ? "" : ` in ${sec}`;
      return `RolDe updated the ${labels[0]}${where}.`;
    }
    return `RolDe updated ${changes.length} things in ${sec} — ${joinLabels(labels)}.`;
  }
  return changes.length === 1
    ? `RolDe updated the ${labels[0]} in your ${subject}.`
    : `RolDe saved ${changes.length} changes to your ${subject} — ${joinLabels(labels)}.`;
}

/**
 * Like describeSave, but for a NAMED item in a list (a service, a template) —
 * "RolDe updated the Price for “Botox Consultation”." Reads better than the
 * generic "your <subject>" phrasing when the subject is the thing's own name.
 */
export function describeItemSave(changes: FieldChange[], itemName: string): string {
  if (changes.length === 0) return `RolDe saved “${itemName}”.`;
  const labels = changes.map((c) => c.label);
  return changes.length === 1
    ? `RolDe updated the ${labels[0]} for “${itemName}”.`
    : `RolDe updated ${changes.length} things for “${itemName}” — ${joinLabels(labels)}.`;
}

/** A terse, past-tense summary for the Activity Log row (no "RolDe" prefix). */
export function summariseChanges(changes: FieldChange[], subject: string): string {
  if (changes.length === 0) return `Saved the ${subject}`;
  const labels = changes.map((c) => c.label);
  const sections = [...new Set(changes.map((c) => c.section).filter(Boolean))] as string[];
  const where = sections.length === 1 ? ` (${sections[0]})` : "";
  return `Updated ${subject}${where} — ${joinLabels(labels)}`;
}
