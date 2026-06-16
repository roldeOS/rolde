"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { RolesGlossary } from "./RolesGlossary";

/**
 * The "Who's Who" trigger — a quiet icon next to the avatar, on every page
 * (Roland 2026-06-16: it belongs beside the profile, not buried in the menu).
 * Opens the role glossary modal.
 */
export function RolesGlossaryButton({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Who's Who"
        aria-label="Who's Who"
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
      >
        <Users className="size-[18px]" />
      </button>
      <RolesGlossary open={open} onClose={() => setOpen(false)} currentRole={role} />
    </>
  );
}
