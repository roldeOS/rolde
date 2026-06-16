#!/usr/bin/env node
/**
 * check-title-case — CI guard for RolDe's Title Case standard (APPROVALS §2.3).
 * Ported from the mindate Dashboard, adapted for RolDe's JSX-prop chrome.
 *
 * Fails the build if a CHROME title/label is written in Sentence case. To stay
 * near-zero false-positive (RolDe shares `title=`/`label=` with HTML tooltips and
 * aria-labels), it ONLY flags:
 *   • object-literal `title:` / `label:` "…"  — settings registry, legal docs, (i) explainers
 *   • JSX `title=` / `label=` "…" owned by a KNOWN chrome component
 *     (PageHeaderRow, CardHeaderRow, DialogHeaderRow, ModuleStub, StatTile, Field, SortHead)
 * It NEVER flags: aria-label, HTML `title=` tooltips on plain elements, or
 * descriptive sentence copy (blurb/description/summary). Units, (parentheticals)
 * and hyphen-tails ("Drop-off") legitimately stay lowercase.
 *
 * Escape hatch: put `// allow-sentence-case` on (or just above) the line.
 * Usage: `pnpm check:title-case` — also runs first in `build`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src/app", "src/components"];
const CHROME = new Set([
  "PageHeaderRow",
  "CardHeaderRow",
  "DialogHeaderRow",
  "ModuleStub",
  "StatTile",
  "Field",
  "SortHead",
]);
// Lowercase tokens that are NOT a Title Case violation (units, connectors).
const ALLOW = new Set(["vs", "km", "min", "h", "d", "s", "hr", "hrs", "kg", "g", "ms", "px"]);

/** True if any word after the first is all-lowercase (→ Sentence case). */
function isSentenceCase(value) {
  const words = value
    .replace(/\([^)]*\)/g, " ") // drop (parentheticals) — lowercase inside is fine
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < 2) return false;
  for (let i = 1; i < words.length; i++) {
    // A hyphen-tail ("Drop-off") may be lowercase — judge only the head.
    let w = words[i].includes("-") ? words[i].split("-")[0] : words[i];
    w = w.replace(/^[^A-Za-z]+/, "").replace(/[^A-Za-z]+$/, "");
    if (!w || ALLOW.has(w) || /[A-Z]/.test(w)) continue; // symbol / unit / acronym → fine
    if (/^[a-z]/.test(w)) return true; // all-lowercase word after the first → Sentence case
  }
  return false;
}

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|ts)$/.test(e)) out.push(p);
  }
  return out;
}

/** Nearest JSX tag (any case) at/above `idx` — the owner of a prop. */
function owner(lines, idx) {
  for (let i = idx; i >= 0 && i > idx - 12; i--) {
    const m = lines[i].match(/<([A-Za-z][A-Za-z0-9]*)/);
    if (m) return m[1];
  }
  return null;
}

const violations = [];
const PROP = /(?:^|[^\w-])(title|label)\s*([:=])\s*"([^"]+)"/g;

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const lines = readFileSync(file, "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const t = line.trim();
      if (t.startsWith("*") || t.startsWith("//") || t.startsWith("/*")) continue;
      if (
        line.includes("allow-sentence-case") ||
        (lines[i - 1] || "").includes("allow-sentence-case")
      )
        continue;
      for (const m of line.matchAll(PROP)) {
        const [, prop, sep, value] = m;
        if (!isSentenceCase(value)) continue;
        if (sep === "=") {
          const comp = owner(lines, i);
          if (!comp || !CHROME.has(comp)) continue; // tooltip / aria / non-chrome
          violations.push({ file, line: i + 1, what: `<${comp} ${prop}=`, value });
        } else {
          violations.push({ file, line: i + 1, what: `${prop}:`, value });
        }
      }
    }
  }
}

if (!violations.length) {
  console.log("✓ title-case: clean — every chrome title/label is Title Case (APPROVALS §2.3)");
  process.exit(0);
}
console.error(
  `✗ title-case: ${violations.length} Sentence-case chrome label(s) — see APPROVALS §2.3\n`,
);
for (const v of violations) console.error(`  ${v.file}:${v.line}  ${v.what} "${v.value}"`);
console.error(
  '\n  Fix: capitalise every word ("New Patient", not "New patient"). Units,' +
    " (parentheticals) and hyphen-tails stay lowercase. Deliberate exception:" +
    " add `// allow-sentence-case`.",
);
process.exit(1);
