"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, SpellCheck2, PenLine, Users, MoonStar, BellRing } from "lucide-react";
import { usePageActionBar, useSavedFlash } from "@/components/ui/PageActionBar";
import { ToggleCard } from "@/components/ui/ToggleCard";
import { Field, Input } from "@/components/ui/form";
import { describeSave, diffFields } from "@/lib/changeDescriber";
import { COURIER_FIELDS } from "@/lib/auditFields";

export type CourierSettings = {
  secure_link_default: boolean;
  typo_guard: boolean;
  countersign_required: boolean;
  delegated_sending: boolean;
  quiet_hours_enabled: boolean;
  quiet_start: string;
  quiet_end: string;
  chase_after_days: number;
};

/**
 * The Courier sending policy (C2) — toggle-first ToggleCards on the shared
 * pinned save-bar; every flip lands in the Activity Log via the Change
 * Describer. C3 reads these at send time; C5 reads the chase window.
 */
export function CourierSettingsForm({ initial }: { initial: CourierSettings }) {
  const router = useRouter();
  const flashSaved = useSavedFlash();

  const [secureLink, setSecureLink] = useState(initial.secure_link_default);
  const [typoGuard, setTypoGuard] = useState(initial.typo_guard);
  const [countersign, setCountersign] = useState(initial.countersign_required);
  const [delegated, setDelegated] = useState(initial.delegated_sending);
  const [quietOn, setQuietOn] = useState(initial.quiet_hours_enabled);
  const [quietStart, setQuietStart] = useState(initial.quiet_start);
  const [quietEnd, setQuietEnd] = useState(initial.quiet_end);
  const [chaseDays, setChaseDays] = useState(String(initial.chase_after_days));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = {
    secure_link_default: secureLink,
    typo_guard: typoGuard,
    countersign_required: countersign,
    delegated_sending: delegated,
    quiet_hours_enabled: quietOn,
    quiet_start: quietStart,
    quiet_end: quietEnd,
    chase_after_days: Math.min(30, Math.max(1, Math.round(Number(chaseDays)) || 7)),
  };
  const dirty = (Object.keys(payload) as (keyof typeof payload)[]).some(
    (k) => payload[k] !== initial[k],
  );

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/settings/courier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError("That didn’t save — try again.");
        return;
      }
      const changes = diffFields(
        initial as unknown as Record<string, unknown>,
        payload as unknown as Record<string, unknown>,
        COURIER_FIELDS,
      );
      flashSaved(describeSave(changes, "Courier settings"));
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  usePageActionBar({ dirty, saving, onSave: save, error, saveLabel: "Save Changes" });

  return (
    <div className="space-y-4">
      <h2 className="px-1 text-sm font-semibold text-muted-foreground">Sending Policy</h2>
      <ToggleCard
        icon={ShieldCheck}
        tone="success"
        title="Secure Link By Default"
        blurb="Outbound email carries a secure link the recipient signs in to read — never a raw attachment, unless a sender chooses otherwise."
        checked={secureLink}
        onChange={setSecureLink}
      />
      <ToggleCard
        icon={SpellCheck2}
        tone="info"
        title="Typo Guard"
        blurb="Before anything leaves the clinic, a double-check prompt confirms external addresses — the wrong-recipient safety net."
        checked={typoGuard}
        onChange={setTypoGuard}
      />
      <ToggleCard
        icon={PenLine}
        tone="warning"
        title="Countersign Required"
        blurb="Letters authored by non-clinician roles wait for a clinician's countersign before Courier will send them."
        checked={countersign}
        onChange={setCountersign}
      />
      <ToggleCard
        icon={Users}
        tone="peach"
        title="Delegated Sending"
        blurb="Front-of-house may dispatch approved letters on a clinician's behalf — the author stays the author, the dispatcher is logged."
        checked={delegated}
        onChange={setDelegated}
      />
      <ToggleCard
        icon={MoonStar}
        tone="periwinkle"
        title="Quiet Hours"
        blurb="Patient-facing email waits politely outside these hours and sends the next morning — clinical urgency always overrides."
        checked={quietOn}
        onChange={setQuietOn}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="From" htmlFor="cq-start">
            <Input id="cq-start" type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} />
          </Field>
          <Field label="Until" htmlFor="cq-end">
            <Input id="cq-end" type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} />
          </Field>
        </div>
      </ToggleCard>
      <div className="rounded-xl bg-card p-5 shadow-float">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5">
              <BellRing className="size-5 text-warning" />
            </span>
            <div>
              <h2 className="font-heading text-base font-semibold tracking-tight">Chase Unopened After</h2>
              <p className="mt-0.5 max-w-prose text-sm text-muted-foreground">
                A sent letter nobody has opened gets a polite chase after this many days (arrives with C5).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="cq-days"
              inputMode="numeric"
              value={chaseDays}
              onChange={(e) => setChaseDays(e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="w-16 text-center"
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-critical/10 px-3 py-2 text-xs font-medium text-critical">
          {error}
        </p>
      )}
    </div>
  );
}
