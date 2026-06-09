# RolDe — Bible 4.3: Multi-Tenant Foundation

> *"RolDe is an operating system, not a fixed product. Each clinic is wired to its own reality during onboarding."* — Bible 4.0 Principle 8
>
> Version 1.0 | Last Updated: 10 May 2026 | RolDe Ltd | CONFIDENTIAL
>
> The implementation specification for the Custodian/Caretaker authority model, tenant onboarding, billing, and per-tenant configuration. Inherits from Bible 0 v1.2, Bible 4.0, Bible 4.1, and Bible 4.2.

---

## How to Use This Document

This is the **implementation specification for RolDe's multi-tenant foundation**. It defines:

- The Caretaker admin panel (where each clinic configures their RolDe instance)
- The tenant onboarding wizard (the self-serve sign-up flow that turns a website visitor into an active paying tenant)
- The rolde.app marketing site as the entry funnel
- Stripe billing integration (subscriptions, payment methods, invoices, plan changes)
- Role and permission management (the eight-role taxonomy operationalised)
- The per-tenant configuration system (how clinics wire RolDe to their reality)
- The Custodian admin (Roland's cross-tenant control panel)
- The HR / profile / absences flow (Bible 0 §12.4)

**Loading order for Claude Code sessions**:
1. Bible 0 v1.2 — group defaults
2. Bible 4.0 — RolDe constitution
3. Bible 4.1 — architecture (multi-tenant data architecture, auth)
4. Bible 4.2 — design system (Caretaker admin uses Section 9 component patterns)
5. This Bible 4.3 — multi-tenant implementation
6. Bibles 4.4/4.5/4.6 — module-specific Bibles when building modules

This Bible is implementation-detailed. Where Bible 4.1 said *"the tenants table has these columns"*, this Bible says *"and here is the precise onboarding wizard step that populates them."*

---

## Table of Contents

1. The Authority Model Operationalised
2. The Onboarding Wizard (Self-Serve SaaS Flow)
3. The rolde.app Marketing Site (Entry Funnel)
4. The Stripe Billing Integration
5. The Caretaker Admin Panel
6. The Custodian Admin Panel
7. Role and Permission Management
8. The HR / Profile / Absences Flow
9. The Tenant Configuration System (JSONB Schema)
10. The Tenant Lifecycle (Pending → Active → Suspended → Archived)
11. The Subdomain Provisioning Pipeline
12. The Custom Domain Pipeline (Phase 2 Note)
13. The Multi-Tenant API Patterns
14. The Tenant-Switching Flow (Multi-Tenant Users)
15. The Audit and Compliance Layer
16. The Pricing Tiers and Module Gating
17. Acceptance Criteria for "Multi-Tenant Foundation Is Built"

---

## 1. The Authority Model Operationalised

Bible 0 §12.1 and Bible 4.0 §10 commit to a two-tier authority model. This section operationalises it precisely.

### 1.1 The Custodian (Roland, eventually RoDee Ltd)

The Custodian's actual capabilities, as code:

| Capability | Operationalisation |
|---|---|
| Cross-tenant query access | Via `custodian_query_*` SECURITY DEFINER functions (Bible 4.1 §3.4); every access audit-logged |
| Platform-level configuration | Manages the `pricing_tiers` table, `module_definitions` table, `system_config` table |
| Tenant approval | Approves new tenant onboarding (or auto-approves via configurable rules) |
| Tenant suspension | Can suspend any tenant for billing failure, ToS violation, or critical incident |
| Tenant data export | Can generate a full tenant data export (for GDPR, migration, or termination) |
| AI model promotion | Only role authorised to promote a new fine-tuned model to production (Bible 0 §12.9 / Bible 4.7) |
| Update Notes publishing | Only role authorised to publish RolDe AI / platform Update Notes |
| Billing reconciliation | Views all tenants' billing status; can issue refunds, comp credits |
| Code deployment | Pushes platform updates that propagate to all active tenants |

### 1.2 The Caretaker (Clinic Principal)

> **Role names follow the C-word taxonomy.** Canonical list + reasoning: `docs/rolde_role_taxonomy.md`.

Each tenant has at least one Caretaker — the principal clinician (or principal clinical director) responsible for the tenant. A tenant may have multiple Caretakers (e.g. a managing partner and a clinical director); each Caretaker has full Caretaker-level authority.

| Capability | Operationalisation |
|---|---|
| User management within tenant | Add/remove/edit users; assign roles (Curator, Clinician, Locum, Nurse, Chemist, Cunnere, Concierge, Cofferer); cannot grant Caretaker role to themselves but can grant it to others |
| Tenant configuration | Modifies `tenants.config` JSONB (Bible 4.1 §5.5); changes are audit-logged |
| Module enable/disable | Toggles modules within the tenant's tier; cannot enable modules requiring a higher tier without billing change |
| Branding configuration | Uploads logo, sets primary colour (used only in appropriate contexts per Bible 4.2 §2.7), edits clinic name and tagline |
| Referral routing | Configures which receiving services receive referrals via what method (RolDe in-network vs PDF email) |
| Pharmacy integration | Configures pharmacy partners (NHS, private, clinic-stock) for the tenant |
| Payment configuration | Configures Stripe Connect (for accepting patient payments), invoice templates, refund policy |
| Patient portal visibility | Configures which data types are visible to patients (lab results delay, etc.) |
| Local protocol upload | Uploads tenant-local clinical guidelines that inform their AI but do NOT propagate globally (Bible 0 §12.9 / Bible 4.0 §10.1) |
| Absence approval | Approves user absence requests (which auto-reflect in appointment availability) |
| Billing visibility | Sees own tenant's invoices, can update payment method, can change plan |
| Audit log access | Views their own tenant's audit log |
| Cannot | View other tenants; modify platform-level config; promote AI models; suspend other tenants |

### 1.3 The Clinician / Locum / Nurse / Chemist / Cunnere / Curator / Concierge / Cofferer

Each role's specific capabilities are detailed in §7 (Role and Permission Management) and operationalised through RLS policies on every relevant table.

### 1.4 The Patient Role

Patients exist as a distinct user role with severely restricted scope:

- Authenticated against `auth.users` like other users
- `tenant_users` row with role `patient`
- Linked to a `patients` row (the clinical record they correspond to)
- RLS policies restrict to own data only (Bible 4.1 §4.3)
- Patient portal subdomain (`patient.<clinicname>.rolde.app`) routes them to a different surface entirely

A single physical person who is a patient at multiple RolDe clinics has multiple `auth.users` records (one per clinic) — there is NO global patient identity (Bible 4.1 §3.6).

---

## 2. The Onboarding Wizard (Self-Serve SaaS Flow)

This is the spine of RolDe's growth. A prospective clinic visits `rolde.app`, decides to sign up, and within 30 minutes is logged into their own active tenant. No sales calls. No demo requests. No procurement processes. (NHS comes later — Bible 4.0 §4.5.)

### 2.1 The Wizard Step Sequence

```
Step 0: Visitor lands on rolde.app marketing site
        ↓
Step 1: "Sign up" — basic prospect information
        ↓
Step 2: Verify email
        ↓
Step 3: Choose subscription tier
        ↓
Step 4: Enter clinic details
        ↓
Step 5: Choose subdomain
        ↓
Step 6: Add payment method (Stripe)
        ↓
Step 7: Select modules
        ↓
Step 8: Configure clinic basics (logo, tagline, primary colour, hours)
        ↓
Step 9: Add first additional users (optional — can defer to Caretaker admin)
        ↓
Step 10: Confirm + activate
        ↓
Tenant is provisioned, subdomain DNS resolves, Caretaker is logged in to their dashboard
```

### 2.2 The Wizard Implementation Pattern

The wizard is a multi-step form rendered as a full-page experience (NOT a modal — the user is committing to a process, not a quick action). Each step:

- Lives at its own URL: `rolde.app/onboarding/step-1`, `rolde.app/onboarding/step-2`, etc.
- Saves progress to a `tenant_onboarding_sessions` row at each step (so user can return if interrupted)
- Validates before allowing forward navigation
- Shows progress indicator at top (subtle, calm — Bible 4.2 §1.1)
- Allows back navigation without data loss

Schema for the onboarding session:

```sql
CREATE TABLE tenant_onboarding_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Progress
  current_step    INTEGER NOT NULL DEFAULT 1,
  completed_steps INTEGER[] NOT NULL DEFAULT '{}',
  
  -- Accumulated data (filled progressively)
  prospect_data   JSONB NOT NULL DEFAULT '{}',
  
  -- Outcome
  status          TEXT NOT NULL DEFAULT 'in_progress',
  -- 'in_progress' | 'abandoned' | 'completed' | 'failed'
  
  tenant_id       UUID REFERENCES tenants(id),  -- Set when wizard completes successfully
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  abandoned_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_onboarding_user ON tenant_onboarding_sessions(user_id);
CREATE INDEX idx_onboarding_status ON tenant_onboarding_sessions(status, updated_at);
```

### 2.3 Step 1 — Sign Up

The first form. Minimal friction.

```
+---------------------------------------------------------+
|                                                         |
|   Start your RolDe trial                                |
|                                                         |
|   30-day free trial. No credit card required for trial. |
|                                                         |
|                                                         |
|   Your name              [_________________________]   |
|   Work email             [_________________________]   |
|   Clinic name            [_________________________]   |
|                                                         |
|   I am a:                                               |
|   ○ Doctor (GMC-registered)                             |
|   ○ Dentist (GDC-registered)                            |
|   ○ Nurse (NMC-registered)                              |
|   ○ Other clinical professional                         |
|                                                         |
|   [Continue →]                                          |
|                                                         |
|   Already have an account?  [Log in]                    |
|                                                         |
+---------------------------------------------------------+
```

On submit:
- Creates `auth.users` record (Supabase Auth)
- Creates `tenant_onboarding_sessions` row, status `in_progress`, current_step 1
- Sends verification email
- Routes to Step 2

### 2.4 Step 2 — Verify Email

```
+---------------------------------------------------------+
|                                                         |
|   Verify your email                                     |
|                                                         |
|   We sent a verification link to                        |
|   roland@docforskin.com                                 |
|                                                         |
|   Click the link to continue setting up your clinic.    |
|                                                         |
|                                                         |
|   [Resend verification email]                           |
|   [Use a different email]                               |
|                                                         |
+---------------------------------------------------------+
```

User clicks email link → returns to onboarding at Step 3.

### 2.5 Step 3 — Choose Subscription Tier

```
+---------------------------------------------------------+
|                                                         |
|   Choose your plan                                      |
|                                                         |
|   All plans include a 30-day free trial.                |
|   No charge until trial ends.                           |
|                                                         |
|                                                         |
|   +-----------------+  +-----------------+              |
|   |                 |  |                 |              |
|   |   Starter       |  |   Professional  |              |
|   |   £49/month     |  |   £149/month    |              |
|   |                 |  |   ★ Most chosen |              |
|   |   Solo or       |  |                 |              |
|   |   small clinic  |  |   Multi-        |              |
|   |   Up to 3 users |  |   clinician  |              |
|   |                 |  |   Up to 15 users|              |
|   |   [Choose]      |  |   [Choose]      |              |
|   +-----------------+  +-----------------+              |
|                                                         |
|   +-----------------+                                   |
|   |                 |                                   |
|   |   Premium       |                                   |
|   |   £349/month    |                                   |
|   |                 |                                   |
|   |   Larger clinic |                                   |
|   |   Unlimited usrs|                                   |
|   |   Claude API    |                                   |
|   |   fallback      |                                   |
|   |                 |                                   |
|   |   [Choose]      |                                   |
|   +-----------------+                                   |
|                                                         |
|   See full feature comparison →                         |
|                                                         |
+---------------------------------------------------------+
```

Plans defined in §16. Selection writes to `prospect_data.tier`.

### 2.6 Step 4 — Clinic Details

```
+---------------------------------------------------------+
|                                                         |
|   Tell us about your clinic                             |
|                                                         |
|                                                         |
|   Legal name      [Doc For Skin Ltd_____________]       |
|                                                         |
|   Clinic name     [Doc For Skin________________]        |
|   (display name)                                        |
|                                                         |
|   Country         [United Kingdom              ▼]       |
|   Region          [Scotland                    ▼]       |
|                                                         |
|   Practice type   [Aesthetic medicine clinic   ▼]       |
|                                                         |
|   Address line 1  [_________________________]          |
|   Address line 2  [_________________________]          |
|   City            [Edinburgh______________]            |
|   Postcode        [EH9 1XX_____________]               |
|                                                         |
|   ICO registration                                      |
|   number          [________________]                    |
|   (required for clinical operation;                    |
|    can add later if not yet registered)                 |
|                                                         |
|   HIS registration                                      |
|   number          [________________]                    |
|   (Scotland only — required before                      |
|    Group 2 procedures)                                  |
|                                                         |
|   [Continue →]                                          |
|                                                         |
+---------------------------------------------------------+
```

The HIS field is conditional — appears only when region is Scotland AND practice type is aesthetic. Per Bible 0 / Doc For Skin consent research understanding: Group 2 procedures (Botox, fillers, threads) require HIS registration.

Validation:
- ICO and HIS can be left blank during onboarding (warning shown), but tenant.status remains `pending` until provided
- Clinic legal name must match a Companies House lookup (optional auto-suggest via Companies House API)

### 2.7 Step 5 — Choose Subdomain

```
+---------------------------------------------------------+
|                                                         |
|   Choose your RolDe address                             |
|                                                         |
|                                                         |
|   This is where you and your team will                  |
|   access RolDe. You can connect a custom domain         |
|   later if you wish.                                    |
|                                                         |
|                                                         |
|   [docforskin             ].rolde.app                   |
|                                                         |
|   ✓ Available                                           |
|                                                         |
|   This will be your team's URL:                         |
|   docforskin.rolde.app                                  |
|                                                         |
|   Patients will book at:                                |
|   patient.docforskin.rolde.app                          |
|                                                         |
|   [Continue →]                                          |
|                                                         |
+---------------------------------------------------------+
```

Real-time availability check:
- Lowercase letters, numbers, hyphens only (regex from Bible 4.1 §3.2)
- 3-30 characters
- Cannot be reserved word (`www`, `app`, `api`, `admin`, `patient`, `mail`, `static`, etc.)
- Cannot match existing tenant subdomain
- Suggests alternatives if taken

### 2.8 Step 6 — Add Payment Method

Only required after free trial ends, but collected upfront for smooth transition. Stripe Elements embedded.

```
+---------------------------------------------------------+
|                                                         |
|   Add a payment method                                  |
|                                                         |
|   You won't be charged until your 30-day free trial     |
|   ends. We'll send a reminder 7 days before billing     |
|   starts, so you can decide before any charge.          |
|                                                         |
|                                                         |
|   Card number    [............]                         |
|   Expiry         [MM/YY]    CVC [___]                  |
|   Postcode       [________]                            |
|                                                         |
|   Billing address same as clinic address  [✓]           |
|                                                         |
|   [Add payment method →]                                |
|                                                         |
|   [Skip for now] (limits trial to 14 days)              |
|                                                         |
+---------------------------------------------------------+
```

Implementation:
- Stripe Customer created via API call
- Payment method attached
- `tenants.stripe_customer_id` set
- `tenants.subscription_status` = 'trialing'
- Stripe Subscription created with trial_period_days=30 (or 14 if "Skip for now")
- Webhook receives `customer.subscription.created` and confirms

### 2.9 Step 7 — Select Modules

```
+---------------------------------------------------------+
|                                                         |
|   Choose your modules                                   |
|                                                         |
|   You can change these later in settings.               |
|                                                         |
|                                                         |
|   ✓ Clinical notes                       (Universal)    |
|   ✓ Calendar / scheduling                (Universal)    |
|   ✓ Patient management                   (Universal)    |
|   ✓ Audit log                            (Universal)    |
|   ✓ Closed-loop referrals                (Universal)    |
|   ✓ Letters (referrals, sick notes)      (Universal)    |
|                                                         |
|   ─────                                                 |
|                                                         |
|   ☐ Prescribing                          [+ Enable]     |
|   ☐ Lab orders                           [+ Enable]     |
|   ☐ Radiology orders                     [+ Enable]     |
|                                                         |
|   ─────  Specialty modules  ─────                       |
|                                                         |
|   ☐ Aesthetic photography (5-photo set)  [+ Enable]     |
|   ☐ DVLA driver medical assessments      [+ Enable]     |
|   ☐ Ophthalmology workflows              [+ Enable]     |
|   ☐ Orthopaedic workflows                [+ Enable]     |
|                                                         |
|   ─────  Premium modules (Premium tier)  ─────          |
|                                                         |
|   ☐ Claude API fallback for hard cases   (your tier)    |
|   ☐ Payment-gated investigations         [+ Enable]     |
|   ☐ Payment-gated prescriptions          [+ Enable]     |
|                                                         |
|                                                         |
|   [Continue →]                                          |
|                                                         |
+---------------------------------------------------------+
```

The available modules are filtered by the chosen tier. Modules marked "(your tier)" are included. Modules marked "[+ Enable]" require active enabling. Modules in "Premium modules" section show greyed if user is on Starter/Professional with an "Upgrade plan to access" link.

### 2.10 Step 8 — Configure Clinic Basics

```
+---------------------------------------------------------+
|                                                         |
|   Configure your clinic                                 |
|                                                         |
|                                                         |
|   Logo                                                  |
|   [Drop file here or click to upload]                   |
|   Recommended: 500×500 PNG, transparent background      |
|                                                         |
|                                                         |
|   Tagline (optional)                                    |
|   [Where your skin sees a doctor___________________]   |
|                                                         |
|                                                         |
|   Primary colour                                        |
|   [#000000        ]  [colour swatch preview]            |
|   Used only in appropriate contexts (logo region,       |
|   email headers, letter print headers).                 |
|                                                         |
|                                                         |
|   Operating hours                                       |
|   Monday      [09:00 - 17:00]    [Closed ☐]            |
|   Tuesday     [09:00 - 17:00]    [Closed ☐]            |
|   ...                                                   |
|                                                         |
|                                                         |
|   Default appointment duration                          |
|   [30 minutes      ▼]                                   |
|                                                         |
|                                                         |
|   [Continue →]                                          |
|                                                         |
+---------------------------------------------------------+
```

The logo upload triggers the file storage pipeline (Bible 4.1 §8 — `tenant-public` bucket).

### 2.11 Step 9 — Add Users (Optional)

```
+---------------------------------------------------------+
|                                                         |
|   Add team members                                      |
|                                                         |
|   You can do this now or later in settings.             |
|                                                         |
|                                                         |
|   [+ Add user]                                          |
|                                                         |
|   ─── Or skip for now ───                               |
|                                                         |
|   [Skip and finish setup →]                             |
|                                                         |
+---------------------------------------------------------+
```

If "Add user" clicked, a small modal:

```
+----------------------------------+
|   Add a team member              |
|                                  |
|   Email     [_______________]   |
|   Name      [_______________]   |
|   Role      [Clinician   ▼]  |
|                                  |
|   For clinicians:             |
|   GMC number  [_____________]   |
|   Specialties [_____________]   |
|   Prescribing rights  [✓]        |
|                                  |
|   [Send invite]   [Cancel]       |
+----------------------------------+
```

The user receives an invitation email. Their `tenant_users` row is created with `accepted_at = null`. They activate by accepting the email link.

### 2.12 Step 10 — Confirm + Activate

```
+---------------------------------------------------------+
|                                                         |
|   You're ready to launch                                |
|                                                         |
|                                                         |
|   Clinic:        Doc For Skin                           |
|   Address:       docforskin.rolde.app                   |
|   Plan:          Professional (£149/month after trial)  |
|   Trial ends:    9 June 2026                            |
|   Modules:       8 enabled                              |
|   Team:          1 member (you)                         |
|                                                         |
|                                                         |
|   By activating, you agree to:                          |
|   - RolDe Terms of Service                              |
|   - Data Processing Agreement (you are Data Controller; |
|     RolDe Ltd is Data Processor)                        |
|   - Privacy Policy                                      |
|                                                         |
|   [✓] I have read and agree to the above documents      |
|                                                         |
|                                                         |
|   [Activate clinic →]                                   |
|                                                         |
+---------------------------------------------------------+
```

On Activate:
- `tenants.status` → 'active'
- `tenants.activated_at` set
- DNS for the subdomain provisioned (via Vercel API or pre-provisioned wildcard)
- DPA template generated and stored in `tenant-private` bucket (timestamped, signed by user)
- User redirected to `<chosensubdomain>.rolde.app/dashboard`
- Welcome email sent
- Custodian receives notification of new tenant

### 2.13 The Abandoned Wizard Recovery

If a user starts the wizard and abandons it:
- After 1 day: nudge email "You're 60% of the way to launching your clinic"
- After 3 days: nudge email with link back to where they left off
- After 7 days: status → `abandoned`; further nudges suspended
- After 30 days: row archived; data retained for compliance but invisible to onboarding

---

## 3. The rolde.app Marketing Site (Entry Funnel)

This is the public marketing site (no subdomain — `rolde.app` itself). It is the entry point for every future clinic customer (Bible 0 §12.3, Bible 4.0 §10.5).

### 3.1 The Site Structure

```
rolde.app/                          (homepage — hero, value proposition)
rolde.app/why-rolde                 (the diagnosis — Bible 4.0 §3 in marketing form)
rolde.app/features                  (overview)
rolde.app/features/closed-loop      (the closed-loop referral pipeline)
rolde.app/features/ambient-ai       (the AI panel and what it does)
rolde.app/features/calm-dashboard   (the design philosophy)
rolde.app/specialties               (specialty-specific pages)
rolde.app/specialties/aesthetic     (Doc For Skin pattern)
rolde.app/specialties/driver-medicals (Doc For Drivers pattern)
rolde.app/specialties/general-practice
rolde.app/pricing                   (plans, comparison, FAQ)
rolde.app/about                     (Roland's story; the founder-clinician origin)
rolde.app/blog                      (Phase 2; not at launch)
rolde.app/docs                      (clinic-facing documentation)
rolde.app/legal/privacy
rolde.app/legal/terms
rolde.app/legal/dpa-template
rolde.app/onboarding/...            (the wizard from §2)
rolde.app/login                     (login routing — see §3.4)
```

### 3.2 The Homepage

The hero of the marketing site. Restrained, confident, doctor-to-doctor. Bible 4.0 §13.1 voice.

DESIGN NEEDED: Homepage hero visual — Roland to design.

Content sections (in order):

1. **Hero**
   - Headline: *"The platform that finally understood software needs in healthcare."*
   - Sub-headline: *"Built by a doctor, for doctors. RolDe is the operating system for clinical practice."*
   - Single CTA: "Start your 30-day trial" → onboarding wizard
   - Quiet visual element (DESIGN NEEDED — Roland may opt for none, leaving it text-only)

2. **The Diagnosis**
   - Bible 4.0 §3 distilled into 2-3 paragraphs
   - "Healthcare software has been built by people who don't practise medicine."
   - "RolDe inverts this."

3. **What RolDe Does**
   - Three feature highlights with brief text + monochrome illustrations:
     - Closed-loop referrals (the pipeline that completes)
     - Ambient AI (drafts everything, sends nothing without approval)
     - Calm dashboard (no anxiety, no badges, no urgency)

4. **The Origin**
   - Roland's photo + a paragraph: "RolDe was visualised, conceptualised, and built by Roland Manoj Jayasekhar, a UK-registered doctor, with Devi as soulmate and partner in the work. RolDe is what happens when a doctor decides to build the software healthcare deserves rather than wait for someone else to."
   - DESIGN NEEDED: Roland's photo (Roland to provide).

5. **What Clinicians Are Saying** (Phase 2 — testimonials section, blank at launch)

6. **Pricing**
   - Three plans summarised
   - Single CTA: "Compare plans →" / "Start trial →"

7. **Final CTA**
   - "Ready to use software that respects your time?"
   - "Start your 30-day trial"

### 3.3 The Feature Pages

Each feature page (`/features/closed-loop`, `/features/ambient-ai`, `/features/calm-dashboard`) follows the same template:

- Headline (the feature in plain language)
- The problem with current software (the diagnosis)
- How RolDe solves it (the architectural choice)
- A walkthrough (text-only or with monochrome diagrams; DESIGN NEEDED for diagrams)
- Constitutional commitments related to this feature (e.g. for ambient AI: "RolDe drafts everything, sends nothing without approval")
- CTA back to onboarding

### 3.4 The Login Flow

`rolde.app/login` is the entry point for users whose clinic uses RolDe but who arrive at the marketing site by mistake.

```
+---------------------------------------------------+
|                                                   |
|   Log in to RolDe                                 |
|                                                   |
|   What's your clinic's RolDe address?             |
|                                                   |
|   [_____________________].rolde.app               |
|                                                   |
|   [Continue →]                                    |
|                                                   |
|   Don't know your clinic's address?               |
|   [Find clinic by clinic name]                    |
|                                                   |
|   New here? [Start your trial]                    |
|                                                   |
+---------------------------------------------------+
```

After entering subdomain: redirect to `<subdomain>.rolde.app/login` for actual auth.

### 3.5 The Marketing Site Performance

Per Bible 4.1 §16.1: marketing site has the tightest performance budget (FCP < 1.0s, LCP < 1.5s, bundle < 200KB). It is the first impression. Slow marketing site = abandoned trial signups.

Implementation: Heavy use of Next.js static generation (most pages are `force-static`), edge caching, minimal client-side JavaScript, optimised images.

---

## 4. The Stripe Billing Integration

Stripe handles all payment processing for RolDe-Ltd-to-tenant billing. Tenant-to-patient billing is a separate concern (Stripe Connect, configured per tenant in Caretaker admin — §5).

### 4.1 The Stripe Object Model

| RolDe Object | Stripe Object | Relationship |
|---|---|---|
| Tenant | Customer | 1:1; `tenants.stripe_customer_id` |
| Subscription tier | Product + Price | Each tier (Starter, Professional, Premium) is a Stripe Product with monthly + annual Prices |
| Active subscription | Subscription | 1:1 with tenant; `tenants.stripe_subscription_id` |
| Module (paid add-on) | Product + Price | Each paid module is its own Product; subscriptions can have multiple Items |
| Payment method | PaymentMethod | Attached to Customer |
| Invoice | Invoice | Generated by Stripe; downloadable from Caretaker admin |

### 4.2 The Stripe Webhook Handler

Stripe events drive RolDe state changes. Webhook endpoint at `https://rolde.app/api/webhooks/stripe`.

Events handled:

| Event | Action |
|---|---|
| `customer.subscription.created` | `tenants.subscription_status` = 'trialing' or 'active' |
| `customer.subscription.updated` | Sync subscription status, plan changes |
| `customer.subscription.deleted` | `tenants.subscription_status` = 'cancelled' |
| `customer.subscription.trial_will_end` | Send 7-day reminder email; surface notice in Caretaker admin |
| `invoice.payment_succeeded` | Audit log entry; receipt email |
| `invoice.payment_failed` | `tenants.subscription_status` = 'past_due'; notify Caretaker; grace period 14 days |
| `payment_method.attached` | Update card-on-file in Caretaker admin |
| `payment_method.detached` | Notify Caretaker if last payment method removed |
| `customer.updated` | Sync billing address |

Webhook signature verification mandatory (Stripe security best practice). Failed verification rejected with 400.

### 4.3 The Past-Due Tenant Handling

When a tenant goes past-due:

- Day 0 (failure): Tenant remains active; Caretaker notified; Stripe attempts retry
- Day 3: Second notification; Caretaker dashboard shows persistent banner
- Day 7: Third notification; non-Caretaker users see banner on login
- Day 14: Tenant suspended (status → 'suspended'); login disabled for non-Caretaker roles; Caretaker can still access to update payment method
- Day 30: Tenant archived (status → 'archived'); Custodian notified for review; data retained per ToS

### 4.4 The Plan Upgrade / Downgrade Flow

Caretaker can change plan at any time:

- Upgrade: prorated immediately; new modules become available
- Downgrade: takes effect at end of current billing period; any modules lost are flagged ("Will be disabled on [date] when plan changes")

Implementation: Stripe Subscription update with `proration_behavior: 'create_prorations'` for upgrades, `'none'` for downgrades.

### 4.5 The Invoice Display

In Caretaker admin → Billing → Invoices:

```
INVOICES
                                                 [Export all]
                                                 
Invoice #INV-0042              £149.00       PAID
1 May 2026 - 31 May 2026                      [Download PDF]
                                                 
Invoice #INV-0041              £149.00       PAID
1 Apr 2026 - 30 Apr 2026                      [Download PDF]
                                                 
Invoice #INV-0040              £149.00       PAID
1 Mar 2026 - 31 Mar 2026                      [Download PDF]
```

Each invoice link fetches Stripe-hosted PDF.

### 4.6 The Tenant-to-Patient Billing (Stripe Connect)

This is a separate concern. Tenant clinics that want to accept payments from patients (for consultations, procedures) use Stripe Connect.

In Caretaker admin → Settings → Payments:
- "Connect your Stripe account" button → Stripe Connect OAuth flow
- Once connected, tenant can configure:
  - Whether patients pay at booking (deposit) or at appointment (full)
  - Refund policy (no refund / partial / full)
  - Whether prescriptions / labs / radiology require payment before issue (paywall modules from §16)
- All patient payments go directly to the tenant's Stripe account (not through RolDe Ltd)
- RolDe takes no platform fee on tenant-to-patient transactions (we earn from clinic subscription, not from clinical work)

This commitment matters: RolDe doesn't extract value from the clinical revenue stream. Bible 4.0 §11.4 — *"extracting more from clinicians than RolDe gives them is failure."*

---

## 5. The Caretaker Admin Panel

Where each Caretaker configures and runs their clinic's RolDe instance.

### 5.1 The Admin Panel URL and Routing

Accessed at `<subdomain>.rolde.app/admin` (only visible to users with Caretaker role; other roles get 404).

Top-level navigation (left rail, Bible 4.2 §3.3 pattern):

- Overview (dashboard)
- Users
- Clinic Settings
- Modules
- Branding
- Integrations
- Patient Portal Settings
- Letter Routing
- Local Protocols
- Billing
- Audit Log
- Help / Documentation

### 5.2 The Overview Page

`<subdomain>.rolde.app/admin`

```
CLINIC OVERVIEW                                Doc For Skin

This week:
  3 new patients
  18 appointments
  12 prescriptions issued
  4 referrals sent

Active users:                                          5
Pending invitations:                                   1
Modules enabled:                                      11

Subscription:                                Professional
Next bill:                          1 June 2026  £149.00

Recent activity:
  - Roland sent referral letter to NHS Lothian Rheumatology
  - Concierge registered new patient: Sarah Jones
  - AI suggestion adopted: Botox dose adjustment for repeat patient
  - Roland approved absence: 23-25 June (annual leave)

[Quick actions]
  [+ Invite team member]  [Configure modules]  [View audit log]
```

Calm. Factual. No anxiety. No counters demanding action.

### 5.3 The Users Page

`<subdomain>.rolde.app/admin/users`

```
USERS                                              [+ Invite]

NAME                  ROLE              STATUS       LAST SEEN
─────────────────────────────────────────────────────────────
Roland M Jayasekhar   Caretaker           Active       Now
Sarah Davies          Clinician      Active       2h ago
James Chen            Clinician      Pending      Invited 2 days ago
Lisa Wong             Concierge      Active       1h ago
Mary Williams         Nurse             Active       Today
─────────────────────────────────────────────────────────────

[Filter by role ▼]   [Filter by status ▼]   [Search ____]
```

Click any user row → user detail page where Caretaker can:
- Edit display name, photo
- Change role (with confirmation modal warning)
- Update GMC/NMC/GDC numbers
- Edit specialties
- Toggle prescribing rights
- Suspend or remove user
- View audit log of user's actions

### 5.4 The Clinic Settings Page

`<subdomain>.rolde.app/admin/settings`

Tabbed interface:

- **General**: clinic name, legal name, address, phone, hours, timezone
- **Compliance**: ICO registration, HIS/CQC registration, indemnity insurance details, complaints policy, refund policy
- **Patient communication**: welcome email template (Bible 0 §12.6), reminder timing (24h/48h before appointment), SMS opt-in default
- **Notifications**: which events Caretaker gets notified about (referral failures, payment failures, AI errors)

### 5.5 The Modules Page

`<subdomain>.rolde.app/admin/modules`

```
MODULES                                          Plan: Professional

UNIVERSAL (included)                                          ENABLED
  ✓ Clinical notes
  ✓ Calendar / scheduling
  ✓ Patient management
  ✓ Audit log
  ✓ Closed-loop referrals
  ✓ Letters

CORE CLINICAL                                                 ENABLED
  ✓ Prescribing                                       [Configure]
  ✓ Lab orders                                        [Configure]
  ☐ Radiology orders                                  [+ Enable]

SPECIALTY                                                     ENABLED
  ✓ Aesthetic photography                             [Configure]
  ☐ DVLA driver medical assessments                   [+ Enable]
  ☐ Ophthalmology workflows                           [+ Enable]
  ☐ Orthopaedic workflows                             [+ Enable]

PREMIUM (requires plan upgrade)
  Claude API fallback                                 [Upgrade plan]
  Payment-gated investigations                        [Upgrade plan]
  Payment-gated prescriptions                         [Upgrade plan]
```

Each module's `[Configure]` link goes to module-specific settings (e.g. for Prescribing: pharmacy partners, default formulary preferences; for Aesthetic photography: watermark settings, photo retention period).

### 5.6 The Branding Page

`<subdomain>.rolde.app/admin/branding`

- Logo upload (replacing onboarding step 8 settings)
- Tagline editor
- Primary colour picker (with live preview of where it appears)
- Email signature image
- Letter print header (DESIGN NEEDED inheritance from Bible 4.2 §16.1)

### 5.7 The Integrations Page

`<subdomain>.rolde.app/admin/integrations`

- **Stripe Connect** for patient payments (§4.6)
- **Pharmacy partners** — list of configured pharmacies, can add/remove
- **Lab providers** — same pattern
- **Radiology providers** — same pattern
- **Email provider** — defaults to RolDe's transactional email; advanced tenants can connect their own SMTP (Phase 2)

### 5.8 The Patient Portal Settings Page

`<subdomain>.rolde.app/admin/patient-portal`

```
PATIENT PORTAL VISIBILITY

What patients can see:

  ✓ Upcoming appointments          (always visible)
  ✓ Past appointments              (always visible)
  ✓ Discharge summaries            (after clinician sign-off)
  ✓ Lab results                    [Delay: 24 hours after received   ▼]
  ✓ Radiology results              [Delay: 48 hours after received   ▼]
  ☐ Clinical notes                 (never visible by default)
  ✓ Prescriptions                  (after dispensed)
  ✓ Referral letters (sent copy)   (after sent)

What patients can do:

  ✓ Reschedule appointments        (within 24h of scheduled time)
  ✓ Cancel appointments            (within 48h notice; refund per policy)
  ✓ Book follow-up appointments    [Allowed slots: regular hours]
  ☐ Message clinicians             (Phase 2)
  ✓ Update demographics            (audit-logged)
  ✓ View signed consents
  ✓ Sign new consents (pre-consultation)
```

### 5.9 The Letter Routing Page

`<subdomain>.rolde.app/admin/letter-routing`

```
LETTER ROUTING

When a referral is generated, route as follows:

Specialty                Method              Destination
─────────────────────────────────────────────────────────────────
Rheumatology             Email               rheum.referrals@nhs...
Dermatology              RolDe network       Edinburgh Skin Clinic
Cardiology               Email               [Configure ↓]
Orthopaedics             Email               [Configure ↓]
Ophthalmology            Email               [Configure ↓]
General Practice         Email               (patient's registered GP)
[+ Add specialty]
─────────────────────────────────────────────────────────────────

Discharge summaries:
  Send copy to:  [Patient ✓]  [Patient's GP ✓]  [Other ☐]

Sick notes:
  Generated as:  [PDF for patient to print ▼]
  
GMC notification letters (Phase 2):
  Auto-route to:  [Configure]
```

Each row's destination configurable. RolDe-network connections show the receiving clinic name and Caretaker acceptance status (Bible 0 §12.5).

### 5.10 The Local Protocols Page

`<subdomain>.rolde.app/admin/local-protocols`

```
LOCAL PROTOCOLS

These are clinical guidelines specific to your clinic.
RolDe AI uses them when reasoning about your patients.

These protocols inform YOUR clinic's AI only — they
never propagate to RolDe's global AI database.

────────────────────────────────────────────────────

Uploaded protocols:

  📄 Edinburgh local antibiotic guidelines (Apr 2026)
     Uploaded 3 days ago by Roland     [View] [Replace] [Remove]

  📄 Doc For Skin filler emergency protocol (May 2026)
     Uploaded 1 day ago by Roland      [View] [Replace] [Remove]

[+ Upload protocol (PDF or text)]
```

Clear constitutional language: "These protocols inform YOUR clinic's AI only — they never propagate to RolDe's global AI database." Bible 0 §12.9 / Bible 4.0 §10.1 made visible to the user.

### 5.11 The Billing Page

`<subdomain>.rolde.app/admin/billing`

- Current plan + cost
- Payment method on file (with [Update] action)
- Next billing date
- Invoice history (§4.5)
- Plan change controls (upgrade/downgrade/cancel)
- Tax invoice download

### 5.12 The Audit Log Page

`<subdomain>.rolde.app/admin/audit-log`

```
AUDIT LOG                                  [Filter ▼]  [Export]

DATE/TIME             ACTOR              ACTION
─────────────────────────────────────────────────────────────
10 May 14:32         Roland             Patient created: Sarah Jones
10 May 14:30         Roland             Logged in
10 May 14:28         Sarah Davies       Prescription approved: Cephalexin
                                        Patient: John Smith
10 May 14:15         Sarah Davies       Lab order sent: TDL Pathology
                                        Patient: John Smith
10 May 14:10         Sarah Davies       Note saved
                                        Patient: John Smith
10 May 13:55         Lisa Wong          Appointment booked
                                        Patient: David Chen, 15 May 10:30
─────────────────────────────────────────────────────────────

[Load more...]
```

Filter by: actor, action type, resource type, date range.
Export as CSV (audit log entries fetched from `audit_log` table per Bible 4.1 §5.4).

---

## 6. The Custodian Admin Panel

Roland's cross-tenant control panel. Lives at `rolde.app/custodian` (separate from any tenant subdomain).

### 6.1 The Custodian Authentication

Custodian users have a `custodian_users` row separate from `tenant_users`:

```sql
CREATE TABLE custodian_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  display_name  TEXT NOT NULL,
  
  -- Custodian-level authority
  can_promote_models       BOOLEAN NOT NULL DEFAULT false,
  can_modify_pricing       BOOLEAN NOT NULL DEFAULT false,
  can_suspend_tenants      BOOLEAN NOT NULL DEFAULT false,
  can_export_tenant_data   BOOLEAN NOT NULL DEFAULT false,
  can_access_training_data BOOLEAN NOT NULL DEFAULT false,
  
  -- MFA mandatory
  mfa_enabled   BOOLEAN NOT NULL DEFAULT false,
  
  status        TEXT NOT NULL DEFAULT 'active',
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID REFERENCES auth.users(id)
);
```

Roland is the first Custodian, with all `can_*` capabilities enabled. Future RoDee operations team members may be added with restricted capabilities.

### 6.2 The Custodian Authentication Requirements

- MFA mandatory (TOTP via authenticator app)
- Re-authentication required for sensitive actions (model promotion, tenant suspension, training data access)
- Session timeout 4 hours of inactivity (shorter than regular users)

### 6.3 The Custodian Admin Pages

```
rolde.app/custodian/                       (overview dashboard)
rolde.app/custodian/tenants                (tenant list, search, filter)
rolde.app/custodian/tenants/<id>           (single tenant detail)
rolde.app/custodian/onboarding             (onboarding queue, abandoned wizard recovery)
rolde.app/custodian/usage                  (the usage dashboard from Bible 0 §12.7)
rolde.app/custodian/billing                (cross-tenant billing health)
rolde.app/custodian/ai                     (Custodian Update Console — Bible 4.7)
rolde.app/custodian/correction-queue       (Validated Correction Pipeline review — Bible 4.7)
rolde.app/custodian/guideline-gaps         (guideline gap log — Bible 4.7)
rolde.app/custodian/audit                  (cross-tenant audit access, audit-logged itself)
rolde.app/custodian/system-config          (platform-level config: pricing tiers, modules)
rolde.app/custodian/update-notes           (publish RolDe AI / platform Update Notes)
```

### 6.4 The Custodian Overview

```
RolDe PLATFORM OVERVIEW                            10 May 2026

Active tenants:                                              7
Pending onboarding:                                          2
Abandoned wizards (last 7d):                                 3

This month:
  £1,043 MRR (Monthly Recurring Revenue)
  847 patient consultations across all tenants
  62 closed-loop referrals
  AI inference: 14,300 queries
  
Platform health:
  ✓ Vercel: operational
  ✓ Supabase: operational  
  ✓ AI server: operational (latency 320ms avg)
  ✓ Edge Functions: 73K invocations this month (15% of free tier)
  
Pending actions:
  - 4 corrections awaiting Custodian review
  - 1 new tenant pending approval (Edinburgh Aesthetic Clinic)
  - 12 abandoned wizards (suggest nudge campaign)
  - AI evaluation report ready (model v2.3 vs v2.4)
```

Calm. Informational. Roland sees what's happening across the whole platform.

### 6.5 The Tenant Detail Page

`rolde.app/custodian/tenants/<id>`

Roland can view (with audit log entry per access):
- Tenant configuration
- User list
- Usage metrics
- Billing status
- Audit log (read-only)
- Recent activity
- Subscription history

Actions Roland can take:
- Comp credit (issue free month)
- Adjust plan (with reason)
- Suspend (with reason)
- Archive (after suspension)
- Export data (full data dump per GDPR)

Every action audit-logged in `custodian_audit_log`.

### 6.6 The Cross-Tenant Audit Access

When Roland accesses any tenant's data via the Custodian admin:

1. Reason prompt: "Why are you accessing this tenant's data?"
2. Reason logged in `custodian_audit_log` with timestamp
3. Access granted for the session
4. Every query recorded
5. Caretaker of the affected tenant receives a notification: *"A RolDe Ltd staff member accessed your clinic's data on [date]. Reason: [reason]. View full audit."*

This transparency is constitutional. Custodian access is a privilege, not a right; it leaves a trail; tenants are informed.

### 6.7 The Other Custodian Pages

§16 of this Bible covers the pricing tier management page. Bible 4.7 will detail the AI-related Custodian pages (Update Console, Correction Queue, Guideline Gaps).

---

## 7. Role and Permission Management

The eight roles from Bible 4.1 §4.2 operationalised via RLS policies and application-level checks.

### 7.1 The Role Capabilities Matrix (Detailed)

| Capability | Custodian | Caretaker | Clinician | Locum | Nurse | Concierge | Cofferer | Patient |
|---|---|---|---|---|---|---|---|---|
| Read tenant patient list | A | Yes | Yes | Yes (session) | Yes | Yes | No | Self only |
| Read patient demographics | A | Yes | Yes | Yes | Yes | Yes | No | Self only |
| Read patient clinical record | A | Yes | Yes | Yes | Yes | No | No | Self (limited) |
| Write clinical notes | No | Yes | Yes | Yes | Yes | No | No | No |
| Issue prescriptions | No | If GMC + rights | If GMC + rights | If GMC + rights | No | No | No | No |
| Order labs/radiology | No | Yes | Yes | Yes | Yes | No | No | No |
| Generate referral letters | No | Yes | Yes | Yes | Yes | No | No | No |
| Approve and send referrals | No | Yes | Yes | Yes | No | No | No | No |
| Book/cancel appointments | A | Yes | Yes | Yes | Yes | Yes | No | Self only |
| Process patient payments | A | Yes | Yes | Yes | No | Yes | View | No |
| View financial summaries | A | Yes | No | No | No | Limited | Yes | Own only |
| Manage tenant users | No | Yes | No | No | No | No | No | No |
| Configure tenant modules | No | Yes | No | No | No | No | No | No |
| Configure tenant branding | No | Yes | No | No | No | No | No | No |
| Configure tenant integrations | No | Yes | No | No | No | No | No | No |
| View tenant audit log | A | Yes | Own only | Own only | Own only | Own only | No | No |
| Upload local protocols | No | Yes | No | No | No | No | No | No |
| Promote AI models | Yes | No | No | No | No | No | No | No |
| Cross-tenant query | Yes | No | No | No | No | No | No | No |

A = Audit-logged access (Custodian elevation pattern, Bible 4.1 §3.4)

### 7.2 The Permission Implementation

Two layers:

**Database layer (RLS)**: Enforces tenant isolation and basic role-based access. Cannot be bypassed by application bugs.

```sql
CREATE POLICY clinician_read_clinical_notes ON clinical_notes
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    AND EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
        AND tenant_users.tenant_id = clinical_notes.tenant_id
        AND tenant_users.role IN ('caretaker', 'clinician', 'locum', 'nurse')
        AND tenant_users.status = 'active'
    )
  );
```

**Application layer (server actions, API routes)**: Additional checks for role-specific business logic (e.g. "only clinicians with prescribing rights can issue prescriptions").

```typescript
// src/lib/auth/permissions.ts
export async function canIssuePrescription(userId: string, tenantId: string): Promise<boolean> {
  const { data: user } = await supabase
    .from('tenant_users')
    .select('role, prescribing_rights, gmc_number')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .single();
  
  if (!user) return false;
  
  return (
    ['caretaker', 'clinician', 'locum'].includes(user.role) &&
    user.prescribing_rights === true &&
    !!user.gmc_number  // Must have valid GMC number
  );
}
```

### 7.3 The Permission Tests (Mandatory)

Per Bible 4.1 §18.2 critical test cases. Every permission rule has automated tests:

```typescript
describe('Permission: canIssuePrescription', () => {
  it('returns true for Clinician with GMC + rights', async () => { /* ... */ });
  it('returns false for Clinician without prescribing rights', async () => { /* ... */ });
  it('returns false for Clinician without GMC number', async () => { /* ... */ });
  it('returns false for Nurse role even with GMC', async () => { /* ... */ });
  it('returns false for Concierge always', async () => { /* ... */ });
  it('returns false for user not in this tenant', async () => { /* ... */ });
  it('returns false for suspended user', async () => { /* ... */ });
});
```

---

## 8. The HR / Profile / Absences Flow

Per Bible 0 §12.4 — the HR portal is a real feature, not an afterthought.

### 8.1 The User Profile Page

Every user has a profile page at `<subdomain>.rolde.app/profile`:

```
YOUR PROFILE                                       Doc For Skin

Photo                                                  
[Upload photo]                                          
                                                       
Name              Roland Manoj Jayasekhar              
Display name      Dr Roland                            
Role              Caretaker  Clinician                
                                                       
Professional registration:                             
GMC number        7123456                              
                                                       
Specialties       General practice, Aesthetic medicine 
                                                       
Prescribing       ✓ Active                             
                                                       
Email             roland@docforskin.com                
Phone             [____________]                       
                                                       
[Save changes]                                         

──────────────────────────────────────────────────────

ABSENCES                                               

No absences requested.                                 

[Request absence]                                      

──────────────────────────────────────────────────────

PASSWORD                                               
[Change password]                                      

TWO-FACTOR AUTHENTICATION                              
[Enable 2FA]                                           
```

### 8.2 The Absence Request Flow

When a user clicks "Request absence":

```
+---------------------------------------------------+
|   Request absence                                  |
|                                                   |
|   Type:  [Annual leave            ▼]              |
|          (Annual leave / Sick / Conference /      |
|           CPD / Personal / Other)                  |
|                                                   |
|   From:  [______________]  to  [______________]   |
|                                                   |
|   Reason (optional):                              |
|   [_______________________________________]       |
|                                                   |
|   Cover arrangements:                             |
|   [No cover needed                          ▼]    |
|   (No cover needed / Locum / Cover by [name])     |
|                                                   |
|   [Submit request]                                |
+---------------------------------------------------+
```

On submit:
- `absence_requests` row created with status `pending`
- Notification sent to all Caretakers
- Caretaker approves or denies in their admin
- Approved absences automatically reflect in the appointment availability calendar (no slots offered during absence)

Schema:

```sql
CREATE TYPE absence_type AS ENUM (
  'annual_leave', 'sick', 'conference', 'cpd', 'personal', 'other'
);

CREATE TABLE absence_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  
  type          absence_type NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  reason        TEXT,
  cover_note    TEXT,
  
  status        TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'denied' | 'cancelled'
  approved_by   UUID REFERENCES auth.users(id),
  approved_at   TIMESTAMPTZ,
  denial_reason TEXT,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.3 The Caretaker Absence Management

In Caretaker admin → Users → Absences:

```
ABSENCE REQUESTS                                  

PENDING (1)                                        
                                                  
  Sarah Davies — Annual leave                     
  20 May - 24 May 2026                            
  No cover needed                                 
  [View details]  [Approve]  [Deny]                
                                                  
APPROVED (2)                                       
                                                  
  Lisa Wong — Sick                                 
  9 May 2026                                       
  [View details]                                   
                                                  
  James Chen — Conference                         
  15-17 June 2026                                 
  [View details]                                   
```

Approve action: writes `approved_at` and `approved_by`; notification sent to user; appointment availability auto-updates.

---

## 9. The Tenant Configuration System (JSONB Schema)

Bible 4.1 §5.5 noted that `tenants.config` is a JSONB column with documented structure. This section documents that structure precisely.

### 9.1 The Top-Level Config Structure

```typescript
// packages/db/types/tenant-config.ts
export interface TenantConfig {
  modules: ModuleConfig;
  integrations: IntegrationsConfig;
  branding: BrandingConfig;
  consent_settings: ConsentSettingsConfig;
  letter_routing: LetterRoutingConfig;
  patient_portal: PatientPortalConfig;
  scheduling: SchedulingConfig;
  notifications: NotificationsConfig;
}
```

Each section is a TypeScript interface, validated via Zod at write time.

### 9.2 The ModuleConfig

```typescript
export interface ModuleConfig {
  // Universal modules — always enabled, included in every tier
  clinical_notes: { enabled: true };
  scheduling: { enabled: true };
  patient_management: { enabled: true };
  audit_log: { enabled: true };
  closed_loop_referrals: { enabled: true };
  letters: { enabled: true };
  
  // Core clinical modules
  prescribing: {
    enabled: boolean;
    pharmacy_partners: PharmacyPartner[];
    default_quantity_units: string;
    enable_clinic_stock: boolean;
  };
  lab_orders: {
    enabled: boolean;
    providers: LabProvider[];
  };
  radiology_orders: {
    enabled: boolean;
    providers: RadiologyProvider[];
  };
  
  // Specialty modules
  aesthetic_photography: {
    enabled: boolean;
    standard: 'five_photo' | 'three_photo' | 'custom';
    watermark: WatermarkConfig;
  };
  dvla_assessments: {
    enabled: boolean;
    group_2_only: boolean;
  };
  ophthalmology: { enabled: boolean };
  orthopaedics: { enabled: boolean };
  
  // Premium modules
  claude_api_fallback: { enabled: boolean };
  payment_gated_investigations: { enabled: boolean };
  payment_gated_prescriptions: { enabled: boolean };
}
```

### 9.3 The BrandingConfig

```typescript
export interface BrandingConfig {
  logo_url: string | null;
  logo_dark_url: string | null;       // Optional dark mode variant
  favicon_url: string | null;
  app_icon_url: string | null;
  primary_color: string;              // Hex, e.g. '#000000'
  tagline: string;
  letter_header_url: string | null;   // Pre-designed letter header
  email_signature_url: string | null;
}
```

### 9.4 The IntegrationsConfig

```typescript
export interface IntegrationsConfig {
  stripe_connect: {
    account_id: string | null;
    enabled: boolean;
    deposit_required: boolean;
    deposit_amount_cents: number;
  };
  
  pharmacy: {
    type: 'nhs' | 'private' | 'clinic_stock' | 'mixed';
    default_partner: string | null;
    partners: PharmacyPartner[];
  };
  
  email_provider: {
    type: 'rolde_default' | 'custom_smtp';
    smtp_config?: SmtpConfig;  // If custom
  };
  
  sms_provider: {
    enabled: boolean;
    sender_id: string;  // Default 'DOCSKIN' or similar
  };
}
```

### 9.5 The Configuration Validation

All writes to `tenants.config` go through a server-side validator:

```typescript
// src/lib/tenant/config-validator.ts
import { TenantConfigSchema } from '@/packages/db/schemas/tenant-config';

export async function updateTenantConfig(
  tenantId: string,
  updates: Partial<TenantConfig>,
  userId: string
): Promise<{ success: boolean; errors?: string[] }> {
  // Verify caller is Caretaker of this tenant
  if (!await isSteward(userId, tenantId)) {
    throw new Error('Forbidden: Caretaker role required');
  }
  
  // Validate the partial update against the schema
  const result = TenantConfigSchema.partial().safeParse(updates);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map(e => e.message) };
  }
  
  // Merge with existing config
  const { data: tenant } = await supabase
    .from('tenants')
    .select('config')
    .eq('id', tenantId)
    .single();
  
  const newConfig = deepMerge(tenant.config, updates);
  
  // Validate full merged config
  const fullResult = TenantConfigSchema.safeParse(newConfig);
  if (!fullResult.success) {
    return { success: false, errors: fullResult.error.errors.map(e => e.message) };
  }
  
  // Write with audit log entry
  await supabase.from('tenants').update({ config: newConfig }).eq('id', tenantId);
  await auditLog({
    tenantId,
    actorUserId: userId,
    action: 'tenant_config.update',
    resourceType: 'tenant',
    resourceId: tenantId,
    beforeState: tenant.config,
    afterState: newConfig
  });
  
  return { success: true };
}
```

---

## 10. The Tenant Lifecycle (Pending → Active → Suspended → Archived)

```
[Onboarding wizard]
        ↓
   pending  ←──── (returns to pending if HIS/ICO not provided)
        ↓
   active   ←──── (re-activated after suspension cleared)
        ↓
   suspended  ←── (billing past-due 14 days; or ToS violation)
        ↓
   archived
