"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Footer } from "@/components/Footer";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // The email tick means something REAL: this account exists in the DB (Roland
  // 2026-06-11). null = unknown/not-yet-checked; true/false from email_exists().
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
      // Conservative: never claim an account exists on error — the tick must
      // only fire on a confirmed match.
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
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    // Centred treatment (mindate parity, Roland 2026-06-11): big wordmark +
    // tagline ABOVE a borderless floating card, with the footer pinned to the
    // bottom so the block sits dead-centre of the viewport.
    <main className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-2">
          {/* Brand wordmark — Roland's SVG (public/wordmark-rolde.svg, 900×200). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/wordmark-rolde.svg"
            alt="RolDe"
            className="h-14 w-auto sm:h-16"
          />
          <h1 className="text-base font-medium text-muted-foreground">
            The clinical operating system
          </h1>
        </div>

        <div className="w-full rounded-xl bg-card p-8 shadow-float">
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
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <Footer />
      </div>
    </main>
  );
}
