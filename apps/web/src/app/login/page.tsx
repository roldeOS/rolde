"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  // The email tick means something REAL: this account exists in the DB.
  const [emailExists, setEmailExists] = useState<boolean | null>(null);

  // Debounced live existence check — only a well-formed email is worth asking.
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
    });
    if (error) {
      // Conversational + secure — never names which field is wrong (RolDe voice).
      setError("That didn’t match what we’ve got. Give it another go — or reset your password below.");
      setPwError(true);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function onForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Always proceed silently regardless of whether the email exists (no
    // account-enumeration). The reset link lands on /reset.
    await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset`,
    });
    setLoading(false);
    setMode("sent");
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
          {mode === "signin" && (
            <>
              <h2 className="text-center text-xl font-semibold tracking-tight">
                Sign in
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

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Signing you in…" : "Sign in"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                    setPwError(false);
                  }}
                  className="block w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Forgot your password?
                </button>
              </form>
            </>
          )}

          {mode === "forgot" && (
            <>
              <h2 className="text-center text-xl font-semibold tracking-tight">
                Reset your password
              </h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Pop in your email and we’ll send you a link to set a new one.
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
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : "Send the reset link"}
                </Button>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="block w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  ← Back to sign in
                </button>
              </form>
            </>
          )}

          {mode === "sent" && (
            <div className="text-center">
              <h2 className="text-xl font-semibold tracking-tight">Check your inbox</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                If <span className="font-medium text-foreground">{email}</span> has a
                RolDe account, a reset link is on its way. It expires in an hour.
              </p>
              <Button
                size="lg"
                className="mt-6 w-full"
                onClick={() => setMode("signin")}
              >
                Back to sign in
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
