"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft, ChevronRight } from "lucide-react";
import { useTopbar, type WorkspaceView } from "./TopbarContext";
import { PatientIsland } from "./PatientIsland";
import { CommandMenu } from "./CommandMenu";
import { Recents } from "./Recents";
import { NotificationsBell } from "./NotificationsBell";
import { ProfileMenu } from "./ProfileMenu";
import { cn } from "@/lib/utils";

/**
 * The glass topbar (Roland 2026-06-10). Left — sidebar toggle + page-path
 * breadcrumb, with the patient identity (and its island) living IN the
 * breadcrumb (no duplicate chip). Right — the workspace view-selector (on a
 * patient), search, recents, bell, profile (the action icons carry colour).
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
  [/^\/legal/, "Legal & Safety"],
];

const VIEWS: { key: WorkspaceView; label: string }[] = [
  { key: "consult", label: "Consult" },
  { key: "document", label: "Document" },
  { key: "review", label: "Review" },
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
  const { patient, view, setView } = useTopbar();
  const section = SECTION.find(([re]) => re.test(pathname))?.[1] ?? "RolDe";
  const sectionHref = section === "Dashboard" ? "/" : `/${section.toLowerCase()}`;
  const onConsult = !!patient;

  return (
    <div className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      {/* Floating glass bar (Roland 2026-06-11, mindate parity): a bright inset
          top-highlight ("wet glass lip") + a soft drop shadow so it reads as a
          bar floating over the page, not a flat seam. */}
      <div className="glass flex h-11 items-center justify-between gap-3 rounded-xl border border-white/50 px-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_8px_22px_-10px_rgba(0,0,0,0.22)]">
        {/* Left — toggle + breadcrumb */}
        <nav className="flex min-w-0 items-center gap-0.5" aria-label="Breadcrumb">
          {/* MOBILE menu button only — desktop sidebar-collapse now lives in
              the sidebar header (Roland 2026-06-11, industry standard). */}
          <button
            onClick={onToggleSidebar}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground lg:hidden"
            aria-label="Open menu"
          >
            <PanelLeft className="size-[18px]" />
          </button>
          <Link
            href={sectionHref}
            className="shrink-0 rounded-md px-1.5 py-1 text-sm font-medium transition-colors hover:bg-hover"
          >
            {section}
          </Link>
          {(onConsult || pathname === "/patients/new") && (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {pathname === "/patients/new" && (
            <span className="px-1.5 py-1 text-sm text-muted-foreground">
              New patient
            </span>
          )}
          {onConsult && <PatientIsland />}
        </nav>

        {/* Right — view-selector · search · recents · bell · profile */}
        <div className="flex shrink-0 items-center gap-1.5">
          {onConsult && (
            <div className="hidden items-center gap-0.5 rounded-lg bg-card/70 p-0.5 shadow-sm ring-1 ring-black/[0.05] lg:flex">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    view === v.key
                      ? "bg-foreground/8 text-foreground"
                      : "text-muted-foreground hover:bg-hover hover:text-foreground",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}
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
