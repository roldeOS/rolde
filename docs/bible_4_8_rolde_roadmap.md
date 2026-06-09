# RolDe — Bible 4.8: Roadmap and Phasing

> *"Build small, ship early, learn fast, expand deliberately."* — Bible 0 §3
>
> Version 1.0 | Last Updated: 10 May 2026 | RolDe Ltd | CONFIDENTIAL
>
> Sequencing of every commitment across phases. Inherits from Bibles 0 v1.2, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6 v1.1, and 4.7.

---

## How to Use This Document

This Bible answers a single question: **what gets built when, and in what order?**

Every prior Bible has scattered phase signals — "Phase 1 ships X", "Phase 2 adds Y", "deferred indefinitely." This Bible consolidates those signals into a coherent timeline, cross-references them, and identifies the dependencies and decision points between phases.

This is **not** a project plan with dates. Dates depend on engineering velocity, clinical demand, regulatory trajectories, and Roland's bandwidth. This is a **logical sequence** — what must be true before the next thing starts, what gets unlocked by completing the previous thing.

**Loading order for Claude Code sessions**:
1. Bible 0 v1.2 — group defaults
2. Bibles 4.0 through 4.7 — RolDe sub-Bibles
3. This Bible 4.8 — roadmap

When in doubt about whether something belongs in Phase X or Phase Y, this Bible is the source of truth. If something here conflicts with another Bible, this one wins — and the other Bible should be updated to align.

---

## Table of Contents

1. The Phasing Philosophy
2. Phase 0: Foundation (Current State)
3. Phase 1: Launch
4. Phase 1.5: Multimodal AI
5. Phase 2: Scale
6. Phase 3: UK Regulated Hosting
7. Phase 4: NHS-Grade (Deferred Indefinitely)
8. The Cross-Phase Dependencies
9. The Decision Triggers Between Phases
10. The Per-Bible Phase Mapping
11. The Operational Sequencing Within Phase 1
12. The Risks And Mitigation Per Phase
13. The Constitutional Constraints On Phasing
14. The Roadmap Maintenance

---

## 1. The Phasing Philosophy

Three principles, inherited from Bible 0 §3 and the Bible 4.0 commitment to incremental commitment.

### 1.1 Phases Are Capability Boundaries, Not Calendar Dates

Each phase is defined by what becomes possible inside it, not by when it happens. Phase 1 happens when Phase 1's gating conditions are met — engineering complete, the first paying tenant ready to onboard, the AI server stable. It might be 6 months from now or 14; the criteria don't shift.

### 1.2 Each Phase Generates Revenue Or Validates Hypothesis

No phase exists purely to build infrastructure. Every phase produces tangible business value:

- **Phase 0** (current) generates revenue from Doc For Drivers and validates the platform thesis
- **Phase 1** generates revenue from the first multi-tenant deployment of RolDe
- **Phase 1.5** validates voice ambient AI and unlocks multimodal value
- **Phase 2** scales to multiple clinics and introduces the premium tier
- **Phase 3** unlocks enterprise-scale customers
- **Phase 4** (deferred) addresses NHS — deferred until economics justify it

### 1.3 Constitutional Commitments Don't Move Across Phases

Some things are non-negotiable from day one:
- Patient feed as canonical view (Bible 4.0 Principle 7)
- Drafts everything, sends nothing autonomously (Principle 4)
- Authority from sources, not voices (Principle 3)
- Honest about uncertainty (Principle 5)
- Tenant data isolation (Bible 4.1 §3)
- Audit log immutability (Bible 4.1 §5.4)
- Validated Correction Pipeline (Bible 4.7 §10)
- 48-hour shadow + 30-day rollback for AI updates (Bible 4.7 §18)

These exist in Phase 1 and never weaken. Phasing applies to what's added, not to what's compromised.

---

## 2. Phase 0: Foundation (Current State)

The state RolDe is in right now. Documented for clarity.

### 2.1 What Exists

- **Doc For Drivers Ltd** trading since Feb 2024
- **docfordrivers.com** (WordPress + LatePoint plugin) — operational booking site
- **GMC registration** — Roland actively practising
- **Roland's clinical knowledge** — 2+ years of driver medicals + general practice
- **Aesthetic training pathway commenced** — BAA Step 1 May 2025 onwards
- **mindate iOS app** — near-complete, beta-quality
- **Companies House registrations** — Doc For Drivers Ltd active, Doc For Skin Ltd pending, mindate Ltd pending
- **Domains owned via Cloudflare Registrar** — rolde.app, docforskin.com, docfordrivers.com, mindate.app
- **Hardware** — M4 Max MacBook Pro 48GB / 2TB
- **Tooling** — Cursor, Supabase, Vercel, Cloudflare accounts active
- **Knowledge corpus** — the Bibles (this document family) at 9 Bibles ~70,000 words

