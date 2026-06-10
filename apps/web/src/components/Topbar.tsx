"use client";

import { usePathname } from "next/navigation";

/**
 * Floating glass topbar (RDS ancestry — mindate "Glass" treatment, APPROVALS
 * §1.2 there): a sticky frosted bar inset within the overall content card,
 * aligned to the body column. Content scrolls UNDER it and frosts through.
 * Glass is for the top + bottom bars ONLY — every other overlay is white.
 */
const SECTION_LABELS: [RegExp, string][] = [
  [/^\/$/, "Dashboard"],
  [/^\/patients\/new/, "New patient"],
  [/^\/patients\/[^/]+/, "Patient record"],
  [/^\/patients/, "Patients"],
  [/^\/calendar/, "Calendar"],
  [/^\/investigations/, "Investigations"],
  [/^\/prescribing/, "Prescribing"],
  [/^\/letters/, "Letters"],
  [/^\/billing/, "Billing"],
  [/^\/reports/, "Reports"],
  [/^\/settings/, "Settings"],
];

export function Topbar({ clinic, user }: { clinic: string; user: string }) {
  const pathname = usePathname();
  const label =
    SECTION_LABELS.find(([re]) => re.test(pathname))?.[1] ?? "RolDe";

  return (
    <div className="sticky top-0 z-40 px-4 pt-3">
      <div className="flex h-10 items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/55 px-4 shadow-sm backdrop-blur-md backdrop-saturate-150">
        <span className="shrink-0 text-sm font-medium">{label}</span>
        <span className="truncate text-xs text-muted-foreground">
          {clinic} · {user}
        </span>
      </div>
    </div>
  );
}
