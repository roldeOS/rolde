"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Download, FileText, FileType, FileClock, Loader2 } from "lucide-react";
import { DialogHeaderRow } from "@/components/ui/DialogHeaderRow";
import { cn } from "@/lib/utils";

/**
 * TableExport — the URDS table Export control for RolDe. Opens the canonical
 * portal modal and exports the table's FILTERED rows as CSV (client-side) or an
 * audit-grade PDF (the URDS PDF Kit, rendered server-side — it adds the clinic
 * logo, the exporter's identity, an export reference + SHA-256 fingerprint).
 *
 * Pass 2 (Roland 2026-06-21): a column picker (tune exactly which columns go),
 * an orientation toggle, and a LIVE preview of the PDF — rendered from a small
 * sample of rows and fit-to-page — so you never export the wrong shape.
 */

export interface TableExportData {
  title: string;
  /** A short description of what's included (filters/sort/count) for the PDF. */
  scope?: string;
  columns: { key: string; header: string; w?: number; align?: "left" | "right" }[];
  rows: Record<string, unknown>[];
}

type Format = "csv" | "pdf";
type Orientation = "landscape" | "portrait";

/** The live preview renders only a sample — fast, and enough to judge layout. */
const PREVIEW_ROWS = 60;

const FORMATS: { value: Format; label: string; icon: React.ComponentType<{ className?: string }>; hint: string }[] = [
  { value: "csv", label: "CSV", icon: FileText, hint: "Opens in Excel / Sheets" },
  { value: "pdf", label: "PDF", icon: FileType, hint: "A printable report" },
];

