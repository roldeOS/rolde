# RolDe Bible Interview — Captured Responses

> Roland's answers to the Bible 4.0 (RolDe Manifesto) interview clusters. Captured verbatim where possible, summarised where helpful. To be incorporated into Bible 4.0 when drafted.

---

## Cluster A — Vision and Philosophy (CONFIRMED)

### A1 — The Five-Year Headline

Roland's answer: "RolDe is a platform that finally understood software needs in healthcare."

The word "finally" is doing important work — it positions RolDe not as innovation but as belated correction. Healthcare software should always have worked this way; RolDe is the first that does.

### A2 — Pabau's Deepest Failure

The philosophical failure of most software is that it is designed by software engineers with conceptual input from healthcare professionals. RolDe fundamentally differs: visualised, conceptualised, designed, engineered, structured, coded and tested by a doctor (Roland).

Healthcare software requires solutions to problems that only healthcare professionals face. Healthcare delivery comes with a critical caveat: time. Every clinician is racing against time, treating a patient who needs their attention, and definitely doesn't need cumbersome software as another hurdle.

Thesis: Healthcare software has been designed by engineers with consultative input from clinicians. The relationship is the wrong way around. Engineers cannot intuit the lived experience of needing software to disappear while a deteriorating patient sits in front of you. Consultative input misses the thing that matters most. RolDe inverts this — built from the inside.

### A3 — What RolDe Refuses To Do

RolDe refuses to be another piece of software created by a non-healthcare professional. Every decision — design, architecture, future-proofing, layout, flow, pipeline — has the core foundation that it is designed for a health professional.

If a design decision makes the doctor work extra, that is not good design.

Steve Jobs: "The best design is one that you do not notice."

Constitutional standard: RolDe's success is measured by its invisibility. If a clinician is thinking about RolDe during a consultation, RolDe has failed at that moment.

### A4 — Who RolDe Is For

RolDe is for healthcare — it is an operating system. Any clinic who wants to get on board with the operating system of the future.

Realistically NHS is not the launch market — old bureaucracies and decade-long contracts are political hurdles. Initially: any healthcare professional — dermatologist, orthopaedic surgeon, GP, aesthetic provider, etc.

Protagonist of RolDe: Roland Manoj Jayasekhar with his soulmate Devipangaj (Dee).

### A5 — The Emotional State at End of Day

Software should blend into the background. A doctor should not be tasked with finding out how to send a referral at 7pm after a 12-hour shift. Software should do that.

Agentic AI and ambient AI should have in their pipeline to figure out if the doctor needs a referral and do it in the background without causing hassle. It's that simple.

Right now, almost all software is clunky visually and functionally. It's 2026 and something needs to change.

Emotional state extracted: Unburdened. Trust. The clinician at end of day did medicine today; the software took care of itself.

---

## Bible 4.0 Foundation Paragraph (Composed from Cluster A)

RolDe is a healthcare operating system designed, architected, and built by a practising doctor — Roland Manoj Jayasekhar, with Devi as his soulmate behind the work. It exists because thirty years of healthcare software has been built by people who don't practise medicine, with clinicians as advisors rather than authors. The result has been universally clunky, cognitively expensive software that fights clinicians instead of supporting them. RolDe inverts this. Every decision is measured against a single standard: does it respect the clinician's time and attention, or does it add to their load? RolDe's job is to disappear into the background — to handle referrals, letters, results, scheduling, communication, prescribing, and clinical documentation so seamlessly that the clinician doesn't think about software during a consultation, and doesn't think about software at the end of a 12-hour shift. RolDe will not pursue the NHS at launch because NHS bureaucracy is a tar pit. Instead it will serve practising clinicians in private settings — dermatologists, GPs, aesthetic practitioners, orthopaedic surgeons — anyone who delivers healthcare and is tired of fighting their software. The five-year reputation: RolDe is the platform that finally understood what healthcare software needs to be.

---

