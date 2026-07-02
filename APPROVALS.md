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

1.7 **Sidebar collapse toggle = a separate icon+text row BELOW the nav** (Roland 2026-06-11).
NOT in the sidebar header (it squeezed the wordmark on mobile) — a nav-style row (CardIcon +
"Collapse sidebar") at the bottom of the nav list, desktop only; the topbar button is the MOBILE
menu only.

1.8 **Floating topbar + floating search** (Roland 2026-06-11, mindate parity). The glass topbar
FLOATS — a bright inset top-highlight ("wet glass lip") + a soft drop shadow
(`shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_8px_22px_-10px_rgba(0,0,0,0.22)]`), not a flat
seam. The ⌘K search trigger is a SOLID white chip on a drop shadow (no ring), with a min-width so
it reads as a search bar.

1.9 **Legal & Safety surface** (Roland 2026-06-11). A sidebar nav item → `/legal`: ONE card hosts
the selected document (title on top, body below) with its **version history as the RIGHT rail**
(current + every superseded version, newest first; superseded kept for audit). Documents: Privacy
Policy, Terms, Clinical Disclaimer, Clinical Safety, Ambient-Capture Consent (§8.2). Real wording
pending counsel; structure + versioning are built.

1.10 **Centred auth pages** (Roland 2026-06-11, mindate parity). Sign-in (and all auth screens):
big centred wordmark + tagline ABOVE a borderless floating card (`shadow-float`), with the
`Footer` (Made with ♥ + copyright) pinned to the viewport bottom so the block sits dead-centre.

1.11 **JOURNEY breadcrumb trail** (Roland 2026-06-11). The topbar-left breadcrumb is the path the
user WALKED, rooted at the Dashboard, so they can step back to where they started — e.g. 🏠 ›
Patients › Sarah Jones, then jumping to Legal extends it to 🏠 › 👥 › Sarah Jones › Legal & Safety.
Revisiting a crumb truncates back to it; the Dashboard resets the root. Dashboard is icon-only once
the trail grows; only the last two crumbs keep labels (older collapse to icons). The terminal
patient crumb keeps the rich PatientIsland. `lib/useNavTrail.ts` + `topbar/Topbar.tsx`; sessionStorage-backed.