function cell(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

function toolbarBtn(floating?: boolean): string {
  return cn(
    "inline-flex items-center gap-1.5 rounded-md px-2.5 h-8 text-xs font-medium transition-colors hover:bg-hover",
    floating ? "bg-background shadow-sm" : "border border-input bg-background",
  );
}

export function TableExport({
  data,
  floating,
}: {
  data: TableExportData;
  floating?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [format, setFormat] = useState<Format>("csv");
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(data.columns.map((c) => c.key)));
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  useEffect(() => setMounted(true), []);

  // Keep the selection in step if the table's column set changes underneath us.
  useEffect(() => {
    setSelected((prev) => {
      const keys = data.columns.map((c) => c.key);
      const next = new Set(keys.filter((k) => prev.has(k)));
      return next.size === 0 ? new Set(keys) : next;
    });
  }, [data.columns]);

  // The columns to export, in the table's own order, honouring the picker.
  const activeColumns = useMemo(
    () => data.columns.filter((c) => selected.has(c.key)),
    [data.columns, selected],
  );
  const selectedSig = activeColumns.map((c) => c.key).join(",");
  const allSelected = selected.size === data.columns.length;

  const rowFor = useCallback(
    (cols: { key: string }[]) => (r: Record<string, unknown>) =>
      Object.fromEntries(cols.map((c) => [c.key, cell(r[c.key])])),
    [],
  );

  function setPreview(url: string | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }

  function toggleColumn(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev; // never export zero columns
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  // Both formats are rendered + AUDITED SERVER-SIDE by the URDS PDF Kit. The server
  // owns the identity (clinic logo · exporter name + role · export reference ·
  // SHA-256 fingerprint) and records the export WITH its artifact in the Export Log
  // — CSV exactly like PDF (data leaving the building is data leaving the building).
  // The client posts what it's looking at, with the chosen columns + orientation.
  async function requestExport(
    fmt: Format,
    rows: Record<string, unknown>[],
    opts: { signal?: AbortSignal; preview?: boolean } = {},
  ): Promise<Blob> {
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: opts.signal,
      body: JSON.stringify({
        format: fmt,
        title: data.title,
        scope: data.scope,
        orientation,
        columns: activeColumns,
        rows: rows.map(rowFor(activeColumns)),
        preview: opts.preview ?? false,
      }),
    });
    if (!res.ok) throw new Error("export failed");
    return res.blob();
  }

  function saveBlob(blob: Blob, ext: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug(data.title)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function download() {
    setBusy(true);
    try {
      const blob = await requestExport(format, data.rows);
      saveBlob(blob, format);
      setOpen(false);
    } catch {
      /* a failed export shouldn't wedge the modal */
    } finally {
      setBusy(false);
    }
  }

  // ── Live PDF preview — debounced; re-renders a row sample whenever the columns
  //    or orientation change. Only while the modal is open AND PDF is chosen. ──
  useEffect(() => {
    if (!open || format !== "pdf" || activeColumns.length === 0) {
      setPreviewBusy(false);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    setPreviewBusy(true);
    const t = setTimeout(async () => {
      try {
        const blob = await requestExport("pdf", data.rows.slice(0, PREVIEW_ROWS), {
          signal: controller.signal,
          preview: true,
        });
        if (cancelled) return;
        setPreview(URL.createObjectURL(blob));
      } catch {
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setPreviewBusy(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, format, orientation, selectedSig]);

  // Tidy the preview blob URL when the modal closes or we switch back to CSV.
  useEffect(() => {
    if (!open || format !== "pdf") setPreview(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, format]);
  useEffect(() => () => setPreview(null), []);

  const isPdf = format === "pdf";
  const sampled = data.rows.length > PREVIEW_ROWS;
  const tightFit = orientation === "portrait" && activeColumns.length > 6;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={toolbarBtn(floating)}>
        <Download className="size-3.5" />
        Export
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-foreground/20 p-4 py-[8vh] backdrop-blur-sm"
            onClick={() => !busy && setOpen(false)}
          >
            <div
              className={cn(
                "w-full rounded-2xl bg-card shadow-overlay transition-[max-width] duration-200",
                isPdf ? "max-w-4xl" : "max-w-md",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <DialogHeaderRow
                icon={Download}
                tone="info"
                title="Export"
                subtitle={`${data.rows.length} ${data.rows.length === 1 ? "row" : "rows"} in this view`}
                onClose={() => !busy && setOpen(false)}
              />

              <div className="space-y-5 px-6 py-5">
                {/* Format */}
                <Field label="Format">
                  <div className="grid grid-cols-2 gap-2">
                    {FORMATS.map((f) => {
                      const Icon = f.icon;
                      const active = format === f.value;
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => setFormat(f.value)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1 rounded-lg h-[4.5rem] text-xs font-medium transition-colors",
                            active
                              ? "bg-selected text-foreground ring-1 ring-border"
                              : "bg-muted/50 text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <Icon className="size-4" />
                          {f.label}
                          <span className="text-[10px] font-normal opacity-70">{f.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {isPdf ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-[15rem_1fr]">
                    {/* Controls */}
                    <div className="space-y-5">
                      <Field label="Orientation">
                        <div className="grid grid-cols-2 gap-2">
                          {(["landscape", "portrait"] as const).map((o) => (
                            <button
                              key={o}
                              type="button"
                              onClick={() => setOrientation(o)}
                              className={cn(
                                "rounded-lg h-8 text-xs font-medium capitalize transition-colors",
                                orientation === o
                                  ? "bg-selected text-foreground ring-1 ring-border"
                                  : "bg-muted/50 text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      </Field>

                      <ColumnPicker
                        columns={data.columns}
                        selected={selected}
                        allSelected={allSelected}
                        onToggle={toggleColumn}
                        onSelectAll={() => setSelected(new Set(data.columns.map((c) => c.key)))}
                      />
                    </div>

                    {/* Live preview */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-foreground">Preview</p>
                        <p className="text-[10px] text-muted-foreground">
                          {sampled ? `First ${PREVIEW_ROWS} of ${data.rows.length} rows` : "Live"}
                        </p>
                      </div>
                      <div
                        className="relative w-full overflow-hidden rounded-lg border border-border bg-neutral-700"
                        style={{ height: 360 }}
                      >
                        {previewUrl ? (
                          <iframe
                            key={orientation}
                            title="PDF preview"
                            src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                            className="size-full"
                          />
                        ) : (
                          !previewBusy && (
                            <div className="flex size-full items-center justify-center px-4 text-center text-xs text-white/70">
                              Pick at least one column to preview.
                            </div>
                          )
                        )}
                        {previewBusy && (
                          <div className="absolute inset-0 flex items-center justify-center bg-neutral-700/60 backdrop-blur-[1px]">
                            <Loader2 className="size-5 animate-spin text-white/80" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] leading-relaxed text-muted-foreground">
                        {tightFit
                          ? "Lots of columns for portrait — Landscape fits more across before text wraps."
                          : "Columns scale to fill the page width; long values wrap rather than clip."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <ColumnPicker
                    columns={data.columns}
                    selected={selected}
                    allSelected={allSelected}
                    onToggle={toggleColumn}
                    onSelectAll={() => setSelected(new Set(data.columns.map((c) => c.key)))}
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border px-6 py-4">
                <Link
                  href="/settings/exports"
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                >
                  <FileClock className="size-3.5" /> Export Log
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    disabled={busy}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={download}
                    disabled={busy || activeColumns.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                    Download {format.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      {children}
    </div>
  );
}

function ColumnPicker({
  columns,
  selected,
  allSelected,
  onToggle,
  onSelectAll,
}: {
  columns: { key: string; header: string }[];
  selected: Set<string>;
  allSelected: boolean;
  onToggle: (key: string) => void;
  onSelectAll: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Columns</p>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-muted-foreground">
            {selected.size} of {columns.length}
          </span>
          {!allSelected && (
            <button
              type="button"
              onClick={onSelectAll}
              className="font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              Select all
            </button>
          )}
        </div>
      </div>
      <div className="max-h-[15rem] space-y-0.5 overflow-y-auto rounded-lg border border-border bg-muted/30 p-1.5">
        {columns.map((c) => {
          const on = selected.has(c.key);
          const last = on && selected.size <= 1;
          return (
            <label
              key={c.key}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-hover",
                last && "cursor-not-allowed",
              )}
            >
              <input
                type="checkbox"
                checked={on}
                disabled={last}
                onChange={() => onToggle(c.key)}
                className="size-3.5 rounded"
                style={{ accentColor: "var(--foreground, #18181b)" }}
              />
              <span className={cn("truncate", on ? "text-foreground" : "text-muted-foreground")}>{c.header}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "export";
}
