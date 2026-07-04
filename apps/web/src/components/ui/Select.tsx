"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Select — RolDe's FULLY themed dropdown (Roland 2026-06-19). A native `<select>`
 * can't style its open list (the OS draws it), so this is a real custom listbox:
 * a field-styled trigger + a portalled popover with OUR option list (hover, the
 * selected tick, spring-pastel highlight). Drop-in for the old native Select — it
 * still reads its choices from `<option>` children, so callers barely change;
 * only `onChange` now hands back the value directly.
 */
type Opt = { value: string; label: string; disabled?: boolean };

const TRIGGER =
  "field-float flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg px-3 text-left text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50";

export function Select({
  value,
  onChange,
  children,
  id,
  name,
  valid,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  /** `<option value label>` children — same as the native element. */
  children: ReactNode;
  id?: string;
  /** When set, a hidden input carries the value into native <form> submission. */
  name?: string;
  valid?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const options = useMemo<Opt[]>(() => {
    const out: Opt[] = [];
    Children.forEach(children, (c) => {
      if (isValidElement(c) && c.type === "option") {
        const p = c.props as { value?: unknown; children?: unknown; disabled?: boolean };
        out.push({
          value: String(p.value ?? ""),
          label: typeof p.children === "string" ? p.children : String(p.children ?? ""),
          disabled: p.disabled,
        });
      }
    });
    return out;
  }, [children]);

  const selected = options.find((o) => o.value === value);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  function toggle() {
    if (disabled) return;
    if (open) return setOpen(false);
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // The open listbox CLAIMS its Escape (preventDefault) so outer layers —
      // the Profile overlay's close-on-Escape — don't also fire (2026-07-03).
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    };
    const close = () => setOpen(false);
    // A wheel/touch gesture OVER the menu must never close it — even when the
    // short list has nothing to scroll and the browser chains the gesture to
    // the page behind (the Status-Trail swipe-vanish sibling, Roland
    // 2026-07-04). overscroll-contain blocks the chaining; this flag is the
    // belt for engines that still leak.
    const overWheel = { t: 0 };
    const onWheel = (e: Event) => {
      if (popRef.current?.contains(e.target as Node)) overWheel.t = Date.now();
    };
    // Fixed-positioned popover would drift on OUTSIDE scroll/resize — close it.
    // A scroll inside the option list itself must NOT close (Roland 2026-07-04).
    const onScroll = (e: Event) => {
      if (popRef.current?.contains(e.target as Node)) return;
      if (Date.now() - overWheel.t < 450) {
        // The gesture was over the menu — re-anchor to the moved trigger.
        if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { capture: true, passive: true });
    window.addEventListener("touchmove", onWheel, { capture: true, passive: true });
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("touchmove", onWheel, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  // Position the popover below the trigger, flipping above if there's no room.
  let menuStyle: React.CSSProperties = {};
  if (rect) {
    const estH = Math.min(options.length * 40 + 8, 264);
    const spaceBelow = window.innerHeight - rect.bottom;
    const above = spaceBelow < estH + 12 && rect.top > spaceBelow;
    // The list matches the trigger UP TO a cap — a full-card-width Select
    // must not open a full-card-width menu (Roland 2026-07-04: "the popover
    // should not be the whole field").
    menuStyle = {
      position: "fixed",
      left: rect.left,
      width: Math.min(rect.width, 320),
      ...(above ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    };
  }

  return (
    <div className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        id={id}
        ref={btnRef}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        className={cn(TRIGGER, valid && "field-ok", className)}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected?.label ?? ""}
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={popRef}
            role="listbox"
            style={menuStyle}
            className="z-[200] max-h-64 overflow-auto overscroll-contain rounded-xl bg-card p-1 shadow-overlay ring-1 ring-border"
          >
            {options.map((o) => {
              const isSel = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  disabled={o.disabled}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    isSel ? "bg-selected font-medium text-foreground" : "text-foreground hover:bg-hover",
                    o.disabled && "pointer-events-none opacity-40",
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {isSel && <Check className="size-4 shrink-0 text-foreground/70" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
