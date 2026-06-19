"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";
import { useSavedFlash } from "@/components/ui/PageActionBar";
import { DialogHeaderRow } from "@/components/ui/DialogHeaderRow";
import { emptyMemberForm, windowFromForm, type MemberForm } from "@/lib/memberForm";
import { MemberFields } from "./MemberFields";

/**
 * Invite a teammate (W1.1.7 chunk 2) — the Caretaker fills the shared member
 * fields + email, and RolDe emails a single-use set-password link. POSTs to
 * /api/clinic/users/invite; on success it refreshes the roster.
 */
export function InviteTeammate({ country }: { country: string }) {
  const router = useRouter();
  const flashSaved = useSavedFlash();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [form, setForm] = useState<MemberForm>(() => emptyMemberForm(country));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<MemberForm>) => setForm((f) => ({ ...f, ...patch }));

  function close() {
    if (busy) return;
    setOpen(false);
    setForm(emptyMemberForm(country));
    setError(null);
  }

  async function submit() {
    setError(null);
    if (!form.displayName.trim()) return setError("Add their full name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return setError("Add a valid email.");
    const window = windowFromForm(form);
    if (!window) return setError("Set the access dates.");

    setBusy(true);
    try {
      const res = await fetch("/api/clinic/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
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
          data.error === "already_member"
            ? "They're already in this clinic — edit them from the list."
            : "That didn't go through. Check the details and try again.",
        );
        setBusy(false);
        return;
      }
      const name = form.displayName.trim();
      setOpen(false);
      setForm(emptyMemberForm(country));
      flashSaved(`RolDe sent ${name} an invite to join.`);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90"
      >
        <UserPlus className="size-4" /> Invite Teammate
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-foreground/20 p-4 py-[8vh] backdrop-blur-sm"
            onClick={close}
          >
            <div
              className="w-full max-w-2xl rounded-2xl bg-card shadow-overlay"
              onClick={(e) => e.stopPropagation()}
            >
              <DialogHeaderRow
                icon={UserPlus}
                tone="accent"
                title="Invite Teammate"
                subtitle="They'll set their own password from a single-use link."
                onClose={close}
              />

              <div className="px-6 py-5">
                <MemberFields form={form} onChange={update} country={country} showEmail />
                {error && (
                  <p className="mt-4 rounded-lg bg-critical/10 px-3 py-2 text-xs font-medium text-critical">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
                <button
                  onClick={close}
                  disabled={busy}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90 disabled:opacity-60"
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  {busy ? "Sending…" : "Send Invite"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
