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
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/85",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border-border bg-card hover:bg-hover hover:text-foreground",
        ghost: "hover:bg-hover hover:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        success:
          "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20",
        link: "text-primary underline-offset-4 hover:underline",
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