## Architectural Implications From Cluster A

1. Doctor-as-architect must be visible in the product and marketing — Bible 4.M and Bible 4.2 should lead with this. Not "designed by clinicians for clinicians" but "designed BY a doctor."
2. Unforgiving design standard — "If a design decision makes the doctor work extra, that is not good design." Falsifiable test that every Bible, every Claude Code session, every UX decision must pass.
3. "Operating system" framing is correct and intentional. RolDe positions alongside iOS or macOS conceptually. Bible 4.0 must lean into this metaphor.
4. Personal meaning preserved in brand. RolDe = Roland + Devi. Not commercial branding; personal expression embedded in commercial product.
5. NHS deferral is principled, not opportunistic. RolDe is avoiding the bureaucratic tar pit that prevents good software reaching NHS clinicians. Intent is to serve NHS clinicians eventually when conditions allow.
6. Agentic AI + Ambient AI together. Ambient = continuous observation and synthesis. Agentic = autonomous action (referrals sent, letters drafted, results chased) without the doctor asking. Both together are the end-state vision.


---

## Cluster B — The Clinician Experience (CONFIRMED)

### B1 — Closed-Loop Referrals (architectural breakthrough)

Current state diagnosis: every EMR including Pabau ends the referral pipeline at PDF generation. Doctor types history/presentation/labs/treatment from scratch into a template, produces PDF, then is on their own to deliver it. Pipeline incomplete.

RolDe's closed-loop referral pipeline (six steps):
1. **Trigger detection** — Ambient AI reads notes and treatment plan, infers referral needed from plan ("rheumatology follow-up")
2. **Letter generation** — Ambient AI assembles letter automatically from existing record (demographics, history, current presentation, labs, imaging, treatment). No retyping ever.
3. **Doctor approval** — Doctor reviews/edits/approves drafted letter (seconds, not 15 minutes)
4. **Delivery (closed loop)** — Routed: to receiving RolDe instance OR email to receiving service OR print fallback
5. **Appointment intelligence** — When receiving service uses RolDe, real-time appointment slots surfaced to referring doctor
6. **Patient communication** — Confirmed appointment auto-emailed/SMS'd to patient

Architectural implications:
- Single source of truth: information entered once, all downstream artefacts (letters, prescriptions, referrals, discharges) derived automatically
- Agentic AI takes autonomous action (delivery, booking, communication) within doctor-approved boundaries
- Network effect: two RolDe-using services create frictionless referral edge; value compounds as more clinics join

Roland's diagnosis: "the pipeline is not complete" in current software. RolDe completes the pipeline.

### B2 — Patient Consultation Layout (canonical screen)

Layout structure:
- Top horizontal strip: patient vitals/salient data (always visible)
- Left vertical (split 70/30):
  - Top 70%: Patient notes feed (chronological, timestamped, like Twitter feed)
  - Bottom 30%: Text input field (saves to feed when committed)
- Right vertical (split 70/30):
  - Top 70%: Investigations area (labs, radiology, prescribing, orders — tabbed)
  - Bottom 30%: Ambient AI panel (RolDe suggestions, differentials, syntheses, "I don't know")
- Optional bottom horizontal strip: purpose TBD
- Left-aligned vertical navigation rail

Layout principles:
1. Horizontal screen real estate is exploited (modern monitors wider than tall)
2. Patient feed is chronological social-timeline pattern — newest at top, scroll back through history
3. Notes (left) and clinical actions (right) spatially separated; never compete for attention
4. AI panel anchored bottom-right; always visible but not dominant; ambient, not central
5. Top vitals strip = always-on context (allergies, NEWS2, key flags)
6. Standard left navigation pattern

Workflow: doctor on dashboard → clicks patient → file opens → chats with patient → types in bottom-left → saves → entries appear in feed (top-left). Future: ambient AI listens to consultation conversation directly.

### B3 — Prescribing/Labs/Radiology = Unified Clinical Orders

