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
- v1.1 (11 Jun 2026) — §15 added: market-dive feature expansion + build sequence

---

## 15. Feature Expansion & Build Sequence (2026-06-11 market dive)

Added after a market dive across Epic/Cerner (In-Basket/worklists, patient lists,
results review), Pabau/AestheticsPro (memberships, before/after, recalls,
inventory, marketing), Medesk/Semble (templates, automation), and the clinic-KPI
literature. Roland approved **A + B + C in full**. This is the canonical feature
list and the **build sequence**; each item is tagged to its owning Bible.

### 15.1 The Dashboard = the clinician's daily cockpit (Bible 4.2 §6 expansion)

Split into **Action queues** (work waiting on *you* — Epic In-Basket model),
**Pulse** (KPIs), **Front-of-house**. Every queue card is actionable (click → the
item). Cards render only when their module exists — never faked.

**Action queues** — Results to review (labs/imaging unseen) · Scripts to dispense/
sign · Referrals in/out awaiting action · Documents to authorise (AI drafts) ·
**Pending-work list** (one unified queue, full width) · Unsigned/incomplete notes ·
**Recalls due** · Outstanding consents · Messages/tasks.
**Pulse tiles** — Today's appointments · Unpaid/outstanding · Revenue (today/MTD) ·
No-show rate · New patients · Active patients/retention.
**Front-of-house** — Today's schedule · Checked-in now · Recalls/birthdays today.

### 15.2 Per-page feature spec (folds into each module's Bible)

- **Patients list (4.4 §2):** saved segments, tags (VIP/plan), bulk actions
  (recall/message/export), merge duplicates, quick-view drawer. *(Universal ⌘K is
  the only search — APPROVALS §1.4.)*
- **Patient record / Consultation (4.2 §3, 4.4 §2, 4.6):** problem list, medication
  list + reconciliation, history (PMH/surgical/family/social), before/after photo
  slider, **face/body-map annotations**, care/treatment plans (multi-session),
  document store, vitals & growth charts, digital consents (e-sign), risk scores
  (NEWS2/QRISK), one-page printable summary.
- **Calendar (4.4 §3):** online booking widget (LatePoint shape), room/clinician
  views, automated SMS/email reminders + **recalls engine**, waitlist, recurring
  "course of treatment" series.
- **Prescribing/Orders (4.5):** drug DB + interaction/allergy/renal/pregnancy
  checks, favourites/order-sets, e-prescribe (or PDF + pharmacy partner), repeats.
- **Investigations (4.4 §7, 4.5):** ordering + inbound e-results, **result trends**
  (graph a value over time), abnormal flagging + seen/actioned tracking.
- **Letters (4.4 §5–6):** templates + AI drafts, closed-loop referrals, e-sign/send/track.
- **Billing (4.3 §4):** invoices/deposits, **packages & memberships**, **payment
  gateway options the clinic owns** (Stripe / PayPal / card — the clinic is the
  merchant of record; RolDe facilitates the connection but takes **0% fee** and
  never touches patient money — Roland 2026-06-13, Scenario 1, per 4.3 §4.6),
  aged debt, insurer billing.
- **Reports (4.3 §5, 4.4 §9):** financial, recall effectiveness, no-show/retention,
  cohort analytics.
- **Settings — Caretaker (4.3 §5):** services & pricing, rooms/hours, users/roles,
  branding + clinic-accent colour, patient-number config (prefix/start), note/
  letter/consent templates, integrations (pay/SMS/pharmacy), memberships config.

### 15.3 The "seriously elevates" set (Roland's ★ — approved)

1. Ambient AI woven everywhere (4.7) — the moat.
2. **Memberships & packages** (4.3 §4) — recurring revenue.
3. **Recalls + automated reminders** (4.4 §3) — retention + no-show lever.
4. **Before/after + body-map annotations** (4.6 §4) — Doc For Skin's core.
5. **Inventory with batch/expiry** (NEW — Bible 4.4 §13 to draft) — Botox/filler traceability.
6. **Clinic-owned payment gateways** (4.3 §4.6) — we provide the integration
   options; the clinic keeps 100%. RolDe earns from subscription, never patient
   payments (Roland 2026-06-13 — Scenario 2 rejected as a logistical/regulatory
   nightmare; we are NOT a payment facilitator).
7. **Unified worklist dashboard** (4.2 §6) — opened every morning.

### 15.4 BUILD SEQUENCE (the build list)

- **Wave 0 — DONE & live:** multi-tenant auth + RLS · patients + RolDe number ·
  consultation four-card workspace · clinical-notes feed (edit/amend/strike) ·
  allergies/alerts · Overview dashboard · patients data-table · the RDS.
- **Wave 1 — buildable NOW (real data, no new infra):** patient-record tabs
  (problem list · history · medication list · document store) · before/after +
  body-map · digital consents · patients saved-segments/tags/bulk/merge ·
  **Settings (Caretaker)** console · dashboard action-queue scaffolding.
- **Wave 2 — Calendar & front office:** scheduling + clinician/room views ·
  **online booking widget** · **recalls + reminders engine** · waitlist.
- **Wave 3 — Clinical orders:** prescribing + drug-safety · investigations
  ordering + results inbox + trends · letters + closed-loop referrals.
- **Wave 4 — Money:** billing · packages & **memberships** · **clinic-owned
  payment gateways** (Stripe/PayPal/card; clinic = merchant, 0% RolDe fee) · aged debt.
- **Wave 5 — Ambient AI:** AI server (Gemma on M4 Max) · ambient suggestions ·
  AI drafting · correction pipeline.
- **Wave 6 — Growth & ops:** inventory (batch/expiry) · marketing/CRM + reviews ·
  reports/analytics · patient portal · audit-log surface.

Tenant onboarding (4.3 §2) + the Custodian console (4.3 §6) build alongside Wave 1.

### 15.5 Planning-session decisions (Roland 2026-06-13) — additions to the sequence

These were decided in the 2026-06-13 planning pass and slot into the waves above.

- **Login Security Suite** (research-backed; Supabase-native). Splits two ways:
  - *Wave-0 hardening (do now, config-level):* invisible captcha (Turnstile),
    rate-limit + lockout, leaked-password protection (HIBP), strong password
    policy, email verification, conversational + non-enumerating error copy,
    **Forgot-Password flow** (DONE 2026-06-13). 
  - *Wave 1:* **passkeys/WebAuthn (primary)**, **TOTP MFA** (mandatory for
    Custodian + Caretaker), active **sessions/devices list + revoke**,
    new-device email alerts, MFA recovery codes, admin-initiated user
    deactivation, step-up re-auth for sensitive actions, role-scoped session
    timeouts, an **auth audit log**. (Custodian MFA already required — 4.3 §6.2.)
- **Legal & contact surface.** Login gets a discreet footer (Privacy · Terms ·
  Contact). Full acceptance (terms + DPA checkbox) lives in onboarding (4.3 §2).
  Pages to draft (counsel-reviewed before launch): Privacy Policy, **DPA**
  (separate from privacy), Terms of Service, Clinical Disclaimer, **Clinical
  Safety statement (DCB0129/0160)**, Acceptable Use, Cookie/processing notice.
  Hosted in the Legal & Safety surface (APPROVALS §8.2) + the marketing site.
- **THE WARD MAP** (greenlit + design LOCKED — Roland 2026-06-13). A beautiful
  spatial board on the dashboard: rooms the caretaker draws, with **beds/chairs
  rendered as RolDe cards** (the whole app is card-based, so a bed IS a card).
  The status colour fills the card; **click a card → the patient**; alerts glow
  live (Supabase Realtime). **Empty card → click to ASSIGN a patient**; doctors
  AND nurses can move/assign patients (nurses do the real-world rearranging). The
  **Map Editor lives in Caretaker Settings (caretaker-only)**. Fully label-FREE:
  the caretaker names rooms/positions ("bed/ward" or "chair/room") and re-labels
  as the clinic evolves (out-patient → in-patient) — RolDe never gates the
  terminology. Occupancy = whatever the clinic uses (manual assignment, admission,
  OR linked appointment). **Renderer-agnostic geometry** (rooms/positions on a
  normalized grid) → ships as an **elegant 2D top-down card board NOW**, with a
  **pastel glassy ISOMETRIC v2 later** (a new renderer over the same data, not a
  rewrite). Builds as a focused step right after a thin Wave-1 Settings shell,
  BEFORE the heavier waves. **Full locked design spec → §15.6.**
- **Payments — FINAL: Scenario 1 only** (Roland 2026-06-13). RolDe provides the
  gateway *options* in Caretaker Settings; the clinic connects its OWN
  Stripe/PayPal/card account (merchant of record); funds go direct; **RolDe
  takes 0% and never touches patient money or handles failed payments**.
  Scenario 2 (RolDe as processor with a cut) is **rejected** — payment-
  facilitator status is a logistical + regulatory burden not worth the
  commission. Resolves the old §4.6-vs-§15 conflict in favour of §4.6.
