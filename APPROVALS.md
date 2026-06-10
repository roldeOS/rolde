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

## 2. Typography — FONT LAW

2.1 **IBM Plex Serif is ONLY for the RolDe wordmark/icon** (`font-wordmark`; Roland supplies an
SVG logo on request — ask when ready). **Inter EVERYWHERE else, headings included.** (Roland
2026-06-10: "the IBM font should be nowhere" else — locked.)

2.2 5-tier type system (display/title/metric/body/caption) — no `text-base`, no `text-xl`, no
arbitrary pixel sizes.

## 3. Colour

3.1 **Clinic accent — pastel bright SUNNY tones evoking positivity** (Roland 2026-06-10; sample
palette coolors.co/palette/fec5bb-fcd5ce-fae1dd-f8edeb-e8e8e4-d8e2dc-ece4db-ffe5d9-ffd7ba-fec89a).
ONE warm colour family drives BOTH the sidebar tint AND the `--hover` wash. **This becomes a
per-clinic setting controlled by each clinic's Caretaker in their Settings dashboard**
(tenants.config branding) — until then it is tuned in globals.css `--clinic-accent`.

3.2 Chrome stays calm monochrome; semantic colour reserved for clinical signal (Bible 4.2 §2.2).

## 4. Consultation screen — the four-card layout

4.1 (Roland 2026-06-10, matching Bible 4.2 §3.1) — top strip (patient context, never scrolls
away), then FOUR cards: **top-left ~75% = clinical record** (a card of entry cards: notes,
prescriptions, lab results…), **bottom-left ~25% = note composer card**, **top-right ~75% =
investigations + orders, tabbed** (Labs / Radiology / Prescribing / Procedures / Letters),
**bottom-right ~25% = the RolDe panel** ("RolDe says…", Bible 4.2 §5; wordmark header, status
dot, "Ask RolDe anything…" input).

---

*Append new approvals under the relevant section with the date. The locked trigger phrase is
**"Add to Approvals"** — when Roland says it, the append is mandatory in the same turn. Never
silently mutate an entry without his ok.*
