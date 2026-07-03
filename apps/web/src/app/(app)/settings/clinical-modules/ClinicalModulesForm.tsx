"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Scan, Syringe, Pill, Sparkles } from "lucide-react";
import { usePageActionBar, useSavedFlash } from "@/components/ui/PageActionBar";
import { ToggleCard } from "@/components/ui/ToggleCard";
import { describeSave, diffFields } from "@/lib/changeDescriber";
import { CLINICAL_MODULES_FIELDS } from "@/lib/auditFields";
import type { ClinicalModules } from "@/lib/clinicalModules";

/**
 * Clinical Modules (W1.1) — five plain on/off ToggleCards, saved through the
 * shared pinned save-bar with the Change Describer (every flip lands in the
 * Activity Log, before→after). The four order modules feed the Workup card's
 * tabs — with all four off, Workup itself leaves the Consult Room (the calm
 * hint below says so); RolDe AI drives the RolDe panel the same way.
 */
export function ClinicalModulesForm({ initial }: { initial: ClinicalModules }) {
  const router = useRouter();
  const flashSaved = useSavedFlash();

  const [lab, setLab] = useState(initial.lab_enabled);
  const [radiology, setRadiology] = useState(initial.radiology_enabled);
  const [procedures, setProcedures] = useState(initial.procedures_enabled);
  const [prescribing, setPrescribing] = useState(initial.prescribing_enabled);
  const [roldeAi, setRoldeAi] = useState(initial.rolde_ai_enabled);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload: ClinicalModules = {
    lab_enabled: lab,
    radiology_enabled: radiology,
    procedures_enabled: procedures,
    prescribing_enabled: prescribing,
    rolde_ai_enabled: roldeAi,
  };

  const dirty =
    payload.lab_enabled !== initial.lab_enabled ||
    payload.radiology_enabled !== initial.radiology_enabled ||
    payload.procedures_enabled !== initial.procedures_enabled ||
    payload.prescribing_enabled !== initial.prescribing_enabled ||
    payload.rolde_ai_enabled !== initial.rolde_ai_enabled;

  const workupOff = !lab && !radiology && !procedures && !prescribing;

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/settings/clinical-modules", {
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
        CLINICAL_MODULES_FIELDS,
      );
      flashSaved(describeSave(changes, "clinical modules"));
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
      <ToggleCard
        icon={FlaskConical}
        tone="info"
        title="Lab"
        blurb="Blood tests and pathology — ordering, tracking and results in the Workup card."
        checked={lab}
        onChange={setLab}
      />
      <ToggleCard
        icon={Scan}
        tone="sky"
        title="Radiology"
        blurb="Imaging — X-ray, ultrasound, CT and MRI requests and reports in the Workup card."
        checked={radiology}
        onChange={setRadiology}
      />
      <ToggleCard
        icon={Syringe}
        tone="teal"
        title="Procedures"
        blurb="In-clinic procedures — photos, consents and procedure records in the Workup card."
        checked={procedures}
        onChange={setProcedures}
      />
      <ToggleCard
        icon={Pill}
        tone="warning"
        title="Prescribing"
        blurb="Prescriptions with drug-safety checks — in the Workup card and the Prescribing section."
        checked={prescribing}
        onChange={setPrescribing}
      />
      <ToggleCard
        icon={Sparkles}
        tone="periwinkle"
        title="RolDe AI"
        blurb="The RolDe panel in the Consult Room — drafting and suggestions, always under clinician authorisation."
        checked={roldeAi}
        onChange={setRoldeAi}
      />

      {workupOff && (
        <p className="rounded-lg bg-warning/15 px-3 py-2 text-xs font-medium text-warning">
          With all four order modules off, the Workup card leaves the Consult Room — your team
          sees Clinical Notes, Scribe{roldeAi ? " and the RolDe panel" : ""} only.
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-critical/10 px-3 py-2 text-xs font-medium text-critical">
          {error}
        </p>
      )}
    </div>
  );
}
