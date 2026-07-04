"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { passwordStrength, passwordChecks, listNeeds } from "@/lib/password";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

/**
 * Password-reset landing — where the email link from "Forgot your password?"
 * arrives. The link carries a one-time code (PKCE); we exchange it for a short
 * recovery session, then let the user set a new password. Conversational, calm.
 * NOTE: the robust auth flow (passkeys, MFA, OTP) lands in Wave 1; this is the
 * basic, complete reset so no one is ever locked out.
 */
/** Live requirements checklist (W0.1.6) — module scope, never re-created in
 *  render. Each row flips to the same frosted green-tick squircle the fields use
 *  (universal UI), so the user sees exactly what's needed and watches it satisfy. */
function PasswordChecklist({ pw }: { pw: string }) {
  return (
    <ul className="space-y-1.5">
      {passwordChecks(pw).map((c) => (
        <li key={c.label} className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex size-5 items-center justify-center rounded-[7px] transition-colors",
              c.met ? "tick-squircle text-emerald-600" : "bg-muted text-transparent",
            )}
            aria-hidden
          >
            <Check className="size-3" strokeWidth={2.75} />
          </span>
          <span
            className={cn(
              "text-xs transition-colors",
              c.met ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {c.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ResetPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Establish the recovery session from the link (PKCE `?code=`, or an
  // already-present recovery session from the URL hash).
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) setValid(true);
      } else {
        const { data } = await supabase.auth.getSession();
        if (data.session) setValid(true);
      }
      setReady(true);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const strength = passwordStrength(password);
    if (!strength.ok) {
      setError(`Your password still needs ${listNeeds(strength.missing)}.`);
      return;
    }
    if (password !== confirm) {
      setError("Those two don’t match yet — give the second one another go.");
      return;
    }
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError("We couldn’t update it just now — the link may have expired. Try requesting a fresh one.");
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
  }

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
          {!ready ? (
            <p className="text-center text-sm text-muted-foreground">Checking your link…</p>
          ) : done ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold tracking-tight">All Set</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your new password is saved. You can sign in with it now.
              </p>
              <Button size="lg" className="mt-6 w-full" onClick={() => router.push("/login")}>
                Go To Sign In
              </Button>
            </div>
          ) : !valid ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold tracking-tight">This Link’s Expired</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Reset links only last an hour. Request a fresh one and we’ll send it over.
              </p>
              <Button size="lg" className="mt-6 w-full" onClick={() => router.push("/login")}>
                Back To Sign In
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-center text-xl font-semibold tracking-tight">
                Set A New Password
              </h2>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <Field label="New Password" htmlFor="new-password">
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    valid={passwordStrength(password).ok}
                    required
                  />
                </Field>
                {password.length > 0 && <PasswordChecklist pw={password} />}
                <Field label="Confirm Password" htmlFor="confirm-password">
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    valid={passwordStrength(confirm).ok && confirm === password}
                    error={confirm.length > 0 && confirm !== password}
                    required
                  />
                </Field>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Saving…" : "Save New Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <Footer />
      </div>
    </main>
  );
}
