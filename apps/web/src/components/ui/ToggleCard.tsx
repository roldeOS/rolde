"use client";

import { Switch } from "@/components/ui/Switch";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";

/**
 * ToggleCard — RolDe's toggle-first settings card (URDS; born in Commercial
 * Settings W1.1.16, shared since Clinical Modules W1.1). A squircle icon +
 * title + plain-English blurb with the Switch on the right; optional detail
 * fields appear ONLY while it's on, so a clinic that doesn't use the thing
 * sees a clean card. All switch-a-policy settings surfaces use this one
 * component so on/off reads identically everywhere.
 */
export function ToggleCard({
  icon,
  tone,
  title,
  blurb,
  checked,
  onChange,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  title: string;
  blurb: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Detail fields shown only while ON. Omit for a plain on/off card. */
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-card p-5 shadow-float">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <CardIcon icon={icon} tone={tone} variant="badge" size="md" />
          <div>
            <h2 className="font-heading text-base font-semibold tracking-tight">{title}</h2>
            <p className="mt-0.5 max-w-prose text-sm text-muted-foreground">{blurb}</p>
          </div>
        </div>
        <Switch checked={checked} onChange={onChange} label={title} />
      </div>
      {checked && children ? (
        <div className="mt-4 border-t border-border/60 pt-4">{children}</div>
      ) : null}
    </div>
  );
}
