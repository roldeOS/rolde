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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const close = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    // Fixed-positioned popover would drift on scroll/resize — just close it.
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  // Position the popover below the trigger, flipping above if there's no room.
  let menuStyle: React.CSSProperties = {};
  if (rect) {
    const estH = Math.min(options.length * 40 + 8, 264);
    const spaceBelow = window.innerHeight - rect.bottom;
    const above = spaceBelow < estH + 12 && rect.top > spaceBelow;
    menuStyle = {
      position: "fixed",
      left: rect.left,
      width: rect.width,
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
            className="z-[200] max-h-64 overflow-auto rounded-xl bg-card p-1 shadow-overlay ring-1 ring-border"
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
                    isSel ? "bg-honey/20 font-medium text-foreground" : "text-foreground hover:bg-hover",
                    o.disabled && "pointer-events-none opacity-40",
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {isSel && <Check className="size-4 shrink-0 text-amber-700" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
