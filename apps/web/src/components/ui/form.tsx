import { cn } from "@/lib/utils";

/**
 * RolDe form field styling — the mindate dashboard input (Roland 2026-06-11):
 * a clean bordered field, thin 1.5px focus ring (no halo). Used for every form
 * input / select so new forms are elegant and standardised, never generic.
 */
export const fieldInput =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[1.5px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

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
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
      >
        {label}
        {required && <span className="text-destructive">*</span>}
        {hint && <span className="ml-1 font-normal opacity-80">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export function Input(props: React.ComponentProps<"input">) {
  return <input {...props} className={cn(fieldInput, props.className)} />;
}

export function Select(props: React.ComponentProps<"select">) {
  return <select {...props} className={cn(fieldInput, props.className)} />;
}
