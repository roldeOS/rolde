"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react";
import {
  FileText,
  ArrowDownUp,
  ListFilter,
  Maximize2,
  Minimize2,
  Check,
  Pencil,
  CornerDownRight,
  Stethoscope,
  Pill,
  FlaskConical,
  HeartPulse,
  ChevronDown,
  Mail,
} from "lucide-react";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { SectionExplainer } from "@/components/ui/SectionExplainer";
import { useClickAway } from "@/lib/useClickAway";
import { cn } from "@/lib/utils";

export type FeedEntry = {
  id: string;
  entry_type: string;
  payload: { text?: string } | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  struck_at: string | null;
  related_entry_id: string | null;
};
export type Author = { name: string; role: string };

type Icon = React.ComponentType<{ className?: string }>;
/** Letters live in the FEED, not Workup (Roland 2026-07-01) — labelled by their
 *  entry type so the type filter finds them; notes stay labelled by author role. */
const LETTER_KINDS: Record<string, string> = {
  referral_letter: "Referral Letter",
  discharge_summary: "Discharge Summary",
  sick_note: "Sick Note",
  gp_letter: "GP Letter",
};
function noteKind(
  role: string | undefined,
  entryType?: string,
): { label: string; tone: CardIconTone; icon: Icon } {
  const letter = entryType ? LETTER_KINDS[entryType] : undefined;
  if (letter) return { label: letter, tone: "accent", icon: Mail };
  if (role === "nurse") return { label: "Nurse Note", tone: "success", icon: HeartPulse };
  if (role === "chemist") return { label: "Pharmacy Note", tone: "warning", icon: Pill };
  if (role === "cunnere") return { label: "Lab Note", tone: "info", icon: FlaskConical };
  if (["caretaker", "clinician", "locum", "custodian"].includes(role ?? ""))
    return { label: "Clinician Note", tone: "info", icon: Stethoscope };
  return { label: "Note", tone: "neutral", icon: FileText };
}
const TONE_BADGE: Record<CardIconTone, string> = {
  critical: "bg-critical/10 text-critical",
  warning: "bg-warning/12 text-warning",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  accent: "bg-accent/15 text-accent",
  neutral: "bg-slate-500/10 text-slate-600",
  brand: "bg-foreground/8 text-foreground",
  rose: "bg-rose/25 text-rose-700",
  sky: "bg-sky/30 text-sky-700",
  teal: "bg-teal/30 text-teal-700",
  peach: "bg-peach/30 text-orange-700",
  periwinkle: "bg-periwinkle/30 text-indigo-600",
};

function fmtTime(ts: string) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAGE = 25;

/**
 * Clinical Notes feed (Roland 2026-06-10): verbatim entries, newest at the
 * BOTTOM, older loaded on scroll-up. A glassy sticky header (notes blur under
 * it). Notes are borderless floating tiles. Editing does NOT happen here — a
 * single pencil hands the note up to the composer (the "intelligent context
 * change"); strike/amend live there too.
 */
