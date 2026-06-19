"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { UserCog, Loader2 } from "lucide-react";
import { useSavedFlash } from "@/components/ui/PageActionBar";
import { DialogHeaderRow } from "@/components/ui/DialogHeaderRow";
import {
  memberFormFrom,
  windowFromForm,
  type MemberForm,
} from "@/lib/memberForm";
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
}: {
  member: EditableMember;
  country: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const flashSaved = useSavedFlash();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [form, setForm] = useState<MemberForm>(() => memberFormFrom(member));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed the form whenever a new member's editor opens.
  useEffect(() => {
    if (open) {
      setForm(memberFormFrom(member));
      setError(null);
    }
  }, [open, member]);

  const update = (patch: Partial<MemberForm>) => setForm((f) => ({ ...f, ...patch }));

  function close() {
    if (busy) return;
    onClose();
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

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
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
    </div>,
    document.body,
  );
}