Critical insight: prescribing, lab requesting, and radiology requesting are the SAME kind of action. Share UI patterns, same right-pane treatment, same ambient AI surfacing.

Prescribing flow (using fever/paracetamol example):
1. Doctor sees dashboard → clicks patient → patient screen opens
2. Types presenting complaint into bottom-left text field → saves → enters timestamped feed
3. Goes to top-right pane → clicks Prescribing tab → searches "paracetamol" → clicks add
4. Saves → prescription appears as table entry in patient feed (left), with status column ("Not Dispensed")
5. Status tracks: dispensed, printed, sent to NHS pharmacy, sent to private pharmacy, dispensed from clinic stock
6. Ambient AI was already watching — read notes, suggested labs relevant to fever, suggested paracetamol BEFORE doctor needed to think of it

Architectural insight: "Each clinic will have their own requirements and we would be designing RolDe in such a way that during onboarding we will take into account all these questions and wire the app accordingly."

This is the OPERATING SYSTEM vocabulary made concrete. RolDe is not a fixed product with universal flows. It's a configurable platform where each clinic's onboarding wires the specific pipelines matching their reality. NHS pharmacy, private pharmacy, clinic-stock dispensing with billing, paper printing fallback — all configurable per-tenant.

Multi-tenant architecture isn't just data isolation — it's flow customisation per tenant.

### B4 — Calm as Constitutional Standard

Roland: "The dashboard should feel calm, quiet and visually pleasing in such a way that the daunting task of seeing perhaps 30 to 50 patients would seem pleasant."

Opposite of every existing EMR. Pabau's dashboard is anxious (counters, alerts, badges, overdue tasks competing for attention). RolDe's is meditative — patient list as central object, surrounded by negative space, no decoration that doesn't serve work.

Tested constraint: every dashboard variant measured against — does this leave the doctor feeling calmer or more anxious upon opening?

### B5 — Universal Dashboard, Role-Conditioned Content

Critical architectural answer: receptionist does NOT see a fundamentally different UI from doctor. Every role sees a dashboard. Dashboard CONTENT conditioned by role:
- Doctor: their patients today, their clinical work
- Receptionist: cross-departmental view, all appointments, all clinicians' availability, patient registration, payment processing
- Nurse: their assigned patients, their tasks, observations to take
- Solo practitioner: same dashboard, wears all hats

Ten-bed clinics need different dashboard variant — visual representation of bed occupancy. Outpatient clinics use appointment-list dashboard. Dashboard configurable based on clinic type, set during onboarding.

HR portal is a real feature, not afterthought. Each user has profile area where they:
- Upload their photos
- Log absences (subject to approval workflow)
- Approved absences automatically reflect in appointment availability across the clinic

Public-facing website booking integration is explicit: appointments booked on docfordrivers.com or docforskin.com flow into the SAME dashboard as walk-in or phone bookings. ONE unified appointment stream regardless of booking source.


---

## Cluster C — Architecture of the City (CONFIRMED)

### C1 — Subdomain Strategy and Tenant Identity

Structure:
- Tenant clinic dashboards: <clinicname>.rolde.app (e.g. docfordrivers.rolde.app, docforskin.rolde.app)
- Patient portals: patient.<clinicname>.rolde.app (subdomain-of-subdomain pattern)
- RolDe public marketing/sales site: rolde.app
- External clinic-owned websites: docfordrivers.com, docforskin.com (their own brand) — parallax single-page, RolDe appointment widget embedded, appointments flow into RolDe dashboard

Doc For Drivers and Doc For Skin are Roland's own companies — Roland codes their websites personally.
Doc For Skin website is urgent + barebones — basic appointment + payment + notes integration only.

Architectural implication: RolDe appointment widget must be embeddable into any external website. One widget, multiple host sites, all flowing into one dashboard. Bible 4.4 specifies widget architecture.

### C2 — Custodian/Steward Two-Tier Model

