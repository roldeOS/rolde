"use client";

import { useState } from "react";
import { ScribeTemplateForm } from "@/components/consultation/ScribeTemplateForm";
import {
  templateHasAnswers,
  templateAnswersValid,
  type TemplatePart,
  type TemplateAnswers,
} from "@/lib/scribeTemplates";
import { type BodyMapData } from "@/lib/bodyMap";
import { submitFormResponse } from "./actions";

/**
 * The patient's form filler (T4) — the SAME ScribeTemplateForm the clinic
 * uses (every part behaves identically, Body Map included), wrapped for the
 * public token page: local answers, one Submit, a calm thank-you. Vitals
 * plausibility blocks Submit exactly as it blocks a clinician's Save.
 */
export function PublicFormFiller({
  token,
  clinicName,
  formName,
  parts,
}: {
  token: string;
  clinicName: string;
  formName: string;
  parts: TemplatePart[];
}) {
  const [answers, setAnswers] = useState<TemplateAnswers>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const template = { id: "form", name: formName, specialty: "", parts };
  const hasAnswers = templateHasAnswers(template, answers);
  const valid = templateAnswersValid(template, answers);

  async function submit() {
    if (pending || !hasAnswers || !valid) return;
    setPending(true);
    setError(null);
    const r = await submitFormResponse(token, answers);
    setPending(false);
    if (r.ok) setDone(true);
    else setError(r.error);
  }

  if (done) {
    return (
      <div className="w-full max-w-md rounded-xl bg-card p-8 text-center shadow-float">
        <h1 className="text-lg font-semibold tracking-tight">Thank You</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your answers are with {clinicName}&apos;s clinical team. You can close
          this page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col rounded-xl bg-card p-5 shadow-float sm:p-8">
      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {clinicName}
      </p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight">{formName}</h1>
      <div className="mt-4 border-t border-border pt-4">
        <ScribeTemplateForm
          template={template}
          answers={answers}
          onChange={(i, v: string | string[] | number | BodyMapData) =>
            setAnswers((a) => ({ ...a, [i]: v }))
          }
        />
      </div>
      {error && (
        <p className="mt-3 rounded-lg bg-critical/10 p-2.5 text-sm text-critical">{error}</p>
      )}
      {!valid && (
        <p className="mt-3 text-xs text-warning">
          One of the vitals values doesn&apos;t look plausible — please check it.
        </p>
      )}
      <div className="mt-4 flex justify-end">
        <button
          onClick={submit}
          disabled={pending || !hasAnswers || !valid}
          className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit Form"}
        </button>
      </div>
    </div>
  );
}