### 2.2 What's Missing For Phase 1

- RolDe codebase not started
- Doc For Skin Ltd not yet incorporated
- Doc For Skin clinical operations not yet active
- mindate not yet launched
- The brand assets (logos, design system rendered) not all complete
- HIS registration for Doc For Skin (deferred — practising privileges instead initially)

### 2.3 Phase 0 → Phase 1 Gate

Phase 1 begins when:
- [ ] All RoDee group Bibles complete (Bible 0 + 4.0–4.8 + 5 + 5.M + 6 + 6.M = ~12 Bibles)
- [ ] RolDe codebase scaffolded with at least the core modules (auth, multi-tenancy, patient model, calendar, feed, AI server)
- [ ] First tenant identified for production use (Doc For Skin — Roland self-onboards as the validating user)
- [ ] AI server operational on M4 Max with Gemma 4 31B Q4_K_M loaded
- [ ] First fine-tuning run completed against initial corpus (≥500 examples curated by Roland)
- [ ] Cloudflare Tunnel operational at ai.rolde.app
- [ ] Vercel deployment of web app at rolde.app responding
- [ ] At least one closed-loop referral test passes (Doc For Skin → external email)
- [ ] At least one prescription test passes (private pharmacy email delivery)
- [ ] Backup tier strategy operational (5 tiers per Bible 4.7 §6.5)

### 2.4 Phase 0 Activities (In Progress)

- Continuing Bible authoring (this Bible is one such)
- Companies House decisions on group structure
- Insurance research (clinical indemnity for aesthetic work, professional indemnity for the platform business)
- Trademark research (mindate UK trademark; RolDe trademark; RoDee group trademark portfolio)
- Practising-privileges conversations with Edinburgh aesthetic clinics
- Corpus curation (initial 500+ training examples, Roland-curated, source-citation-required)

---

## 3. Phase 1: Launch

The first deployable version of RolDe. The first paying tenant goes live. The first patients flow through the closed-loop referral pipeline.

### 3.1 Phase 1 Capability Set

| Capability | Bible Source | Notes |
|---|---|---|
| Multi-tenant authentication | Bible 4.3 §3 | Caretaker, Clinician, Locum, Nurse, Concierge, Cofferer, Patient roles |
| Tenant onboarding | Bible 4.3 §2 | Self-service for Caretaker; Roland onboards Doc For Skin first |
| Patient management | Bible 4.4 §2 | Demographics, allergies, alerts, search |
| Calendar and scheduling | Bible 4.4 §3 | Day/week/month/clinician views |
| Public booking widget | Bible 4.1 §10 | Embeddable; no JavaScript framework lock-in |
| Clinical notes / patient feed | Bible 4.4 §4 + Bible 4.6 | All 19+ feed entry types; Draft/Final workflow |
| Clinical orders (unified) | Bible 4.5 | Prescriptions, labs, radiology, procedures, referrals |
| Letters module | Bible 4.4 §5 | Referrals, discharge summaries, GP letters, sick notes |
| Closed-loop referral pipeline | Bible 4.4 §6 | All 6 steps including in-network and external email |
| OCR pipeline (Tesseract) | Bible 4.4 §7 + Bible 4.6 §6 | Phase 1 uses Tesseract; Phase 1.5 upgrades to Gemma 4 vision |
| Continuous patient monitoring | Bible 4.4 §8 + Bible 4.7 §12 | All 12 Phase 1 rules |
| Audit log surface | Bible 4.4 §9 + Bible 4.3 §5.12 | Caretaker + Custodian views |
| Notifications | Bible 4.4 §12 | Email + in-app; SMS optional per tenant |
| Print and export | Bible 4.6 §11 | PDF for letters/timeline; JSON archive for SAR |
| Search within documentation | Bible 4.6 §12 | Patient-scoped <200ms; tenant-wide audit-logged |
| Photo management (5-photo standard) | Bible 4.6 §4 | Doc For Skin enables; carousel + side-by-side compare |
| Stripe Connect payments | Bible 4.3 §4.6 | Patient pays clinic; 0% RolDe platform fee |
| Subscription tiers | Bible 4.3 §16 | Starter, Professional, Premium |
| Custodian admin | Bible 4.3 §6 | Cross-tenant management; AI management; correction queue |
| Custodian access notifications | Bible 4.3 §6.6 | Caretakers notified when RolDe Ltd accesses their data |
| AI ambient suggestions | Bible 4.7 §13 | Real-time cards in AI panel |
| AI direct queries | Bible 4.7 §14 | Reactive mode; citation-required |
| AI confidence indicators | Bible 4.7 §15 | Confidence bar on every response; "I don't know" pattern |
| AI-drafted referral letters | Bible 4.4 §6 | Closed-loop pipeline |
| AI-drafted discharge summaries | Bible 4.6 §8.7 + Bible 4.7 §17 | Background drafting; instant modal open |
| AI-augmented drug safety | Bible 4.5 §6 + Bible 4.7 §20 | Allergy + interactions + renal + pregnancy + CD compliance |
| Validated Correction Pipeline | Bible 4.7 §10 | Clinician → anonymise → Custodian review → corpus |
| Custodian Update Console | Bible 4.7 §11 | Models, corpus, correction queue, fine-tuning, promotions |
| 48h shadow + 30d rollback | Bible 4.7 §18 | Constitutional gate on model promotion |
| Backup strategy | Bible 4.7 §6.5 | All 5 tiers operational |

