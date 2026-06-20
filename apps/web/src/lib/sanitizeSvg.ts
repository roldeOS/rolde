/**
 * Conservative server-side SVG sanitiser for clinic logos (Wave B / URDS PDF Kit).
 *
 * A clinic-supplied SVG is untrusted markup, so we strip every script-execution
 * vector before storing it. Defence in depth: the stored logo is ALSO only ever
 * rendered sandboxed — an `<img>` data-URL in the app (SVG-as-img can't run
 * script or reach the page) and rasterised via sharp for the PDF — so even a
 * missed vector can't execute. This sanitiser is the first line, the rendering
 * the second.
 *
 * Returns the cleaned SVG, or null if the input isn't a plausible SVG / is too big.
 */
const MAX_BYTES = 256 * 1024; // 256 KB — a logo, not an illustration

export function sanitizeSvg(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let s = input.trim();
  if (!s) return null;
  if (s.length > MAX_BYTES) return null;
  // Must actually be an <svg> document.
  if (!/<svg[\s>]/i.test(s)) return null;

  // 1 — Drop script-bearing / foreign-content elements entirely (open+close…).
  s = s.replace(/<script[\s\S]*?<\/script\s*>/gi, "");
  s = s.replace(/<(foreignObject|iframe|embed|object|audio|video|set|handler|use)\b[\s\S]*?<\/\1\s*>/gi, "");
  // …and their self-closing / void forms.
  s = s.replace(/<(script|foreignObject|iframe|embed|object|use)\b[^>]*\/?>/gi, "");
  // 2 — Strip inline event handlers (onload, onclick, …).
  s = s.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // 3 — Neutralise javascript: / data:text in any href / src.
  s = s.replace(/((?:xlink:)?href|src)\s*=\s*("|')\s*(?:javascript|data:text\/html)[^"']*\2/gi, "");
  // 4 — Strip <a> wrappers' javascript targets (keep the <a> harmless or drop it).
  s = s.replace(/<a\b([^>]*?)>/gi, (m) => (/javascript:/i.test(m) ? "" : m));

  // Re-check it still has an <svg> root after stripping.
  if (!/<svg[\s>]/i.test(s)) return null;
  return s;
}
