"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  KeyRound,
  Ban,
  RotateCcw,
  Loader2,
  Check,
} from "lucide-react";
import { useClickAway } from "@/lib/useClickAway";
import { useSavedFlash } from "@/components/ui/PageActionBar";
import { cn } from "@/lib/utils";
import { EditMember, type EditableMember } from "./EditMember";

/**
 * Per-member actions (W1.1.7 chunk 2): Edit · Send Reset Link · Deactivate/Activate.
 * Deactivating never deletes the login — it flips the membership status to `deactivated`
 * (the schema's reversible deactivated state), so a reactivated member walks back in with their
 * records intact. The Caretaker's OWN row can only be edited (no self-deactivate /
 * self-reset → no self-lockout).
 */
const ITEM =
  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-hover disabled:opacity-60";

export function RowActions({
  member,
  isMe,
  country,
}: {
  member: EditableMember & { status: string };
  isMe: boolean;
  country: string;
}) {
  const router = useRouter();
  const flashSaved = useSavedFlash();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const ref = useClickAway<HTMLDivElement>(() => {
    setOpen(false);
    setConfirmDeactivate(false);
  });

  const deactivated = member.status !== "active";

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
    setConfirmDeactivate(false);
    if (ok) {
      flashSaved(
        status === "active"
          ? `RolDe activated ${member.display_name}’s access.`
          : `RolDe deactivated ${member.display_name}’s access.`,
      );
      router.refresh();
    }
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
        aria-label="Member actions"
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
              <button
                onClick={() => {
                  setEditOpen(true);
                  setOpen(false);
                }}
                className={ITEM}
              >
                <Pencil className="size-4 text-muted-foreground" /> Edit
              </button>

              {!isMe && !deactivated && (
                <button onClick={sendReset} disabled={!!busy} className={ITEM}>
                  {busy === "reset" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <KeyRound className="size-4 text-muted-foreground" />
                  )}
                  Send Reset Link
                </button>
              )}

              {!isMe &&
                (deactivated ? (
                  <button
                    onClick={() => setStatus("active")}
                    disabled={!!busy}
                    className={cn(ITEM, "text-success")}
                  >
                    {busy === "status" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RotateCcw className="size-4" />
                    )}
                    Activate
                  </button>
                ) : confirmDeactivate ? (
                  <button
                    onClick={() => setStatus("deactivated")}
                    disabled={!!busy}
                    className={cn(ITEM, "font-semibold text-critical")}
                  >
                    {busy === "status" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Ban className="size-4" />
                    )}
                    Tap Again to Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmDeactivate(true)}
                    className={cn(ITEM, "text-critical")}
                  >
                    <Ban className="size-4" /> Deactivate
                  </button>
                ))}
            </>
          )}
        </div>
      )}

      <EditMember
        member={member}
        country={country}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}
