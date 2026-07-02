# RolDe — Bible 8: rolde.app User-Facing Website

> *The clinical operating system, built by a doctor.*
>
> Version 1.1 | Last Updated: 11 May 2026 | RolDe Ltd (incorporation pending) | CONFIDENTIAL
>
> Changes in v1.1 (11 May 2026): Body typography changed from IBM Plex Sans to **Inter** per founder decision for better visual appeal on web. Headlines remain IBM Plex Serif (matches the RolDe logo design — Roland designed the wordmark in IBM Plex Serif). Code samples retain IBM Plex Mono. The IBM Plex Serif + Inter pairing matches the typography choice for Bible 7 (mindate.app) — both products in the RoDee portfolio share the same web typographic spine for cross-product brand coherence.
>
> The website specification for **rolde.app** — the public-facing marketing website that introduces visitors to RolDe, the healthcare platform powering Doc For Drivers, Doc For Skin, and (eventually) external clinics.
>
> Phased build structure: each phase is independently buildable by Claude Code. Specifications below are precise enough to build from without ambiguity.

---

## How to Use This Document

Bible 8 is **the** website specification for rolde.app. It does NOT redefine what RolDe is — that's Bibles 4.0 through 4.8, ~75,000 words of platform specification.

What Bible 8 does:
- Specifies the marketing website that a clinician or clinic-owner visits when they first encounter RolDe
- Tells them what RolDe is, why it matters, and how to engage
- Structured in **6 build phases** so Claude Code can build incrementally with verification at each phase boundary

