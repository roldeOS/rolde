"use client";

import {
  Fragment,
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
  FileDown,
  TriangleAlert,
  OctagonAlert,
  ClipboardList,
  PersonStanding,
} from "lucide-react";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { SectionExplainer } from "@/components/ui/SectionExplainer";
import { useClickAway } from "@/lib/useClickAway";
import { AnchoredPopover } from "@/components/ui/AnchoredPopover";
import { markEntrySeen } from "@/app/(app)/patients/actions";
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
/** Record changes in the timeline (the gold-mine law) — an allergy, problem or
 *  medication recorded via the Profile overlay lands here as a typed entry. */
const RECORD_KINDS: Record<string, { label: string; tone: CardIconTone; icon: Icon }> = {
  allergy_recorded: { label: "Allergy", tone: "critical", icon: TriangleAlert },
  alert_recorded: { label: "Alert", tone: "warning", icon: OctagonAlert },
  problem_recorded: { label: "Problem", tone: "peach", icon: ClipboardList },
  medication_recorded: { label: "Medication", tone: "warning", icon: Pill },
  body_map: { label: "Body Map", tone: "peach", icon: PersonStanding },
};
function noteKind(
  role: string | undefined,
  entryType?: string,
): { label: string; tone: CardIconTone; icon: Icon } {
  const record = entryType ? RECORD_KINDS[entryType] : undefined;
  if (record) return record;
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

/**
 * The episode separator (Roland 2026-07-01 — "the user knows when the current
 * admission started"). V1 anchors to TODAY (this visit's entries vs everything
 * older); it upgrades to the true admission/appointment episode when the W2
 * scheduling model lands. Rendered at the boundary in either sort order.
 */
function EpisodeMarker() {
  const label = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <div className="flex items-center gap-3 py-1" aria-label="Start of today's entries">
      <div className="h-px flex-1 bg-accent/40" />
      <span className="rounded-full bg-accent/15 px-3 py-0.5 text-xs font-medium text-accent">
        Today · {label}
      </span>
      <div className="h-px flex-1 bg-accent/40" />
    </div>
  );
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
  reads,
  maximized,
  onToggleMaximize,
  onEditNote,
  activeId,
}: {
  entries: FeedEntry[];
  authors: Record<string, Author>;
  currentUserId: string;
  /** Courier C1 — every read receipt on this patient's entries. */
  reads: { entry_id: string; user_id: string; read_at: string }[];
  maximized: boolean;
  onToggleMaximize: () => void;
  onEditNote: (e: FeedEntry) => void;
  activeId: string | null;
}) {
  const [sortDesc, setSortDesc] = useState(false);
  // Courier C1 — TEAM-level unseen (Roland 2026-07-03): a tile is "Unseen" until
  // ANY team member other than its author opens it once — then it's reviewed for
  // the whole clinic (a physio isn't nagged about a referral the GP-liaison
  // already read). The author's own click never counts as the review (writing a
  // note isn't a colleague reviewing it). Flips ONLY on a deliberate click of
  // the pill, never on scroll; every first-read is an audited receipt.
  const readsByEntry = useMemo(() => {
    const m = new Map<string, { user_id: string; read_at: string }[]>();
    for (const r of reads) {
      const list = m.get(r.entry_id) ?? [];
      list.push({ user_id: r.user_id, read_at: r.read_at });
      m.set(r.entry_id, list);
    }
    // Earliest read FIRST — index 0 is the reviewer of record (the "· first"
    // tag hangs off it), so the order must be read_at, never DB row order.
    for (const list of m.values())
      list.sort((a, b) => (a.read_at < b.read_at ? -1 : 1));
    return m;
  }, [reads]);
  const [seenNow, setSeenNow] = useState<Set<string>>(new Set());
  const isUnread = useCallback(
    (e: FeedEntry) =>
      e.created_by !== currentUserId &&
      !(readsByEntry.get(e.id) ?? []).some((r) => r.user_id !== e.created_by) &&
      !seenNow.has(e.id),
    [currentUserId, readsByEntry, seenNow],
  );
  // The STATUS TRAIL popover (v3) — replaces the eye/Read-by window. One open
  // at a time; PORTALED via AnchoredPopover (the card is overflow-hidden — an
  // in-card popover gets clipped; Roland 2026-07-04).
  const [trail, setTrail] = useState<{ id: string; el: HTMLElement } | null>(null);
  const toggleTrail = useCallback((id: string, el: HTMLElement) => {
    setTrail((t) => (t?.id === id ? null : { id, el }));
  }, []);

  const [typeF, setTypeF] = useState<Set<string>>(new Set());
  const [authF, setAuthF] = useState<Set<string>>(new Set());
  // Status filter (Roland 2026-07-03) — triage the feed by the Status Dot.
  const [statusF, setStatusF] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(PAGE);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterBtn, setFilterBtn] = useState<HTMLElement | null>(null);
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

  /** The Status Dot's key for a tile: needs_attention · in_flight · settled —
   *  drives both the pill and the Status filter (Roland 2026-07-03). */
  const statusKey = useCallback(
    (e: FeedEntry) => {
      const sendState =
        (e.payload as { status?: string } | null)?.status ??
        (e.entry_type in LETTER_KINDS ? "Not Sent" : undefined);
      if (isUnread(e)) return "needs_attention";
      if (sendState) {
        if (/not sent|draft|fail|bounce|due|overdue|review/i.test(sendState))
          return "needs_attention";
        if (/deliver|opened|read|acknowledg|done/i.test(sendState)) return "settled";
        if (/sent/i.test(sendState)) return "in_flight";
      }
      return "settled";
    },
    [isUnread],
  );

  const filtered = useMemo(
    () =>
      entries.filter(
        (e) =>
          (typeF.size === 0 || typeF.has(e.entry_type)) &&
          (authF.size === 0 || authF.has(e.created_by ?? "")) &&
          (statusF.size === 0 || statusF.has(statusKey(e))),
      ),
    [entries, typeF, authF, statusF, statusKey],
  );
  const ordered = useMemo(() => {
    const a = [...filtered].sort((x, y) => (x.created_at < y.created_at ? -1 : 1));
    return sortDesc ? a.reverse() : a;
  }, [filtered, sortDesc]);

  const windowed = sortDesc
    ? ordered.slice(0, visible)
    : ordered.slice(Math.max(0, ordered.length - visible));
  const moreOlder = ordered.length > visible;

  // Clicking the header's "N Unseen" pill jumps to the OLDEST unread entry
  // (start reading where you left off — Roland 2026-07-03). Widens the window
  // first if that entry is outside it, then scrolls smoothly to the tile.
  const jumpToUnread = useCallback(() => {
    const chron = [...ordered].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
    const target = chron.find(isUnread);
    if (!target) return;
    const idx = ordered.findIndex((x) => x.id === target.id);
    if (!sortDesc && idx < ordered.length - visible) setVisible(ordered.length - idx);
    if (sortDesc && idx >= visible) setVisible(idx + 1);
    setTimeout(() => {
      scrollRef.current
        ?.querySelector(`[data-eid="${target.id}"]`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 60);
  }, [ordered, isUnread, sortDesc, visible]);

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
  const filterCount = typeF.size + authF.size + statusF.size;

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
        {/* Courier C1 — how many entries this user hasn't read; never missable.
            Same pill size as the count (Roland 2026-07-03); clicking JUMPS the
            feed to the oldest unread entry. */}
        {entries.filter(isUnread).length > 0 && (
          <button
            onClick={jumpToUnread}
            title="Jump to the first unread entry"
            className="rounded-md bg-warning/15 px-1.5 text-xs font-medium text-warning tabular-nums transition-colors hover:bg-warning/25"
          >
            {entries.filter(isUnread).length} Unseen
          </button>
        )}
        <SectionExplainer
          label="Clinical Notes"
          description="The patient's record — every note, verbatim, newest at the bottom. Scroll up to load older entries."
          terms={[
            { term: "Sort", definition: "Flip between oldest-first and newest-first." },
            { term: "Filter", definition: "Narrow by status, note type or author." },
            { term: "Status Dot", definition: "Every tile's one status home, top-right: a pill naming the open status ending in a coloured dot. Handled tiles keep just a calm green dot — click it for the full status trail." },
            { term: "Red dot", definition: "Immediate response owed — an unacknowledged abnormal result, a failed urgent letter, an unactioned critical alert. Reserved for the truly serious." },
            { term: "Amber dot", definition: "Attention owed, not an emergency — Unread, a letter Not Sent, a review due." },
            { term: "Blue dot", definition: "In flight — sent and travelling; nothing owed by you." },
            { term: "Green dot", definition: "Settled — read, delivered or acknowledged. The information is taken care of." },
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
              ref={setFilterBtn}
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
            <AnchoredPopover
              anchor={filterBtn}
              open={filterOpen}
              onClose={() => setFilterOpen(false)}
              width={230}
              className="p-2"
            >
                <p className="px-1 pb-1 text-xs font-semibold tracking-wider text-foreground uppercase">
                  Status
                </p>
                {/* Each status option wears ITS pill + dot (Roland 2026-07-04
                    — the filter mirrors the tiles, never a bland text list). */}
                {(
                  [
                    { key: "needs_attention", label: "Needs Attention", pill: "bg-warning/15 text-warning", dot: "bg-warning" },
                    { key: "in_flight", label: "In Flight", pill: "bg-info/10 text-info", dot: "bg-info" },
                    { key: "settled", label: "Settled", pill: "bg-success/10 text-success", dot: "bg-success" },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.key}
                    onClick={() => toggle(statusF, st.key, setStatusF)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-hover"
                  >
                    <span
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                        st.pill,
                      )}
                    >
                      {st.label}
                      <span className={cn("size-[7px] rounded-full", st.dot)} />
                    </span>
                    {statusF.has(st.key) && <Check className="size-3.5 text-info" />}
                  </button>
                ))}
                <div className="my-1.5 h-px bg-border" />
                <p className="px-1 pb-1 text-xs font-semibold tracking-wider text-foreground uppercase">
                  Type
                </p>
                {/* Type options wear the SAME tone pills their tiles wear
                    (Roland 2026-07-04 — every filter option is a pill). */}
                {presentTypes.map((t) => {
                  const meta =
                    RECORD_KINDS[t] ??
                    (t in LETTER_KINDS
                      ? { label: LETTER_KINDS[t], tone: "accent" as CardIconTone, icon: Mail }
                      : t === "clinical_note"
                        ? { label: "Clinical Note", tone: "info" as CardIconTone, icon: Stethoscope }
                        : { label: t.replace(/_/g, " "), tone: "neutral" as CardIconTone, icon: FileText });
                  return (
                    <button
                      key={t}
                      onClick={() => toggle(typeF, t, setTypeF)}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm capitalize transition-colors hover:bg-hover"
                    >
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold",
                          TONE_BADGE[meta.tone],
                        )}
                      >
                        <meta.icon className="size-3" />
                        {meta.label}
                      </span>
                      {typeF.has(t) && <Check className="size-3.5 text-info" />}
                    </button>
                  );
                })}
                <div className="my-1.5 h-px bg-border" />
                <p className="px-1 pb-1 text-xs font-semibold tracking-wider text-foreground uppercase">
                  Author
                </p>
                {/* Authors wear their ROLE's tone (the tile pill palette). */}
                {presentAuthors.map((a) => {
                  const roleMeta = noteKind(authors[a]?.role);
                  return (
                    <button
                      key={a}
                      onClick={() => toggle(authF, a, setAuthF)}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-hover"
                    >
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-xs font-semibold",
                          TONE_BADGE[roleMeta.tone],
                        )}
                      >
                        {authors[a]?.name ?? "Unknown"}
                      </span>
                      {authF.has(a) && <Check className="size-3.5 text-info" />}
                    </button>
                  );
                })}
                {filterCount > 0 && (
                  <button
                    onClick={() => {
                      setTypeF(new Set());
                      setAuthF(new Set());
                      setStatusF(new Set());
                    }}
                    className="mt-1.5 w-full rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-hover"
                  >
                    Clear Filters
                  </button>
                )}
            </AnchoredPopover>
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
          windowed.map((e, idx) => {
            const text = e.payload?.text ?? "";
            const author = e.created_by ? authors[e.created_by] : undefined;

            // The episode boundary — where "today" meets "older" in the current
            // sort order (asc: before the first today-entry; desc: before the
            // first older-entry that follows a today-entry). Rendered once.
            const todayStr = new Date().toDateString();
            const entryToday = new Date(e.created_at).toDateString() === todayStr;
            const prev = idx > 0 ? windowed[idx - 1] : undefined;
            const prevToday = prev
              ? new Date(prev.created_at).toDateString() === todayStr
              : undefined;
            const showMarker = !sortDesc
              ? entryToday && (idx === 0 || prevToday === false)
              : !entryToday && prevToday === true;
            const kind =
              e.entry_type === "clinical_note" ||
              e.entry_type in LETTER_KINDS ||
              e.entry_type in RECORD_KINDS
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

            const isLetter = e.entry_type in LETTER_KINDS;
            const unread = isUnread(e);
            const justSeen = seenNow.has(e.id);

            /* The STATUS DOT (Roland 2026-07-03, Feed Tile v3) — ONE contextual
               slot, top-right. Precedence: Unread (amber — attention owed) →
               the send/action state carried in payload.status (Courier trail
               palette: Not Sent amber · Failed critical · Sent info; "due/
               review" reads amber) → Read ✓ just after the flip → handled =
               dot only. RED is reserved for immediate clinical action. */
            const sendState =
              (e.payload as { status?: string } | null)?.status ??
              (isLetter ? "Not Sent" : undefined);
            const settledSend =
              !sendState || /deliver|opened|read|acknowledg|done/i.test(sendState);
            const tileStatus = unread
              ? {
                  text: "Unread",
                  pillCls: "bg-warning/15 text-warning hover:bg-warning/25",
                  dotCls: "bg-warning",
                }
              : sendState && !settledSend
                ? /fail|bounce|revok/i.test(sendState)
                  ? {
                      text: sendState,
                      pillCls: "bg-critical/10 text-critical hover:bg-critical/15",
                      dotCls: "bg-critical",
                    }
                  : /not sent|draft|due|overdue|review/i.test(sendState)
                    ? {
                        text: sendState,
                        pillCls: "bg-warning/15 text-warning hover:bg-warning/25",
                        dotCls: "bg-warning",
                      }
                    : {
                        text: sendState,
                        pillCls: "bg-info/10 text-info hover:bg-info/15",
                        dotCls: "bg-info",
                      }
                : justSeen
                  ? {
                      text: "Read ✓",
                      pillCls: "bg-success/10 text-success hover:bg-success/15",
                      dotCls: "bg-success",
                    }
                  : { text: "", pillCls: "", dotCls: "" };

            /** The tile's status history, oldest first — Written · Read (the
             *  recorder) · edits/strikes · the send state. C3 appends real
             *  Sent/Delivered/Opened events to this same list. */
            const trailFor = (entry: FeedEntry) => {
              const rows: { label: string; who?: string; when?: string; dot: string }[] = [
                {
                  label: "Written",
                  who: authors[entry.created_by ?? ""]?.name ?? "—",
                  when: fmtTime(entry.created_at),
                  dot: "bg-foreground/30",
                },
              ];
              if (entry.edited_at)
                rows.push({ label: "Edited", when: fmtTime(entry.edited_at), dot: "bg-foreground/30" });
              if (entry.struck_at)
                rows.push({ label: "Struck Through", when: fmtTime(entry.struck_at), dot: "bg-warning" });
              const firstRead = (readsByEntry.get(entry.id) ?? []).find(
                (r) => r.user_id !== entry.created_by,
              );
              if (firstRead)
                rows.push({
                  label: "Read",
                  who: authors[firstRead.user_id]?.name ?? "A team member",
                  when: fmtTime(firstRead.read_at),
                  dot: "bg-success",
                });
              else if (seenNow.has(entry.id))
                rows.push({ label: "Read", who: "You", when: "Just now", dot: "bg-success" });
              if (sendState)
                rows.push({
                  label: sendState,
                  dot: settledSend
                    ? "bg-success"
                    : /fail|bounce/i.test(sendState)
                      ? "bg-critical"
                      : /sent/i.test(sendState)
                        ? "bg-info"
                        : "bg-warning",
                });
              return rows;
            };

            return (
              <Fragment key={e.id}>
              {showMarker && <EpisodeMarker />}
              <article
                data-eid={e.id}
                className={cn(
                  "rounded-xl bg-card p-3 shadow-raised transition-shadow",
                  unread && "ring-1 ring-warning/40",
                  activeId === e.id && "ring-2 ring-info/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {/* Mobile (Roland #4): icon only; the label shows from sm up. */}
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold ${TONE_BADGE[kind.tone]}`}
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
                  {/* TOP-RIGHT — the STATUS DOT (Roland's design, 2026-07-03,
                      Feed Tile v3): ONE contextual status slot — a pill naming
                      the open status, ending in a traffic-light dot. Unread =
                      amber (attention); red is RESERVED for immediate clinical
                      action; handled = the words leave, a calm muted dot stays.
                      Clicking Unread records the reader (once, audited); any
                      other click opens the STATUS TRAIL. */}
                  <div className="relative flex shrink-0 items-center gap-1 text-xs">
                    {tileStatus.text ? (
                      <button
                        onClick={(ev) => {
                          if (unread) {
                            setSeenNow((sn) => new Set(sn).add(e.id));
                            void markEntrySeen(e.id);
                          } else {
                            toggleTrail(e.id, ev.currentTarget);
                          }
                        }}
                        title={unread ? "Mark as read (recorded)" : "The status trail"}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold transition-colors",
                          tileStatus.pillCls,
                        )}
                      >
                        {tileStatus.text}
                        <span className={cn("size-[7px] rounded-full", tileStatus.dotCls)} />
                      </button>
                    ) : (
                      <button
                        onClick={(ev) => toggleTrail(e.id, ev.currentTarget)}
                        title="Handled — click for the status trail"
                        className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-hover"
                      >
                        <span className="size-2 rounded-full bg-success/55" />
                      </button>
                    )}
                    {/* The STATUS TRAIL — every status this tile has worn, in
                        order (Courier C3's live journey extends this). PORTALED
                        (AnchoredPopover) — the card clips in-card popovers. */}
                    <AnchoredPopover
                      anchor={trail?.id === e.id ? trail.el : null}
                      open={trail?.id === e.id}
                      onClose={() => setTrail(null)}
                      width={288}
                      className="p-3"
                    >
                        <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Status Trail</p>
                        <ul className="space-y-1.5">
                          {trailFor(e).map((t, i) => (
                            <li key={i} className="text-xs">
                              <p className="flex flex-wrap items-center gap-1.5">
                                <span className={cn("size-1.5 shrink-0 rounded-full", t.dot)} />
                                <span className="font-medium text-foreground">{t.label}</span>
                                {t.who && (
                                  <span className="text-muted-foreground">— {t.who}</span>
                                )}
                              </p>
                              {t.when && (
                                <p className="pl-3 text-muted-foreground">{t.when}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                    </AnchoredPopover>
                  </div>
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
                {/* Footer — the URDS Feed Tile anatomy (Roland 2026-07-02): author
                    LEFT · time+date BOTTOM-CENTRE · status pill + actions RIGHT. */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {author?.name ?? "—"}
                  </span>
                  <span className="shrink-0 text-center text-xs text-muted-foreground">
                    {fmtTime(e.created_at)}
                    {e.edited_at && <span className="ml-1 italic">· edited</span>}
                    {struck && (
                      <span className="ml-1 font-medium text-warning">· struck</span>
                    )}
                  </span>
                  <span className="flex flex-1 items-center justify-end gap-1">
                    {isLetter && (
                      <a
                        href={`/api/letters/${e.id}/pdf`}
                        target="_blank"
                        rel="noopener"
                        title="Open the official PDF"
                        className="flex h-6 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                      >
                        <FileDown className="size-3.5" />
                        PDF
                      </a>
                    )}
                    {mine && (
                      <button
                        onClick={() => onEditNote(e)}
                        title="Open in composer"
                        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    )}
                  </span>
                </div>
              </article>
              </Fragment>
            );
          })
        )}
        {sortDesc && sentinel}
      </div>
    </div>
  );
}
