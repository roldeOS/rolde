"use client";

import { Fragment, useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DataTable — the URDS "Table" template (ported from the mindate dashboard).
 *
 * Backed by column-sizing research (MDN / Tailwind / Primer / MUI X / AG Grid /
 * TanStack):
 *   - `table-fixed w-full` inside `overflow-x-auto`. Fixed layout is the only mode
 *     where ellipsis truncation works + widths never wander.
 *   - Widths declared once via <colgroup>: small/known → fixed rem; flexible text
 *     → a capped percentage.
 *   - `truncate` columns ellipsis + reveal the full value via a native title.
 *   - `freezeCount` pins the leading N data columns on horizontal scroll.
 *
 * Lightweight semantic HTML — NOT a data-grid library. Cells + headers are render
 * functions so real tables (sort headers, pills, status clusters, action menus)
 * compose cleanly.
 */

export interface DataTableColumn<Row> {
  id: string;
  header: ReactNode;
  /** CSS width under table-fixed: fixed rem for known cols, a % for flexible text. */
  width: string;
  align?: "left" | "right" | "center";
  /** Ellipsis-truncate + reveal the full value on hover. */
  truncate?: boolean;
  /** Allow wrapping (default cells are nowrap). Mutually exclusive with truncate. */
  wrap?: boolean;
  /** The full string for the truncate tooltip (title attr). */
  title?: (row: Row) => string | undefined;
  cell: (row: Row, index: number) => ReactNode;
  cellClassName?: string;
  headerClassName?: string;
  /** Don't trigger the row click when this cell is clicked (e.g. an action menu). */
  stopRowClick?: boolean;
  onCellClick?: (row: Row, e: React.MouseEvent) => void;
}

interface DensityClasses {
  rowPad: string;
  headerPad: string;
  textSize: string;
}

interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  density: DensityClasses;
  onRowClick?: (row: Row) => void;
  onRowMouseEnter?: (row: Row) => void;
  /** Extra classes per row (e.g. `opacity-70` for a paused row). */
  rowClassName?: (row: Row) => string | undefined;
  /** Make rows expandable — prepends a disclosure column + renders this beneath. */
  renderExpanded?: (row: Row) => ReactNode;
  expandHint?: string;
  empty?: ReactNode;
  minWidth?: string;
  /** Render ONLY the <table> — no outer shell. For use inside TableShell. */
  bare?: boolean;
  layout?: "fixed" | "auto";
  /** Freeze (pin) the first N DATA columns to the left edge while the rest scroll. */
  freezeCount?: number;
  /** Prepend a row-number (#) column. `rowNumberStart` keeps numbers absolute. */
  rowNumbers?: boolean;
  rowNumberStart?: number;
}

