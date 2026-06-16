/**
 * Cloudflare Turnstile — the invisible captcha gating auth (Bible 4.8 §15 W0.1.3).
 *
 * The SITE key is PUBLIC by design — it ships in the client bundle and is scoped
 * to the widget's allowed hostnames, so hardcoding it (with an env override) is
 * safe and makes auth work in every environment without extra setup. The SECRET
 * key is NEVER here: it lives only in Supabase Auth (Dashboard → Attack Protection
 * → CAPTCHA), which verifies the token server-side. Once CAPTCHA is enabled,
 * Supabase REQUIRES a captchaToken on every auth call (sign-in, password reset,
 * sign-up), so the widget must wrap each of those.
 */
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "0x4AAAAAADkKW0Hw7Y_RMrxd";
