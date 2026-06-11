import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * RolDe Button — the RDS tonal button system (mindate ancestry, locked there
 * 2026-05-30), re-skinned monochrome:
 *   - default     = solid primary (near-black). The ONE prominent action per view.
 *   - secondary   = neutral tonal fill.
 *   - outline     = bordered, hover wash.
 *   - ghost       = no chrome until hover.
 *   - destructive = tonal red (resting red fill, deepens on hover) — never solid.
 *   - success     = tonal green twin of destructive, for positive/confirm.
 * Never hand-roll button classes — use these variants.
 */
const buttonVariants = cva(
  // Floating + elegant (Roland 2026-06-11): every button lifts on a soft shadow
  // and presses on click. `ghost`/`link` stay flat (they're not raised chrome).
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent text-sm font-medium whitespace-nowrap shadow-sm transition-all outline-none select-none hover:shadow active:translate-y-px active:shadow-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/85",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "bg-card ring-1 ring-black/[0.06] hover:bg-hover hover:text-foreground",
        ghost: "shadow-none hover:bg-hover hover:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        success:
          "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20",
        link: "shadow-none hover:underline underline-offset-4 text-primary hover:shadow-none",
      },
      size: {
        default: "h-8 px-2.5",
        sm: "h-7 px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 px-3",
        icon: "size-8",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