Custodian (Roland) — "like God":
- Controls all clinics under RolDe
- Pushes platform updates that propagate to all tenants
- Manages billing tiers and module pricing
- Approves new tenant onboardings
- Manages central AI updates, corpus, model versioning
- Owns rolde.app marketing site, onboarding flow, billing infrastructure

Steward (clinic principal) — clinic-level God:
- Owns tenant's full configuration
- Adds/removes users (doctors, nurses, receptionists, accountants)
- Sets up clinic identity (name, logo, branding)
- Configures referral pipelines (which receiving services, which email routing)
- Configures pharmacy integration
- Manages payment integrations (Stripe, insurance for US)
- Generates invoices
- Approves user absence requests
- Controls patient portal visibility settings

Self-serve SaaS onboarding flow:
1. Prospective clinic visits rolde.app marketing site
2. Picks modules + payment plan
3. Completes payment
4. Gets allocated subdomain (e.g. mycliniclondon.rolde.app)
5. Receives first Steward credentials
6. Logs in, configures clinic, adds users, enables modules

rolde.app marketing site is the entry funnel for every future clinic customer — not just brochureware, the front of the onboarding pipeline.

### C3 — Clinic-to-Clinic Data Movement

Within RolDe network (both clinics use RolDe):
- Steward of receiving clinic explicitly accepts "receivership of referral letters" from sending clinic (institutional consent)
- Patient consent obtained at consultation level (patient agrees to referral)
- Patient identity shared in referral letter
- Letter flows through RolDe-internal routing
- Receiving clinic ambient AI assists with appointment booking
- Network effect activates

Outside RolDe network (referral to NHS or external private clinic):
- Steward configures receiving service in clinic settings (e.g. "rheumatology referrals → xyz@email.com")
- Letter generated → exported as PDF → optionally password-protected → emailed
- Pipeline ends at PDF email delivery

Critical architectural commitment: Patient records DO NOT exist as single canonical entity across RolDe network. Each clinic holds its own patient records. Referrals carry information between them with consent. There is no "shared patient record across the network" — patient identity shared only in moment of referral.

This is the right choice for clinical safety, GDPR compliance, tenant data isolation. RolDe is a network of independent clinics, not a shared health record system.

### C4 — Onboarding Configurability

Configuration domains explicitly named:
- Pharmacy integrations (NHS, private, clinic stock, none)
- Lab/imaging integrations
- Payment flow (private only, NHS only, hybrid, insurance for US market)
- Specialties (research deliverable: list of major UK clinical specialties for auto-population)
- Practitioner roster (doctors, nurses, receptionists, accountants and scopes)
- Letter templates — ASSIGNED TO AMBIENT AI (NOT user-editable; ambient AI generates from source data per situation; no "letter template library" to manage)
- Consent forms — wired to settings, displayed by relevant specialty, RolDe-branded but compliant with regulated/approved bodies (BAAPS, BAD, BMA, Royal Colleges, GMC sources)
- Audit/compliance levels — extensive research needed

CRITICAL ARCHITECTURAL SHIFT: Letter generation is intelligent, not templated. Constitutional commitment.

Research deliverables for Bible 4.4 drafting:
1. Major UK clinical specialties list for auto-populate
2. Authoritative consent forms by specialty
3. Industry-standard audit/compliance levels for healthcare software
4. Competitor feature audit (what to adopt, what to reject)

### C5 — Module-Level Architecture and Monetisation

Universal modules (every clinic):
- Clinical notes
- Prescribing
- Labs
- Radiology (where relevant)
- Calendar/scheduling
- Patient management
- Audit log

Specialty-specific modules (unlocked per-specialty during onboarding):
- Ophthalmology-specific features
- Other specialties have their own patterns

Payment-flow modules (separate add-ons, paywall):
- Payment-gated investigations (patient must pay before lab/imaging order goes through)
- Payment-gated prescriptions (patient must pay before prescription dispensed)

