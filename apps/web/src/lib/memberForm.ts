import { defaultLicenseType } from "@/lib/licenses";

/**
 * The shared shape behind both "Invite a teammate" and "Edit member" (W1.1.7
 * chunk 2). One model + one set of fields, so the two flows never drift apart.
 */
export type WindowMode = "indefinite" | "until" | "period";

export type MemberForm = {
  displayName: string;
  email: string; // invite only — an edit never changes the login identity
  role: string;
  designation: string;
  preferredName: string;
  jobTitle: string;
  licenseType: string;
  licenseNumber: string;
  prescribing: boolean;
  windowMode: WindowMode;
  fromDate: string; // YYYY-MM-DD (local)
  toDate: string; // YYYY-MM-DD (local)
};

/** Roles that can EVER prescribe — mirrors lib/access.ts PRESCRIBER_ROLES. */
export const PRESCRIBER_ROLES = new Set([
  "caretaker",
  "clinician",
  "locum",
  "practitioner",
  "nurse",
]);

export function emptyMemberForm(country: string): MemberForm {
  return {
    displayName: "",
    email: "",
    role: "clinician",
    designation: "",
    preferredName: "",
    jobTitle: "",
    licenseType: defaultLicenseType("clinician", country),
    licenseNumber: "",
    prescribing: false,
    windowMode: "indefinite",
    fromDate: "",
    toDate: "",
  };
}

/** Local YYYY-MM-DD for a date input from a stored ISO timestamp. */
function localDateInput(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Build a MemberForm from an existing membership row (for the edit modal). */
export function memberFormFrom(m: {
  display_name: string;
  role: string;
  designation: string | null;
  preferred_name: string | null;
  job_title: string | null;
  license_type: string | null;
  license_number: string | null;
  prescribing_rights: boolean;
  access_starts_at: string | null;
  access_ends_at: string | null;
}): MemberForm {
  let windowMode: WindowMode = "indefinite";
  let fromDate = "";
  let toDate = "";
  if (m.access_starts_at && m.access_ends_at) {
    windowMode = "period";
    fromDate = localDateInput(m.access_starts_at);
    toDate = localDateInput(m.access_ends_at);
  } else if (m.access_ends_at) {
    windowMode = "until";
    toDate = localDateInput(m.access_ends_at);
  } else if (m.access_starts_at) {
    windowMode = "period";
    fromDate = localDateInput(m.access_starts_at);
  }
  return {
    displayName: m.display_name,
    email: "",
    role: m.role,
    designation: m.designation ?? "",
    preferredName: m.preferred_name ?? "",
    jobTitle: m.job_title ?? "",
    licenseType: m.license_type ?? "",
    licenseNumber: m.license_number ?? "",
    prescribing: m.prescribing_rights,
    windowMode,
    fromDate,
    toDate,
  };
}

/** Turn the form's window into ISO timestamps; null result = invalid dates. */
export function windowFromForm(
  f: MemberForm,
): { access_starts_at: string | null; access_ends_at: string | null } | null {
  if (f.windowMode === "indefinite") return { access_starts_at: null, access_ends_at: null };
  if (f.windowMode === "until") {
    if (!f.toDate) return null;
    return { access_starts_at: null, access_ends_at: new Date(`${f.toDate}T23:59:59`).toISOString() };
  }
  if (!f.fromDate || !f.toDate) return null;
  const start = new Date(`${f.fromDate}T00:00:00`).getTime();
  const end = new Date(`${f.toDate}T23:59:59`).getTime();
  if (end <= start) return null;
  return {
    access_starts_at: new Date(start).toISOString(),
    access_ends_at: new Date(end).toISOString(),
  };
}
