"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, User, BookUser, AtSign, ChevronLeft, Send } from "lucide-react";
import { AnchoredPopover } from "@/components/ui/AnchoredPopover";
import { Input } from "@/components/ui/form";
import {
  getCourierSendContext,
  sendLetter,
  type CourierSendContext,
  type CourierRecipientInput,
} from "@/app/(app)/patients/courierActions";
import { cn } from "@/lib/utils";

/**
 * The Courier Send sheet (C3, Roland "Go for courier 3") — lives behind the
 * Send icon on every letter tile, PORTALED (APPROVALS §2.4). One journey:
 * pick who (the patient's GP first — that's the usual road — then the patient,
 * the clinic's Address Book, or a typed address) → the Typo Guard shows the
 * exact envelope before anything leaves (a letter can't be unsent) → Send.
 * The tile's Status Dot flips to "Sent to …" the moment the email is away.
 */
const KIND_LABEL: Record<string, string> = {
  gp_practice: "GP Practice",
  pharmacy: "Pharmacy",
  laboratory: "Laboratory",
  hospital: "Hospital",
  clinic: "Clinic",
  specialist: "Specialist",
  other: "Other",
};

type Step = "pick" | "custom" | "confirm";

function Row({
  icon: Icon,
  label,
  detail,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  detail: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors",
        disabled ? "opacity-50" : "hover:bg-hover",
      )}
    >
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-foreground">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
    </button>
  );
}

export function CourierSendSheet({
  entryId,
  anchor,
  open,
  onClose,
}: {
  entryId: string;
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [ctx, setCtx] = useState<CourierSendContext | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("pick");
  const [chosen, setChosen] = useState<CourierRecipientInput | null>(null);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setCtx(null);
    setLoadError(null);
    setStep("pick");
    setChosen(null);
    setCustomName("");
    setCustomEmail("");
    setSendError(null);
    void getCourierSendContext(entryId).then((r) => {
      if (r.ok) setCtx(r.data);
      else setLoadError(r.error);
    });
  }, [open, entryId]);

  const choose = (recipient: CourierRecipientInput) => {
    setSendError(null);
    setChosen(recipient);
    if (ctx?.settings.typo_guard) setStep("confirm");
    else doSend(recipient);
  };

  const doSend = (recipient: CourierRecipientInput) => {
    startTransition(async () => {
      const r = await sendLetter(entryId, recipient);
      if (r.ok) {
        onClose();
        router.refresh();
      } else {
        setSendError(r.error);
        setStep("pick");
      }
    });
  };

  return (
    <AnchoredPopover
      anchor={anchor}
      open={open}
      onClose={onClose}
      width={304}
      icon={Send}
      title="Send Via Courier"
      subtitle={ctx ? `${ctx.title} — pick the recipient` : "Preparing the envelope…"}
      tone="accent"
      className="p-3"
    >
      {loadError && <p className="text-xs text-critical">{loadError}</p>}
      {sendError && (
        <p className="mb-1.5 rounded-lg bg-critical/10 p-2 text-xs text-critical">{sendError}</p>
      )}
      {!ctx && !loadError && <p className="p-2 text-xs text-muted-foreground">Loading…</p>}

      {ctx && step === "pick" && (
        <div className="space-y-0.5">
          {ctx.dispatches.length > 0 && (
            <div className="mb-1.5 space-y-0.5 rounded-lg bg-muted/40 p-2">
              {ctx.dispatches.slice(0, 3).map((d, i) => (
                <p key={i} className="truncate text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{d.recipientName}</span>
                  {" — "}
                  <span className="capitalize">{d.status}</span>
                </p>
              ))}
            </div>
          )}
          {ctx.gp && (
            <Row
              icon={Stethoscope}
              label={`${ctx.gp.name} (GP)`}
              detail={ctx.gp.email ?? "No email on file — add one in the Care Team"}
              disabled={!ctx.gp.email || pending}
              onClick={() =>
                ctx.gp?.email &&
                choose({
                  kind: "gp",
                  name: ctx.gp.name,
                  email: ctx.gp.email,
                  careProviderId: ctx.gp.careProviderId,
                })
              }
            />
          )}
          <Row
            icon={User}
            label={`${ctx.patient.name} (Patient)`}
            detail={ctx.patient.email ?? "No email on file — add one in the Profile"}
            disabled={!ctx.patient.email || pending}
            onClick={() =>
              ctx.patient.email &&
              choose({ kind: "patient", name: ctx.patient.name, email: ctx.patient.email })
            }
          />
          {ctx.addressBook.map((b) => (
            <Row
              key={b.id}
              icon={BookUser}
              label={b.name}
              detail={`${KIND_LABEL[b.kind] ?? "Contact"} · ${b.email}`}
              disabled={pending}
              onClick={() =>
                choose({ kind: "address_book", name: b.name, email: b.email, addressBookId: b.id })
              }
            />
          ))}
          <Row
            icon={AtSign}
            label="Another Address…"
            detail="Type a name and email"
            disabled={pending}
            onClick={() => setStep("custom")}
          />
        </div>
      )}

      {ctx && step === "custom" && (
        <div className="space-y-2">
          <Input
            value={customName}
            placeholder="Recipient name"
            onChange={(e) => setCustomName(e.target.value)}
          />
          <Input
            value={customEmail}
            type="email"
            placeholder="name@example.com"
            onChange={(e) => setCustomEmail(e.target.value)}
          />
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" /> Back
            </button>
            <button
              type="button"
              disabled={pending || !customName.trim() || !customEmail.trim()}
              onClick={() =>
                choose({ kind: "custom", name: customName.trim(), email: customEmail.trim() })
              }
              className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {ctx && step === "confirm" && chosen && (
        <div className="space-y-2">
          {/* The Typo Guard (C2): the exact envelope, read back before it leaves. */}
          <div className="rounded-lg bg-muted/40 p-2.5">
            <p className="text-xs font-semibold text-foreground">{chosen.name}</p>
            <p className="text-xs break-all text-muted-foreground">{chosen.email}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Check the address carefully — a letter can’t be unsent. They&apos;ll receive a
            secure link, and this tile shows when it&apos;s opened.
          </p>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep(chosen.kind === "custom" ? "custom" : "pick")}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" /> Back
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => doSend(chosen)}
              className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send Letter"}
            </button>
          </div>
        </div>
      )}
    </AnchoredPopover>
  );
}
