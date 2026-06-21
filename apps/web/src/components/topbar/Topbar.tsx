"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
import {
  PanelLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  User,
  UserPlus,
  CalendarDays,
  FlaskConical,
  Pill,
  Mail,
  Receipt,
  BarChart3,
  Settings,
  ScrollText,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { useTopbar, type WorkspaceView } from "./TopbarContext";
import { PatientIsland } from "./PatientIsland";
import { CommandMenu } from "./CommandMenu";
import { Clock } from "./Clock";
import { Recents } from "./Recents";
import { NotificationsBell } from "./NotificationsBell";
import { RolesGlossaryButton } from "./RolesGlossaryButton";
import { ProfileMenu } from "./ProfileMenu";
import { useNavTrail, type TrailEntry } from "@/lib/useNavTrail";
import { SETTINGS_SECTIONS, getSection } from "@/app/(app)/settings/sections";
import { LOG_SECTIONS, getLogSection } from "@/app/(app)/logs/sections";
import { CONTROL_NAV, CONTROL_HUB, getControlSection } from "@/app/(app)/custodian/sections";
import { cn } from "@/lib/utils";

/**
 * The glass topbar (Roland 2026-06-10/11). Left — sidebar toggle + the JOURNEY
 * breadcrumb (useNavTrail): the path the user actually walked, rooted at the
 * Dashboard, so they can step back. The patient identity (+ its island) is the
 * terminal crumb when on a patient. Right — view-selector, search, recents,
 * bell, profile.
 */
const SECTIONS: { re: RegExp; label: string; kind: string }[] = [
  { re: /^\/$/, label: "Dashboard", kind: "dashboard" },
  { re: /^\/patients/, label: "Patients", kind: "patients" },
  { re: /^\/calendar/, label: "Calendar", kind: "calendar" },
  { re: /^\/investigations/, label: "Investigations", kind: "investigations" },
  { re: /^\/prescribing/, label: "Prescribing", kind: "prescribing" },
  { re: /^\/letters/, label: "Letters", kind: "letters" },
  { re: /^\/billing/, label: "Billing", kind: "billing" },
  { re: /^\/reports/, label: "Reports", kind: "reports" },
  { re: /^\/settings/, label: "Settings", kind: "settings" },
  { re: /^\/logs/, label: "Logs", kind: "logs" },
  { re: /^\/legal/, label: "Legal & Safety", kind: "legal" },
];

const KIND_ICON: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  patients: Users,
  patient: User,
  "new-patient": UserPlus,
  calendar: CalendarDays,
  investigations: FlaskConical,
  prescribing: Pill,
  letters: Mail,
  billing: Receipt,
  reports: BarChart3,
  settings: Settings,
  logs: ScrollText,
  legal: Scale,
};