### 3.2 Phase 1 Tenants

- **Doc For Skin** — Roland self-onboards. Validates the full platform.
- **Doc For Drivers** — likely second tenant. Provides closed-loop referral testing.
- Possibly 1-2 additional friendly clinics (Edinburgh contacts) — small numbers, deliberate.

### 3.3 Phase 1 Performance Targets

- Active concurrent tenants: 3-5
- Concurrent AI sessions: up to 5 (M4 Max ceiling)
- Total monthly inferences: ~50,000-100,000
- Total monthly API calls (web app): ~500,000-1M
- Storage growth: ~10-30 GB/month across all tenants
- Backup tier integrity: monthly verification

### 3.4 Phase 1 Cost Profile

Per Bible 4.7 §22.1:

| Cost Item | Monthly | Annual |
|---|---|---|
| M4 Max amortised | £73 | £875 |
| Cloudflare (Tunnel + Registrar + DNS) | £0 | £0 |
| Vercel hosting | £0 (free tier) → £20 (Pro) | £240 |
| Supabase | £25 (Pro tier) | £300 |
| Resend (email) | £0 → £20 | £240 |
| Cloudinary or equivalent (photos/files) | £0 → £20 | £240 |
| Backup (encrypted cloud) | £8 | £96 |
| Domain renewals | £3 (£36/year) | £36 |
| **Total Phase 1 ops** | **~£150-200** | **~£1,800-2,400** |

Revenue at Phase 1 (3-5 tenants × £100-300/month average): £300-1,500/month.

Phase 1 is not designed to be highly profitable. It's designed to validate the platform, build the corpus, and establish the operational rhythm.

### 3.5 Phase 1 Risks

| Risk | Mitigation |
|---|---|
| AI server downtime affecting all tenants | Graceful degradation banner; clinical workflow continues without AI |
| M4 Max becomes Roland's working laptop bottleneck | Phase 2 trigger: when this happens, M5 Studio purchase justified |
| Initial corpus quality insufficient | Initial fine-tune run scored against held-out evaluation; if <90% threshold, more curation before launch |
| First tenant problems break confidence | Roland is the first tenant; he absorbs early problems before paying customers |
| Custodian admin work overwhelms Roland | Initial volumes manageable (low tenant count); scale-out is Phase 2 problem |

### 3.6 Phase 1 → Phase 1.5 Gate

Phase 1.5 begins when:
- [ ] Phase 1 stable for 3+ months (no major outages, AI quality acceptable)
- [ ] At least 5 active tenants OR Doc For Skin processing 100+ patient consultations/month
- [ ] At least one Validated Correction Pipeline cycle completed end-to-end (clinician submission → Custodian review → training corpus addition → next fine-tune)
- [ ] Backup tier strategy verified working (monthly integrity check passing for 3+ months)

---

## 4. Phase 1.5: Multimodal AI

Engineering work that adds significant value but isn't blocking initial launch.

### 4.1 Phase 1.5 Capability Additions

| Capability | Bible Source | Why Phase 1.5 |
|---|---|---|
| Gemma 4 multimodal OCR | Bible 4.6 §6.7 | Replaces Tesseract; significantly better for handwriting, low-quality scans, structured forms |
| Voice ambient AI | Bible 4.6 §9 + Bible 4.7 §16 | Substantial engineering: audio streaming, speaker diarisation, real-time transcription |
| Photo analysis (dermatological) | Future Doc For Skin extension | Lesion description, before/after AI annotation |
| Form field extraction (structured) | Bible 4.6 §6.7 | Lab reports, discharge summaries, DVLA forms — extract directly into structured feed entries |
| Per-user language LoRA training | Bible 4.7 §9 | Requires 100+ paired AI-edit examples per user; needs Phase 1 data accumulation first |
| Patient portal photo upload | Bible 4.6 §13 | Aesthetic patients want to share before/aftercare photos |
| Automated lab result urgency triage | Bible 4.7 §12 | Beyond simple thresholds — AI flags clinically significant patterns |