Monetisation philosophy:
- Earn revenue without putting strain on clinic
- Don't feel overwhelming
- Don't feel like holding salient features back
- "Push a classy product so users stick around because of the novelty"

CRITICAL COMMITMENT: "If we show off our operating system without our ambient AI, we are actually showing a sub product."
Ambient AI is NOT an upsell — it is core RolDe experience available to every tenant from day one. Premium tiers are: Claude API fallback for hard cases, advanced specialty modules, payment-gating workflows. AI itself is included.

This inverts the rest of healthcare software business model where AI is the upsell.

### C6 — Ambient AI Panel Specifics

Layout (within bottom-right 30% of consultation screen):
- Free-form output (not slot-based)
- Streaming text or complete sentences depending on AI's response capacity
- Animation/refresh allowed but must be relevant (no wasted animation)
- Small split within panel where users can click to see sources AI pulled from (citation expansion)
- Print option for AI's response
- Thumbs up / thumbs down / query options
- Thumbs up: positive feedback recorded
- Thumbs down: doctor provides correction → enters Validated Correction Pipeline
- "Push to patient notes" button — promotes RolDe's suggestion into patient record, displayed as: *RolDe says "..."* (timestamped)

CORRECTION TO B2 LAYOUT: Patient feed flows TOP TO BOTTOM — newest at top, older below. Not bottom-loading. Each entry timestamped and user-stamped. New notes, prescriptions, investigations, results, ambient AI promoted suggestions all add to the top.

Citation handling: doctor clicks citation expansion within AI panel, sees which NICE/SIGN/eMC sections RolDe pulled from. Key trust feature — clinicians won't trust suggestions without source visibility.

### C7 — Patient Portal

Architecture:
- Patient receives credentials when registered (by Receptionist or via self-registration on public booking site)
- Patient logs in at patient.<clinicname>.rolde.app (subdomain-of-subdomain pattern)
- QR code alternative for quick mobile access
- Forgot-password and standard auth flows
- Patient sees: discharge summaries, lab results, radiology results (whatever Steward authorises), past and upcoming appointments
- Patient can: reschedule appointments, view their own data
- Patient cannot (rule of thumb): see doctor's clinical notes
- Steward controls visibility settings per-data-type


---

## CORRECTION FROM EARLIER: Patient Feed Direction

The patient notes feed direction is iMessage-style, not Twitter-style.
- Oldest entries at TOP
- Newest entries at BOTTOM
- View auto-scrolls to most recent on load
- New saves animate in at the bottom
- Conversation grows downward

This is genuinely better for clinical work — chronological reading order matches consultation flow (history → exam → investigations → plan).

Bible 4.2 (Design System) MUST specify: iMessage feed direction. This corrects the earlier reflection.

---

## Cluster D — The Ambient AI Deep Dive (CONFIRMED)

### D1 — The Agentic / Ambient Boundary

CORE PRINCIPLE: "RolDe drafts everything autonomously. RolDe sends nothing autonomously."

The ambient AI continuously observes, reasons, and produces ready-to-go artefacts BEFORE the doctor needs to ask. But every artefact that leaves the building requires explicit doctor approval. Drafting is autonomous; transmission is always doctor-authorised.

Example walked through (acute gout presentation):
- Patient describes presentation
- By the time doctor finishes typing, RolDe has already:
  - Drafted provisional differential (acute gout)
  - Drafted suggested investigations (serum uric acid + others from NICE)
  - Drafted suggested prescriptions (Colchicine, NSAIDs)
  - Drafted holistic plan including rheumatology referral
  - Drafted the actual referral letter, ready to review
- Doctor sees these as cards in bottom-right AI panel
- Doctor: ignore / click to open in modal / edit / approve
- Approved items push to top-left patient notes feed
- Status indicator on each item tracks: draft / approved / emailed / printed / dispensed / received

Two architectural commitments:
1. RolDe never sends, prescribes, books, or transmits anything without explicit doctor authorisation
2. RolDe is never silent waiting to be asked — always already drafting, always already thinking ahead

