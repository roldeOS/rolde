# APPROVALS — RolDe

The **authoritative ledger of visible / behavioural states Roland has explicitly locked.**
Every entry was greenlit by Roland in a specific session; preserving it across changes is
non-negotiable.

**Process — read before EVERY UI / behaviour edit:**
1. Before any edit touching a listed component, scan that section.
2. If the change would alter a locked property, name it in the plan and ask Roland *first*.
3. Append on the locked trigger phrase **"Add to Approvals"** (or an unambiguous greenlight on
   a visible state) — in the same turn, with the date and what specifically NOT to change.
   *"ship it" / "yes" / "go" is NOT a lock — Roland decides what's locked.*
4. When in doubt, ask. Cost of asking = a sentence; cost of regressing a lock = his time + trust.

Paired with `MISTAKES.md` (what's been broken before) and `CLAUDE.md` (read both before any edit).

---

## Design ancestry (context, not a lock)

RolDe's design system is **inherited structurally from the mindate Roland Design System (RDS)** —
`../mindate-admin/APPROVALS.md` (§21–§31) and `../mindate-admin/docs/roland_design_system.md`.
Reused wholesale: the 3-tier token architecture, `DataTable`/`TableShell`, `PageActionBar`,
CardIcon squircles, tonal buttons, the single `--hover` token, and the locked build process
(build → audit-wide sweep → verify → lock → deploy, **one item at a time, never big-bang**).

**Re-skinned, not copied:** RolDe uses Bible 4.2's calm clinical palette — monochrome chrome,
a **dark** focus ring, and semantic colour ONLY for clinical signal (red allergy / amber action /
green consent). mindate's Earth & Bloom hues (gold hover, teal, coral) do **not** carry over.
Typography spine is shared: IBM Plex Serif + Inter + IBM Plex Mono.

Nothing above is a session-lock yet — it's the agreed direction. Locks land below on "Add to Approvals".

---

## 1. Layout chrome

1.1 **App shell** (Roland 2026-06-10) — fixed narrow sidebar (w-48) on the clinic tint is the
ONLY thing outside the card; **ONE overall content card** (rounded-xl, shadow-float) encompasses
everything else; the card's inner pane is the only scroll container (document never scrolls).

1.2 **Floating glass topbar** (Roland 2026-06-10) — sticky frosted bar inset at the top of the
content card (mindate Glass ancestry). Glass is for the top + bottom bars ONLY; every other
overlay is the white floating treatment. (The bottom save-bar / PageActionBar pattern arrives
with the first dirty-tracking form.)

1.3 **Sidebar nav = signature squircle CardIcon badges** per item; active = subtle dark wash;
hover = the ONE `--hover` token.

1.4 **ONE search — the universal ⌘K** (Roland 2026-06-11). NEVER add a per-page / per-table
search field anywhere; the topbar universal search is the single search surface.

1.5 **Integrated chevrons, never the browser default** (Roland 2026-06-11). Native `<select>`
arrows are `appearance-none`'d and replaced with our own lucide `ChevronDown`; all dropdown
affordances use the same chevron.

1.6 **FULL-BLEED LAW** (Roland 2026-06-11, emphatic). Every page and every card uses the FULL
width of the content card — NEVER a centered "middle 80%". No `max-w-* mx-auto` on page bodies;
padding is `p-6 lg:p-8` and the content spans edge to edge. Tables span the full card width.
(A single short *form* may cap its field column for readability — ASK before centering anything
else.) Full spec: Bible 4.2 §D.1.

1.7 **Sidebar collapse toggle lives IN the sidebar** (Roland 2026-06-11). The expand/collapse
control sits in the sidebar header (the industry standard — Linear / Notion / VS Code), desktop
only; the topbar button is the MOBILE menu only.

## 2. Typography — FONT LAW

2.1 **IBM Plex Serif is ONLY for the RolDe wordmark/icon** (`font-wordmark`; Roland supplies an
SVG logo on request — ask when ready). **Inter EVERYWHERE else, headings included.** (Roland
2026-06-10: "the IBM font should be nowhere" else — locked.)

2.2 5-tier type system (display/title/metric/body/caption) — no `text-base`, no `text-xl`, no
arbitrary pixel sizes.

## 3. Colour

3.1 **Clinic accent — creamish-yellow pastel** (Roland 2026-06-10; earlier sunny-peach revised).
ONE warm colour family drives the **SIDEBAR tint** AND the `--hover` wash. **This becomes a
per-clinic setting controlled by each clinic's Caretaker in their Settings dashboard**
(tenants.config branding) — until then it is tuned in globals.css `--clinic-accent`.

3.2 **THE MAIN CONTENT CARD IS NEVER COLOURED** (Roland 2026-06-10, emphatic). `--background`
stays a neutral canvas; the clinic accent lives on the SIDEBAR only. White cards float on the
neutral content card. Chrome stays calm monochrome; semantic colour reserved for clinical
signal (Bible 4.2 §2.2).

3.3 **No borders — floating instead** (Roland 2026-06-10). Cards/panels/dropdowns float on a
shadow, never an explicit `border`. Toolbar icons (sort/filter/export/maximise) are floating
white chips (`bg-card shadow-sm ring-black/[0.05]`), mindate-style. **Form inputs are floating
too** (`bg-card shadow-sm ring-black/[0.06]`, no border) with a **green-tick squircle** at the
right when valid (mindate-iOS) — see `components/ui/form.tsx` (`fieldFloat`, `Input`, `Select`).

3.5 **ELEVATION STANDARD — three tiers by nesting depth** (Roland 2026-06-11; globals.css).
Pick by WHERE the card sits:
- **`.shadow-float`** — LEVEL 1: a card on the page/canvas (the four consultation cards, the
  table card, dashboard tiles).
- **`.shadow-raised`** — LEVEL 2: a card WITHIN a card (clinical-note tiles, list rows). CRISP —
  a tight contact shadow + hairline, NEVER a diffuse/feathered smudge (Roland 2026-06-11: the
  feathered version "looked sloppy"). NO ring/border.
- **`.shadow-overlay`** — LEVEL 3: floats above everything — dropdowns, command palette,
  patient island, popovers, dialogs (the ONLY tier with a long diffuse lift).
This is the canonical answer to "what floating params for a card within a card."

3.6 **Floating fields are CRISP + glassy tick** (Roland 2026-06-11). `.field-float` (inset top
highlight + hairline ring + tight contact shadow; focus deepens the DARK ring, never blue).
Valid → `.tick-squircle`, a FROSTED translucent emerald chip (not a flat fill). Canonical in
`components/ui/form.tsx`; full spec Bible 4.2 §D.3.

3.7 **Universal search = the mindate command palette** (Roland 2026-06-11). Scrim is a
barely-there blur (`bg-foreground/5 backdrop-blur-sm`) — NEVER a dark/"black bar". White
`rounded-2xl` panel on `.shadow-overlay`; GROUPED results with counts + substring highlight +
loading spinner + helpful empty text + a keyboard-hints footer. Full spec: Bible 4.2 §D.4.

3.4 **Glass headers** (topbar + all 4 consultation cards) share ONE `.glass` treatment kept
fairly OPAQUE (~85% card) so header text never merges with content blurring underneath.

## 4. Consultation screen — the four-card layout

4.1 (Roland 2026-06-10, matching Bible 4.2 §3.1) — patient identity lives in the topbar
breadcrumb (+ glassy island); then FOUR symmetric cards: **top-left = Clinical Notes**,
**bottom-left = Scribe** (the writing card — edit/amend happen here), **top-right =
Investigations + Orders, tabbed**, **bottom-right = the RolDe panel** ("RolDe says…", Inter not
serif). Both columns share ONE row-split so the top two cards end level and the bottom two end
level (visually symmetric). View presets (Consult/Document/Review) live in the topbar.

## 5. Tables — port mindate's DataTable + TableShell (Roland 2026-06-11)

5.1 Every RolDe table uses the **mindate TableShell + DataTable**, ported wholesale (Roland:
"bring them ALL here"). Inherited, non-negotiable: header-merged toolbar with **Filter** (→
blurred modal → removable chips), **Sort** dropdown + active pills, **Freeze** (pin leading
columns, auto-appears on overflow), **Density** toggle, **Export** (CSV of filtered rows); a
bottom bar with count + page-size + numbered pagination; `table-fixed` + `<colgroup>`, ellipsis
truncation, optional row-numbers + expandable rows; floating (borderless `.shadow-float`).
Density/page-size/freeze persist per `storageKey`. NEVER a per-table filter control. Full spec:
Bible 4.2 §D.5. *(Specified + locked for build — Patients is the first port.)*

## 6. Dark mode (Roland 2026-06-11)

6.1 Full dark mode via `next-themes` (class strategy), toggle in the Profile dropdown + the
command palette Theme group. TOKEN-driven (never per-component hacks); EVERY surface themed.
Depth by LIGHTNESS: in dark, the page background is the DARKEST layer and each nested surface is
LIGHTER (elevation reads by lightness, since shadows vanish on dark — overlay tiers gain a thin
`ring-white/10`). Clinical-signal hues keep meaning but lift for AA contrast (patient safety).
Token values + guidance: Bible 4.2 §D.6. *(Specified + locked for build.)*

## 7. Font-size accessibility (Roland 2026-06-11)

7.1 A 3-step text-size control in the Profile dropdown — **Compact / Default / Large** (Default
= today). Implemented as a ROOT scale (`data-text-size` on `<html>` → root `font-size`/
`--text-scale`), persisted, applied pre-paint. The rem-based 5-tier type system (§2.2) scales
every module automatically. Provider wired in the root layout from the start. Spec: Bible 4.2 §D.7.

## 8. Footer + legal/regulatory (Roland 2026-06-11)

8.1 Sidebar footer = **"Made with ♥ at RolDe"** (amber-red heart `#e0533f`) + `© <year> RolDe
Ltd` (mindate pattern).

8.2 As a clinical product handling special-category health data — and ESPECIALLY once dictation /
ambient listening lands (Bible 4.7) — RolDe must surface **Privacy Policy / data-processing
notice, Terms, a clinical Disclaimer, and a Clinical Safety statement** (UK GDPR + DPA 2018; in
England, DCB0129/0160 clinical risk management + a named Clinical Safety Officer), plus an
explicit **logged patient consent gate + visible "listening" indicator** before any ambient
capture. Routed pages linked from a persistent footer (app + auth) and shown at signup + at the
point of capture. Spec: Bible 4.2 §D.8. Flag for legal counsel before go-live. *(Compliance item
tracked in Bible 4.8 §15.)*

---

*Append new approvals under the relevant section with the date. The locked trigger phrase is
**"Add to Approvals"** — when Roland says it, the append is mandatory in the same turn. Never
silently mutate an entry without his ok.*
