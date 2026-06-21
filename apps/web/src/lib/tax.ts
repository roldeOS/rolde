/**
 * Tax v2 (roadmap §15.7) — global, configurable tax. The DISPLAY NAME defaults
 * from the clinic's country, then the Caretaker edits it freely: VAT across the
 * UK/Ireland, GST in India/Australia/NZ/Singapore/Canada, Sales Tax in the US,
 * and a plain "Tax" anywhere else. The rate, registration number and
 * inclusive/exclusive pricing are all the clinic's own settings.
 */
const TAX_NAME_BY_COUNTRY: Record<string, string> = {
  GB: "VAT",
  UK: "VAT",
  IE: "VAT",
  IN: "GST",
  AU: "GST",
  NZ: "GST",
  SG: "GST",
  CA: "GST",
  US: "Sales Tax",
};

/** The default tax name for a clinic's country (ISO-3166 alpha-2). Editable after. */
export function taxNameForCountry(country: string | null | undefined): string {
  if (!country) return "VAT";
  return TAX_NAME_BY_COUNTRY[country.trim().toUpperCase()] ?? "Tax";
}
