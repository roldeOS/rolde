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

## 1. (No locks yet)

Awaiting the first "Add to Approvals". Sections will grow as RolDe is built — likely:
Layout chrome · Typography · Colour/tokens · Tables · Forms · Consultation screen · AI panel ·
Patient feed · Dashboard · Booking flow · Patient portal.

---

*Append new approvals under the relevant section with the date. The locked trigger phrase is
**"Add to Approvals"** — when Roland says it, the append is mandatory in the same turn. Never
silently mutate an entry without his ok.*
