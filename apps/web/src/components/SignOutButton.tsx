"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CardIcon } from "@/components/ui/CardIcon";

/** Sidebar-footer sign-out row — RDS pattern (signature badge + tinted icon). */
export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
    >
      <CardIcon icon={LogOut} tone="critical" variant="badge" size="sm" />
      Sign out
    </button>
  );
}
