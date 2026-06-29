import type { FieldMap } from "./changeDescriber";

/**
 * Per-form field maps for the RolDe Change Describer — key → plain-English label +
 * the card/section it sits in. A plain module (no client/server deps) so the FORM
 * uses it for the precise save-bar message AND the save ENDPOINT uses the same map
 * to write the before→after audit entry (server-authoritative). Declare a page's
 * fields ONCE here and it gets precise-save + auto-audit. (Roland 2026-06-29.)
 */

// — Shared display formatters: render a raw stored value in plain English for the
//   save message + audit trail. Change-detection still runs on the raw value. —
/** A toggle → "On" / "Off". */
const onOff = (v: unknown): string => (v === true || v === "true" ? "On" : "Off");
/** Integer pence → "£50.00". */
const gbp = (v: unknown): string => {
  const pence = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(pence) ? `£${(pence / 100).toFixed(2)}` : "£0.00";
};
/** Basis points → "20%" (drops a trailing .00 so 2000 bps reads "20%"). */
const pct = (v: unknown): string => {
  const bps = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(bps) ? `${bps / 100}%` : "0%";
};

export const CLINIC_PROFILE_FIELDS: FieldMap = {
  name: { label: "Clinic Name", section: "Identity" },
  legal_name: { label: "Legal Name", section: "Identity" },
  contact_email: { label: "Email", section: "Contact" },
  contact_phone: { label: "Phone", section: "Contact" },
  address_line1: { label: "Address Line 1", section: "Contact" },
  address_line2: { label: "Address Line 2", section: "Contact" },
  city: { label: "City / Town", section: "Contact" },
  postcode: { label: "Postcode", section: "Contact" },
  ico_registration: { label: "ICO number", section: "Registrations" },
  cqc_registration: { label: "CQC number", section: "Registrations" },
  his_registration: { label: "HIS number", section: "Registrations" },
  logo_svg: { label: "Light-background logo", section: "Brand Logo", redact: true },
  logo_svg_dark: { label: "Dark-background logo", section: "Brand Logo", redact: true },
  // logo_png is derived from logo_svg in the browser — not user-set, so not described.
};

/** Commercial Settings (W1.1.16) — toggles + money, so each value is formatted to
 *  plain English ("On" / "£50.00" / "20%") for both the save line and the trail. */
export const COMMERCIAL_FIELDS: FieldMap = {
  tax_enabled: { label: "Tax charging", section: "Tax", format: onOff },
  tax_rate_bps: { label: "Tax rate", section: "Tax", format: pct },
  tax_name: { label: "Tax name", section: "Tax" },
  tax_registration: { label: "Tax registration number", section: "Tax" },
  tax_inclusive: { label: "Tax-inclusive pricing", section: "Tax", format: onOff },
  deposit_enabled: { label: "Deposits", section: "Deposits", format: onOff },
  deposit_default_pence: { label: "Default deposit", section: "Deposits", format: gbp },
  consult_credit_enabled: { label: "Consultation credit", section: "Consultation Credit", format: onOff },
  consult_credit_pence: { label: "Credit amount", section: "Consultation Credit", format: gbp },
  consult_credit_label: { label: "Credit label", section: "Consultation Credit" },
  discount_codes_enabled: { label: "Discount codes", section: "Discount Codes", format: onOff },
};
