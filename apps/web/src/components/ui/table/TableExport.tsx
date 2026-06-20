"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, FileType, Loader2 } from "lucide-react";
import { DialogHeaderRow } from "@/components/ui/DialogHeaderRow";
import { cn } from "@/lib/utils";

/**
 * TableExport — the URDS table Export control for RolDe. Opens the canonical
 * portal modal (the same chrome as every RolDe dialog) and exports the table's
 * FILTERED rows as CSV or a printable PDF — fully client-side (a clinic's data
 * never leaves the browser for an export). Two formats by Roland's spec
 * (2026-06-20: "export (csv, pdf)"); Excel/JSON + server-scoped export are a
 * future extension when RolDe grows export endpoints.
 */

export interface TableExportData {
  title: string;
  columns: { key: string; header: string }[];
  rows: Record<string, unknown>[];
}

type Format = "csv" | "pdf";

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

export function TableExport({ data, floating }: { data: TableExportData; floating?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [format, setFormat] = useState<Format>("csv");
  const [busy, setBusy] = useState(false);
  useEffect(() => setMounted(true), []);

  function downloadCsv() {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const head = data.columns.map((c) => esc(c.header)).join(",");
    const body = data.rows
      .map((r) => data.columns.map((c) => esc(cell(r[c.key]))).join(","))
      .join("\r\n");
    const blob = new Blob([`﻿${head}\r\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug(data.title)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printPdf() {
    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
    const when = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
    const head = `<tr>${data.columns.map((c) => `<th>${esc(c.header)}</th>`).join("")}</tr>`;
    const body = data.rows
      .map((r) => `<tr>${data.columns.map((c) => `<td>${esc(cell(r[c.key]))}</td>`).join("")}</tr>`)
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(data.title)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;margin:32px}
  h1{font-size:18px;margin:0 0 2px}
  .meta{color:#71717a;font-size:11px;margin:0 0 18px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{text-align:left;background:#f0efeb;border-bottom:1.5px solid #e4e2dc;padding:7px 9px;font-weight:600}
  td{padding:6px 9px;border-bottom:1px solid #ececec;vertical-align:top}
  tr:nth-child(even) td{background:#faf9f7}
  @media print{body{margin:12mm}}
</style></head><body>
  <h1>${esc(data.title)}</h1>
  <p class="meta">${data.rows.length} ${data.rows.length === 1 ? "row" : "rows"} · ${esc(when)} · RolDe OS</p>
  <table><thead>${head}</thead><tbody>${body}</tbody></table>
  <script>window.onload=function(){setTimeout(function(){window.print()},150)}</script>
</body></html>`;
    const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  async function download() {
    setBusy(true);
    try {
      if (format === "csv") downloadCsv();
      else printPdf();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

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
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-foreground/20 p-4 py-[10vh] backdrop-blur-sm"
            onClick={() => !busy && setOpen(false)}
          >
            <div className="w-full max-w-md rounded-2xl bg-card shadow-overlay" onClick={(e) => e.stopPropagation()}>
              <DialogHeaderRow
                icon={Download}
                tone="info"
                title="Export"
                subtitle={`${data.rows.length} ${data.rows.length === 1 ? "row" : "rows"} in this view`}
                onClose={() => !busy && setOpen(false)}
              />

              <div className="space-y-4 px-6 py-5">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground">Format</p>
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
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
                <button
                  onClick={() => setOpen(false)}
                  disabled={busy}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={download}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  Download
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "export";
}
