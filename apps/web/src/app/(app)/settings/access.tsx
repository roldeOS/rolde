import { Lock } from "lucide-react";
import { getSessionContext } from "@/lib/auth";
import { CardIcon } from "@/components/ui/CardIcon";

/**
 * Settings is the Caretaker's console (Bible 4.3 §5). Only the clinic's Caretaker
 * (or a platform Custodian) may open it. The DB enforces the real write-gate via
 * RLS (`is_caretaker_of`); this is the matching UI gate so non-admins get a calm,
 * honest screen instead of an empty page.
 */
export async function getSettingsAccess() {
  const ctx = await getSessionContext();
  const role = ctx?.membership?.role;
  const allowed = role === "caretaker" || Boolean(ctx?.isCustodian);
  return { allowed, ctx };
}

export function SettingsRestricted() {
  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl bg-card p-10 text-center shadow-float">
        <CardIcon icon={Lock} tone="neutral" variant="badge" size="md" />
        <div>
          <h1 className="font-heading text-lg font-semibold tracking-tight">
            Managed By Your Caretaker
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Clinic settings are looked after by your clinic&apos;s Caretaker. If
            something needs changing, give them a shout and they&apos;ll sort it.
          </p>
        </div>
      </div>
    </div>
  );
}
