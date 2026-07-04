"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  CornerDownLeft,
  Loader2,
  User as UserIcon,
  LayoutDashboard,
  Users,
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
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ALL_MODULES_ON, type ClinicalModules } from "@/lib/clinicalModules";

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
};

/** Jump-to pages (the nav surface, mirrored into search like mindate). */
const PAGES: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/investigations", label: "Investigations", icon: FlaskConical },
  { href: "/prescribing", label: "Prescribing", icon: Pill },
  { href: "/letters", label: "Letters", icon: Mail },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/legal", label: "Legal & Safety", icon: Scale },
];

/** A flat, navigable row — either a patient hit or a page. */
type Row =
  | { kind: "patient"; id: string; href: string; label: string; sub: string }
  | { kind: "page"; id: string; href: string; label: string; icon: LucideIcon };

function fmtDob(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Highlight the matched substring in bold (mindate parity). */
function Highlighted({ text, q }: { text: string; q: string }) {
  const term = q.trim();
  if (!term) return <>{text}</>;
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-semibold text-foreground">
        {text.slice(i, i + term.length)}
      </span>
      {text.slice(i + term.length)}
    </>
  );
}

/**
 * Universal search — THE single ⌘K command palette (APPROVALS §1.4). Wired to
 * the mindate-dashboard pattern: a clean white floating panel over a BARELY-there
 * blur (never a black bar), grouped results (Patients + Pages), substring
 * highlighting, a loading spinner while patients resolve, and a keyboard-hints
 * footer. RLS-scoped, so a clinic only ever finds its own patients. The natural-
 * language / ambient-AI layer (Bible 4.7) plugs in here as Phase B/C.
 */
