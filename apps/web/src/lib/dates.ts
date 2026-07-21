/**
 * Deterministic date text (2026-07-21, found by the B2 hydration audit) —
 * `toLocale*` output depends on the runtime's ICU build: Node rendered
 * "02 Jul 2026 at 23:56" where an older WebKit rendered "02 Jul 2026, 23:56",
 * and the feed's server HTML failed hydration against the client's text.
 * Record and chrome dates format through THIS module instead — the same
 * bytes on every runtime, forever. (Times are the viewer's local clock; the
 * Caretaker clinic-timezone setting feeds these later — W1.1.x.)
 */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const p2 = (n: number) => String(n).padStart(2, "0");
const toDate = (d: Date | string) => (typeof d === "string" ? new Date(d) : d);

/** "2 Jul 2026" */
export function formatDay(d: Date | string): string {
  const t = toDate(d);
  return `${t.getDate()} ${MONTHS[t.getMonth()]} ${t.getFullYear()}`;
}

/** "02 Jul 2026" */
export function formatDay2(d: Date | string): string {
  const t = toDate(d);
  return `${p2(t.getDate())} ${MONTHS[t.getMonth()]} ${t.getFullYear()}`;
}

/** "21 Jul" */
export function formatDayShort(d: Date | string): string {
  const t = toDate(d);
  return `${t.getDate()} ${MONTHS[t.getMonth()]}`;
}

/** "02 Jul 2026 at 23:56" — the feed tile's stamp. */
export function formatDayTime(d: Date | string): string {
  const t = toDate(d);
  return `${formatDay2(t)} at ${p2(t.getHours())}:${p2(t.getMinutes())}`;
}
