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
  Strikethrough,
  X,
} from "lucide-react";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { Button } from "@/components/ui/button";
import { useClickAway } from "@/lib/useClickAway";
import { cn } from "@/lib/utils";
import { editNote, strikeNote, amendNote } from "@/app/(app)/patients/actions";

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

/** A clinical note's title + colour follows the AUTHOR's role (Roland 2026-06-10). */
function noteKind(role: string | undefined): { label: string; tone: CardIconTone } {
  if (role === "nurse") return { label: "Nurse Note", tone: "success" };
  if (role === "chemist") return { label: "Pharmacy Note", tone: "warning" };
  if (role === "cunnere") return { label: "Lab Note", tone: "info" };
  if (["caretaker", "clinician", "locum", "custodian"].includes(role ?? ""))
    return { label: "Clinician Note", tone: "info" };
  return { label: "Note", tone: "neutral" };
}
const TONE_BADGE: Record<CardIconTone, string> = {
  critical: "bg-critical/10 text-critical",
  warning: "bg-warning/12 text-warning",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  neutral: "bg-slate-500/10 text-slate-600",
  brand: "bg-foreground/8 text-foreground",
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
const EDIT_WINDOW_MS = 60 * 60 * 1000;

export function ClinicalNotesFeed({
  entries,
  authors,
  currentUserId,
  patientId,
  maximized,
  onToggleMaximize,
}: {
  entries: FeedEntry[];
  authors: Record<string, Author>;
  currentUserId: string;
  patientId: string;
  maximized: boolean;
  onToggleMaximize: () => void;
}) {
  const [sortDesc, setSortDesc] = useState(false);
  const [typeF, setTypeF] = useState<Set<string>>(new Set());
  const [authF, setAuthF] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(PAGE);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amendingId, setAmendingId] = useState<string | null>(null);
  const filterRef = useClickAway<HTMLDivElement>(
    useCallback(() => setFilterOpen(false), []),
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevH = useRef(0);

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

  function toggle(set: Set<string>, key: string, fn: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    fn(next);
  }
  const filterCount = typeF.size + authF.size;

  // Server-action wrappers that also close the inline editor on success.
  async function doEdit(fd: FormData) {
    await editNote(fd);
    setEditingId(null);
  }
  async function doAmend(fd: FormData) {
    await amendNote(fd);
    setAmendingId(null);
  }
  async function doStrike(id: string, strike: boolean) {
    const fd = new FormData();
    fd.set("entry_id", id);
    fd.set("patient_id", patientId);
    fd.set("strike", String(strike));
    await strikeNote(fd);
  }

  const sentinel = moreOlder ? (
    <div ref={sentinelRef} className="py-2 text-center text-xs text-muted-foreground">
      Loading older notes…
    </div>
  ) : null;

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
        <CardIcon icon={FileText} tone="info" variant="badge" size="sm" />
        <span className="text-sm font-semibold">Clinical Notes</span>
        <span className="rounded-full bg-info/10 px-1.5 text-xs font-medium text-info tabular-nums">
          {filtered.length}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <button
            onClick={() => setSortDesc((v) => !v)}
            title={sortDesc ? "Newest first" : "Oldest first"}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
          >
            <ArrowDownUp className="size-4" />
          </button>
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              title="Filter"
              className={cn(
                "flex h-7 items-center gap-1 rounded-lg px-1.5 text-muted-foreground transition-colors hover:bg-hover hover:text-foreground",
                filterCount > 0 && "text-info",
              )}
            >
              <ListFilter className="size-4" />
              {filterCount > 0 && (
                <span className="text-xs font-medium tabular-nums">{filterCount}</span>
              )}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl border border-border bg-card p-2 shadow-float">
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
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
          >
            {maximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4">
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
              e.entry_type === "clinical_note"
                ? noteKind(author?.role)
                : { label: e.entry_type.replace(/_/g, " "), tone: "neutral" as CardIconTone };
            const mine = !!currentUserId && e.created_by === currentUserId;
            const struck = !!e.struck_at;
            const withinWindow =
              Date.now() - new Date(e.created_at).getTime() < EDIT_WINDOW_MS;
            const canEdit = mine && !struck && withinWindow;

            return (
              <article key={e.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TONE_BADGE[kind.tone]}`}
                    >
                      {kind.label}
                    </span>
                    {e.related_entry_id && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <CornerDownRight className="size-3" /> Amendment
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {fmtTime(e.created_at)}
                    {e.edited_at && <span className="ml-1 italic">· edited</span>}
                    {struck && (
                      <span className="ml-1 font-medium text-warning">· struck</span>
                    )}
                  </span>
                </div>

                {editingId === e.id ? (
                  <form action={doEdit} className="mt-2 space-y-2">
                    <input type="hidden" name="entry_id" value={e.id} />
                    <input type="hidden" name="patient_id" value={patientId} />
                    <textarea
                      name="text"
                      defaultValue={text}
                      required
                      rows={3}
                      className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm">
                        Save edit
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p
                    className={cn(
                      "mt-2 text-sm whitespace-pre-wrap",
                      struck && "text-muted-foreground line-through",
                    )}
                  >
                    {text}
                  </p>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {author?.name ?? "—"}
                  </span>
                  {mine && editingId !== e.id && (
                    <div className="flex items-center gap-0.5">
                      {canEdit && (
                        <button
                          onClick={() => setEditingId(e.id)}
                          title="Edit (within 1 hour)"
                          className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setAmendingId(amendingId === e.id ? null : e.id)}
                        title="Add amendment"
                        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                      >
                        <CornerDownRight className="size-3.5" />
                      </button>
                      <button
                        onClick={() => doStrike(e.id, !struck)}
                        title={struck ? "Remove strikethrough" : "Strike through"}
                        className={cn(
                          "flex size-6 items-center justify-center rounded-md transition-colors hover:bg-hover",
                          struck
                            ? "text-warning"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Strikethrough className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {amendingId === e.id && (
                  <form action={doAmend} className="mt-2 space-y-2 border-t border-border pt-2">
                    <input type="hidden" name="parent_id" value={e.id} />
                    <input type="hidden" name="patient_id" value={patientId} />
                    <textarea
                      name="text"
                      required
                      rows={2}
                      placeholder="Amendment…"
                      className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAmendingId(null)}
                      >
                        <X className="size-3.5" /> Cancel
                      </Button>
                      <Button type="submit" size="sm">
                        Add amendment
                      </Button>
                    </div>
                  </form>
                )}
              </article>
            );
          })
        )}
        {sortDesc && sentinel}
      </div>
    </>
  );
}
