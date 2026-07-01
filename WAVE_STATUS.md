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
| ✅ | W1.1.14 Profiles & Avatars | | | |
| ✅ | W1.1.15 Who's Who glossary | | | |
| ✅ | W1.1.16 Commercial Settings + Tax | | | |

### W1.2 Patient Record — item breakdown
| Status | Item |
|:---:|---|
| ✅ | Consultation screen (4-card workspace: Feed · Orders · AI · Scribe) + break-glass + access log |
| ✅ | Clinical Notes feed (scrollable, filter/sort, edit/strike/amend, threading) + `patient_feed_entries` (~19 entry types) |
| ▢ | W1.2.1 Problem List (SNOMED-coded) · W1.2.2 Medication List + reconciliation · W1.2.3 History (PMH/surgical/family/social) |
| ▢ | W1.2.4 Document Store · W1.2.5 **Before/After + Body-Map** · W1.2.6 Digital Consents (e-sign) |
| ▢ | W1.2.7 Vitals/Growth charts · W1.2.8 Risk Scores (NEWS2/QRISK) · W1.2.9 Printable Summary |

## B. Named cross-cutting modules

| Status | Module | What |
|:---:|---|---|
| ▢ | **RolDe Connect** | Video consults (self-host LiveKit) |
| ▢ | **RolDe Covenant** | Relationships / marketing (W6.2) |
| ▢ | **RolDe Compass** | The day view — calendar + tasks (sidebar) |
| ▢ | **RolDe Cadence** | Recalls / reminders engine (W2.3) |
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

*Last updated: 2026-07-01 (universe mapped; building the spine in dependency order, starting with W1.2 Patient Record).*
