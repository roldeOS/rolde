import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardHeaderRow } from "@/components/ui/CardHeaderRow";
import type { CardIconTone } from "@/components/ui/CardIcon";

/**
 * Calm placeholder for a module that is specified in the Bibles but not yet
 * built. Honest signposting (never deleted — replaced by the real module;
 * mindate MISTAKES #10). No illustrations, no noise (Bible 4.2 §9.5).
 */
export function ModuleStub({
  icon,
  tone,
  title,
  blurb,
  source,
  switchedOff,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  title: string;
  blurb: string;
  source: string;
  /** Clinical Modules (W1.1): the clinic switched this module OFF — say so
   *  honestly on a direct visit (the nav/⌘K already hide the entrance). */
  switchedOff?: boolean;
}) {
  return (
    <div className="w-full p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardHeaderRow icon={icon} tone={tone} title={title} description={blurb} />
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">
            {switchedOff
              ? "Your clinic has this module switched off. A Caretaker can turn it on in Settings → Clinical Modules."
              : `This module is specified in ${source} and arrives in a coming build pass. Nothing to configure yet.`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
