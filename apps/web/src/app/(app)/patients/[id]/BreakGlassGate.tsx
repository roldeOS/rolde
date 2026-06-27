"use client";

import { useState } from "react";
import { ShieldHalf, Zap } from "lucide-react";
import { BREAK_GLASS_OPTIONS, type AccessPurpose } from "@/lib/patientAccess";
import { cn } from "@/lib/utils";
import { recordBreakGlassReason } from "./break-glass-action";

/**
 * BreakGlassGate — the BLOCKING break-glass modal (Bible 4.8 §15.7b; the clinical
 * "break-the-glass" standard: justify BEFORE the record opens). The record renders
 * FROSTED behind a light scrim — present but unreadable — with a compact reason card
 * over it; choosing a reason un-blurs it. An Emergency-access escape opens immediately
 * (logged as emergency) so a real clinical crisis is never delayed. The access itself
 * was already logged server-side; this fills the reason just-in-time.
 */
export function BreakGlassGate({
  accessId,
  patientName,
  children,
}: {
  accessId: string;
  patientName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [view, setView] = useState<"choose" | "other">("choose");
  const [otherText, setOtherText] = useState("");
  const [saving, setSaving] = useState(false);

  async function choose(purpose: AccessPurpose, reason?: string) {
    setSaving(true);
    // Best-effort: un-blur regardless (the access is already logged; the reason is
    // a just-in-time fill). Never trap a clinician behind a failed write.
    await recordBreakGlassReason({ accessId, purpose, reason });
    setOpen(false);
  }

  return (
    <div className="relative h-full min-h-0">
      <div
        className={cn(
          "h-full min-h-0 transition-[filter] duration-300",
          open && "pointer-events-none select-none blur-[6px]",
        )}
        aria-hidden={open}
      >
        {children}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Break-glass — reason required"
          className="absolute inset-0 z-30 flex items-center justify-center bg-background/25 p-4"
        >
          <div className="w-[27rem] max-w-[calc(100vw-2rem)] rounded-2xl bg-card p-5 shadow-overlay">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/12 text-warning">
                <ShieldHalf className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-foreground">
                  You&apos;re opening {patientName} outside your direct care
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  This record isn&apos;t linked to your care. Choose a reason to open it — it&apos;s
                  recorded in the access log.
                </p>
              </div>
            </div>

            {view === "other" ? (
              <form
                className="mt-4 space-y-2.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (otherText.trim()) void choose("other", otherText);
                }}
              >
                <input
                  autoFocus
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Briefly, why you're opening this record…"
                  maxLength={200}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!otherText.trim() || saving}
                    className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    Open record
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("choose")}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                  >
                    Back
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  {BREAK_GLASS_OPTIONS.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      disabled={saving}
                      onClick={() => (o.purpose === "other" ? setView("other") : void choose(o.purpose))}
                      className="rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-foreground/20 hover:bg-hover disabled:opacity-50"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 border-t border-border/50 pt-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void choose("emergency")}
                    className="flex items-center gap-1.5 rounded-full border border-critical/30 bg-critical/[0.06] px-3.5 py-1.5 text-sm font-medium text-critical transition-colors hover:bg-critical/10 disabled:opacity-50"
                  >
                    <Zap className="size-3.5" /> Emergency access — open now
                  </button>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    For a clinical emergency: opens immediately, logged as emergency access.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