### 4.2 Phase 1.5 Performance Improvements

- Concurrent sessions ceiling raised (Q4 → Q4 with optimised inference; ~7-10 concurrent)
- RAG retrieval improvements (re-ranking, query expansion)
- Inference latency reductions (KV cache management; speculative decoding)

### 4.3 Phase 1.5 Cost Impact

Marginal cost increase: ~£20-40/month for the multimodal additions (mostly storage for retained audio per Bible 4.6 §9 retention policies).

### 4.4 Phase 1.5 → Phase 2 Gate

Phase 2 begins when:
- [ ] AI workload approaches M4 Max ceiling (5+ concurrent sessions becoming common, or Roland's working laptop visibly impacted)
- [ ] At least 10-15 active tenants OR Doc For Skin scaling to require dedicated AI capacity
- [ ] Premium tier customer demand exists (specific clinics asking for Claude API fallback)
- [ ] Roland has bandwidth to procure and deploy M5 Studio

---

## 5. Phase 2: Scale

Hardware upgrade + premium tier features. Operational scaling to multiple clinics.

### 5.1 Phase 2 Capability Additions

| Capability | Bible Source | Why Phase 2 |
|---|---|---|
| M5 Mac Studio dedicated AI server | Bible 4.7 §3.4 | Removes Roland's laptop as bottleneck; enables 20-30 concurrent sessions |
| Gemma 4 31B Q8 (full quality) | Bible 4.7 §2.2 | M5 Studio's larger VRAM allows Q8 instead of Q4_K_M |
| Claude API fallback | Bible 4.7 §19 | Premium tier feature; AI uncertainty triggers external API call |
| Patient portal mobile PWA | Bible 4.3 §5.8 | Beyond responsive web — installable mobile app via PWA |
| Push notifications | Bible 4.4 §12 | Phase 2 since requires PWA infrastructure |
| Clinic stock management | Bible 4.5 §3.5 | Inventory tracking for clinics that dispense in-house |
| Multi-clinic federation | Bible 4.0 §10 | Enhanced cross-tenant referral with bidirectional appointment confirmation |
| Pharmacy API integrations | Bible 4.5 §5.4 | Where pharmacy partners offer APIs |
| Advanced analytics dashboard | Bible 4.3 §6 | Beyond basic metrics; clinical outcomes tracking |
| Specialty-specific Bibles activated | Bible 5, 6, future specialty Bibles | Each new specialty = new structured forms + RAG corpus + monitoring rules |

### 5.2 Phase 2 Hardware

- **M5 Mac Studio** (estimated £5,000-7,000 when M5 ships)
  - 192GB unified memory typical configuration
  - Runs Gemma 4 31B at Q8 (33GB) plus all auxiliary services
  - 24/7 dedicated AI server (not Roland's working machine)
  - Located in Roland's primary office (or secure collocation if scaling further)

### 5.3 Phase 2 Tenant Capacity

- Active concurrent tenants: 10-30
- Concurrent AI sessions: 20-30 (M5 Studio ceiling)
- Total monthly inferences: ~500,000-2M
- Storage growth: ~50-150 GB/month across all tenants

### 5.4 Phase 2 Cost Profile

Per Bible 4.7 §22.2:

| Cost Item | Monthly | Annual |
|---|---|---|
| M5 Studio amortised | £104 | £1,250 |
| Existing Phase 1 infrastructure | £150 | £1,800 |
| Supabase scale-up | £100 | £1,200 |
| Backup costs | £20 | £240 |
| Claude API (premium tier reserves) | £200-£500 | £2,400-£6,000 |
| Cloudflare scale (R2 storage perhaps) | £50 | £600 |
| **Total Phase 2 ops** | **~£600-900** | **~£7,200-11,000** |

Revenue at Phase 2 (15-30 tenants × £150-400/month average): £2,250-12,000/month.

Phase 2 is where the business model demonstrably works. Margin starts becoming meaningful.

### 5.5 Phase 2 → Phase 3 Gate

Phase 3 begins when:
- [ ] M5 Studio approaching capacity (20+ concurrent sessions becoming common)
- [ ] 30+ active tenants OR specific enterprise customer requires data residency commitment
- [ ] Insurance / regulatory pressure to formalise infrastructure compliance
- [ ] Revenue justifies £300-1,500/month dedicated GPU hosting

---

## 6. Phase 3: UK Regulated Hosting

Move from on-premise (Roland's office M5 Studio) to dedicated UK GPU hosting.

### 6.1 Phase 3 Capability Additions

| Capability | Why |
|---|---|
| Dedicated UK GPU hosting | Compliance for enterprise clients; data residency commitments |
| Geographic redundancy | Multiple physical locations for disaster recovery |
| ISO 27001-aligned infrastructure | Path to formal certification |
| Bigger GPU footprint | Enables Gemma 4 70B or successor models if appropriate |
| Multi-clinic group support | Group of related clinics under one administrative umbrella with shared resources |
| White-label option | Some clinic groups want their own branding on top of RolDe |
| Public API for integrations | Read-only access for third-party reporting tools |

### 6.2 Phase 3 Hosting Options

| Provider | Approximate Monthly | Notes |
|---|---|---|
| **CWCS Managed Hosting** (UK) | £400-1,200 | Familiar UK provider; medical sector experience |
| **HOSTKEY UK** | £300-800 | Competitive GPU offerings |
| **Pulsant** | £500-1,500 | Premium UK provider; established |
| **AWS UK regions** | £600-2,000 | More expensive but predictable; broader ecosystem |
| **Microsoft Azure UK** | £700-2,000 | NHS-friendly familiarity |

Decision deferred to Phase 3 — depends on then-current pricing and the specific tenant mix at the time.

### 6.3 Phase 3 Constitutional Constraint

Even at Phase 3, the constitutional commitments hold:
- Training data still encrypted at rest with per-corpus keys
- Tenant data isolation still enforced via RLS
- Custodian-only AI promotion still required
- Patient feed remains canonical
- All other Bible 4.0 principles unchanged

The hosting upgrade changes operational scale, not constitutional behaviour.

### 6.4 Phase 3 → Phase 4 Gate

Phase 4 (NHS-grade) is **deferred indefinitely** per Bible 4.0 §4.5. The trigger for revisiting Phase 4:

- [ ] A specific NHS contract opportunity that justifies the investment
- [ ] An NHS framework agreement that significantly de-risks DSPT compliance work
- [ ] An NHS-adjacent enterprise customer (e.g. private hospital group) demanding NHS-equivalent compliance
- [ ] A regulatory environment that significantly reduces the cost of NHS-grade compliance

Until these trigger conditions are met, RolDe operates at Phase 3 maximum. RolDe explicitly does not pursue NHS contracts as a default growth strategy (Bible 4.0 §4.5 — principled deferral).

---

## 7. Phase 4: NHS-Grade (Deferred Indefinitely)

The infrastructure and compliance work to operate as an NHS-grade clinical system.

### 7.1 What Phase 4 Would Require

- **NHS DSPT (Data Security and Protection Toolkit)** annual certification
- **ISO 27001** formal certification
- **Cyber Essentials Plus** certification
- **Clinical Safety Officer** appointment + DCB0129/DCB0160 standards compliance
- **NHS Information Standards** for data exchange (HL7, FHIR, SNOMED CT)
- **Penetration testing** by approved NHS suppliers
- **Privacy Impact Assessment** for every data flow
- **Clinical risk management** under DCB0129
- **Data Processing Agreement** templates aligned with NHS standards
- **Sub-processor agreements** with all infrastructure providers compliant with NHS guidance

### 7.2 Phase 4 Cost Estimate

Initial Phase 4 setup: £150,000-500,000 (compliance work, certifications, clinical safety officer salary, penetration testing, etc.).

Annual Phase 4 ongoing: £80,000-200,000 (certification renewals, audits, dedicated compliance staff).

### 7.3 Why Phase 4 Is Deferred

Per Bible 4.0 §4.5:

> "RolDe deliberately does not pursue NHS contracts as a primary growth strategy. The compliance burden, contract complexity, and slow procurement cycles are misaligned with the platform's iterative development pattern."

The principled deferral isn't ideological — it's economic. NHS contracts are valuable but expensive to win, slow to deliver, and often demand customisation that drifts the platform from its core thesis. Private clinics, aesthetic medicine, GP practices, and adjacent enterprises offer faster validation cycles, cleaner economics, and constitutional alignment.

Phase 4 may eventually become viable. For now, RolDe focuses on private practice excellence.

---

## 8. The Cross-Phase Dependencies

Some Phase 2/3 capabilities depend on Phase 1 ground truth being established.

### 8.1 The Dependency Map

```
Phase 0 (foundation)
    ↓
Phase 1 (launch)
    ├── Multi-tenant foundation → enables Phase 2 multi-clinic scaling
    ├── Validated Correction Pipeline → enables Phase 1.5 corpus growth
    ├── Initial corpus + first fine-tune → enables Phase 1.5 model quality improvements
    ├── Doc For Skin clinical case data → enables specialty-specific RAG corpus growth
    └── Backup tier strategy → required for any Phase 2+ enterprise customers
    
Phase 1.5 (multimodal)
    ├── Multimodal OCR → unlocks Phase 2 advanced lab/imaging integration
    ├── Voice ambient AI → unlocks Phase 2 enterprise customer attractiveness
    ├── Per-user LoRA → enables Phase 2 personalisation at scale
    └── Form extraction → enables Phase 2 NHS-adjacent integration patterns
    
Phase 2 (scale)
    ├── M5 Studio → enables Phase 2 concurrent capacity
    ├── Q8 quality → enables Phase 3 enterprise quality requirements
    ├── Claude API fallback → enables Phase 3 premium-tier expansion
    └── Push notifications → enables Phase 3 mobile-first workflows
    
Phase 3 (UK regulated hosting)
    └── (Phase 4 trigger conditions monitored)
```

### 8.2 The Critical Path Items

These cannot be skipped or parallelised:

1. **Multi-tenant foundation** must precede any multi-clinic feature
2. **Validated Correction Pipeline** must precede any model quality improvements
3. **Backup tier strategy** must precede any production tenant onboarding
4. **48h shadow + 30d rollback** must precede any model promotion
5. **Custodian admin** must precede any cross-tenant operational work

---

## 9. The Decision Triggers Between Phases

When does Phase X transition to Phase Y? Specific triggers, not arbitrary calendar dates.

### 9.1 Phase 1 → Phase 1.5 Triggers

Multiple OR-conditions; any single trigger can initiate Phase 1.5 planning:

- [ ] AI quality plateau where multimodal would unlock next-tier improvements
- [ ] Patient demand for voice ambient AI (clinicians asking for it explicitly)
- [ ] Aesthetic clinic customer demand for photo analysis features
- [ ] Tesseract OCR quality limiting clinical workflow (handwritten notes from external clinics)
- [ ] Per-user LoRA training data accumulated to threshold (per Bible 4.7 §9.2)

### 9.2 Phase 1.5 → Phase 2 Triggers

- [ ] M4 Max load reaching 70%+ during normal working hours
- [ ] Concurrent session count regularly hitting 5-session ceiling
- [ ] Roland's working laptop unable to run other tools while AI is busy
- [ ] Tenant count exceeding 5-7 active concurrent
- [ ] Specific premium tier customer signed (Claude API fallback demanded)

### 9.3 Phase 2 → Phase 3 Triggers

- [ ] M5 Studio approaching 70%+ capacity
- [ ] Tenant count exceeding 25-30 active concurrent
- [ ] Enterprise customer requesting infrastructure compliance documentation that on-premise cannot satisfy
- [ ] Insurance underwriter recommending hosting upgrade for cyber liability
- [ ] Geographic redundancy required by customer commitments

### 9.4 Phase 3 → Phase 4 Triggers

(Deferred indefinitely per §7.3.)

- [ ] NHS contract opportunity worth £500K+ ARR
- [ ] NHS framework reducing DSPT compliance cost by 50%+
- [ ] Major NHS-adjacent enterprise customer demanding NHS-equivalent
- [ ] Regulatory environment changes that reduce compliance burden

---

## 10. The Per-Bible Phase Mapping

Quick reference: which capabilities ship in which phase, organised by source Bible.

### 10.1 Bible 0 (Group Defaults) — All Phases

The constitutional foundation. Always active.

### 10.2 Bible 4.0 (RolDe Manifesto) — All Phases

Constitutional principles. Always active.

### 10.3 Bible 4.1 (RolDe Architecture) — Phase 1+

| §1 — Self-hosted intelligence constitution | Phase 1 |
| §2 — Stack choices | Phase 1 |
| §3 — Multi-tenant foundation | Phase 1 |
| §4 — Authentication | Phase 1 |
| §5 — Data architecture | Phase 1 |
| §6 — Web/AI server separation | Phase 1 |
| §7 — Background jobs | Phase 1 |
| §8 — Storage | Phase 1 |
| §9 — Real-time updates | Phase 1 |
| §10 — Embeddable booking widget | Phase 1 |

### 10.4 Bible 4.2 (Design System) — Phase 1+

All Phase 1. Tokens, components, patterns. Future visual evolution at Phase 2/3 but design system is launch-ready.

### 10.5 Bible 4.3 (Multi-Tenant Foundation) — Phase 1+

| §1-2 — Tenant model + onboarding | Phase 1 |
| §3 — Lifecycle | Phase 1 |
| §4-5 — Roles + Caretaker admin | Phase 1 |
| §6 — Custodian admin | Phase 1 |
| §7 — Permissions | Phase 1 |
| §8 — Absences | Phase 1 |
| §9 — Configuration | Phase 1 |
| §10 — Pharmacy partners | Phase 1 (basic) → Phase 2 (API integrations) |
| §11 — Letter routing | Phase 1 |
| §16 — Subscription tiers | Phase 1 (Starter, Professional) → Phase 2 (Premium with Claude fallback) |

### 10.6 Bible 4.4 (Core Modules) — Phase 1+

All Phase 1. Patient management, calendar, feed, letters, closed-loop referrals, OCR (Tesseract), monitoring (12 rules), audit, search, print/export, notifications.

### 10.7 Bible 4.5 (Prescribing) — Phase 1+

All Phase 1 except:
- Pharmacy API integrations: Phase 2
- Clinic stock inventory tracking: Phase 2
- EPS integration (NHS): Phase 4 (deferred)

### 10.8 Bible 4.6 (Clinical Documentation) — Phase 1+

All Phase 1 except:
- Voice ambient AI: Phase 1.5
- Gemma 4 multimodal OCR: Phase 1.5
- Photo upload by patient via portal: Phase 1.5

### 10.9 Bible 4.7 (Ambient Clinical AI) — Phase 1+

All Phase 1 except:
- Voice ambient AI: Phase 1.5
- Multimodal OCR: Phase 1.5
- Per-user LoRA training: Phase 1.5
- Claude API fallback: Phase 2 (premium tier only)
- Q8 quantisation: Phase 2 (M5 Studio)
- M5 Studio dedicated AI server: Phase 2

### 10.10 Bible 5 (Doc For Skin — Clinic) — Phase 1+

To be drafted (after this Bible). Phase 1 launch as first paying tenant.

### 10.11 Bible 5.M (docforskin.com Website) — Phase 1+

To be drafted. Phase 1 launch.

### 10.12 Bible 6 (Doc For Drivers — Clinic) — Phase 1+

To be drafted. Already operating; migration to RolDe likely Phase 1 or early Phase 2.

### 10.13 Bible 6.M (docfordrivers.com Website) — Phase 1+

To be drafted. Modern redesign of existing WordPress site, integrated with RolDe.

---

## 11. The Operational Sequencing Within Phase 1

Phase 1 itself has internal sequencing. Not everything ships at Phase 1 day-one.

### 11.1 Phase 1 Sub-Phases

```
Phase 1.0 — RolDe Codebase Launch
   ↓
Phase 1.1 — Doc For Skin First Tenant Onboard
   ↓
Phase 1.2 — Doc For Drivers Tenant Onboard + Migration
   ↓
Phase 1.3 — First External Tenant Onboard
   ↓
Phase 1.4 — Phase 1 Stable + Phase 1.5 Planning
```

### 11.2 Phase 1.0: RolDe Codebase Launch

**Capability target**: Codebase scaffolded, AI server operational, single-tenant proof.

- Auth and multi-tenancy implemented
- Patient model + calendar + feed implemented
- AI server running with Gemma 4 31B Q4_K_M
- First fine-tuning run completed against initial corpus
- Backup tier strategy operational
- Cloudflare Tunnel + Vercel deployment live
- Roland (only) has access via dev tenant

**Duration estimate**: weeks (engineering-bound).

### 11.3 Phase 1.1: Doc For Skin First Tenant

**Capability target**: Roland onboards Doc For Skin as the first production tenant.

- Doc For Skin Ltd incorporated
- Practising privileges secured at Edinburgh aesthetic clinic (Blackford / Dr Victoria / The Face Clinic / Sarah Eve — TBD per Roland's negotiations)
- Doc For Skin tenant created in RolDe
- Service catalogue configured (procedures, fees, durations)
- Pharmacy partners configured
- First aesthetic patient consultation conducted in RolDe
- 5-photo aesthetic standard photographed and stored
- Closed-loop referral test passes (Doc For Skin → external GP email)
- Stripe Connect operational; first patient payment processed

**This is the first real validation. Roland uses RolDe for Roland's clinical work.**

### 11.4 Phase 1.2: Doc For Drivers Tenant + Migration

**Capability target**: Doc For Drivers migrates from WordPress + LatePoint to RolDe.

- Doc For Drivers tenant created in RolDe
- Existing patient data migrated (or fresh start with archived legacy data)
- DVLA Group 2 assessment forms configured
- Service catalogue configured (driver medical types)
- Existing booking flow re-routed to RolDe booking widget on docfordrivers.com (Bible 6.M provides the new website)
- Closed-loop referral pipeline tested with Doc For Skin (Doc For Drivers → Doc For Skin in-network)

### 11.5 Phase 1.3: First External Tenant

**Capability target**: A clinic Roland doesn't personally run goes live.

- An Edinburgh contact (private GP, aesthetic colleague, or specialist) onboards
- Caretaker self-service onboarding flow validates
- Real production usage by clinicians who didn't write the platform
- First Validated Correction Pipeline submission from external clinician
- First "real customer" feedback informs Phase 1.5 planning

### 11.6 Phase 1.4: Phase 1 Stable

**Capability target**: 3+ tenants stable; Phase 1 considered complete.

- Phase 1.5 planning begins
- M4 Max load profile understood
- Initial corpus size approaches Phase 1.5 thresholds
- Customer feedback compiled into Phase 1.5 requirements

---

## 12. The Risks And Mitigation Per Phase

### 12.1 Phase 1 Risks

| Risk | Mitigation |
|---|---|
| Engineering velocity slower than expected | Phase 1.0 has no fixed deadline; ship when ready |
| First tenant (Doc For Skin) finds critical bugs | Roland is the first user; bugs surface to Roland not paying customers |
| AI quality below acceptable threshold | Initial fine-tune scored against held-out evaluation; if below threshold, more curation before launch |
| Backup integrity issues | Monthly verification builds confidence before scaling |
| Custodian workload exceeds Roland's capacity | Phase 1 volumes manageable; scale concerns Phase 2 |
| Competitor launches first | RolDe's differentiation is the architecture (closed-loop referrals, validated corrections, agentic boundary) — copy-resistant |

### 12.2 Phase 1.5 Risks

| Risk | Mitigation |
|---|---|
| Voice transcription quality below useful threshold | Phase 1 fallback (third-party dictation) remains available; Phase 1.5 voice gated on quality benchmarks |
| Multimodal OCR doesn't significantly improve over Tesseract | Tesseract continues; Gemma 4 vision adoption gradual per measured improvement |
| Per-user LoRA over-fits to clinician preferences inappropriately | Scale parameter (0.5) limits LoRA influence; Custodian audits LoRA-affected outputs periodically |

### 12.3 Phase 2 Risks

| Risk | Mitigation |
|---|---|
| M5 Studio purchase before sufficient revenue | Phase 2 trigger conditions ensure demand exists; capital cost amortised over years |
| Premium tier demand insufficient | Premium tier defers Claude API costs; if demand low, premium feature stays optional |
| Multi-clinic operations overwhelm support | Initial scaling is gradual; Phase 2 includes operational headcount planning |

### 12.4 Phase 3+ Risks

Deferred. Specific risk planning happens at Phase 2 → Phase 3 gate review.

---

## 13. The Constitutional Constraints On Phasing

Some things cannot be moved between phases regardless of pressure:

### 13.1 Cannot Move Earlier (Premature)

- **Phase 4 (NHS-grade)** — explicitly deferred indefinitely per Bible 4.0 §4.5. No NHS pursuit before trigger conditions met.
- **Public API for third-party integrations** — Phase 3+. No public API in Phase 1/1.5/2 — security perimeter not yet ready.
- **White-label deployments** — Phase 3+. No white-label in earlier phases — brand consistency matters at small scale.

### 13.2 Cannot Move Later (Constitutional)

- **Patient feed as canonical view** — Phase 1 minimum. Cannot ship without.
- **Drafts everything sends nothing autonomously** — Phase 1 minimum.
- **Audit log immutability** — Phase 1 minimum.
- **Tenant data isolation** — Phase 1 minimum.
- **Validated Correction Pipeline** — Phase 1 minimum. Even at small scale.
- **48h shadow + 30d rollback** — Phase 1 minimum. Even with one model promotion ever.
- **Custodian transparency notifications** — Phase 1 minimum (Bible 4.3 §6.6).

### 13.3 Why These Constraints Hold

Constitutional commitments shipped at Phase 1 set the tone for the entire platform's trajectory. Compromising on any constitutional principle "until later" creates technical debt that compounds. The constitutional architecture is the architecture that scales — the more tenants the platform serves, the more important these guardrails become. Adding them at Phase 1 is cheaper than retrofitting them at Phase 2.

---

## 14. The Roadmap Maintenance

This Bible is itself a Phase-1+ artefact that evolves.

### 14.1 Maintenance Cadence

- **Quarterly**: Roland reviews this Bible against actual progress
- **At each phase gate**: this Bible updated to reflect phase transition
- **At significant pivots**: this Bible updated immediately (e.g. NHS contract opportunity emerging would update §7)
- **At major Bible additions**: this Bible's §10 mapping updated

### 14.2 Version History

- v1.0 (10 May 2026) — initial roadmap consolidation across Bibles 0, 4.0-4.7

---

## End of Bible 4.8

This Bible doesn't add new capabilities — it sequences the capabilities specified everywhere else. When in doubt about whether something belongs in Phase 1 or later, consult §10. When deciding whether to invest now or wait, consult §9. When tempted to compromise a constitutional commitment "for now," consult §13.

The next sub-Bible is **Bible 5 — Doc For Skin (the clinic itself)**. This requires interview before drafting. After Bible 5 comes **Bible 5.M — docforskin.com (the website)**, then **Bible 6 — Doc For Drivers (the clinic itself)**, then **Bible 6.M — docfordrivers.com (the new website)**.

— Roland Manoj Jayasekhar, with Devipangaj
RoDee, May 2026
