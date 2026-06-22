"use client";

import { useState } from "react";
import { ShieldAlert, X, Check } from "lucide-react";
import { BREAK_GLASS_OPTIONS, type AccessPurpose } from "@/lib/patientAccess";
import { cn } from "@/lib/utils";
import { recordBreakGlassReason } from "./break-glass-action";

/**
 * BreakGlassPrompt — the non-blocking break-glass chip (Bible 4.8 §15.7b). Shown
 * when someone opens a record they have NO existing care link to. The record is
 * already fully open behind it; this just captures WHY, just-in-time, for the audit
 * trail. Dismissible — if skipped, the access stays logged as an unjustified
 * break-glass (the auditor's red flag). Amber = caution, never alarm.
 */
export function BreakGlassPrompt({
  accessId,
  patientName,
}: {
  accessId: string;
  patientName: string;
}) {
  const [state, setState] = useState<"asking" | "other" | "saving" | "done" | "dismissed">("asking");
  const [otherText, setOtherText] = useState("");

  if (state === "dismissed") return null;

  async function choose(purpose: AccessPurpose, reason?: string) {
    setState("saving");
    const { ok } = await recordBreakGlassReason({ accessId, purpose, reason });
    setState(ok ? "done" : "asking");
    if (ok) setTimeout(() => setState("dismissed"), 1600);
  }

  return (
    <div
      role="dialog"
      aria-label="Break-glass access reason"
      className="fixed bottom-4 right-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-warning/30 bg-card shadow-float"
    >
      {/* Amber caution lip */}
      <div className="flex items-start gap-3 border-l-4 border-warning/70 p-4">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-warning/12 text-warning">
          <ShieldAlert className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          {state === "done" ? (
            <p className="flex items-center gap-1.5 py-1 text-sm font-medium text-foreground">
              <Check className="size-4 text-success" /> Reason recorded — thank you.
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">
                You&apos;re opening a record outside your direct care
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {patientName} isn&apos;t linked to your care. The record is open — just tell us why,
                for the access log.
              </p>

              {state === "other" ? (
                <form
                  className="mt-3 space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (otherText.trim()) void choose("other", otherText);
                  }}
                >
                  <input
                    autoFocus
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Briefly, the reason…"
                    maxLength={200}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={!otherText.trim()}
                      className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      Record reason
                    </button>
                    <button
                      type="button"
                      onClick={() => setState("asking")}
                      className="rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                    >
                      Back
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {BREAK_GLASS_OPTIONS.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      disabled={state === "saving"}
                      onClick={() => (o.purpose === "other" ? setState("other") : void choose(o.purpose))}
                      className={cn(
                        "rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors",
                        "hover:border-foreground/20 hover:bg-hover disabled:opacity-50",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {state !== "done" && (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setState("dismissed")}
            className="-mr-1 -mt-1 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
