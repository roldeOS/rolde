"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCircle, ShieldCheck, Palette } from "lucide-react";
import { usePageActionBar, useSavedFlash } from "@/components/ui/PageActionBar";
import { CardIcon } from "@/components/ui/CardIcon";

const INPUT =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10";
const LABEL = "mb-1 block text-xs font-medium text-muted-foreground";

export function CustodianSettings({
  initial,
}: {
  initial: { displayName: string; title: string };
}) {
  const router = useRouter();
  const flashSaved = useSavedFlash();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [title, setTitle] = useState(initial.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = displayName !== initial.displayName || title !== initial.title;

  async function save() {
    setError(null);
    if (!displayName.trim()) {
      setError("Add your name.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/custodian/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName.trim(), title }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError("That didn’t save — try again.");
        return;
      }
      flashSaved("RolDe saved your profile.");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  usePageActionBar({ dirty, saving: busy, onSave: save, saveLabel: "Save", error });

  return (
    <div className="space-y-5">
      {/* Profile — the editable bit */}
      <div className="rounded-xl bg-card p-5 shadow-float">
        <div className="mb-4 flex items-center gap-3">
          <CardIcon icon={UserCircle} tone="brand" variant="badge" size="md" />
          <div>
            <h2 className="font-heading text-base font-semibold tracking-tight">Profile</h2>
            <p className="text-xs text-muted-foreground">How you appear across RolDe OS.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Name</label>
            <input
              className={INPUT}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className={LABEL}>Title</label>
            <input
              className={INPUT}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Founder & Clinical Safety Officer"
            />
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-critical/10 px-3 py-2 text-xs font-medium text-critical">
            {error}
          </p>
        )}
        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={save}
            disabled={busy || !dirty}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>

      {/* Account & Security — honest scaffold */}
      <div className="rounded-xl bg-card p-5 shadow-float">
        <div className="flex items-center gap-3">
          <CardIcon icon={ShieldCheck} tone="warning" variant="badge" size="md" />
          <div>
            <h2 className="font-heading text-base font-semibold tracking-tight">
              Account &amp; Security
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your sign-in is managed by RolDe. A profile photo arrives with Profiles &amp; Avatars,
              and mandatory multi-factor authentication with the Custodian security build — both
              land here.
            </p>
          </div>
        </div>
      </div>

      {/* Appearance — pointer */}
      <div className="rounded-xl bg-card p-5 shadow-float">
        <div className="flex items-center gap-3">
          <CardIcon icon={Palette} tone="info" variant="badge" size="md" />
          <div>
            <h2 className="font-heading text-base font-semibold tracking-tight">Appearance</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Theme and text size live in the menu under your avatar, top-right.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