function alignClass(align?: "left" | "right" | "center"): string {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  density,
  onRowClick,
  onRowMouseEnter,
  rowClassName,
  renderExpanded,
  expandHint,
  empty,
  minWidth = "48rem",
  bare = false,
  layout = "fixed",
  freezeCount = 0,
  rowNumbers = true,
  rowNumberStart = 0,
}: DataTableProps<Row>) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const expandable = !!renderExpanded;

  // Optional leading row-number column. MEMOISED — a fresh array each render
  // would retrigger the freeze-measure effect that depends on it → loop.
  const cols: DataTableColumn<Row>[] = useMemo(
    () =>
      rowNumbers
        ? [
            {
              id: "_rownum",
              header: "#",
              width: "3rem",
              cellClassName: "tabular-nums text-muted-foreground text-xs",
              cell: (_row: Row, i: number) => rowNumberStart + i + 1,
            },
            ...columns,
          ]
        : columns,
    [rowNumbers, rowNumberStart, columns],
  );

  const totalCols = cols.length + (expandable ? 1 : 0);

  // ── Freeze (sticky left columns) ──────────────────────────────────────
  const frozenLeading = freezeCount > 0 ? freezeCount + (expandable ? 1 : 0) + (rowNumbers ? 1 : 0) : 0;
  const headRowRef = useRef<HTMLTableRowElement>(null);
  const [leftOffsets, setLeftOffsets] = useState<number[]>([]);

  useEffect(() => {
    if (frozenLeading === 0 || !headRowRef.current) {
      setLeftOffsets([]);
      return;
    }
    const el = headRowRef.current;
    const measure = () => {
      const cells = Array.from(el.children) as HTMLElement[];
      const offs: number[] = [];
      let acc = 0;
      for (let i = 0; i < frozenLeading && i < cells.length; i++) {
        offs[i] = acc;
        acc += cells[i].getBoundingClientRect().width;
      }
      setLeftOffsets(offs);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [frozenLeading, columns, rowNumbers, rows.length, density]);

  function frozenStyle(hi: number): React.CSSProperties | undefined {
    if (hi >= frozenLeading) return undefined;
    return { position: "sticky", left: leftOffsets[hi] ?? 0, zIndex: 2 };
  }
  const lastFrozen = frozenLeading - 1;

  const table = (
    <table
      className={cn(layout === "auto" ? "table-auto w-full" : "table-fixed w-full", density.textSize)}
      style={{ minWidth }}
    >
      <colgroup>
        {expandable && <col style={{ width: "2.25rem" }} />}
        {cols.map((c) => (
          <col key={c.id} style={{ width: c.width }} />
        ))}
      </colgroup>
      <thead className="border-b border-border bg-hover">
        <tr ref={headRowRef} className="text-left text-foreground">
          {expandable && (
            <th
              aria-hidden="true"
              style={frozenStyle(0)}
              className={cn("font-semibold", density.rowPad, frozenLeading > 0 && "bg-muted", 0 === lastFrozen && "border-r border-border")}
            />
          )}
          {cols.map((c, i) => {
            const hi = i + (expandable ? 1 : 0);
            const frozen = hi < frozenLeading;
            return (
              <th
                key={c.id}
                style={frozenStyle(hi)}
                className={cn(
                  "font-semibold",
                  alignClass(c.align),
                  density.rowPad,
                  c.headerClassName,
                  frozen && "bg-muted",
                  frozen && hi === lastFrozen && "border-r border-border",
                )}
              >
                {c.header}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={totalCols} className="px-3 py-12 text-center text-sm text-muted-foreground">
              {empty ?? "No results."}
            </td>
          </tr>
        ) : (
          rows.map((row, rowIndex) => {
            const key = rowKey(row);
            const isOpen = expandable && expandedKey === key;
            const clickToToggle = expandable;
            return (
              <Fragment key={key}>
                <tr
                  {...(clickToToggle
                    ? {
                        onClick: () => setExpandedKey((cur) => (cur === key ? null : key)),
                        "aria-expanded": isOpen,
                        title: expandHint,
                      }
                    : onRowClick
                      ? {
                          role: "link",
                          tabIndex: 0,
                          onClick: () => onRowClick(row),
                          onKeyDown: (e: React.KeyboardEvent) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          },
                        }
                      : {})}
                  onMouseEnter={onRowMouseEnter ? () => onRowMouseEnter(row) : undefined}
                  className={cn(
                    "group border-b border-border last:border-0 transition-colors",
                    (onRowClick || clickToToggle) && "cursor-pointer outline-none focus-visible:bg-muted/40",
                    isOpen ? "bg-muted/30" : (onRowClick || clickToToggle) && "hover:bg-hover",
                    rowClassName?.(row),
                  )}
                >
                  {expandable && (
                    <td
                      style={frozenStyle(0)}
                      className={cn(
                        "align-top",
                        density.rowPad,
                        frozenLeading > 0 && (isOpen ? "bg-muted/30" : "bg-card group-hover:bg-hover"),
                        0 === lastFrozen && "border-r border-border",
                      )}
                    >
                      <ChevronRight
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-muted-foreground"
                        style={{ rotate: isOpen ? "90deg" : "0deg", transition: "rotate 150ms ease" }}
                      />
                    </td>
                  )}
                  {cols.map((c, i) => {
                    const hi = i + (expandable ? 1 : 0);
                    const frozen = hi < frozenLeading;
                    return (
                      <td
                        key={c.id}
                        style={frozenStyle(hi)}
                        className={cn(
                          c.wrap ? "whitespace-normal" : "whitespace-nowrap",
                          alignClass(c.align),
                          c.truncate && "truncate",
                          density.rowPad,
                          c.cellClassName,
                          frozen && (isOpen ? "bg-muted/30" : "bg-card group-hover:bg-hover"),
                          frozen && hi === lastFrozen && "border-r border-border",
                        )}
                        title={c.truncate ? c.title?.(row) : undefined}
                        onClick={
                          c.stopRowClick || c.onCellClick
                            ? (e) => {
                                if (c.stopRowClick) e.stopPropagation();
                                c.onCellClick?.(row, e);
                              }
                            : undefined
                        }
                      >
                        {c.cell(row, rowIndex)}
                      </td>
                    );
                  })}
                </tr>
                {isOpen && (
                  <tr className="bg-muted/20">
                    <td colSpan={totalCols} className="px-3 pb-4 pt-1">
                      {renderExpanded!(row)}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })
        )}
      </tbody>
    </table>
  );

  if (bare) return table;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">{table}</div>
    </div>
  );
}
