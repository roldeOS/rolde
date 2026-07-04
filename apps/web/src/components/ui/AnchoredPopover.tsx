"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * AnchoredPopover (2026-07-04, from Roland's clipped-dropdown finding) — a
 * popover that ESCAPES overflow-hidden cards: portaled to <body>, positioned
 * fixed from its trigger's rect, flipped above when the viewport runs out of
 * room, capped and scrollable. The consult cards are `overflow-hidden rounded`
 * containers, so any in-card absolute popover gets CLIPPED — every popover
 * inside a card must ride this instead (the Select already uses the same
 * grammar). Closes on outside pointerdown / scroll / resize; claims its Escape
 * so outer layers (the Profile overlay) survive the keypress.
 */
export function AnchoredPopover({
  anchor,
  open,
  onClose,
  align = "right",
  width = 256,
  className,
  children,
}: {
  /** The trigger element the popover hangs from. */
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  align?: "left" | "right";
  width?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      const t = e.target as Node;
      if (el?.contains(t) || anchor?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    const close = () => onClose();
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, onClose, el, anchor]);

  if (!open || !anchor) return null;

  const rect = anchor.getBoundingClientRect();
  const gap = 6;
  const margin = 8;
  const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
  const spaceAbove = rect.top - gap - margin;
  const flip = spaceBelow < 200 && spaceAbove > spaceBelow;
  const maxHeight = Math.min(360, Math.max(160, flip ? spaceAbove : spaceBelow));
  let left = align === "right" ? rect.right - width : rect.left;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

  const style: React.CSSProperties = {
    position: "fixed",
    left,
    width,
    maxHeight,
    ...(flip
      ? { bottom: window.innerHeight - rect.top + gap }
      : { top: rect.bottom + gap }),
  };

  return createPortal(
    <div
      ref={setEl}
      style={style}
      className={cn(
        "z-[70] overflow-y-auto rounded-xl bg-card p-1.5 shadow-overlay ring-1 ring-black/5",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}
