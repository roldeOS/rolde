"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, KeyRound, Ban, RotateCcw, Loader2, Check } from "lucide-react";
import { useClickAway } from "@/lib/useClickAway";
import { useSavedFlash } from "@/components/ui/PageActionBar";
import { cn } from "@/lib/utils";

/**
 * Per-member SECONDARY actions (W1.1.7): Send Reset Link · Pause/Restore. Edit is
 * now the ROW CLICK (Roland 2026-06-21 — "the row should hover + be clickable to
 * edit", not buried in a ⋯). The ⋯ keeps the careful, less-frequent actions.
 *
 * Pausing never deletes the login — it flips the membership status to `paused`
 * (the restorable state), so a restored member walks back in with their records
 * intact. The Caretaker's OWN row has no secondary actions (no self-lockout) →
 * the menu doesn't render for self.
 */
const ITEM =
  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-hover disabled:opacity-60";

export function RowActions({
  member,
  isMe,
}: {
  member: { id: string; display_name: string; status: string };
  isMe: boolean;
}) {
  const router = useRouter();
  const flashSaved = useSavedFlash();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmPause, setConfirmPause] = useState(false);
  const ref = useClickAway<HTMLDivElement>(() => {
    setOpen(false);
    setConfirmPause(false);
  });

  // Self has no secondary actions — Edit (the row click) is the only thing they
  // can do to their own row, so there's nothing to put behind a menu.
  if (isMe) return null;

  const paused = member.status !== "active";

  async function post(url: string, body: object, key: string): Promise<boolean> {
    setBusy(key);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      return res.ok && data.ok;
    } catch {
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function sendReset() {
    const ok = await post("/api/clinic/users/reset-link", { id: member.id }, "reset");
    setNotice(ok ? "Reset link sent" : "Couldn't send");
    setTimeout(() => {
      setNotice(null);
      setOpen(false);
    }, 1400);
  }

  async function setStatus(status: string) {
    const ok = await post("/api/clinic/users/update", { id: member.id, status }, "status");
    setOpen(false);
    setConfirmPause(false);
    if (ok) {
      flashSaved(
        status === "active"
          ? `RolDe restored ${member.display_name}’s access.`
          : `RolDe paused ${member.display_name}’s access.`,
      );
      router.refresh();
    }
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
        aria-label="More actions"
        title="More actions"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-52 rounded-xl bg-card p-1 shadow-overlay">
          {notice ? (
            <div className="flex items-center gap-2 px-2.5 py-2 text-sm font-medium text-success">
              <Check className="size-4" /> {notice}
            </div>
          ) : (
            <>
              {!paused && (
                <button onClick={sendReset} disabled={!!busy} className={ITEM}>
                  {busy === "reset" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <KeyRound className="size-4 text-muted-foreground" />
                  )}
                  Send Reset Link
                </button>
              )}

              {paused ? (
                <button onClick={() => setStatus("active")} disabled={!!busy} className={cn(ITEM, "text-success")}>
                  {busy === "status" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                  Restore Access
                </button>
              ) : confirmPause ? (
                <button onClick={() => setStatus("paused")} disabled={!!busy} className={cn(ITEM, "font-semibold text-critical")}>
                  {busy === "status" ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
                  Tap Again to Pause
                </button>
              ) : (
                <button onClick={() => setConfirmPause(true)} className={cn(ITEM, "text-critical")}>
                  <Ban className="size-4" /> Pause Access
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
