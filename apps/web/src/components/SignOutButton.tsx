"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
      className="h-10 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-neutral-100"
    >
      Sign out
    </button>
  );
}
