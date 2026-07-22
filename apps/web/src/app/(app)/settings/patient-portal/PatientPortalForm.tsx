"use client";

import { useState } from "react";
import { MonitorSmartphone, MailPlus, UserPlus, Check } from "lucide-react";
import { ToggleCard } from "@/components/ui/ToggleCard";
import { cn } from "@/lib/utils";
import { usePageActionBar, useSavedFlash } from "@/components/ui/PageActionBar";
import { savePatientPortalSettings } from "./actions";

type Mode = "invite_only" | "open";

const ACCESS_MODES: {
  value: Mode;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}[] = [
  {
    value: "invite_only",
    title: "Invite Only",
    icon: MailPlus,
    desc: "Your team invites a patient from their record; they claim the link and set a password. You verify who they are first — the safe default for clinical records.",
  },
  {
    value: "open",
    title: "Open Sign-up",
    icon: UserPlus,
    desc: "Patients register themselves and enter their own details — for clinics like Doc For Skin or Doc For Drivers. Your team confirms them at first contact.",
  },
];

/**
 * The clinic's Patient Portal control (P1): a ToggleCard to switch it on, and —
 * when on — how patients get access. Saves through the conversational save bar,
 * Caretaker-gated by the action + RLS.
 */
export function PatientPortalForm({
  initialEnabled,
  initialMode,
}: {
  initialEnabled: boolean;
  initialMode: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [mode, setMode] = useState<Mode>(initialMode === "open" ? "open" : "invite_only");
  const [baseEnabled, setBaseEnabled] = useState(initialEnabled);
  const [baseMode, setBaseMode] = useState<Mode>(initialMode === "open" ? "open" : "invite_only");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flashSaved = useSavedFlash();

  const dirty = enabled !== baseEnabled || mode !== baseMode;

  async function save() {
    if (!dirty || pending) return;
    setPending(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("portal_enabled", String(enabled));
      fd.set("portal_registration", mode);
      const res = await savePatientPortalSettings(fd);
      if (res.ok) {
        setBaseEnabled(enabled);
        setBaseMode(mode);
        flashSaved("RolDe saved your patient portal settings.");
      } else {
        setError(res.error);
      }
    } finally {
      setPending(false);
    }
  }

  usePageActionBar({
    dirty: dirty && !pending,
    saving: pending,
    message: "You’re changing how patients reach their own record.",
    saveLabel: "Save portal settings",
    onSave: save,
  });

  return (
    <div className="space-y-4">
      <ToggleCard
        icon={MonitorSmartphone}
        tone="info"
        title="Patient Portal"
        blurb="Give patients a secure page to see their own record — the notes and photos you approve, plus their profile. Off by default; you choose exactly what’s shared, note by note."
        checked={enabled}
        onChange={setEnabled}
      >
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">How patients get access</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {ACCESS_MODES.map((o) => {
              const active = mode === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setMode(o.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col rounded-xl border p-4 text-left transition-all",
                    active
                      ? "border-info/60 bg-info/[0.06] ring-1 ring-info/25"
                      : "border-border bg-card hover:border-foreground/20 hover:bg-muted/30",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <o.icon className={cn("size-4", active ? "text-info" : "text-muted-foreground")} />
                    <span className="flex-1 text-sm font-semibold text-foreground">{o.title}</span>
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                        active ? "border-info bg-info text-white" : "border-border",
                      )}
                    >
                      {active && <Check className="size-3" />}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{o.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </ToggleCard>

      {error && (
        <p className="rounded-lg bg-critical/10 px-3 py-2 text-sm text-critical">{error}</p>
      )}
    </div>
  );
}
