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
| ✅ | **Status-Dot colour taxonomy APPROVED + locked** (bible + the Clinical Notes (i) glossary); Filter's Status options now wear their dot colours; Segmented tabs lift onto a true white card — 2026-07-04 |
| ✅ | **Independent row splits** — Scribe's divider moves Scribe alone (per-column splitLeft/splitRight; old saved layouts migrate) — 2026-07-04 |
| ✅ | **Deep clean** — nhs_number → national_health_id (all the way down) · five unused scaffold columns dropped · AIS chip in the island (interpreter/communication needs flagged at a glance) — 2026-07-04 |
| ✅ | **RolDe Scribe Templates T1** (GREENLIT + built 2026-07-04) — typed parts engine · picker in Scribe's header · Scribe morphs into the form in place · curated library ×6 → renders a clean note through saveNote. **Enriched same day:** SOAP made the flagship (PC · history · review checklist · vitals · differentials · full plan + follow-up) · GP gains ICE · derm gains Fitzpatrick · toxin gains a real DATE expiry + dilution + review interval · new date part · heading-aware rendering (no label doubling) |
| ✅ | **AnchoredPopover** (URDS §8) — in-card popovers portal to body (Template picker · feed Filter · Status Trail were CLIPPING at card edges); coloured Status filter options actually landed (the earlier claim was an unwritten edit — owned + fixed) |
| ✅ | **Scribe T2 — personal template builder** (2026-07-13) — right-sheet builder (full parts palette incl. Body Map, reorder, delete-confirm) · user_templates (owner-only RLS, E2E-proven: colleague sees nothing) · picker "My Templates" + "New Template…" · server-side parts sanitiser (hostile payload dropped, proven) · the SNAPSHOT law: notes carry name+parts, render structured forever |
| ✅ | **Face portrait v7 + embedded-map truth** (2026-07-13) — the beautiful-portrait rebuild (canon proportions · hair over shoulders · lash/iris/rose-lip detail; iterated v3→v7 by screenshot); embedded maps carry EXPLICIT px heights (h-full % collapsed in Safari — my earlier "fixed" was wrong, owned); both views harness-screenshot proven with coloured pins |
| ✅ | **T2 governance rework** (2026-07-13, Roland's ruling) — templates are CLINIC-official: Caretaker designs, team fills; deep rename clinic_templates (team-read + Caretaker-write RLS + role-gated actions); clinician-create refused + team-read proven E2E |
| ✅ | **T2.5 autotext shortcuts** (2026-07-13, Carebit steal) — personal ".sn"+space expansions in Scribe draft + template fields; "My Shortcuts…" teal manager sheet; engine unit-tested ×6 + isolation proven |
| ✅ | **Scribe T3** (2026-07-21) — Settings→Scribe Templates: usage counts · Active/retire · Patient-Facing flags · colour-legend editor (names print on the record); audited incl. clinician refusals + picker exclusion |
| ✅ | **Scribe T4 v1** (2026-07-21) — patient-facing forms via Courier secure links: envelope-first · frozen snapshot · hostile-proof sanitiser · form_response feed tiles · Send A Form sheet; fully audited (see bible) |
| ▢ | **Scribe T4.2** — consent library (curated) · consent-on-booking trigger (W2) · questionnaire analytics → Reports · payment hook (W4) |
| ✅ | **Body-Map v2 prototype** — a Scribe mode on REAL public-domain anatomical artwork (Earth & Bloom restyle): tap → numbered pins → structured sub-notes (site+note) · freehand Draw · Undo/Clear · saves as a typed body_map feed entry — 2026-07-04. **Fixed same day:** the figure's source transform was stripped → drew 625 units off-canvas (the blank map Roland saw) — restored |
| ✅ | **Template EDIT round-trip** — the structured answers ride the note's payload; the pencil restores the FORM (not just text) within the edit window; a hand-text edit honestly drops the answers (text becomes truth) — 2026-07-04 |
| ✅ | **Vitals °C/°F flip** — the Temp field carries its own unit toggle (default follows clinic country, US → °F); plausibility per unit (25–45 °C / 77–113 °F); **the value CONVERTS with the flip** (36.8 °C ⇄ 98.2 °F) — 2026-07-04 |
| ✅ | **Body-Map blank #2 (Safari)** — h-full/w-auto svg resolves to zero width in Safari; explicit aspect-ratio + floor height; figure render VERIFIED by screenshot — 2026-07-04 |
| ✅ | **Vitals hardening + Select width** — per-field sanitise + clinical plausibility (implausible BLOCKS Save; the '656565…' BP is impossible now) · Select menus cap at 320px — 2026-07-04 |
| ✅ | **Addendum law** — same author after the hour = Amendment · a DIFFERENT author = Addendum (pencil now on colleagues' notes; no strike on others' originals; tile tag · trail rows · audit action all name it truthfully) — 2026-07-04 |
| ✅ | **iOS mobile hardening** — h-screen → h-dvh platform-wide (Safari URL-bar trap) · text-size-adjust guard · consult/patients/dashboard verified at iPhone width by screenshot — 2026-07-04 |
| ✅ | **Structured tile rendering (URDS law)** — template notes format themselves on the tile (semibold headings + label rows via StructuredNoteBody, generic over parts — every future template inherits it) · body-map tiles show the annotated FIGURE · amend-original block keeps its line breaks · Status Trail tells the amendment LINEAGE (original ↔ amendments) — 2026-07-04 |
| ▢ | **Body-Map v2.1** — body-map as a TEMPLATE PART (inline in the aesthetics note — Roland's blend) · click-to-zoom regions + face close-up view (features: eyes/nose/lips) · photo underlay (Document Store bucket) · batch/lot on injection pins |
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
| ◐ | **RolDe Courier** | The clinical postal system (GREENLIT 2026-07-02) — **C1 ✅** (team-level unseen → the Status Dot carries it since Feed Tile v3) · **C2 ✅ 2026-07-04: Settings → RolDe Courier — the sending policy (secure-link default · typo guard · countersign · delegated sending · quiet hours · chase window, all audited via Change Describer + clinician-403 verified) + the ADDRESS BOOK (GP practices · pharmacies · labs · hospitals; soft-remove only; country-aware validation)** · **C3 ✅ 2026-07-04: OUTBOUND SENDING — Send sheet on every letter tile (GP-first · patient · Address Book · custom, Typo-Guard read-back) → dispatch + append-only journey (courier_dispatches/_events) → the ELEGANT RolDe-shell email carrying a secure capability link (PHI-minimal: the letter stays behind the token; platform `courier-letter` template, clinic-overridable) → public `/courier/view/[token]` viewer (envelope-first: a human's "Open Letter" IS the honest Opened signal — no pixels, scanners can't fake it) + the SAME URDS LetterPdf via the shared builder; the journey drives the tile's Status Dot ("Sent to…" blue → "Opened by…" green) + Trail + Activity Log; C2 gates live at send time (delegated/countersign/quiet-hours) — full E2E + negative-case verified** · C4 clinic↔clinic + Resend delivery webhooks + attachment mode ▢ · C5 chase/kill-switch ▢ |
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

*Last updated: 2026-07-21 v3 (**✅ Phase D SWEPT** — nine specialty/spa apps, steals registered in Bible 4.8 §15.7: the Photo Spine (ghost-overlay capture → compare → annotate, defines Body-Map v2.2) · GFE hard-stop gate (aesthetics pack) · Boulevard gap-aware self-book (Cadence) · ChiroTouch check-in outcome scoring · Zenoti/W4 spa-commerce blueprint. **Body-map zoom** verified working in Chromium + real WebKit (bare + app CSS) via standalone harness — mechanism sound; interaction-model upgrade (pinch/scroll/double-tap, no armed tool) PROPOSED to Roland. **Consult round open with Roland:** Courier menu in Scribe (name+contents+location), rich-text B/I/U/highlight + bubble-vs-rail placement, icon-only search+Layouts for the truncated patient name, Workup squircle change, chip colours; builds await his go. Phase E on his word.)*
