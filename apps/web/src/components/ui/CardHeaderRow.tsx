import type { ReactNode } from "react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";

interface Props {
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  title: ReactNode;
  /** Secondary line beneath the title — aligned RIGHT of the icon (the icon
   *  spans both rows; locked in mindate APPROVALS §13.5, inherited here). */
  description?: ReactNode;
  /** Live count shown INLINE on the title row — muted, never a subtitle. */
  count?: ReactNode;
  /** Right-side content (toggles, actions) on the title baseline. */
  rightSlot?: ReactNode;
}

/**
 * CardHeaderRow — the canonical card-header layout (RDS, mindate ancestry):
 *
 *   [Icon] Title  (count)              [rightSlot]
 *          Description right-of-icon
 */
export function CardHeaderRow({
  icon,
  tone,
  title,
  description,
  count,
  rightSlot,
}: Props) {
  const titleBlock = (
    <div className="flex min-w-0 flex-1 items-start gap-2">
      <CardIcon icon={icon} tone={tone} variant="badge" />
      <div className="min-w-0 flex-1">
        <CardTitle className="flex flex-wrap items-center gap-1.5">
          {title}
          {count != null && (
            <span className="text-sm font-normal text-muted-foreground tabular-nums">
              {count}
            </span>
          )}
        </CardTitle>
        {description && (
          <CardDescription className="mt-1">{description}</CardDescription>
        )}
      </div>
    </div>
  );

  if (!rightSlot) return titleBlock;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {titleBlock}
      <div className="self-start">{rightSlot}</div>
    </div>
  );
}
