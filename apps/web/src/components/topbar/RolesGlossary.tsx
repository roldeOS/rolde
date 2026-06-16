"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, IdCard } from "lucide-react";
import { ROLES, TIER_ORDER, TIER_LABEL } from "@/lib/roles";
import { CardIcon } from "@/components/ui/CardIcon";
import { cn } from "@/lib/utils";

/**
 * "Who's Who" — the role glossary (Roland 2026-06-16). Each role carries its own
 * icon and a warm tone, its NAME, the ORIGIN of the word (dictionary style), and
 * what they do — so the RolDe OS lexicon (Cunnere, Cofferer, CodeWright) is warm
 * AND instantly clear. Portalled to <body> so the overlay sits dead-centre.
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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card shadow-overlay">
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
          <div className="flex items-center gap-2.5">
            <CardIcon icon={IdCard} tone="brand" variant="badge" size="md" />
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

        <div className="overflow-y-auto px-4 pb-5">
          {TIER_ORDER.map((tier) => (
            <div key={tier} className="mt-3 first:mt-1">
              <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {TIER_LABEL[tier]}
              </p>
              <div className="space-y-0.5">
                {ROLES.filter((r) => r.tier === tier).map((r) => {
                  const isYou = r.key === current;
                  return (
                    <div
                      key={r.key}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-2 py-2",
                        isYou && "bg-foreground/[0.04] ring-1 ring-border",
                      )}
                    >
                      <CardIcon icon={r.icon} tone={r.tone} variant="tinted" size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-sm font-semibold text-foreground">{r.label}</span>
                          <span className="text-[11px] italic text-muted-foreground">{r.origin}</span>
                          {isYou && (
                            <span className="rounded-md bg-foreground/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-foreground">
                              You
                            </span>
                          )}
                          {r.soon && (
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Soon
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-snug text-foreground/70">{r.meaning}</p>
                      </div>
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
