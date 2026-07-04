"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PopoverHeader } from "@/components/ui/PopoverHeader";
import { type CardIconTone } from "@/components/ui/CardIcon";
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
  icon,
  title,
  subtitle,
  tone = "brand",
  children,
}: {
  /** The trigger element the popover hangs from. */
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  align?: "left" | "right";
  width?: number;
  className?: string;
  /** Structured mode (Roland 2026-07-04): give the popover its heading — the
   *  squircle icon + Title Case title on a pastel wash (PopoverHeader). The
   *  body scrolls beneath it; `className` styles the BODY in this mode. */
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  subtitle?: string;
  tone?: CardIconTone;
  children: React.ReactNode;
}) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  // Re-render counter: a guarded scroll RE-ANCHORS the popover instead of
  // closing it (position derives from the anchor rect at render time).
  const [, setTick] = useState(0);
  const overWheel = useRef(0);

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
    // A wheel/touch gesture OVER the popover marks the next instants as
    // "the user is on me" — even when the popover has nothing to scroll and
    // the browser chains the gesture to the page behind (Roland 2026-07-04:
    // two-finger swipe over the Status Trail made it vanish — the sibling of
    // the inside-scroll bug). overscroll-contain blocks the chaining in
    // modern engines; this flag is the belt for the ones that still leak.
    const onWheel = (e: Event) => {
      if (el?.contains(e.target as Node)) overWheel.current = Date.now();
    };
    // Scrolling INSIDE the popover (its own list) must never close it — only
    // outside/page scrolls do (Roland 2026-07-04: "I tried to scroll and the
    // popup just disappeared").
    const onScroll = (e: Event) => {
      if (el?.contains(e.target as Node)) return;
      if (Date.now() - overWheel.current < 450) {
        setTick((t) => t + 1); // gesture was over me — follow the tile, stay open
        return;
      }
      onClose();
    };
    const close = () => onClose();
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { capture: true, passive: true });
    window.addEventListener("touchmove", onWheel, { capture: true, passive: true });
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("touchmove", onWheel, true);
      window.removeEventListener("scroll", onScroll, true);
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

  if (title && icon) {
    return createPortal(
      <div
        ref={setEl}
        style={style}
        className="z-[70] flex flex-col overflow-hidden rounded-xl bg-card shadow-overlay ring-1 ring-black/5"
      >
        <PopoverHeader icon={icon} title={title} subtitle={subtitle} tone={tone} />
        <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5", className)}>
          {children}
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div
      ref={setEl}
      style={style}
      className={cn(
        "z-[70] overflow-y-auto overscroll-contain rounded-xl bg-card p-1.5 shadow-overlay ring-1 ring-black/5",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}
