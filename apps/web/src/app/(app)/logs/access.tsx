import { Lock } from "lucide-react";
import { getSessionContext } from "@/lib/auth";
import { CardIcon } from "@/components/ui/CardIcon";

/**
 * The Logs Hub is the Caretaker's audit shelf (Roland: "only a caretaker gets to
 * see the Logs"). Only the clinic's Caretaker — or a platform Custodian — may
 * open it. The DB enforces the real gate via RLS on each log table (is_caretaker_of
 * / is_custodian); this is the matching UI gate so other roles get a calm, honest
 * screen instead of an empty page. Logging stays role-blind — everyone's actions
 * are recorded; this is only the reading surface.
 */
export async function getLogsAccess() {
  const ctx = await getSessionContext();
  const role = ctx?.membership?.role;
  const allowed = role === "caretaker" || Boolean(ctx?.isCustodian);
  return { allowed, ctx };
}

export function LogsRestricted() {
  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl bg-card p-10 text-center shadow-float">
        <CardIcon icon={Lock} tone="neutral" variant="badge" size="md" />
        <div>
          <h1 className="font-heading text-lg font-semibold tracking-tight">
            Kept By Your Caretaker
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your clinic&apos;s logs are an audit record looked after by your Caretaker. Your own
            actions are still recorded here — this is just the place they&apos;re reviewed.
          </p>
        </div>
      </div>
    </div>
  );
}
