# RolDe OS — Wave Status Board

> **The single visual tracker of what's built vs pending.** Jarvis **updates this + shows it to
> Roland every time a wave-point is finished** (LOCKED process, Roland 2026-06-30). Source of truth
> for detail is Bible 4.8 §15.7 (the Build Register) + §15.7c (the specialty packs); this board is
> the at-a-glance direction.
>
> **Legend:** ✅ done & verified · ◐ in progress / partial · ▢ not started
> **Build order:** dependency-ordered (see Bible 4.8 §11) — most-reused engine first, one at a time.

---

## A. The Spine — Waves W0–W6

| Status | Wave | Notes |
|:---:|---|---|
| ✅ | **W0 Foundation Hardening** | Login-security suite · 8 legal docs (v1.0) · UI standards *(launch gates parked)* |
| ◐ | **W1.1 Settings Console** | see breakdown ↓ |
| ✅ | **· Logs Hub + Change Describer** | Activity · Patient Access · Communications · Sign-in & Security · Export; precise-save + field audit ×5 forms |
| ◐ | **W1.2 Patient Record** | Consultation screen + Clinical Notes feed ✅ built; structured tabs ▢ (see ↓) |
| ◐ | **W1.3 Patients List** | list + table exist ✅; segments · tags · bulk · merge · quick-view ▢ |
| ◐ | **W1.4 Dashboard Cockpit** | greeting + stat tiles exist ✅; action-queues · pulse · front-of-house · ward-card ▢ |
| ◐ | **W1.5 Onboarding & Custodian** | Control console ✅; onboarding wizard · ward live-board · Clinic Vitals ▢ |
| ▢ | **W1.6 Confer & Concerns** | in-house messaging + escalation |
| ▢ | **W2 Calendar & Front Office** | Scheduling · Online Booking · RolDe Cadence · Waitlist · Recurring series *(Calendar is a stub today)* |
| ▢ | **W3 Clinical Orders** | Prescribing + drug-safety · the Order/Lab spine (results inbox) · Letters + closed-loop referrals |
| ▢ | **W4 Money** | Billing/deposits · Packages & memberships · Gateways · Aged debt · Insurer billing *(Commercial Settings config ✅)* |
| ▢ | **W5 Ambient AI** | AI server (Gemma, self-hosted) · ambient suggestions · AI drafting · correction pipeline |
| ▢ | **W6 Growth & Ops** | Inventory (batch/expiry) · Reports · Patient Portal · Audit-log surface · Website builder |

### W1.1 Settings Console — item breakdown
| Status | Item |  | Status | Item |
|:---:|---|---|:---:|---|
| ✅ | Hub + registry + gate | | ▢ | W1.1.3 Ward Map editor |
| ✅ | W1.1.2 Clinic Profile | | ▢ | W1.1.6 Rooms & Hours |
| ✅ | W1.1.4 Branding & Logo | | ▢ | W1.1.9 Letter Templates |
| ✅ | W1.1.5 Patient Numbering | | ▢ | W1.1.10 Memberships & Packages |
| ✅ | W1.1.7 Users & Roles | | ▢ | W1.1.11 Payment Gateways |
| ✅ | W1.1.8 Services & Pricing | | ▢ | W1.1.12 Website & Domain |
| ✅ | W1.1.13 Email Templates | | | |
| ✅ | **Clinical Modules toggle** *(2026-07-03)* | | | |
| ✅ | W1.1.14 Profiles & Avatars | | | |
| ✅ | W1.1.15 Who's Who glossary | | | |
| ✅ | W1.1.16 Commercial Settings + Tax | | | |

