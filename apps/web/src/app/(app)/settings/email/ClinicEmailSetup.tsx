"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardIcon } from "@/components/ui/CardIcon";
import { useSavedFlash } from "@/components/ui/PageActionBar";

/** First-run: seed the clinic's email templates from RolDe's defaults. */
export function ClinicEmailSetup() {
  const router = useRouter();
  const flashSaved = useSavedFlash();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function setup() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/settings/clinic-emails/setup", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        flashSaved("RolDe set up your default emails.");
        router.refresh();
      } else setErr(data.error ?? "Couldn’t set up the emails");
    } catch {
      setErr("Couldn’t set up the emails");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl bg-card p-10 text-center shadow-float">
      <CardIcon icon={MailPlus} tone="info" variant="badge" size="md" />
      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight">No Emails Yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Start from RolDe OS&apos;s calm, clinical defaults — appointment reminders, results-ready,
          follow-ups — then edit the wording to your clinic&apos;s voice.
        </p>
      </div>
      <Button onClick={setup} disabled={loading}>
        {loading ? "Setting Up…" : "Set Up Default Emails"}
      </Button>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}