// A settings/logs SUB-page crumb (e.g. Clinic Profile, Activity Log) carries its
// section's own icon, drawn from the single registry so the two never drift.
const SETTINGS_ICON: Record<string, LucideIcon> = Object.fromEntries(
  SETTINGS_SECTIONS.map((s) => [s.key, s.icon as LucideIcon]),
);
const LOGS_ICON: Record<string, LucideIcon> = Object.fromEntries(
  LOG_SECTIONS.map((s) => [s.key, s.icon as LucideIcon]),
);
const CONTROL_ICON: Record<string, LucideIcon> = Object.fromEntries(
  [...CONTROL_NAV, ...CONTROL_HUB].map((s) => [s.key, s.icon as LucideIcon]),
);

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
  const onConsult = !!patient;

  // ── Build the CURRENT page entry + cold-load parents for the journey trail ──
  const isPatientDetail =
    /^\/patients\/[^/]+$/.test(pathname) && pathname !== "/patients/new";
  const firstSeg = pathname === "/" ? "/" : "/" + pathname.split("/")[1];
  const sectionMatch = SECTIONS.find((s) => s.re.test(pathname));

  // The "/" home crumb follows the role: clinic roles land on the Dashboard, a
  // Custodian lands on the platform Overview (which also lives at "/").
  const home: TrailEntry =
    role === "custodian"
      ? { href: "/", label: "Overview", kind: "overview" }
      : { href: "/", label: "Dashboard", kind: "dashboard" };

  let trailCurrent: TrailEntry | null = null;
  let parents: TrailEntry[] = [];
  if (pathname === "/patients/new") {
    trailCurrent = { href: pathname, label: "New Patient", kind: "new-patient" };
    parents = [{ href: "/patients", label: "Patients", kind: "patients" }];
  } else if (isPatientDetail) {
    parents = [{ href: "/patients", label: "Patients", kind: "patients" }];
    // null until the name resolves, so we never push a placeholder crumb.
    trailCurrent = patient
      ? {
          href: pathname,
          label: `${patient.firstName} ${patient.lastName}`,
          kind: "patient",
        }
      : null;
  } else if (/^\/settings\/[^/]+$/.test(pathname)) {
    // A Settings SUB-page (e.g. Clinic Profile): Settings is the clickable
    // PARENT, the section is the current crumb — so the breadcrumb steps back
    // to the hub (Roland 2026-06-17).
    const slug = pathname.split("/")[2];
    parents = [{ href: "/settings", label: "Settings", kind: "settings" }];
    trailCurrent = {
      href: pathname,
      label: getSection(slug)?.title ?? "Settings",
      kind: slug,
    };
  } else if (/^\/logs\/[^/]+$/.test(pathname)) {
    // A Logs SUB-page (e.g. Activity Log): Logs is the clickable PARENT, the log
    // is the current crumb — so the breadcrumb steps back to the hub.
    const slug = pathname.split("/")[2];
    parents = [{ href: "/logs", label: "Logs", kind: "logs" }];
    trailCurrent = {
      href: pathname,
      label: getLogSection(slug)?.title ?? "Logs",
      kind: slug,
    };
  } else if (/^\/custodian\/[^/]+$/.test(pathname)) {
    // A Custodian (Platform) SUB-page: the Overview is the clickable PARENT, the
    // control section is the current crumb — mirrors Settings/Logs.
    const slug = pathname.split("/")[2];
    parents = [home];
    trailCurrent = {
      href: pathname,
      label: getControlSection(slug)?.label ?? "Platform",
      kind: slug,
    };
  } else if (sectionMatch) {
    trailCurrent =
      sectionMatch.kind === "dashboard"
        ? home
        : { href: firstSeg, label: sectionMatch.label, kind: sectionMatch.kind };
  }

  const trail = useNavTrail(trailCurrent, parents, home);

  return (
    <div className="search-hideable sticky top-0 z-40 px-3 pt-3 sm:px-4">
      {/* Floating glass bar (Roland 2026-06-11, mindate parity): a bright inset
          top-highlight ("wet glass lip") + a soft drop shadow so it reads as a
          bar floating over the page, not a flat seam. */}
      <div className="glass flex h-11 items-center justify-between gap-3 rounded-xl border border-white/50 px-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_8px_22px_-10px_rgba(0,0,0,0.22)]">
        {/* Left — toggle + JOURNEY breadcrumb trail */}
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

          {trail.map((seg, i) => {
            const isLast = i === trail.length - 1;
            // Dashboard root is icon-only once the trail grows; otherwise show
            // the label only for the last two crumbs (older ones collapse to
            // icons to save room) — Roland 2026-06-11.
            const showLabel =
              i === 0 ? trail.length === 1 : i >= trail.length - 2;
            const Icon =
              KIND_ICON[seg.kind] ?? SETTINGS_ICON[seg.kind] ?? LOGS_ICON[seg.kind] ?? CONTROL_ICON[seg.kind] ?? User;

            // Terminal patient crumb keeps the rich PatientIsland (name +
            // allergy flag + click-to-open island).
            if (isLast && seg.kind === "patient" && patient) {
              return (
                <Fragment key={seg.href}>
                  {i > 0 && (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" />
                  )}
                  <PatientIsland />
                </Fragment>
              );
            }

            const inner = (
              <>
                <Icon className="size-4 shrink-0" />
                {showLabel && <span className="truncate">{seg.label}</span>}
              </>
            );

            return (
              <Fragment key={seg.href + i}>
                {i > 0 && (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" />
                )}
                {isLast ? (
                  <span
                    className="flex min-w-0 items-center gap-1.5 px-1.5 py-1 text-sm font-medium"
                    aria-current="page"
                  >
                    {inner}
                  </span>
                ) : (
                  <Link
                    href={seg.href}
                    title={seg.label}
                    className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                  >
                    {inner}
                  </Link>
                )}
              </Fragment>
            );
          })}
        </nav>

        {/* Right — view-selector · search · clock · recents · bell · profile.
            Search lives in this cluster, not on the left (the left belongs to the
            JOURNEY breadcrumb); the clock sits AFTER the search (Roland 2026-06-16). */}
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
          {/* Live date + time to the second — sits just AFTER the search bar
              (Roland 2026-06-16). timeZone defaults to the viewer's local clock;
              the Caretaker clinic-timezone setting will feed it later (W1.1.x). */}
          <Clock />
          <Recents />
          <NotificationsBell />
          <div className="mx-0.5 h-5 w-px bg-border" />
          <RolesGlossaryButton role={role} />
          <ProfileMenu user={user} role={role} clinic={clinic} />
        </div>
      </div>
    </div>
  );
}
