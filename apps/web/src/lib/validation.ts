/**
 * Country-aware field validation (Roland 2026-07-03: "we need to be smart about
 * this… validate those fields — we already have all these features in a modern
 * 2026 system"). One shared module, client AND server: the clinic's COUNTRY
 * (tenants.country, set in Clinic Profile) drives phone rules, postcode rules
 * and labels; email/DOB/NHS-number rules are universal. Plain functions, no
 * third-party service — clinical data stays in.
 */
export const COUNTRIES = [
  { code: "GB", label: "United Kingdom" },
  { code: "IE", label: "Ireland" },
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "NZ", label: "New Zealand" },
  { code: "AE", label: "United Arab Emirates" },
] as const;
export type CountryCode = (typeof COUNTRIES)[number]["code"];
export const asCountry = (v: string | null | undefined): CountryCode =>
  (COUNTRIES.some((c) => c.code === v) ? v : "GB") as CountryCode;

// ── Email ─────────────────────────────────────────────────────────────────────
/** Pragmatic RFC-ish check: one @, a dot-separated domain, no spaces. */
export const emailOk = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

// ── Phone ─────────────────────────────────────────────────────────────────────
/** Keep only what a phone number is made of while typing: digits, one leading +. */
export const sanitisePhone = (v: string): string => {
  const kept = v.replace(/[^\d+]/g, "");
  return (kept.startsWith("+") ? "+" : "") + kept.replace(/\+/g, "");
};
const digitsOf = (v: string) => v.replace(/\D/g, "");

type PhoneRule = { hint: string; maxDigits: number; ok: (d: string, raw: string) => boolean };
const PHONE_RULES: Record<CountryCode, PhoneRule> = {
  // UK: 07xxx xxxxxx (11) or +44 7xxx xxxxxx (12 with country code); landlines 0x… 10–11.
  GB: {
    hint: "07… or +44…",
    maxDigits: 12,
    ok: (d, raw) =>
      raw.startsWith("+44") ? d.length === 12 && d.startsWith("447")
        : /^0\d{9,10}$/.test(d),
  },
  IE: { hint: "08… or +353…", maxDigits: 12, ok: (d, raw) => (raw.startsWith("+353") ? d.length >= 11 && d.length <= 12 : /^0\d{8,9}$/.test(d)) },
  // India: exactly 10 digits (6-9 first), or +91 + 10.
  IN: {
    hint: "10 digits, or +91…",
    maxDigits: 12,
    ok: (d, raw) =>
      raw.startsWith("+91") ? d.length === 12 && /^91[6-9]/.test(d) : /^[6-9]\d{9}$/.test(d),
  },
  US: { hint: "10 digits, or +1…", maxDigits: 11, ok: (d, raw) => (raw.startsWith("+1") ? d.length === 11 : d.length === 10) },
  CA: { hint: "10 digits, or +1…", maxDigits: 11, ok: (d, raw) => (raw.startsWith("+1") ? d.length === 11 : d.length === 10) },
  AU: { hint: "04… or +61…", maxDigits: 11, ok: (d, raw) => (raw.startsWith("+61") ? d.length === 11 : /^0\d{9}$/.test(d)) },
  NZ: { hint: "02… or +64…", maxDigits: 11, ok: (d, raw) => (raw.startsWith("+64") ? d.length >= 10 && d.length <= 11 : /^0\d{8,9}$/.test(d)) },
  AE: { hint: "05… or +971…", maxDigits: 12, ok: (d, raw) => (raw.startsWith("+971") ? d.length === 12 : /^0\d{8}$/.test(d)) },
};

export const phoneHint = (c: CountryCode): string => PHONE_RULES[c].hint;
export const phoneMaxLen = (c: CountryCode): number => PHONE_RULES[c].maxDigits + 1; // + the "+"
/** Country-correct number; empty is the caller's call (required vs optional). */
export const phoneOk = (v: string, c: CountryCode): boolean => {
  const raw = sanitisePhone(v.trim());
  return PHONE_RULES[c].ok(digitsOf(raw), raw);
};
/** The universal floor the SERVER always enforces (any country): 7–15 digits. */
export const phonePlausible = (v: string): boolean => {
  const d = digitsOf(v);
  return d.length >= 7 && d.length <= 15;
};

// ── Postcode ──────────────────────────────────────────────────────────────────
const POSTCODE: Record<CountryCode, { label: string; ok: (v: string) => boolean; hint: string }> = {
  GB: { label: "Postcode", hint: "e.g. SW1A 1AA", ok: (v) => /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(v) },
  IE: { label: "Eircode", hint: "e.g. D02 X285", ok: (v) => /^[A-Z]\d{2}\s?[A-Z\d]{4}$/i.test(v) },
  IN: { label: "PIN Code", hint: "6 digits", ok: (v) => /^[1-9]\d{5}$/.test(v.replace(/\s/g, "")) },
  US: { label: "ZIP Code", hint: "e.g. 90210", ok: (v) => /^\d{5}(-\d{4})?$/.test(v) },
  CA: { label: "Postal Code", hint: "e.g. K1A 0B1", ok: (v) => /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(v) },
  AU: { label: "Postcode", hint: "4 digits", ok: (v) => /^\d{4}$/.test(v) },
  NZ: { label: "Postcode", hint: "4 digits", ok: (v) => /^\d{4}$/.test(v) },
  AE: { label: "Postcode", hint: "optional", ok: () => true },
};
export const postcodeLabel = (c: CountryCode): string => POSTCODE[c].label;
export const postcodeHint = (c: CountryCode): string => POSTCODE[c].hint;
export const postcodeOk = (v: string, c: CountryCode): boolean => POSTCODE[c].ok(v.trim());

// ── NHS number (GB) ───────────────────────────────────────────────────────────
/** The real thing: 10 digits + the Modulus-11 check digit (NHS standard). */
export const nhsNumberOk = (v: string): boolean => {
  const d = v.replace(/\s/g, "");
  if (!/^\d{10}$/.test(d)) return false;
  const sum = d
    .slice(0, 9)
    .split("")
    .reduce((acc, ch, i) => acc + Number(ch) * (10 - i), 0);
  let check = 11 - (sum % 11);
  if (check === 11) check = 0;
  return check !== 10 && check === Number(d[9]);
};

// ── Date of birth ─────────────────────────────────────────────────────────────
export const dobOk = (v: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const t = new Date(v).getTime();
  return Number.isFinite(t) && t <= Date.now() && v >= "1900-01-01";
};
