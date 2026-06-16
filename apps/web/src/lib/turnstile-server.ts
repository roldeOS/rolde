import "server-only";

/**
 * Server-side Turnstile verification (Cloudflare siteverify). SERVER ONLY — uses
 * the secret. Our own auth routes (e.g. forgot-password) call this because they
 * mint links via the admin API, which bypasses Supabase's built-in CAPTCHA gate;
 * verifying here keeps the abuse protection. Returns true only on a confirmed
 * human; on any error/misconfig it returns false (fail-closed).
 */
export async function verifyTurnstile(token: string | undefined | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[turnstile] TURNSTILE_SECRET_KEY missing — failing closed.");
    return false;
  }
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] siteverify failed:", err);
    return false;
  }
}
