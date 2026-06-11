"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserCircle, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useClickAway } from "@/lib/useClickAway";

/** Profile dropdown — identity + sign-out (fully functional). */
export function ProfileMenu({
  user,
  role,
  clinic,
}: {
  user: string;
  role: string;
  clinic: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickAway<HTMLDivElement>(close);

  const initials = user
    .replace(/^Dr\s+/i, "")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-info to-info/70 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        aria-label="Profile"
      >
        {initials || <UserCircle className="size-4" />}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl bg-card p-1.5 shadow-overlay">
          <div className="px-2.5 py-2">
            <p className="text-sm font-semibold">{user}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {role} · {clinic}
            </p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link
            href="/settings"
            onClick={close}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-hover"
          >
            <Settings className="size-4 text-muted-foreground" /> Settings
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-critical transition-colors hover:bg-critical/10"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