### D2 — Card Pattern, Direct Query, "I Don't Know"

Card pattern:
- Each AI suggestion appears as card in bottom-right 30% area
- Default cards have subtle shadow
- Critical/acute cards have red tinged border
- Each card has actions: approve & add to notes, query/dismiss, expand to see citations, edit before approving

Direct query function:
Within bottom-right 30%, there's also a section where doctor can ask specific questions ("what's the mechanism of action of metformin?", "contraindications for IV ceftriaxone?"). RolDe answers. Panel is DUAL-MODE: ambient (unprompted suggestions) and reactive (doctor asks direct questions).

"I don't know" behaviour:
- If RolDe cannot summarise/reach confident plan from available info: points to guideline reference, stays quiet
- If signs/symptoms don't yield confident interpretation: stays quiet
- "Stays quiet" means: no card appears for that aspect rather than misleading card
- Whatever does appear must have valid clinical grounds

Privacy commitment confirmed:
- AI suggestions never visible to patient via patient portal
- Patient notes (clinical reasoning, AI suggestions, drafts) are clinician-only
- Patient sees only: appointments, results, discharge summaries (Steward-controlled visibility)

### D3 — Voice Ambient AI + Patient Onboarding Email Pattern

Voice ambient AI:
- Gemma 4 has multimodal capability natively
- Roland wants it in Phase 1 if engineering-feasible
- If implementation heavy, moves to Phase 2
- Patient consent always required (digital or physical)

THE PATIENT ONBOARDING EMAIL ARCHITECTURE (substantial decision):

When patient is registered (by Receptionist or via self-booking), automatic welcome email sent. Email configured by each clinic in Steward settings. Email contains:
- Booking confirmation, time, location
- Pre-baked welcome content per clinic
- CRITICAL: button taking patient to pre-consultation onboarding screen

Pre-consultation onboarding screen handles:
- Pertinent medical history questions (specialty-specific)
- Consent forms relevant to procedure (digital signature)
- Voice ambient AI consent (if clinic uses it)
- Other appointment-specific forms

When patient signs consent forms, they auto-populate into patient's notes timeline.
When patient arrives, doctor sees: pre-completed history, signed consents already in patient feed. Consultation starts with full context.

This removes 10-15 min of consultation time on history-taking and consent paperwork. Doctor spends time on actual clinical work.

PER-USER AI LANGUAGE LEARNING:
RolDe learns each individual doctor's:
- Phrasing patterns
- Letter conclusions
- Preferred terminology
- Specialty-specific jargon

Personalisation extends central fine-tuning. Each doctor's language becomes part of their personalised AI profile. Bible 4.7 specifies layered personalisation (likely per-user lightweight LoRA adapters on top of central fine-tune).

### D4 — Watching For Trouble (Background Agentic Patterns)

Confirmed examples Roland wants:
- Patient booked for cosmetic procedure with positive pregnancy test 6 weeks ago not rechecked
- Patient on warfarin no INR in 3 months
- Patient prescribed medication interacting with another medication
- Polypharmacy concerns
- Patient prescribed medication while EGFR drastically reduced
- Patient scheduled for surgery, consent not signed
- Repeated cancellations (access issues / non-engagement)
- Drug user history flag
- Overdue surveillance (HbA1c, INR, etc.)

Categories to research and propose for Bible 4.7:
- Drug safety (interactions, dose adjustments for renal/hepatic, contraindicated combinations, adherence gaps)
- Care continuity (overdue follow-ups, missed surveillance, unactioned referrals)
- Pre-procedure safety (pregnancy status, fasting, anticoagulation, allergy)
- Documentation completeness (unsigned consents, missing exam components, incomplete discharge summaries)
- Behavioural patterns (cancellations, prescription frequency changes)
- Specialty-specific watches