### W1.2 Patient Record — item breakdown
| Status | Item |
|:---:|---|
| ✅ | Consultation screen (4-card workspace: Feed · Workup · AI · Scribe) + break-glass + access log |
| ✅ | Clinical Notes feed (scrollable, filter/sort, edit/strike/amend, threading) + `patient_feed_entries` (~19 entry types) |
| ✅ | **Workup rename** (deep: component · props · types · visible card title) — 2026-07-01 |
| ✅ | **Letters → the feed** (type-labelled entries + auto filter; Workup = Labs/Rad/Rx/Procedures) — 2026-07-01 |
| ✅ | **Official letters + PDF** (LetterPdf on the PDF Kit; audited download endpoint — export_log artifact + Activity Log) — 2026-07-02 |
| ✅ | **Feed Tile standardised (URDS §8)** — one anatomy: type pill + time / body / author + status-pill + actions; letter band reverted; proper letter format (salutation · left-aligned · UK sign-off) — 2026-07-02 |
| ✅ | **Record data layer** — patient_problems + patient_medications (RLS · soft-delete · SNOMED-ready) + seed; allergies/alerts already existed — 2026-07-02 |
| ✅ | **Snapshot sheet** — PMH (counted, resolved muted) + Current Meds in the name-drop island, allergies pinned; verified live — 2026-07-02 |
| ✅ | **Episode Marker** — "Today" separator pill in the feed (v1; upgrades to the admission/appointment anchor at W2) — 2026-07-02 |
| ✅ | **Layouts** — the topbar "Layouts" menu (Default + user-named layouts, save-as/remove) · 3 drag dividers (shared symmetric split) · double-click = Default · per-user persistence · presets fully retired · no auto-resize ever — 2026-07-03. **Refined same day:** Default = cols 50/50 · rows 80/20 · window-listener drag (every divider drags) · prominent grab-handles · **per-card ON/OFF toggles** (Clinical Notes/Workup/RolDe; save with named layouts) |
| ✅ | **Courier trail palette** — Not Sent amber · Sent info · Delivered/Opened success · Failed critical (pastel) — 2026-07-03 |
| ✅ | **Clinical Modules toggle (W1.1)** — Caretaker card switches Lab · Radiology · Procedures · Prescribing · RolDe AI per clinic; Consult Room reflows 4/3/2, Workup drops tabs, sidebar/⌘K hide, honest "switched off" on direct visits, audited flips; clinic layer OVER the user's Layouts toggles; clinician-403 negative case verified — 2026-07-03 |
| ✅ | **Profile overlay** — full record in a sheet over the Consult Room (island "Full Profile" + Snapshot "+ Add"): Details (field-audited) · Next Of Kin · Care Team (Courier address hooks, one-GP rule) · Clinical Record editors (allergies/PMH/meds — add/edit/resolve/stop, feed-noted) — 2026-07-03 |
| ✅ | **Read-by "· first" fix** — reads sorted by read_at (DB row order had crowned the wrong first reviewer) — 2026-07-03 |
| ✅ | **Full Profile completeness pass** — clinic Country setting (Clinic Profile) · country-aware validation lib (phone/postcode/email/DOB + NHS check digit; client per-country, server floor) · full registration dataset in Details (PDS/GP-Connect + Accessible Information Standard fields, field-audited) · **Alerts editor** (needle phobia etc.; add/edit/resolve, feed-noted) — 2026-07-03 |
| ✅ | **Feed Tile v3 — the STATUS DOT (Roland's design)** — one contextual pill + traffic-light dot (Unread amber · red reserved for immediate) · settle-to-muted-dot · Status Trail popover · Status filter (Needs Attention / In Flight / Settled) · footer status pill retired · in the URDS §8 — 2026-07-03 |
| ✅ | **Micro-typography + label laws** — uppercase micro-headers & segment/tab labels semibold (audited platform-wide) · recordLabels.ts label maps (no raw stored values — "Safety · Warning") · country-aware national health IDs (NHS/CHI · ABHA · IHI · NHI · Emirates ID) — 2026-07-03 |
| ▢ | **Status-Dot colour taxonomy** — the red/amber/info/green/grey state list awaits Roland's eyeball → approved states then light up as they ship (results ack at W3, reviews at W2/W3) |
| ▢ | Consultation redesign remainder: **Body-Map** (Servier style TBC) |
| ▢ | W1.2.1 Problem List (SNOMED-coded) · W1.2.2 Medication List + reconciliation · W1.2.3 History (PMH/surgical/family/social) |
| ▢ | W1.2.4 Document Store · W1.2.6 Digital Consents (e-sign) |
| ▢ | W1.2.7 Vitals/Growth charts · W1.2.8 Risk Scores (NEWS2/QRISK) · W1.2.9 Printable Summary |

## B. Named cross-cutting modules

| Status | Module | What |
|:---:|---|---|
| ▢ | **RolDe Connect** | Video consults (self-host LiveKit) |
| ▢ | **RolDe Covenant** | Relationships / marketing (W6.2) |
| ▢ | **RolDe Compass** | The day view — calendar + tasks (sidebar) |
| ▢ | **RolDe Cadence** | Recalls / reminders engine (W2.3) |
| ◐ | **RolDe Courier** | The clinical postal system (GREENLIT 2026-07-02) — **C1 ✅ complete + Roland-verified: TEAM-level unseen (first colleague's read reviews it for the clinic; author never counts) · pastel-amber "Unseen"→"Read ✓" pill (top-right) · "N Unseen" header pill (click = jump to oldest unread) · the Read-by popover (full names, "· first" = the reviewer of record)**; C2 address book/settings · C3 outbound email + live tracking · C4 clinic↔clinic · C5 chase/kill-switch ▢ |
| ⧉ | **RoChat** | AI comms hub — built by iOS-Jarvis (external) |

## C. The 18 Specialty Packs *(mapped + slotted in Bible 4.8 §15.7c; build = configuration of the spine)*

| Status | Pack | Items | | Status | Pack | Items |
|:---:|---|---|---|:---:|---|---|
| ▢ | Aesthetics | AP.1–11 | | ▢ | Women's/Men's/Sexual | WH.1–5 |
| ▢ | Dermatology | DP.1–7 | | ▢ | Occupational Health | OH.1–5 |
| ▢ | Private GP/Consultants | GP.1–7 | | ▢ | Pharmacy & IP | PH.1–3 |
| ▢ | Primary Care | NP.1–8 | | ▢ | Diagnostics & Imaging | IM.1–5 |
| ▢ | Dentistry | DN.1–7 | | ▢ | Veterinary | VT.1–5 |
| ▢ | Physio/MSK (+chiro/osteo/pod) | PT.1–3 | | ▢ | Wellness/Longevity | WL.1–5 |
| ▢ | Mental Health | MH.1–7 | | ▢ | Complementary | CM.1–3 |
| ▢ | Optometry | OP.1–5 | | ▢ | Surgical/Day-Units | SU.1–5 |
| ▢ | Audiology | AU.1–4 | | ▢ | Fertility/IVF | FR.1–6 |

---

*Last updated: 2026-07-03 late (Status Dot v3 + typography/label laws + national IDs live; next: colour-taxonomy approval → Body-Map style pick → Courier C2/C3).*