```

### 10.1 The State Transitions

| Transition | Trigger | Effect |
|---|---|---|
| (none) → pending | Onboarding completed | Subdomain provisioned; Caretaker can log in but cannot perform clinical work yet |
| pending → active | Compliance complete (ICO + HIS where applicable) AND payment method confirmed | All modules accessible; clinical work permitted |
| active → suspended | Billing past-due 14 days OR critical ToS violation | Login disabled for non-Caretaker roles; Caretaker can update payment method; clinical data retained |
| suspended → active | Billing cured OR violation resolved | Full access restored |
| suspended → archived | 30 days suspended without resolution | Tenant data archived (read-only Custodian access); subdomain freed |
| active → archived | Voluntary cancellation by Caretaker + 30 day grace | Same as above |

### 10.2 The Archive Behaviour

Archived tenant:
- All user logins disabled
- Subdomain unbinds (becomes available for new tenants)
- Data retained for 7 years per healthcare regulations
- Custodian can still access archived data via custodian admin
- Caretaker can request data export (full GDPR export) within 30 days of archive
- After 7 years, scheduled job purges per data retention policy

### 10.3 The Tenant Re-activation

If an archived tenant wants to return:
- Treated as a new onboarding (new wizard, new subdomain)
- Previous data CAN be migrated to new tenant if requested (Custodian-assisted)
- This is a manual process, not self-serve

---

## 11. The Subdomain Provisioning Pipeline

When a new tenant completes onboarding, their subdomain must resolve to RolDe.

### 11.1 The DNS Approach

`rolde.app` has a wildcard DNS record:

```
*.rolde.app → CNAME → cname.vercel-dns.com
```

Vercel handles the wildcard at the edge. Any `<anysubdomain>.rolde.app` resolves to RolDe's Vercel deployment.

### 11.2 The Tenant Resolution

When a request hits `<subdomain>.rolde.app`, Next.js middleware (Bible 4.1 §3.5) resolves the subdomain to a tenant_id:

1. Extract subdomain from Host header
2. Query `SELECT id, status FROM tenants WHERE subdomain = $1`
3. If no match: render "Clinic not found" page
4. If status not 'active' or 'pending': render appropriate state page (suspended notice, etc.)
5. Set `x-tenant-id` header for downstream handlers

### 11.3 The Reserved Subdomains

Reserved subdomains (cannot be claimed by tenants):

```
www, app, api, admin, auth, login, marketing,
status, blog, docs, help, support, mail, email,
patient, custodian, dev, staging, test, beta,
static, cdn, files, storage, ai, webhook
```

Plus Cloudflare/Vercel reserved subdomains.

### 11.4 The Subdomain Change

A Caretaker can change their tenant's subdomain (e.g. rebranding):

- Old subdomain redirects to new for 90 days (HTTP 301)
- After 90 days, old subdomain becomes available for new tenants
- All emails sent during transition include new URL
- Patients with bookmarked patient portal links see redirect-with-notice page

---

## 12. The Custom Domain Pipeline (Phase 2 Note)

Phase 1 ships subdomain-only. Phase 2 adds custom domains (e.g. `app.docforskin.com` instead of `docforskin.rolde.app`).

Phase 2 implementation:
1. Caretaker enters custom domain in tenant settings
2. RolDe issues DNS instructions: "Create a CNAME from `app.docforskin.com` to `cname.rolde.app`"
3. Once DNS is verified, Vercel auto-provisions SSL certificate via Let's Encrypt
4. Middleware detects custom domain and resolves to tenant_id

This Bible documents the placeholder so Bible 4.3 v2.0 (Phase 2) has a known location to expand.

---

## 13. The Multi-Tenant API Patterns

How API routes consistently respect tenancy.

### 13.1 The Server Action Pattern

```typescript
// src/lib/actions/createPatient.ts
'use server';