1.12 **Save bar = PINNED SAVE on dirty → conversational confirmation; unsaved-nav = CENTRAL MODAL**
(Roland 2026-06-11; pinned-Save refinement 2026-06-17 — "shouldn't have to scroll to see the save
button"). The bottom bar is the ONE save surface and runs the full lifecycle in place: it appears
the **moment a form is dirty** with the **Save pinned inside it** (+ Discard when offered), so you
**never scroll to a Save button** — then becomes the conversational confirmation: dirty ("Unsaved")
→ "RolDe is saving…" → "RolDe saved this to Sarah's record" (Retry on failure), then fades. If the
user navigates away with unsaved work, a **central discard MODAL** ("Leave without saving? … Stay
on page / Discard & leave") intercepts the in-app nav — NEVER the browser default. One shared
component (`components/ui/PageActionBar.tsx`, provider in AppFrame); forms drive it via
`usePageActionBar` (dirty + save state) + `useSavedFlash` (sessionStorage-backed confirmation).
**Opt-out — `pinned: false`:** a screen that owns its OWN in-context Save (e.g. **Scribe**, the
clinical workspace, where the Save lives in the composer card) passes `pinned: false` — it keeps
its in-card Save/Discard, still gets the nav guard + the saved confirmation, but shows **no pinned
bar** (the clinical screen stays uncluttered). Every other form uses the pinned default.

1.13 **Brand loader = the "rolde" letters DRAWN one by one** (Roland 2026-06-11). `RoldeLoader` —
the wordmark "rolde" drawn letter-by-letter (each glyph's outline traces, then fills, staggered),
looping. NOT a left-to-right wipe. It should be a RARE sight: RolDe is text-light + fast, so pages
load near-instantly — the loader is for cold boot and HEAVY MEDIA only (e.g. dermatology images in
clinics like Doc For Skin). Page-nav uses the shimmer skeletons (§3.9).

## 2. Typography — FONT LAW

2.1 **IBM Plex Serif is ONLY for the RolDe wordmark/icon** (`font-wordmark`; Roland supplies an
SVG logo on request — ask when ready). **Inter EVERYWHERE else, headings included.** (Roland
2026-06-10: "the IBM font should be nowhere" else — locked.)

2.2 5-tier type system (display/title/metric/body/caption) — no `text-base`, no `text-xl`, no
arbitrary pixel sizes.

2.3 **TITLE CASE LAW — all visible chrome** (Roland 2026-06-13, adopted wholesale from mindate
APPROVALS §39). Every multi-word piece of **visible chrome** is **Title Case — the first letter
of EVERY word capitalised**: card / table / page / modal / section titles, `(i)`-explainer
`label`s, table column headers (+ CSV export headers), tab / field / stat / counter / sort-header
/ timeline labels, sort & filter dropdown OPTIONS, command-palette entries, select-option labels,
**button labels**, and hardcoded status / verdict / outcome labels ("Results Back", "Needs
Review", "Coming Next"). **Hyphenated compounds keep the post-hyphen segment lowercase**
("Drop-off", "Anti-spoof", "In-app", "Auto-suspend" — capitalising the tail is the regression).
**NOT Title-Cased — do NOT "fix" these:** descriptive **sentences** (explainer / help / alert /
blurb / description copy); **aria-labels** + HTML `title=` hover tooltips; enum / code VALUES
(Sentence case, via a future `humanizeCode` per mindate §31/§600); the **RolDe** wordmark; the
**C-roles** (Custodian / Caretaker / Curator / Concierge) and other proper nouns. The DEFAULT for
any new chrome string is Title Case — Roland must be able to trust this without asking. (mindate
CI-guards this via `check-title-case.mjs`; RolDe stays review-enforced until a guard is ported.)

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

3.6 **Fields = OPTION B: shallow float + one VERY THIN hairline, no glow** (Roland 2026-06-11,
chosen over the glass). `.field-float` — a SHALLOW drop shadow (none of the earlier theatrics, no
sage glow) + a single very faint shadcn-style hairline (`--border` ~60%) so subtle it reads as a
defined edge, not a 2010 box. Focus just deepens the hairline a touch toward the dark ring; no
colour, no glow. The green-tick `.tick-squircle` is frosted with NO border; the section `(i)`
explainer has NO hover. (`.field-glass` — the Liquid Glass version — stays on record if ever
wanted; swap the class in `form.tsx`.) Full spec Bible 4.2 §D.3.

3.6a **Field validity = the hairline RE-COLOURED, never thicker** (Roland 2026-06-11). On a real
account match the email line goes **pastel green** (`.field-ok`) + the green-tick squircle; on a
wrong password the line goes **pastel red** (`.field-err`) + a frosted **red-X squircle**
(`.x-squircle`). Same 1px thickness as the resting hairline — only the colour changes. Driven by
`Input`'s `valid` / `error` props.

3.9 **NAVIGATION MUST BE SNAPPY — instant loading skeletons** (Roland 2026-06-11). EVERY route
segment that fetches data has a `loading.tsx` shimmer skeleton (`.skeleton`) so a nav click shows
the page SHELL immediately and never blocks blank on the server fetch — "if it's not snappy with no
data, it'll be terrible at scale." The (app) layout persists; loading.tsx fills the page slot. New
data routes MUST ship a matching loading.tsx.

3.7 **Universal search = the mindate command palette** (Roland 2026-06-11). PORTALED to `<body>`;
the soft blur scrim (`bg-foreground/10 backdrop-blur-md`) sits above everything, AND the topbar is
HIDDEN while the palette is open (`:root[data-search-open] .search-hideable`) so its glass band
never reads as a grey rectangle through the scrim. White `rounded-2xl` panel on
`.shadow-overlay`; GROUPED results with counts + substring highlight + loading spinner + helpful
empty text + a keyboard-hints footer. Full spec: Bible 4.2 §D.4.

3.8 **Pills are ROUNDED RECTANGLES, never stadiums** (Roland 2026-06-11). Every text badge/pill
(note-kind, status, alert, count…) uses `rounded-md` so it echoes the cards' geometry — NOT
`rounded-full`. Round stays ONLY for true circles: avatars, status dots, icon bubbles.

3.4 **Glass headers** (topbar + all 4 consultation cards) share ONE `.glass` treatment kept
fairly OPAQUE (~85% card) so header text never merges with content blurring underneath.

## 4. Consultation screen — the four-card layout

4.1 (Roland 2026-06-10, matching Bible 4.2 §3.1) — patient identity lives in the topbar
breadcrumb (+ glassy island); then FOUR cards: **top-left = Clinical Notes**,
**bottom-left = Scribe** (the writing card — edit/amend happen here), **top-right = Workup**
*(renamed from "Investigations + Orders" — Roland 2026-07-01; order labs/imaging/scripts/procedures
+ track them + see results; tabbed)*, **bottom-right = the RolDe panel** ("RolDe says…", Inter not
serif).

4.2 **The layout is ADAPTIVE, not fixed (Roland 2026-07-01 — supersedes the old Consult/Document/
Review presets).** Two forces size the cards:
- **Module-driven reflow** — a Caretaker "Clinical Modules" toggle (Settings) turns Workup (Lab ·
  Radiology · Procedures · Prescriptions) and the RolDe panel on/off; the grid reflows to 4 / 3 /
  2 cards accordingly (AI off → Scribe full-width; Workup off → AI full-height; both off → Notes +
  Scribe only).
- **User-controlled layouts — NO auto-resize (Roland 2026-07-01, final).** The layout is **stable +
  user-owned** — it changes ONLY when the user changes it (predictability > cleverness; muscle-memory
  safe). Content-pressure and focus-grow auto-sizing are **explicitly dropped**. Mechanisms:
  **drag-to-resize** dividers · a **card layout menu** (Expand · Maximise · Reset) · **user-named saved
  layouts**. The named layouts live in the **topbar "Layouts" dropdown** — this **REPLACES
  Consult/Document/Review**: click *Layouts* → the list of the user's named layouts drops down → click
  one → the workspace below switches; includes a **"Default"** entry. **"Default" = the locked balanced
  50/50** four-card (§4.1). Double-click a divider = reset to Default. The ONLY automatic move is
  opening the Body-Map (Scribe expands — user-initiated, expected). Persisted per user. **On
  iPad/mobile:** cards stack; each is a tap-to-expand accordion. Must be rock-solid across
  desktop/tablet/mobile.

4.3 **Snapshot + Body-Map + Letters (Roland 2026-07-01).** The patient name in the topbar opens
**Snapshot** — a lean sheet: **Allergies** (always shown in full — safety), **Past Medical History**,
**Current Meds** (scrollable lists; scales 2→20 items). The **Body-Map** is a *mode of Scribe* (a
button expands Scribe into the anatomical picker in place → mark → Save posts to the feed; art =
Servier Medical Art CC-BY restyled to our palette + Anatomogram tap-interaction, + photo mark-up for
aesthetics). **Letters live in the feed** (a "Letter"-tagged entry + a Letters filter), composed in
Scribe — NOT in Workup (Workup is request-and-result only). A **"Current admission" separator + pill**
marks where the episode began in the feed.

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

8.3 **Login green tick = a REAL DB match, never a format check** (Roland 2026-06-11). The email
field ticks green ONLY when `public.email_exists(email)` confirms the account exists (debounced
live check). A valid-looking-but-unknown email does NOT tick. The PASSWORD field gets NO tick on
login — a password can't be verified without attempting sign-in, and signalling its correctness
separately is itself a weakness. (Format-only ticks are fine on data-ENTRY forms; never on auth.)
Caveat: `email_exists` is an account-enumeration surface — HARDEN with per-IP rate-limiting (and/or
captcha) before public go-live. The green-tick UX pattern itself stays for data-entry forms.

8.2 As a clinical product handling special-category health data — and ESPECIALLY once dictation /
ambient listening lands (Bible 4.7) — RolDe must surface **Privacy Policy / data-processing
notice, Terms, a clinical Disclaimer, and a Clinical Safety statement** (UK GDPR + DPA 2018; in
England, DCB0129/0160 clinical risk management + a named Clinical Safety Officer), plus an
explicit **logged patient consent gate + visible "listening" indicator** before any ambient
capture. Routed pages linked from a persistent footer (app + auth) and shown at signup + at the
point of capture. Spec: Bible 4.2 §D.8. Flag for legal counsel before go-live. *(Compliance item
tracked in Bible 4.8 §15.)*

## 9. Card standard — the squircle is the signature (Roland 2026-06-13)

9.1 **Every white / Card-background card carries a `CardIcon` squircle** as the first thing in
its header — `<CardIcon icon tone variant="badge" />` (white rounded-square + soft shadow +
tone-tinted icon), via `CardHeaderRow` / `PageHeaderRow` (adopted from mindate APPROVALS §13 /
§1.9 — *"our icons have become almost like a signature"*). Tone carries CLINICAL meaning only
(Bible 4.2 §2.2). Exception: the centred AUTH cards (login / reset) stay bare.

9.2 **Reuse before build — never approximate a card or table.** "Build a card / table like X" =
**render X's component** (`CardHeaderRow`, `PageHeaderRow`, `DialogHeaderRow`, `CardIcon`,
`StatTile`, `DataTable` / `TableShell` per §5, `SectionExplainer`), passing the FULL standard
prop set (icon + tone + the `(i)` explainer where the surface carries one) — NOT a hand-rolled
subset. A tile without its squircle + `(i)` isn't the tile (mindate MISTAKES #25). The default
state for any new card / table is the shared component, Title-Cased (§2.3) — built right the
first time, so Roland never has to ask twice.

9.3 **A modal is a new page → it carries the squircle too** (Roland 2026-06-18). Every modal /
dialog header uses **`DialogHeaderRow`** (`components/ui/DialogHeaderRow`) — a `CardIcon` squircle +
title (+ optional subtitle) + close — never a bare `<h2>`. Roland: *"when you design a modal,
remember it is a new page of sorts, so it needs an IconChip."* Modals get **room to breathe**:
generous width (so placeholders never squish) and `px-6 py-5` body padding, not cramped.

9.4 **Any standalone icon is a `CardIcon` squircle (the "IconChip"), never bare** (Roland
2026-06-18, *"it's kind of our brand thing"*). A meaning-carrying icon beside a label (a row, a
toggle, a header) renders as `<CardIcon icon tone variant="badge" size="sm" />` — the squircle is
the signature. A bare `<Icon className="size-4" />` sitting next to text is the regression
(precedent: the Prescriber `Pill`). Tiny inline affordance glyphs inside a control (a chevron, a
spinner, the ✕ in a close button) are exempt — those aren't standalone brand icons.

## 10. Themed components ONLY — never a system-default element (Roland 2026-06-18, LOCKED)

10.1 **Every form control on every page / modal is one of RolDe's themed components — NEVER a
system-default (native) element.** Roland 2026-06-18, after the Services modal shipped native
controls: *"Never, in the future and now, should any of our pages have default elements — we
worked so hard on building our own elements for a reason."* The roster:
- **Text / email / number / date inputs** → `Input` (or the `fieldFloat` class) from
  `components/ui/form`, wrapped in `Field` for its label + hint.
- **Dropdowns** → `Select` from `components/ui/form` (it draws OUR chevron via `appearance-none`)
  — NEVER a bare `<select>` (the browser chevron is the tell).
- **Toggles / on-off** → `Switch` from `components/ui/Switch` (the pill) — NEVER an
  `<input type="checkbox">`.
- **Pick-one-of-few** → `Segmented` from `components/ui/Segmented` (soft muted track, the selected
  segment lifts onto white with a shadow) — NEVER drab grey buttons-with-a-border.
- **Cards / headers / tiles / modals** → the §9 shared components (`CardHeaderRow`,
  `PageHeaderRow`, `DialogHeaderRow`) with their `CardIcon` squircle.

10.2 **No ad-hoc field styling.** A local `const INPUT = "w-full rounded-lg border …"` / `LABEL`
string is the same offence as a native control — it bypasses the themed primitive. Use `Field` +
`Input` / `Select` / `Switch`. If a themed primitive genuinely doesn't exist for what you need,
**BUILD the shared one** (as `Switch` was, 2026-06-18) — never drop to native or hand-rolled.

10.3 **This is a default-state guarantee.** It holds for EVERY new and existing surface, with no
exceptions to chase later — Roland must be able to trust that any RolDe screen is themed without
re-checking it. Regression history: MISTAKES #7 (Services modal native `<select>` + checkbox).
Pairs with §9 (cards) + §2.3 (Title Case).

---

*Append new approvals under the relevant section with the date. The locked trigger phrase is
**"Add to Approvals"** — when Roland says it, the append is mandatory in the same turn. Never
silently mutate an entry without his ok.*
