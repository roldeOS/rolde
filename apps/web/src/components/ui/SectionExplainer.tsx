"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";

interface Term {
  term: string;
  definition: string;
}

export interface ExplainerProps {
  /** Short label — announced to screen readers + the panel heading. */
  label: string;
  /** One-paragraph "what is this / what can I do here" intro. */
  description?: string;
  /** Plain-language glossary of terms / actions. */
  terms?: Term[];
}

/**
 * SectionExplainer — the standardised rich (i) panel (ported from the mindate
 * dashboard, Roland 2026-06-11). Click-only on every device; body-portalled +
 * viewport-clamped so it's never clipped by a card's overflow. "Royal" look:
 * dark panel, light text. Often replaces a subtitle entirely.
 */
export function SectionExplainer({ label, description, terms = [] }: ExplainerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const reposition = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const b = btn.getBoundingClientRect();
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const panel = panelRef.current;
    const panelW = panel ? panel.offsetWidth : Math.min(320, vw - margin * 2);
    const panelH = panel ? panel.offsetHeight : 0;
    let left = b.left + b.width / 2 - panelW / 2;
    left = Math.max(margin, Math.min(left, vw - panelW - margin));
    let top =
      b.top - margin - panelH >= margin ? b.top - margin - panelH : b.bottom + margin;
    top = Math.max(margin, Math.min(top, vh - panelH - margin));
    setPos({ left, top });
  }, []);

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    reposition();
    const raf = requestAnimationFrame(reposition);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        aria-label={`About ${label}`}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="relative z-10 inline-flex size-5 cursor-help items-center justify-center rounded-md bg-card text-muted-foreground shadow-sm outline-none before:absolute before:-inset-2.5 before:content-[''] focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Info className="size-3.5" aria-hidden="true" />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={panelRef}
            role="tooltip"
            style={{
              position: "fixed",
              left: pos?.left ?? -9999,
              top: pos?.top ?? -9999,
              visibility: pos ? "visible" : "hidden",
            }}
            className="z-[60] max-h-[60vh] w-[min(20rem,calc(100vw-1rem))] overflow-y-auto rounded-lg bg-foreground p-3.5 text-background shadow-xl"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
              }}
              className="absolute right-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-md text-background/70 hover:bg-background/10 hover:text-background"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
            <div className="flex flex-col items-start gap-2 pr-6 text-left">
              <p className="text-xs font-semibold">{label}</p>
              {description && (
                <p className="text-xs leading-relaxed opacity-90">{description}</p>
              )}
              {terms.length > 0 && (
                <dl className="space-y-1.5 text-xs leading-relaxed">
                  {terms.map((t) => (
                    <div key={t.term}>
                      <dt className="inline font-semibold">{t.term}</dt>
                      <dd className="ml-1 inline opacity-90"> — {t.definition}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}