import { auth } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import { z } from 'zod';

const CreatePatientInputSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // ... more fields
});

export async function createPatient(input: z.infer<typeof CreatePatientInputSchema>) {
  // 1. Authenticate
  const user = await auth.requireUser();
  
  // 2. Get tenant context (from request middleware)
  const { tenantId } = await getTenantContext();
  
  // 3. Verify role permission
  if (!await canRegisterPatients(user.id, tenantId)) {
    throw new Error('Forbidden');
  }
  
  // 4. Validate input
  const data = CreatePatientInputSchema.parse(input);
  
  // 5. Set tenant context for database session
  await supabase.rpc('set_tenant_context', { tenant_id: tenantId });
  
  // 6. Perform action
  const { data: patient, error } = await supabase
    .from('patients')
    .insert({
      tenant_id: tenantId,
      first_name: data.firstName,
      last_name: data.lastName,
      date_of_birth: data.dateOfBirth,
      created_by: user.id
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // 7. Audit log
  await auditLog({
    tenantId,
    actorUserId: user.id,
    action: 'patient.create',
    resourceType: 'patient',
    resourceId: patient.id,
    afterState: patient
  });
  
  // 8. Trigger downstream effects (welcome email, etc.)
  await scheduleWelcomeEmail(tenantId, patient.id);
  
  return patient;
}
```

This pattern is invariant across every server action that touches tenant data.

### 13.2 The API Route Pattern

REST/RPC API routes follow the same shape:

```typescript
// src/app/api/patients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await auth.requireUser();
  const { tenantId } = await getTenantContext();
  
  if (!await canReadPatient(user.id, tenantId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  await supabase.rpc('set_tenant_context', { tenant_id: tenantId });
  
  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', params.id)
    .single();  // RLS ensures tenant isolation
  
  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  
  return NextResponse.json({ patient });
}
```

### 13.3 The Edge Function Pattern

For background jobs (Bible 4.1 §7), Edge Functions run with elevated permissions but still respect tenancy:

```typescript
// supabase/functions/send_welcome_email/index.ts
import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const { tenantId, patientId } = await req.json();
  
  // Use service role client (bypasses RLS for legitimate background work)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // But still scope queries to the specific tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('config, name')
    .eq('id', tenantId)
    .single();
  
  const { data: patient } = await supabase
    .from('patients')
    .select('email, first_name')
    .eq('id', patientId)
    .eq('tenant_id', tenantId)  // Explicit tenant scoping even with service role
    .single();
  
  // Send email per tenant config
  await sendEmail({
    to: patient.email,
    template: 'welcome',
    data: {
      patientName: patient.first_name,
      clinicName: tenant.name,
      preConsultationUrl: `https://patient.${tenant.subdomain}.rolde.app/onboarding/...`
    }
  });
  
  return new Response(JSON.stringify({ success: true }));
});
```

---

## 14. The Tenant-Switching Flow (Multi-Tenant Users)

A user can be a member of multiple tenants (e.g. a locum working at three clinics simultaneously). Each membership is a separate `tenant_users` row (Bible 4.1 §4.2).

### 14.1 The Tenant Picker

When a user accesses RolDe via the generic login at `rolde.app/login`:

```
+---------------------------------------------------+
|                                                   |
|   Welcome back, Dr Sarah                          |
|                                                   |
|   You have access to 3 clinics. Select one:       |
|                                                   |
|   +-----------------------------------+           |
|   |   [logo]  Doc For Skin            |           |
|   |   docforskin.rolde.app            |           |
|   |   Clinician                    |           |
|   |   Last visit: 2 hours ago         |           |
|   +-----------------------------------+           |
|                                                   |
|   +-----------------------------------+           |
|   |   [logo]  Edinburgh GP Clinic     |           |
|   |   edingp.rolde.app                |           |
|   |   Locum                           |           |
|   |   Last visit: yesterday           |           |
|   +-----------------------------------+           |
|                                                   |
|   +-----------------------------------+           |
|   |   [logo]  Newington Aesthetic     |           |
|   |   newington.rolde.app             |           |
|   |   Clinician                    |           |
|   |   Last visit: 3 days ago          |           |
|   +-----------------------------------+           |
|                                                   |
+---------------------------------------------------+
```

Click a clinic → redirected to that subdomain. Session continues with that tenant's context.

### 14.2 The Switch-Tenant Action

While inside a tenant, user can switch to another via the user menu (top-right):

```
[user avatar] ▼

  Profile
  ─────────────────
  Switch clinic →
    → Doc For Skin (current)
    → Edinburgh GP Clinic
    → Newington Aesthetic
  ─────────────────
  Help
  Log out
```

Click "Edinburgh GP Clinic" → redirected to `edingp.rolde.app/dashboard` with new tenant context.

### 14.3 The Session and Audit

Each tenant context is a separate authenticated session at the database level (`current_setting('app.current_tenant_id')`). Audit log entries include both the user_id and the tenant_id, so cross-clinic activity is fully traceable.

---

## 15. The Audit and Compliance Layer

Per Bible 4.1 §5.4 and §13, audit logging is comprehensive.

### 15.1 The Auditable Events

Every clinically- or commercially-significant event is audit-logged:

| Event Category | Examples |
|---|---|
| Authentication | login, logout, failed login, password change, 2FA enable/disable |
| User management | invite, accept invite, role change, suspend, remove |
| Clinical data | patient create/update, note create/update/delete, prescription issue/cancel, lab order, radiology order |
| Documents | letter draft, letter approve, letter send, photo upload, photo delete |
| Configuration | tenant config update (with before/after diff) |
| Billing | plan change, payment method change, invoice paid, payment failed |
| Cross-tenant | every Custodian query, with reason logged |
| AI | AI suggestion accepted, thumbs-up, thumbs-down (correction submission) |

### 15.2 The Audit Log Retention

- All audit log entries retained for 7 years (UK healthcare data retention standard)
- Append-only (no UPDATE or DELETE allowed via RLS)
- Indexed by tenant_id, actor_user_id, action, resource_id, date
- Searchable via Caretaker admin (own tenant) and Custodian admin (cross-tenant)

### 15.3 The Compliance Reporting

Caretaker can generate compliance reports from audit log:

- "Show all access to patient X's record in the last 90 days" (subject access request)
- "Show all data exports in the last year" (GDPR audit)
- "Show all prescription activity by Dr Smith in May" (clinical governance)

Reports exportable as CSV.

### 15.4 The Patient Data Subject Access

Patients can request their full record via patient portal:

- Generates a comprehensive data export (PDF + JSON archive)
- Includes all clinical data the patient is authorised to see (per Caretaker visibility settings)
- Includes audit log of who accessed their record
- Sent to patient via secure download link (signed URL, 7-day expiry)
- Audit-logged

---

## 16. The Pricing Tiers and Module Gating

The commercial structure of RolDe.

### 16.1 The Pricing Tier Definitions

```sql
CREATE TABLE pricing_tiers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT UNIQUE NOT NULL,
  display_name        TEXT NOT NULL,
  description         TEXT NOT NULL,
  
  monthly_price_gbp   DECIMAL(10, 2) NOT NULL,
  annual_price_gbp    DECIMAL(10, 2) NOT NULL,  -- Usually 10 × monthly (10 months for price of 12)
  
  user_limit          INTEGER,  -- NULL means unlimited
  
  modules_included    TEXT[] NOT NULL,  -- Module slugs included by default
  modules_available   TEXT[] NOT NULL,  -- Module slugs that can be enabled
  
  stripe_product_id   TEXT NOT NULL,
  stripe_monthly_price_id TEXT NOT NULL,
  stripe_annual_price_id  TEXT NOT NULL,
  
  status              TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'archived' (legacy plans)
  display_order       INTEGER NOT NULL DEFAULT 0,
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 16.2 The Initial Tier Set

| Tier | Monthly | Annual | Users | Modules Included | Modules Available |
|---|---|---|---|---|---|
| Starter | £49 | £490 | 3 | Universal + Prescribing + Lab orders | Aesthetic photography (specialty), DVLA assessments (specialty) |
| Professional | £149 | £1,490 | 15 | Starter + Radiology + all specialty modules | All specialty modules + payment-gating modules (specialty) |
| Premium | £349 | £3,490 | Unlimited | All modules + Claude API fallback | All available modules |

### 16.3 The Module Definitions

```sql
CREATE TABLE module_definitions (
  slug                TEXT PRIMARY KEY,
  display_name        TEXT NOT NULL,
  description         TEXT NOT NULL,
  category            TEXT NOT NULL,  -- 'universal' | 'core_clinical' | 'specialty' | 'premium'
  
  required_tier       TEXT REFERENCES pricing_tiers(slug),  -- Minimum tier; NULL means available in all tiers
  add_on_price_gbp    DECIMAL(10, 2),  -- For modules that can be purchased à la carte
  
  bible_reference     TEXT,  -- Where the module is specified, e.g. 'Bible 4.5'
  
  status              TEXT NOT NULL DEFAULT 'active'
);
```

### 16.4 The Custodian Tier Management

Roland (Custodian) can update pricing tiers via `rolde.app/custodian/system-config/tiers`:

- Create new tiers (e.g. "Hospital Plan" for future enterprise)
- Adjust prices (with grandfathering of existing tenants)
- Archive old tiers (existing tenants on archived tier continue, no new sign-ups)
- Add new modules to existing tiers

All changes audit-logged.

### 16.5 The Grandfathering Promise

When pricing increases, existing tenants stay on their original price for at least 12 months. Notification before any price change.

This commitment is constitutional — Bible 4.0 §6.3 ("RolDe does NOT promise to extract more value over time").

---

## 17. Acceptance Criteria for "Multi-Tenant Foundation Is Built"

The multi-tenant foundation is "built" when:

### 17.1 The Onboarding Acceptance

- [ ] All 10 wizard steps render and validate correctly
- [ ] Email verification works end-to-end
- [ ] Stripe payment method collection succeeds
- [ ] Subdomain availability check responds in < 200ms
- [ ] Tenant activation completes end-to-end with status update, DNS resolution, Caretaker login
- [ ] Abandoned wizard recovery emails send at 1, 3, 7 days

### 17.2 The Caretaker Admin Acceptance

- [ ] All admin pages render with appropriate role checks
- [ ] User invitation flow works (invite → email → accept → join tenant)
- [ ] Module enable/disable works, respects tier limits
- [ ] Branding changes propagate to tenant subdomain immediately
- [ ] Letter routing configuration saves and is used by referral flow
- [ ] Local protocol upload works, file lands in tenant_private bucket
- [ ] Patient portal visibility settings save and enforce correctly
- [ ] Billing page shows accurate Stripe data
- [ ] Audit log displays and is searchable

### 17.3 The Custodian Admin Acceptance

- [ ] Custodian-only auth with mandatory MFA
- [ ] Cross-tenant queries audit-logged with reason
- [ ] Tenant detail page renders any tenant
- [ ] Tenant suspension and re-activation work
- [ ] Usage dashboard pulls real metrics
- [ ] Pricing tier management functional
- [ ] Custodian access notifications sent to affected Caretakers

### 17.4 The Permissions Acceptance

- [ ] All 8 roles enforce correct access matrix (§7.1)
- [ ] RLS policies tested for cross-tenant isolation
- [ ] Application-level permission checks tested
- [ ] Permission test suite passes (§7.3)
- [ ] No way to bypass tenant isolation found in security review

### 17.5 The Stripe Integration Acceptance

- [ ] Customer creation, subscription creation, payment method attachment all functional
- [ ] All webhook events handled (§4.2)
- [ ] Failed payment grace period works correctly (14 day suspension)
- [ ] Plan upgrade/downgrade with proration tested
- [ ] Invoice display in Caretaker admin functional
- [ ] Stripe Connect for tenant-to-patient billing tested

### 17.6 The Configuration Acceptance

- [ ] Tenant config schema fully defined and Zod-validated
- [ ] Config updates audit-logged with before/after diff
- [ ] Each config field has UI in Caretaker admin
- [ ] Config defaults sensible for new tenants

### 17.7 The Operational Acceptance

- [ ] Doc For Drivers tenant onboarded via wizard
- [ ] Doc For Skin tenant onboarded via wizard
- [ ] At least one external test clinic onboarded
- [ ] At least one paid subscription cycle (trial → paid → invoice generated)
- [ ] At least one absence request submitted, approved, reflected in availability
- [ ] At least one tenant configuration change made by Caretaker, propagated to product

When all 17.1-17.7 acceptance criteria pass, RolDe Phase 1 multi-tenant foundation is complete.

---

## End of Bible 4.3

This is the foundation everything else sits on. Onboarding, billing, role management, configuration — all the machinery that makes RolDe function as a multi-tenant SaaS, while honouring the constitutional commitments to tenant data isolation, Caretaker authority, and Custodian transparency.

When in doubt about a multi-tenancy decision: does it preserve isolation? Does it audit-log appropriately? Does it respect the Custodian/Caretaker authority hierarchy? Does it operationalise Bible 4.0's principles without violating them?

The next sub-Bible to draft is **4.4 — RolDe Core Modules** (the calendar, patient management, clinical notes, audit log, closed-loop referrals, OCR pipeline — the universal modules every clinic uses).

— Roland Manoj Jayasekhar, with Devipangaj
RoDee, May 2026
