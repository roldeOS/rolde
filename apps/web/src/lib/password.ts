/**
 * Password policy (W0.1.6) — the CLIENT mirror of what Supabase Auth enforces
 * server-side, so a user gets live, encouraging guidance instead of a confusing
 * server rejection. The server is the real gate (Auth → Providers → Email):
 *   · Minimum length 12
 *   · Required classes: lowercase, uppercase, digit, symbol
 *   · Leaked-password check (HaveIBeenPwned) — pending a Pro plan (W0.1.5);
 *     until then the class requirements are our compensating control against
 *     trivially weak 12-char passwords.
 * Keep this file and the Supabase settings in lock-step: if the server rules
 * change, change these RULES in the same pass.
 */
export const PASSWORD_MIN = 12;

/** Character-class rules the server requires, phrased for a "Needs …" hint. */
const CLASS_RULES: { met: (pw: string) => boolean; need: string }[] = [
  { met: (pw) => /[a-z]/.test(pw), need: "a lowercase letter" },
  { met: (pw) => /[A-Z]/.test(pw), need: "an uppercase letter" },
  { met: (pw) => /\d/.test(pw), need: "a number" },
  { met: (pw) => /[^A-Za-z0-9]/.test(pw), need: "a symbol" },
];

export type PasswordStrength = {
  /** 0 empty · 1 incomplete · 2 good · 3 strong */
  level: 0 | 1 | 2 | 3;
  label: string;
  ok: boolean;
  /** Requirements not yet met, phrased for "Needs …". Empty once `ok`. */
  missing: string[];
};

export function passwordStrength(pw: string): PasswordStrength {
  if (pw.length === 0) return { level: 0, label: "", ok: false, missing: [] };
  // Length first — don't nag about classes until it's long enough.
  if (pw.length < PASSWORD_MIN)
    return { level: 1, label: "Too short", ok: false, missing: [`${PASSWORD_MIN} characters`] };
  const missing = CLASS_RULES.filter((r) => !r.met(pw)).map((r) => r.need);
  if (missing.length > 0) return { level: 1, label: "Keep going", ok: false, missing };
  return pw.length >= 16
    ? { level: 3, label: "Strong", ok: true, missing: [] }
    : { level: 2, label: "Good", ok: true, missing: [] };
}

/** "a, b and c" — joins the outstanding requirements for the live hint. */
export function listNeeds(needs: string[]): string {
  if (needs.length <= 1) return needs[0] ?? "";
  return `${needs.slice(0, -1).join(", ")} and ${needs[needs.length - 1]}`;
}

/**
 * The requirements as a tick-list, in the order shown under the field. Each
 * row flips to met as the user types — mirrors the server policy exactly.
 * (Upper + lowercase are one row to keep the list to four calm items.)
 */
export function passwordChecks(pw: string): { label: string; met: boolean }[] {
  return [
    { label: "At least 12 characters", met: pw.length >= PASSWORD_MIN },
    { label: "Upper & lowercase letters", met: /[A-Z]/.test(pw) && /[a-z]/.test(pw) },
    { label: "A number", met: /\d/.test(pw) },
    { label: "A symbol", met: /[^A-Za-z0-9]/.test(pw) },
  ];
}
