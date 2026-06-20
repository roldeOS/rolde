"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { UserCog, Loader2, KeyRound, Ban, RotateCcw, Check } from "lucide-react";
import { useSavedFlash } from "@/components/ui/PageActionBar";
import { DialogHeaderRow } from "@/components/ui/DialogHeaderRow";
import {
  memberFormFrom,
  windowFromForm,
  type MemberForm,
} from "@/lib/memberForm";
import { cn } from "@/lib/utils";
import { MemberFields } from "./MemberFields";

export type EditableMember = {
  id: string;
  display_name: string;
  role: string;
  designation: string | null;
  preferred_name: string | null;
  job_title: string | null;
  license_type: string | null;
  license_number: string | null;
  prescribing_rights: boolean;
  access_starts_at: string | null;
  access_ends_at: string | null;
};

/**
 * Edit a member (W1.1.7 chunk 2) — the same shared fields as Invite, pre-filled,
 * minus the login identity. Saving PATCHes /api/clinic/users/update.
 */
export function EditMember({
  member,
  country,
  open,
  onClose,
  isMe = false,
  status = "active",
}: {
  member: EditableMember;
  country: string;
  open: boolean;
  onClose: () => void;
  /** The Caretaker's OWN row gets no reset/pause (no self-lockout). */
  isMe?: boolean;
  /** Membership status — drives Pause vs Restore. */
  status?: string;
}) {
  const router = useRouter();
  const flashSaved = useSavedFlash();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [form, setForm] = useState<MemberForm>(() => memberFormFrom(member));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Secondary member-management actions (Reset Link · Pause/Restore), moved here
  // from the old ⋯ row menu (Roland 2026-06-21 — the row is the edit target; the
  // editor is the single place to manage a person).
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [confirmPause, setConfirmPause] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const paused = status !== "active";

  // Re-seed the form whenever a new member's editor opens.
  useEffect(() => {
    if (open) {
      setForm(memberFormFrom(member));
      setError(null);
      setConfirmPause(false);
      setNotice(null);
    }
  }, [open, member]);

  const update = (patch: Partial<MemberForm>) => setForm((f) => ({ ...f, ...patch }));

  function close() {
    if (busy || actionBusy) return;
    onClose();
  }

  async function postAction(url: string, body: object, key: string): Promise<boolean> {
    setActionBusy(key);
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
      setActionBusy(null);
    }
  }

  async function sendReset() {
    const ok = await postAction("/api/clinic/users/reset-link", { id: member.id }, "reset");
    setNotice(ok ? "Reset link sent." : "Couldn't send the link.");
    setTimeout(() => setNotice(null), 2200);
  }

  async function setStatus(next: string) {
    const ok = await postAction("/api/clinic/users/update", { id: member.id, status: next }, "status");
    setConfirmPause(false);
    if (ok) {
      onClose();
      flashSaved(
        next === "active"
          ? `RolDe restored ${member.display_name}’s access.`
          : `RolDe paused ${member.display_name}’s access.`,
      );
      router.refresh();
    }
  }

  async function save() {
    setError(null);
    if (!form.displayName.trim()) return setError("Add their full name.");
    const window = windowFromForm(form);
    if (!window) return setError("Set the access dates.");

    setBusy(true);
    try {
      const res = await fetch("/api/clinic/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: member.id,
          display_name: form.displayName.trim(),
          role: form.role,
          designation: form.designation,
          preferred_name: form.preferredName,
          job_title: form.jobTitle,
          license_type: form.licenseType,
          license_number: form.licenseNumber,
          prescribing_rights: form.prescribing,
          ...window,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(
          data.error === "self_role_locked"
            ? "You can't change your own role — ask another Caretaker."
            : "That didn't save. Check the details and try again.",
        );
        setBusy(false);
        return;
      }
      const name = form.displayName.trim();
      onClose();
      flashSaved(`RolDe updated ${name}’s details.`);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-foreground/20 p-4 py-[8vh] backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-card shadow-overlay"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeaderRow
          icon={UserCog}
          tone="accent"
          title="Edit Member"
          subtitle={member.display_name}
          onClose={close}
        />

        <div className="px-6 py-5">
          <MemberFields form={form} onChange={update} country={country} />
          {error && (
            <p className="mt-4 rounded-lg bg-critical/10 px-3 py-2 text-xs font-medium text-critical">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-4">
          {/* Secondary member-management actions (not on your own row). */}
          <div className="flex min-h-[1.75rem] flex-wrap items-center gap-1.5">
            {notice ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                <Check className="size-3.5" /> {notice}
              </span>
            ) : (
              !isMe && (
                <>
                  {!paused && (
                    <button
                      onClick={sendReset}
                      disabled={!!actionBusy}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:opacity-50"
                    >
                      {actionBusy === "reset" ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />}
                      Send Reset Link
                    </button>
                  )}
                  {paused ? (
                    <button
                      onClick={() => setStatus("active")}
                      disabled={!!actionBusy}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/10 disabled:opacity-50"
                    >
                      {actionBusy === "status" ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                      Restore Access
                    </button>
                  ) : (
                    <button
                      onClick={() => (confirmPause ? setStatus("paused") : setConfirmPause(true))}
                      disabled={!!actionBusy}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-critical transition-colors hover:bg-critical/10 disabled:opacity-50",
                        confirmPause && "bg-critical/10 font-semibold",
                      )}
                    >
                      {actionBusy === "status" ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
                      {confirmPause ? "Tap Again to Pause" : "Pause Access"}
                    </button>
                  )}
                </>
              )
            )}
          </div>

          {/* Primary actions. */}
          <div className="flex items-center gap-2">
            <button
              onClick={close}
              disabled={busy}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
