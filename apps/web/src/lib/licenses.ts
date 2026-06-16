/**
 * Professional-registration bodies by clinic COUNTRY (W1.1.7). The clinic's
 * country decides which register TYPES are on offer; the NUMBER is whatever the
 * person actually holds (a GMC doctor needn't be UK-born). UK-first today — GB
 * lists the five statutory regulators a private clinic touches. A sensible
 * default type is suggested from the staff role, which the Caretaker can change.
 */
export type LicenseType = { code: string; label: string };

const GB_LICENSES: LicenseType[] = [
  { code: "GMC", label: "GMC — General Medical Council" },
  { code: "NMC", label: "NMC — Nursing & Midwifery Council" },
  { code: "GDC", label: "GDC — General Dental Council" },
  { code: "GPhC", label: "GPhC — General Pharmaceutical Council" },
  { code: "HCPC", label: "HCPC — Health & Care Professions Council" },
];

const BY_COUNTRY: Record<string, LicenseType[]> = { GB: GB_LICENSES };

export function licenseTypesFor(country: string | null | undefined): LicenseType[] {
  return BY_COUNTRY[country ?? "GB"] ?? GB_LICENSES;
}

/** A sensible default register for a role (GB mapping; "" = no clinical register). */
const ROLE_DEFAULT_GB: Record<string, string> = {
  clinician: "GMC",
  locum: "GMC",
  practitioner: "NMC",
  nurse: "NMC",
  chemist: "GPhC",
  cunnere: "HCPC",
};

export function defaultLicenseType(role: string, country: string | null | undefined): string {
  if ((country ?? "GB") === "GB") return ROLE_DEFAULT_GB[role] ?? "";
  return "";
}
