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
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  title: string;
  blurb: string;
  source: string;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      <Card>
        <CardHeader>
          <CardHeaderRow icon={icon} tone={tone} title={title} description={blurb} />
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">
            This module is specified in {source} and arrives in a coming build
            pass. Nothing to configure yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
