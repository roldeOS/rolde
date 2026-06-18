import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * RolDe form fields (Roland 2026-06-11): FLOATING — no flat border, a soft
 * shadow + hairline ring that lifts on focus. When a field is valid it shows a
 * green tick in a squircle at the right edge (mindate-iOS treatment).
 */
// Option B field (Roland 2026-06-11): shallow float + a very thin shadcn hairline,
// no glow. (`field-glass` holds the Liquid Glass alternative if ever wanted.)
export const fieldFloat =
  "field-float h-10 w-full min-w-0 rounded-lg px-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50";

function ValidTick() {
  return (
    <span className="tick-squircle pointer-events-none absolute right-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-[7px] text-emerald-600">
      <Check className="size-3.5" strokeWidth={2.75} />
    </span>
  );
}

function ErrorX() {
  return (
    <span className="x-squircle pointer-events-none absolute right-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-[7px] text-rose-600">
      <X className="size-3.5" strokeWidth={2.75} />
    </span>
  );
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={htmlFor}
        // flex-wrap + a nowrap label keeps the field name on one line and lets a
        // long hint flow to the next line in narrow columns — never breaking the
        // label mid-word (Roland 2026-06-18).
        className="flex flex-wrap items-baseline gap-x-1.5 text-xs font-medium text-muted-foreground"
      >
        <span className="whitespace-nowrap">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </span>
        {hint && <span className="font-normal opacity-80">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export function Input({
  valid,
  error,
  className,
  ...props
}: React.ComponentProps<"input"> & { valid?: boolean; error?: boolean }) {
  return (
    <div className="relative">
      <input
        {...props}
        className={cn(
          fieldFloat,
          valid && "field-ok",
          error && "field-err",
          (valid || error) && "pr-10",
          className,
        )}
      />
      {error ? <ErrorX /> : valid ? <ValidTick /> : null}
    </div>
  );
}

export function Select({
  valid,
  className,
  ...props
}: React.ComponentProps<"select"> & { valid?: boolean }) {
  // `appearance-none` drops the GENERIC browser arrow; we draw OUR own integrated
  // chevron instead (Roland 2026-06-11). The valid tick sits to its left.
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(fieldFloat, "appearance-none", valid ? "pr-16" : "pr-9", className)}
      />
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      {valid && (
        <span className="tick-squircle pointer-events-none absolute right-8 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-[7px] text-emerald-600">
          <Check className="size-3.5" strokeWidth={2.75} />
        </span>
      )}
    </div>
  );
}
