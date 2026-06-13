"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Footer } from "@/components/Footer";

/**
 * Password-reset landing — where the email link from "Forgot your password?"
 * arrives. The link carries a one-time code (PKCE); we exchange it for a short
 * recovery session, then let the user set a new password. Conversational, calm.
 * NOTE: the robust auth flow (passkeys, MFA, OTP) lands in Wave 1; this is the
 * basic, complete reset so no one is ever locked out.
 */
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
    if (password.length < 12) {
      setError("Make it at least 12 characters — long beats complicated.");
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
    <main className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark-rolde.svg" alt="RolDe" className="h-14 w-auto sm:h-16" />
          <h1 className="text-base font-medium text-muted-foreground">
            The clinical operating system
          </h1>
        </div>

        <div className="w-full rounded-xl bg-card p-8 shadow-float">
          {!ready ? (
            <p className="text-center text-sm text-muted-foreground">Checking your link…</p>
          ) : done ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold tracking-tight">All set</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your new password is saved. You can sign in with it now.
              </p>
              <Button size="lg" className="mt-6 w-full" onClick={() => router.push("/login")}>
                Go to sign in
              </Button>
            </div>
          ) : !valid ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold tracking-tight">This link’s expired</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Reset links only last an hour. Request a fresh one and we’ll send it over.
              </p>
              <Button size="lg" className="mt-6 w-full" onClick={() => router.push("/login")}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-center text-xl font-semibold tracking-tight">
                Set a new password
              </h2>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <Field label="New password" htmlFor="new-password">
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    valid={password.length >= 12}
                    required
                  />
                </Field>
                <Field label="Confirm password" htmlFor="confirm-password">
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    valid={confirm.length >= 12 && confirm === password}
                    error={confirm.length > 0 && confirm !== password}
                    required
                  />
                </Field>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Saving…" : "Save new password"}
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
