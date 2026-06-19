import { X } from "lucide-react";
import { CardIcon, type CardIconTone } from "./CardIcon";

/**
 * DialogHeaderRow — the standard header for a modal (Roland 2026-06-18: "a modal
 * is a new page of sorts, so it needs an IconChip"). Carries the CardIcon squircle
 * + title (+ optional subtitle) + a close button — the same signature a page gets
 * from PageHeaderRow / a card from CardHeaderRow (APPROVALS §9). Every modal uses
 * this so none ever ships a bare title.
 */
export function DialogHeaderRow({
  icon,
  tone = "brand",
  title,
  subtitle,
  onClose,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone?: CardIconTone;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <CardIcon icon={icon} tone={tone} variant="badge" size="md" />
        <div>
          <h2 className="font-heading text-base font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