export function CommandMenu({
  modules = ALL_MODULES_ON,
}: {
  /** Clinical Modules (W1.1) — a module the clinic switched OFF drops its
   *  jump-to page here too (out of sight platform-wide, APPROVALS §4.2). */
  modules?: ClinicalModules;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // Hide the topbar while the palette is open (kills the grey-glass-rectangle
  // bleed-through — Roland 2026-06-11). A root data-attr drives the CSS.
  useEffect(() => {
    const el = document.documentElement;
    if (open) el.setAttribute("data-search-open", "");
    else el.removeAttribute("data-search-open");
    return () => el.removeAttribute("data-search-open");
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setPatients([]);
    setActive(0);
  }, []);

  // ⌘K / Ctrl-K to open, Esc to close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      // ONLY an open palette handles (and claims) its Escape — so layers
      // beneath (the Profile overlay) keep theirs when the palette is shut.
      if (e.key === "Escape" && open) {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  // Debounced patient search (RLS-scoped).
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 1) {
      setPatients([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("patients")
        .select("id, first_name, last_name, date_of_birth")
        .is("deleted_at", null)
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`)
        .order("last_name")
        .limit(8);
      setPatients(data ?? []);
      setLoading(false);
      setActive(0);
    }, 150);
    return () => clearTimeout(t);
  }, [q, open]);

  // Build the flat, navigable row list — patients first, then matching pages.
  const rows: Row[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    const patientRows: Row[] = patients.map((p) => ({
      kind: "patient",
      id: p.id,
      href: `/patients/${p.id}`,
      label: `${p.last_name}, ${p.first_name}`,
      sub: fmtDob(p.date_of_birth),
    }));
    const moduleOn = (href: string) =>
      href === "/prescribing"
        ? modules.prescribing_enabled
        : href === "/investigations"
          ? modules.lab_enabled || modules.radiology_enabled
          : true;
    const pageRows: Row[] = PAGES.filter((p) => moduleOn(p.href)).filter(
      (p) => !term || p.label.toLowerCase().includes(term),
    ).map((p) => ({
      kind: "page",
      id: p.href,
      href: p.href,
      label: p.label,
      icon: p.icon,
    }));
    return [...patientRows, ...pageRows];
  }, [patients, q, modules]);

  const patientRows = rows.filter((r) => r.kind === "patient");
  const pageRows = rows.filter((r) => r.kind === "page");

  function go(row: Row) {
    close();
    router.push(row.href);
  }

  const term = q.trim();

  return (
    <>
      {/* Floating search — a SOLID white chip on a drop shadow (no ring), so it
          lifts over the glass topbar like mindate's. Reads as a search BAR with
          a min-width on larger screens. */}
      <button
        onClick={() => setOpen(true)}
        className="group flex h-8 items-center gap-2 rounded-lg bg-card px-2.5 text-sm text-muted-foreground shadow-sm transition-shadow hover:shadow-md sm:min-w-[200px] md:min-w-[240px]"
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="ml-auto hidden rounded bg-muted px-1 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      {open &&
        mounted &&
        createPortal(
          // Barely-there scrim — a soft blur, NEVER a dark bar (Roland 2026-06-11).
          // PORTALED to <body> so the blur sits above EVERYTHING (incl. the
          // topbar) and nothing competes through it (Roland 2026-06-11).
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center bg-foreground/10 p-4 pt-[14vh] backdrop-blur-md"
            onClick={close}
          >
          <div
            className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-card shadow-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-2.5 border-b border-border/50 px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, rows.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  }
                  if (e.key === "Enter" && rows[active]) go(rows[active]);
                }}
                placeholder="Search patients, or jump to a page…"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {loading && (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Results */}
            <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
              {rows.length === 0 ? (
                <p className="px-2.5 py-8 text-center text-xs text-muted-foreground">
                  {term
                    ? `No matches for “${term}”.`
                    : "Search across patients — name, soon disease & date (Bible 4.7)."}
                </p>
              ) : (
                <>
                  {patientRows.length > 0 && (
                    <Group heading={`Patients (${patientRows.length})`}>
                      {patientRows.map((r) => {
                        const i = rows.indexOf(r);
                        return (
                          <RowButton
                            key={r.id}
                            active={i === active}
                            onMouseEnter={() => setActive(i)}
                            onClick={() => go(r)}
                          >
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                              <UserIcon className="size-3.5" />
                            </span>
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate font-medium">
                                <Highlighted text={r.label} q={q} />
                              </span>
                              {r.kind === "patient" && (
                                <span className="truncate text-xs text-muted-foreground">
                                  {r.sub}
                                </span>
                              )}
                            </span>
                            {i === active && (
                              <CornerDownLeft className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                            )}
                          </RowButton>
                        );
                      })}
                    </Group>
                  )}

                  {pageRows.length > 0 && (
                    <Group heading={term ? `Pages (${pageRows.length})` : "Jump to"}>
                      {pageRows.map((r) => {
                        const i = rows.indexOf(r);
                        const Icon = r.kind === "page" ? r.icon : UserIcon;
                        return (
                          <RowButton
                            key={r.id}
                            active={i === active}
                            onMouseEnter={() => setActive(i)}
                            onClick={() => go(r)}
                          >
                            <Icon className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">
                              <Highlighted text={r.label} q={q} />
                            </span>
                            {i === active && (
                              <CornerDownLeft className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                            )}
                          </RowButton>
                        );
                      })}
                    </Group>
                  )}
                </>
              )}
            </div>

            {/* Keyboard-hints footer */}
            <div className="flex items-center justify-between gap-2 border-t border-border/50 px-3 py-2 text-[10px] text-muted-foreground select-none">
              <div className="flex items-center gap-3">
                <Hint keys={["↑", "↓"]} label="Navigate" />
                <Hint keys={["↵"]} label="Open" />
              </div>
              <Hint keys={["esc"]} label="Close" />
            </div>
          </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function Group({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-1">
      <p className="px-2.5 pt-2 pb-1 text-xs font-semibold tracking-wide text-foreground uppercase">
        {heading}
      </p>
      {children}
    </div>
  );
}

function RowButton({
  active,
  onMouseEnter,
  onClick,
  children,
}: {
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
        active && "bg-hover",
      )}
    >
      {children}
    </button>
  );
}

function Hint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="inline-flex h-4 min-w-[1.1em] items-center justify-center rounded bg-muted px-1 font-mono text-[9px] leading-none"
        >
          {k}
        </kbd>
      ))}
      <span className="ml-0.5">{label}</span>
    </span>
  );
}
