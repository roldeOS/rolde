"use client";

import { Fragment, useMemo, useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowUpDown, Check, SlidersHorizontal, Pin, CalendarRange, X as XIcon, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { WHEN_PRESETS, whenLabel, inWhenWindow } from "@/lib/time-window";
import { DialogHeaderRow } from "@/components/ui/DialogHeaderRow";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { CardHeaderRow } from "@/components/ui/CardHeaderRow";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { type CardIconTone } from "@/components/ui/CardIcon";
import { type ExplainerProps } from "@/components/ui/SectionExplainer";
import { Input } from "@/components/ui/form";
import {
  DensityToggleConnected,
  useTableDensity,
  DENSITY_CLASSES,
  type TableDensity,
} from "@/components/ui/table/TableDensityToggle";
import { PageSizeSelector } from "@/components/ui/table/PageSizeSelector";
import { NumberedPagination } from "@/components/ui/table/NumberedPagination";
import { ActivePill } from "@/components/ui/table/ActivePill";
import { TableExport } from "@/components/ui/table/TableExport";
import { type PageSize } from "@/lib/page-sizes";

/**
 * TableShell — THE canonical table chrome for RolDe (URDS table standard, ported
 * from the mindate dashboard). Bundles a header-merged toolbar (active pills +
 * Filter → modal → chips · Sort · Freeze · Density · Export), the floating table
 * container, and the bottom bar (count + page-size + numbered pagination). Each
 * table supplies only its columns via the `children` render prop, so the chrome
 * can never drift. Client-mode (a clinic's per-tenant data is small + loaded in
 * full); server pagination is a future extension when a RolDe table needs it.
 */

function densityCell(d: TableDensity): string {
  return `${DENSITY_CLASSES[d].rowPad} ${DENSITY_CLASSES[d].textSize}`;
}

export interface SortOption<T> {
  key: string;
  label: string;
  /** Comparator for DESC ordering (largest/newest first). asc flips it. */
  compare: (a: T, b: T) => number;
}

/** A declarative filter field. The caller DECLARES the field; TableShell renders
 *  the ONE canonical Filter UI (button → modal → active chips). */
export interface FilterField<T> {
  key: string;
  label: string;
  /** "select" (default) = categorical multi-select chips. "daterange" = the
   *  canonical "When" date filter (presets + custom from–to), matched against a
   *  row date via `getDate`. */
  kind?: "select" | "daterange";
  options?: { value: string; label: string; count?: number }[];
  /** The row's value(s) for a select field, matched against the selection
   *  (OR within a field, AND across fields). */
  get?: (row: T) => string | string[] | null | undefined;
  /** The row's ISO date for a daterange field. */
  getDate?: (row: T) => string | null | undefined;
}

function rowPassesFilters<T>(
  row: T,
  applied: Record<string, string[]>,
  fields: FilterField<T>[],
  nowMs: number,
): boolean {
  for (const f of fields) {
    const sel = applied[f.key];
    if (!sel || sel.length === 0) continue;
    if (f.kind === "daterange") {
      if (sel[0] && sel[0] !== "all" && !inWhenWindow(f.getDate?.(row), sel[0], nowMs)) return false;
      continue;
    }
    if (!f.get) continue;
    const raw = f.get(row);
    const vals = raw == null ? [] : Array.isArray(raw) ? raw : [raw];
    if (!vals.some((v) => sel.includes(String(v)))) return false;
  }
  return true;
}

interface RenderCtx<T> {
  rows: T[];
  startIndex: number;
  density: TableDensity;
  cellClass: string;
  freezeCount: number;
}

/** Title + (i) for TableShell to render with the toolbar on ONE row.
 *  `variant: "page"` → PageHeaderRow; `variant: "card"` → Card + CardHeaderRow. */
export interface TableHeader {
  variant: "page" | "card";
  icon: LucideIcon;
  tone: CardIconTone;
  title: string;
  description?: ReactNode;
  explainer?: ExplainerProps;
  cardClassName?: string;
  cardId?: string;
}

interface Props<T> {
  items: T[];
  header?: TableHeader;
  /** Persist density + page-size + freeze under this key (per-table). */
  storageKey: string;
  /** Noun for the count line, e.g. "people" / "services". */
  label?: string;
  sortOptions?: SortOption<T>[];
  filters?: FilterField<T>[];
  initialFilters?: Record<string, string[]>;
  filterTitle?: string;
  /** Extra controls in the toolbar left (NOT for filters). */
  filterSlot?: ReactNode;
  aboveTable?: ReactNode;
  belowTable?: ReactNode;
  /** Labels of the leftmost columns that may be frozen — shows a Freeze control. */
  freezeColumns?: string[];
  floating?: boolean;
  /** Enables Export → CSV / PDF over the FILTERED rows. */
  exportColumns?: { header: string; value: (row: T) => string | number | null | undefined }[];
  exportTitle?: string;
  /** Trailing toolbar control after Density/Export (e.g. a page-specific action). */
  toolbarTrailing?: ReactNode;
  emptyState?: ReactNode;
  defaultPageSize?: PageSize;
  children: (ctx: RenderCtx<T>) => ReactNode;
}

export function TableShell<T>({
  items,
  header,
  storageKey,
  label = "rows",
  sortOptions,
  filters,
  initialFilters,
  filterTitle,
  filterSlot,
  aboveTable,
  belowTable,
  freezeColumns,
  floating = true,
  exportColumns,
  exportTitle,
  toolbarTrailing,
  emptyState,
  defaultPageSize = 20,
  children,
}: Props<T>) {
  const { density } = useTableDensity(storageKey);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [sortKey, setSortKey] = useState<string | null>(sortOptions?.[0]?.key ?? null);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [sortTouched, setSortTouched] = useState(false);

  const [freezeCount, setFreezeCount] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = window.localStorage.getItem(`freeze:${storageKey}`);
      if (v) setFreezeCount(Math.max(0, parseInt(v, 10) || 0));
    } catch { /* ignore */ }
  }, [storageKey]);
  function changeFreeze(n: number) {
    setFreezeCount(n);
    try { window.localStorage.setItem(`freeze:${storageKey}`, String(n)); } catch { /* ignore */ }
  }

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [dataColCount, setDataColCount] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(defaultPageSize);
  const [page, setPage] = useState(1);

  const [filterOpen, setFilterOpen] = useState(false);
  const [applied, setApplied] = useState<Record<string, string[]>>(initialFilters ?? {});
  const [draft, setDraft] = useState<Record<string, string[]>>({});

  const dateKeys = useMemo(
    () => new Set((filters ?? []).filter((f) => f.kind === "daterange").map((f) => f.key)),
    [filters],
  );

  // Mobile → force 10 rows on first mount.
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) setPageSize(10 as PageSize);
  }, []);

  const activeSort = sortOptions?.find((s) => s.key === sortKey) ?? null;
  // Filter badge counts only categorical selections (the date window shows its
  // own chip + defaults to "all", so it never makes a fresh table read "1").
  const activeFilterCount = Object.entries(applied).reduce(
    (n, [k, v]) => n + (dateKeys.has(k) ? 0 : v.length),
    0,
  );
  const hasDateActive = (filters ?? []).some(
    (f) => f.kind === "daterange" && applied[f.key]?.[0] && applied[f.key][0] !== "all",
  );

  const filtered = useMemo(() => {
    if (!filters || (activeFilterCount === 0 && !hasDateActive)) return items;
    const nowMs = Date.now();
    return items.filter((row) => rowPassesFilters(row, applied, filters, nowMs));
  }, [items, filters, applied, activeFilterCount, hasDateActive]);

  const sorted = useMemo(() => {
    if (!activeSort) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => (sortDir === "desc" ? activeSort.compare(a, b) : -activeSort.compare(a, b)));
    return copy;
  }, [filtered, activeSort, sortDir]);

  useEffect(() => { setPage(1); }, [items, pageSize, sortKey, sortDir, applied]);

  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const measure = () => {
      setOverflowing(el.scrollWidth > el.clientWidth + 1);
      setDataColCount(el.querySelectorAll('thead th:not([aria-hidden="true"])').length);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [sorted, pageSize, page, density]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const slice = sorted.slice(start, start + pageSize);

  const headerTitle = header?.title;
  // A human description of WHAT this export contains — the audit PDF prints it as
  // the scope line so the reader knows exactly what they're looking at.
  const exportScope =
    activeFilterCount > 0 || hasDateActive
      ? `Filtered · ${sorted.length} of ${items.length} ${label}`
      : `All ${label} · ${sorted.length}`;
  const exportData = exportColumns
    ? {
        title: exportTitle ?? headerTitle ?? (label === "rows" ? "Export" : label),
        scope: exportScope,
        columns: exportColumns.map((c, i) => ({ key: `c${i}`, header: c.header })),
        rows: sorted.map((row) =>
          Object.fromEntries(exportColumns.map((c, i) => [`c${i}`, c.value(row) ?? ""])),
        ),
      }
    : null;

  function pickSort(key: string) {
    if (key === sortKey) {
      if (sortDir === "desc") { setSortDir("asc"); setSortTouched(true); }
      else { setSortKey(null); setSortTouched(false); }
    } else {
      setSortKey(key);
      setSortDir("desc");
      setSortTouched(true);
    }
  }
  function clearSort() { setSortKey(null); setSortTouched(false); }

  // ── Toolbar controls ────────────────────────────────────────────────────
  const toolbarControls = (
    <>
      {/* Active "When" date chip — only when a non-"all" window is set. */}
      {filters?.filter((f) => f.kind === "daterange").map((f) => {
        const val = applied[f.key]?.[0];
        if (!val || val === "all") return null;
        return (
          <button
            key={`when:${f.key}`}
            type="button"
            onClick={() => { setDraft({ ...applied }); setFilterOpen(true); }}
            className={toolbarBtnClass(floating)}
            title={`${f.label}: ${whenLabel(val)}`}
          >
            <CalendarRange className="size-3.5" />
            {whenLabel(val)}
          </button>
        );
      })}
      {/* Active categorical filter pills — one per selected value. */}
      {filters?.filter((f) => f.kind !== "daterange").flatMap((f) =>
        (applied[f.key] ?? []).map((val) => {
          const opt = f.options?.find((o) => o.value === val);
          return (
            <ActivePill
              key={`${f.key}:${val}`}
              onRemove={() => setApplied((prev) => ({ ...prev, [f.key]: (prev[f.key] ?? []).filter((v) => v !== val) }))}
            >
              {opt?.label ?? val}
            </ActivePill>
          );
        }),
      )}
      {sortTouched && activeSort && (
        <ActivePill onRemove={clearSort}>
          {activeSort.label} {sortDir === "desc" ? "↓" : "↑"}
        </ActivePill>
      )}
      {filters && filters.length > 0 && (
        <button
          type="button"
          onClick={() => { setDraft({ ...applied }); setFilterOpen(true); }}
          className={toolbarBtnClass(floating, activeFilterCount > 0 ? "bg-hover" : undefined)}
        >
          <SlidersHorizontal className="size-3.5" />
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-semibold text-background tabular-nums">
              {activeFilterCount}
            </span>
          )}
        </button>
      )}
      {sortOptions && sortOptions.length > 0 && (
        <SortMenu options={sortOptions} sortKey={sortKey} sortDir={sortDir} onPick={pickSort} onClear={clearSort} floating={floating} touched={sortTouched} />
      )}
      {(((overflowing || (freezeColumns && freezeColumns.length > 0)) && dataColCount > 1) || freezeCount > 0) && (
        <FreezeMenu
          labels={freezeColumns}
          maxCount={freezeColumns?.length ?? Math.min(Math.max(dataColCount - 1, 1), 4)}
          value={freezeCount}
          onChange={changeFreeze}
          floating={floating}
        />
      )}
      <DensityToggleConnected storageKey={storageKey} floating={floating} />
      {exportData && <TableExport data={exportData} floating={floating} />}
      {toolbarTrailing != null && <Fragment key="toolbar-trailing">{toolbarTrailing}</Fragment>}
    </>
  );

  const headerActions = (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {filterSlot}
      {toolbarControls}
    </div>
  );

  const standaloneToolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">{filterSlot}</div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">{toolbarControls}</div>
    </div>
  );

  const filterModal = filters && filters.length > 0 && filterOpen && mounted
    ? createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-foreground/20 p-4 py-[10vh] backdrop-blur-sm"
          onClick={() => setFilterOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-card shadow-overlay" onClick={(e) => e.stopPropagation()}>
            <DialogHeaderRow
              icon={SlidersHorizontal}
              tone="info"
              title={filterTitle ?? `Filter ${cap(label)}`}
              subtitle="Narrow the table to the rows you want."
              onClose={() => setFilterOpen(false)}
            />
            <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-4">
              {filters.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground">{f.label}</p>
                  {f.kind === "daterange" ? (
                    <DateRangeField
                      value={(draft[f.key] ?? [])[0]}
                      onChange={(v) => setDraft((prev) => ({ ...prev, [f.key]: [v] }))}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(f.options ?? []).map((opt) => {
                        const on = (draft[f.key] ?? []).includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setDraft((prev) => {
                              const cur = prev[f.key] ?? [];
                              return { ...prev, [f.key]: cur.includes(opt.value) ? cur.filter((v) => v !== opt.value) : [...cur, opt.value] };
                            })}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-3 h-7 text-xs transition-colors",
                              on ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:bg-hover hover:text-foreground",
                            )}
                          >
                            {opt.label}
                            {opt.count != null && <span className="opacity-60 tabular-nums">{opt.count.toLocaleString()}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border px-6 py-3">
              <button
                type="button"
                onClick={() => setDraft({})}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
              >
                <XIcon className="size-3.5" /> Clear All
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { setApplied(draft); setFilterOpen(false); }}
                  className="rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90"
                >
                  Apply{(() => { const n = Object.entries(draft).reduce((a, [k, v]) => a + (dateKeys.has(k) ? 0 : v.length), 0); return n > 0 ? ` (${n})` : ""; })()}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  const tableBody = (
    <div
      ref={tableScrollRef}
      className={cn(
        "overflow-x-auto",
        header?.variant === "card"
          ? "rounded-lg border-t border-border"
          : floating
            ? "rounded-xl bg-card shadow-float"
            : "rounded-lg border border-border",
      )}
    >
      {children({ rows: slice, startIndex: start, density, cellClass: densityCell(density), freezeCount })}
    </div>
  );

  const bottomBar = (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
      <p className="text-xs text-muted-foreground tabular-nums">
        Showing <strong className="text-foreground">{total === 0 ? 0 : start + 1}–{Math.min(start + pageSize, total)}</strong> of{" "}
        <strong className="text-foreground">{total.toLocaleString()}</strong> {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <PageSizeSelector value={pageSize} onChange={setPageSize} />
        <NumberedPagination current={safePage} total={totalPages} onNavigate={setPage} alwaysShow />
      </div>
    </div>
  );

  const coreEmpty = emptyState ?? (
    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      Nothing to show.
    </div>
  );

  // Truly-empty data → title-only (no toolbar). A filter that returns 0 from a
  // non-empty set goes through the full render so the toolbar stays to clear it.
  if (items.length === 0) {
    if (header?.variant === "page") {
      return (
        <div className="space-y-3">
          <PageHeaderRow icon={header.icon} tone={header.tone} title={header.title} explainer={header.explainer} />
          {coreEmpty}
        </div>
      );
    }
    if (header?.variant === "card") {
      return (
        <Card id={header.cardId} className={header.cardClassName}>
          <CardHeader>
            <CardHeaderRow icon={header.icon} tone={header.tone} title={header.title} description={header.description} />
          </CardHeader>
          <CardContent>{coreEmpty}</CardContent>
        </Card>
      );
    }
    return <>{coreEmpty}</>;
  }

  if (header?.variant === "page") {
    return (
      <div className="space-y-3">
        <PageHeaderRow icon={header.icon} tone={header.tone} title={header.title} explainer={header.explainer} actions={headerActions} />
        {filterModal}
        {aboveTable}
        {tableBody}
        {bottomBar}
        {belowTable}
      </div>
    );
  }

  if (header?.variant === "card") {
    return (
      <Card id={header.cardId} className={header.cardClassName}>
        <CardHeader>
          <CardHeaderRow icon={header.icon} tone={header.tone} title={header.title} description={header.description} rightSlot={headerActions} />
        </CardHeader>
        <CardContent className="space-y-2">
          {filterModal}
          {aboveTable}
          {tableBody}
          {bottomBar}
          {belowTable}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {standaloneToolbar}
      {filterModal}
      {aboveTable}
      {tableBody}
      {bottomBar}
      {belowTable}
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Toolbar control chrome — borderless + floating shadow when `floating`. */
function toolbarBtnClass(floating?: boolean, extra?: string): string {
  return cn(
    "inline-flex items-center gap-1.5 rounded-md px-2.5 h-8 text-xs font-medium transition-colors hover:bg-hover",
    floating ? "bg-background shadow-sm" : "border border-input bg-background",
    extra,
  );
}

/** The canonical "When" date filter body — presets + a custom from–to range
 *  using our themed Input (never a raw native control). */
function DateRangeField({ value, onChange }: { value: string | undefined; onChange: (v: string) => void }) {
  const v = value || "all";
  const isCustom = v.startsWith("custom:");
  const parts = isCustom ? v.split(":") : [];
  const cFrom = parts[1] || "";
  const cTo = parts[2] || "";
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {WHEN_PRESETS.map((p) => {
          const on = !isCustom && v === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              className={cn(
                "inline-flex items-center rounded-full px-3 h-7 text-xs transition-colors",
                on ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:bg-hover hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-medium text-muted-foreground">Custom Range</p>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={cFrom}
            max={cTo || undefined}
            onChange={(e) => onChange(`custom:${e.target.value}:${cTo}`)}
            aria-label="From date"
            className="flex-1 text-xs tabular-nums"
          />
          <span className="shrink-0 text-xs text-muted-foreground">→</span>
          <Input
            type="date"
            value={cTo}
            min={cFrom || undefined}
            onChange={(e) => onChange(`custom:${cFrom}:${e.target.value}`)}
            aria-label="To date"
            className="flex-1 text-xs tabular-nums"
          />
        </div>
      </div>
    </div>
  );
}

/** Local sort popover — holds local state so many tables coexist on one page. */
function SortMenu<T>({
  options, sortKey, sortDir, onPick, onClear, floating, touched,
}: {
  options: SortOption<T>[];
  sortKey: string | null;
  sortDir: "desc" | "asc";
  onPick: (key: string) => void;
  onClear: () => void;
  floating?: boolean;
  touched?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className={toolbarBtnClass(floating, touched ? "bg-hover" : undefined)}>
        <ArrowUpDown className="size-3.5" />
        Sort
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-56 rounded-xl bg-card p-1 text-sm shadow-overlay ring-1 ring-border">
          {options.map((o) => {
            const active = o.key === sortKey;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => onPick(o.key)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-hover"
              >
                <span>{o.label}</span>
                {active && <span className="text-xs text-muted-foreground">{sortDir === "desc" ? "↓ Desc" : "↑ Asc"}</span>}
              </button>
            );
          })}
          {sortKey && (
            <>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={() => { onClear(); setOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-muted-foreground hover:bg-hover"
              >
                <Check className="size-3.5 opacity-0" />
                Clear Sort
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Toolbar "Freeze" popover — pins the leftmost N columns. */
function FreezeMenu({
  labels, maxCount, value, onChange, floating,
}: {
  labels?: string[];
  maxCount: number;
  value: number;
  onChange: (n: number) => void;
  floating?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const optionLabel = (n: number) =>
    labels && labels.length >= n ? labels.slice(0, n).join(" + ") : `${n} Column${n === 1 ? "" : "s"}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title={value === 0 ? "Freeze columns" : `${value} column${value === 1 ? "" : "s"} frozen`}
        aria-label="Freeze columns"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md transition-colors hover:bg-hover",
          floating ? "bg-background shadow-sm" : "border border-input bg-background",
          value > 0 && "bg-hover text-foreground",
        )}
      >
        <Pin className="size-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-56 rounded-xl bg-card p-1 text-sm shadow-overlay ring-1 ring-border">
          <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Freeze Up To</p>
          <button
            type="button"
            onClick={() => { onChange(0); setOpen(false); }}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-hover"
          >
            <span>None</span>
            {value === 0 && <Check className="size-3.5" />}
          </button>
          {Array.from({ length: Math.max(0, maxCount) }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => { onChange(n); setOpen(false); }}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-hover"
            >
              <span>{optionLabel(n)}</span>
              {value === n && <Check className="size-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
