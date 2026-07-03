/**
 * Clinical Modules (W1.1, APPROVALS §4.2) — the clinic-level switches naming
 * which clinical tools this clinic uses: Lab · Radiology · Procedures ·
 * Prescribing · RolDe AI. Off = out of sight platform-wide: the consult
 * workspace reflows to 4/3/2 cards, Workup drops the disabled tabs, and the
 * sidebar/⌘K hide the matching sections. A plain shared module (no server
 * deps) so server pages, the shell and client components all speak the same
 * shape. Everything defaults ON — a new clinic gets the full common spine.
 *
 * Layering: this is the CLINIC's layer; the per-user Layouts card toggles sit
 * UNDER it (a user can hide a card the clinic has on — never show one the
 * clinic has off).
 */
export type ClinicalModules = {
  lab_enabled: boolean;
  radiology_enabled: boolean;
  procedures_enabled: boolean;
  prescribing_enabled: boolean;
  rolde_ai_enabled: boolean;
};

/** The default: everything on (also what a clinic with no row yet gets). */
export const ALL_MODULES_ON: ClinicalModules = {
  lab_enabled: true,
  radiology_enabled: true,
  procedures_enabled: true,
  prescribing_enabled: true,
  rolde_ai_enabled: true,
};

export const MODULE_COLUMNS =
  "lab_enabled, radiology_enabled, procedures_enabled, prescribing_enabled, rolde_ai_enabled";

/** The Workup card exists while ANY of its four order modules is on. */
export const workupEnabled = (m: ClinicalModules): boolean =>
  m.lab_enabled || m.radiology_enabled || m.procedures_enabled || m.prescribing_enabled;
