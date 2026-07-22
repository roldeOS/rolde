"use client";

import { useState } from "react";
import { MonitorSmartphone } from "lucide-react";
import { ToggleCard } from "@/components/ui/ToggleCard";
import { Segmented } from "@/components/ui/Segmented";
import { usePageActionBar, useSavedFlash } from "@/components/ui/PageActionBar";
import { savePatientPortalSettings } from "./actions";

type Mode = "invite_only" | "open";

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
          <Segmented
            options={[
              { value: "invite_only", label: "Invite Only" },
              { value: "open", label: "Open Sign-up" },
            ]}
            value={mode}
            onChange={(v) => setMode(v as Mode)}
          />
          <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
            {mode === "invite_only" ? (
              <p>
                <span className="font-medium text-foreground">Invite only.</span> Your team invites a
                patient from their record; the patient claims the link and sets a password. You
                verify who they are first — the safe default for clinical records.
              </p>
            ) : (
              <p>
                <span className="font-medium text-foreground">Open sign-up.</span> Patients register
                themselves and enter their own details — for clinics like Doc For Skin or Doc For
                Drivers. Your team confirms them at first contact.
              </p>
            )}
          </div>
        </div>
      </ToggleCard>

      {error && (
        <p className="rounded-lg bg-critical/10 px-3 py-2 text-sm text-critical">{error}</p>
      )}
    </div>
  );
}
