"use client";

import { useState, useEffect } from "react";
import { PenLine, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardIcon } from "@/components/ui/CardIcon";
import { OrdersPanel } from "@/components/OrdersPanel";
import { AiPanel } from "@/components/AiPanel";
import {
  ClinicalNotesFeed,
  type FeedEntry,
  type Author,
} from "@/components/consultation/ClinicalNotesFeed";
import { saveNote } from "@/app/(app)/patients/actions";
import { cn } from "@/lib/utils";

type OrderEntry = { id: string; entry_type: string };

/**
 * The consultation workspace (Roland 2026-06-10, "paramount"). Three layers of
 * control, each more deliberate than the last — power without a wrecked layout:
 *
 *   1. CONTEXTUAL (automatic) — focus the composer and it grows; blur and it
 *      springs back. You never get stuck at "50% typing space".
 *   2. PRESETS (a toggle up top) — Consult / Document / Review reshape the grid.
 *   3. MANUAL (a maximise icon per card) — bounded expand/restore.
 *
 * All splits are flex-grow ratios with min-heights as guardrails and smooth
 * transitions, so every state lands somewhere calm. Choice persists per browser.
 */
const PRESETS = {
  consult: { label: "Consult", left: 0.68, right: 0.72, col: 0.52 },
  document: { label: "Document", left: 0.4, right: 0.72, col: 0.56 },
  review: { label: "Review", left: 0.82, right: 0.7, col: 0.5 },
} as const;
type Preset = keyof typeof PRESETS;
type Mode = "split" | "top" | "bottom";
const COMPOSE_LEFT = 0.42; // composer prominence while actively typing

export function ConsultationWorkspace({
  patient,
  feedEntries,
  orderEntries,
  authors,
}: {
  patient: { id: string; firstName: string };
  feedEntries: FeedEntry[];
  orderEntries: OrderEntry[];
  authors: Record<string, Author>;
}) {
  const [preset, setPreset] = useState<Preset>("consult");
  const [leftMode, setLeftMode] = useState<Mode>("split");
  const [rightMode, setRightMode] = useState<Mode>("split");
  const [composing, setComposing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("rolde:workspace") ?? "{}");
      if (s.preset && s.preset in PRESETS) setPreset(s.preset);
      if (s.leftMode) setLeftMode(s.leftMode);
      if (s.rightMode) setRightMode(s.rightMode);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready)
      localStorage.setItem(
        "rolde:workspace",
        JSON.stringify({ preset, leftMode, rightMode }),
      );
  }, [preset, leftMode, rightMode, ready]);

  const p = PRESETS[preset];
  const leftTop = composing
    ? COMPOSE_LEFT
    : leftMode === "top"
      ? 0.85
      : leftMode === "bottom"
        ? 0.22
        : p.left;
  const rightTop =
    rightMode === "top" ? 0.85 : rightMode === "bottom" ? 0.25 : p.right;
  const dur = ready ? "duration-300" : "duration-0";
  const overridden = leftMode !== "split" || rightMode !== "split";

  function choosePreset(k: Preset) {
    setPreset(k);
    setLeftMode("split");
    setRightMode("split");
  }

  const grow = (n: number) => ({ flexGrow: n * 100, flexBasis: 0 });

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-4 pt-2">
      {/* Preset toolbar (Layer 2) */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
          {(Object.keys(PRESETS) as Preset[]).map((k) => (
            <button
              key={k}
              onClick={() => choosePreset(k)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                preset === k && !overridden
                  ? "bg-foreground/8 text-foreground"
                  : "text-muted-foreground hover:bg-hover hover:text-foreground",
              )}
            >
              {PRESETS[k].label}
            </button>
          ))}
        </div>
        {overridden && (
          <button
            onClick={() => {
              setLeftMode("split");
              setRightMode("split");
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3" /> Reset layout
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        {/* Left column */}
        <div className="flex min-w-0 flex-col gap-3" style={grow(p.col)}>
          <section
            style={grow(leftTop)}
            className={cn(
              "flex min-h-[140px] flex-col overflow-hidden rounded-xl bg-card shadow-float transition-[flex-grow] ease-out",
              dur,
            )}
          >
            <ClinicalNotesFeed
              entries={feedEntries}
              authors={authors}
              maximized={leftMode === "top"}
              onToggleMaximize={() =>
                setLeftMode((m) => (m === "top" ? "split" : "top"))
              }
            />
          </section>

          <section
            style={grow(1 - leftTop)}
            className={cn(
              "flex min-h-[92px] flex-col overflow-hidden rounded-xl bg-card shadow-float transition-[flex-grow] ease-out",
              dur,
            )}
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
              <CardIcon icon={PenLine} tone="brand" variant="badge" size="sm" />
              <span className="text-sm font-semibold">New note</span>
              <button
                onClick={() =>
                  setLeftMode((m) => (m === "bottom" ? "split" : "bottom"))
                }
                title={leftMode === "bottom" ? "Restore" : "Expand"}
                className="ml-auto flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
              >
                {leftMode === "bottom" ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </button>
            </div>
            <form
              action={saveNote}
              className="flex min-h-0 flex-1 flex-col gap-2 p-4"
            >
              <input type="hidden" name="patient_id" value={patient.id} />
              <textarea
                name="text"
                required
                onFocus={() => setComposing(true)}
                onBlur={() => setComposing(false)}
                placeholder={`Note for ${patient.firstName}…`}
                className="min-h-0 w-full flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <div className="flex shrink-0 justify-end">
                <Button type="submit">Save note</Button>
              </div>
            </form>
          </section>
        </div>

        {/* Right column */}
        <div className="flex min-w-0 flex-col gap-3" style={grow(1 - p.col)}>
          <section
            style={grow(rightTop)}
            className={cn(
              "flex min-h-[140px] flex-col overflow-hidden rounded-xl bg-card pt-2.5 shadow-float transition-[flex-grow] ease-out",
              dur,
            )}
          >
            <OrdersPanel
              entries={orderEntries}
              maximized={rightMode === "top"}
              onToggleMaximize={() =>
                setRightMode((m) => (m === "top" ? "split" : "top"))
              }
            />
          </section>
          <section
            style={grow(1 - rightTop)}
            className={cn(
              "flex min-h-[92px] flex-col overflow-hidden rounded-xl bg-card pt-2.5 pb-3 shadow-float transition-[flex-grow] ease-out",
              dur,
            )}
          >
            <AiPanel />
          </section>
        </div>
      </div>
    </div>
  );
}