What Bible 8 does NOT cover:
- The application itself (rolde.app the actual SaaS — that's the docforskin.rolde.app / docfordrivers.rolde.app tenant URLs, specified in the RolDe sub-Bibles)
- Marketing strategy (Bible 4.M, future)
- The customer onboarding process beyond the website

**Loading order for Claude Code sessions building rolde.app**:
1. Bible 0 v1.2 (RoDee defaults — brand portfolio, design system shared assets)
2. Bibles 4.0-4.8 (the source-of-truth on what RolDe is)
3. Bible 5 (Doc For Skin — provides website-pattern reference)
4. Bible 6 (Doc For Drivers — provides canonical RolDe booking widget UX)
5. This Bible 8

---

## Table of Contents

1. The rolde.app Brief
2. The Visitor Persona
3. The Visitor's Journey on rolde.app
4. The Single-Page Architecture
5. The Visual Identity
6. The Voice and Messaging
7. Build Phase 1 — Foundation (Repository, Routing, Header, Footer)
8. Build Phase 2 — Hero and Sub-Hero Sections
9. Build Phase 3 — "What RolDe Is" Sections (Problem, Solution, How It Works)
10. Build Phase 4 — Product Modules and Architecture Diagram
11. Build Phase 5 — Pricing, Trust Signals, CTA Sections
12. Build Phase 6 — Polish, Animations, SEO, Launch
13. Acceptance Criteria
14. Appendix A — Inheritance From Bibles 4.0-4.8
15. Appendix B — Healthcare Platform Marketing Site References (2026 Landscape)

---

## 1. The rolde.app Brief

### 1.1 What rolde.app Is

A single-page marketing website that introduces RolDe — the multi-tenant healthcare operating system — to potential clinical customers. Its job is to convince a clinician, clinic owner, or healthcare administrator that RolDe is the platform their practice should run on.

### 1.2 What rolde.app Is Not

- It is NOT the application. Users do not log in here. There's no patient portal. There's no clinician dashboard. (Those live at `[tenant].rolde.app` and `patient.[tenant].rolde.app` per Bible 4.3 §3.)
- It is NOT a sales-pitch site for the RoDee group. (That's rodee.co.uk eventually.)
- It is NOT a generic "healthcare tech" site. It's specifically about RolDe.

### 1.3 The One Sentence

Per Bible 4.0 §1, RolDe's positioning is:

> **The clinical operating system, built by a doctor.**

This is the website's spine. Every section either reinforces it or supports the case.

### 1.4 The Three Things The Website Must Achieve

1. **Communicate what RolDe is** in 30 seconds — to a visitor who has never heard of it
2. **Convince a sceptical clinician** that RolDe is different from the existing EMR landscape (Epic / Cerner / athenahealth / NextGen / OptiMantra)
3. **Convert** to a primary action — book a demo, request access, or join a waitlist (the specific conversion mechanic is decided in Phase 5)

---

## 2. The Visitor Persona

### 2.1 Primary Persona: The Frustrated Clinician

A doctor (GP, specialist, aesthetic clinician, occupational health doctor) who:
- Currently uses an EMR they dislike (most likely SystmOne, EMIS, Vision in UK; Epic or athena in private sector)
- Has experienced the friction: 30+ clicks to write a consultation note, ten template fields they don't need, prescription workflow that requires switching screens
- Spends 1-2 hours after clinic finishing notes
- Has thought "there must be a better way"
- Is sceptical of EMR vendors (every salesperson promises easier workflows)
- Is most convinced by: another clinician saying "I switched, it's better"

### 2.2 Secondary Persona: The Clinic Owner

A private clinic owner (aesthetic clinic, occupational health, private GP, specialty clinic) who:
- Runs the business as well as the medicine
- Cares about: efficient operations, compliance, cost predictability, scaling without complexity
- Currently juggles multiple systems: booking (LatePoint, Square, Mindbody), EMR (Cliniko, Pabau, Heydoc), payments (Stripe, separate), comms (separate)
- Wants: one integrated system that doesn't require IT staff

### 2.3 Tertiary Persona: The Healthcare Administrator

NHS practice manager, group practice administrator, multi-clinic operations lead. Lower priority for v1; the website should not exclude them but should not lead with their concerns.

### 2.4 What All Three Have In Common

They want:
- Honest, technical specifics — not marketing fluff
- Evidence the founders know clinical work (not just tech)
- Pricing transparency (or at least pricing direction)
- Confidence that this won't disappear in 18 months

The website must speak to these instincts.

---

## 3. The Visitor's Journey on rolde.app

### 3.1 The 30-Second Read

A visitor lands on rolde.app. They have 30 seconds before deciding whether to scroll further.

In 30 seconds, they should know:
- This is a healthcare platform (not consumer health, not insurance)
- It's a clinical operating system (broader than an EMR)
- A doctor built it
- It runs real clinics today (Doc For Drivers, Doc For Skin)

### 3.2 The 3-Minute Read

If they scroll past the hero, in 3 minutes they should understand:
- The specific problem RolDe solves (the EMR friction story)
- How RolDe is structurally different (multi-tenant, doctor-designed, AI-native)
- What modules RolDe includes (clinical documentation, prescribing, scheduling, billing, patient comms)
- That the platform has an architecture (not just a single app)

### 3.3 The 10-Minute Read

If they're seriously interested, in 10 minutes they should be able to:
- Read about pricing direction
- See evidence of who's running it
- See trust signals (clinics already using it)
- Find a CTA to engage further

### 3.4 The Conversion

Primary CTA: **Request Demo** (or similar — see Phase 5)
- Captures: name, email, clinic name, role, brief message
- Submits to RolDe team for follow-up
- Auto-response email confirming receipt

Secondary CTAs throughout the page:
- Read docs (when public docs exist)
- See clinics using RolDe (links to docfordrivers.com, docforskin.com)
- Read the manifesto (links to a Manifesto sub-page derived from Bible 4.0 — out of scope for v1)

---

## 4. The Single-Page Architecture

Same proven pattern as docfordrivers.com and docforskin.com — single-page with anchor-navigation header.

### 4.1 Section Order (Top to Bottom)

```
[Header — sticky, logo + nav links + primary CTA]
   ↓
1. HERO — tagline + sub-tagline + primary CTA
   ↓
2. SUB-HERO — the 30-second story ("RolDe is...")
   ↓
3. THE PROBLEM — what's broken in clinical software
   ↓
4. THE SOLUTION — how RolDe is structurally different
   ↓
5. HOW IT WORKS — the multi-tenant architecture diagram
   ↓
6. THE MODULES — clinical docs, prescribing, scheduling, billing, patient portal, ambient AI
   ↓
6.5 BUILT FOR YOUR SPECIALTY — one OS that becomes your clinic; selectable specialty packs
    (aesthetics, dermatology, dentistry, physio, primary care…) → "RolDe for {specialty}" pages
   ↓
7. THE CLINICS USING ROLDE — Doc For Drivers, Doc For Skin (trust signal)
   ↓
8. THE FOUNDER STORY — built by a doctor (trust signal + differentiation)
   ↓
9. PRICING — direction (not detailed tiers at v1)
   ↓
10. FAQ — common technical and commercial questions
   ↓
11. CALL TO ACTION — Request Demo
   ↓
[Footer — RolDe Ltd, address, policy links, social, copyright]
```

### 4.2 Anchor Navigation Items

Header nav links (anchor to sections):
- Product (jumps to section 4 or 6)
- How It Works (section 5)
- Specialties (section 6.5)
- Pricing (section 9)
- FAQ (section 10)
- **[Request Demo]** (primary CTA, opens contact modal)

### 4.3 Built For Your Specialty — the selectable-pack story (LIVING content source)

**The marketing truth (from Bible 4.9 + 4.8 §15.7c).** RolDe is **one clinical OS that *becomes* the
clinic in front of it**: every clinic gets the **universal spine**, then **switches on the specialty
packs it needs** (a per-tenant setting). This sub-section is the **living source** for the site's
"Built for your specialty" section **and a `RolDe for {specialty}` landing page per pack** — appended
as each Bible 4.9 row is deep-dived (Roland 2026-06-30: "add every feature we create to the website
bible so we build the front-end properly"). The features themselves are specified in **Bible 4.8
§15.7c** (build) + **Bible 4.9 §2** (source); this mirror keeps the *website* in lock-step.

**The universal spine (every clinic, always on):** patient record · scheduling & online booking ·
consent & documents · prescribing & drug-safety · billing (self-pay **and** insurer/Healthcode) ·
comms (**RoChat**) · audit & the **Change Describer** · the **patient portal (RolDe OS — never a
separate app)** · **RolDe Connect** (video) · **RolDe Covenant** (relationships) · **RolDe Compass**
(your day — calendar + tasks in one view) · **RolDe Cadence** (the recalls/reminders engine — the
rhythm of ongoing care) · **RolDe Courier** (the clinical postal system — send letters to GP /
patient / another clinic with live parcel-style tracking, encrypted secure-link delivery, and
audited who-read-what receipts; nothing sent silently fails, nothing received goes unseen) ·
**self-hosted ambient AI**.

**Specialty packs harvested so far** *(one "RolDe for …" page each):*
- **RolDe for Aesthetics** — treatment mapping & mark-up · before/after photo studio · injectable
  batch/expiry traceability · consent & aftercare library · complication protocols · nurse→prescriber
  loop · **BDD / psychological-suitability screening** (JCCP/GMC).
- **RolDe for Dermatology** — lesion body-map · total-body photography · biopsy→pathology loop ·
  high-risk drug monitoring · teledermatology · phototherapy · dermoscopy.
- **RolDe for Private GPs & Consultants** — insurer billing (Healthcode) · care pathways · provider
  e-referrals · health-screening packages · subscription medicine · structured medical reports.
- **RolDe for Primary Care** — SNOMED-coded record · problem list · repeat prescribing · clinical
  templates & decision support · disease registers & recall · document workflow · population search.
- **RolDe for Dentistry** — odontogram · perio charting · dental imaging · treatment plans &
  case-acceptance · RolDe-AI notes · lab-work tracking · aligner tracking.
- **RolDe for Physiotherapy & MSK** *(also chiropractic, osteopathy, podiatry)* — exercise
  prescription & home programs · outcome measures (PROMs) · range-of-motion tracking.
- **RolDe for Mental Health & Therapy** — assessment scales (PHQ-9/GAD-7) · AI therapy notes ·
  therapy plans & goals · between-session worksheets · risk-flagging & safeguarding · sensitive-record
  confidentiality · group & couples sessions.
- **RolDe for Optometry & Opticians** — eye-examination record · diagnostic-device (OCT) integration ·
  optical dispensing & retail · contact-lens management & supply recall.
- **RolDe for Audiology & Hearing** — audiogram & hearing assessment · NOAH device integration ·
  hearing-aid & tinnitus fitting/dispensing · supply, warranty & review recall.
- **RolDe for Fertility & IVF** — treatment-cycle management · embryology lab tracking · electronic
  witnessing & chain-of-custody · cryostorage management · donor & third-party management · HFEA reporting.
- **RolDe for Women's, Men's & Sexual Health** — hormone therapy (HRT/TRT) management · validated
  symptom scales · STI results & partner notification · contraception & LARC · cycle tracking.
- **RolDe for Occupational Health** *(B2B / employer)* — employer model & management referrals ·
  health surveillance · fitness-for-work & pre-placement · occupational vaccinations · drug & alcohol testing.
- **RolDe for Pharmacy & Independent Prescribers** *(clinical services, not retail dispensing)* —
  independent-prescriber clinics · in-clinic medication supply · controlled-drugs register · monitored dosage systems.
- **RolDe for Diagnostics & Imaging** — imaging requests & modality worklist · RolDe's own DICOM viewer
  (open-source, self-hosted, themed) · structured radiology reporting · referrer portal & report delivery
  · self-hosted image archive (no vendor lock-in).
- **RolDe for Veterinary** — owner–animal records · weight-based dosing & species formulary ·
  hospitalisation board · vet lab & imaging · reminders, dispensing, pet portal & owner billing.
- **RolDe for Wellness, Weight-Loss & Longevity** — GLP-1 weight-loss programmes · biomarker panels &
  health optimisation · IV therapy & injectables · membership & coaching · supplement plans & sales.
- **RolDe for Complementary & Integrative** — modality intake & notes · acupuncture point/meridian
  charting · herbal & remedy prescriptions. *(RolDe stays clinically neutral — documents, never endorses.)*
- **RolDe for Surgery & Day-Units** — theatre scheduling · pre-op & WHO safety checklist · operation
  notes, implant registry & counts · peri-operative flow · MDT meetings & care coordination.
- *(appended per Bible 4.9 row: mental health · optometry · audiology · fertility · women's/men's
  health · occupational health · pharmacy · imaging · veterinary · wellness · complementary · surgical.)*

---

## 5. The Visual Identity

### 5.1 Colour Palette

Per the RolDe brand decision (Roland 2026-06-15): the front-facing site shares the app's
**parchment** paper, with **soft lavender** accents. Lavender is the site's signature (the *app*
itself stays parchment + monochrome — see Bible 4.2 §D.12.5). This **supersedes** the earlier
teal/cream/peach group palette for the RolDe site.

| Colour | Hex | Role |
|---|---|---|
| **Background** | **#F0EFEB** | Parchment — the common site background (calm clinical paper) |
| **Accent (primary)** | **#DCD9EA** | Soft lavender — section tints, highlights, illustration fills |
| Accent (deep) | #BFB6DE | Stronger lavender — links, active states, emphasis |
| CTA | #0A0A0A | Near-black button (matches the app's button language), white text |
| Warm pop | #E0533F | Coral — the ♥ and rare highlights, used sparingly |
| Text dark | #1A1A1A | Body and headlines |
| Text muted | #6B6B6B | Sub-text, captions |
| Surface | #FFFFFF | Cards, panels |

**Usage**: the whole site sits on **parchment**; sections lift with **soft-lavender** tints and white
cards for rhythm. Lavender is the accent throughout (links, highlights, illustration fills); CTAs are
**near-black** for punch; coral is a rare warm pop. Headlines in IBM Plex Serif, body in Inter.

### 5.2 Typography

Per Bible 4.2:
- **Headings**: IBM Plex Serif (the RolDe wordmark font — Roland designed the RolDe logo in this typeface)
- **Body**: Inter
- **Code**: IBM Plex Mono (for any technical/architectural references)

Type scale:
- Hero headline: 64-80px desktop / 40-48px mobile
- Section headline (H2): 40-48px desktop / 28-32px mobile
- Sub-section (H3): 24-32px desktop / 20-24px mobile
- Body: 18px desktop / 16px mobile, line-height 1.6
- Caption: 14px desktop / 13px mobile

### 5.3 The Visual Feel

**Aspirational references** (from research on healthcare platform sites — see Appendix B):
- **Linear (linear.app)** — precise, restrained, lots of dark sections with bright accents — though we use light primary
- **Notion (notion.so)** — clean, content-first, no over-decoration
- **Resend (resend.com)** — technical-product seriousness without coldness
- **Athena Health** (athenahealth.com) — healthcare-credibility tone (we want the trust signal, not their visual style)

**Anti-references**:
- NOT Epic's website (cluttered, brochure-style, very 2018)
- NOT cheap-SaaS-template (vague gradients, stock photos of smiling clinicians, no opinion)
- NOT consumer-health-app aesthetic (too casual; this is clinical)

### 5.4 Animation Principles

Subtle. Professional. Not distracting.

- **Hero**: subtle fade-in on load (200-400ms)
- **Section scroll-into-view**: fade-up animation, 30-40px translate, 400ms easing
- **Hover states**: 150ms transitions on interactive elements
- **No parallax**, no aggressive scroll-jacking, no auto-playing videos
- **Reduced motion**: respect `prefers-reduced-motion` media query — disable animations for users who set it

### 5.5 Photography and Illustration

- **Photography**: minimal. Maybe one or two clinical-environment photographs in the modules section. Roland will design / select these.
- **Illustration**: bespoke architectural diagrams (multi-tenant tree, module map). Drawn in a clean line-art style with the RolDe palette. Roland to design.
- **Icons**: Lucide React or Phosphor (open-source, consistent, professional). Stick to one library for consistency.

**Design needed prompts**:
- "Design needed: RolDe wordmark for header (320×80px target, SVG)"
- "Design needed: hero illustration showing 'one platform, many clinics' concept (1200×600px, SVG)"
- "Design needed: multi-tenant architecture diagram for How It Works section (1200×800px, SVG)"
- "Design needed: clinic visit photograph for Modules section (1600×900px, optional)"

---

## 6. The Voice and Messaging

### 6.1 Voice Pillars

Per Bible 4.0:
- **Clinically precise** — uses accurate medical language without dumbing down
- **Founder-led** — the doctor's voice; direct, opinionated, willing to disagree with the industry
- **Honest about limitations** — doesn't promise what RolDe can't deliver

### 6.2 Voice Examples

**Wrong**:
> *"Revolutionise your clinical workflow with our cutting-edge AI-powered platform!"*

**Right**:
> *"RolDe is a clinical operating system. It runs my own two clinics. I built it because the EMRs I had to use stole hours from my day."*

**Wrong**:
> *"Trusted by leading healthcare providers"*

**Right**:
> *"Two clinics run on RolDe today: Doc For Drivers (4,500+ medical reviews) and Doc For Skin (launching 2026). I run both. I use RolDe every day."*

**Wrong**:
> *"Our cutting-edge AI helps you document faster"*

**Right**:
> *"RolDe includes an ambient clinical AI that listens to your consultation and drafts your note. It runs locally on Apple Silicon — your patient's voice never leaves the device. You review and edit before finalising; the AI never writes anything that goes into the record without your sign-off."*

### 6.3 Words To Use

- "Clinical operating system" (not "EMR" — RolDe is broader)
- "Multi-tenant" (technical, but the visitor is technical)
- "Doctor-built" (specific, credible)
- "Ambient AI" (the specific category, not "AI features")
- "Patient feed" (specific to RolDe's documentation model, per Bible 4.6)

### 6.4 Words To Avoid

- "Revolutionary", "cutting-edge", "next-generation", "innovative"
- "Seamless", "streamlined", "frictionless"
- "Empower", "enable", "unlock" (used to death in SaaS marketing)
- "Solution" (use "platform" or specific product names)

---

# BUILD PHASES

The remaining sections specify the build phases. Each phase is independently completable. After each phase, Claude Code should verify with the user before proceeding.

---

## 7. Build Phase 1 — Foundation

**Goal**: A buildable repository with routing, header, and footer in place. No content sections yet.

### 7.1 Repository Setup

- **Framework**: Next.js 15+ (App Router) with TypeScript
- **Styling**: Tailwind CSS v4
- **UI primitives**: Radix UI for modal/dialog/dropdown (booking widget pattern from Bibles 5-6 will use this)
- **Icons**: Lucide React
- **Deployment target**: Vercel

### 7.2 Repository Structure

```
rolde-app-site/
├── app/
│   ├── layout.tsx          (RootLayout — html, body, fonts)
│   ├── page.tsx            (single-page site — all sections imported)
│   ├── globals.css         (Tailwind imports + custom CSS variables)
│   └── api/
│       └── demo/
│           └── route.ts    (POST handler for demo requests — Phase 5)
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── SubHero.tsx
│   │   ├── Problem.tsx
│   │   ├── Solution.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Modules.tsx
│   │   ├── ClinicsUsing.tsx
│   │   ├── FounderStory.tsx
│   │   ├── Pricing.tsx
│   │   ├── FAQ.tsx
│   │   └── CTA.tsx
│   └── primitives/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── (other shared primitives as needed)
├── lib/
│   ├── analytics.ts        (basic page view / event tracking)
│   └── utils.ts            (cn helper for Tailwind)
├── public/
│   ├── favicon.svg
│   ├── og-image.png        (1200×630 social share — DESIGN NEEDED: Roland)
│   └── logo.svg            (RolDe wordmark — DESIGN NEEDED: Roland)
├── tailwind.config.ts      (RoDee palette as Tailwind theme colors)
├── package.json
└── README.md
```

### 7.3 Tailwind Theme Configuration

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        rolde: {
          primary: '#0081A7',
          teal: '#00AFB9',
          cream: '#FDFCDC',
          peach: '#FED9B7',
          coral: '#F07167',
          dark: '#1A1A1A',
          muted: '#6B6B6B',
        }
      },
      fontFamily: {
        serif: ['IBM Plex Serif', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    }
  }
}
```

### 7.4 The Header

```
+-----------------------------------------------------------------+
|                                                                 |
|  [RolDe Logo]      Product  How It Works  Pricing  FAQ  [Demo→] |
|                                                                 |
+-----------------------------------------------------------------+
```

**Behaviour**:
- Sticky at top of viewport (stays as user scrolls)
- Background: white with subtle 8% black shadow when scrolled past hero
- Logo: clickable, scrolls to top
- Nav items: anchor links, smooth-scroll behaviour
- CTA button: **#0081A7** background, white text, "Request Demo →" — opens contact modal (built in Phase 5)
- Mobile: hamburger menu replaces full nav; logo and CTA button still visible

### 7.5 The Footer

```
+-----------------------------------------------------------------+
|                                                                 |
|  [RolDe Logo]                                                   |
|                                                                 |
|  RolDe Ltd                  Product           Company           |
|  [registered address        Patient Portal    About             |
|   when company filed]       Clinician         Manifesto         |
|                             Dashboard         Contact           |
|  Powered by the                                                 |
|  RoDee group                Legal                               |
|                             Privacy                             |
|                             Terms                               |
|                             Cookies                             |
|                                                                 |
|  © 2026 RolDe Ltd  |  Built in Edinburgh                        |
|                                                                 |
+-----------------------------------------------------------------+
```

**Footer content**:
- Logo
- Company name (RolDe Ltd) + registered office address (placeholder until incorporation completes)
- Three columns: Product, Company, Legal
- Tagline: "Powered by the RoDee group" — links to rodee.co.uk (placeholder)
- Copyright + "Built in Edinburgh" mark
- Background: **#FDFCDC** cream, text dark

### 7.6 Phase 1 Acceptance Criteria

- [ ] Next.js 15+ App Router project created
- [ ] Tailwind v4 configured with RoDee palette
- [ ] IBM Plex fonts loaded
- [ ] Header component built and tested
- [ ] Footer component built and tested
- [ ] Single page (`app/page.tsx`) renders Header + Footer + empty space between
- [ ] Mobile responsive: header hamburger functional
- [ ] Deployed to Vercel preview URL
- [ ] OG image placeholder in place (1200×630, can be temporary)
- [ ] Favicon placeholder in place

**Roland review before Phase 2.**

---

## 8. Build Phase 2 — Hero and Sub-Hero

**Goal**: The above-the-fold experience. A first-time visitor lands and immediately understands what RolDe is.

### 8.1 Section 1 — HERO

```
+-----------------------------------------------------------------+
|                                                                 |
|              [Background: #0081A7 deep blue]                    |
|                                                                 |
|                                                                 |
|              The clinical operating system,                     |
|              built by a doctor.                                 |
|                                                                 |
|              RolDe runs two clinics today. Doc For Drivers      |
|              (4,500+ medical reviews) and Doc For Skin.         |
|              Built by a GMC-registered doctor who needed        |
|              software that didn't fight him.                    |
|                                                                 |
|              [ Request Demo → ]    [ See how it works ↓ ]       |
|                                                                 |
|                                                                 |
|              [Hero illustration — "one platform, many          |
|               clinics" concept — DESIGN NEEDED]                 |
|                                                                 |
+-----------------------------------------------------------------+
```

**Hero content**:
- **Headline (H1)**: "The clinical operating system, built by a doctor."
  - 64-80px desktop / 40-48px mobile
  - Font: IBM Plex Serif, weight 500
  - Colour: white
  - Line height: 1.1
- **Sub-headline (H2)**: "RolDe runs two clinics today. Doc For Drivers (4,500+ medical reviews) and Doc For Skin. Built by a GMC-registered doctor who needed software that didn't fight him."
  - 18-20px desktop / 16-18px mobile
  - Font: Inter
  - Colour: white at 90% opacity
  - Max width: 600px
- **Primary CTA**: "Request Demo →"
  - White background, #0081A7 text
  - Padding: 14px vertical, 28px horizontal
  - Opens contact modal (Phase 5)
- **Secondary CTA**: "See how it works ↓"
  - Transparent background, white text, underline on hover
  - Smooth-scrolls to How It Works section
- **Hero illustration**: 1200×600 SVG (DESIGN NEEDED — Roland)
  - Concept: a stylised tree-architecture diagram suggesting one platform with multiple clinic branches
  - White line art on the blue background

**Animation**: On page load, hero content fades in over 600ms — staggered: headline first (0ms), sub-headline (200ms), CTAs (400ms), illustration (200ms).

### 8.2 Section 2 — SUB-HERO

The "30-second story" — for visitors who want a quick understanding before deciding to scroll further.

```
+-----------------------------------------------------------------+
|                  [Background: white]                            |
|                                                                 |
|                                                                 |
|  RolDe is a multi-tenant healthcare platform.                  |
|  One codebase. Many clinics.                                    |
|                                                                 |
|  Where Epic and athena were built for hospitals,                |
|  RolDe is built for the modern private clinic — single-doctor   |
|  practices, aesthetic clinics, occupational health, specialty   |
|  groups. It includes everything you need to run a clinic:       |
|  bookings, patient records, clinical documentation, prescribing,|
|  billing, patient communications, and an ambient AI that drafts |
|  your notes while you talk.                                     |
|                                                                 |
|                                                                 |
|  +----------+  +----------+  +----------+                       |
|  |  4,500+  |  |    1     |  |   100%   |                       |
|  | Medical  |  |  Doctor  |  | Apache 2 |                       |
|  | reviews  |  | building |  |    AI    |                       |
|  | already  |  |    it    |  |  Stack   |                       |
|  +----------+  +----------+  +----------+                       |
|                                                                 |
+-----------------------------------------------------------------+
```

**Sub-hero content**:
- **Headline (H2)**: "RolDe is a multi-tenant healthcare platform. One codebase. Many clinics."
- **Body**: One paragraph (~50 words) per template above
- **Three stat cards**:
  - 4,500+ medical reviews already
  - 1 doctor building it
  - 100% Apache 2 AI stack
- Stats: large number, label below

**Animation**: Sections fade-up on scroll-into-view (30-40px translate, 400ms easing).

### 8.3 Phase 2 Acceptance Criteria

- [ ] Hero section built
- [ ] Hero illustration placeholder in place (real illustration may come later from Roland)
- [ ] Sub-hero section built with three stat cards
- [ ] Animations functional on load and scroll
- [ ] Reduced motion preference respected
- [ ] Mobile responsive
- [ ] Roland review before Phase 3

---

## 9. Build Phase 3 — Problem, Solution, How It Works

**Goal**: The visitor now understands the WHY. Why does RolDe exist? Why is it different?

### 9.1 Section 3 — THE PROBLEM

```
+-----------------------------------------------------------------+
|              [Background: #FDFCDC cream]                        |
|                                                                 |
|              Clinical software is broken.                       |
|                                                                 |
|              Most clinicians use software that wasn't built for |
|              them. It was built for billing departments, for    |
|              hospital administrators, for the era before        |
|              ambient AI existed.                                |
|                                                                 |
|              The result: 30+ clicks to write a note. Two        |
|              hours after clinic finishing documentation.        |
|              Prescribing workflows that demand screen-          |
|              switching. Patient portals that feel like 2014.    |
|                                                                 |
|              We know this because we lived it.                  |
|                                                                 |
+-----------------------------------------------------------------+
```

**Content**: ~80 words. Direct, opinionated, names the problem.

### 9.2 Section 4 — THE SOLUTION

```
+-----------------------------------------------------------------+
|              [Background: white]                                |
|                                                                 |
|              RolDe is structurally different.                   |
|                                                                 |
|              +------------------+    +----------------------+   |
|              | Multi-tenant     |    | Doctor-designed      |   |
|              | architecture     |    | from day one         |   |
|              |                  |    |                      |   |
|              | One platform.    |    | Every workflow comes |   |
|              | Many clinics.    |    | from real clinical   |   |
|              | Scale without    |    | practice.            |   |
|              | rebuilding.      |    |                      |   |
|              +------------------+    +----------------------+   |
|                                                                 |
|              +------------------+    +----------------------+   |
|              | Ambient AI       |    | Open source heart    |   |
|              | native           |    |                      |   |
|              |                  |    | Apache 2 licensed AI |   |
|              | Not bolted on.   |    | model. Your patient  |   |
|              | Built in.        |    | data never leaves    |   |
|              | Runs locally.    |    | your control.        |   |
|              +------------------+    +----------------------+   |
|                                                                 |
+-----------------------------------------------------------------+
```

**Four solution cards**:
1. Multi-tenant architecture
2. Doctor-designed from day one
3. Ambient AI native
4. Open source heart

Each card: short headline + 2-line description. Icon at top of each card (Lucide).

### 9.3 Section 5 — HOW IT WORKS

```
+-----------------------------------------------------------------+
|              [Background: #FDFCDC cream]                        |
|                                                                 |
|              How RolDe Works                                    |
|                                                                 |
|              [Multi-tenant architecture diagram — DESIGN NEEDED]|
|                                                                 |
|              Each clinic on RolDe is a tenant.                  |
|              Each tenant has its own URL, its own patients,     |
|              its own clinicians, its own configuration.         |
|              All running on the same codebase, the same         |
|              database, the same security model.                 |
|                                                                 |
|              [docfordrivers.rolde.app] [docforskin.rolde.app]   |
|              [yourclinic.rolde.app]                             |
|                                                                 |
|              Patients access their own portal at                |
|              patient.[clinic].rolde.app                         |
|                                                                 |
|              When you migrate to RolDe, you become a tenant.    |
|              We provision your subdomain. We import your data.  |
|              You go live without losing your patient history.   |
|                                                                 |
+-----------------------------------------------------------------+
```

**Diagram requirement**: Visual showing:
- Central "RolDe platform" hub
- Three branches: docforskin.rolde.app, docfordrivers.rolde.app, [yourclinic].rolde.app
- Each branch has clinician dashboard + patient portal
- Stylised tree or hub-and-spoke pattern

**DESIGN NEEDED**: Roland designs this diagram. 1200×800 SVG target.

### 9.4 Phase 3 Acceptance Criteria

- [ ] Three sections built (Problem, Solution, How It Works)
- [ ] Solution cards layout (2×2 desktop, stacked mobile)
- [ ] How It Works diagram placeholder in place
- [ ] Scroll animations consistent with Phase 2
- [ ] Mobile responsive
- [ ] Roland review before Phase 4

---

## 10. Build Phase 4 — Product Modules and Architecture

**Goal**: Show the depth. Visitor sees that RolDe is a real platform with real modules, not vapourware.

### 10.1 Section 6 — THE MODULES

```
+-----------------------------------------------------------------+
|              [Background: white]                                |
|                                                                 |
|              Everything a clinic needs to run.                  |
|                                                                 |
|              [Module tabs or accordion]                         |
|                                                                 |
|              + Patient Records                                  |
|                Multi-tenant patient feed. iMessage-style notes. |
|                Draft and final versions. Full audit trail.      |
|                Bible 4.4, 4.6                                   |
|                                                                 |
|              + Clinical Documentation                           |
|                Ambient AI drafts notes from consultation        |
|                audio. You edit and finalise. The AI never       |
|                writes alone. Bible 4.7                          |
|                                                                 |
|              + Prescribing                                      |
|                Full UK prescribing workflow with NICE/SIGN/eMC  |
|                integration. Controlled drugs handled correctly. |
|                Patient signature capture. Bible 4.5             |
|                                                                 |
|              + Scheduling                                       |
|                Modal-driven booking widget proven over 4,500+   |
|                appointments. Multi-location. Multi-clinician.|
|                Bibles 4.1, 6                                    |
|                                                                 |
|              + Billing and Payments                             |
|                Stripe Connect. Per-tenant accounts. B2B partner |
|                invoicing. Coupon system. Bible 5 §18, Bible 6 §7|
|                                                                 |
|              + Patient Portal                                   |
|                patient.[clinic].rolde.app. Appointments,        |
|                consent forms, payment history, communications.  |
|                Bibles 4.3, 5, 6                                 |
|                                                                 |
|              + Ambient Clinical AI                              |
|                Self-hosted Gemma 4 31B. Apache 2 licensed.      |
|                Runs locally on Apple Silicon. Patient audio     |
|                never leaves the device. Bible 4.7               |
|                                                                 |
+-----------------------------------------------------------------+
```

**Module layout**: Accordion or tabbed interface. Each module:
- Module name (H3)
- 2-line description in plain language
- Reference to Bible section (for visitors who want depth — these become docs links when public docs exist)
- Icon (Lucide)

**Behaviour**: First module (Patient Records) expanded by default. Clicking a different module expands it; previous collapses. Accordion-style.

### 10.2 Section 7 — THE CLINICS USING ROLDE

```
+-----------------------------------------------------------------+
|              [Background: #FDFCDC cream]                        |
|                                                                 |
|              Running real clinics, today.                       |
|                                                                 |
|              +------------------------+  +-------------------+  |
|              |  [DOC FOR DRIVERS]     |  | [DOC FOR SKIN]    |  |
|              |  Coral accent          |  | Blue accent       |  |
|              |                        |  |                   |  |
|              |  Driver medical reviews|  | Aesthetic clinic  |  |
|              |  Edinburgh, Inverness, |  | Edinburgh         |  |
|              |  Aberdeen              |  |                   |  |
|              |                        |  |                   |  |
|              |  4,500+ medical        |  | Launching 2026    |  |
|              |  reviews completed     |  |                   |  |
|              |                        |  |                   |  |
|              |  [Visit site →]        |  | [Visit site →]    |  |
|              +------------------------+  +-------------------+  |
|                                                                 |
|              Both clinics are owned and run by Dr Roland Manoj  |
|              Jayasekhar, RolDe's founder. RolDe wasn't built    |
|              in theory — it's built by someone whose daily      |
|              clinical work depends on it.                       |
|                                                                 |
+-----------------------------------------------------------------+
```

**Two clinic cards**:
- **Doc For Drivers**: coral accent (matches Bible 6 §17), wordmark, brief description, stats, "Visit site" link to docfordrivers.com
- **Doc For Skin**: blue accent (matches Bible 5 §21), wordmark, brief description, launching note, "Visit site" link to docforskin.com

**Below the cards**: One paragraph reinforcing the doctor-built positioning. ~50 words.

### 10.3 Phase 4 Acceptance Criteria

- [ ] Modules accordion built and functional
- [ ] All seven modules listed with descriptions
- [ ] Clinic-using-RolDe cards built
- [ ] Links to docfordrivers.com and docforskin.com functional
- [ ] Visual treatment consistent with Bibles 5 and 6 colour systems
- [ ] Mobile responsive
- [ ] Roland review before Phase 5

---

## 11. Build Phase 5 — Pricing, Trust Signals, CTA

**Goal**: Convert the convinced visitor. Pricing direction, founder story, FAQ, and the primary CTA.

### 11.1 Section 8 — THE FOUNDER STORY

```
+-----------------------------------------------------------------+
|              [Background: white]                                |
|                                                                 |
|              Built by a doctor.                                 |
|                                                                 |
|              +--------+   I'm Dr Roland Manoj Jayasekhar, a    |
|              | [Photo |   GMC-registered doctor in Edinburgh.  |
|              | of     |                                         |
|              | Roland |   I built RolDe because the EMRs       |
|              |  if    |   I had to use in clinic stole hours   |
|              | Roland |   from my day. I tried every           |
|              | wants  |   alternative. None of them were       |
|              |  one]  |   built by a doctor for daily clinical |
|              +--------+   work. So I built one.                |
|                                                                 |
|              I run two clinics on RolDe today. I'm the first   |
|              user, the most demanding tester, and the person   |
|              whose livelihood depends on the platform working. |
|                                                                 |
|              If you want to know what it's like before you     |
|              consider switching: ask me directly.              |
|                                                                 |
|              [ Email Roland directly: roland@rolde.app ]       |
|                                                                 |
+-----------------------------------------------------------------+
```

**Founder story content**:
- Photo of Roland (optional — Roland can choose to include or skip)
- Short founder note (~80 words) in first person
- Direct email CTA — this is a high-trust move, not a marketing-form trick

### 11.2 Section 9 — PRICING

```
+-----------------------------------------------------------------+
|              [Background: #FDFCDC cream]                        |
|                                                                 |
|              Pricing                                            |
|                                                                 |
|              Pricing is being finalised. Direction:             |
|                                                                 |
|              +----------------+  +----------------+  +-------+  |
|              |  Single Doctor |  | Small Practice |  | Group |  |
|              |                |  |                |  |       |  |
|              |  £150/mo       |  |  £400/mo       |  | Custom|  |
|              |                |  | (3 doctors)    |  |       |  |
|              |  Unlimited     |  |                |  | Multi-|  |
|              |  patients      |  | Unlimited      |  | site  |  |
|              |                |  | patients       |  |       |  |
|              |  All modules   |  |                |  | Multi-|  |
|              |                |  | All modules    |  | tenant|  |
|              |  Ambient AI    |  |                |  | white |  |
|              |  included      |  | Ambient AI     |  | label |  |
|              |                |  | included       |  |       |  |
|              |  £1.50/SMS     |  |                |  | Talk  |  |
|              |                |  | £1.50/SMS      |  | to us |  |
|              +----------------+  +----------------+  +-------+  |
|                                                                 |
|              Pricing TBD until v1 launch. These are             |
|              indicative tiers. We'll publish final pricing      |
|              when we open external onboarding.                  |
|                                                                 |
+-----------------------------------------------------------------+
```

**Pricing approach**:
- Three indicative tiers — placeholders only, marked as "pricing TBD" honestly
- No "Contact Sales" gating — the visitor knows what to expect even if exact numbers aren't final
- Honesty above marketing convention

**Important**: This pricing is **placeholder direction**. Real pricing will be set when RolDe opens to external clinics. Roland to lock final pricing in a future Bible update (Bible 4.8 or its successor).

### 11.3 Section 10 — FAQ

```
+-----------------------------------------------------------------+
|              [Background: white]                                |
|                                                                 |
|              Frequently Asked Questions                         |
|                                                                 |
|              ▼ When can my clinic onboard?                      |
|              ▼ What does the migration look like?               |
|              ▼ Is RolDe HIPAA / GDPR / NHS DSP compliant?       |
|              ▼ Does the AI see my patient data?                 |
|              ▼ What happens to my data if RolDe goes away?      |
|              ▼ Can I export my data?                            |
|              ▼ Do you support specific specialties?             |
|              ▼ How is RolDe different from Epic / athena /      |
|                Cliniko / Pabau?                                 |
|              ▼ Who is behind RolDe?                             |
|              ▼ Is RolDe a UK product or global?                 |
|              ▼ Do you have an iOS / Android app?                |
|              ▼ What's the technology stack?                     |
|                                                                 |
+-----------------------------------------------------------------+
```

**FAQ content**: 12 questions, accordion-style. Each answer is 2-3 sentences max. Direct, honest, no marketing fluff.

**Sample answers**:

> **Does the AI see my patient data?**
>
> The ambient AI runs locally on Apple Silicon hardware. Patient audio never leaves the device. The model is Gemma 4 31B, Apache 2 licensed, self-hosted. We do not send your patient data to OpenAI, Anthropic, or any third party. Bible 4.7 has the technical detail.

> **What happens to my data if RolDe goes away?**
>
> Your data is yours. RolDe provides full export at any time in standard formats (FHIR, CSV). If we go away, you take your data and migrate. We deliberately built RolDe so you're not locked in.

> **Is RolDe a UK product or global?**
>
> RolDe is built in the UK. Our reference clinics are in Scotland. The platform is designed for UK regulatory environments (NICE, SIGN, MHRA, NHS DSP) and will expand to other regulatory environments deliberately, not by accident.

### 11.4 Section 11 — CALL TO ACTION

```
+-----------------------------------------------------------------+
|                                                                 |
|              [Background: #0081A7 deep blue, full-bleed]        |
|                                                                 |
|                                                                 |
|              Ready to see RolDe?                                |
|                                                                 |
|              Book a demo. We'll show you the actual platform    |
|              running real clinics. No sales pitch deck. No      |
|              feature comparison sheet. The actual thing.        |
|                                                                 |
|              [ Request Demo → ]                                 |
|                                                                 |
|                                                                 |
+-----------------------------------------------------------------+
```

**CTA section behaviour**:
- Click "Request Demo" → opens modal
- Modal collects: name, email, clinic name, role, free-text "anything you want me to know?"
- Submission: POST to `/api/demo` → server logs and emails Roland directly
- Auto-response email to the visitor confirming receipt (template configured in Phase 5)

### 11.5 Demo Request Modal

```
+----------------------------------------+
|  Request a RolDe Demo            [X]   |
|                                        |
|  I'll personally show you the          |
|  platform.                             |
|                                        |
|  Name        [_____________]           |
|  Email       [_____________]           |
|  Clinic name [_____________]           |
|  Your role   [_____________]           |
|                                        |
|  Anything you want me to know?         |
|  [_________________________]           |
|  [_________________________]           |
|                                        |
|              [ Send →  ]               |
|                                        |
+----------------------------------------+
```

**Modal mechanics**:
- Modal opens on top of page (same UX language as Bibles 5-6 booking widget)
- Validation: name required, email required and valid format, clinic name required
- On submit: POST to API; show success state in modal; auto-close after 4s
- Error handling: clear error states inline

### 11.6 Phase 5 Acceptance Criteria

- [ ] Founder story section built
- [ ] Pricing section built (with "TBD" placeholders)
- [ ] FAQ accordion built with 12 questions and sample answers
- [ ] Primary CTA section built
- [ ] Demo request modal built and functional
- [ ] POST endpoint `/api/demo` working
- [ ] Email to Roland on demo submission
- [ ] Auto-response email to submitter
- [ ] Mobile responsive
- [ ] Roland review before Phase 6

---

## 12. Build Phase 6 — Polish, Animations, SEO, Launch

**Goal**: Ship-ready website.

### 12.1 Polish Checklist

- [ ] Cross-browser tested: Chrome, Safari, Firefox, Edge
- [ ] Mobile tested: iOS Safari, Android Chrome, smaller breakpoints (320px, 375px, 414px)
- [ ] Animations smooth on lower-spec devices
- [ ] Loading states for all CTAs
- [ ] All copy proofread by Roland
- [ ] All "DESIGN NEEDED" assets delivered by Roland or temporary placeholders agreed
- [ ] All links functional (internal anchors, external links to docfordrivers.com / docforskin.com)
- [ ] Footer links functional or placeholder pages created

### 12.2 SEO Setup

- [ ] Title: "RolDe — The clinical operating system, built by a doctor"
- [ ] Meta description: "RolDe is a multi-tenant healthcare platform. One codebase. Many clinics. Built by a GMC-registered doctor."
- [ ] OG image deployed (1200×630, designed by Roland)
- [ ] Twitter card meta tags
- [ ] Canonical URL
- [ ] robots.txt allowing indexing
- [ ] sitemap.xml generated
- [ ] Structured data (JSON-LD) for Organization
- [ ] Favicon set (multiple sizes)

### 12.3 Analytics

- [ ] Privacy-respecting analytics (Plausible, Fathom, or self-hosted)
- [ ] Track: page views, scroll depth (per section), CTA clicks, demo form submissions
- [ ] No third-party trackers (Google Analytics, Facebook Pixel) — RolDe is a clinical product, integrity matters

### 12.4 Performance

- [ ] Lighthouse score 95+ on desktop
- [ ] Lighthouse score 90+ on mobile
- [ ] Largest Contentful Paint < 2s
- [ ] First Input Delay < 100ms
- [ ] Images optimised (WebP/AVIF with PNG fallback)
- [ ] No render-blocking JavaScript in head

### 12.5 Accessibility

- [ ] WCAG 2.1 AA compliance
- [ ] All images have alt text
- [ ] All interactive elements keyboard-navigable
- [ ] Focus states visible
- [ ] Colour contrast ratios checked (#0081A7 on white passes; #6B6B6B passes for body text)
- [ ] Reduced motion respected
- [ ] Screen reader tested

### 12.6 Launch

- [ ] Domain configured (rolde.app DNS pointing to Vercel)
- [ ] SSL certificate active
- [ ] Production environment variables set
- [ ] Email service configured for demo notifications and auto-responses
- [ ] Soft launch: Roland and one trusted reviewer access site, sign off
- [ ] Public launch: domain goes live

### 12.7 Phase 6 Acceptance Criteria

All polish, SEO, analytics, performance, accessibility, and launch criteria above met. rolde.app live.

---

## 13. Acceptance Criteria

The rolde.app website is **complete** when:

- [ ] All six build phases complete
- [ ] All "Roland review before Phase X" approvals received
- [ ] Lighthouse scores within target ranges
- [ ] Accessibility audit passed
- [ ] Roland's design assets (logo, hero illustration, architecture diagram, OG image) delivered and integrated
- [ ] Demo request flow tested end-to-end (form submission → Roland receives email → submitter receives auto-response)
- [ ] DNS pointing to production, SSL active
- [ ] rolde.app publicly accessible
- [ ] First demo request received from a real visitor (organic, not Roland's own test)

When all criteria met, rolde.app is launched.

---

## 14. Appendix A — Inheritance From Bibles 4.0-4.8

This Bible 8 inherits from the RolDe platform Bibles:

| Source Bible | Inherited Content |
|---|---|
| Bible 4.0 — Manifesto | The "built by a doctor" positioning, voice pillars |
| Bible 4.1 — Architecture | Multi-tenant URL pattern (referenced in §5, §9) |
| Bible 4.2 — Design System | Colour palette, typography (IBM Plex), visual feel |
| Bible 4.3 — Multi-Tenant | The tenant architecture explained in §9 |
| Bible 4.4 — Core Modules | Modules listed in §10 |
| Bible 4.5 — Prescribing | Prescribing module description |
| Bible 4.6 — Clinical Documentation | Patient feed module description |
| Bible 4.7 — Ambient Clinical AI | Ambient AI module description, Gemma 4 31B detail |
| Bible 4.8 — Roadmap | Future direction context |

Bible 8 is a **derivative work** — it translates Bibles 4.0-4.8 into website copy. If Bibles 4.0-4.8 change, Bible 8 must be updated to match.

---

## 15. Appendix B — Healthcare Platform Marketing Site References (2026 Landscape)

Research conducted during Bible 8 drafting (10 May 2026). Reference sites that informed the visual and tonal approach:

**Healthcare-specific**:
- Epic (epic.com) — establishment positioning, but cluttered visual
- Athenahealth (athenahealth.com) — credible healthcare tone
- Praxis EMR (praxisemr.com) — physician-focused messaging
- NextGen Healthcare (nextgen.com) — ambulatory positioning
- MEDITECH (meditech.com) — mobile-first messaging
- OptiMantra (optimantra.com) — small-practice focus
- Veradigm (veradigm.com) — AI-supported documentation framing

**Cross-industry references for clean, technical-product sites**:
- Linear (linear.app) — restrained, founder-led, dark sections with bright accents
- Resend (resend.com) — technical-product credibility
- Notion (notion.so) — content-first design
- Vercel (vercel.com) — modern technical aesthetic

**Anti-references** (NOT the visual direction):
- Generic SaaS template sites with gradient hero + stock photos of smiling office workers
- Brochure-style healthcare sites with PDF downloads as primary CTAs
- Consumer health apps (too casual for clinical positioning)

**Key insights from research**:
- Healthcare platform competitors all lead with feature lists. RolDe should lead with positioning ("built by a doctor") and let features emerge.
- Most competitors hide pricing entirely. RolDe shows directional pricing as a trust move.
- Most competitors use stock photography of diverse smiling clinicians. RolDe uses architectural diagrams and the actual founder.
- Hinge's "designed to be deleted" is a cross-industry example of bold anti-positioning that mindate.app inherits — RolDe inherits the same principle: be specific about what you're not.

---

## End of Bible 8

When all six build phases are complete and accepted, rolde.app is live and ready to convert visitors into clinical customers.

Bible 8 is a derivative of Bibles 4.0-4.8. When those underlying Bibles update, Bible 8 must be reviewed to ensure the website remains accurate.

— Roland Manoj Jayasekhar  
RolDe Ltd, May 2026
