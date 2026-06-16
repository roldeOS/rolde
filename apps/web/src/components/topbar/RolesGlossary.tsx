"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, BookUser } from "lucide-react";
import { ROLES, TIER_ORDER, TIER_LABEL, type RoleTier } from "@/lib/roles";
import { cn } from "@/lib/utils";

// A calm splash of colour per tier (Roland 2026-06-16: let the titles stand out).
const NAME_COLOR: Record<RoleTier, string> = {
  platform: "text-info",
  "clinic-lead": "text-success",
  "clinic-team": "text-foreground",
  patient: "text-muted-foreground",
};

/**
 * "Who's Who" — the role glossary (Roland 2026-06-16). The RolDe lexicon is warm
 * but unfamiliar (Cunnere, Cofferer, CodeWright), so this is always one tap away
 * from the avatar menu: every role, grouped by tier, in plain English, with the
 * caller's own role highlighted. Design law: instantly clear, never confusing.
 */
export function RolesGlossary({
  open,
  onClose,
  currentRole,
}: {
  open: boolean;
  onClose: () => void;
  currentRole: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const current = (currentRole || "").toLowerCase();

  // Portal to <body> so the fixed overlay escapes the glass topbar's
  // backdrop-filter, which would otherwise become its containing block and
  // push the modal off-screen. This keeps it truly viewport-centred.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card shadow-overlay">
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-info/10 text-info">
              <BookUser className="size-4" />
            </span>
            <div>
              <h2 className="font-heading text-base font-semibold tracking-tight">Who&apos;s Who</h2>
              <p className="text-xs text-muted-foreground">
                The people in RolDe OS, and what each does.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5">
          {TIER_ORDER.map((tier) => (
            <div key={tier} className="mt-3 first:mt-1">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-info">
                {TIER_LABEL[tier]}
              </p>
              <div className="space-y-0.5">
                {ROLES.filter((r) => r.tier === tier).map((r) => {
                  const isYou = r.key === current;
                  return (
                    <div
                      key={r.key}
                      className={cn(
                        "rounded-lg px-2.5 py-1.5",
                        isYou && "bg-info/[0.08] ring-1 ring-info/20",
                      )}
                    >
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className={cn("text-sm font-semibold", NAME_COLOR[tier])}>
                          {r.label}
                        </span>
                        <span className="text-[11px] italic text-info/90">{r.origin}</span>
                        {isYou && (
                          <span className="rounded-md bg-info/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-info">
                            You
                          </span>
                        )}
                        {r.soon && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-snug text-foreground/70">{r.meaning}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
