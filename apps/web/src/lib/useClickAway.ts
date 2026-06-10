"use client";

import { useEffect, useRef } from "react";

/** Calls `onAway` when a pointerdown or Escape happens outside the ref'd node. */
export function useClickAway<T extends HTMLElement>(onAway: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onAway();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onAway();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onAway]);
  return ref;
}
