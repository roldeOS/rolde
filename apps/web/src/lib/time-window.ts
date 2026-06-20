/**
 * The canonical "When" date-window filter (URDS table standard, ported from the
 * mindate dashboard).
 *
 * ONE way for every time-based table to scope by date — a `daterange` FilterField
 * rendered INSIDE the standard TableShell Filter button (presets + a custom
 * from–to range), never a bespoke per-table toggle.
 *
 * The selected value is a single string:
 *   "24h" | "7d" | "30d" | "90d" | "month" | "year" | "all"
 *   "custom:<fromYMD>:<toYMD>"   (either side may be empty → unbounded that end)
 */

export interface WhenPreset {
  value: string;
  label: string;
}

/** The preset buttons, in order, shown in the Filter modal. */
export const WHEN_PRESETS: WhenPreset[] = [
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

const PRESET_HOURS: Record<string, number> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
  "90d": 24 * 90,
};

/** The default window — "all" for client tables (a clinic's small roster is shown
 *  in full by default; the date window is an opt-in narrowing, not a load guard). */
export const DEFAULT_WHEN = "all";

export interface TimeWindow {
  /** Inclusive lower bound, or null = unbounded. */
  fromMs: number | null;
  /** Inclusive upper bound, or null = unbounded. */
  toMs: number | null;
}

/**
 * Resolve a `when` value to a millisecond window. `null` on a side = unbounded.
 * Pass `nowMs` explicitly for determinism; defaults to call time.
 */
export function resolveWhen(value: string | null | undefined, nowMs: number = Date.now()): TimeWindow {
  const v = value || DEFAULT_WHEN;
  if (v === "all") return { fromMs: null, toMs: null };

  if (v.startsWith("custom:")) {
    const parts = v.split(":");
    const from = parts[1] || "";
    const to = parts[2] || "";
    return {
      fromMs: from ? Date.parse(`${from}T00:00:00.000Z`) : null,
      toMs: to ? Date.parse(`${to}T23:59:59.999Z`) : null,
    };
  }

  if (v === "month") {
    const d = new Date(nowMs);
    return { fromMs: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1), toMs: null };
  }
  if (v === "year") {
    const d = new Date(nowMs);
    return { fromMs: Date.UTC(d.getUTCFullYear(), 0, 1), toMs: null };
  }

  const hours = PRESET_HOURS[v] ?? PRESET_HOURS["24h"];
  return { fromMs: nowMs - hours * 3_600_000, toMs: null };
}

/** Does an ISO/date value fall inside the resolved window? */
export function inWhenWindow(dateISO: string | null | undefined, value: string | null | undefined, nowMs?: number): boolean {
  if (!value || value === "all") return true;
  if (!dateISO) return false;
  const t = Date.parse(dateISO);
  if (Number.isNaN(t)) return false;
  const { fromMs, toMs } = resolveWhen(value, nowMs);
  if (fromMs != null && t < fromMs) return false;
  if (toMs != null && t > toMs) return false;
  return true;
}

/** A short, friendly label for the active "When" chip. */
export function whenLabel(value: string | null | undefined): string {
  const v = value || DEFAULT_WHEN;
  const preset = WHEN_PRESETS.find((p) => p.value === v);
  if (preset) return preset.label;
  if (v.startsWith("custom:")) {
    const parts = v.split(":");
    const from = parts[1] || "";
    const to = parts[2] || "";
    const fmt = (s: string) =>
      new Date(`${s}T00:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });
    if (from && to) return `${fmt(from)} – ${fmt(to)}`;
    if (from) return `From ${fmt(from)}`;
    if (to) return `Until ${fmt(to)}`;
    return "Custom Range";
  }
  return WHEN_PRESETS[0].label;
}

/** Normalise an incoming value to a known one (guards against junk). */
export function normalizeWhen(value: string | null | undefined): string {
  const v = value || DEFAULT_WHEN;
  if (v === "all" || v.startsWith("custom:") || WHEN_PRESETS.some((p) => p.value === v)) return v;
  return DEFAULT_WHEN;
}
