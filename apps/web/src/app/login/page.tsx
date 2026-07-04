"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { createClient } from "@/lib/supabase/client";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Footer } from "@/components/Footer";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = "signin" | "forgot" | "sent";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pwError, setPwError] = useState(false);
  const [loading, setLoading] = useState(false);
  // An expired/used reset link lands back here as ?error=link_expired (from
  // /auth/confirm). We drop them straight into the request-another-link form.
  const [expired, setExpired] = useState(false);
  // The email tick means something REAL: this account exists in the DB.
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  // Cloudflare Turnstile (W0.1.3): once CAPTCHA is enabled in Supabase Auth, every
  // auth call REQUIRES a captchaToken. The token is single-use, so we reset the
  // widget after each attempt. The SECRET key lives only in Supabase, never here.
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState(false);
  const captchaRef = useRef<TurnstileInstance>(null);

  function resetCaptcha() {
    captchaRef.current?.reset();
    setCaptchaToken("");
  }

  // An expired or already-used reset link sends the user back here. Show the
  // honest "expired" notice + open the request-another form, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "link_expired") {
      setExpired(true);
      setMode("forgot");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Debounced live existence check — only a well-formed email is worth asking.
  // (RPC, not an auth endpoint, so CAPTCHA doesn't gate it — the tick still works.)
  useEffect(() => {
    const term = email.trim();
    if (!EMAIL.test(term)) {
      setEmailExists(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data, error } = await createClient().rpc("email_exists", {
        p_email: term,
      });
      if (!cancelled) setEmailExists(error ? false : Boolean(data));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });
    if (error) {
      // Conversational + secure — never names which field is wrong (RolDe voice).
      setError("That didn’t match what we’ve got. Give it another go — or reset your password below.");
      setPwError(true);
      setLoading(false);
      resetCaptcha(); // single-use token — get a fresh one for the retry
      // Record the failed attempt in the Sign-in & Security log — fire-and-forget,
      // the SERVER stamps the IP + device. Never blocks the retry.
      void fetch("/api/auth/sign-in-attempt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      }).catch(() => {});
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function onForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Our own route mints the link + sends the branded RolDe email. Always
    // proceeds silently regardless of whether the email exists (no account
    // enumeration) — only a failed captcha is surfaced. Lands on /reset.
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.trim(), captchaToken }),
    });
    setLoading(false);
    resetCaptcha();
    const data = await res.json().catch(() => ({}));
    if (data?.error === "captcha_failed") {
      setCaptchaError(true);
      return;
    }
    setMode("sent");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPwError(false);
    setExpired(false);
    setCaptchaToken(""); // fresh challenge for the new form
  }

  // Shared Turnstile widget — only one auth form mounts at a time, so a single
  // ref tracks the live widget. `interaction-only` keeps it INVISIBLE: it solves
  // silently in the background and only ever renders Cloudflare's box if a real
  // human-check is needed (rare). The ugly bordered widget never shows otherwise.
  const captcha = (
    <>
      <Turnstile
        ref={captchaRef}
        siteKey={TURNSTILE_SITE_KEY}
        onSuccess={(t) => {
          setCaptchaToken(t);
          setCaptchaError(false);
        }}
        onError={() => {
          setCaptchaToken("");
          setCaptchaError(true);
        }}
        onExpire={() => setCaptchaToken("")}
        options={{ appearance: "interaction-only", size: "flexible", theme: "light" }}
      />
      {captchaError && (
        <p className="text-center text-xs text-muted-foreground">
          We couldn’t verify you just now — give it a refresh and try again.
        </p>
      )}
    </>
  );

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark-roldeos.svg" alt="RolDe OS" className="h-12 w-auto sm:h-14" />
          <h1 className="text-base font-medium text-muted-foreground">
            The clinical operating system
          </h1>
        </div>

        <div className="w-full rounded-xl bg-card p-8 shadow-float">
          {mode === "signin" && (
            <>
              <h2 className="text-center text-xl font-semibold tracking-tight">
                Sign In
              </h2>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <Field label="Email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    valid={emailExists === true}
                    required
                  />
                </Field>
                <Field label="Password" htmlFor="password">
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (pwError) setPwError(false);
                    }}
                    error={pwError}
                    required
                  />
                </Field>

                {error && <p className="text-sm text-destructive">{error}</p>}

                {/* Invisible captcha sits with the button so it adds no gap when
                    hidden; if a challenge ever shows, it appears just above it. */}
                <div>
                  {captcha}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={loading || !captchaToken}
                  >
                    {loading ? "Signing You In…" : "Sign In"}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="block w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Forgot Your Password?
                </button>
              </form>
            </>
          )}

          {mode === "forgot" && (
            <>
              <h2 className="text-center text-xl font-semibold tracking-tight">
                {expired ? "Link Expired" : "Reset Your Password"}
              </h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {expired
                  ? "Reset links only last an hour. Pop your email in and we’ll send a fresh one."
                  : "Pop in your email for a reset link."}
              </p>
              <form onSubmit={onForgot} className="mt-6 space-y-4">
                <Field label="Email" htmlFor="forgot-email">
                  <Input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    valid={emailExists === true}
                    required
                  />
                </Field>

                <div>
                  {captcha}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={loading || !captchaToken}
                  >
                    {loading ? "Sending…" : "Send The Reset Link"}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="block w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  ← Back To Sign In
                </button>
              </form>
            </>
          )}

          {mode === "sent" && (
            <div className="text-center">
              <h2 className="text-xl font-semibold tracking-tight">Check Your Inbox</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                If <span className="font-medium text-foreground">{email}</span> has a
                RolDe OS account, a reset link is on its way. It expires in an hour.
              </p>
              <Button
                size="lg"
                className="mt-6 w-full"
                onClick={() => switchMode("signin")}
              >
                Back To Sign In
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <Footer />
      </div>
    </main>
  );
}