export function ClinicalNotesFeed({
  entries,
  authors,
  currentUserId,
  maximized,
  onToggleMaximize,
  onEditNote,
  activeId,
}: {
  entries: FeedEntry[];
  authors: Record<string, Author>;
  currentUserId: string;
  maximized: boolean;
  onToggleMaximize: () => void;
  onEditNote: (e: FeedEntry) => void;
  activeId: string | null;
}) {
  const [sortDesc, setSortDesc] = useState(false);
  const [typeF, setTypeF] = useState<Set<string>>(new Set());
  const [authF, setAuthF] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(PAGE);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedOrig, setExpandedOrig] = useState<Set<string>>(new Set());
  const filterRef = useClickAway<HTMLDivElement>(
    useCallback(() => setFilterOpen(false), []),
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevH = useRef(0);
  const atBottom = useRef(true);

  const byId = useMemo(
    () => new Map(entries.map((e) => [e.id, e])),
    [entries],
  );
  const presentTypes = useMemo(
    () => [...new Set(entries.map((e) => e.entry_type))],
    [entries],
  );
  const presentAuthors = useMemo(
    () => [...new Set(entries.map((e) => e.created_by).filter(Boolean))] as string[],
    [entries],
  );

  const filtered = useMemo(
    () =>
      entries.filter(
        (e) =>
          (typeF.size === 0 || typeF.has(e.entry_type)) &&
          (authF.size === 0 || authF.has(e.created_by ?? "")),
      ),
    [entries, typeF, authF],
  );
  const ordered = useMemo(() => {
    const a = [...filtered].sort((x, y) => (x.created_at < y.created_at ? -1 : 1));
    return sortDesc ? a.reverse() : a;
  }, [filtered, sortDesc]);

  const windowed = sortDesc
    ? ordered.slice(0, visible)
    : ordered.slice(Math.max(0, ordered.length - visible));
  const moreOlder = ordered.length > visible;

  useEffect(() => {
    if (!sortDesc && scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (scrollRef.current && prevH.current) {
      const delta = scrollRef.current.scrollHeight - prevH.current;
      if (delta > 0 && !sortDesc) scrollRef.current.scrollTop += delta;
      prevH.current = 0;
    }
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !moreOlder) return;
    const ob = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting) {
          prevH.current = scrollRef.current?.scrollHeight ?? 0;
          setVisible((v) => v + PAGE);
        }
      },
      { root: scrollRef.current },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [moreOlder]);

  // Keep the latest note in view when the card resizes (e.g. Scribe expands and
  // the feed shrinks) — if the user was at/near the bottom, re-pin (Roland #5).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || sortDesc) return;
    const ro = new ResizeObserver(() => {
      if (atBottom.current) el.scrollTop = el.scrollHeight;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [sortDesc]);

  function onScroll() {
    const el = scrollRef.current;
    if (el) atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 64;
  }

  function toggle(set: Set<string>, key: string, fn: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    fn(next);
  }
  const filterCount = typeF.size + authF.size;

  const sentinel = moreOlder ? (
    <div ref={sentinelRef} className="py-2 text-center text-xs text-muted-foreground">
      Loading older notes…
    </div>
  ) : null;

  return (
    <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto">
      {/* Glassy sticky header — notes scroll under it and blur through */}
      <div className="glass sticky top-0 z-10 flex items-center gap-2 px-4 py-2.5">
        <CardIcon icon={FileText} tone="info" variant="badge" size="sm" />
        <span className="text-sm font-semibold">Clinical Notes</span>
        <span className="rounded-md bg-info/10 px-1.5 text-xs font-medium text-info tabular-nums">
          {filtered.length}
        </span>
        <SectionExplainer
          label="Clinical Notes"
          description="The patient's record — every note, verbatim, newest at the bottom. Scroll up to load older entries."
          terms={[
            { term: "Sort", definition: "Flip between oldest-first and newest-first." },
            { term: "Filter", definition: "Narrow by note type or author." },
            { term: "Edit (pencil)", definition: "Opens your own note in Scribe — editable for 1 hour, then amend-only." },
            { term: "Expand", definition: "Give the record more room; the latest note stays in view." },
          ]}
        />
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setSortDesc((v) => !v)}
            title={sortDesc ? "Newest first" : "Oldest first"}
            className="flex size-7 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow"
          >
            <ArrowDownUp className="size-4" />
          </button>
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              title="Filter"
              className={cn(
                "flex h-7 items-center gap-1 rounded-lg bg-card px-1.5 text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow",
                filterCount > 0 && "text-info",
              )}
            >
              <ListFilter className="size-4" />
              {filterCount > 0 && (
                <span className="text-xs font-medium tabular-nums">{filterCount}</span>
              )}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl bg-card p-2 shadow-overlay">
                <p className="px-1 pb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Type
                </p>
                {presentTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggle(typeF, t, setTypeF)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm capitalize transition-colors hover:bg-hover"
                  >
                    {t.replace(/_/g, " ")}
                    {typeF.has(t) && <Check className="size-3.5 text-info" />}
                  </button>
                ))}
                <div className="my-1.5 h-px bg-border" />
                <p className="px-1 pb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Author
                </p>
                {presentAuthors.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggle(authF, a, setAuthF)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-hover"
                  >
                    {authors[a]?.name ?? "Unknown"}
                    {authF.has(a) && <Check className="size-3.5 text-info" />}
                  </button>
                ))}
                {filterCount > 0 && (
                  <button
                    onClick={() => {
                      setTypeF(new Set());
                      setAuthF(new Set());
                    }}
                    className="mt-1.5 w-full rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-hover"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onToggleMaximize}
            title={maximized ? "Restore" : "Expand"}
            className="flex size-7 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow"
          >
            {maximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2.5 px-4 pb-4 pt-1">
        {!sortDesc && sentinel}
        {windowed.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {filterCount > 0
              ? "No notes match the filter."
              : "No notes yet. The next one you save appears here."}
          </p>
        ) : (
          windowed.map((e) => {
            const text = e.payload?.text ?? "";
            const author = e.created_by ? authors[e.created_by] : undefined;
            const kind =
              e.entry_type === "clinical_note" || e.entry_type in LETTER_KINDS
                ? noteKind(author?.role, e.entry_type)
                : {
                    label: e.entry_type.replace(/_/g, " "),
                    tone: "neutral" as CardIconTone,
                    icon: FileText as Icon,
                  };
            const mine = !!currentUserId && e.created_by === currentUserId;
            const struck = !!e.struck_at;
            const orig = e.related_entry_id ? byId.get(e.related_entry_id) : undefined;
            const origOpen = expandedOrig.has(e.id);

            return (
              <article
                key={e.id}
                className={cn(
                  "rounded-xl bg-card p-3 shadow-raised transition-shadow",
                  activeId === e.id && "ring-2 ring-info/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {/* Mobile (Roland #4): icon only; the label shows from sm up. */}
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${TONE_BADGE[kind.tone]}`}
                    >
                      <kind.icon className="size-3" />
                      <span className="hidden capitalize sm:inline">{kind.label}</span>
                    </span>
                    {e.related_entry_id && (
                      <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
                        <CornerDownRight className="size-3" />
                        <span className="hidden sm:inline">Amendment</span>
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {fmtTime(e.created_at)}
                    {e.edited_at && <span className="ml-1 italic">· edited</span>}
                    {struck && (
                      <span className="ml-1 font-medium text-warning">· struck</span>
                    )}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-2 text-sm whitespace-pre-wrap",
                    struck && "text-muted-foreground line-through",
                  )}
                >
                  {text}
                </p>

                {/* Amendment shows a truncated, chevron-expandable preview of the
                    note it amends — struck through if the original was (Roland #6). */}
                {orig && (
                  <button
                    onClick={() =>
                      setExpandedOrig((s) => {
                        const n = new Set(s);
                        if (n.has(e.id)) n.delete(e.id);
                        else n.add(e.id);
                        return n;
                      })
                    }
                    className="mt-2 flex w-full items-start gap-1 rounded-lg bg-muted/50 p-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <ChevronDown
                      className={cn(
                        "mt-px size-3.5 shrink-0 transition-transform",
                        !origOpen && "-rotate-90",
                      )}
                    />
                    <span className={cn("min-w-0", orig.struck_at && "line-through")}>
                      <span className="font-medium not-italic">Amends:</span>{" "}
                      {(() => {
                        const ot = orig.payload?.text ?? "";
                        return origOpen || ot.length <= 80 ? ot : ot.slice(0, 80) + "…";
                      })()}
                    </span>
                  </button>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {author?.name ?? "—"}
                  </span>
                  {mine && (
                    <button
                      onClick={() => onEditNote(e)}
                      title="Open in composer"
                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
        {sortDesc && sentinel}
      </div>
    </div>
  );
}
