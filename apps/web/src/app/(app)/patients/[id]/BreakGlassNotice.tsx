"use client";

import { useState } from "react";
import { ShieldHalf, Check } from "lucide-react";
import { BREAK_GLASS_OPTIONS, type AccessPurpose } from "@/lib/patientAccess";
import { cn } from "@/lib/utils";
import { recordBreakGlassReason } from "./break-glass-action";

/**
 * BreakGlassNotice — the calm, NON-BLOCKING break-glass band (Bible 4.8 §15.7b).
 * Shown as a slim honey-tinted strip at the very top of a record opened with NO
 * existing care link. The record is already fully open below it; this just captures
 * WHY, just-in-time, for the access trail. Speaks the app's caution language (soft
 * tinted band + small icon, like the allergy band) — never a floating notification.
 * Dismissible; if skipped, the access stays logged as an unjustified break-glass.
 */
export function BreakGlassNotice({
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
    if (ok) setTimeout(() => setState("dismissed"), 2200);
  }

  return (
    <div className="shrink-0 border-b border-warning/20 bg-warning/[0.07] px-4 py-2 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-warning/12 text-warning">
          <ShieldHalf className="size-3.5" />
        </span>

        {state === "done" ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Check className="size-4 text-success" />
            Reason recorded — thank you.
          </span>
        ) : state === "other" ? (
          <form
            className="flex flex-1 flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (otherText.trim()) void choose("other", otherText);
            }}
          >
            <label className="text-sm text-foreground">Reason:</label>
            <input
              autoFocus
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Briefly, why you&apos;re opening this record…"
              maxLength={200}
              className="min-w-0 flex-1 rounded-md border border-border bg-card px-2.5 py-1 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
            />
            <button
              type="submit"
              disabled={!otherText.trim()}
              className="rounded-md bg-foreground px-3 py-1 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Record
            </button>
            <button
              type="button"
              onClick={() => setState("asking")}
              className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Back
            </button>
          </form>
        ) : (
          <>
            <span className="text-sm">
              <span className="text-foreground">
                You&apos;re viewing{" "}
                <span className="font-semibold">{patientName}</span>{" "}
                outside your direct care.
              </span>{" "}
              <span className="text-muted-foreground">A quick reason for the access log:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {BREAK_GLASS_OPTIONS.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  disabled={state === "saving"}
                  onClick={() => (o.purpose === "other" ? setState("other") : void choose(o.purpose))}
                  className={cn(
                    "rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground shadow-sm ring-1 ring-border/60 transition-colors",
                    "hover:bg-hover hover:ring-border disabled:opacity-50",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}

        {state !== "done" && (
          <button
            type="button"
            aria-label="Dismiss — record reason later"
            onClick={() => setState("dismissed")}
            className="ml-auto shrink-0 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Later
          </button>
        )}
      </div>
    </div>
  );
}
