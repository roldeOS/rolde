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

  // Generate a real, downloadable PDF (no popup / print dialog — a file lands in
  // Downloads, like the CSV). jsPDF + autoTable are lazy-imported only on demand,
  // so they never weigh on page load. Branded to RolDe: parchment header, a gold
  // accent rule, the RolDe OS stamp.
  async function downloadPdf() {
    const [{ jsPDF }, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const autoTable = autoTableMod.default;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const when = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(24, 24, 27);
    doc.text(data.title, 40, 44);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122);
    doc.text(`${data.rows.length} ${data.rows.length === 1 ? "row" : "rows"} · ${when} · RolDe OS`, 40, 60);
    doc.setDrawColor(212, 168, 67); // honey-gold accent rule
    doc.setLineWidth(1.4);
    doc.line(40, 68, 150, 68);

    autoTable(doc, {
      startY: 82,
      head: [data.columns.map((c) => c.header)],
      body: data.rows.map((r) => data.columns.map((c) => cell(r[c.key]))),
      styles: { fontSize: 8, cellPadding: 5, textColor: [24, 24, 27], lineColor: [236, 236, 236], lineWidth: 0.5, overflow: "linebreak" },
      headStyles: { fillColor: [240, 239, 235], textColor: [24, 24, 27], fontStyle: "bold", lineColor: [228, 226, 220], lineWidth: 0.6 },
      alternateRowStyles: { fillColor: [250, 249, 247] },
      margin: { left: 40, right: 40 },
    });

    doc.save(`${slug(data.title)}.pdf`);
  }

  async function download() {
    setBusy(true);
    try {
      if (format === "csv") downloadCsv();
      else await downloadPdf();
      setOpen(false);
    } catch {
      /* a failed export shouldn't wedge the modal */
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
