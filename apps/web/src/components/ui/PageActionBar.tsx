"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, Loader2, X, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PageActionBar — RolDe's shared SAVE-CONFIRMATION bar + unsaved-work guard
 * (Roland 2026-06-11). Two distinct jobs, no real-estate creep:
 *
 *   1. The bottom bar NEVER shows while you type — it only appears AFTER a save
 *      is triggered, as a conversational confirmation: "RolDe is saving…" →
 *      "RolDe saved this to Sarah's record." (and a Retry on failure).
 *   2. If you navigate away with unsaved work, a CENTRAL MODAL asks whether to
 *      discard — never the browser's default, never the bottom bar.
 *
 * One shared instance (mounted once in AppFrame); any form registers its dirty +
 * save state via `usePageActionBar`, and confirms a save via `useSavedFlash`.
 */

interface ActionState {
  dirty: boolean;
  saving: boolean;
  message: string;
  saveLabel: string;
  onSave: () => void;
  onDiscard?: () => void;
  error?: string | null;
}

const EMPTY: ActionState = {
  dirty: false,
  saving: false,
  message: "You have unsaved changes",
  saveLabel: "Save",
  onSave: () => {},
  error: null,
};

interface ContextValue {
  register: (s: ActionState) => void;
  clear: () => void;
  /** Flash a conversational "saved" confirmation. Lives in the PROVIDER (not the
   *  form) so it survives the form remount that a server-action revalidate
   *  triggers — the moment Roland wanted: "RolDe has updated your name." */
  flashSaved: (message: string) => void;
}

const ActionBarContext = createContext<ContextValue | null>(null);

// ── Saved-flash store (sessionStorage-backed) ───────────────────────────────
// The confirmation must survive a server-action revalidate, which re-renders
// (and in dev re-evaluates) the tree — so it can't live in React state OR a
// module variable. sessionStorage + an expiry timestamp is bulletproof
// (Roland 2026-06-11).
const FLASH_KEY = "rolde:saved-flash";
const FLASH_MS = 2800;
const flashListeners = new Set<() => void>();
function emitFlash() {
  flashListeners.forEach((l) => l());
}
function triggerFlash(message: string) {
  try {
    sessionStorage.setItem(
      FLASH_KEY,
      JSON.stringify({ message, until: Date.now() + FLASH_MS }),
    );
  } catch {
    /* ignore */
  }
  emitFlash();
}
function clearFlash() {
  try {
    sessionStorage.removeItem(FLASH_KEY);
  } catch {
    /* ignore */
  }
  emitFlash();
}
function readFlash(): string | null {
  try {
    const raw = sessionStorage.getItem(FLASH_KEY);
    if (!raw) return null;
    const { message, until } = JSON.parse(raw) as { message: string; until: number };
    if (Date.now() < until) return message;
    sessionStorage.removeItem(FLASH_KEY);
    return null;
  } catch {
    return null;
  }
}

/** Get the saved-flash trigger — call after a save succeeds. */
export function useSavedFlash(): (message: string) => void {
  return triggerFlash;
}

/** Drive the shared bar from a form. Handlers held in refs so they stay fresh. */
export function usePageActionBar(opts: {
  dirty: boolean;
  saving?: boolean;
  message?: string;
  saveLabel?: string;
  onSave: () => void;
  onDiscard?: () => void;
  error?: string | null;
}): void {
  const ctx = useContext(ActionBarContext);
  const onSaveRef = useRef(opts.onSave);
  const onDiscardRef = useRef(opts.onDiscard);
  onSaveRef.current = opts.onSave;
  onDiscardRef.current = opts.onDiscard;

  const message = opts.message ?? "You have unsaved changes";
  const saveLabel = opts.saveLabel ?? "Save";
  const hasDiscard = !!opts.onDiscard;

  useEffect(() => {
    if (!ctx) return;
    ctx.register({
      dirty: opts.dirty,
      saving: !!opts.saving,
      message,
      saveLabel,
      onSave: () => onSaveRef.current(),
      onDiscard: hasDiscard ? () => onDiscardRef.current?.() : undefined,
      error: opts.error ?? null,
    });
  }, [ctx, opts.dirty, opts.saving, opts.error, message, saveLabel, hasDiscard]);

  // Clear the DIRTY registration on unmount (the saved flash lives on in the
  // provider, so a remount-on-save still shows the confirmation).
  useEffect(() => () => ctx?.clear(), [ctx]);
}

