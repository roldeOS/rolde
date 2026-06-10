"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft, ChevronRight } from "lucide-react";
import { useTopbar } from "./TopbarContext";
import { PatientChip } from "./PatientChip";
import { CommandMenu } from "./CommandMenu";
import { Recents } from "./Recents";
import { NotificationsBell } from "./NotificationsBell";
import { ProfileMenu } from "./ProfileMenu";

/**
 * The glass topbar (mindate "Glass" recipe, Roland 2026-06-10):
 *   bg-card/30 backdrop-blur-sm backdrop-saturate-200 backdrop-brightness-105,
 *   ≈18% card where backdrop-filter is supported. Content scrolls UNDER it.
 *
 * Left  — sidebar toggle + page-path breadcrumb.
 * Right — patient chip (allergy-red zone) · search · recents · bell · profile.
 */
const SECTION: [RegExp, string][] = [
  [/^\/$/, "Dashboard"],
  [/^\/patients/, "Patients"],
  [/^\/calendar/, "Calendar"],
  [/^\/investigations/, "Investigations"],
  [/^\/prescribing/, "Prescribing"],
  [/^\/letters/, "Letters"],
  [/^\/billing/, "Billing"],
  [/^\/reports/, "Reports"],
  [/^\/settings/, "Settings"],
];

export function Topbar({
  clinic,
  user,
  role,
  onToggleSidebar,
}: {
  clinic: string;
  user: string;
  role: string;
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const { patient } = useTopbar();
  const section = SECTION.find(([re]) => re.test(pathname))?.[1] ?? "RolDe";
  const sectionHref =
    section === "Dashboard" ? "/" : `/${section.toLowerCase()}`;
  const leaf =
    pathname === "/patients/new"
      ? "New patient"
      : patient
        ? `${patient.firstName} ${patient.lastName}`
        : null;

  return (
    <div className="sticky top-0 z-40 px-4 pt-3">
      <div className="flex h-11 items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/30 px-2.5 shadow-sm backdrop-blur-sm backdrop-saturate-200 backdrop-brightness-105 supports-[backdrop-filter]:bg-card/18">
        {/* Left — toggle + breadcrumb */}
        <nav className="flex min-w-0 items-center gap-1" aria-label="Breadcrumb">
          <button
            onClick={onToggleSidebar}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="size-[18px]" />
          </button>
          <Link
            href={sectionHref}
            className="shrink-0 rounded-md px-1.5 py-1 text-sm font-medium transition-colors hover:bg-hover"
          >
            {section}
          </Link>
          {leaf && (
            <>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate px-1.5 py-1 text-sm text-muted-foreground">
                {leaf}
              </span>
            </>
          )}
        </nav>

        {/* Right — patient chip · search · recents · bell · profile */}
        <div className="flex shrink-0 items-center gap-1.5">
          <PatientChip />
          <CommandMenu />
          <Recents />
          <NotificationsBell />
          <div className="mx-0.5 h-5 w-px bg-border" />
          <ProfileMenu user={user} role={role} clinic={clinic} />
        </div>
      </div>
    </div>
  );
}
