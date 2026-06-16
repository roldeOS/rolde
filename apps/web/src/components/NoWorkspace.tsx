"use client";

import { useRouter } from "next/navigation";
import { LogOut, DoorClosed } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CardIcon } from "@/components/ui/CardIcon";
import { Button } from "@/components/ui/button";

/**
 * Shown when someone is authenticated but attached to NOTHING — no clinic
 * membership and not a Custodian (e.g. a retired Custodian account, or a user
 * whose access was revoked). An honest dead-end beats dropping them into an
 * empty clinic shell where every query silently returns nothing.
 */
export function NoWorkspace({ email }: { email: string }) {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-6">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl bg-card p-10 text-center shadow-float">
        <CardIcon icon={DoorClosed} tone="neutral" variant="badge" size="md" />
        <div>
          <h1 className="font-heading text-lg font-semibold tracking-tight">No Workspace Yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {email ? (
              <>
                <span className="font-medium text-foreground">{email}</span>
                {" isn't linked to a clinic. "}
              </>
            ) : (
              "This account isn't linked to a clinic. "
            )}
            If you&apos;re expecting access, your Caretaker can invite you — or a Custodian can set
            you up.
          </p>
        </div>
        <Button onClick={signOut} variant="secondary">
          <LogOut className="size-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
