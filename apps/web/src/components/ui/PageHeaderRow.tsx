import type { ComponentType, ReactNode } from "react";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { SectionExplainer, type ExplainerProps } from "@/components/ui/SectionExplainer";

/**
 * Standard PAGE header (ported from the mindate dashboard, Roland 2026-06-11):
 * IconChip + big title + an optional (i) explainer, with a right-side actions
 * slot. Used on EVERY page so headers are identical everywhere. Subtitles are
 * deprecated — the secondary detail lives in the (i).
 */
export function PageHeaderRow({
  icon,
  tone,
  title,
  count,
  explainer,
  actions,
}: {
  icon: ComponentType<{ className?: string }>;
  tone: CardIconTone;
  title: string;
  count?: ReactNode;
  explainer?: ExplainerProps;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <CardIcon icon={icon} tone={tone} variant="badge" />
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <h1 className="shrink-0 text-2xl font-semibold tracking-tight">{title}</h1>
          {count != null && (
            <span className="text-base font-normal text-muted-foreground tabular-nums">
              {count}
            </span>
          )}
          {explainer && <SectionExplainer {...explainer} />}
        </div>
      </div>
      {actions && (
        <div className="inline-flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