Alert visualisation:
- Default cards: subtle shadow
- Acute/critical: red tinged border
- Other severity levels have own visual treatments
- Dashboard counter or alert centre at top
- Bottom horizontal strip of consultation screen could surface relevant alerts

Architectural component: CONTINUOUS PATIENT MONITORING SERVICE — separate runtime from consultation-time ambient AI. Runs continuously across all patients in clinic, on schedule (nightly, hourly, real-time per type). When doctor opens patient, relevant alerts surface immediately.

### D5 — Training Data Sourcing

Strategy: "mix of everything"
- Web scrape latest NICE/SIGN/eMC (legitimate)
- Web scrape recognised medical sources (case patterns)
- Web scrape peer-reviewed journals (with copyright limitations)
- Real clinical use accumulates as long-term moat

Legitimate sources I (Claude) can recommend:
- NICE guidelines (free, scrapable)
- SIGN guidelines (free, scrapable)
- eMC SmPCs (free, scrapable)
- BMJ Open + PLOS Medicine (open access)
- PubMed abstracts (free; full text often paywalled)
- Cochrane Library (free abstracts, varied full text)

Bible 4.7 specifies legitimate sources, respects copyright/access restrictions.

### D6 — Guideline Gap Log + AI Update Publishing + Tenant-Local Guidelines

Steward can upload local clinic-specific guidelines:
- Local microbial protocols
- Trust-specific protocols
- House protocols diverging from national guidelines for legitimate local reasons

These remain ORGANISATIONAL-ONLY:
- Inform that clinic's AI behaviour
- Never propagate to global RolDe AI
- Critical for clinics with legitimate local divergence

Wrong AI suggestion → thumbs-down → AI summarises case (excluding patient data) → flows to Custodian AI feedback area → Roland reviews initially; future RoDee clinical team handles at scale.

When RolDe AI updates with sufficient learning, "update notes" feature shows clinics what improved (transparency, version-note style).

DUAL-LAYER AI ARCHITECTURE:
- Global AI: fine-tuned on Custodian-validated cases, applies to all clinics
- Tenant-local AI: each clinic's local guidelines layered on top, applies only to that clinic

Likely implementation: global LoRA adapter + tenant-specific RAG context including their local protocols. Bible 4.7 specifies.

---

## Doc For Skin Specifications (delivered as part of D6 message)

### Before-and-After Photo System

Modal opens on top of patient dashboard:
- 5 photo slots, left-to-right (standard aesthetic photography: frontal, left oblique, left lateral, right oblique, right lateral)
- Plus button for upload from desktop OR capture from connected camera
- Annotation capability for documentation
- Save commits photos to patient notes timeline (timestamped, user-stamped)
- Photos appear in feed; clicking opens carousel gallery view
- Watermarking applied automatically (Steward-controlled in settings)
- "Before" and "after" treatment relationship preserved

### EVERYTHING-IN-THE-FEED PRINCIPLE (CONSTITUTIONAL)

Patient notes are the SINGLE CANONICAL VIEW. No separate "photos" tab, "documents" tab, "consents" tab.

Everything lives in the patient feed:
- Clinical notes
- Photos (with carousel view on click)
- Consent forms (signed via patient portal, auto-pushed to notes)
- Referral letters (drafted, edited, sent — with status indicators)
- Lab results
- Radiology results
- Scanned documents from other hospitals (OCR'd into structured notes)
- AI suggestions promoted to record

Doctor scrolls one feed, sees whole patient story. NO tab-jumping, NO document hunting.

Constitutional commitment for Bible 4.0.

### Performance Requirement: Lazy Loading

Only most recent N entries load on open; as doctor scrolls up, older entries load progressively. Keeps app snappy even for patients with years of history.

### OCR For Incoming Scanned Documents

Scanned letters from external clinics get OCR'd, structured, entered into feed as searchable text rather than opaque PDFs. Bible 4.4 specifies pipeline (likely Gemma 4 multimodal capability for OCR).

