"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ChevronLeft, Send } from "lucide-react";
import { AnchoredPopover } from "@/components/ui/AnchoredPopover";
import {
  getFormSendContext,
  sendFormRequest,
  type FormSendContext,
} from "@/app/(app)/patients/formActions";

/**
 * The Send-A-Form sheet (T4) — behind the Template picker's "Send A Form…":
 * the PATIENT-FACING templates the Caretaker blessed in T3, and the patient's
 * email read back before anything leaves (the Typo-Guard spirit). The form
 * travels as a Courier secure link; the send + response now live as ONE evolving
 * Courier entry in the note (its own Status Trail), so the sheet is purely
 * "pick a form to send" — no send history here (Roland 2026-07-24).
 */
export function FormSendSheet({
  patientId,
  anchor,
  open,
  onClose,
}: {
  patientId: string;
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [ctx, setCtx] = useState<FormSendContext | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<{ id: string; name: string } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setCtx(null);
    setLoadError(null);
    setChosen(null);
    setSendError(null);
    setSent(false);
    void getFormSendContext(patientId).then((r) => {
      if (r.ok) setCtx(r.data);
      else setLoadError(r.error);
    });
  }, [open, patientId]);

  const doSend = (templateId: string) => {
    startTransition(async () => {
      const r = await sendFormRequest({ patientId, templateId });
      if (r.ok) {
        setSent(true);
        router.refresh();
      } else {
        setSendError(r.error);
        setChosen(null);
      }
    });
  };

  return (
    <AnchoredPopover
      anchor={anchor}
      open={open}
      onClose={onClose}
      width={304}
      icon={ClipboardList}
      title="Send A Form"
      subtitle={ctx ? `To ${ctx.patient.name}` : "Preparing…"}
      tone="sky"
      className="p-2.5"
    >
      {loadError && <p className="p-1 text-xs text-critical">{loadError}</p>}
      {sendError && (
        <p className="mb-1.5 rounded-lg bg-critical/10 p-2 text-xs text-critical">{sendError}</p>
      )}
      {!ctx && !loadError && <p className="p-2 text-xs text-muted-foreground">Loading…</p>}

      {ctx && sent && (
        <div className="p-2 text-center">
          <p className="text-sm font-semibold text-success">Form Sent ✓</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ctx.patient.name} has the secure link. A Courier entry is now in the
            note — it updates itself when they respond.
          </p>
        </div>
      )}

      {ctx && !sent && !chosen && (
        <div className="space-y-0.5">
          {!ctx.patient.email && (
            <p className="rounded-lg bg-warning/10 p-2 text-xs text-foreground">
              No email on file for {ctx.patient.name} — add one in the Profile
              first.
            </p>
          )}
          {ctx.templates.length === 0 && (
            <p className="p-2 text-xs text-muted-foreground">
              No Patient-Facing templates yet — the Caretaker marks them in
              Settings → Scribe Templates.
            </p>
          )}
          {ctx.templates.map((t) => (
            <button
              key={t.id}
              disabled={!ctx.patient.email || pending}
              onClick={() => setChosen({ id: t.id, name: t.name })}
              className="flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors hover:bg-hover disabled:opacity-50"
            >
              <ClipboardList className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-foreground">{t.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t.specialty} · {t.partsCount} part{t.partsCount === 1 ? "" : "s"}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {ctx && !sent && chosen && (
        <div className="space-y-2">
          <div className="rounded-lg bg-muted/40 p-2.5">
            <p className="text-xs font-semibold text-foreground">{chosen.name}</p>
            <p className="text-xs break-all text-muted-foreground">
              {ctx.patient.name} · {ctx.patient.email}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Check the address — they&apos;ll receive a secure link, and the
            completed form lands in this record.
          </p>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setChosen(null)}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" /> Back
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => doSend(chosen.id)}
              className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Send className="size-3.5" /> {pending ? "Sending…" : "Send Form"}
            </button>
          </div>
        </div>
      )}
    </AnchoredPopover>
  );
}