export function PageActionBarProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const stateRef = useRef<ActionState>(EMPTY);
  const [, force] = useState(0);
  const [mounted, setMounted] = useState(false);
  // Destination held while the discard modal is open (in-app nav intercepted).
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  // Subscribe to the saved-flash store.
  useEffect(() => {
    const l = () => force((n) => n + 1);
    flashListeners.add(l);
    return () => {
      flashListeners.delete(l);
    };
  }, []);

  const register = useCallback((s: ActionState) => {
    stateRef.current = s;
    force((n) => n + 1);
  }, []);
  const clear = useCallback(() => {
    stateRef.current = EMPTY;
    force((n) => n + 1);
  }, []);

  const ctx = useMemo<ContextValue>(
    () => ({ register, clear, flashSaved: triggerFlash }),
    [register, clear],
  );

  const state = stateRef.current;
  const dirty = state.dirty;
  const savedMsg = readFlash();
  // While a flash is live, tick so the bar auto-hides at expiry even if nothing
  // else re-renders.
  useEffect(() => {
    if (!savedMsg) return;
    const t = setInterval(() => force((n) => n + 1), 300);
    return () => clearInterval(t);
  }, [savedMsg]);

  // The bar shows ONLY for the save lifecycle — saving / saved / failed. It does
  // NOT appear on `dirty` (no real-estate creep while typing — Roland 2026-06-11).
  const showSaved = !!savedMsg && !state.saving && !state.error;
  const show = state.saving || !!state.error || showSaved;

  const mode: "failed" | "saving" | "saved" = state.error
    ? "failed"
    : state.saving
      ? "saving"
      : "saved";

  const STATUS = {
    saving: { dot: "bg-info", label: "Saving", pill: "bg-info/12 text-info", msg: "RolDe is saving…" },
    saved: { dot: "bg-success", label: "Saved", pill: "bg-success/12 text-success", msg: savedMsg ?? "Saved" },
    failed: { dot: "bg-critical", label: "Couldn’t save", pill: "bg-critical/12 text-critical", msg: state.error || "Couldn’t save — please try again." },
  }[mode];

  // ── Unsaved-work guards while dirty ──────────────────────────────────────
  // Guard 1 — browser-level (refresh / tab close); can't be a custom modal.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Guard 2 — in-app navigation (sidebar, breadcrumb, any internal link).
  // Capture-phase so we intercept BEFORE Next's Link handler → show the central
  // discard modal instead of the browser default (Roland 2026-06-11).
  useEffect(() => {
    if (!dirty) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.getAttribute("target") === "_blank") return;
      const isInternal = href.startsWith("/") || href.startsWith(window.location.origin);
      if (!isInternal) return;
      const dest = href.replace(window.location.origin, "");
      if (dest === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(dest);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty]);

  function confirmLeave() {
    const dest = pendingHref;
    setPendingHref(null);
    if (!dest) return;
    stateRef.current.onDiscard?.();
    clear();
    router.push(dest);
  }

  const btnDark =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-shadow hover:shadow-md disabled:opacity-60";
  const btnGhost =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground";

  return (
    <ActionBarContext.Provider value={ctx}>
      {children}
      {mounted &&
        createPortal(
          <>
            {/* SAVE-CONFIRMATION bar (saving / saved / failed only) */}
            <div
              aria-hidden={!show}
              className={cn(
                "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3 transition-all duration-300 ease-out",
                show ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
              )}
            >
              <div className="glass pointer-events-auto flex w-auto max-w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3.5 py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_16px_40px_-12px_rgba(0,0,0,0.28)]">
                <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                  <span className={cn("size-2 shrink-0 rounded-full transition-colors", STATUS.dot)} aria-hidden />
                  <span className={cn("inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors", STATUS.pill)}>
                    {STATUS.label}
                  </span>
                  <span className="truncate text-foreground">{STATUS.msg}</span>
                </span>

                {mode === "saved" ? (
                  <>
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-success px-3 text-sm font-medium text-white shadow-sm">
                      <Check className="size-4" /> Saved
                    </span>
                    <button type="button" onClick={clearFlash} aria-label="Dismiss" className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </>
                ) : mode === "failed" ? (
                  <button type="button" onClick={() => state.onSave()} className={btnDark}>
                    Retry
                  </button>
                ) : (
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary/90 px-3 text-sm font-medium text-primary-foreground">
                    <Loader2 className="size-4 animate-spin" /> Saving…
                  </span>
                )}
              </div>
            </div>

            {/* CENTRAL discard modal (in-app nav while dirty) */}
            {pendingHref !== null && (
              <div
                className="fixed inset-0 z-[110] flex items-center justify-center bg-foreground/10 p-4 backdrop-blur-md"
                onClick={() => setPendingHref(null)}
              >
                <div
                  className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-overlay"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-warning/12 text-warning">
                    <TriangleAlert className="size-5" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold tracking-tight">
                    Leave without saving?
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You’ve got unsaved work here — it’ll be lost if you leave now.
                  </p>
                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button type="button" onClick={() => setPendingHref(null)} className={btnGhost}>
                      Stay on page
                    </button>
                    <button
                      type="button"
                      onClick={confirmLeave}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-critical px-4 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md"
                    >
                      Discard &amp; leave
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body,
        )}
    </ActionBarContext.Provider>
  );
}
