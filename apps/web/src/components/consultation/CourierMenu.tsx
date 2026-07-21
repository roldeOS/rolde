"use client";

import { useState } from "react";
import { Send, ClipboardList, Mail, ChevronLeft } from "lucide-react";
import { AnchoredPopover } from "@/components/ui/AnchoredPopover";
import { CARD_ICON_TEXT } from "@/lib/cardTones";
import { cn } from "@/lib/utils";

/**
 * The Courier door (B2, Roland 2026-07-21 "Go") — ONE branded menu in the
 * Scribe header for everything that leaves the clinic for this patient.
 * Two content rails, one dispatch spine: LIBRARY artefacts (patient-facing
 * forms — frozen template snapshots) ride the form rail; AUTHORED artefacts
 * (the letters already in this feed) ride the letter rail. Rows for
 * consents, photo requests and aftercare JOIN as their engines land (T4.2 ·
 * Body-Map 2.2 · the leaflet library) — the door never renders a dead row.
 * The per-tile Send icon on each letter stays; this is the front door, not
 * a replacement.
 */
export type UnsentLetter = { id: string; label: string; when: string };

function MenuRow({
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
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </span>
    </button>
  );
}

export function CourierMenu({
  onSendForm,
  unsentLetters,
  onSendLetter,
  showLabel = true,
}: {
  /** Opens the Send-A-Form sheet (T4) anchored to the Courier chip. */
  onSendForm: (anchor: HTMLElement) => void;
  /** Letters in this feed with no dispatch yet — the authored rail's queue. */
  unsentLetters: UnsentLetter[];
  /** Opens the letter Send sheet (C3) for the picked entry. */
  onSendLetter: (entryId: string, anchor: HTMLElement) => void;
  /** false → icon only (the Scribe header collapses chips when narrow). */
  showLabel?: boolean;
}) {
  const [btn, setBtn] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "letters">("menu");

  return (
    <>
      <button
        ref={setBtn}
        onClick={() => {
          setView("menu");
          setOpen((v) => !v);
        }}
        title="Send Something To Someone"
        className="flex h-7 items-center gap-1 rounded-lg bg-card px-2 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow"
      >
        <Send className={cn("size-3.5", CARD_ICON_TEXT.warning)} />
        {showLabel && <span>Courier</span>}
      </button>
      <AnchoredPopover
        anchor={btn}
        open={open}
        onClose={() => setOpen(false)}
        width={288}
        icon={Send}
        title="Courier"
        subtitle="Everything that leaves the clinic"
        tone="warning"
        className="p-1.5"
      >
        {view === "menu" ? (
          <>
            <MenuRow
              icon={ClipboardList}
              label="Send A Form…"
              detail="A patient-facing form, sent as a secure link"
              onClick={() => {
                setOpen(false);
                if (btn) onSendForm(btn);
              }}
            />
            <MenuRow
              icon={Mail}
              label="Send A Letter…"
              detail={
                unsentLetters.length > 0
                  ? `${unsentLetters.length} in the feed not yet sent`
                  : "Every letter in the feed has been sent"
              }
              disabled={unsentLetters.length === 0}
              onClick={() => setView("letters")}
            />
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setView("menu")}
              className="flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" /> Back
            </button>
            {unsentLetters.map((l) => (
              <MenuRow
                key={l.id}
                icon={Mail}
                label={l.label}
                detail={l.when}
                onClick={() => {
                  setOpen(false);
                  if (btn) onSendLetter(l.id, btn);
                }}
              />
            ))}
          </>
        )}
      </AnchoredPopover>
    </>
  );
}
