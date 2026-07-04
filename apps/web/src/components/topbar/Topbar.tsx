"use client";

import Link from "next/link";
import { Fragment, useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import {
  PanelLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Plus,
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
import { useTopbar, DEFAULT_LAYOUT } from "./TopbarContext";
import { useClickAway } from "@/lib/useClickAway";
import { Switch } from "@/components/ui/Switch";
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
import { CUSTODIAN_LOG_SECTIONS, getCustodianLogSection } from "@/app/(app)/custodian/logs/sections";
import { CARD_ICON_TEXT } from "@/lib/cardTones";
import type { CardIconTone } from "@/components/ui/CardIcon";
import {
  ALL_MODULES_ON,
  workupEnabled,
  type ClinicalModules,
} from "@/lib/clinicalModules";
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
const CUSTODIAN_LOG_ICON: Record<string, LucideIcon> = Object.fromEntries(
  CUSTODIAN_LOG_SECTIONS.map((s) => [s.key, s.icon as LucideIcon]),
);

// Each crumb's icon wears the SAME colour as the icon on the page it leads to
// (Roland 2026-06-22). Top-level kinds mirror that page's header tone; sub-page
// kinds (settings/logs/control/custodian-logs) inherit their section's own tone
// from the registry — so the breadcrumb chip matches its now-colourful hub card.
const KIND_TONE: Record<string, CardIconTone> = {
  dashboard: "brand",
  overview: "brand",
  patients: "brand",
  patient: "brand",
  "new-patient": "brand",
  calendar: "success",
  investigations: "info",
  prescribing: "warning",
  letters: "neutral",
  billing: "warning",
  reports: "neutral",
  settings: "neutral",
  logs: "neutral",
  legal: "neutral",
};
const SECTION_TONE: Record<string, CardIconTone> = Object.fromEntries(
  [
    ...SETTINGS_SECTIONS,
    ...LOG_SECTIONS,
    ...CONTROL_NAV,
    ...CONTROL_HUB,
    ...CUSTODIAN_LOG_SECTIONS,
  ].map((s) => [s.key, s.tone]),
);
const toneForKind = (kind: string): CardIconTone =>
  KIND_TONE[kind] ?? SECTION_TONE[kind] ?? "brand";

/**
 * The Layouts menu (Roland 2026-07-01/03, APPROVALS §4.2) — replaces the old
 * Consult/Document/Review presets. Lists Default (the locked 50/50) + the
 * user's NAMED layouts; "Save Current As…" names the live arrangement.
 */
function LayoutsMenu({ modules }: { modules: ClinicalModules }) {
  const { layout, setLayout, layouts, saveLayout, removeLayout } = useTopbar();
  const [open, setOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const ref = useClickAway<HTMLDivElement>(
    useCallback(() => {
      setOpen(false);
      setNaming(false);
    }, []),
  );
  const near = (a: number, b: number) => Math.abs(a - b) < 0.015;
  const matches = (l: {
    col: number;
    splitLeft: number;
    splitRight: number;
    hidden?: string[];
  }) =>
    near(l.col, layout.col) &&
    near(l.splitLeft, layout.splitLeft) &&
    near(l.splitRight, layout.splitRight) &&
    [...(l.hidden ?? [])].sort().join() === [...layout.hidden].sort().join();

  const commitName = () => {
    if (!name.trim()) return;
    saveLayout(name);
    setName("");
    setNaming(false);
  };

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg bg-card/70 px-2.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-colors hover:text-foreground"
      >
        Layouts
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 rounded-xl bg-card p-1.5 shadow-overlay">
          <button
            onClick={() => {
              setLayout(DEFAULT_LAYOUT);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-hover",
              matches(DEFAULT_LAYOUT) ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            Default
            {matches(DEFAULT_LAYOUT) && <Check className="size-3.5 text-foreground" />}
          </button>
          {layouts.map((l) => (
            <div
              key={l.name}
              className="group flex w-full items-center rounded-lg transition-colors hover:bg-hover"
            >
              <button
                onClick={() => {
                  setLayout({
                    col: l.col,
                    splitLeft: l.splitLeft,
                    splitRight: l.splitRight,
                    hidden: l.hidden ?? [],
                  });
                  setOpen(false);
                }}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-between px-2.5 py-1.5 text-left text-sm",
                  matches(l) ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                <span className="truncate">{l.name}</span>
                {matches(l) && <Check className="size-3.5 shrink-0 text-foreground" />}
              </button>
              <button
                onClick={() => removeLayout(l.name)}
                title={`Remove “${l.name}”`}
                className="mr-1 hidden size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-critical group-hover:flex"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {/* Card visibility (Roland 2026-07-03) — which cards this layout
              shows; Scribe is always on. Saved with named layouts. A card whose
              clinical module the CLINIC switched off (W1.1) has no row here —
              a user can hide what the clinic has on, never show what it has off. */}
          <div className="my-1 border-t border-border/60" />
          <p className="px-2.5 pb-0.5 pt-1 text-xs font-semibold tracking-wide text-foreground uppercase">
            Cards
          </p>
          {(
            [
              { key: "notes", label: "Clinical Notes" },
              { key: "workup", label: "Workup" },
              { key: "ai", label: "RolDe" },
            ] as const
          )
            .filter(
              (c) =>
                (c.key !== "workup" || workupEnabled(modules)) &&
                (c.key !== "ai" || modules.rolde_ai_enabled),
            )
            .map((c) => {
            const on = !layout.hidden.includes(c.key);
            return (
              <label
                key={c.key}
                className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-hover"
              >
                {c.label}
                <Switch
                  checked={on}
                  onChange={(next) =>
                    setLayout({
                      ...layout,
                      hidden: next
                        ? layout.hidden.filter((h) => h !== c.key)
                        : [...layout.hidden, c.key],
                    })
                  }
                  label={c.label}
                />
              </label>
            );
          })}
          <div className="my-1 border-t border-border/60" />
          {naming ? (
            <div className="flex items-center gap-1 px-1.5 py-1">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitName()}
                placeholder="Name this layout…"
                className="h-7 min-w-0 flex-1 rounded-md bg-muted/60 px-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={commitName}
                className="rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setNaming(true)}
              className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
            >
              <Plus className="size-3.5" />
              Save Current Layout As…
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Topbar({
  clinic,
  user,
  role,
  modules = ALL_MODULES_ON,
  onToggleSidebar,
}: {
  clinic: string;
  user: string;
  role: string;
  /** Clinical Modules (W1.1) — clinic-level switches; gate the Layouts card
   *  rows + the ⌘K jump-to pages. */
  modules?: ClinicalModules;
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const { patient } = useTopbar();
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
  } else if (/^\/custodian\/logs\/[^/]+$/.test(pathname)) {
    // A Custodian Logs SUB-page (e.g. platform Activity): Overview › Logs › <log>.
    const slug = pathname.split("/")[3];
    parents = [home, { href: "/custodian/logs", label: "Logs", kind: "logs" }];
    trailCurrent = {
      href: pathname,
      label: getCustodianLogSection(slug)?.title ?? "Logs",
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
              KIND_ICON[seg.kind] ??
              SETTINGS_ICON[seg.kind] ??
              LOGS_ICON[seg.kind] ??
              CONTROL_ICON[seg.kind] ??
              CUSTODIAN_LOG_ICON[seg.kind] ??
              User;

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
                <Icon
                  className={cn("size-4 shrink-0", CARD_ICON_TEXT[toneForKind(seg.kind)])}
                />
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
          {onConsult && <LayoutsMenu modules={modules} />}
          <CommandMenu modules={modules} />
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