- **One-page website builder** = "Shopify/Webflow for clinics" (Wave 6, a PAID
  add-on — Roland 2026-06-13). Self-host the **Puck** core (MIT — we own our
  fork, zero reliance/fees; the "no free tier" is only their optional hosted
  product). Puck is React-native, so its blocks ARE RolDe components → the editor
  looks unmistakably RolDe. **Template-based, not freeform** (clinics wanting more
  pay for a "proper" site elsewhere — and still embed our plugin). Lives in
  Caretaker Settings → Website. The **RolDe Booking Plugin API** (embeddable
  widget) drops the booking form + payment (clinic's OWN gateway, Scenario 1)
  onto the site — internal OR external — so it all wires back into RolDe (the
  Wave-2 booking widget, made embeddable). **Custom domains, any registrar:**
  Caretaker Settings shows the exact CNAME (www/subdomain) + A record (apex)
  to paste at their provider, with per-registrar quick-links; RolDe auto-verifies
  DNS + auto-issues SSL (Vercel-for-Platforms pattern); status shows
  Pending → Verifying → Live 🔒.
- **Clinic name split** (Wave 1). Onboarding collects a **Display name** (sidebar,
  short, never truncates) + a **Legal/Full name** (invoices, letters). **Schema
  ALREADY supports this** — `tenants.name` (display) + `tenants.legal_name` (legal)
  exist from the foundation migration, so NO `display_name` migration is needed
  (corrected 2026-06-13 by reading the live schema). Remaining work: collect both
  at onboarding, add a Caretaker edit field (Settings → Clinic profile), wire the
  sidebar **footer** to `legal_name` (it currently shows `name` twice), and add a
  `tenants` caretaker-write RLS policy (only custodian can write tenants today).
- **Email system & templates** (Roland 2026-06-14). RolDe Ltd is a HIS vendor; transactional +
  auth email goes via **Resend** (the mindate family's provider — to be wired as Supabase's custom
  SMTP, replacing Supabase's dev-only built-in email; becomes a sub-processor in the legal docs
  once live). Email **templates** are managed in two places: **Custodian** side (platform/system
  emails — invites, password resets, notices) and **Caretaker** side (Settings → **Email
  Templates** — the operational emails a clinic sends its patients: reminders, results-ready,
  follow-ups, issue notices). **Operational / clinical comms ONLY — never business ads or
  marketing.** Volume scales with a clinic's patient load. WBS: W1.1.13 (Caretaker email templates)
  + W1.5.2 (Custodian email templates) + a W0/W1 hardening task to wire Resend.
  - **Architecture (Roland 2026-06-15): app-controlled email system, NOT Supabase auth templates.**
    Port mindate's proven pattern (verified by reading `mindate-admin/src/lib/email.ts` +
    `email-templates-seed.ts`): a code **seed** (canonical templates: slug + subject + structured
    body) → DB table `email_templates` → **Custodian dashboard editor** (Content → Emails, with a
    "Re-seed from code" button) → `sendTemplatedEmail()` sends via **Resend** with `{{variable}}`
    substitution → every send logged to `transactional_emails` (rendered-HTML snapshot) → a
    `/logs/emails` page. ALL emails (auth + operational) flow through this one system. For password
    reset specifically, since RolDe uses **Supabase Auth** (mindate uses its own JWT): a server route
    calls Supabase admin `generateLink({type:'recovery'})` to mint the secure link, then WE send the
    branded email via the template system — Supabase keeps the secure token, we own the email. **No
    pasting HTML into the Supabase dashboard.** (Superseded the earlier Supabase-auth-template
    approach — that was a drift; the brand shell design is preserved in the approved mockups.)
  - **Renderer: React Email** (Roland greenlit 2026-06-15) — built by Resend, used by Stripe/Vercel/
    Notion; templates as React/TS components, browser-previewable, battle-tested cross-client HTML.
    Content stays DB-stored + Custodian/Caretaker-editable; the React Email shell (code) renders it.
    Port mindate's dark-mode fix into the shell: off-white card (Apple-Mail-safe), class-tagged
    `@media (prefers-color-scheme: dark)` + Outlook `[data-ogsc]/[data-ogsb]` fallback, and BRIGHT
    dark body text (~#e8e0d4, ~10:1) — the muddy-tan unreadability was mindate's actual bug.
  - **Build chunks:** (1) **schema** ✅ 2026-06-15 — `email_templates` (platform/Custodian + clinic/
    Caretaker via `tenant_id` + RLS) & `transactional_emails` log (idempotency key, rendered-HTML
    snapshot); migration `20260615190000_email_system.sql`, types regenerated, RLS verified.
    (2) **send library** ✅ 2026-06-15 — `@react-email/components` + `resend` installed; the RolDe
    brand shell `apps/web/src/emails/RoldeEmailShell.tsx` (parchment, RolDe OS serif-fallback
    wordmark, coral ♥, mindate's dark-mode fix: class-tagged `@media` + Outlook `[data-ogsc]` +
    bright `#e8e0d4` body); `apps/web/src/lib/email.ts#sendTemplatedEmail` (DB content + `{{var}}`
    substitution → render → Resend → log) with ATOMIC idempotency (claim-a-queued-row-first);
    service-role client `lib/supabase/admin.ts`. Verified: tsc + lint + a 10/10 render smoke +
    Title-Case guard.
    (3) **auth emails** ✅ 2026-06-15 — platform seed (`auth_password_reset` + `auth_invite`,
    `emails/seed.ts` + re-runnable `reseedPlatformTemplates`); `POST /api/auth/forgot-password`
    (verifies Turnstile itself via `lib/turnstile-server.ts` since `generateLink` bypasses Supabase's
    captcha, mints the recovery link, sends our branded email, NO account enumeration); `GET
    /auth/confirm` (verifyOtp → session → redirect, open-redirect-guarded); login `onForgot` rewired
    off Supabase's `resetPasswordForEmail`. Also: proxy now passes `/api/*` + `/auth/*` through
    (self-gating, not page-redirected). **Verified end-to-end**: real branded email sent (Resend id
    + `transactional_emails` log + rendered snapshot), captcha gate blocks the no-token case (400),
    and the recovery link → `/auth/confirm` → `/reset` lands a usable Set-A-New-Password form. Keys
    added to `.env.local`: `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`. RolDe OS wordmark
    PNGs received (1800×400 transparent, `public/roldeos-{black,white}.png`) — wire the email-shell
    URLs after deploy.
    (4a) **Custodian console — first slice + Emails list** ✅ 2026-06-15 — `requireCustodian()` gate +
    `(app)/custodian/` layout; `(app)/custodian/emails` lists the platform templates (RLS:
    Custodian reads `tenant_id IS NULL`); `POST /api/admin/email-templates/reseed` (Custodian-gated)
    + "Re-seed From Code" button. Also added the app's first `not-found.tsx` (a real gap — `notFound()`
    was leaving the loader stuck). Verified: reseed gate **403** for non-custodians, 404 renders
    cleanly, tsc/lint/guard. *(Logged-in Custodian list UI needs a real custodian session to eyeball —
    the only custodian is `admin@rolde.app`, not yet a deliverable alias.)*
    (4b) **Per-template editor + live preview** ✅ 2026-06-16 — `(app)/custodian/emails/[slug]` with a
    two-column editor (`EmailEditor.tsx`): content fields (subject/preheader/headline/body-as-blank-
    line-paragraphs/CTA/footer/active) + a debounced **live preview** rendered through the real React
    Email pipeline (`POST /api/admin/email-templates/preview`), and **Save** (`PATCH
    /api/admin/email-templates/[slug]`). List cards link in. All three endpoints Custodian-gated
    (verified **403**); tsc/lint/guard clean. *(Custodian account renamed `admin@`→`custodian@rolde.app`
    — deliverable; logged-in editor UI is Roland's to eyeball.)*
    (5) **Logs + Caretaker clinic templates** ✅ 2026-06-16 — (5a) `/custodian/logs` surfaces
    `transactional_emails`; sidebar gains a Custodian "Platform" section. (5b) **Settings → Email
    Templates** (W1.1.13): per-clinic patient emails (appointment reminder / results-ready / follow-up
    defaults + one-tap "Set Up Default Emails"), scoped to the clinic from the session, Caretaker-gated
    setup/save endpoints; the shared `EmailEditor` (moved to `components/email`, now takes a `saveUrl`)
    + live preview serve both Custodian + Caretaker. **The whole app-controlled email system (Chunks
    1–5) is complete and deployed to production** (`rolde-web.vercel.app`, commits `54ee947`/`60e5a48`/
    `fe26cd7`). Email wordmark PNGs still pending an after-deploy URL wire; clinic→patient *sending* is
    gated by the Bible 0 §8.11 agentic boundary when those flows land (W2+).
  - **Email wordmark = design-needed:** RolDe OS PNG, light + dark (transparent), like mindate's two
    wordmark PNGs (email clients can't render SVG). Roland to export; serif-text placeholder until then.
  - **Parchment = the system paper (Roland 2026-06-15, DECIDED).** `#F0EFEB` is the default
    background for the **app shell / sidebar** (`--parchment` → `--sidebar`, done in globals.css)
    AND **every RolDe + clinic email** (Custodian platform emails + each clinic's patient emails) —
    *because the whole product is a clinical operating system; paper-calm by default.* A clinic's
    **Caretaker can override** the paper/email background with their own accent → **new W1.1.4
    setting** (sidebar tint + email background per clinic; default = parchment). **Lavender
    `#DCD9EA`** is the **front-facing website** accent only (Bible 8 §5.1 updated: parchment bg +
    lavender accents). The ♥ stays coral `#e0533f`. **Guardrail: paper/background only — never
    restyle buttons/fields.** Email auth-footer order (own lines, small): `Made with ♥ at RolDe` →
    `© <year> RolDe Ltd` → `Registered in England & Wales - 17210556` → `71–75 Shelton Street,
    Covent Garden,` / `London, WC2H 9JQ, UK` → tiny `Privacy · Terms · Contact` (the registered
    name + number + place of registration + office is a UK Companies Act 2006 / Trading Disclosures
    requirement on business email). Bibles updated: 4.2 §D.12.5, 8 §5.1, CLAUDE.md.
- **Stock / pharmacy / store management + the Cellarer role** (Roland 2026-06-14 — confirming
  the bible). Already wired: the **Chemist** role (pharmacist); pharmacy integrations — NHS /
  private / clinic-stock / paper-print (Bible 4.5 §5.4, Phase 2) with `clinic_stock` prescription
  routing; and **Inventory with batch/expiry** (Wave 6 / W6.1 — detailed spec is Bible 4.4 §13,
  still "to draft"). The stockist role IS named + locked: **Cellarer** — "the medieval officer of
  the stores; keeps stock + supplies" (role-taxonomy *backlog*; joins the `user_role` enum
  pre-launch when a clinic needs it). Roland's refinement to build into the W6 inventory module:
  the **Caretaker** adds + manages Pharmacy + Store from new Caretaker Settings sections, and a
  **Cellarer** logs into a **scoped stock-only area** (add/manage stock — medicines + other items;
  RLS-restricted to that area, no clinical/patient access). Draft Bible 4.4 §13 first; activate
  the Cellarer enum value + RLS when built.

### 15.6 Ward Map — locked design spec (Roland 2026-06-13)

Approved and LOCKED in the 2026-06-13 design pass. This is what we build to.

**The position card (bed = chair = one card).** The same card renders a bed or a
treatment chair; only the top-left type label differs (`bed 06` / `chair 03`).
Pure RolDe card: **no border, soft float-shadow, black readable text**, and the
**whole card takes the status colour** (bold + scannable across a ward). Anatomy:
- **Top-left:** small type label (`bed`/`chair`) over a **bold position number**.
- **Top-right (beside the ⋮ menu):** the **patient identifier** — region-aware
  label (**CHI** Scotland · **NHS No.** England · **MRN** private), with room for a
  full 10-digit number. The caretaker can add **prefixes/suffixes** to the hospital
  number (e.g. `DFS-00042`). The **⋮ three-dot menu** sits in the corner.
- **Name:** bigger/bolder, with a **fixed left edge** — it never shifts whether or
  not there are adornments, so the eye always lands in the same place.
- **DOB · age line**, with an **Allergies pill** slotted beside it (red, shown only
  when the patient has allergies) — the fastest stop-and-check cue on the card.
  (An allergy *pill* beside the DOB, NOT a leading dot — the name's left edge stays
  put.)
- **Dynamic pill row (bottom):** **RolDe's live signal channel** — whatever the AI
  is surfacing *right now* (e.g. `Results Back`, `Meds Due`, `Obs Overdue`, `Risk
  Rising`…). Pills appear/vanish on their own; a stable patient shows none. Labels
  are **Title Case** (APPROVALS §2.3) and **instantly clear or they don't ship**
  (see the design law below).

**The builder element kit (functional only — props dropped).** 1 Bed card ·
2 Treatment-chair card · 3 Nursing station (a labelled room) · 4 Room (resizable
rounded rectangle) · 5 Wall/partition (extendable straight line) · 6 Door ·
7 Window · 8 Zone/area (soft tinted region) · 9 Text label. (Privacy curtain, sink,
standalone desk were cut — the bed/chair are the only "position" cards; everything
else is structure the caretaker draws.)

**The colour code (most-urgent status wins the card; extensible).**
🔵 blue/slate = empty · 🟢 green = stable · 🟠 amber = needs review (obs due,
results back & unreviewed) · 🔴 red = clinical alert, **pulsing red = emergency** ·
🟣 purple = medication due.

**Move & transfer.** The ⋮ menu offers: open patient · move within ward · transfer
to another ward · discharge. **Within a ward: drag the card** to another room.
**Across wards: the transfer modal** — pick the destination ward → it shows *that*
ward's empty beds → confirm. No cross-canvas drag, so no patient lands in the wrong
building by accident.

**Clinical gates (caretaker-configurable, PER CLINIC).** Sensitive actions are
**gated behind a sign-off chain the Caretaker defines per clinic**. Locked first
example — **Discharge · free the bed** is dead/greyed until: ① the discharge
decision is documented in the clinician note → ② RolDe drafts the discharge letter
→ ③ the doctor **signs it off** → only then does the bed release. Same machinery
takes more gates later (e.g. pharmacy signs off the medications before a report
counts as valid) — Roland supplies the full list after the major builds.

**Design law governing all of the above (Roland 2026-06-13 — permanent).**
*If Roland and Jarvis don't grasp it at a glance, a stranger never will — cut it or
make it instantly clear.* If a feature needs reaching/explaining, people won't use
it. **Good design is forgotten in the shadows — the user just experiences it.**
(This is why "Sign note" was cut: unclear to the founder = unclear to everyone.)

### 15.7 Build Register — the addressable WBS (Roland 2026-06-13)

Every build item has a stable ID: **`W{wave}.{module}.{task}`** (e.g. `W0.1.3`). Use the ID to
greenlight or report. **Two rules Roland locked 2026-06-13: (1) waves complete IN ORDER — finish
Wave N before any Wave N+1 work; (2) nothing is deferred or left half-built — every item is built
properly when its turn comes.** `✅` = done & verified. This register supersedes the §15.4 bullet
list for addressing/tracking; §15.4 stays as the narrative.

**W0 — Foundation Hardening** *(must finish before W1 continues)*
- **W0.1 Login Security Suite** — W0.1.1 Conversational, non-enumerating errors ✅ · W0.1.2
  Forgot-Password → Reset flow ✅ · W0.1.3 Invisible captcha (Cloudflare Turnstile) ✅ *(wired into
  sign-in + password-reset, managed mode, single-use token reset per attempt; verified 2026-06-13)*
  · W0.1.4 Auth rate-limit + lockout ✅ *(Supabase Auth → Rate Limits reviewed & retained 2026-06-15:
  emails 30/h · sign-ups+sign-ins 30/5min·IP · token verifications 30/5min·IP · token refreshes
  150/5min·IP. ⚠ both per-IP limits are **per source IP** — raise the sign-in limit before a clinic on
  a single shared NAT goes live, and raise the email limit before bulk staff onboarding)*
  · W0.1.5 Leaked-password protection (HIBP) — ⏳ **LAUNCH GATE**: Supabase's HaveIBeenPwned check needs
  a **Pro plan** (unavailable on Free); enable before production / real patient data. Until then the
  W0.1.6 class requirements + 12-char minimum are the compensating control.
  · W0.1.6 Strong-password policy ✅ *(server, set 2026-06-15: min length 12 + required classes
  lower/upper/digit/symbol. Client mirror: live strength meter `apps/web/src/lib/password.ts` driving
  the `/reset` bar — shows what's still missing, then Good/Strong; tsc/lint/logic verified)*
  · W0.1.7 Email verification on signup *(fully lands with W1.5.1 onboarding)*
- **W0.2 Legal & Contact Surface** — W0.2.1 Legal & Safety page + versioning + 5 scaffold docs ✅
  · W0.2.2 DPA ✅ · W0.2.3 Acceptable Use ✅ · W0.2.4 Cookie/processing notice ✅ *(all 3 added to a
  shared `lib/legal` source the in-app surface + public pages both read — surface now 8 docs; and
  all 8 written as substantive drafts, then upgraded to a real **v1.0 ("In Force")** ONE PER
  SESSION — RolDe drafts them itself, not counsel (Roland 2026-06-14). Researched against UK
  GDPR/DPA 2018 (Art. 9(2)(h)/Sch.1, Art. 22A), Art. 28, DCB0129/0160 + PECR/DUA Act 2025;
  `[to be added]` only for facts RolDe supplies. **ALL 8 docs v1.0 In Force (complete 2026-06-14):
  Privacy Policy (16 sections), Terms of Service (17, liability cap 12-months-fees / £25k floor),
  Data Processing Agreement (14, Art. 28(3) + Caretaker/DCB0160), Clinical Disclaimer (11,
  automation-bias + UKCA/MHRA), Clinical Safety Statement (10, DCB0129 + CSO Dr R.M. Jayasekhar
  GMC 7537707), Acceptable Use Policy (10, responsible disclosure + patient-data), Cookie &
  Processing Notice (9, strictly-necessary + PECR/DUA Act), Ambient-Capture Consent (10, Art. 9 +
  children/capacity + controller/processor)** — the whole legal surface is v1.0, each verified.
  Open facts for RolDe to fill: ICO reg no., the £ liability floor if changing £25k. Contacts:
  `privacy@` (data protection), `safety@` (clinical safety), `team@` (general
  + auth-email sender via Resend custom SMTP — send pipeline confirmed 2026-06-14, email id
  032aba38))* ·
  W0.2.5 Login footer: Privacy · Terms · Contact ✅ *(links to PUBLIC `/policy/[slug]` pages —
  proxy allowlisted; ALSO fixed the latent `/reset` gating bug in the same pass; verified
  logged-out public render + gating still enforced for app routes 2026-06-13)*
- **W0.3 UI Standards** — W0.3.1 Title Case + card-squircle standards LOCKED (APPROVALS §2.3/§9) ✅
  · W0.3.2 Title Case sweep of existing surfaces ✅ *(dashboard, patients, legal, login, reset,
  shell — verified 2026-06-13)* · W0.3.3 `check-title-case` CI guard ✅ *(component-aware port,
  wired into `build`; immediately caught + fixed 3 missed labels — breadcrumb "New Patient",
  save-pill "Couldn't Save", "Terms Of Service"; verified 2026-06-13)* · W0.3.4 Lint health ✅
  *(`tsc` + `eslint` both clean; `PatientsTable` SortHead lifted to module scope — fixes
  react-hooks/static-components; the React-Compiler-only `set-state-in-effect`/`refs` rules set
  off in eslint.config with rationale, as RolDe isn't using the Compiler; NB Next 16 no longer
  lints during `build`, so these never blocked deploys — corrected 2026-06-13)*

**🚦 Pre-Launch Gates** *(do NOT need doing now — tick just before production / first real clinic
with real patient data; parked here so nothing is forgotten)*
- [ ] **Supabase Pro + leaked-password (HIBP) ON** — enable "Prevent use of leaked passwords"
  (needs Pro, ~$25/mo). This is W0.1.5.
- [ ] **Drop the password class-composition requirement** — once HIBP is on, switch Supabase
  Auth → Providers → Email "Password requirements" back to *no required classes* (NCSC
  "long beats complicated"), and update `apps/web/src/lib/password.ts` + the `/reset` meter in
  the SAME pass to length-only. The classes are only an interim compensating control while HIBP
  is unavailable.
- [x] **Raise auth rate-limits for clinic scale** ✅ *(done early 2026-06-15 — Roland set them
  ahead of launch so a real clinic signup never hits the ceiling)*: sending emails **100/h**,
  sign-ups+sign-ins **100 / 5 min**, token verifications **60 / 5 min**; token refreshes 150/5 min
  left as-is. All per-IP; captcha is the real brute-force defence so the headroom is safe.
- [ ] **Security headers audit** — confirm CSP, HSTS, X-Frame-Options, Referrer-Policy on all
  responses (this, not the soft-404 status, is the real "industry standard" hygiene item).
- [ ] **ICO registration number** — slot the real number into the legal docs once it lands.
- [ ] **Liability floor** — confirm or change the £25k floor in the Terms (currently
  12-months-fees / £25k).

**🌐 Custom-domain (rolde.app) cutover** *(do the moment we point the app off `rolde-web.vercel.app`
— Roland 2026-06-16 "tell me when we're good enough to go to rolde.app"; everything here breaks
silently if missed)*
- [ ] **Vercel** — add the custom domain (`rolde.app` or `app.rolde.app`) to the project + verify DNS.
- [ ] **Resend webhook URL** — Resend → Webhooks → edit the endpoint to `https://<new-domain>/api/webhooks/resend`. *(Signing secret unchanged; one field.)*
- [ ] **Cloudflare Turnstile** — add the new hostname to the widget's allowed-hostnames list (else the invisible captcha fails on the live login).
- [ ] **Supabase Auth → URL Configuration** — set the **Site URL** + add the **Redirect URLs** for the new domain (reset/invite links resolve against these; wrong = broken `/auth/confirm`).
- [ ] **Any hardcoded origin** — confirm links are built from `request.url` origin (they are today), not a baked-in `rolde-web.vercel.app`.
- [ ] **Re-verify the full reset flow** end-to-end on the new domain before announcing.

**W1 — Clinic Core** *(buildable now; resumes once W0 is complete)*
- **W1.1 Settings (Caretaker) Console** — W1.1.1 Hub shell + registry + scaffold + access gate +
  skeleton ✅ *(built ahead of W0 — acknowledged; W0 finishes first now)* · W1.1.2 Clinic Profile ✅
  *(2026-06-16: Settings → Clinic Profile form — Identity (name, legal name), Contact (email, phone,
  4-line address), Registrations (ICO/CQC/HIS); migration `20260616120000_clinic_profile.sql` added the
  contact/address columns + a **column-scoped caretaker-write path** — `tenants_caretaker_update` RLS
  (is_caretaker_of) row-scopes, and a column GRANT hard-limits `authenticated` UPDATE to the 11 safe
  fields so billing/lifecycle columns (subscription_tier, status, slug…) are unreachable even via raw
  PostgREST; anon lost UPDATE entirely. Endpoint `/api/settings/clinic-profile` whitelists + requires
  name/legal_name. Verified end-to-end: forbidden `subscription_tier:'enterprise'` ignored, empty name →
  400, save/clear round-trip. **Logo deferred to W1.1.4 Branding** where visual identity lives.)* ·
  W1.1.3 Ward Map editor · W1.1.4 Branding & accent + clinic logo *(incl. the parchment override: per-clinic
sidebar/paper tint + email background — default parchment, Caretaker may switch to their accent)* ·
W1.1.5 Patient
  numbering · W1.1.6 Rooms & hours · W1.1.7 Users & roles *(invite-link onboarding: Caretaker invites by email + role; the user sets
their OWN password via a single-use link — the same `/reset` screen + checklist; the Caretaker can
also trigger a password-reset link for any user under them. Nobody ever sets anyone else's
password. **Soft-revoke, never delete (LOCKED, Roland 2026-06-16):** access = revocable clinic
membership (`tenant_users.status` + optional **expiry**, e.g. a Locum given access for a set
period); the login is NEVER deleted, so every record that user authored keeps a valid author — no
orphaned/empty DB reference. A user with no active membership + not a Custodian gets the **"No
Workspace Yet"** screen (built; `components/NoWorkspace.tsx`).
**Time-limited access (Roland 2026-06-16, write-in):** when a Caretaker grants access they set an
**access window** — indefinite, *until a date* (e.g. a doctor on a 3-month probation), or a
*from–to* span (e.g. a Locum for 48h across 29–30 Aug, 2 months out). Schema:
`tenant_users.access_starts_at` / `access_ends_at` (nullable = indefinite). Access lapses **by time,
not a cron** — the membership query gates on `status='active' AND (access_ends_at IS NULL OR
access_ends_at > now()) AND (access_starts_at IS NULL OR access_starts_at <= now())`, so an expired
Locum simply lands on No Workspace with their notes intact. UI: the Users list shows each person's
window as a calm badge (`Indefinite` · `Until 30 Nov` · `Locum · 29–30 Aug` · `3 months left`),
editable by the Caretaker.
**Chunk 1 built ✅ (2026-06-16, verified live):** Settings → Users & Roles shows the
Caretaker the clinic's STAFF ROSTER (warm-tinted avatar, name + designation, role chip,
`Prescriber` flag, access-window badge, email). Schema: `tenant_users.access_starts_at` /
`access_ends_at` + `tenants.country`. `getSessionContext` now gates the membership on the
window, so access lapses BY TIME — verified the negative case: an expired Locum lands on
"No Workspace Yet", login + authored records intact. `lib/accessWindow.ts` is the badge.
**Chunk 2 built ✅ (2026-06-16, verified live):** the write path. An "Invite Teammate"
modal (email + role + designation + job title + licence [type auto-suggested from the
clinic country + role] + prescribing + access window) → creates the login if new + the
membership + the onboarding set-password email. Each row's ⋯ menu: Edit (same shared
fields, pre-filled), Send Reset Link, and Suspend/Restore (soft-revoke = the schema's
`suspended` state, never a delete). Self-lockout guards: a Caretaker can't suspend or
demote themselves. Verified every path end-to-end (incl. both negative cases). **Open
naming Q for Roland:** the soft-revoke state is `suspended` in the schema, so the UI says
"Suspend/Suspended" — if he'd rather it read "Revoke", align the DB value too.
**Next (chunk 3):** Concierge inline add-patient + payment; add-patient for all-but-Cofferer.
Then chunk 4: per-patient-access audit log. Legacy `gmc_number/gdc_number/nmc_pin` columns
✅ retired (migration `20260617130000`; superseded by `license_type/number`).
**Seamless onboarding email (Roland 2026-06-16, write-in):** the moment a Caretaker creates a user,
RolDe emails them — their role, the clinic, **how long they have access**, and a single-use
**set-password link** (the `/reset` screen). One step from invite to in.
**Per-role gating ✅ (2026-06-16, built + verified):** `lib/access.ts` maps each module to its roles;
the nav filters AND every clinic page guards (`requireModuleAccess`) — verified the negative case
(Concierge → /prescribing blocked, Cofferer → /patients blocked). **The access rules (Roland's detailed
spec, 2026-06-16):** Caretaker = God for the clinic. The clinical roles (Curator, Clinician, Clinician-
Locum, **Clinician-Practitioner** [NEW: nurse/ANP/diabetic/physio practitioners], Nurse, Chemist,
Cunnere) get EQUAL access to all medical records + notes. **Concierge** = front desk: patient list +
records (to print) + calendar + billing; NO labs/requests/prescribing; can add a patient + take a
payment inline. **Cofferer** = accounts only (billing/invoices — who's paid what); not even the patient
list. **CodeWright** [NEW] = all areas for support, but NO prescribing / test-ordering, and every
patient-record access logged. **Prescribing is a caretaker-set gate, NOT a role** (`canPrescribe` +
`prescribing_rights`): even a doctor can't prescribe without the caretaker ticking "is a prescriber"
(a medical student, say). **Add-Patient** is available to every role EXCEPT Cofferer; **every
patient-record access is audit-logged, every time** (the Audit log tab in Logs). New roles
`practitioner`/`codewright` added to the user_role enum.
**Profile / identity (W1.1.7 build — schema added 2026-06-16):** each user has — `preferred_name` (the
name shown in the Clinical Note; if blank, falls back to "<designation> <surname>", e.g. "Dr
Jayasekhar"), `designation` (Dr/Mr/Ms/Nr — **set by the Caretaker, the user can't change their own**),
`job_title` (free text, e.g. "Advanced Diabetic & Physiotherapy Practitioner"), and `license_type` +
`license_number` (GMC/NMC/GDC/GPhC/HCPC… — the TYPE **auto-populates from the clinic's country**, the
number is what the person holds — a GMC doctor needn't be UK-born). All entered/edited in the Users &
Roles screen.)* · W1.1.8 Services & pricing **(v1 ✅ flat list; v2 ✅ 2026-06-18):** category
  grouping + service **code** + **conditional VAT & deposit per service** that only appear when those
  switches are on in **Commercial Settings**. This is the catalogue the **booking widget + billing**
  read. *(Service **type** — one-off / course / membership — was pulled back out 2026-06-18: a bare
  type label with no management behind it created ambiguity; it returns with **W1.1.10 Memberships &
  Packages** where courses/memberships are actually managed. All fields use themed components, never
  native controls — MISTAKES #7.)* · W1.1.9
  Templates · W1.1.10 Memberships & packages · **W1.1.11 Integrations** *(Money & Growth; gateways
  greenlit 2026-06-18)* — **clinic-owned payment gateways**: Stripe · PayPal · Klarna · Clearpay
  (BNPL), each a **toggle the clinic turns on with their OWN API keys**, plus a **live / sandbox
  (test) switch** per gateway so they trial then flip to live. **RolDe takes 0% and never touches the
  funds** (money settles clinic-account → clinic), so no settlement/PCI liability sits on us; secret
  keys are write-once (shown as `•••• last4` + Replace, never read back — like a Vercel Sensitive
  env). Also SMS + pharmacy partners. · W1.1.12 Website & domain
  (entry) · W1.1.13 Email Templates (operational clinic→patient emails; Resend-backed; Custodian
  platform emails live in W1.5.2) · **W1.1.16 Commercial Settings** *(NEW, greenlit 2026-06-18)* — the
  money-policy **toggles hub** in Money & Growth: **VAT** (on + rate) · **Deposits** (on + default) ·
  **Consultation Credit** (on + amount + label — credit-on-account, auto-applied to the patient's next
  treatment) · **Discount Codes** (on). **Each detail field appears ONLY when its switch is on** — a
  VAT-free, deposit-free clinic sees a clean page. These switches GATE the conditional fields in
  Services v2, the booking widget, and billing. (`clinic_commercial_settings`, one row per tenant;
  Caretaker-write via `is_caretaker_of`.)
  **→ Tax v2 — UK-VAT generalised to GLOBAL Tax. ✅ BUILT 2026-06-21 (Roland greenlit).**
  Hardcoding "VAT 20%" excluded the global market. Research (HMRC + Avalara/Stripe Tax/Chargebee +
  India GST / US sales tax / AU GST) → Tax is now fully **configurable**: a **name** (VAT · GST · Sales
  Tax · Tax — defaulted by clinic country via `lib/tax.ts`, then editable) · an **editable rate** (20→25%
  is one field) · a **tax registration number** (VAT no. / GSTIN, for invoices) · **tax-inclusive vs
  tax-exclusive** pricing (the Services modal does the right gross-price maths each way). The
  **per-service taxable/exempt** toggle stays — it's UNIVERSAL: cosmetic = taxable, therapeutic/medical
  = exempt (UK/US/AU/IN all draw this line; HMRC actively enforces it, e.g. *Illuminate Skin Clinics v
  HMRC* 2025). **Deep rename done all the way down** (migration `20260621150000_tax_v2.sql`, live):
  `vat_enabled`→`tax_enabled` · `vat_rate_bps`→`tax_rate_bps` · per-service `vat_exempt`→`tax_exempt`,
  the rate's CHECK constraint renamed too, + new `tax_name` · `tax_registration` · `tax_inclusive`.
  No "VAT" identifier anywhere — only "VAT" as one configurable name among GST/Sales Tax (verified).
  Verified live: Commercial Settings saves the tax config; the Services modal reflects the name + rate +
  inclusive/exclusive; tsc + title-case clean. Historical migrations keep their original `vat_` text
  (immutable migration history); the live schema + all code are `tax_`.
- **W1.2 Patient Record Tabs** — W1.2.1 Problem list · W1.2.2 Medication list + reconciliation ·
  W1.2.3 History (PMH/surgical/family/social) · W1.2.4 Document store · W1.2.5 Before/after +
  body-map · W1.2.6 Digital consents (e-sign) · W1.2.7 Vitals/growth charts · W1.2.8 Risk scores
  (NEWS2/QRISK) · W1.2.9 One-page printable summary
  - **W1.2 Consultation design refinements (LOCKED + greenlit, Roland 2026-07-01; APPROVALS §4.1–4.3).**
    Built on the existing consultation screen + Clinical Notes feed (already done); keep the doctor on
    **one page** ([[design-invisible-instant-clarity]]). **Status sweep 2026-07-02:** ✅ BUILT — Workup
    rename (deep) · Letters→feed + the official LetterPdf (audited, export_log artifact) · the URDS Feed
    Tile standard (v2: Unseen/Read anchor top-right · time bottom-centre · Read-by popover) · the record
    data layer (patient_problems + patient_medications, SNOMED-ready) · **Snapshot** (name-drop sheet:
    allergies pinned-full · PMH · meds, counted + scrollable) · **Episode Marker** ("Today" v1) ·
    **Courier C1** (read receipts). **The view is named: "Consult" in chrome · "Consult Room" in prose
    (LOCKED 2026-07-02)** — the topbar island reads "Consult · <patient>". **✅ LAYOUTS BUILT 2026-07-03:**
    the topbar **"Layouts" menu** (replacing Consult/Document/Review, which is fully retired — code +
    localStorage key) lists **Default** + the user's **named layouts** (save-as · remove); **three drag
    dividers** (one column + the ONE shared row split, visually symmetric); **double-click a divider =
    Default**; persisted per user (`rolde:layout`/`rolde:layouts`); the composer's focus-grow removed —
    **the layout never moves on its own** (APPROVALS §4.2); dividers are lg+ only (tablet/mobile stays
    stacked). **Refined 2026-07-03 (Roland-driven):** **Default = columns 50/50 · rows 80/20** (top
    cards dominant, Scribe + RolDe 20%); drag rewritten on **window-level pointer listeners** (every
    divider drags, everywhere); dividers made **prominent** (fatter, darker grab-handles); the menu
    gains **per-card ON/OFF toggles** (Clinical Notes · Workup · RolDe — Scribe always on): a hidden
    card hands its space to its column-mate, both right cards off drops the right column, and the
    toggles **save with named layouts** (a layout = geometry + which cards show). Also 2026-07-03: the **Courier dispatch-trail palette** —
    Not Sent = amber wash · Sent = info · Delivered/Opened = success · Failed/Bounced = critical (pastel
    tints, Earth & Bloom). **✅ CLINICAL MODULES BUILT 2026-07-03 (W1.1):**
    the Caretaker Settings card (Settings → Clinical Modules; toggle-first ToggleCards, now a shared
    URDS component) switches **Lab · Radiology · Procedures · Prescribing · RolDe AI** per clinic
    (`clinic_clinical_modules`, one row per tenant, everything default ON; team-read / Caretaker-write
    RLS; every flip lands in the Activity Log before→after via the Change Describer). OFF = out of
    sight platform-wide: the Consult Room reflows 4/3/2 (Workup leaves when all four order modules are
    off; the RolDe panel with rolde_ai), Workup drops the disabled tabs, the sidebar + ⌘K hide
    Investigations/Prescribing, direct URL visits get an honest "switched off — a Caretaker can turn
    it on" card, and the Layouts menu hides the card toggles for clinic-disabled cards (the clinic
    layer sits OVER the user layer: users hide what the clinic has on, never show what it has off).
    Negative case verified: a clinician POST to the save endpoint gets 403. **✅ PROFILE OVERLAY BUILT 2026-07-03:**
    the patient's full structured record in a right-hand SHEET (portaled over the Consult Room — the
    doctor never navigates away), opened from the island's **Full Profile** button or a Snapshot
    **"+ Add"** (Allergies band · PMH · Meds headers jump straight to the editors). Four sections on a
    Segmented: **Details** (demographics/contact/address — audited FIELD-BY-FIELD via the Change
    Describer, PATIENT_DETAILS_FIELDS) · **Next Of Kin** (patient_contacts: NOK/emergency/carer rows,
    soft-delete) · **Care Team** (patient_care_providers — the **Courier's per-patient address hooks**:
    structured postal address per doctor, ONE registered GP per patient enforced by a partial unique
    index + flag-handoff, C3's default "send to GP" target) · **Clinical Record** (full allergy/PMH/
    medication editors: add · edit · mark-inactive/resolve/stop, two-step remove). **Record changes are
    FEED entries** (gold-mine law): adds + clinically significant status changes post typed
    allergy_recorded / problem_recorded / medication_recorded entries (enum extended) that wear their
    own tile pills (Allergy = critical · Problem = peach · Medication = warning). Every action:
    session-tenant + RLS re-check + content-free Activity-Log summary. Also 2026-07-03: the Read-by
    popover's "· first" tag fixed (reads now sorted by read_at — DB row order had crowned the wrong
    reviewer). **Hardened same day via a 24-agent adversarial review before shipping** — all confirmed
    findings fixed: expected server-action failures now RETURN { error } (Next masks thrown messages in
    production); every by-id mutation is bound id+patient_id with a read-back (no silent no-ops, no
    wrong-patient feed/audit rows); inserts verify the patient is in the caller's clinic; the GP-flag
    handoff is atomic (assign_patient_gp RPC — a failed save can never strand a patient GP-less); an
    open Select/⌘K claims its own Escape (a half-typed allergy never dies to a dropdown dismiss); the
    overlay closes + re-keys on patient switch (no stale-form wrong-patient write); the island +
    overlay are gated with break-glass (recordLocked — identity + allergies only until justified);
    feed-note failures degrade LOUDLY into the Activity Log; allergy edits are timeline-noted +
    field-audited (problems/meds field-audited); DELETE revoked across the patient record family
    (soft-delete-only); a med's stop date is the clinician's local calendar date. **Completed 2026-07-03 (later, Roland-driven):** the Full Profile grew to the COMPLETE
    registration dataset + a validation layer + the Alerts editor:
    - **Clinic country is a Caretaker setting** (Settings → Clinic Profile → Country; tenants.country,
      audited) — it drives address/phone/postcode formats platform-wide; the W1.5 onboarding wizard
      will pre-fill it from what the client enters when signing up.
    - **Country-aware validation everywhere** (`lib/validation.ts`, shared client+server): phone rules
      per country (GB 07…/+44 · IN 10-digit/+91 · US/CA/AU/NZ/IE/AE) with sanitise-as-you-type +
      max-length; postcode label + rule per country (Postcode/PIN Code/ZIP/Eircode); real email checks;
      DOB sanity; **NHS number Modulus-11 check digit**. Client formats per-country; the SERVER always
      enforces the universal floor. Wired into the Profile overlay (Details · NOK · Care Team), New
      Patient registration, and the server actions.
    - **Details = the full dataset** (dug against NHS PDS / GP Connect banner + the Accessible
      Information Standard DCB1605): Title · Middle Names · Known As · Gender Identity (distinct from
      sex at birth) · Pronouns · NHS ethnicity categories · Preferred Language · Interpreter Needed ·
      Communication Needs · Contact Preference · Occupation · Nominated Pharmacy — all audited
      field-by-field. (The original patients scaffold already carried the columns; the app now uses
      them. Unused scaffold siblings — preferred_name · preferred_contact · registered_gp_* — flagged
      to Roland as deep-clean candidates.)
    - **Alerts editor** (Clinical Record tab): Needle Phobia and kin — title · category (safety/
      clinical/infection/social) · priority (info/warning/critical) · description; add/edit/resolve,
      each posting an alert_recorded feed entry; the island's alert pills stay the display.
    **✅ STATUS DOT BUILT 2026-07-03 (Roland's design — Feed Tile v3, URDS §8):** ONE
    contextual status slot top-right (pill naming the open status + traffic-light dot; Unread =
    amber; red RESERVED for immediate clinical action; letters' send states ride the same slot —
    the footer status pill is gone); handled = a small muted green dot; click = the **Status Trail**
    (Written · Edited · Struck · Read+who · send state — C3 appends live Sent/Delivered/Opened);
    the feed Filter gains a **Status section** (Needs Attention · In Flight · Settled) so clinicians
    triage by the dot; type-pill labels semibold. **The Status Dot feeds RolDe Ambient AI at W5**
    (Roland 2026-07-03): the dot's state machine is the signal rail the AI reads (what's unread,
    owed, overdue) and writes (its suggestions arrive as amber statuses, clinician-authorised).
    Same pass: micro-typography laws (uppercase micro-headers + segment/tab labels semibold) +
    the label-map law (recordLabels.ts — no raw stored values in chrome) + country-aware national
    health IDs (GB NHS/CHI Mod-11 · IE IHI/PPS · IN ABHA · AU IHI · NZ NHI · AE Emirates ID; the
    nhs_number COLUMN rename to a generic name awaits Roland's call). **The Status-Dot COLOUR TAXONOMY — APPROVED (Roland 2026-07-04, LOCKED; also in
    the Clinical Notes card's (i) glossary):**
    - **RED — immediate response owed:** unacknowledged abnormal result · failed/bounced letter
      about urgent care · critical safety alert unactioned · safeguarding flag unactioned ·
      allergy conflict on a prescription. Red is NEVER a mere unread.
    - **AMBER — attention owed, not an emergency:** Unread · letter Not Sent · medication review
      due · routine result awaiting review · anything overdue.
    - **BLUE — in flight, nothing owed by us:** letter Sent · lab order in progress · awaiting an
      external reply.
    - **GREEN — settled:** read · delivered/opened · result acknowledged (collapses to the muted dot).
    - **GREY — historic:** struck-through · superseded.
    Refinements 2026-07-04: independent per-column row splits (dragging Scribe's divider never
    moves RolDe's — supersedes the one-shared-split symmetry); the Segmented control's selected
    tab lifts onto a TRUE white card + shadow (was a wash that blended in); the feed Filter's
    Status options wear their dot colours; patients.nhs_number **deep-renamed to
    national_health_id** and the five unused scaffold columns dropped (preferred_name ·
    preferred_contact · registered_gp_name/practice/address).
    **COMMITTED for Courier C3 (Roland 2026-07-04 — "create/wire all this up"):** at send time the
    Courier READS the Accessible Information Standard fields — a large-print patient gets a
    large-print LetterPdf variant automatically; contact_preference steers letter-vs-email;
    interpreter/communication needs travel on the appointment card at W2 check-in. The island
    already flags the needs (info chips beside the alerts).
    ▢ REMAINING — Body-Map (top-notch approach being researched after the candidate round —
    professional vector body/face charting, per-specialty templates) · Scribe Templates (Roland's
    concept 2026-07-04 — under design). New pieces to build + add to the URDS:
    - **Adaptive Workspace** — the four cards reflow by **Clinical Modules** (a new W1.1 Settings toggle:
      Lab · Radiology · Procedures · Prescriptions · RolDe AI) → 4/3/2-card states, AND are sized by
      **user-controlled LAYOUTS — no auto-resize (Roland 2026-07-01, FINAL; supersedes both the old
      Consult/Document/Review presets and the earlier content-pressure idea).** The layout changes ONLY
      when the user changes it: **drag-to-resize** dividers → **save + NAME the layout** → the named
      layouts live in a **topbar "Layouts" dropdown** (which replaces Consult/Document/Review); clicking
      a name switches the workspace; a **"Default" entry = the locked balanced 50/50**; double-click a
      divider resets to Default. Persisted per user. The only automatic move is opening the Body-Map
      (user-initiated). Tablet/mobile = stacked, tap-to-expand accordion. *Rock-solid across
      desktop/tablet/mobile is the bar.*
    - **Workup** — the renamed top-right card (was "Investigations + Orders"): order + track + results.
    - **Snapshot** — the topbar patient-name sheet (Allergies always-full · PMH · Current Meds; scrollable).
    - **Body-Map** — a Scribe mode (expand → mark → Save→feed); art = Servier Medical Art CC-BY restyled
      to our palette + Anatomogram tap-interaction + photo mark-up (aesthetics).
    - **Admission Marker** — a separator line + pill in the feed for the current episode. *(Built
      2026-07-02 as the truthful v1: anchors to **Today** — this visit's entries vs older; upgrades
      to the real admission/appointment episode when the W2 scheduling model lands. Both sort orders.)*
    - **Letters → the feed** (a "Letter"-tagged entry + a Letters filter), composed in Scribe.
    - **Depends on:** the record data layer (W1.2.1 problems/PMH · W1.2.2 meds · allergies) which Snapshot
      renders. Build order: Workup rename + Letters→feed → data layer → Snapshot + Admission Marker
      (URDS-covered) → Layouts (drag-resize + named layouts + topbar dropdown) → Body-Map (after the
      Servier style is picked).
- **W1.3 Patients List** — W1.3.1 Saved segments · W1.3.2 Tags · W1.3.3 Bulk actions · W1.3.4
  Merge duplicates · W1.3.5 Quick-view drawer
- **W1.4 Dashboard Cockpit** — W1.4.1 Action queues · W1.4.2 Pulse tiles · W1.4.3 Front-of-house
  · W1.4.4 Ward Map card (live board)
- **W1.5 Onboarding & Custodian** — W1.5.1 Tenant onboarding wizard · W1.5.2 Custodian
  **"Control" console** `/custodian/*` — the God-View, a DISTINCT shell from the clinic-operator
  UI (Roland 2026-06-16, from the annotated screenshot). Sidebar = the God-View surfaces (Overview ·
  Clinics (directory like the Users page → clinic detail = profile + Vitals + Concerns + "Message
  Caretaker") · Confer · Concerns) **+ a "Control" menu** — the Custodian's equivalent of a clinic's
  Settings: ONE destination (`/custodian/control`) gathering every platform lever they own (Legal &
  Safety **editor** · Email Templates · Email Log · Custodians), instead of scattering them (Roland
  2026-06-16: "Control = a sidebar menu… the things he needs to change and control for the clinics
  under him"). (+ mandatory MFA, 4h timeout; trigger a password-reset link for any Caretaker.)
  **Chunk 1 ✅ (2026-06-16, verified live): the Control shell** — custodian-only sidebar (drops
  clinical nav; honest "soon" scaffolds via `/custodian/[section]`), the Control hub, custodian
  profiles (`custodian_users` += display_name/title/photo_url; Roland/Devi/RolDe seeded), greet-by-name,
  both "Platform" labels removed (a Custodian has no clinic slot). Verified live as Custodian AND
  Caretaker via a NEW dev-only role-login (`/api/dev/login` — gitignored + NODE_ENV-gated, never
  ships) so every role is now verifiable in the local preview. ·
  W1.5.3 Ward Map live board (Realtime alert-glow, click-to-assign, transfer modal, discharge gate)
  · **W1.5.4 Clinic Vitals** — per-clinic + platform usage/health from OUR OWN tables (counts,
  storage, emails, last-active) + a weighted traffic-light health score; Phase 2 (errors/crashes)
  rides the self-hosted error beacon in W1.6.3. NEVER an external monitor (Roland 2026-06-16).
- **W1.1.14 Profiles & Avatars** *(universal, near-term — the Control greeting depends on it)*:
  every user from Custodian → Caretaker → staff gets a profile page + circular avatar. Photo upload
  to a Supabase Storage bucket (`tenant_users.photo_url` exists; custodians now have one too); when
  none is set, a **deterministic generated avatar (DiceBear, MIT, runs locally — never an external
  call)** keeps it colourful and lively.
- **W1.1.15 Role glossary ("Who's Who")** *(Roland 2026-06-16)* — the user-role names + a one-line
  meaning for each + the stewardship hierarchy (Custodian → Caretaker → Curator/Concierge/Clinician/
  Locum/Nurse/Chemist/Cunnere/Cofferer/CodeWright → Patient), reachable from **every page** (a quiet
  topbar affordance by the avatar → popover), the caller's own role highlighted. So a newcomer who
  sees "Cunnere" or "CodeWright" instantly knows what it means — the archaic-steward lexicon stays
  warm without ever being confusing.

**W1.6 — Confer & Concerns** *(the in-house communication + escalation layer; Roland 2026-06-16)* —
one shared backbone (thread + messages + attachments + hierarchy RLS), two surfaces. **The hierarchy
of stewardship is law:** Custodian ↔ Caretaker only; staff ↔ staff WITHIN a clinic; patients NEVER;
staff below Caretaker never reach a Custodian.
- **W1.6.1 Confer** — the messaging portal (30 / 70 two-pane, full-screen: conversation list │ thread).
  Phased: P1 threaded messaging → P2 realtime (Supabase Realtime) → P3 unread/notifications. **Built
  as a clinical-adjacent record ALWAYS** (Roland 2026-06-16): tenant RLS, audit, retention,
  soft-redact (never hard-delete), included in patient data-access/erasure.
- **W1.6.2 Concerns** — the report + escalation pipeline, itself a Confer-style conversation with a
  status spine so the raiser ALWAYS knows what's happening (open → triaged → escalated → resolved;
  "Roland from the CodeWright team is reviewing"). One-click capture button auto-grabs a screenshot +
  diagnostics (route, browser, build), then a modal to type the issue. Raise → Caretaker + the
  clinic's **CodeWright** (NEW role — the digital fixer; *code-wright*, where a "wright" is one who
  builds and mends — wheelwright, shipwright, playwright; `cunnere` is lab-tech, so CodeWright is
  added to the enum here) → triage in-house → escalate to Custodian if it's a RolDe OS problem →
  resolve flows back down.
- **W1.6.3 Vitals Phase 2** — the self-hosted client error beacon (`client_errors`, tenant-tagged)
  feeding both a clinic's own error view and the Custodian's Vitals. Self-hosted only.

**W2 — Calendar & Front Office** *(Appointments are first-class — a booking ≠ a patient; greenlit
2026-06-18)* — W2.1 Scheduling + clinician/room views **(the Appointment entity: who · what service ·
when · where · status; an Appointments sidebar item + a Today's Appointments dashboard card)** · W2.2
**Online booking widget** *(passwordless — the patient books + pays without an account; pays the
deposit/consultation fee through the clinic's own gateway)* · **W2.3 RolDe Cadence** — the recalls +
reminders engine *(LOCKED name, Roland 2026-06-30)*: automated patient-facing outreach on a schedule
(appointment reminders · recall-due · top-up due) — the *rhythm of ongoing care*. Sends via RoChat,
holds the relationship with Covenant. The shared recall engine every pack reuses ("recall engine
(W2.3)" = RolDe Cadence). · W2.4 Waitlist · W2.5 Recurring course series
**W3 — Clinical Orders** — W3.1 Prescribing + drug-safety · W3.2 Investigations + results inbox +
trends · W3.3 Letters + closed-loop referrals

> **The NHS prescription rails, documented for the NHS-expansion future (researched 2026-07-03/04,
> Roland: "document this in the bible").** NHS **nomination** is a central mechanism — the patient's
> chosen pharmacy (its **ODS code**) is stored on the **NHS Spine**; an NHS prescriber signing
> through the **Electronic Prescription Service (EPS)** has the Spine route the script automatically
> to the nominated pharmacy, which pulls it in its next batch download. The modern integration is
> the **EPS FHIR API** (NHS England Digital) — full onboarding required: DCB0129-grade
> clinical-safety assurance, smartcard/**CIS2** prescriber authentication, **dm+d** drug coding,
> assured-supplier status. **Private prescriptions are explicitly OUT of EPS's scope** — so RolDe's
> private rails come first: **CloudRx** (REST JSON API — submit/repeat/deliver/track; the
> first-class integration), **Church Pharmacy DigitRx / Fox** (portal-based; served by RolDe's
> universal fallback — the signed prescription PDF dispatched via Courier to any pharmacy address
> hook), and EPS as the deliberate compliance track when NHS-adjacent clinics arrive.
**W4 — Money** — W4.1 Billing/invoices/**deposits** *(deposit amount per Commercial Settings /
per-service; taken at booking, netted off the final bill)* · W4.2 Packages & memberships · W4.3
**Clinic-owned gateways (Scenario 1)** *(Stripe/PayPal/Klarna/Clearpay; clinic's own keys, live/
sandbox; RolDe 0%; configured in W1.1.11 Integrations)* · **W4.x Consultation Credit** *(credit-on-
account: the consultation fee a patient pays becomes a balance auto-applied to their next treatment;
toggle + amount + label in Commercial Settings; shown on the patient record + the invoice)* · **W4.x
Discount Codes** *(seasonal codes: percentage or fixed; total + per-customer usage limits; minimum
spend; expiry; code usage shown against the patient)* · W4.4 Aged debt · W4.5 Insurer billing
**W5 — Ambient AI** — W5.1 AI server (Gemma/M4 Max) · W5.2 Ambient suggestions · W5.3 AI drafting
· W5.4 Correction pipeline
**W6 — Growth & Ops** — W6.1 Inventory (batch/expiry) · W6.2 Marketing/CRM (**RolDe Covenant**) + reviews · W6.3
Reports/analytics · W6.4 Patient portal · W6.5 Audit-log surface · W6.6 Website builder (Puck) +
booking plugin + custom domains

### 15.7c Specialty Packs — thin modules hanging off the shared spine (from Bible 4.9 deep-dives)

**RolDe is *the* universal clinical OS** (every specialty in Bible 4.9), NOT an aesthetics tool —
aesthetics is simply the first **specialty pack** (Roland 2026-06-30). Each pack item is built
**when its base wave lands** (no jumping the queue, no duplicate spine work — "common elements
first"). De-duped against the build list above.

**Design discipline — turn every CON into a PRO (Roland 2026-06-30).** A pack item's "con" is not
a caveat we accept; it is a design problem we *solve* so the weakness becomes a strength. Each
item below carries a **Con→Pro** line: the mitigation that flips it (usually "build the shared
engine once, amortise the cost across every specialty," or "pre-seed it like Legal so clinics
edit, not author," or "the hard constraint is actually the moat").

**Packs are PER-TENANT SELECTABLE (Roland 2026-06-30).** The common spine is always on; every
clinic/hospital **chooses which specialty packs to enable** — an aesthetics clinic turns on the
Aesthetics Pack, a dental practice the Dentistry Pack, a multi-specialty hospital several at once.
A pack is an opt-in module per tenant (Caretaker/Custodian setting), gated through the existing
module/role system (`lib/access.ts` + `requireModuleAccess`). So RolDe is one OS that *becomes*
the clinic in front of it — never a fixed feature set forced on everyone.

**The Clinical Notes Card is the GOLD-MINE — a scrollable social-feed (Roland 2026-06-30).** Every
pack output (treatment map · consent · protocol · before/after photo · result · AI note · assessment
score · cycle event · witnessing step) **surfaces as an entry in ONE patient clinical timeline** — a
Facebook/Instagram/Twitter-style **single-point, scrollable** clinical record. Robust data model
underneath (built on the existing `patient_feed` / `patient_feed_entries`), **dead-simple** to read.
Every pack feature below is, ultimately, a typed feed-entry renderer + its editor; the Notes Card is
where the clinician lives. "So robust yet so simple."

**Regulatory & Compliance is SPECIALTY-AWARE, Custodian-Control-card-driven (Roland 2026-06-30).**
Each specialty carries its own regime (HFEA for fertility · CQC + JCCP for aesthetics · GDC for
dentistry · GPhC for pharmacy · GOC for optics · HCPC for AHPs…). **Don't hardcode it per pack.** The
**Custodian Control** holds regulatory regimes as **cards** (the mindate-Dashboard 4-card pattern — the
Custodian keeps adding them); a clinic's **onboarding / pack selection** maps it to the regimes that
apply; the **Caretaker is then shown only the legal/regulatory docs + any required reporting relevant
to them** (extends the W0.2 Legal & Safety surface to be specialty-aware). Reporting adapters
(FR.6 HFEA, future SART/BORN, CQC declarations) hang off this one framework.

- **Aesthetics Pack** *(Bible 4.9 Row 1 — Pabau · AesthetiDocs · Consentz · Faces · AestheticsPro ·
  Phorest · Nextech; ALL greenlit 2026-06-30):*
  - **AP.1 Treatment Mapping & Mark-up** — interactive face/body diagram; per injection point: product ·
    units/volume · depth · technique, **versioned every visit**. *Base: W1.2.5 body-map (aesthetics skin). **Net-new widget** — the signature feature.*
  - **AP.2 Before/After Photo Studio** — fixed-angle ghost-overlay capture + side-by-side/overlay compare,
    consent-gated, bound to AP.1. *Base: W1.2.5. Enhancement.*
  - **AP.3 Injectable Batch/Lot & Expiry** — record lot + expiry at the point of injection (MHRA
    recall traceability), auto-decrement stock. *Base: W6.1 inventory. Enhancement.*
  - **AP.4 Consent & Aftercare Library** — pre-loaded, **doctor-written** per-treatment consent + aftercare,
    auto-triggered at booking, **auto-flags missing answers / contra-indications**. Pre-seeded in Settings,
    editable like Legal. *Base: W1.2.6 consents + Settings. Enhancement.*
  - **AP.5 Complication / Emergency Protocol Library** — pre-seeded protocols (vascular occlusion →
    hyaluronidase, anaphylaxis…), one-tap from the patient record, editable per clinic; framed "guidance,
    clinician decides." Pre-seeded in Settings like Legal. ***Net-new.***
  - **AP.6 Nurse → Prescriber → Pharmacy loop + Supervisor countersign** — non-prescriber requests →
    remote prescriber authorises → pharmacy dispenses; trainee/nurse notes can require a supervisor
    sign-off; fully audited. *Base: W3.1 prescribing. Enhancement.* (Roland: "build this perfectly.")
  - **AP.7 Smart pre-appointment intake** — booking auto-sends the medical questionnaire + consent;
    red-flags surfaced to the clinician **before** the patient arrives. *Base: W2.2 booking. Enhancement.*
  - **AP.8 Smart Note Templates — a 2026 PICKER, never dot-codes (Roland 2026-06-30)** — a modern
    dropdown / command-palette "Smart Insert" that drops a structured, per-treatment note block; NOT
    1990s `.botox3` typing. *Base: documentation (Bible 4.6). **Net-new shared component** — every specialty reuses it.*
  - **AP.9 Quotes / Estimates → booking + invoice** — build a treatment estimate, convert to a booking +
    invoice. **DISTINCT from the payment-gateway plugin** (W1.1.11 / W4.3 = how money *moves*); a quote
    is the pre-sale *proposal* before money moves. *Base: W4.1 billing. Thin enhancement.*
  - **AP.10 Lead pipeline + review automation — ALREADY COVERED, no new build (de-duped).** The
    enquiry→consult **pipeline = RolDe Covenant (W6.2)**; the conversation itself rides **RoChat** (RoDee's
    own-AI comms hub — user↔us, replacing email / chatbots / third-parties; built by iOS Jarvis);
    **review-requests = a Caretaker-set Automation delivered via RoChat.** **NO branded patient app —
    ever; patients only ever use RolDe OS (the patient portal, W6.4)** (Roland 2026-06-30).
  - **AP.11 Psychological Suitability / BDD Screening** *(Roland 2026-06-30 — aesthetics needs a mental-
    health check; concurred + air-tight: JCCP + GMC advise screening for Body Dysmorphic Disorder before
    cosmetic treatment and knowing when to decline).* — *Plan:* auto-administer a validated screen
    (**COPS / BDDQ-AS**) at intake; **score it on the MH.1 engine**; a high score **flags on the MH.5
    risk banner** → prompt "consider declining / refer for psychological assessment" with a referral
    route (**GP.3**). *Con→Pro:* "a whole mental-health feature inside aesthetics" → it's the **MH engine
    (MH.1 scales + MH.5 risk) pointed at aesthetics** — near-zero new build, and it's a real **safety +
    medico-legal** protection (JCCP/GMC) that *defines* a clinical aesthetics OS vs a booking app. *Base:
    MH.1 + MH.5 + AP.7 intake + GP.3 referral.*

- **Dermatology Pack** *(Bible 4.9 Row 2 — EZDERM · ModMed EMA · DermEngine/MetaOptima · OmniMD;
  ALL greenlit 2026-06-30).* Derm reuses the aesthetics engines (body-map · photo · recall ·
  results) — **build once, skin per specialty.**
  - **DP.1 Lesion Body-Map + Biopsy-Site Tracking** — *Plan:* extend the **AP.1 body-map engine**
    with a `lesion` point-type `{site, morphology, size, biopsy_status, surgical_plan}`, versioned
    per visit; swap the face SVG atlas for a full-body atlas (front/back/limbs) — same renderer.
    EZDERM-style 3,000-point anatomical precision. *Con→Pro:* the full-body-map "build effort" is a
    **one-time spine investment shared by aesthetics (face), derm (lesions) and MSK** — cost amortises
    to ~zero per specialty; the hard part becomes the moat. *Base: W1.2.5.*
  - **DP.2 Total Body Photography + Change Detection** — *Plan:* extend the **AP.2 Photo Studio**
    with a "TBP set" (standardised pose sequence) + a compare view (side-by-side + flicker/difference
    overlay) bound to DP.1 lesions. *Con→Pro:* "needs consistent capture" → the **fixed-angle
    ghost-overlay already in AP.2 ENFORCES consistency automatically** — the difficulty is solved by
    the very feature; weakness → guarantee. *Base: W1.2.5.*
  - **DP.3 Biopsy → Pathology Results Loop (lesion-linked)** — *Plan:* a `specimens` table linking a
    biopsy to its DP.1 lesion + an inbound result on the **W3.2 results inbox**; on arrival, attach
    histology + a **concordance check** (flag if path Dx ≠ clinical impression). FHIR `DiagnosticReport`
    where the lab supports it; manual entry fallback. *Con→Pro:* "needs lab integration" → we build
    **ONE generic FHIR results-inbox** every specialty rides (bloods, imaging, histology); manual entry
    means it works **day one** with zero integration — the integration becomes a universal asset. *Base: W3.2.*
  - **DP.4 High-risk Drug Monitoring (isotretinoin / biologics)** — *Plan:* a `monitoring_schedule`
    per drug (pre-seeded: isotretinoin **Pregnancy Prevention Programme** — pregnancy-test cadence +
    LFTs/lipids; biologics — TB screen + bloods) attached at prescribe-time; overdue → the **shared
    recall engine (W2.3)**; a "safe-to-prescribe" gate checks it. *Con→Pro:* "protocol authoring +
    recall wiring" → protocols are **pre-seeded like Legal + AP.5** (clinics edit, not author) and the
    recall engine is **already shared with aesthetic top-ups** — zero new wiring; the con dissolves into
    existing spine. *Base: W3.1 + W2.3 + Bible 4.4 §8.*
  - **DP.5 Teledermatology (store-and-forward)** — *Plan:* an async `image_consult` — standardised
    images + history submitted → routed to a reviewing dermatologist → structured report back; a
    distinct **async mode of RolDe Connect**, reusing DP.2 capture + the **W3.3 referral** rails.
    *Con→Pro:* "image-quality governance" → **DP.2 fixed-angle capture guarantees quality at source**
    and async-review gates a human before any action — quality enforced by design, not hoped for. *Base: W3.3 / RolDe Connect.*
  - **DP.6 Phototherapy (UVB) Dosing & Tracking** — *Plan:* a `phototherapy_course` — MED-based start
    dose + per-visit increment rules (**configurable per device/protocol**) + cumulative-dose ledger +
    a max-dose guard. *Con→Pro:* "niche, per-device protocols" → make the protocol **configurable (the
    Commercial-Settings pattern)** so ONE widget serves every device — niche becomes universal, on a
    config pattern we already own. *Base: net-new derm widget (small; lower priority).*
  - **DP.7 Dermoscopy imaging + (later) AI lesion triage** — *Plan:* NOW — attach dermoscopic
    high-mag images to a DP.1 lesion. LATER — AI melanoma triage as a **regulated module (UKCA/CE),
    likely partnered**. *Con→Pro:* "AI Dx is regulated" → by capturing structured dermoscopy + outcomes
    **now** (unregulated, valuable) we build the **labelled longitudinal dataset** a future regulated/
    partnered AI needs — the regulatory wall becomes our **data moat**; ship value now, earn the AI later.
    *Base: W1.2.5 (image-attach) + W5 (AI, regulated/later).*

- **General Practice & Private Medical Pack** *(Bible 4.9 Row 3 — Semble · Meddbase · Healthcode ·
  Hero Health · TouchPoints; ALL greenlit 2026-06-30).* The **"insured private practice"** layer on
  the universal spine — the market beyond aesthetics.
  - **GP.1 Insurer Billing via Healthcode (EDI clearing)** — *Plan:* model billing around a pluggable
    **`payor` {self-pay | insurer | membership}**; add a **Healthcode EDI adapter** (invoice submission
    + remittance reconciliation + **membership/pre-authorisation check**) beside the W4.3 clinic
    gateways; invoices carry **CCSD procedure codes** + insurer/membership refs. *Con→Pro:* "another
    billing integration" → **ONE billing spine with a payor abstraction**; Healthcode is one adapter
    beside the self-pay gateways — the rail then serves **every** insured specialty (consultants,
    physio, derm). *Base: W4.1 + W4.3 + W4.5 (insurer billing). The market-unlock.*
  - **GP.2 Care Pathways** — *Plan:* a `care_pathway` = an **ORDERED set of AP.8 Smart-Note-Template
    steps** with milestones + due-dates feeding the **shared recall engine (W2.3)**; pre-seed common
    pathways (hypertension, MSK rehab), clinic-editable. *Con→Pro:* "authoring heavy" → a pathway is a
    **sequenced Smart-Note-Template** (same engine, ordered) **pre-seeded like Legal**. *Base: Bible 4.6 + AP.8 + W2.3.*
  - **GP.3 Provider-to-Provider E-Referrals (closed-loop + record sharing)** — *Plan:* a `referral`
    → target provider/service + a **consented FHIR record-section bundle** + a status spine (sent →
    accepted → seen → reported-back). *Con→Pro:* "secure cross-provider sharing is hard" → it's our
    **existing consent + audit + RLS spine pointed at another tenant**, and **FHIR (our results format,
    DP.3) carries the sections**. *Base: W3.3 (letters + closed-loop referrals).*
  - **GP.4 Rich Patient Portal** — *Plan:* a **patient ROLE/lens on RolDe OS (NOT a separate app)** —
    permission-scoped views of the SAME pages the clinic uses: book · pay · pre-visit questionnaires
    (AP.7) · prescriptions · referrals · results · self-care; **RoChat** is the comms channel. *Con→Pro:*
    "a whole patient surface" → **RolDe OS with a patient lens** reusing the same records,
    permission-scoped — a new *role* on the spine, not a new app (Roland: patients only ever use RolDe
    OS). *Base: W6.4 patient portal.*
  - **GP.5 Health-Screening Packages** — *Plan:* a `screening_package` = a bundle of investigations
    (W3.2) + a **templated report (PDF Kit)** auto-assembled from results into a personalised well-person
    / executive screen; sold via W1.1.10 packages. *Con→Pro:* "bespoke report" → **PDF Kit + packages +
    results assembled, not invented**. *Base: W1.1.10 + W3.2 + PDF Kit (Wave C).*
  - **GP.6 Membership / Subscription Medicine** — *Plan:* recurring-billing plans (the Commercial-
    Settings/gateway rail) with **tracked entitlements** (e.g. N consults/yr, priority) as config on
    W1.1.10 packages — and the `membership` payor of GP.1. *Con→Pro:* "recurring + entitlements complex"
    → **same gateway/Commercial-Settings rail** (deposits/credit already there); entitlements = package
    config. *Base: W1.1.10 + Commercial Settings + W4.*
  - **GP.7 Structured Medical Reports (medico-legal / insurance medicals)** — *Plan:* report templates
    (insurance medical · fit-to-work · medico-legal) via the **AP.8 picker** rendered through the **PDF
    Kit**. *Con→Pro:* "another document type" → **AP.8 picker + PDF Kit**; a report is a long structured
    note → PDF. *Base: Bible 4.6 + PDF Kit; cross-refs Occupational Health (Row 14).*

- **Primary-Care Depth Pack** *(Bible 4.9 Row 4 — EMIS Web · SystmOne · Vision · Ardens; NP.1–NP.7
  greenlit 2026-06-30).* The **computable clinical record** harvested from the NHS GP systems for the
  PRIVATE build. NHS *integration* (NP.8) stays **DEFERRED**.
  - **NP.1 SNOMED CT Structured Coding** *(foundational)* — *Plan:* adopt the **SNOMED CT UK edition**
    (published terminology + NHS terminology server / local FHIR ValueSets) — a `coded_concept` ref on
    problems · diagnoses · procedures · observations, with a type-ahead picker. *Con→Pro:* "a huge
    terminology to integrate" → we **adopt a published dataset + API, not build a terminology**; the
    coded record is the foundation **NP.2/4/5/7 + DP.3 FHIR + future AI** all stand on — one investment,
    many payoffs. *Base: W1.2.1 + cross-cutting.*
  - **NP.2 Coded Problem List + Computable Record** — *Plan:* structured active/past problems (SNOMED +
    onset/resolved) with **one-tap "add to problem list" from a consultation**; auto-feeds registers
    (NP.5). *Con→Pro:* "clinicians don't maintain problem lists" → one-tap add + the list **builds the
    registers automatically** — maintenance becomes a by-product. *Base: W1.2.1.*
  - **NP.3 Repeat Prescribing + Medication Safety** — *Plan:* repeat / repeat-dispensing authorisation
    + issue cycles, with interaction/allergy/duplicate checks on the **W3.1 drug-safety engine** +
    reauthorisation reminders via **W2.3**. *Con→Pro:* "safety checking is complex" → the drug-safety
    engine **is** W3.1 (the prescribing spine); repeats are a *mode* of it + the **AP.6 nurse→prescriber**
    flow. *Base: W3.1 + W2.3.*
  - **NP.4 Clinical Templates + Decision Support** — *Plan:* SNOMED-coded templates (the **AP.8/GP.2
    engine**) with embedded safety alerts keyed off NP.1 codes; pre-seed common templates; option to
    **license a content set (Ardens-style)** later. *Con→Pro:* "authoring + NICE/MHRA currency" → same
    Smart-Note-Template engine, **pre-seeded like Legal**; alerts ride the SNOMED codes; license content
    later rather than author. *Base: AP.8 + GP.2 + W3.1 safety.*
  - **NP.5 Disease Registers + Call/Recall** — *Plan:* a register = a **saved SNOMED population-search
    (NP.7)** materialised into a cohort + the **shared recall engine (W2.3)** for LTC reviews; pre-seed
    common registers. *Con→Pro:* "register logic per condition" → a **saved population-search + shared
    recall** — define once, reuse. *Base: W2.3 + NP.7 + Bible 4.4 §8.*
  - **NP.6 Document Management & Clinical Workflow** — *Plan:* inbound documents → review · stamp ·
    code(SNOMED) · redact · **route-in-sequence** + tasks; reuses the **document store (W1.2.4)** + the
    **Activity-Log/task spine** + Change-Describer-style audited actions. *Con→Pro:* "a whole
    inbox/workflow surface" → reuses the document store + task/audit spine we already have. *Base: W1.2.4 + tasks.*
  - **NP.7 Population Search & Analytics** — *Plan:* a structured query builder over the SNOMED-coded
    record → cohort lists feeding recall (NP.5) + audit + **W6.3 reports**. *Con→Pro:* "a query builder
    is complex" → because the record is **SNOMED-coded (NP.1)**, searches are structured code queries —
    nearly free. *Base: W6.3.*
  - **NP.8 NHS Interoperability — DEFERRED, Phase 3+** *(GP Connect · Summary Care Record · GP2GP ·
    EPS).* NOT built now (Bible 4.0 §4.5 principled NHS deferral); the plug-in point if RolDe ever goes NHS.

- **Dentistry Pack** *(Bible 4.9 Row 5 — Dentally · SOE EXACT · Carestream CS R4+ · iSmile · Pearl;
  DN.1–DN.7 greenlit 2026-06-30).* The tooth-chart pack — and the proof of the body-map engine's
  reuse (**face → lesions → teeth**).
  - **DN.1 Dental Charting (Odontogram)** *(signature)* — *Plan:* the **AP.1 body-map engine with a
    *teeth* atlas** (FDI/Palmer notation); per-tooth status · surfaces · existing restorations + planned
    treatment, versioned each visit. *Con→Pro:* "another bespoke chart" → the **third reuse of the same
    renderer** (face/body → lesions → teeth) — near-zero marginal cost; the chart is the dental spine
    on the spine we own. *Base: AP.1.*
  - **DN.2 Periodontal Charting** — *Plan:* BPE/BEWE + 6-point pocket-depth/bleeding grid per tooth +
    **side-by-side compare** over time. *Con→Pro:* "a numeric grid + longitudinal" → reuses the
    **versioning + compare engine from AP.2/DP.2** (photo-compare) applied to numbers. *Base: compare engine.*
  - **DN.3 Dental Imaging Integration** — *Plan:* intraoral X-ray / OPG / **CBCT (DICOM)** attach + view,
    bound to the tooth chart. *Con→Pro:* "DICOM/CBCT is heavy" → imaging is the **Row-16 RIS/PACS work
    we'll do anyway**; dental is a *consumer* of the same DICOM viewer; attach-and-view works day one via
    the document store. *Base: W1.2.4 + cross-refs Row 16 imaging.*
  - **DN.4 Treatment Plans, Phased Estimates & Case Acceptance** — *Plan:* per-tooth phased plan + costs
    + status (proposed→accepted) + an **acceptance-rate KPI**. *Con→Pro:* "phased estimates + acceptance
    is bespoke" → **AP.9 quotes + GP.5 packages + billing + a status**; case-acceptance is a **report
    (NP.7/W6.3)** over that status. *Base: AP.9 + GP.5 + W4 + W6.3.*
  - **DN.5 RolDe AI Dental Notes** — *Plan:* **RolDe's OWN self-hosted ambient AI (W5 / Bible 4.7,
    Gemma)** → voice → templated dental notes + AI letters + e-consent. **NEVER a third party (not
    Kiroku)** (Roland 2026-06-30). *Con→Pro:* "an AI scribe is a big build" → it's **W5 — already the
    plan** — pointed at dental templates (NP.4/AP.8); dentistry is a consumer, not new AI. *Base: W5 +
    NP.4; self-hosted-only.*
  - **DN.6 Lab Work Tracking — *the Lab module*** — *Plan:* the **SAME order-tracking spine as the
    Lab/Investigations module** (W3.2 + the DP.3 specimens loop) — a `lab_order {dental | pathology}`
    that sends → tracks → returns → fits. *Con→Pro:* "another workflow" → **one send-and-track engine
    serves pathology specimens AND dental lab work** (crowns/dentures/aligners) (Roland 2026-06-30:
    ties into our own Lab module). *Base: W3.2 + DP.3.*
  - **DN.7 Orthodontic / Clear-Aligner Tracking** — *Plan:* aligner-stage tracker as a **GP.2
    care-pathway instance** + a 3D-render **external embed** + progress monitoring. *Con→Pro:* "niche +
    3D render" → the stage tracker is a pathway config; the 3D render is an embed, not our build. *Base: GP.2.*
  - *Covered already:* 6-month / hygiene **recall** → shared recall engine (**W2.3**). *Deferred:* NHS
    **UDA/FP17** dental claims → Phase 3+.

- **Physiotherapy & MSK Pack** *(Bible 4.9 Row 6 — Physitrack · Cliniko · TM3 · WriteUpp · PPS · Jane;
  PT.1–PT.3 greenlit 2026-06-30).* A **lean pack** — physio is ~80% spine already; only three net-new
  widgets, each reusing an engine we own.
  - **PT.1 Exercise Prescription & Home Exercise Programs** *(signature)* — *Plan:* a prescription tool
    (exercise + sets/reps/video) delivered through the **GP.4 patient portal (RolDe OS, no app)** with
    adherence + pain tracking + progress; the video library is **licensed/curated content**, not filmed
    by us. *Con→Pro:* "a 17,000-video library" → we build the **tool + adherence on the spine** (forms +
    portal + recall) and **license** the content — hard part licensed, engineering is reuse. *Base: GP.4 +
    forms (AP.7) + W2.3.*
  - **PT.2 Outcome Measures / PROMs** — *Plan:* one generic **scored-questionnaire engine** (a score is a
    formula over answers) + a data-library of instruments (Oswestry · LEFS · VAS · DASH · TUG), tracked
    longitudinally → charts. *Con→Pro:* "many scoring algorithms" → instruments are **config/data, not
    code**; reuses forms + charting — one engine, every instrument. *Base: forms (AP.7) + charting.*
  - **PT.3 ROM / Goniometry Tracking** — *Plan:* range-of-motion (active/passive, per joint, vs normal)
    over time. *Con→Pro:* "another measurement type" → reuses the **DN.2/DP.2 numeric-grid + compare
    engine** (same widget as perio pocket depths). *Base: compare engine.*
  - *Covered already:* body chart/pain map → **AP.1/W1.2.5** · SOAP → templates **AP.8/NP.4** ·
    insurer/PMI → **GP.1** · telerehab → **RolDe Connect** · rehab pathways → **GP.2**.

- **Mental Health & Talking Therapies Pack** *(Bible 4.9 Row 7 — Upheal · SimplePractice · Power
  Diary/Zanda · Halaxy · Konfidens; MH.1–MH.7 greenlit 2026-06-30).* Therapy is largely spine; the
  net-new bits (**risk + confidentiality**) **harden the whole platform**.
  - **MH.1 Standardised Assessment Scales** — PHQ-9 · GAD-7 · PCL-5 · DASS-21 auto-sent before/between
    sessions, scored, graphed (measurement-based care). *Con→Pro:* "many scales" → the **PT.2
    scored-questionnaire engine** (instruments = data) + **AP.7** + the **recall engine**. *Base: PT.2 + AP.7 + W2.3.*
  - **MH.2 AI Therapy Notes (multi-format)** — RolDe's own AI drafts SOAP/DAP/GIRP/BIRP + a treatment
    plan from sessions. *Con→Pro:* "ten note formats" → **W5 (self-hosted ambient AI) + templates
    (NP.4)**; formats are config; **never a third party**. *Base: W5 + NP.4.*
  - **MH.3 Therapy Plans & Goal Tracking** — SMART goals, modality-aware (CBT/DBT/ACT). *Con→Pro:*
    "another plan type" → **GP.2 care-plans**, pre-seeded. *Base: GP.2.*
  - **MH.4 Between-Session Tasks / CBT Worksheets** — prescribe a worksheet/task; the client completes
    it **in RolDe OS**, tracked. *Con→Pro:* "another prescription type" → **generalise PT.1** (exercise)
    to a *task/worksheet* content type — same prescribe→portal→track engine. *Base: PT.1 engine + GP.4.*
  - **MH.5 Risk Flagging & Safeguarding Alerts** *(platform-wide safety)* — a visible risk banner +
    escalation (PHQ-9 item-9 suicide screen **auto-flags**; safeguarding routes to escalation). *Con→Pro:*
    "risk logic + escalation" → reuses the **Concerns escalation spine (W1.6.2)** + a record flag + a
    **scored-form rule (MH.1)**. *Base: W1.6.2 + MH.1. Hardens every specialty.*
  - **MH.6 Sensitive-Record Controls** *(platform-wide confidentiality)* — a **sensitivity tier**
    (mental / sexual / gender health) raising the access bar beyond standard RLS + extra audit;
    AI-recording consent with **delete-after-transcription**. *Con→Pro:* "another permission model" → a
    **tier on the existing RLS + break-glass** (raise the bar + audit harder), not a new model;
    consent/auto-delete rides **Bible 4.7 ambient-AI consent**. *Base: RLS/audit/break-glass + Bible 4.7.
    Upgrades confidentiality platform-wide (Caldicott).*
  - **MH.7 Group & Couples Sessions** — one session, N participants, **per-participant private notes**.
    *Con→Pro:* "group scheduling + per-person notes" → an appointment with N patients + N note instances
    on **W2.1 scheduling** — **one feature unlocks therapy + antenatal + aesthetics classes**. *Base: W2.1.*

- **Optometry & Optical Pack** *(Bible 4.9 Row 10 — Acuitas 3/Ocuco · Optix · Raven Vision · Compulink;
  OP.1–OP.4 greenlit 2026-06-30).* Part clinic, part shop — introduces **two shared engines** (Products
  & Retail; DICOM devices) that later serve several packs.
  - **OP.1 Eye Examination Record** — *Plan:* a structured sight-test (refraction · VA · IOP · anterior/
    posterior segment) with exam workflows by visit type. *Con→Pro:* "another exam form" → it's the
    **templates engine (AP.8/NP.4)**, pre-seeded — an eye exam is a structured template. *Base: templates.*
  - **OP.2 Diagnostic Device Integration (DICOM)** — *Plan:* auto-import OCT · fundus camera ·
    autorefractor data into the chart. *Con→Pro:* "DICOM is heavy" → build **ONE diagnostic-device
    (DICOM) engine** shared by **dental CBCT (DN.3), optometry OCT, and imaging (Row 16)** — build once,
    every imaging specialty consumes it. *Base: shared DICOM engine + W1.2.4.*
  - **OP.3 Optical Dispensing & Retail** *(multi-specialty unlock)* — *Plan:* dispense spectacles/CL →
    generate the **lab order (DN.6)** + decrement **stock (W6.1)** + record the **sale (W4)** in one flow;
    frames/lens catalogue. *Con→Pro:* "RolDe isn't a retail/POS system" → build a **general Products &
    Retail layer once** (catalogue + stock + sale + dispense-order) → it then serves **optical, hearing
    aids, skincare, dental products, supplements**; the con becomes a **universal capability**. *Base: NEW
    Products/Retail layer on DN.6 + W6.1 + W4.*
  - **OP.4 Contact Lens Management & Supply Recall** — *Plan:* CL records + re-order/supply recall +
    benefit-year tracking. *Con→Pro:* "CL supply tracking" → the **recall engine (W2.3)** + a CL record.
    *Base: W2.3.*
  - **OP.5 GOS / NHS Optical Vouchers — DEFERRED, Phase 3+** (NHS plumbing, like NP.8). Listed, not built now.

- **Audiology & Hearing Pack** *(Bible 4.9 Row 11 — Auditbase/Auditdata · Blueprint OMS · NOAH/Himsa ·
  Sycle · NymoClinic; AU.1–AU.4 greenlit 2026-06-30).* **~90% reuse** — only the audiogram is new build;
  validates the OP.3 retail + the device engines.
  - **AU.1 Audiogram & Hearing Assessment Record** *(only genuinely new build)* — *Plan:* pure-tone +
    speech audiometry + tympanometry, plotted as an **audiogram** and tracked over time. *Con→Pro:* "a
    specialised chart" → the **templates engine + charting/compare engine** (a graph over frequencies).
    *Base: templates + charting.*
  - **AU.2 Device Integration (NOAH standard)** — *Plan:* connect audiometers/REM/fitting systems via
    **NOAH** (100+ devices, manufacturer-agnostic). *Con→Pro:* "another integration standard" → the
    **device-integration engine (OP.2) is standard-agnostic** — add a **NOAH adapter beside DICOM**.
    *Base: shared device engine + NOAH adapter.*
  - **AU.3 Hearing Aid & Tinnitus Device Fitting + Dispensing** — *Plan:* fitting record (REM) + the
    device as a **product** (serial · warranty · adjustment history). *Con→Pro:* "fitting + dispensing +
    warranty" → the hearing aid **is a product on the OP.3 Products & Retail layer**; the fitting is a
    form — **OP.3 pays off again**. *Base: OP.3 + a fitting form.*
  - **AU.4 Supply, Warranty & Review Recall** — *Plan:* battery/supply re-orders, warranty, 6–8-week
    fitting follow-up + annual review. *Con→Pro:* "supplies/warranty/recall" → **recall engine (W2.3) +
    Products & Retail**. *Base: W2.3 + OP.3.*

- **Fertility & IVF Pack** *(Bible 4.9 Row 12 — MedITEX · IDEAS EMR · BabySentry · eIVF · Vitrify ·
  ART Compass; FR.1–FR.6 greenlit 2026-06-30).* The most net-new pack — yet ~half rides the spine;
  every event below posts to the **Clinical Notes feed**.
  - **FR.1 Treatment Cycle Management** — *Plan:* stimulation protocol + day-by-day monitoring (scans ·
    hormones · dosing) + cycle calendar + transfer. *Con→Pro:* "complex time-based protocol" → a
    **specialised GP.2 care-pathway + W3.2 monitoring**; the cycle calendar is a pathway instance.
    *Base: GP.2 + W3.2.*
  - **FR.2 Embryology Lab Tracking** — *Plan:* egg retrieval → fertilization → embryo grading &
    development (day 1–6) → selection. *Con→Pro:* "a bespoke lab module" → rides the **Lab/order spine
    (DN.6/W3.2)** with the *embryo* as the tracked entity + grading fields. *Base: DN.6/W3.2 + embryo fields.*
  - **FR.3 Electronic Witnessing & Chain-of-Custody** *(safety-critical)* — *Plan:* every sample move
    witnessed (second-person or RFID/barcode); full chain-of-custody per gamete/embryo. *Con→Pro:*
    "safety-critical + hardware" → reuses **audit + break-glass + the AP.6 countersign** (second-actor
    confirm) + the **barcode scan (AP.3/OP.3)**; certified-device adapter optional. *Base: audit/break-glass
    + AP.6 + scan.*
  - **FR.4 Cryostorage Management** — *Plan:* cryo inventory (eggs/embryos/sperm) + location (tank/straw)
    + consent & storage-expiry + renewal recall. *Con→Pro:* "specialised cryo inventory + consent expiry"
    → **inventory (W6.1) + consent (W1.2.6) + recall (W2.3)** + location fields. *Base: W6.1 + W1.2.6 + W2.3.*
  - **FR.5 Donor & Third-Party Management** — *Plan:* donor records + matching + regulatory limits
    (HFEA 10-family) + donor–surrogate–parent linkages. *Con→Pro:* "donor matching + limits" → a donor
    is a record type + a **population search (NP.7)** + a **count-guard rule** + **linked records (MH.7)**.
    *Base: NP.7 + MH.7 + a rule.*
  - **FR.6 HFEA Regulatory Reporting** — *Plan:* cycle registration + outcomes to HFEA — the **first
    reporting adapter on the specialty-aware Regulatory & Compliance framework** (Custodian-Control cards
    + onboarding-driven; see §15.7c intro). *Con→Pro:* "a regulatory integration" → a **reporting adapter
    on the coded record (NP.1)**, like the Healthcode/FHIR adapters. *Base: Regulatory & Compliance
    framework + NP.1. UK-mandatory (not deferred).*

- **Women's, Men's & Sexual Health Pack** *(Bible 4.9 Row 13 — Optimantra · Semble · menopause/TRT
  EMRs + the GUM / eSexual-Health evidence base; WH.1–WH.5 greenlit 2026-06-30).* Booming market —
  almost all reuse + pre-seeded protocols; one genuinely-new piece (partner notification).
  - **WH.1 Hormone Therapy Management (HRT / TRT)** *(big-market standout)* — *Plan:* protocol templates
    (oestrogen · progesterone · testosterone · thyroid · pellet) + dosage & titration + safety-lab
    monitoring (PSA · hematocrit · hormones) + trend charts. *Con→Pro:* "protocols + titration + lab
    monitoring is complex" → **prescribing (AP.6) + DP.4 drug-monitoring** (PSA/hematocrit = the same
    monitoring-schedule engine) + **GP.2 protocols** + **W3.2 trend charts**; hormone protocols
    pre-seeded. *Base: AP.6 + DP.4 + GP.2 + charts.*
  - **WH.2 Validated Symptom Scales** — *Plan:* Greene Climacteric / Menopause Rating Scale (women),
    ADAM / IIEF-15 (men), scored over time. *Con→Pro:* "another set of scales" → the **MH.1/PT.2
    scored-questionnaire engine**; instruments are data. *Base: MH.1/PT.2.*
  - **WH.3 Sexual Health: STI Results + Partner Notification** *(specialised + sensitive)* — *Plan:*
    results delivery + **anonymised partner notification / contact tracing** (SMS/email). *Con→Pro:*
    "anonymised partner notification is sensitive" → reuses **W3.2 results + RoChat comms + the MH.6
    sensitivity tier**; the anonymised notice never reveals the index patient — **sensitive-by-design**.
    *Base: W3.2 + RoChat + MH.6.*
  - **WH.4 Contraception & LARC Management** — *Plan:* coil/implant insertion & removal records + expiry
    recall. *Con→Pro:* "LARC procedure + expiry recall" → a **procedure record + the recall engine
    (W2.3)** (coil/implant expiry is a recall date). *Base: W2.3.*
  - **WH.5 Cycle / Menstrual Tracking** — *Plan:* patient-recorded cycle posted into the clinical feed.
    *Con→Pro:* "patient-side tracking" → a **portal input (GP.4)** that posts to the **gold-mine Notes
    feed**. *Base: GP.4 + feed.*

- **Occupational Health Pack** *(Bible 4.9 Row 14 — Cohort · Civica OPAS-G2 · Medgate · Cority ·
  PrognoCIS; OH.1–OH.5 greenlit 2026-06-30; SEQOHS-standard).* Introduces the **Organisation/Employer
  entity** — RolDe's first B2B client, reused by corporate wellness + insurance medicals.
  - **OH.1 Organisation/Employer Model + Management Referrals** *(architectural unlock)* — *Plan:*
    company-as-client (B2B), employees grouped, employer-referral → OH assessment → **consent-bounded
    management report** + employer portal. *Con→Pro:* "OH is B2B — a whole employer model + portal" →
    build a **general Organisation entity once** (company = payor + group of patients + org portal) → it
    serves **OH, corporate wellness, insurance medicals, school/sports teams**; referral-to-employer
    reuses **GP.3 + GP.7 + the MH.6 consent boundary**. *Base: NEW Organisation entity + GP.1/GP.3/GP.7/MH.6.*
  - **OH.2 Health Surveillance Programmes** — *Plan:* hazard-based screening (audiometry · spirometry ·
    vision · skin · HAVS · serology) + per-hazard recall + at-risk registers. *Con→Pro:* "many
    hazard-specific screens" → **audiometry = AU.1, vision = OP.1, registers = NP.5, recall = W2.3** —
    only spirometry/HAVS/skin are new forms; the surveillance engine is already built. *Base: AU.1 + OP.1
    + NP.5 + W2.3 + a few forms.*
  - **OH.3 Fitness-for-Work & Pre-Placement** — *Plan:* pre-employment questionnaires + medicals +
    fit-for-duty / return-to-work letters → employer report (conclusion only). *Con→Pro:* "reports must
    not leak clinical detail" → **AP.7 intake + GP.7 reports + the MH.6 sensitivity tier**
    (conclusion-only). *Base: AP.7 + GP.7 + MH.6.*
  - **OH.4 Occupational Vaccinations & Immunisations** — *Plan:* flu · Covid · Hep B · TB + serology +
    schedules + recall. *Con→Pro:* "vaccination tracking" → a **vaccination record type + recall (W2.3)**
    — also serves **travel health (Row 18) + primary care**: one feature, several packs. *Base: NEW
    vaccination record (multi-pack) + W2.3.*
  - **OH.5 Drug & Alcohol Testing** — *Plan:* testing records + randomisation + chain-of-custody.
    *Con→Pro:* "chain-of-custody + randomisation" → reuses **FR.3 witnessing/chain-of-custody** + a test
    record + an **NP.7 population-search randomiser**. *Base: FR.3 + NP.7 + a form.*

- **Pharmacy & Independent-Prescriber Pack** *(Bible 4.9 Row 15 — TITAN · ProScript · Cegedim Rx · Nymo
  + the IP-clinic / Pharmacy-First evidence; PH.1–PH.3 greenlit 2026-06-30).* **Scope discipline:** RolDe
  serves pharmacy **clinical services** (IP clinics, private prescribing, weight-loss, travel) on the
  spine + packs — it is **NOT a retail dispensing PMR** (we integrate with that, never rebuild it). All
  of this bolts onto the **robust stock spine** (W6.1 inventory + AP.3 batch/lot/expiry + OP.3 products
  & retail + DN.6 lab/order — confirmed robust, Roland 2026-06-30).
  - **PH.1 In-Clinic Medication Supply (light dispensing)** — *Plan:* prescribe → label → supply record
    → stock decrement; for clinics that supply directly (weight-loss/aesthetics/travel). *Con→Pro:*
    "dispensing is a whole retail PMR" → a **light supply layer (AP.6 + OP.3 + a label)**, not a TITAN
    competitor; full retail = integrate. *Base: AP.6 + OP.3.*
  - **PH.2 Controlled Drugs Register** *(multi-pack legal standout)* — *Plan:* running balance · witnessed
    entries · who/what/when, per the Misuse of Drugs regs. *Con→Pro:* "a strict legal artifact" → **stock
    (W6.1) + audit + FR.3 witnessing**; serves **every drug-holding clinic** (aesthetics, weight-loss,
    surgery), not just pharmacy. *Base: W6.1 + audit + FR.3.*
  - **PH.3 Monitored Dosage Systems (MDS) / Blister Packs** — *Plan:* dosette packing schedules (care
    homes / complex repeats). *Con→Pro:* "niche" → a packing schedule on the **repeat (NP.3) + recall
    (W2.3)** engines. *Base: NP.3 + W2.3.*
  - **PH.4 Medicine Verification (FMD) — SKIP (Roland 2026-06-30).** Scan each pack's barcode against a
    central database to prove it's genuine/in-date/not-recalled, then decommission it. **Defunct in Great
    Britain since 31 Dec 2020** (SecurMed GB switched off post-Brexit; only NI follows EU FMD), AND the
    clinically-useful part (never supply expired/recalled stock) is **already covered by AP.3 batch/expiry
    + recall checks**. Decision: not built; if a UK national verification scheme launches, add a barcode +
    hub adapter then.
  - **PH.5 NHS EPS / FP10 / Pharmacy First — DEFERRED, Phase 3+** (NHS plumbing, like NP.8).
  - *Covered by spine + packs:* IP clinics + private prescribing → **AP.6** · weight-loss GLP-1 → **Row
    18** · travel/vaccination → **OH.4**.

- **Diagnostics & Imaging Pack** *(Bible 4.9 Row 16 — Sectra · Soliton · Intelerad · Insignia + the
  open-source stack Orthanc / dcm4chee / OHIF / Cornerstone3D; IM.1–IM.5 greenlit 2026-06-30).* RolDe
  owns the imaging **workflow (RIS)** and — the key finding — can **self-host the whole imaging stack**
  with open-source, themed as ours. **DICOM is an OPEN standard**: a Siemens/GE/Philips modality outputs
  vendor-neutral DICOM, so there is **no lock-in at the data layer**.
  - **IM.1 Imaging Request & Modality Worklist** — *Plan:* order a study + a DICOM Modality Worklist
    (MWL / UPS-RS) so the scanner pulls the booked patient. *Con→Pro:* "MWL is a DICOM server" → the
    **OP.2 DICOM engine already speaks DICOM**; the order rides **DN.6/W3.2**. *Base: DN.6/W3.2 + OP.2.*
  - **IM.2 RolDe DICOM Viewer (open-source, OURS, themed)** — *Plan:* a zero-footprint in-chart viewer
    built on **Cornerstone3D / OHIF** (MIT, WebGL — the engine the radiology industry already uses),
    **skinned as RolDe**. *Con→Pro:* "build a medical-grade viewer?" → we don't build from scratch;
    Cornerstone3D/OHIF is open-source and explicitly built to be configured/extended/themed — we embed +
    theme it, **self-hosted, ours**. *Base: Cornerstone3D/OHIF, RolDe-themed.*
  - **IM.3 Structured Radiology Reporting** — *Plan:* templates + **RolDe-AI** voice/draft + sign-off +
    peer review. *Con→Pro:* "structured reporting + voice" → **GP.7 reports + AP.8 templates + W5 (our
    own AI) + AP.6 countersign**. *Base: GP.7 + AP.8 + W5 + AP.6.*
  - **IM.4 Referrer Portal + Report Delivery** — *Plan:* referrers refer / track / download; report to
    patient + referrer within SLA. *Con→Pro:* "a new referrer surface" → referrers **are Organisations
    (OH.1)**; the portal is the **GP.4 lens**; delivery is **GP.3 (reversed) + RoChat**. *Base: OH.1 +
    GP.4 + GP.3 + RoChat.*
  - **IM.5 Image Archive (PACS/VNA) — a CARETAKER TOGGLE: self-host OR integrate (Roland 2026-06-30)** —
    *Plan:* a per-clinic switch — **(A) Self-host (default, our rule):** run **Orthanc** (lightweight; REST
    + DICOMweb; Docker) or **dcm4chee** (enterprise VNA) on **our** infra — the modality sends DICOM
    (C-STORE) straight to us. **(B) Integrate** the clinic's existing PACS via **DICOMweb** (QIDO/WADO/STOW-RS;
    a gateway bridges legacy DIMSE) — so a clinic that doesn't want to keep paying its PACS vendor can flip
    to (A), and one happy with its PACS stays on (B). *Con→Pro:* "PACS is locked vendor infra" → **DICOM is
    OPEN**; open-source Orthanc/dcm4chee let us **BE the PACS, self-hosted** — no lock-in, no per-seat licence.
    *Base: Orthanc/dcm4chee + DICOMweb + a Caretaker toggle.*
    - **Storage architecture (Roland's "DICOM is massive" question, 2026-06-30) — NEVER in the database.**
      DICOM is big (X-ray 5–15 MB · CT 100–500 MB · MRI often >1 GB; lossless JPEG2000 shaves 30–70%). So
      we **split**: the small **index/metadata** → Postgres (Supabase or Orthanc's PostgreSQL); the heavy
      **pixel files** → **object storage** via Orthanc's S3 plugin. Object store = **self-hosted MinIO**
      (S3-compatible, our infra, zero egress — the our-rule default) **or** **Cloudflare R2** (S3-compatible,
      **no egress fees**, ~£12–15/TB-mo) / S3 / Backblaze B2, with **hot/warm/cold tiering** (old studies →
      cold ~£1–4/TB-mo). **Supabase stays for the app + records, NOT the DICOM blobs.** Cost scales linearly
      and stays modest — a busy imaging centre (~1–2 TB/yr) is **tens of pounds/month**, not thousands; the
      Orthanc server is a small VM. Enterprise scale = the same pattern, more MinIO nodes / a bigger bucket.

- **Veterinary Pack** *(Bible 4.9 Row 17 — ezyVet/IDEXX · Provet Cloud · Covetrus Pulse · Shepherd ·
  Digitail; VT.1–VT.5 greenlit 2026-06-30 — Roland: "RolDe is a Clinical Operating System… why not animals
  too?").* **~85% the human spine** — only the owner-animal model + weight dosing are new. RolDe serves
  animals too (no longer "parked expansion" — a real pack).
  - **VT.1 Owner–Animal Data Model** *(the one real twist)* — *Plan:* client (owner) ↔ patient (animal);
    multi-pet households; species/breed/weight. *Con→Pro:* "the patient isn't the payer" → reuses **linked
    records (MH.7) + the OH.1 client/Organisation pattern** (owner = a client with linked animal-patients).
    *Base: MH.7 + OH.1.*
  - **VT.2 Weight-Based Dosing & Species Formulary** — *Plan:* auto-dose by weight + species formulary +
    vet calculators (fluids/anaesthesia). *Con→Pro:* "species/weight dosing is vet-specific" → **prescribing
    (AP.6) + a weight dose-calc + a pre-seeded species formulary (data)**. *Base: AP.6 + calc + data.*
  - **VT.3 Hospitalisation / Treatment Board** — *Plan:* inpatient whiteboard, anaesthesia tracking, tasks,
    discharge notes. *Con→Pro:* "inpatient sheets" → the **Ward Map (W1.5.3) + care pathways (GP.2)** built
    for human wards. *Base: W1.5.3 + GP.2.*
  - **VT.4 Vet Lab & Imaging** — *Plan:* IDEXX reference + in-house VetLab results; imaging. *Con→Pro:*
    "IDEXX integration" → the **Lab spine (W3.2/DN.6) + a lab adapter**; imaging = **IM.1–IM.5** (DICOM
    identical). *Base: W3.2/DN.6 + IM.*.*
  - **VT.5 Reminders, Dispensing, Pet Portal & Owner Billing** — *Plan:* vaccination reminders + in-clinic
    dispensing + pet insurance claims + owner portal. *Con→Pro:* all reuse — **OH.4 + W2.3 + PH.1 + GP.1
    (pet insurance = a payor) + GP.4**. *Base: OH.4 + W2.3 + PH.1 + GP.1 + GP.4.*

- **Wellness, Weight-Loss, IV & Longevity Pack** *(Bible 4.9 Row 18 — Superpower · Next Health · Aniva ·
  Forum Health · Drip IV · Pabau-wellness; WL.1–WL.5 greenlit 2026-06-30).* The purest **configuration, not
  construction** pack — **~100% reuse**; the only spark is the AI biomarker action-plan.
  - **WL.1 Weight-Loss / GLP-1 Programmes** — *Plan:* GLP-1 prescribing + dose titration + safety labs
    (HbA1c · metabolic panel) + coaching. *Con→Pro:* "a new programme" → **WH.1 hormone-style monitoring
    applied to GLP-1** → **AP.6 + DP.4 + GP.2 + PH.1**. *Base: AP.6 + DP.4 + GP.2 + PH.1.*
  - **WL.2 Biomarker Panels & Health Optimisation** — *Plan:* 100+ biomarker panels + trends + a
    biological-age / action-plan. *Con→Pro:* "100+ biomarkers + an action plan" → **W3.2 labs + charting +
    GP.5 screening packages**; the bio-age/action-plan is a **RolDe-AI (W5)** output (the one faintly-new
    spark). *Base: W3.2 + GP.5 + W5.*
  - **WL.3 IV Therapy & Injectables** — *Plan:* a drip / vitamin-shot menu + administration record +
    packages. *Con→Pro:* "an IV menu" → **OP.3 products/services + a procedure record + W1.1.10 packages**.
    *Base: OP.3 + W1.1.10.*
  - **WL.4 Membership & Coaching Programmes** — *Plan:* subscription memberships + coaching touchpoints +
    education modules. *Con→Pro:* "subscription + coaching" → **GP.6 subscription + GP.2 coaching pathway +
    GP.4 portal + RoChat**. *Base: GP.6 + GP.2 + GP.4 + RoChat.*
  - **WL.5 Supplement Recommendations & Sales** — *Plan:* personalised supplement plans + retail.
    *Con→Pro:* "supplement sales" → **OP.3 Products & Retail + the WL.2 action-plan** as the recommendation
    source. *Base: OP.3 + WL.2.*

- **Complementary & Integrative Pack** *(Bible 4.9 Row 19 — Jane · Cliniko · SimpleClinic · Unified
  Practice · Smart TCM; CM.1–CM.3 greenlit 2026-06-30).* The **leanest pack** — the spine + three small
  additions.
  - **CM.1 Modality Intake & Notes Templates** — *Plan:* TCM (tongue/pulse/pattern differentiation),
    homeopathy (remedy/potency), naturopathy, herbalist. *Con→Pro:* "modality-specific intake" → the
    **templates engine (AP.8)**, pre-seeded per modality. *Base: AP.8.*
  - **CM.2 Acupuncture Point / Meridian Charting** — *Plan:* mark acupoints/meridians on an interactive
    body diagram, tracked per session. *Con→Pro:* "acupoint charting" → the **AP.1 body-map with a meridian
    atlas** — the *same renderer* (face → lesion → teeth → acupoints). *Base: AP.1.*
  - **CM.3 Herbal / Remedy Prescriptions** — *Plan:* herbal formulas (auto-quantities, interaction check,
    grams/taels) + homeopathic remedies. *Con→Pro:* "herbal formulas + units + interactions" → **AP.6
    prescribing + W6.1 inventory** with a herbal formulary; a formula is a multi-ingredient Rx. *Base: AP.6 + W6.1.*
  - *Spine reuse:* booking · packages (W1.1.10) · outcomes (PT.2) · payments · consent (AP.4) · supplement
    plans (WL.5).
  - **Governance — clinical neutrality + RolDe-AI honesty (Roland 2026-06-30).** Some modalities (e.g.
    homeopathy) aren't evidence-based. RolDe stays **clinically neutral** — a faithful record-keeping +
    practice-management layer that documents what the practitioner does, **never endorsing efficacy**. AND
    **RolDe AI must be HONEST about the evidence base**: in a non-evidence-based context it documents
    faithfully but **never manufactures clinical justification or fabricates efficacy**, may flag where a
    modality lacks trial evidence, and **never lends false authority** (Bible 4.7 ambient AI; clinical-
    industry-standard). Patient-safety-critical — quote the Bible, never improvise clinical wording.

- **Surgical & Day-Surgery Pack** *(Bible 4.9 Row 20 — Meddbase · PICIS · Personify Care · Provation +
  the WHO-checklist / NHS MDT-streamlining evidence; SU.1–SU.5 greenlit 2026-06-30 — "must be done
  perfectly").* Even the most complex setting is **~80% spine**; its safety-critical pieces reuse the
  blocking-modal, batch-tracking and witnessing engines.
  - **SU.1 Theatre / OR Scheduling** — *Plan:* theatre lists + surgeon/anaesthetist/resource scheduling +
    utilisation + a live board. *Con→Pro:* "theatre/resource scheduling" → **W2.1 + rooms (W1.1.6) +
    multi-resource (MH.7) + the Ward Map live-board (W1.5.3)**. *Base: W2.1 + W1.1.6 + W1.5.3.*
  - **SU.2 Pre-op Assessment + WHO Surgical Safety Checklist** *(safety-critical)* — *Plan:* pre-op
    workup (consent/VTE/obs) + the WHO **sign-in → time-out → sign-out** checklist. *Con→Pro:* "the WHO
    checklist" → **AP.7 + AP.8 + AP.4 + a *blocking* checklist** — the time-out **is the blocking-modal
    gate** (the break-glass pattern). *Base: AP.7 + AP.8 + AP.4 + the Blocking Modal.*
  - **SU.3 Operation Notes + Implant Registry + Counts** — *Plan:* structured op notes + implant log
    (lot/serial · laterality · recall) + swab/instrument counts. *Con→Pro:* "op notes + implants + counts"
    → **AP.8 templates + AP.3 batch/lot** (an implant is a tracked device) + **FR.3 witnessing** (the count
    is a witnessed chain-of-custody — the IVF engine). *Base: AP.8 + AP.3 + FR.3.*
  - **SU.4 Peri-operative Flow** — *Plan:* admission → theatre → recovery (PACU) → discharge + bed +
    anaesthetic chart. *Con→Pro:* "peri-op flow + beds" → **Ward Map (W1.5.3) + a peri-op care pathway
    (GP.2)** + an anaesthetic form. *Base: W1.5.3 + GP.2.*
  - **SU.5 MDT Meetings & Care Coordination** *(the "everything-requested, perfectly-sorted" engine)* —
    *Plan:* an **MDT Case** coordination object that sits on the **order spine**. A case (e.g. "?Lymphoma")
    aggregates the patient + lead clinician + MDT team + **every linked investigation as an order (W3.2)**
    (CT-guided biopsy · histology · MRI head · bloods), each with a **live status** (requested → scheduled →
    done → reported). Results flow back onto the order **and into the Clinical Notes feed**; a **readiness
    gate** (NP.7 completeness check) flips the case to "ready for MDT" once required results are in; the
    **MDT meeting view** lists the session's cases with images (IM viewer) + history; a **structured
    decision** (diagnosis · stage · plan · owner) is recorded → posts to the feed and **spawns the next
    orders / referrals / letters + RolDe Cadence follow-ups — closed-loop, nothing falls through.**
    *Standard:* the **MDT / tumour-board + cancer-pathway** model (NHS MDT-streamlining; FHIR). *Con→Pro:*
    "a whole coordination system" → it's the **order spine (W3.2/DN.6) + GP.2 pathway + NP.7 completeness +
    the feed + Cadence + GP.3 referrals + IM viewer + Confer/Concerns (W1.6)** composed into a case object —
    every piece already exists; the MDT Case is just the **conductor**. *Base: W3.2 + GP.2 + NP.7 + feed +
    Cadence + GP.3 + IM + W1.6.*
  - *Spine reuse:* surgical packages + insurer billing → **GP.1**; follow-up → **RolDe Cadence**; referrals
    → **GP.3**; theatre imaging → **IM.***.

- **RolDe Courier — the clinical postal system** *(LOCKED + GREENLIT, Roland 2026-07-02; absorbs W3.3's
  delivery half + gives GP.3 its rails — named, unified, nothing double-built).* Everything RolDe creates
  can be **sent, tracked, received, and provably SEEN**:
  - **Send** — a letter goes to the patient's **GP** (email on the patient profile), the **patient**, an
    internal **department**, **another RolDe clinic** (direct feed-to-feed handover, no email), or any
    **external doctor** (address book). Attaches the audited LetterPdf artifact; rides the existing
    Resend delivery rails (sent → delivered → opened webhooks).
  - **Track** — the tile's status pill is live (*Not Sent → Sent to GP → Delivered → Opened*); clicking it
    drops the **journey timeline** (parcel-tracking: each step + timestamp + reference).
  - **Receive + unread — ✅ C1 BUILT 2026-07-02; semantics + skin FINAL 2026-07-03 (Roland)** — inbound
    items land in the Clinical Notes feed as typed tiles. **Unseen is TEAM-LEVEL, not per-user (Roland
    2026-07-03):** a tile is "Unseen" until **anyone other than its author** opens it once — then it's
    reviewed for the whole clinic (a physio isn't nagged about a referral the GP-liaison already read).
    The author's own click never counts as the review. The pill is **PASTEL amber (warning/15 wash +
    amber text — Earth & Bloom, never a solid shout)**, anchored TOP-RIGHT; **clicking THE PILL
    (deliberate, never in-passing, never on scroll) flips it to "Read ✓"** and writes the audited
    per-user **read receipt** (`feed_entry_reads`, append-only; one per person — their FIRST read,
    re-reads are no-ops). The **eye** opens the **Read-by window** — an anchored popover, two lines per
    reader (full name · time beneath, earliest tagged *first* — the reviewer of record); the SAME
    popover grammar carries the Sent journey in C3. The header pill "N Unseen" matches the count pill's
    size, and **clicking it JUMPS to the oldest unread entry**. Wording law: **"read", never "seen"**.
    Time+date sit at the tile's **bottom-centre** (URDS Feed Tile v2). NO bulk mark-read (safety).
    Critical results later get an explicit acknowledge on the same rail (W3.2). *Verified live: team
    semantics proven (an entry read by one member shows no pill to another) + real DB receipts from
    both dev users; Roland verified the flip + Read-by on production himself.*
  - **Urgency colours (Roland 2026-07-02)** — a result tile's squircle carries the semantic tone from the
    result's OWN flags (green in-range · amber borderline · red critical) — triage at a glance; RolDe
    displays urgency, never invents it.
  - **Transport, encrypted end-to-end** — TLS in transit · AES-256 at rest · patient-bound mail defaults
    to a **secure link** (RolDe-auth'd, expirable, revocable, access-logged, optional DOB identity check)
    over attachment · SHA-256 artifact fingerprints · SPF/DKIM/DMARC · a **kill-switch** revoking all
    outstanding links for a letter (the wrong-address safety valve).
  - **Settings (Caretaker card)** — delivery-method default (secure link | attachment) · patient-consent
    gate · Address Book (GP practices, labs, private consultants) · sending identity · chase rule (nudge
    unopened referrals after N days, via Cadence) · **countersign gate** (trainee letters need a senior's
    sign-off) · **delegated sending** (secretary on behalf of clinician, both audited) · **typo guard**
    (suspicious/first-time addresses confirm-step) · link lifetime + retention · quiet hours (patient
    sends hold overnight) · per-recipient-type defaults · test-send. All Change-Describer audited.
  - *Build order:* C1 read-receipts + New→Seen + "N new" header (no email needed) → C2 GP/contacts fields
    + Address Book + Settings card → C3 outbound email (secure link + attachment, webhooks → live status
    pill + journey) → C4 RolDe↔RolDe handover + departments → C5 chase/kill-switch/countersign polish.

- **RolDe Compass — the Unified Day View (Calendar + Tasks)** *(LOCKED + greenlit, Roland 2026-06-30; a
  **Sidebar** item).* Roland: "I hate that Calendar and Reminders are separate — our day is entwined."
  **Merge W2.1 Calendar (timed appointments) + W1.4.1 Action Queues / tasks (untimed to-dos) into ONE day
  surface** so a user sees their whole day at a glance and plans it. *Distinct from the patient-recall
  engine* (that's **RolDe Cadence** — automated patient-facing comms; Compass is the *clinician's
  own day*). **Design (greenlit):** the day view = the **timed calendar column** + the **day's task list
  alongside**; a task can be **dragged onto a time-slot** or left as a checklist; tasks not for today sit
  in a **backlog** you pull from (pattern proven by Sunsama/Motion/Akiflow). *Con→Pro:* "appointments and
  tasks are different shapes" → merge the **VIEW**, keep the data distinct underneath — calendar and task
  list each stay clean, Compass composes them into one day. *Base: W2.1 + W1.4.1 → RolDe Compass (sidebar).*

### 15.7a Addenda & Polish ledger — refinements to BUILT things (Roland 2026-06-21)

The net-new WBS above is only half the work; alongside it runs a stream of small changes to
things already shipped. Tracked HERE, in the Build Register, grouped by module (Roland's call:
a section's polish lives next to the section — one doc, no new file). Tick as done; append as new
addenda surface.

- **Hubs / cards (Settings · Logs · Control):**
  - [ ] **Card tint saturation** — the flat Counter-card tints sit at mindate's opacity; dial
    punchier if Roland's eye wants it (a one-token change to `TONE_WASH` in `SectionHubGrid`).
  - [ ] **Clinic Profile card value** is a placeholder (`Set`) — give it a meaningful at-a-glance
    value (e.g. completeness) or leave as-is.
- **W1.1.7 Users & Roles:**
  - [ ] **"Suspend/Suspended" → "Revoke"?** Roland's naming call. If Revoke, align the DB `status`
    value too (deep, not just the label — no old word lurking).
  - [x] **Retire legacy** `gmc_number/gdc_number/nmc_pin` columns ✅ done (migration `20260617130000`; superseded by `license_type/number`).
- **W1.1.13 Email Templates:**
  - [ ] **Wire the RolDe OS wordmark PNG URLs** into the email shell (post-deploy; serif-text
    placeholder until then).
- **Logs / audit spine (Bible 4.1 §5.4):**
  - [ ] **Reconcile `audit_log`** — the shipped table is lean (actor · action · summary · metadata);
    the bible documents a richer schema (actor_role · before/after_state · ip · user_agent). Enrich
    the table OR update the bible to match what we shipped. (`auth_audit_log` already carries IP + device.)
- **W0.2 Legal:**
  - [ ] Fill the **ICO registration number**; confirm/adjust the **£25k liability floor** (Roland's facts).
- **W0.1 Login security (rides the pre-launch HIBP gate):**
  - [ ] When HIBP/Pro lands: drop the interim **password-class rule → length-only** (server +
    `lib/password.ts` + the `/reset` meter, same pass).

### 15.7b Logs Enrichment — auditor-grade exports (Roland 2026-06-22)

The standard (ISO 27001 A.12.4 / NIST AU-3 / NHS+GDPR): a trail must reconstruct **who (+ role) ·
what (+ the object) · when (UTC) · where (IP/device) · source · purpose · outcome · integrity**.
Design law: **calm screen, forensic-complete EXPORT** — the auditor's CSV/PDF carries the full set.

- **Phase 1 — surface what's already captured ✅ DONE 2026-06-22** (commits `d94ec4e`, `0b34eea`):
  - Communications → Type · Provider Message ID · delivery timeline (UTC) · Failure Reason · Source.
  - Activity → Action code · Resource (type · id) · Details · UTC.  Sign-in → Email · Outcome ·
    Method (best-effort) · UTC.  Export Log → Size · UTC.  Shared `fmtUtc()` for every export stamp.
  - Verified live: all 8 surfaces (each log × clinic + Custodian) render; real CSVs carry every new
    header; data populates. *(Known data-gaps, not bugs: Activity "Details" blank until we capture
    before/after into metadata; Sign-in "Method" blank where the upstream has none.)*
- **Phase 2 — Patient Access break-glass ✅ DONE 2026-06-22** (migration `20260622120000`). Migration on
  `patient_access_log`: + `actor_role` · `ip_address` · `user_agent` · `purpose`
  (`direct_care`|`administrative`|`records_request`|`safeguarding`|`other`, CHECK-constrained, NULL = pending)
  · `reason` (free-text for "other") · `break_glass` (bool). `logPatientAccess()` now captures role + IP +
  device and **infers purpose (zero friction)** — `direct_care` when a *legitimate relationship* exists.
  **Care-link signals available today** (no appointments/consults table yet): the accessor CREATED the
  patient record, or AUTHORED a clinical note for them. **Break-glass fires on the ABSENCE of any care link**
  (not a date): a **non-blocking** chip (`BreakGlassPrompt`) — record opens immediately, reason captured
  just-in-time via a service-role server action (`fillBreakGlassReason`) gated to the accessor's own
  still-pending row (one-time; table stays append-only for users). Shared vocab in `lib/patientAccess.ts`.
  Screen adds a Purpose column (amber Break-glass pill); export now carries Role · Purpose · Break-glass ·
  From where (IP+device) · When (UTC) — on both the clinic and Custodian Access logs.
  - **Bug caught + fixed by the negative-case verify (the reason this matters).** First cut had
    `logPatientAccess()` do `.insert().select("id")` to get the id for the chip. But `.select()` forces a
    RETURNING **read-back**, which must pass the *read* policy (`is_custodian() OR is_caretaker_of`). A
    Caretaker passes → her access logged fine; a **clinician/nurse does not** → reading their OWN just-
    inserted row is denied, so the whole insert failed RLS and their access (incl. break-glass) silently
    didn't log. **Fix:** pre-generate the id (`crypto.randomUUID()`) and insert with NO read-back — the
    write is role-blind again (inserting your own row is allowed; reading the log isn't). Without the
    negative-case test this would have shipped as a silent audit gap for every non-Caretaker role.
  - **Verified END-TO-END in the running app:** no-friction path — Caretaker opens a care-linked patient →
    real row `direct_care`, `break_glass=false`, role/IP/device captured, no chip. Negative path — a
    **clinician (no care link) opens a record → real row `break_glass=true, purpose=NULL`**, role/IP/device
    captured, and the **chip renders** ("opening a record outside your direct care" + the 5 reason options).
    Fill logic + one-time gate proven at the DB layer (fill sets purpose once; refill + wrong-user both
    no-op). Typecheck clean. *(One link not exercised in-browser: the literal chip-click→fill round-trip —
    the heavy consultation page doesn't hydrate in the headless preview, so the button had no handler to
    fire; the fill path itself is verified via the server action + the DB-level gate test.)*
  - **Note:** session-refresh middleware **does** exist — Next 16 renames `middleware.ts` → `proxy.ts`
    (`src/proxy.ts` runs `updateSession` on every matched request). (An earlier note here wrongly said it
    was missing; corrected.)
  - Still open: **`audit_log` reconciliation** (capture before/after into metadata so Activity "Details" fills).

---

### Commerce & Booking — the money thread *(greenlit Roland 2026-06-18)*

The whole money story is **toggle-first**: a clinic sees only what it has switched on, so a cash-only,
VAT-free practice gets a clean OS while a busy aesthetics clinic gets deposits, BNPL, credit and codes.
It threads through the waves above (W1.1.8 Services v2 · **W1.1.16 Commercial Settings** · W1.1.11
Integrations · W2 booking/appointments · W4 Money) rather than living as a separate track.

**Build order (the chunks):**
1. **Commercial Settings** (W1.1.16) — the toggles hub: VAT, Deposits, Consultation Credit, Discount
   Codes. *(First chunk — everything else reads these switches.)*
2. **Services v2** (W1.1.8) — categories + code + type + the conditional VAT/deposit fields.
3. **Integrations → Payment gateways** (W1.1.11) — clinic-owned Stripe/PayPal/Klarna/Clearpay, own
   keys, live/sandbox, 0% to RolDe.
4. **Appointments + booking** (W2) and **Consultation Credit / Discount Codes** (W4) — the live money flow.

**Three questions Roland asked, answered (the design rulings):**

- **Does Consultation Credit / Appointments mean every patient gets a login?** *Not in v1.* Credit is
  **credit-on-account held on the patient record** — staff see and auto-apply it; no patient login
  needed. Booking is a **passwordless public widget** (book + pay, no account). A full **Patient
  Portal** where patients log in to see records, credit balance and rebook is **W6.4 (later)** — and
  when it lands, Roland's instinct is exactly right: the *"first payment → claim your account"* email
  is the onboarding (a single-use magic-link, same pattern as the staff invite). The idea is sound;
  it's just sequenced after the core money flow.
- **Is there a login page on the clinic's front-end website (e.g. Doc For Skin)?** *Not in v1.* The
  clinic website (Bible 5.M / W6.6) carries the **booking widget** (passwordless) — no login. **Staff
  sign in to RolDe OS at the app domain (rolde.app), never the public site.** A **"Patient Login" on
  the clinic site appears with the Patient Portal (W6.4 + W6.6)** and SSOs into that clinic's portal.
- **Are payment gateways + API keys toggles — clinic uses their OWN keys for live or sandbox?**
  ***Yes, exactly.*** This is the **clinic-owned gateway (Scenario 1)** model: each gateway is an
  off-by-default toggle in Integrations; switching it on reveals **the clinic's own publishable +
  secret keys** and a **live / sandbox switch** so they test then go live. **Money settles into the
  clinic's own account — RolDe takes 0% and never holds funds**, so no settlement/PCI liability on us.
  Secret keys are write-once (`•••• last4` + Replace; never read back).

---

### Dev & QA fixtures *(test-only — not real users/data; Roland 2026-06-16 "keep them, document them")*

- **Per-role test users** — one passwordless test user per staff role lives in **Doc For Skin**, email
  pattern **`<role>@qa.rolde.app`** (curator/concierge/clinician/locum/nurse/chemist/cunnere/cofferer,
  display names **`Jarvis <Role>`** — renamed from "QA" 2026-06-19 on Roland's call; the email stays
  `@qa.rolde.app` as the fixture identifier). Purpose: log in as each role to verify what it sees / is
  blocked from as per-role gating (W1.1.7) is built. Seeded by `apps/web/scripts/dev/seed-roles.mjs`
  (gitignored). They WILL appear in the Doc For Skin Users list — they're fixtures, removable anytime;
  grep `@qa.rolde.app` to clear.
- **Dev role-login** — `apps/web/src/app/api/dev/login?email=…` lets the builder assume any role in
  the LOCAL preview (mints a session server-side, no credential exposed). **Gitignored + NODE_ENV +
  ALLOW_DEV_LOGIN gated — physically never ships to production.**

---

## End of Bible 4.8

This Bible doesn't add new capabilities — it sequences the capabilities specified everywhere else. When in doubt about whether something belongs in Phase 1 or later, consult §10. When deciding whether to invest now or wait, consult §9. When tempted to compromise a constitutional commitment "for now," consult §13.

The next sub-Bible is **Bible 5 — Doc For Skin (the clinic itself)**. This requires interview before drafting. After Bible 5 comes **Bible 5.M — docforskin.com (the website)**, then **Bible 6 — Doc For Drivers (the clinic itself)**, then **Bible 6.M — docfordrivers.com (the new website)**.

— Roland Manoj Jayasekhar, with Devipangaj
RoDee, May 2026
