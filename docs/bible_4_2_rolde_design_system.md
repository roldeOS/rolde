# RolDe — Bible 4.2: Design System

> *"The best design is one you do not notice." — Steve Jobs (Bible 0 §8.7)*
>
> Version 1.0 | Last Updated: 10 May 2026 | RolDe Ltd | CONFIDENTIAL
>
> The visual and interaction language of RolDe. Inherits from Bible 0 v1.2 (group defaults), Bible 4.0 (RolDe constitution), and Bible 4.1 (architecture).

---

## How to Use This Document

This is the **visual and interaction design system** for RolDe-powered clinical products. It defines:

- The consultation screen layout (the canonical screen of clinical work)
- The AI panel design (how RolDe's intelligence appears)
- The patient feed design (the single canonical view of the patient)
- The calm dashboard design
- Design tokens specific to RolDe (extending Bible 0's group defaults)
- Component patterns for clinical work
- Per-specialty visual variants
- Responsive behaviour
- Accessibility commitments
- Motion and transition principles

**Loading order for Claude Code sessions**:
1. Bible 0 v1.2 — group defaults (typography, monochrome philosophy, shadcn/ui)
2. Bible 4.0 — RolDe constitution (calm aesthetic principle)
3. Bible 4.1 — architecture (technical foundation)
4. This Bible 4.2 — visual/interaction design
5. Specific Bible 4.4/4.5/4.6 — module being built

This Bible inherits Bible 0's group design defaults (Inter for body, IBM Plex Serif for headings, monochrome with semantic colour for clinical signal, shadcn/ui on Tailwind v4) and extends them with RolDe-specific patterns. **Where this Bible adds detail to Bible 0, this Bible takes precedence within the RolDe product family. Where this Bible silently differs from Bible 0, that is a bug in this Bible — flag it.**

**Critical convention** (Bible 0 §8.6): All visual assets — logos, icons, illustrations, custom imagery — are designed by Roland personally. Where a visual asset is needed, this Bible says **"DESIGN NEEDED: [type] at [dimensions] for [purpose]"** and pauses for Roland's input. Never generated, never described as if it should exist.

---

## Table of Contents

1. Design Constitution (RolDe-Specific)
2. Design Token System
3. The Consultation Screen Layout (The Canonical Screen)
4. The Patient Feed (Everything In The Feed)
5. The AI Panel
6. The Dashboard (Calm By Construction)
7. The Booking Flow (LatePoint-Inspired)
8. The Patient Portal Visual Language
9. Component Patterns
10. Iconography
11. Motion and Transition
12. Responsive Behaviour
13. Accessibility Commitments
14. Per-Specialty Visual Variants
15. The Watermarking System (Aesthetic Photography)
16. Visual Asset Inventory (DESIGN NEEDED)
17. Component-to-Bible Mapping
18. Acceptance Criteria for "Design System Is Built"

---

## 1. Design Constitution (RolDe-Specific)

These principles extend Bible 0's group design defaults and Bible 4.0's calm aesthetic constitutional principle. They apply specifically to RolDe-powered clinical products.

### 1.1 Calm Is Not Minimalism

Calm and minimalist are not the same thing. Minimalism strips information; calm organises information so it doesn't feel like an assault.

A clinical screen will always have substantial information density — patient demographics, vitals, medication list, AI suggestions, referral status, note text input, action buttons. RolDe does not hide information; it arranges information so the eye lands where it should land first, second, third — without any element shouting.

**Calm is achieved through:**
- Generous negative space around groups of related content
- Restrained colour palette (monochrome with semantic colour only for clinical signal)
- Consistent vertical rhythm (8px baseline grid)
- No animation without purpose
- No sounds without explicit user action
- No badges, counters, or alerts that compete for attention
- Typography hierarchy doing the work of visual emphasis (not weight or colour shouting)

### 1.2 Information Density Is Not The Enemy

A clinician at the end of a 12-hour shift wants information arranged efficiently. They do NOT want a "delightful" interface that hides clinical data behind extra clicks. The screen should show what the clinician needs to see, presented calmly.

This is in tension with consumer SaaS design conventions that favour low information density. RolDe diverges from those conventions deliberately. The consultation screen will look denser than a typical SaaS dashboard. That density is correct.

### 1.3 The Clinician's Eye Path Is Designed

The clinician's eye should travel through the consultation screen in a predictable order:
1. **Top strip** — vital patient context (allergies, NEWS2, key flags) absorbed in <1 second
2. **Top-left feed** — the most recent clinical entries (newest at bottom per iMessage direction)
3. **Bottom-left input** — where the clinician types their current note
4. **Top-right** — investigations and orders (labs, radiology, prescribing) when needed
5. **Bottom-right** — AI panel surfacing suggestions (subtle presence, not demanding attention)

This eye path is the implicit information hierarchy. Every layout decision serves it.

### 1.4 The Patient Is Always Visible

The patient — their name, their critical flags, their vital state — never leaves the screen during clinical work. The clinician should never have to navigate "back" to remember which patient they're working on. The top strip is permanent during a consultation.

### 1.5 Defaults Reflect The Common Case

Default sort orders, default panel positions, default selections — all calibrated to what a clinician needs most often. Customisation is possible (Caretaker configures clinic defaults; user adjusts personal defaults), but the out-of-box experience matches the common case so well that 80% of users never need to adjust anything.

### 1.6 The Aesthetic Coherence

Every RolDe-powered product (RolDe core, Doc For Drivers, Doc For Skin, future tenants) shares the same visual DNA. Tenant branding (logo, primary colour for accents, tagline) is configurable, but the underlying design system is consistent. A clinician moving between tenants on RolDe should feel they're using the same operating system, just at a different clinic.

---

## 2. Design Token System

Tokens are the atomic units of the design system. Every component pulls from these.

### 2.1 The Typography Tokens

Inheriting Bible 0 §8.1: **IBM Plex Serif for headings and brand wordmarks. Inter for body text.**

```css
/* Typography Tokens */
--font-serif: 'IBM Plex Serif', Georgia, serif;
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'IBM Plex Mono', Menlo, Monaco, monospace;

/* Scale (modular scale 1.250 — major third) */
--text-xs: 0.75rem;     /* 12px — metadata, captions */
--text-sm: 0.875rem;    /* 14px — secondary text */
--text-base: 1rem;      /* 16px — body */
--text-lg: 1.125rem;    /* 18px — emphasised body */
--text-xl: 1.25rem;     /* 20px — small headings */
--text-2xl: 1.5rem;     /* 24px — section headings */
--text-3xl: 1.875rem;   /* 30px — page headings */
--text-4xl: 2.25rem;    /* 36px — large display */

/* Weights — restraint is constitutional */
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;       /* Used sparingly */

/* Line heights — generous for readability */
--leading-tight: 1.2;     /* Headings */
--leading-normal: 1.5;    /* Body */
--leading-relaxed: 1.75;  /* Long-form */

/* Letter spacing */
--tracking-tight: -0.02em;
--tracking-normal: 0;
--tracking-wide: 0.05em;  /* Used in small caps and labels */
```

### 2.2 The Colour Tokens

Inheriting Bible 0 §8.2: **Apple-esque monochrome with semantic colour only for clinical signal.**

```css
/* Neutral / Monochrome */
--neutral-0: #FFFFFF;
--neutral-50: #FAFAFA;
--neutral-100: #F4F4F5;
--neutral-200: #E4E4E7;
--neutral-300: #D4D4D8;
--neutral-400: #A1A1AA;
--neutral-500: #71717A;
--neutral-600: #52525B;
--neutral-700: #3F3F46;
--neutral-800: #27272A;
--neutral-900: #18181B;
--neutral-950: #09090B;

/* Semantic — clinical signal only */
--signal-critical: #DC2626;     /* Red — allergies, critical flags, sepsis criteria */
--signal-critical-bg: #FEE2E2;  /* Red tinged background for critical cards (Bible 4.0 §9.5) */
--signal-warning: #D97706;      /* Amber — action needed, moderate concern */
--signal-warning-bg: #FEF3C7;
--signal-success: #059669;      /* Green — full consent, completed, normal range */
--signal-success-bg: #D1FAE5;
--signal-info: #0284C7;         /* Blue — informational, RolDe AI confidence indicator */
--signal-info-bg: #E0F2FE;

/* RolDe brand accent — used SPARINGLY */
--rolde-accent: #18181B;        /* Near-black, IBM Plex Serif logo colour */
--rolde-glass: rgba(24, 24, 27, 0.85);  /* For iOS 26 glassy black treatments */

/* Surfaces */
--surface-primary: var(--neutral-0);     /* Cards, main content */
--surface-secondary: var(--neutral-50);  /* Page background, subtle elevation */
--surface-tertiary: var(--neutral-100);  /* Hover states, deeper recesses */
--surface-overlay: rgba(9, 9, 11, 0.5);  /* Modal backdrops */

/* Text */
--text-primary: var(--neutral-900);      /* Default body */
--text-secondary: var(--neutral-600);    /* Secondary, metadata */
--text-tertiary: var(--neutral-400);     /* Disabled, watermarks */
--text-on-dark: var(--neutral-0);
--text-link: var(--neutral-900);         /* Links are underlined, not coloured */

/* Borders */
--border-subtle: var(--neutral-200);
--border-default: var(--neutral-300);
--border-strong: var(--neutral-400);
--border-focus: var(--neutral-900);      /* Focus ring is dark, not blue */
```

**Critical commitment**: semantic colour appears ONLY for clinical signal. The brand accent is monochrome. Buttons, links, and chrome do NOT use colour. When everything looks important, nothing is.

### 2.3 The Spacing Tokens

8px baseline grid. Every spacing decision pulls from this scale.

```css
--space-0: 0;
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px — base unit */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
```

### 2.4 The Border Radius Tokens

Bible 0 §8.4 commits to "rounded edges, generous whitespace" for booking flows. RolDe inherits this.

```css
--radius-sm: 0.25rem;    /* 4px — small inline elements */
--radius-md: 0.5rem;     /* 8px — default for buttons, inputs */
--radius-lg: 0.75rem;    /* 12px — cards */
--radius-xl: 1rem;       /* 16px — modals, panels */
--radius-2xl: 1.5rem;    /* 24px — booking flow steps, large containers */
--radius-full: 9999px;   /* Pills, avatars */
```

### 2.5 The Elevation (Shadow) Tokens

Cards have subtle shadows. Critical cards have red-tinged borders (per Bible 0 §8.11 / Bible 4.0 §9.5 — the agentic boundary visualisation).

```css
--shadow-none: none;
--shadow-sm: 0 1px 2px rgba(9, 9, 11, 0.04);              /* Subtle card shadow */
--shadow-md: 0 2px 8px rgba(9, 9, 11, 0.06);              /* Default card */
--shadow-lg: 0 8px 24px rgba(9, 9, 11, 0.08);             /* Floating elements, modals */
--shadow-xl: 0 16px 48px rgba(9, 9, 11, 0.12);            /* Top-most modals */

--shadow-critical: 0 0 0 1px var(--signal-critical),
                   0 2px 8px rgba(220, 38, 38, 0.15);     /* Red-tinged border for critical AI cards */
```

### 2.6 The Z-Index Tokens

```css
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-fixed: 300;
--z-overlay: 400;
--z-modal: 500;
--z-popover: 600;
--z-toast: 700;
--z-tooltip: 800;
```

### 2.7 The Tenant Branding Tokens

Per-tenant branding overrides specific tokens (configured via Caretaker settings, stored in tenant config JSONB per Bible 4.1 §5.5):

```css
/* Tenant overrides (loaded at runtime per tenant) */
--tenant-logo-url: var(--config-logo-url);
--tenant-accent: var(--config-primary-color, var(--rolde-accent));
--tenant-name: var(--config-name);
--tenant-tagline: var(--config-tagline);
```

The tenant's primary colour is used ONLY for:
- The tenant's logo region
- Booking widget chrome on external sites
- Email template headers
- Print headers on letters

It is NEVER used for:
- Buttons, links, or chrome inside the RolDe operating system
- Clinical signal (which always uses monochrome + semantic colour)
- Action emphasis

This preserves the aesthetic coherence (§1.6) while honouring tenant brand identity in appropriate contexts.

---

## 3. The Consultation Screen Layout (The Canonical Screen)

This is the screen where clinical work happens. Roland specified it precisely in Cluster B. This is the canonical layout for every RolDe-powered consultation.

### 3.1 The Layout Specification

```
+-------------------------------------------------------------------+
|  PATIENT VITALS / SALIENT DATA STRIP                              |  64px height
|  Always visible during consultation                                |  (top strip)
+----+--------------------------------+-----------------------------+
|    |                                |                             |
|    |                                |                             |
| N  |                                |                             |
| A  |   PATIENT NOTES FEED           |   INVESTIGATIONS + ORDERS   |  ~70% of remaining
| V  |   (iMessage direction:         |   (tabs: Labs, Radiology,   |  vertical space
|    |    oldest top, newest          |    Prescribing, Procedures, |
|    |    bottom, auto-scroll         |    Letters)                 |
|    |    to most recent)             |                             |
| 5  |                                |                             |
| 6  |                                |                             |
| p  |                                |                             |
| x  |                                |                             |
|    +--------------------------------+-----------------------------+
| L  |                                |                             |
| e  |                                |                             |
| f  |   TEXT INPUT FIELD             |   AMBIENT AI PANEL          |  ~30% of remaining
| t  |   (current note being typed,   |   (RolDe says... cards,     |  vertical space
|    |    saves to feed on commit)    |    direct query, citations) |
|    |                                |                             |
+----+--------------------------------+-----------------------------+
|  OPTIONAL BOTTOM ALERT STRIP                                      |  48px height
|  (continuous monitoring alerts, surfaced contextually)            |  (only when alerts)
+-------------------------------------------------------------------+

Width breakdown:
  Left navigation rail: 56px (icons only) / 240px (expanded with labels)
  Patient column (notes + input): ~50% of remaining width
  Right column (orders + AI): ~50% of remaining width
```

### 3.2 The Top Strip (Patient Vitals / Salient Data)

**Height**: 64px fixed, never scrolls away during consultation.

**Content (left to right):**
- Patient avatar (initials or uploaded photo, 40px circle)
- Patient name + date of birth + sex (compact, single line)
- **Critical flags** (allergies, alerts) — red text with red dot indicator, never hidden
- **NEWS2 score** if recently recorded (with colour-coded severity dot)
- Active medications count (clickable for full list dropdown)
- Last consultation date
- Patient ID (small, secondary)

**Style**: White background, 1px bottom border, no shadow. Calm, dense, informational.

**DESIGN NEEDED**: Patient avatar default state when no photo uploaded. Roland to specify whether initials in IBM Plex Serif or another treatment.

### 3.3 The Left Navigation Rail

**Width**: 56px collapsed (icons only) by default. Expands to 240px on hover or click.

**Items (top to bottom):**
- Dashboard (home icon)
- Today's Patients (calendar icon)
- All Patients (people icon)
- Letters (document icon)
- Investigations (microscope icon)
- Reports (chart icon)
- Settings (cog icon — leads to Caretaker admin if user has Caretaker role)
- Profile (user icon, bottom-aligned)

**DESIGN NEEDED**: Each navigation icon at 24×24px. Roland designs icons matching Bible 0's "Apple-esque monochrome" aesthetic. Outlined style preferred over filled.

**Behaviour**: Active route gets subtle dark background (`--neutral-100`). Hover gets even subtler (`--neutral-50`). No coloured indicators, no shouting.

### 3.4 The Patient Notes Feed (Top-Left Pane)

**Height**: ~70% of vertical space below top strip.
**Width**: ~50% of remaining horizontal width (after navigation).

**Behaviour:**
- iMessage feed direction (Bible 0 §8.8): oldest top, newest bottom
- Auto-scrolls to most recent on patient open
- Lazy loading: loads most recent 20 entries, fetches older as user scrolls up
- Each entry has its own card (subtle shadow, white background, generous padding)
- Entries are timestamped and user-stamped
- Multiple entry types (notes, prescriptions, lab results, photos, consents, AI promotions, scanned documents) coexist in one chronological feed

See Section 4 for complete feed specification.

### 3.5 The Text Input Field (Bottom-Left Pane)

**Height**: ~30% of vertical space below top strip.
**Width**: matches the patient notes feed above it.

**Behaviour:**
- The clinician types their current note here
- Text grows multi-line up to ~6 lines, then scrolls internally
- "Save" button (or Cmd/Ctrl+Enter) commits the note to the feed
- Saved entries animate in at the bottom of the feed (subtle slide-up + fade-in, ~300ms)
- Markdown-light formatting supported: bullets via `-`, bold via `**`, headings via `#` (rendered, not raw)
- Auto-save draft every 5 seconds (so unsaved typing isn't lost on accidental navigation)

**Stylistic choices:**
- Border: 1px `--border-default`
- Focus state: `--border-focus` (dark border, no glow, no shadow)
- Background: `--surface-primary`
- Placeholder: "Note for [Patient Name]..." in `--text-tertiary`

### 3.6 The Investigations + Orders Pane (Top-Right)

**Height**: ~70% of vertical space below top strip.
**Width**: ~50% of remaining horizontal width.

**Tabs (horizontal, at top of pane):**
- Labs
- Radiology
- Prescribing
- Procedures (where specialty enables)
- Letters (referral, sick note, etc.)

Tab selection persists per-user across consultations (RolDe remembers the last tab a doctor used).

**Tab content patterns:**

Each tab follows the same pattern:
- Search box at top (find drug, find lab test, find letter type)
- Filtered list of recently used items (per-clinician preference)
- "Add to plan" button per item
- Items added appear as cards in the pane below
- Cards show status (draft, approved, sent, dispensed)
- Save commits all draft items as feed entries on the left

See **Bible 4.5** for full prescribing flow detail. See **Bible 4.4** for full letters and orders detail.

### 3.7 The AI Panel (Bottom-Right Pane)

**Height**: ~30% of vertical space below top strip.
**Width**: matches Investigations pane above it.

This is where RolDe surfaces ambient AI suggestions, draft artefacts, alerts, and direct query responses.

See Section 5 for complete AI panel specification.

### 3.8 The Optional Bottom Alert Strip

**Height**: 48px when present; collapsed to 0 when no active alerts.
**Width**: full screen width below all panes.

Used for **continuous patient monitoring** alerts (Bible 4.0 §9.6, Bible 0 §12.7) that aren't tied to the current consultation but are relevant to the clinician's day.

Examples:
- "3 patients have lab results awaiting your review."
- "Tomorrow's surgical patient (Smith J.) has unsigned consent — reminder sent."
- "Your warfarin patient list has 2 INRs due this week."

Each alert is a horizontal pill, monochrome by default, red-tinged for critical. Click to navigate to the relevant patient/action. Dismiss with X.

**Constitutional commitment**: This strip never produces ambient anxiety. Alerts are factual, brief, dismissible. No urgency-creating language ("OVERDUE!"), no exclamation marks, no flashing.

### 3.9 The Layout Variations

| Screen Width | Behaviour |
|---|---|
| ≥1440px (default desktop) | Full layout as specified |
| 1024-1439px | Layout intact; right column slightly narrower (45/55 split favouring left) |
| 768-1023px (tablet) | Right column collapses to a tabbed drawer; AI panel becomes a floating action button that opens a drawer |
| <768px (phone) | Full responsive collapse — single column, navigation in burger menu, AI panel as pull-up drawer |

The desktop layout is the primary design target. Tablet and phone are degraded but functional. Bible 4.0's protagonist (the practising clinician at their desk) uses desktop primarily.

### 3.10 What The Layout Does NOT Have

Explicit refusals for the consultation screen:

- **No counters.** No "23 unread messages," no "5 overdue tasks," no badges on icons.
- **No notifications popup.** Alerts go to the bottom strip, not floating modals.
- **No tour guides on first use.** A short page describing the layout once, but no persistent UI elements teaching the interface.
- **No "What's new?" panels.** Updates announced in a separate Update Notes area accessed from settings.
- **No marketing content within the work area.** Upsells live in the Caretaker admin, not in the consultation flow.
- **No "engagement" mechanics.** No streaks, no completion percentages, no gamification of clinical work.

---

## 4. The Patient Feed (Everything In The Feed)

The patient feed is the single canonical view of a patient's record (Bible 0 §8.9, Bible 4.0 Principle 7).

### 4.1 The Entry Types

Every entry type lives in the same feed, in chronological order:

| Entry Type | Visual Treatment | Source |
|---|---|---|
| Clinical note | Plain card with timestamped text | Clinician typed in bottom-left input |
| Vital signs | Card with structured key-value layout | Concierge or nurse recorded |
| Prescription | Card with drug name, dose, status indicator | Created via Prescribing tab |
| Lab order | Card with test names, status (pending/received) | Created via Labs tab |
| Lab result | Card with synthesised interpretation + raw values on expand | Auto-generated when results arrive |
| Radiology order | Card with imaging type, status | Created via Radiology tab |
| Radiology result | Card with summary + report link | Auto-generated when report arrives |
| Photo (aesthetic 5-photo set) | Card with thumbnail strip; click for carousel | Uploaded via Doc For Skin's photo modal |
| Consent form (signed) | Card with consent name, signature timestamp | Auto-pushed from patient portal onboarding |
| Referral letter | Card with status (draft, approved, emailed, received) | Created via Letters tab or AI-drafted |
| Discharge summary | Card with content + send status | Created via Letters tab or AI-drafted |
| Scanned document (OCR'd) | Card with extracted text + thumbnail | Uploaded by clinician or staff |
| AI suggestion (promoted) | Card prefixed *"RolDe says..."* | Promoted from AI panel via "Push to notes" |

### 4.2 The Card Anatomy

Every feed card has the same anatomical structure:

```
+-----------------------------------------------------------+
|  [icon] Entry Type                              timestamp |  <-- header
|         user_stamp                                         |
+-----------------------------------------------------------+
|                                                           |
|                                                           |
|  Entry content — varies by type                           |  <-- body
|  Plain text or structured layout per entry type           |
|                                                           |
|                                                           |
+-----------------------------------------------------------+
|  [optional action buttons]              [status indicator]|  <-- footer (optional)
+-----------------------------------------------------------+
```

**Header**:
- Icon at left (16×16, monochrome, indicates entry type)
- Entry type label in `--text-secondary`, `--text-sm`, weight medium
- Timestamp at right in `--text-tertiary`, `--text-xs` ("2 min ago", "Yesterday at 14:32", "3 May 2026 at 09:15" depending on age)
- User stamp on second line (clinician name + role badge)

**Body**:
- Padding: `--space-4` (16px)
- Background: `--surface-primary`
- Content layout per entry type (see §4.3)

**Footer** (optional, only if entry has actions or status):
- Status indicator using semantic colour (e.g. prescription "Dispensed" green dot)
- Action buttons (e.g. "Print", "Re-send", "Edit") — text-only, monochrome

### 4.3 The Entry Layouts (Per Type)

**Clinical note**:
- Plain prose, supports markdown-light formatting
- No special structure
- Most common entry type

**Vital signs**:
- Two-column key-value layout
- Values colour-coded only if outside normal range (using `--signal-warning` or `--signal-critical`)
- NEWS2 calculated automatically and displayed

**Prescription**:
- Drug name (semibold, `--text-base`)
- Dose, frequency, duration (regular, `--text-sm`)
- Indication (small caps, `--text-xs`, `--text-tertiary`)
- Status badge in footer: "Draft", "Approved", "Sent to Pharmacy", "Dispensed"

**Lab order**:
- Test names listed
- "Results pending" status when ordered
- Status updates to "Results received" when results arrive — and the result card appears as a separate feed entry

**Lab result**:
- AI-synthesised interpretation at top (`--text-base`, regular)
- Examples: *"Acute infection picture (WCC 18.4, neutrophilia, CRP 247). Renal impairment (eGFR 48 — moderate)."*
- "View full results" expand link reveals all values in a table
- Abnormal values in `--signal-warning` or `--signal-critical`

**Photo (aesthetic 5-photo set)**:
- Header: "Aesthetic photography — Before/After session"
- Thumbnail strip showing all 5 angles (frontal, L oblique, L lateral, R oblique, R lateral)
- Click any thumbnail opens carousel viewer (full-screen, can swipe between angles, can compare to previous session)
- Annotations visible as overlays
- Watermark visible per Caretaker configuration
- DESIGN NEEDED: Photo card thumbnail strip layout — Roland to specify exact dimensions and arrangement.

**Consent form (signed)**:
- Header: "Consent — [procedure name]"
- "Signed by [patient name] on [date] at [time]"
- "View signed PDF" link
- Body: brief summary of what was consented to (procedure, key risks acknowledged)
- Status: ✓ Signed (`--signal-success`)

**Referral letter**:
- Header: "Referral — [specialty]"
- Recipient: "To [receiving service]"
- Status badge: "Draft", "Approved", "Sent", "Acknowledged" (when receiving RolDe instance acknowledges)
- Body: brief summary or first paragraph
- "View full letter" link
- "Resend" / "Edit" actions if appropriate

**AI suggestion (promoted)**:
- Header: *"RolDe says..."* in IBM Plex Serif italic, `--text-base`, `--text-secondary`
- Body: the AI's content as the clinician promoted it (may have been edited by clinician before promotion)
- Citation list at bottom (NICE NG109, eMC SmPC for [drug], etc.)
- No "AI" descriptor anywhere in the card (Bible 0 §9.7 / Bible 4.0 §8.3)

### 4.4 The Feed Search and Filter

A search bar at the top of the feed:

- Free-text search across all feed entries (PostgreSQL tsvector — Bible 4.1 §2.1)
- Filter chips below: All / Notes / Prescriptions / Results / Photos / Letters / AI
- Date range picker (collapsed by default; expands when needed)
- "Show deleted" toggle (Custodian and Caretaker only — soft-deleted entries appear greyed)

### 4.5 The Feed Performance

Per Bible 4.1 §16.2:
- Initial load: most recent 20 entries
- Each scroll-up batch: 20 more entries
- Virtualised rendering (react-window or similar)
- Images lazy-loaded as they enter viewport
- Total memory footprint < 100MB even with 5+ years of history

### 4.6 The Feed Empty State

When a patient has no feed entries (newly registered, never seen):

```
                   [Patient avatar - large, monochrome]
                   
                          [Patient Name]
                       Registered [date]
                   
                  No clinical entries yet.
              The next note you save will appear here.
              
              [Patient registration details summary]
```

Calm. Informative. Not "delightful." The clinician understands the state without needing decoration.

---

## 5. The AI Panel

The AI panel occupies the bottom-right ~30% of the consultation screen. It is where RolDe surfaces ambient suggestions and accepts direct queries (Bible 4.0 §9.4).

### 5.1 The Panel Anatomy

```
+-----------------------------------------+
|  RolDe                            [...] |  <-- panel header (small)
+-----------------------------------------+
|                                         |
|  [AI suggestion card 1]                 |
|                                         |
|  [AI suggestion card 2]                 |
|                                         |
|  [AI suggestion card 3]                 |
|                                         |
|                                         |
|                                         |
+-----------------------------------------+
|  Ask RolDe anything...                  |  <-- direct query input (bottom)
+-----------------------------------------+
```

**Header**:
- "RolDe" wordmark in IBM Plex Serif, `--text-sm`, `--text-secondary`
- Right side: subtle status indicator
  - Quiet pulsing dot when RolDe is thinking
  - Solid dot when settled
  - "Offline" small text if AI server unreachable (Bible 4.1 §6.4 graceful degradation)
- Right side: overflow menu (3-dot) — "Pause suggestions for this consultation", "Open in larger view", "Help"

**Body**:
- Stack of AI suggestion cards (newest at top within the panel — opposite to feed because user is monitoring the AI's current thinking, not history)
- Cards animate in with subtle fade + slight upward slide (~250ms)
- Cards fade out when dismissed
- Maximum 5 cards visible; scrollable if more

**Footer (direct query input)**:
- Text input: "Ask RolDe anything..."
- Cmd/Ctrl+Enter submits
- Response appears as a card at the top of the panel

### 5.2 The Suggestion Card Anatomy

```
+-----------------------------------------+
|  [intent icon]  Suggestion type         |  <-- card header
+-----------------------------------------+
|                                         |
|  AI suggestion content                  |  <-- card body
|  Plain text, structured, brief          |
|                                         |
+-----------------------------------------+
|  [✓ Add to notes]  [↗ Expand]  [👍 👎] |  <-- card footer
+-----------------------------------------+
```

**Card header**:
- Intent icon (one of: differential, investigation, prescription, referral, alert, plan, query response)
- Suggestion type label (e.g. "Differential", "Investigation suggestion", "Drug interaction warning")
- Subtle, 12px text, `--text-secondary`

**Card body**:
- The AI's content
- Plain text or structured per type
- Maximum ~4 lines visible; "Show more" expands within the card
- Citations referenced inline as small superscript numbers (e.g. *"per NICE NG109¹"*) which link to expansion

**Card footer (actions)**:
- **"✓ Add to notes"**: Promotes the card content to the patient feed as a *"RolDe says..."* entry. This is the PRIMARY action.
- **"↗ Expand"**: Opens a modal with the full citation expansion, sources, AI's reasoning trail
- **"👍" / "👎"**: Feedback. Thumbs-down opens a correction modal that enters the Validated Correction Pipeline (Bible 4.0 §4.4, Bible 4.7 detail)

### 5.3 The Card Visual Variants

| Severity | Visual Treatment |
|---|---|
| Normal suggestion | `--shadow-md`, white background, `--border-subtle` |
| Notable / consider | `--shadow-md`, white background, `--border-default` (slightly stronger) |
| Warning (action needed) | `--shadow-md`, `--signal-warning-bg` background, `--signal-warning` left border (3px) |
| Critical (acute concern) | `--shadow-critical` (red-tinged glow + border), white background, `--signal-critical` text for header |

The vast majority of cards are "normal" or "notable." Critical treatment is reserved for genuine clinical urgency (sepsis criteria met, severe drug interaction, anaphylaxis risk).

### 5.4 The "I Don't Know" Card

When the AI lacks confidence (Bible 4.0 §9.7):

```
+-----------------------------------------+
|  [?]  Uncertain                         |
+-----------------------------------------+
|                                         |
|  I don't have a confident answer for    |
|  this. Recommend consulting:            |
|                                         |
|   • NICE NG109 (suspected sepsis)       |
|   • eMC SmPC for ceftriaxone            |
|   • A senior colleague                  |
|                                         |
+-----------------------------------------+
|  [Log this as a guideline gap]          |
+-----------------------------------------+
```

Calm, factual, helpful. Not apologetic. The clinician recognises this as a feature (RolDe being honest), not a failure.

### 5.5 The Direct Query Pattern

When the clinician asks RolDe a direct question (e.g. "what's the contraindications for IV ceftriaxone?"), RolDe responds with a card at the top of the panel:

```
+-----------------------------------------+
|  [?]  Direct query response             |
+-----------------------------------------+
|                                         |
|  Q: contraindications for IV            |
|     ceftriaxone                         |
|                                         |
|  Hypersensitivity to cephalosporins;    |
|  history of severe penicillin allergy   |
|  (cross-reactivity ~5-10%); neonatal    |
|  hyperbilirubinaemia. Use caution in    |
|  hepatic dysfunction.                   |
|                                         |
|  Source: eMC SmPC (Ceftriaxone 1g)¹     |
|                                         |
+-----------------------------------------+
|  [✓ Add to notes]  [↗ Expand]  [👍 👎] |
+-----------------------------------------+
```

Direct query responses look identical to ambient suggestions — same card pattern. The clinician doesn't need to think about which "mode" they're in.

### 5.6 The Streaming Behaviour

When RolDe is generating a response (whether ambient or direct query), the card appears immediately with a streaming indicator:

- Header appears first
- Body text streams in word-by-word (Gemma 4 token streaming via WebSocket)
- Cursor visible at the end of the streaming text
- Once complete, cursor disappears, footer actions appear
- Cancellation: clicking outside the card (or pressing Esc) cancels generation and dismisses the card

Streaming is calm — text appears smoothly, no jitter, no rapid flickering.

### 5.7 The "Pause Suggestions" Pattern

The clinician can pause ambient suggestions for a consultation (e.g. they're discussing something sensitive and don't want AI cards appearing).

- Click overflow menu → "Pause suggestions"
- All ambient suggestions pause; cards don't appear
- Direct queries still work
- Pause persists until consultation ends or clinician resumes
- Visual indicator in panel header: "Suggestions paused"

This respects clinician autonomy (Bible 4.0 §6.1 — *"the clinician's choice"*).

### 5.8 The Critical Alert Override

If continuous patient monitoring identifies a genuinely critical issue during a consultation (e.g. a previously unnoticed drug interaction with what the clinician is about to prescribe), the alert appears EVEN IF suggestions are paused. The pause is respected for advisory suggestions; safety-critical alerts always surface.

This requires careful threshold-setting in Bible 4.7. The threshold is high.

---

## 6. The Dashboard (Calm By Construction)

Bible 0 §8.10 / Bible 4.0 §6.1 commit to the dashboard feeling calm. This section specifies how that's achieved visually.

### 6.1 The Dashboard Layout

```
+-------------------------------------------------------------------+
|  [tenant logo]  Doc For Skin                       [user avatar]  |  <-- top bar
+-------------------------------------------------------------------+
|                                                                   |
|  Good morning, Dr Roland.                                         |  <-- greeting
|  You have 12 patients today.                                      |     (single line)
|                                                                   |
|                                                                   |
|  +-----------------------------------------------------------+   |
|  |                                                           |   |
|  |   TODAY'S PATIENTS                                        |   |  <-- main card
|  |                                                           |   |     (the focal
|  |   [patient list — see §6.2]                               |   |      object)
|  |                                                           |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|                                                                   |
|  Quick actions:  [+ New patient]  [Scheduling]  [Letters]         |  <-- secondary
|                                                                   |     row
+-------------------------------------------------------------------+
```

**Top bar**: tenant branding on left, user avatar on right. No notifications icon, no search, no bell. Dead simple.

**Greeting**: time-aware ("Good morning"/"Good afternoon"/"Good evening") + clinician name + simple summary count. NO emojis, NO motivational quotes, NO "Welcome back!"

**Main card**: today's patient list as the central focal object. Surrounded by negative space.

**Quick actions**: 3-4 frequently-used actions at the bottom. NOT a feature menu — these are shortcuts to actions the clinician takes daily.

### 6.2 The Today's Patients List

```
TODAY'S PATIENTS                                          12 today
                                                          
                                                          
09:00  Mr John Smith                                      New patient
       Driver medical assessment                          ▶
       
09:30  Mrs Sarah Jones                                    Follow-up
       Botox review                                       ▶
       
10:15  Mr David Chen                                      New patient
       Aesthetic consultation                             ▶
       
─────────────────────────────────────────────────────────────────
       [collapsed: Lunch break 12:00–13:00]
─────────────────────────────────────────────────────────────────

13:00  Mrs Patricia White                                 Returning
       Filler top-up (cooling-off complete)               ▶

[... continues ...]
```

**Each patient row**:
- Time (left, aligned column)
- Patient name (`--text-base`, regular)
- Appointment type or visit reason (small, `--text-secondary`)
- Right-aligned arrow indicator (subtle, `--text-tertiary`)
- Click anywhere on the row → opens the consultation screen
- Visual flags only when relevant (allergy chip if patient has alert; "first visit" marker for new patients; "consent unsigned" warning if appropriate)

**No counters of unread messages, overdue tasks, urgent items.** If something genuinely urgent needs attention, it appears in the bottom alert strip on the consultation screen, not as a dashboard counter.

### 6.3 The Multi-Variant Dashboards

Per Bible 0 §12.4 (universal dashboard, role-conditioned content):

| Role | Dashboard Variant |
|---|---|
| Clinician | Today's patients (as above) |
| Locum | Same as clinician, scoped to their session |
| Nurse | Today's assigned patients + observations to take |
| Concierge | Cross-departmental view: all clinicians' lists, payments due, registrations to complete |
| Caretaker | Clinic overview: all clinician lists summary, financial summaries, audit log access entry, user management |
| Custodian (Roland) | Cross-tenant platform view: tenant onboarding queue, AI update status, billing health, usage dashboard |
| Patient (portal) | Own appointments (past and upcoming), own results, own consents, "Reschedule" / "Book new" actions |

Some clinic types need different layouts. A 10-bed inpatient clinic shows bed occupancy visualisation in place of an appointment list. The variant is configured during tenant onboarding (Bible 0 §12.3, Bible 4.3 detail).

### 6.4 The Calm Test

For every dashboard variant, the calm test:

> *"Does this leave the clinician feeling calmer or more anxious upon opening?"*

Failure modes:
- A counter showing "5 overdue!" → anxious. Reject.
- A red badge on an icon → anxious. Reject.
- A modal popping up about feature updates → anxious. Reject.
- An animated banner showing "You're at 87% of your limit!" → anxious. Reject.
- A "streak" counter encouraging daily login → anxious AND condescending. Reject.

Acceptable patterns:
- A factual count ("12 patients today") → informational, calm.
- A subtle indicator on a row that has actually relevant context → useful.
- An empty state with quiet text → calm.

---

## 7. The Booking Flow (LatePoint-Inspired)

Bible 0 §8.4 commits to LatePoint-style modal-driven UX for booking flows. This section specifies the RolDe implementation.

### 7.1 The Booking Flow Steps

The booking flow is a step-driven modal that handles:

1. Service selection (which appointment type)
2. Clinician selection (where multi-clinician; auto-selected for solo)
3. Date and time selection (calendar + slot picker)
4. Patient identification (existing patient login or new patient quick-create)
5. Confirmation
6. Pre-consultation onboarding email (auto-triggered, Bible 0 §12.6)

### 7.2 The Modal Design

- Full-screen modal on mobile; centred ~600px modal on desktop
- `--radius-2xl` (24px) corners
- White background, generous padding (`--space-8` minimum)
- Step indicator at top (subtle dots or progress bar — Roland's call)
- Back / Continue buttons at bottom
- Animated transitions between steps (slide-left for forward, slide-right for back, ~300ms)
- Cancel "X" in top-right; confirm-cancel modal if user has progressed past step 1

### 7.3 The Service Selection (Step 1)

Per-tenant configured services appear as cards:

```
+-----------------------------+    +-----------------------------+
|                             |    |                             |
|   Driver Medical            |    |   Botox Consultation        |
|   45 min  •  £150           |    |   30 min  •  £80            |
|                             |    |                             |
|   ▶                         |    |   ▶                         |
+-----------------------------+    +-----------------------------+
```

Service cards are restrained: name, duration, price, optional brief description on hover.

### 7.4 The Time Selection (Step 3)

- Calendar view showing days with available slots
- Click day → slot picker shows available times
- Slots shown in tenant timezone with timezone label
- "Earliest available" shortcut at top

DESIGN NEEDED: Calendar component visual. Roland to specify whether shadcn/ui calendar suffices or custom design needed.

### 7.5 The New Patient Quick Create (Step 4 alternative)

If patient is not logged in:

```
+-----------------------------------------------+
|  New here? Continue as guest:                 |
|                                                |
|  Full name        [_______________________]   |
|  Email            [_______________________]   |
|  Phone            [_______________________]   |
|  Date of birth    [__/__/____]                |
|                                                |
|  By continuing, you agree to receive a         |
|  pre-consultation email with required forms.   |
|                                                |
|  [Continue →]                                  |
+-----------------------------------------------+
```

Minimal fields. Address, emergency contact, full medical history are NOT collected here — they're collected via the pre-consultation onboarding flow after booking confirmed (Bible 0 §12.6).

### 7.6 The Confirmation (Step 5)

```
                  ✓
        Your appointment is booked.
        
        Wednesday, 15 May 2026 at 10:30
        with Dr Roland Manoj Jayasekhar
        Doc For Skin, Edinburgh
        
        We've sent a confirmation email
        with your pre-consultation forms.
        Please complete them before your visit.
        
        [Add to calendar]    [Done]
```

Calm, factual confirmation. The "Add to calendar" generates an .ics file. The pre-consultation email triggers automatically.

---

## 8. The Patient Portal Visual Language

Patients access RolDe at `patient.<clinicname>.rolde.app` (Bible 4.1 §3.5). The visual language differs from the clinician interface — patients are anxious, often on mobile, often non-technical.

### 8.1 The Patient Portal Differences

| Aspect | Clinician Side | Patient Side |
|---|---|---|
| Information density | High (consultation screen is dense) | Low (one focal action per screen) |
| Tone | Clinical-but-warm | Warm and clear |
| Mobile-first | Desktop primary | Mobile primary |
| Branding | RolDe operating system | Tenant clinic brand (RolDe invisible) |
| Vocabulary | Clinical terms | Plain English, clinical terms explained |

### 8.2 The Patient Portal Layout

Mobile-first single-column:

```
+---------------------------------+
|  [tenant logo]            [≡]   |  <-- top bar with tenant brand
+---------------------------------+
|                                 |
|  Hello, Sarah                   |  <-- greeting (first name)
|                                 |
|                                 |
|  YOUR NEXT APPOINTMENT          |  <-- focal card
|                                 |
|  Wednesday, 15 May              |
|  10:30 with Dr Roland            |
|                                 |
|  [Reschedule]  [Cancel]         |
|                                 |
|                                 |
|  Pre-consultation forms          |  <-- secondary
|  3 forms to complete            |
|  ▶                               |
|                                 |
|                                 |
|  Recent results                  |  <-- tertiary (when present)
|  Lab work — 3 May               |
|  ▶                               |
|                                 |
+---------------------------------+
```

### 8.3 The Patient Communication Tone

Per Bible 4.0 §13.2:
- Warm and clear
- Plain-language clinical content
- Calm, no urgency-creating language
- Specific (confirmed times, exact addresses)
- Branded as the clinic, NOT as RolDe (the patient sees Doc For Skin's logo and tagline; RolDe is invisible plumbing)

### 8.4 What Patients Cannot See

Per Bible 0 §12.6 / Bible 4.0 §9.7:
- Clinical notes (the doctor's reasoning)
- AI suggestions (any RolDe-generated content not promoted to a patient-visible artefact)
- Other patients' data (obviously)
- Internal clinic communications

Caretaker configures per-data-type visibility (e.g. "lab results visible to patients with 24-hour delay for clinician review").

---

## 9. Component Patterns

This section catalogues the recurring component patterns. Each pattern is implemented in `packages/ui/` (Bible 4.1 §17.1) and inherited across all RolDe-powered products.

### 9.1 The Button Hierarchy

| Type | Visual | Use |
|---|---|---|
| **Primary** | Dark fill, white text, `--radius-md` | The primary action on a screen — limit one per view |
| **Secondary** | White fill, dark border, dark text | Secondary actions — multiple allowed |
| **Tertiary / Ghost** | No fill, no border, dark text on hover background | Subtle actions, often in toolbars |
| **Destructive** | Red text, no fill (or red fill for confirmation) | Delete, remove, archive — confirmation usually required |

NO coloured primary buttons. NO "exciting" gradient buttons. NO oversized CTAs. Restraint.

### 9.2 The Form Input Pattern

```
Label                                       (small, `--text-sm`, weight medium)
+---------------------------------------+
|                                       |   (input — `--text-base`, regular)
+---------------------------------------+
Helper or error text                       (small, `--text-xs`, `--text-secondary` 
                                            or `--signal-critical` for error)
```

- Label always above the input (never inside, no floating labels)
- Required indicator: subtle asterisk in `--text-secondary`
- Focus state: `--border-focus` (dark border, no glow)
- Error state: `--signal-critical` border + helper text
- Inputs are 44px tall minimum (touch target accessibility)

### 9.3 The Modal Pattern

- Backdrop: `--surface-overlay` (dark transparent)
- Modal: white background, `--radius-xl`, `--shadow-xl`
- Padding: `--space-8`
- Close X in top-right
- Keyboard: Esc closes (with confirm if unsaved changes)
- Focus trap within modal
- Returns focus to trigger element on close

### 9.4 The Toast / Notification Pattern

When the clinician needs feedback on an action (saved successfully, prescription sent, etc.):

- Bottom-right of screen
- Small, `--shadow-lg`, `--radius-md`
- Auto-dismiss after 4 seconds
- Manually dismissible via X
- NEVER for clinical alerts (those go to the AI panel or alert strip)
- NEVER red toasts (errors get inline messaging on the form)

### 9.5 The Empty State Pattern

When a list, panel, or page has no content:

- Centred in the available space
- Brief, factual headline ("No clinical entries yet")
- Optional helper text ("The next note you save will appear here")
- Optional primary action button if appropriate
- NO illustrations of cute robots or empty boxes (Bible 4.0 voice — restrained)

### 9.6 The Loading State Pattern

- Skeleton screens for predictable content (table rows, card layouts)
- Subtle pulse animation
- `--neutral-100` for skeleton blocks
- NEVER spinners as the primary loading indicator — they suggest waiting; skeletons suggest progress

### 9.7 The Error State Pattern

When something genuinely goes wrong:

- Inline error message on the relevant control
- For page-level errors: card with brief description + suggested action
- For system-level errors (AI offline, database unreachable): dedicated banner per Bible 4.1 §6.4 graceful degradation
- Error messages are factual, brief, never apologetic ("Failed to save. Try again?" not "Oops! Something went wrong! 😢")

### 9.8 The Status Indicator Pattern

Used throughout (prescription status, referral status, consent status, etc.):

- Small dot (8px) + label (`--text-xs`, weight medium)
- Colour from semantic palette only when status carries clinical meaning
- Otherwise monochrome (`--text-secondary`)

Examples:
- "Draft" — `--text-secondary` dot
- "Approved" — `--text-secondary` dot
- "Sent" — `--signal-success` dot
- "Dispensed" — `--signal-success` dot
- "Action needed" — `--signal-warning` dot
- "Critical" — `--signal-critical` dot

---

## 10. Iconography

### 10.1 The Icon System

- **24×24px** standard size for navigation and primary UI
- **16×16px** for inline icons (within text, in card headers)
- **48×48px** for empty states and feature illustrations
- Stroke-based (outlined) preferred over filled for navigation
- Filled used for status indicators (filled circles)
- Single colour (currentColor) — no gradient icons

### 10.2 Icon Source

shadcn/ui defaults to **lucide-react** (Bible 0 §8.3 implicit). RolDe inherits this.

For RolDe-specific concepts where lucide doesn't have an exact match, **DESIGN NEEDED**: Roland designs the missing icons. Examples likely needing custom design:
- The RolDe wordmark icon (for app icons, favicons)
- Ambient AI panel intent icons (differential, prescription suggestion, referral, alert)
- Aesthetic photography 5-photo set indicator
- Closed-loop referral status icons (drafted → approved → sent → received)

### 10.3 Icon Don'ts

- No emoji as icons (except where genuinely intentional like the thumbs-up/down on AI cards)
- No multicolour icons
- No ornamental icons (icons must communicate function)

---

## 11. Motion and Transition

Motion is calm. Purposeful. Brief.

### 11.1 The Motion Tokens

```css
--duration-instant: 0ms;       /* No animation */
--duration-quick: 150ms;       /* Hover states, small changes */
--duration-default: 250ms;     /* Most transitions */
--duration-slow: 400ms;        /* Modal in/out, page transitions */
--duration-deliberate: 600ms;  /* Confirmation animations, success */

--easing-default: cubic-bezier(0.4, 0, 0.2, 1);  /* Standard ease */
--easing-in: cubic-bezier(0.4, 0, 1, 1);
--easing-out: cubic-bezier(0, 0, 0.2, 1);
--easing-spring: cubic-bezier(0.5, 1.5, 0.5, 1);  /* Used VERY sparingly */
```

### 11.2 The Motion Patterns

| Action | Motion |
|---|---|
| New feed entry appears | Slide-up (8px) + fade-in, 250ms |
| AI card appears | Fade-in + slight slide-down (4px), 250ms |
| Modal opens | Backdrop fade + modal scale-from-0.96 + fade, 300ms |
| Modal closes | Reverse, 250ms |
| Page navigation | No animation (instant) |
| Hover state | Background colour transition, 150ms |
| Status change (e.g. prescription "Approved" → "Sent") | Brief pulse + colour transition, 400ms |
| Toast appears | Slide-up from bottom + fade, 250ms |
| Toast dismisses | Slide-right + fade, 200ms |

### 11.3 The Reduced Motion Respect

If user has `prefers-reduced-motion: reduce` set:
- All non-essential animations disabled
- Transitions become 0ms or use opacity-only
- Clinical functionality unchanged
- Some respect for indication of state change preserved (e.g. fade between states still works)

---

## 12. Responsive Behaviour

Per Bible 4.1 §16.1 performance budget, responsive design is mandatory.

### 12.1 The Breakpoint System

Tailwind v4 defaults aligned:

```css
--breakpoint-sm: 640px;   /* Phones landscape, small tablets */
--breakpoint-md: 768px;   /* Tablets portrait */
--breakpoint-lg: 1024px;  /* Tablets landscape, small laptops */
--breakpoint-xl: 1280px;  /* Laptops, desktops */
--breakpoint-2xl: 1536px; /* Large desktops */
```

### 12.2 The Layout Behaviour Per Breakpoint

Per §3.9, the consultation screen has specific adaptations. The dashboard, patient portal, and booking flow each have their own responsive behaviour summarised in their respective sections.

**Common rules**:
- Touch targets minimum 44×44px on touch devices
- Text never smaller than `--text-sm` on mobile
- Modals become full-screen below `md` breakpoint
- Side navigation collapses to bottom navigation below `lg` breakpoint
- Multi-column layouts stack below `lg` breakpoint

---

## 13. Accessibility Commitments

RolDe must be usable by clinicians and patients with disabilities.

### 13.1 The WCAG Target

**WCAG 2.2 Level AA** for all RolDe-powered products. Specific commitments:

- **Colour contrast**: text meets 4.5:1 contrast against background; UI elements meet 3:1
- **Keyboard navigation**: every interactive element reachable and operable via keyboard
- **Focus visible**: focus indicators always visible (`--border-focus`)
- **Screen reader support**: semantic HTML, ARIA labels where needed, no role abuse
- **Forms**: all inputs have associated labels; errors announced via aria-live regions
- **Motion**: `prefers-reduced-motion` respected (§11.3)
- **Text resize**: layouts function with browser text zoom up to 200%
- **Alternative text**: every meaningful image has alt text; decorative images have empty alt

### 13.2 The Clinical Accessibility Considerations

Clinicians in busy clinical environments may:
- Have hands occupied (need keyboard shortcuts)
- Be in low-light environments (need sufficient contrast)
- Be moving between rooms (need quick visual orientation)
- Be tired and stressed (need clear, calm interfaces)

Every design decision considers these realities. Keyboard shortcuts documented in Bible 4.4. Contrast verified for low-light visibility.

### 13.3 The Patient Accessibility Considerations

Patients accessing the portal may be:
- Elderly (need larger text options, simple navigation)
- Anxious (need calm tone, clear next steps)
- Non-native English speakers (need plain language; future i18n)
- Using assistive technology (screen readers, voice control)
- On older devices and slow connections

Patient portal performance budget is therefore tighter than clinician interface. Plain language is constitutional. Accessibility testing includes screen reader walkthroughs.

---

## 14. Per-Specialty Visual Variants

Each medical specialty has unique workflows that may justify per-specialty visual elements.

### 14.1 The Doc For Drivers Variant

Driver medical assessment is highly structured. The consultation screen for Doc For Drivers may show:

- Top strip: standard patient info + "DVLA Group 2 assessment" badge
- Right pane: instead of generic Investigations tabs, has DVLA-specific tabs: Vision, Cardiovascular, Diabetes, Neurological, Sleep, Substance Use
- Each DVLA tab has structured fields matching the Group 2 medical questionnaire
- Letters tab includes DVLA D4 form generation as a pre-populated artefact

DESIGN NEEDED: Doc For Drivers Group 2 assessment visual layout — Roland to specify.

Bible 5 (Doc For Drivers) details this fully.

### 14.2 The Doc For Skin Variant

Aesthetic medicine is highly visual. The consultation screen for Doc For Skin may show:

- Top strip: standard patient info + "Aesthetic" badge + last consent status
- Right pane: tabs include Photography (5-photo set), Procedures (Botox / Filler / Peels / Microneedling / PRP / Threads / Minor surgery), Letters
- Photography tab is prominent given clinical importance
- Patient feed prominently displays recent before/after photo sets in carousel cards

DESIGN NEEDED: Doc For Skin photo modal layout (the 5-photo upload + annotation modal Roland specified in Cluster D Doc For Skin extras) — Roland to design.

Bible 6 (Doc For Skin) details this fully.

### 14.3 The Future Specialty Variants

Other specialties (dermatology, GP, ophthalmology, orthopaedics) will have their own variants when those specialties onboard. The variant pattern:

1. Shared consultation screen layout (§3) as foundation
2. Specialty-specific tabs in the right pane (replacing or supplementing default Investigations/Letters tabs)
3. Specialty-specific feed entry types if applicable
4. Specialty-specific dashboard variants if applicable

Each specialty variant gets a small extension to this Bible 4.2 (Section 14.x) when it's first implemented.

---

## 15. The Watermarking System (Aesthetic Photography)

Specifically for Doc For Skin and any future aesthetic clinic. Per Cluster D Roland specification: photos are watermarked automatically; Caretaker controls watermark settings.

### 15.1 The Watermark Configuration

Per-tenant configuration (in Caretaker settings):

```json
{
  "watermark": {
    "enabled": true,
    "position": "bottom-right",
    "text": "© Doc For Skin 2026",
    "opacity": 0.5,
    "font_size": "small",
    "include_clinic_logo": false,
    "include_date": true,
    "include_patient_id": false
  }
}
```

### 15.2 The Watermark Visual Behaviour

- Applied automatically post-upload (Bible 4.1 §8.5 watermarking pipeline)
- Watermark is subtle (low opacity) — visible but not intrusive
- Doesn't obscure clinical features
- Original raw file retained for audit (Custodian can access; not used in patient feed)
- Watermarked version is what appears in patient feed and any patient-shared exports

### 15.3 The Watermark Position

Default position: bottom-right corner, ~5% inset from edges. Caretaker can choose: bottom-right, bottom-left, top-right, top-left, or centre.

DESIGN NEEDED: Watermark visual treatment specifics — Roland to design exact font, opacity, positioning.

---

## 16. Visual Asset Inventory (DESIGN NEEDED)

This section enumerates every visual asset required for RolDe Phase 1. Each entry pauses the build for Roland's design input (Bible 0 §8.6).

### 16.1 The Logo and Wordmark Set

- [ ] **DESIGN NEEDED**: RolDe wordmark in IBM Plex Serif (already designed by Roland per memory; confirm it's the canonical asset)
- [ ] **DESIGN NEEDED**: RolDe favicon (16×16, 32×32, 48×48 ico/png)
- [ ] **DESIGN NEEDED**: RolDe app icon (Apple touch icon 180×180, Android icon 512×512, maskable variants)
- [ ] **DESIGN NEEDED**: RolDe social card image (Open Graph 1200×630, Twitter card)
- [ ] **DESIGN NEEDED**: RolDe email signature logo (200×60 PNG, transparent)

### 16.2 The Doc For Drivers Brand Assets

- [ ] **DESIGN NEEDED**: Doc For Drivers wordmark
- [ ] **DESIGN NEEDED**: Doc For Drivers favicon set
- [ ] **DESIGN NEEDED**: Doc For Drivers app icons
- [ ] **DESIGN NEEDED**: Doc For Drivers social cards

### 16.3 The Doc For Skin Brand Assets

- [ ] **DESIGN NEEDED**: Doc For Skin wordmark
- [ ] **DESIGN NEEDED**: Doc For Skin favicon set
- [ ] **DESIGN NEEDED**: Doc For Skin app icons
- [ ] **DESIGN NEEDED**: Doc For Skin social cards
- [ ] **DESIGN NEEDED**: Doc For Skin watermark visual treatment

### 16.4 The RolDe Custom Icons

- [ ] **DESIGN NEEDED**: AI panel intent icons (differential, investigation, prescription, referral, alert, plan, query response — 7 icons at 16×16 and 24×24)
- [ ] **DESIGN NEEDED**: Closed-loop referral status icons (drafted, approved, sent, received, acknowledged — 5 icons)
- [ ] **DESIGN NEEDED**: Aesthetic photography 5-photo set indicator icon
- [ ] **DESIGN NEEDED**: Patient portal welcome/empty state illustration (if any — Roland may opt for none)

### 16.5 The Marketing Site Visuals

- [ ] **DESIGN NEEDED**: rolde.app hero visual (whatever Roland designs for the public marketing site — Bible 4.M will detail)
- [ ] **DESIGN NEEDED**: Feature illustrations for the marketing site sections
- [ ] **DESIGN NEEDED**: Onboarding flow imagery if applicable

### 16.6 The Build Cannot Proceed Without These

Specifically for Phase 1 launch, the BLOCKING assets are:
- RolDe logo + favicon (used everywhere)
- Doc For Drivers logo + favicon (used in Doc For Drivers tenant chrome)
- Doc For Skin logo + favicon (used in Doc For Skin tenant chrome)
- AI panel intent icons (used in every consultation screen)

The non-blocking but desirable assets (marketing illustrations, custom social cards) can be added incrementally.

When Claude Code reaches a point requiring a missing visual asset, it pauses and prompts Roland: *"Design needed: [asset] at [dimensions] for [purpose]."* — never generates a placeholder, never describes a design as if it should exist.

---

## 17. Component-to-Bible Mapping

Where to find detailed implementation specifications for each visual element:

| Component | Visual Specification (this Bible) | Implementation Detail |
|---|---|---|
| Consultation screen layout | §3 | Bible 4.4 |
| Patient feed | §4 | Bible 4.6 |
| AI panel | §5 | Bible 4.7 |
| Dashboard variants | §6 | Bible 4.4 + Bible 4.3 |
| Booking flow | §7 | Bible 4.4 |
| Patient portal | §8 | Bible 4.4 |
| Aesthetic photo modal | §15 + §14.2 | Bible 6 |
| Doc For Drivers DVLA layout | §14.1 | Bible 5 |
| Per-tenant branding | §2.7 | Bible 4.3 |
| Auth screens | (inheriting Bible 0 §8.4 booking flow style) | Bible 4.3 |
| Caretaker admin | (using component patterns §9) | Bible 4.3 |

---

## 18. Acceptance Criteria for "Design System Is Built"

The design system is "built" for Phase 1 when:

### 18.1 The Token-Level Acceptance

- [ ] Typography tokens defined in `packages/ui/tokens/typography.css`
- [ ] Colour tokens defined in `packages/ui/tokens/colors.css`
- [ ] Spacing, radius, elevation, z-index tokens defined
- [ ] Tenant branding token override mechanism implemented
- [ ] Tailwind v4 configured to consume tokens
- [ ] Tokens documented in a Storybook (or equivalent) for reference

### 18.2 The Component-Level Acceptance

- [ ] Button hierarchy implemented (primary, secondary, tertiary, destructive)
- [ ] Form input pattern implemented (text, textarea, select, checkbox, radio)
- [ ] Modal pattern implemented with focus trap and keyboard handling
- [ ] Toast pattern implemented
- [ ] Empty state pattern implemented
- [ ] Loading state pattern (skeleton screens) implemented
- [ ] Error state pattern implemented
- [ ] Status indicator pattern implemented
- [ ] All components meet WCAG 2.2 AA

### 18.3 The Layout-Level Acceptance

- [ ] Consultation screen layout built and renders correctly
- [ ] Patient feed renders all entry types correctly
- [ ] AI panel renders cards with correct severity treatments
- [ ] Dashboard renders for at least three role variants (Clinician, Concierge, Caretaker)
- [ ] Booking flow renders complete 6-step flow
- [ ] Patient portal renders with mobile-first responsive layout
- [ ] All layouts meet performance budgets (Bible 4.1 §16.1)

### 18.4 The Visual Asset Acceptance

- [ ] All blocking assets from §16.6 designed by Roland and integrated
- [ ] Tenant branding mechanism tested with at least Doc For Drivers and Doc For Skin
- [ ] Watermarking pipeline functional for aesthetic photography
- [ ] Custom icons designed and integrated where lucide-react insufficient

### 18.5 The Integration-Level Acceptance

- [ ] Roland uses the consultation screen for an actual consultation and reports satisfaction
- [ ] Concierge (test user) navigates the dashboard variant and completes registration without instruction
- [ ] Patient (test user, mobile) completes a booking via the patient portal without instruction
- [ ] Caretaker (Roland) configures tenant branding and verifies it propagates correctly

When all 18.1-18.5 criteria pass, RolDe Phase 1 design system is complete.

---

## End of Bible 4.2

This is the visual and interaction language of RolDe. Every screen, every component, every animation pulls from here.

When a future Claude Code session is implementing a RolDe feature, it loads Bible 0 (group defaults), Bible 4.0 (constitution), Bible 4.1 (architecture), this Bible 4.2 (design system), and the specific module Bible — and has the full inherited context to make visually consistent decisions.

When in doubt about a visual decision: *does it pass the Steve Jobs design test (Bible 0 §8.7)?* If the clinician would notice the design — for any reason other than recognising "this works" — it's wrong.

The next sub-Bible to draft is **4.3 — RolDe Multi-Tenant Foundation** (the Caretaker admin panel, tenant onboarding wizard, billing integration, role and permission management).

— Roland Manoj Jayasekhar, with Devipangaj
RoDee, May 2026

---

## Addendum (2026-06-11): Dashboard cockpit + consultation features

Per the market dive, the **canonical feature list + build sequence lives in Bible
4.8 §15**. For this Bible (design system / UI):

- **§6 Dashboard becomes a clinician cockpit** — Action queues (Results to review,
  Scripts to sign, Referrals, Documents to authorise, **Pending-work list**,
  Recalls due, Consents, Messages) + Pulse tiles + Front-of-house (today's
  schedule, checked-in, recalls/birthdays). Queue cards are actionable; they
  render only when their module exists (never faked). Stat tiles = `StatTile`.
- **§3 Consultation gains** problem list, medication list, history, **before/after
  photo slider**, **face/body-map annotations**, care plans, document store,
  vitals/growth charts, digital consents, risk scores, printable summary.
- Standardised primitives now in code: `PageHeaderRow`, `StatTile`, `SectionExplainer`
  (the `(i)`), floating fields + green-tick squircle, floating buttons, glass headers.

See Bible 4.8 §15.4 for the wave-by-wave build order.
