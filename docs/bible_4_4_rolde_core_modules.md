# RolDe — Bible 4.4: Core Modules

> *"The pipeline closes properly. The clinician never produces a PDF and is then on their own to deliver it."* — Bible 4.0 §10.2
>
> Version 1.0 | Last Updated: 10 May 2026 | RolDe Ltd | CONFIDENTIAL
>
> Implementation specification for the universal clinical modules. Inherits from Bible 0 v1.2, Bible 4.0, Bible 4.1, Bible 4.2, and Bible 4.3.

---

## How to Use This Document

This is the **implementation specification for RolDe's universal clinical modules** — the modules every tenant uses regardless of specialty:

- The calendar and scheduling system
- Patient management (registration, demographics, search)
- Clinical notes (the patient feed, the consultation surface)
- The closed-loop referral pipeline (RolDe's flagship architectural commitment)
- Letters (referral, discharge, sick notes, GP letters, fit-for-work)
- The OCR pipeline (incoming scanned documents → structured feed entries)
- The continuous patient monitoring service (background watching)
- The audit log surface (how Caretaker and Custodian view audit data)

**Loading order for Claude Code sessions**:
1. Bible 0 v1.2 — group defaults
2. Bible 4.0 — RolDe constitution
3. Bible 4.1 — architecture (multi-tenant, schemas, file storage)
4. Bible 4.2 — design system (consultation screen layout, AI panel)
5. Bible 4.3 — multi-tenant foundation (Caretaker admin, roles)
6. This Bible 4.4 — core modules
7. Bible 4.5/4.6/4.7 — module-specific Bibles when relevant

This Bible is implementation-detailed. Complete schemas, API contracts, page structures, business logic, edge cases.

---

## Table of Contents

1. The Universal Modules Overview
2. Patient Management Module
3. The Calendar and Scheduling Module
4. The Clinical Notes Module (The Patient Feed)
5. The Letters Module
6. The Closed-Loop Referral Pipeline (Flagship)
7. The OCR Pipeline (Incoming Scanned Documents)
8. The Continuous Patient Monitoring Service
9. The Audit Log Surface
10. The Search and Filter System
11. The Print and Export System
12. The Notifications System
13. Module-Level Permissions
14. Module Configuration (Per-Tenant)
15. Acceptance Criteria for "Core Modules Are Built"

---

## 1. The Universal Modules Overview

### 1.1 What "Universal" Means

Universal modules are enabled in every RolDe tenant, regardless of subscription tier or specialty. They are the constitutional baseline — the things every clinic gets.

Per Bible 4.3 §16.2, the universal module set:
- Clinical notes
- Calendar / scheduling
- Patient management
- Audit log
- Closed-loop referrals
- Letters

This Bible operationalises all six.

### 1.2 What Universal Does NOT Mean

Universal does NOT mean:
- One-size-fits-all (each module has tenant-specific configuration)
- Free (universal modules are part of every paid tier; nothing is "free" in the sense of unmonetised)
- Static (modules evolve over time; tenants get updates automatically)

### 1.3 The Module Boundaries

Each module is a logical area, not a strict code boundary. Modules share infrastructure (the patient feed contains entries from multiple modules; the calendar surfaces appointments tied to clinical notes; letters reference patients).

The boundary discipline is in:
- Each module has its own database tables (with cross-module foreign keys explicit)
- Each module has its own Caretaker admin configuration page (where applicable)
- Each module has its own permission rules
- Each module has its own Bible section (here in 4.4 or in a dedicated Bible like 4.5/4.6)

---

## 2. Patient Management Module

The foundation. Every other clinical module references patients.

### 2.1 The Patient Schema

```sql
CREATE TABLE patients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  
  -- Auth linkage (NULL until patient activates portal)
  user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Identity
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  preferred_name        TEXT,
  pronouns              TEXT,                          -- 'he/him', 'she/her', 'they/them', custom
  date_of_birth         DATE NOT NULL,
  sex_at_birth          TEXT NOT NULL,                 -- 'male' | 'female' | 'intersex' | 'unknown'
  gender_identity       TEXT,                          -- Free text, optional
  
  -- Contact
  email                 TEXT,
  phone_mobile          TEXT,
  phone_landline        TEXT,
  preferred_contact     TEXT NOT NULL DEFAULT 'email', -- 'email' | 'sms' | 'phone' | 'post'
  
  -- Address
  address_line1         TEXT,
  address_line2         TEXT,
  city                  TEXT,
  postcode              TEXT,
  country               TEXT NOT NULL DEFAULT 'UK',
  
  -- Emergency contact
  emergency_name        TEXT,
  emergency_relationship TEXT,
  emergency_phone       TEXT,
  
  -- Clinical context (high-level; detail in clinical_notes)
  blood_group           TEXT,                          -- 'A+', 'O-', etc.
  ethnicity             TEXT,
  occupation            TEXT,
  
  -- NHS linkage (UK-specific; optional)
  nhs_number            TEXT,                          -- 10-digit
  registered_gp_name    TEXT,
  registered_gp_practice TEXT,
  registered_gp_address TEXT,
  
  -- Visibility flags
  has_active_alerts     BOOLEAN NOT NULL DEFAULT false, -- Cached for top-strip rendering
  
  -- Patient-portal access
  portal_invited_at     TIMESTAMPTZ,
  portal_activated_at   TIMESTAMPTZ,
  
  -- Lifecycle
  status                TEXT NOT NULL DEFAULT 'active', -- 'active' | 'inactive' | 'deceased' | 'transferred'
  deceased_at           DATE,
  
  -- Standard universal columns
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID REFERENCES auth.users(id),
  updated_by            UUID REFERENCES auth.users(id),
  deleted_at            TIMESTAMPTZ,
  deleted_by            UUID REFERENCES auth.users(id),
  
  -- Validation
  CONSTRAINT email_format CHECK (email IS NULL OR email ~ '^[^@]+@[^@]+\.[^@]+$'),
  CONSTRAINT nhs_number_format CHECK (nhs_number IS NULL OR nhs_number ~ '^\d{10}$')
);

CREATE INDEX idx_patients_tenant ON patients(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_search ON patients(tenant_id, last_name, first_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_dob ON patients(tenant_id, date_of_birth) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_phone ON patients(tenant_id, phone_mobile) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_email ON patients(tenant_id, email) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_user ON patients(user_id) WHERE user_id IS NOT NULL;

-- RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON patients
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
```

### 2.2 The Patient Allergies Table

Allergies are critical — they appear on the top-strip of every consultation screen (Bible 4.2 §3.2). Separate table for structure:

```sql
CREATE TYPE allergy_severity AS ENUM ('low', 'moderate', 'severe', 'life_threatening');

CREATE TABLE patient_allergies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  substance         TEXT NOT NULL,                    -- e.g. 'Penicillin', 'Latex'
  reaction          TEXT NOT NULL,                    -- e.g. 'Anaphylaxis', 'Rash', 'Nausea'
  severity          allergy_severity NOT NULL,
  notes             TEXT,                             -- Free-text additional detail
  
  -- Source
  reported_by       TEXT,                             -- 'patient' | 'parent' | 'carer' | 'medical_record'
  verified_by       UUID REFERENCES auth.users(id),  -- Clinician who verified
  verified_at       TIMESTAMPTZ,
  
  status            TEXT NOT NULL DEFAULT 'active',   -- 'active' | 'inactive' | 'rejected'
  
  -- Standard columns
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID REFERENCES auth.users(id),
  deleted_at        TIMESTAMPTZ,
  deleted_by        UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_allergies_patient ON patient_allergies(patient_id) WHERE status = 'active' AND deleted_at IS NULL;
```

### 2.3 The Patient Alerts Table

Generic clinical alerts beyond allergies (e.g. "MRSA-positive", "Risk of falls", "DNAR in place", "Pregnant"):

```sql
CREATE TYPE alert_priority AS ENUM ('info', 'warning', 'critical');

CREATE TABLE patient_alerts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  category          TEXT NOT NULL,                    -- 'infection' | 'safety' | 'clinical' | 'social' | 'other'
  title             TEXT NOT NULL,
  description       TEXT,
  priority          alert_priority NOT NULL DEFAULT 'warning',
  
  expires_at        DATE,                             -- Optional automatic expiry
  
  status            TEXT NOT NULL DEFAULT 'active',
  resolved_by       UUID REFERENCES auth.users(id),
  resolved_at       TIMESTAMPTZ,
  resolved_reason   TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID REFERENCES auth.users(id) NOT NULL
);

CREATE INDEX idx_alerts_patient_active ON patient_alerts(patient_id) WHERE status = 'active';
```

### 2.4 The Patient Search

The search bar in the Caretaker admin and at the top of Today's Patients dashboard. Powered by PostgreSQL pg_trgm (Bible 4.1 §2.1).

```sql
-- Trigram extension already enabled per Bible 4.1
CREATE INDEX idx_patients_name_trgm ON patients
  USING gin ((first_name || ' ' || last_name) gin_trgm_ops)
  WHERE deleted_at IS NULL;
```

Search query handles:
- Full or partial name (first or last)
- Date of birth (formatted DD/MM/YYYY or YYYY-MM-DD)
- Phone number (last 4 digits sufficient)
- Email (partial match)
- NHS number (full or last 4 digits)

```typescript
// src/lib/patients/search.ts
export async function searchPatients(
  tenantId: string,
  query: string
): Promise<Patient[]> {
  // Detect query type
  const isPhoneNumber = /^[\d\s\+\-\(\)]+$/.test(query);
  const isDOB = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(query);
  const isNHSNumber = /^\d{10}$/.test(query);
  const isEmail = query.includes('@');
  
  let supabaseQuery = supabase
    .from('patients')
    .select('id, first_name, last_name, date_of_birth, phone_mobile, email')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .limit(20);
  
  if (isNHSNumber) {
    supabaseQuery = supabaseQuery.eq('nhs_number', query);
  } else if (isPhoneNumber) {
    const cleaned = query.replace(/\D/g, '');
    supabaseQuery = supabaseQuery.like('phone_mobile', `%${cleaned}%`);
  } else if (isDOB) {
    const isoDate = parseDOBToISO(query);
    supabaseQuery = supabaseQuery.eq('date_of_birth', isoDate);
  } else if (isEmail) {
    supabaseQuery = supabaseQuery.ilike('email', `%${query}%`);
  } else {
    // Name search via trigram similarity
    const fullName = query.toLowerCase();
    supabaseQuery = supabaseQuery
      .or(`first_name.ilike.%${fullName}%,last_name.ilike.%${fullName}%`)
      .order('last_name');
  }
  
  const { data } = await supabaseQuery;
  return data || [];
}
```

Search is fast (trigram index + tenant_id index) and returns within 100ms even on large patient lists.

### 2.5 The Patient Registration Flow

Two paths a patient enters RolDe:

**Path 1: Concierge creates patient**

In Caretaker / Concierge admin:
1. Click "+ New patient"
2. Modal opens with minimum-required fields: first_name, last_name, date_of_birth, sex_at_birth, contact (email or phone)
3. Optional fields collapsed under "Add more details"
4. On save: patient row created; welcome email triggered (Bible 0 §12.6); patient redirects flow into pre-consultation onboarding

**Path 2: Self-registration via public booking**

Embedded booking widget on tenant's external site (Bible 4.2 §7):
1. Patient picks service + slot
2. Provides minimum info (name, email, phone, DOB)
3. On submit: patient row created with `user_id = null`; booking confirmed; welcome email triggered with portal credentials
4. Patient activates portal account via email link
5. `user_id` populated; portal access enabled

Both paths converge on the same patient record + welcome email + onboarding flow.

### 2.6 The Patient Detail Page

`<subdomain>.rolde.app/patients/<id>`

This is NOT the consultation screen (Bible 4.2 §3). This is the patient's permanent record view, accessed when not actively consulting.

```
+-------------------------------------------------------------------+
|  [Patient avatar]  John Smith                                     |
|                    DOB 15 Mar 1962 (62y)  Male                    |
|                    NHS 1234567890   GP: Dr Watson, Edinburgh GP   |
|                                                                   |
|  Contact:  john.smith@email.com  • 07700 900123                   |
|  Address:  17 Bruntsfield Place, Edinburgh, EH10 4HN              |
|                                                                   |
|  ALLERGIES (1):     Penicillin (severe — anaphylaxis)             |
|  ALERTS (2):        Risk of falls  •  Anticoagulated (warfarin)   |
|                                                                   |
|  [Open consultation]    [Edit details]    [Patient portal access] |
+-------------------------------------------------------------------+
|                                                                   |
|  Tabs:  Timeline  •  Demographics  •  Allergies  •  Alerts        |
|         Appointments  •  Documents  •  Consents  •  Audit         |
|                                                                   |
|  [Tab content based on selection]                                 |
|                                                                   |
+-------------------------------------------------------------------+
```

The Timeline tab is the patient feed (§4). The other tabs are read-only views of structured data extracted from the feed plus dedicated tables (allergies, alerts, etc.).

### 2.7 The Demographics Update Audit

Every change to demographic fields is audit-logged with before/after diff (Bible 4.1 §5.4 standard pattern). Demographics changed by patient self-service (via patient portal) flagged as such in audit log.

---

## 3. The Calendar and Scheduling Module

The calendar is the Concierge's primary surface and underpins the dashboard's "Today's patients" list (Bible 4.2 §6.2).

### 3.1 The Appointment Schema

```sql
CREATE TYPE appointment_status AS ENUM (
  'scheduled', 'confirmed', 'arrived', 'in_progress', 'completed',
  'cancelled', 'no_show', 'rescheduled'
);

CREATE TYPE appointment_source AS ENUM (
  'walk_in', 'phone', 'email', 'public_booking', 'patient_portal',
  'referral', 'follow_up', 'recurring'
);

CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  clinician_id   UUID NOT NULL REFERENCES auth.users(id),
  
  -- Time
  scheduled_start   TIMESTAMPTZ NOT NULL,
  scheduled_end     TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER NOT NULL,
  
  -- Service
  service_type      TEXT NOT NULL,                    -- Tenant-defined; e.g. 'driver_medical', 'botox_consultation'
  service_id        UUID REFERENCES services(id),    -- Optional FK to services catalogue
  
  -- Status
  status            appointment_status NOT NULL DEFAULT 'scheduled',
  
  -- Booking source
  source            appointment_source NOT NULL,
  
  -- Notes
  reason            TEXT,                             -- Patient-stated reason
  notes             TEXT,                             -- Concierge or clinician notes
  
  -- Linkage
  parent_appointment_id  UUID REFERENCES appointments(id),  -- For follow-ups (links to original)
  rescheduled_from_id    UUID REFERENCES appointments(id),  -- For rescheduled (links to original)
  
  -- Time tracking
  arrived_at        TIMESTAMPTZ,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancelled_by      UUID REFERENCES auth.users(id),
  cancelled_reason  TEXT,
  
  -- Payment
  fee_charged_pence INTEGER,                          -- For private clinics; NULL for NHS
  payment_status    TEXT,                             -- 'pending' | 'paid' | 'refunded' | 'no_charge'
  payment_intent_id TEXT,                             -- Stripe Payment Intent ID
  
  -- Standard columns
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID REFERENCES auth.users(id),
  
  CONSTRAINT end_after_start CHECK (scheduled_end > scheduled_start),
  CONSTRAINT duration_matches CHECK (
    EXTRACT(EPOCH FROM (scheduled_end - scheduled_start)) = duration_minutes * 60
  )
);

CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, scheduled_start) WHERE status NOT IN ('cancelled');
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_clinician_date ON appointments(clinician_id, scheduled_start);
```

### 3.2 The Services Catalogue

Each tenant defines the services they offer (per Bible 4.3 §2.5 — onboarding step).

```sql
CREATE TABLE services (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  slug              TEXT NOT NULL,                    -- 'driver_medical', 'botox_consultation'
  display_name      TEXT NOT NULL,                    -- 'Driver Medical Assessment'
  description       TEXT,
  
  duration_minutes  INTEGER NOT NULL,
  buffer_before_min INTEGER NOT NULL DEFAULT 0,
  buffer_after_min  INTEGER NOT NULL DEFAULT 0,
  
  fee_pence         INTEGER,                          -- Standard fee for this service; NULL = variable
  
  -- Permission
  requires_role          user_role[] NOT NULL DEFAULT ARRAY['clinician', 'locum'],
  requires_specialty     TEXT[],
  available_to_public    BOOLEAN NOT NULL DEFAULT true,  -- Show in public booking widget
  
  -- Pre-consultation
  consent_form_ids       UUID[],                      -- Bible 6 detail; consent forms required for this service
  pre_consultation_form  TEXT,                        -- Form template ID
  
  status            TEXT NOT NULL DEFAULT 'active',   -- 'active' | 'archived'
  display_order     INTEGER NOT NULL DEFAULT 0,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tenant_id, slug)
);
```

### 3.3 The Calendar Views

The calendar surface has multiple views:

| View | Purpose | Default For |
|---|---|---|
| Day | Today's appointments, clinician-by-clinician columns | Clinicians on dashboard |
| Week | Week-at-a-glance, clinician-by-clinician | Concierges, Caretakers |
| Month | Month-overview, all appointments | Caretakers (planning view) |
| Clinician | Single clinician's day, hour-by-hour grid | Locums, single-clinician clinics |
| Resource | Bed/room/chair occupancy (for inpatient/treatment-room clinics) | Clinic types with rooms (per Bible 4.3 §5.5 module config) |

DESIGN NEEDED: Calendar grid component visual treatment — Roland to specify whether shadcn/ui calendar suffices or custom.

### 3.4 The Slot Availability Algorithm

When a patient books an appointment (via public widget or admin), available slots are computed by:

1. Filter to clinicians with the required role/specialty for the chosen service
2. For each candidate clinician:
   a. Get their working hours (per `tenants.config.scheduling` + their personal availability overrides)
   b. Subtract approved absences (from `absence_requests` table per Bible 4.3 §8.2)
   c. Subtract existing appointments
   d. Subtract buffer time (before/after each existing appointment per service config)
   e. Generate available slots aligned to the service's duration + buffer
3. Combine slots across clinicians (or show per-clinician if "Specific clinician" selected)
4. Filter to slots starting >= now + minimum-booking-notice (per tenant config)
5. Return up to N earliest slots

### 3.5 The Appointment Lifecycle

```
[scheduled] ────cancel──→ [cancelled]
    |
    |  patient confirms (24h before, via reminder)
    ↓
[confirmed] ────cancel──→ [cancelled]
    |
    |  patient arrives at clinic
    ↓
[arrived]
    |
    |  clinician opens consultation
    ↓
[in_progress]
    |
    |  clinician completes consultation
    ↓
[completed]
```

Two off-path states:
- `[no_show]` — set automatically by background job 30 min after scheduled_end if status still in [scheduled, confirmed]
- `[rescheduled]` — original appointment marked rescheduled; new appointment created with `rescheduled_from_id` link

### 3.6 The Reminder System

Background job (pg_cron daily) sends appointment reminders:

- **48 hours before**: Email reminder with link to confirm or reschedule (links to patient portal)
- **24 hours before**: SMS reminder (if phone provided + tenant has SMS module enabled)
- **Day of**: Optional 2-hour-before SMS for premium tier

Reminder content tenant-configurable in Caretaker admin.

### 3.7 The No-Show Handling

When marked `no_show`:
- Patient's no-show count incremented (cached on patient record)
- After 3 consecutive no-shows: continuous monitoring service flags patient (see §8)
- Tenant config can require deposit for future bookings from frequent no-show patients (Phase 2)

### 3.8 The Cancellation Policy

Cancellation rules per tenant config:
- Cutoff time (e.g. 48h before): full refund, free reschedule
- Within cutoff: tenant policy (no refund / partial / full / case-by-case)
- Last-minute (< 2h before): typically no refund (counts as no-show economically)

The patient portal enforces these policies UI-side; the backend confirms before processing refund.

---

## 4. The Clinical Notes Module (The Patient Feed)

The clinical heart of RolDe. Bible 4.0 Principle 7 — *one canonical view of the patient*. Bible 4.2 §4 specifies the visual treatment. This section specifies the data and behaviour.

### 4.1 The Feed Entry Schema

A single polymorphic table holds all feed entry types. The `entry_type` column dictates what the `payload` JSONB contains.

```sql
CREATE TYPE feed_entry_type AS ENUM (
  'clinical_note',
  'vital_signs',
  'prescription',
  'lab_order',
  'lab_result',
  'radiology_order',
  'radiology_result',
  'photo_set',
  'consent_signed',
  'referral_letter',
  'discharge_summary',
  'sick_note',
  'gp_letter',
  'scanned_document',
  'ai_promotion',
  'consultation_summary',
  'appointment_record',
  'allergy_recorded',
  'alert_recorded'
);

CREATE TABLE patient_feed_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  entry_type        feed_entry_type NOT NULL,
  
  -- Polymorphic payload — schema varies by entry_type
  payload           JSONB NOT NULL,
  
  -- Context
  appointment_id    UUID REFERENCES appointments(id),  -- If created during a specific appointment
  consultation_id   UUID,                              -- Logical session ID for grouping entries from one consultation
  
  -- Status (varies in meaning by entry_type)
  status            TEXT NOT NULL DEFAULT 'active',
  
  -- Linked resources
  document_url      TEXT,                              -- For entries with attached PDFs/images
  related_entry_id  UUID REFERENCES patient_feed_entries(id),  -- e.g. result linked to its order
  
  -- Standard universal columns
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID REFERENCES auth.users(id),
  updated_by        UUID REFERENCES auth.users(id),
  deleted_at        TIMESTAMPTZ,
  deleted_by        UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_feed_patient_chronological ON patient_feed_entries(patient_id, created_at)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_feed_tenant_type ON patient_feed_entries(tenant_id, entry_type, created_at);
CREATE INDEX idx_feed_consultation ON patient_feed_entries(consultation_id) WHERE consultation_id IS NOT NULL;
CREATE INDEX idx_feed_appointment ON patient_feed_entries(appointment_id) WHERE appointment_id IS NOT NULL;

-- Full-text search
CREATE INDEX idx_feed_search ON patient_feed_entries USING gin (
  to_tsvector('english', COALESCE(payload->>'text', '') || ' ' || COALESCE(payload->>'title', ''))
);

-- RLS
ALTER TABLE patient_feed_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON patient_feed_entries
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
```

### 4.2 The Payload Schemas Per Entry Type

Each entry type has a defined Zod schema for its `payload` column:

```typescript
// packages/db/types/feed-payloads.ts

export const ClinicalNotePayload = z.object({
  text: z.string(),  // The note content (markdown supported)
  word_count: z.number().int(),
});

export const VitalSignsPayload = z.object({
  temperature_c: z.number().nullable(),
  heart_rate_bpm: z.number().int().nullable(),
  respiratory_rate: z.number().int().nullable(),
  blood_pressure_systolic: z.number().int().nullable(),
  blood_pressure_diastolic: z.number().int().nullable(),
  spo2_percent: z.number().int().nullable(),
  consciousness_level: z.enum(['alert', 'voice', 'pain', 'unresponsive']).nullable(),
  news2_score: z.number().int().nullable(),
});

export const PrescriptionPayload = z.object({
  drug_name: z.string(),
  drug_form: z.string(),  // 'tablet', 'capsule', 'liquid', etc.
  strength: z.string(),  // '500mg'
  dose: z.string(),  // '1 tablet'
  frequency: z.string(),  // 'TDS', 'BD', 'OD'
  duration: z.string(),  // '7 days', 'until reviewed'
  quantity: z.string(),  // '21 tablets'
  indication: z.string(),
  prescriber_id: z.string().uuid(),
  prescriber_gmc: z.string(),
  routing: z.enum(['nhs_pharmacy', 'private_pharmacy', 'clinic_stock', 'patient_print']),
  pharmacy_id: z.string().uuid().nullable(),
  status: z.enum(['draft', 'approved', 'sent', 'dispensed', 'cancelled']),
});

export const LabOrderPayload = z.object({
  tests: z.array(z.string()),  // ['FBC', 'U&E', 'CRP']
  provider_id: z.string().uuid().nullable(),
  urgency: z.enum(['routine', 'urgent', 'emergency']),
  clinical_indication: z.string(),
  fasting_required: z.boolean(),
  status: z.enum(['draft', 'sent', 'collected', 'received', 'reviewed']),
});

export const LabResultPayload = z.object({
  order_id: z.string().uuid(),  // Links back to the order
  results: z.array(z.object({
    name: z.string(),  // 'WCC', 'Neutrophils'
    value: z.string(),  // '18.4'
    unit: z.string(),  // 'x10^9/L'
    reference_range: z.string(),  // '4-11'
    flag: z.enum(['normal', 'low', 'high', 'critical']).nullable(),
  })),
  ai_synthesis: z.string().nullable(),  // RolDe's interpretation, e.g. "Acute infection picture..."
  reviewed_by: z.string().uuid().nullable(),
  reviewed_at: z.string().datetime().nullable(),
});

export const PhotoSetPayload = z.object({
  set_type: z.enum(['five_photo', 'three_photo', 'custom']),
  photos: z.array(z.object({
    angle: z.enum(['frontal', 'left_oblique', 'left_lateral', 'right_oblique', 'right_lateral']),
    raw_url: z.string().url(),
    watermarked_url: z.string().url(),
    annotations: z.array(z.object({
      x: z.number(),
      y: z.number(),
      text: z.string(),
    })).optional(),
  })),
  comparison_to_set_id: z.string().uuid().nullable(),  // Link to before set if this is after
  procedure_session: z.string().nullable(),  // 'Botox session 1', 'Filler week 4 review'
});

export const ConsentSignedPayload = z.object({
  consent_id: z.string().uuid(),  // Links to consent_forms_signed table
  consent_name: z.string(),  // 'Botox consultation consent'
  signed_pdf_url: z.string().url(),
  signed_at: z.string().datetime(),
  signed_via: z.enum(['portal', 'in_clinic', 'paper_uploaded']),
});

export const ReferralLetterPayload = z.object({
  letter_id: z.string().uuid(),  // Links to letters table (§5)
  specialty: z.string(),
  recipient_type: z.enum(['rolde_network', 'external_email', 'paper_print']),
  recipient_clinic: z.string().nullable(),
  recipient_clinician: z.string().nullable(),
  pdf_url: z.string().url().nullable(),
  status: z.enum(['draft', 'approved', 'sent', 'acknowledged', 'failed']),
});

export const AIPromotionPayload = z.object({
  rolde_says: z.string(),  // The full AI content as promoted (may have been edited by clinician)
  citations: z.array(z.object({
    source: z.string(),  // 'NICE NG109'
    section: z.string(),
    url: z.string().url().nullable(),
  })),
  promoted_from_card_id: z.string().uuid(),  // Links back to the AI panel card
});

// ... (additional schemas for other entry types)
```

### 4.3 The Feed Insert Server Action

A single server action handles inserting any feed entry type:

```typescript
// src/lib/feed/insert.ts
'use server';

export async function insertFeedEntry(input: {
  patientId: string;
  entryType: FeedEntryType;
  payload: object;  // Validated against schema by entry_type
  appointmentId?: string;
  consultationId?: string;
  documentUrl?: string;
  relatedEntryId?: string;
}): Promise<FeedEntry> {
  const user = await auth.requireUser();
  const { tenantId } = await getTenantContext();
  
  // Verify caller can write feed entries for this patient
  if (!await canWriteClinicalNotes(user.id, tenantId, input.patientId)) {
    throw new Error('Forbidden');
  }
  
  // Validate payload against schema
  const schema = FeedPayloadSchemas[input.entryType];
  const validatedPayload = schema.parse(input.payload);
  
  // Insert
  const { data: entry, error } = await supabase
    .from('patient_feed_entries')
    .insert({
      tenant_id: tenantId,
      patient_id: input.patientId,
      entry_type: input.entryType,
      payload: validatedPayload,
      appointment_id: input.appointmentId || null,
      consultation_id: input.consultationId || null,
      document_url: input.documentUrl || null,
      related_entry_id: input.relatedEntryId || null,
      created_by: user.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Audit log
  await auditLog({
    tenantId,
    actorUserId: user.id,
    action: `feed_entry.${input.entryType}.create`,
    resourceType: 'feed_entry',
    resourceId: entry.id,
    afterState: entry,
  });
  
  // Trigger downstream effects (e.g. AI panel notification, continuous monitoring)
  await notifyFeedEntryCreated(entry);
  
  return entry;
}
```

### 4.4 The Feed Query Patterns

Loading the feed for a patient (used by the consultation screen and patient detail Timeline tab):

```typescript
// src/lib/feed/load.ts
export async function loadPatientFeed(
  patientId: string,
  options: {
    limit?: number;          // Default 20
    cursorEntryId?: string;  // For loading older entries
    entryTypes?: FeedEntryType[];  // Filter
  } = {}
): Promise<{ entries: FeedEntry[]; hasMore: boolean }> {
  const { tenantId } = await getTenantContext();
  
  let query = supabase
    .from('patient_feed_entries')
    .select('*, created_by:auth.users(id, raw_user_meta_data)')
    .eq('patient_id', patientId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })  // Oldest first for iMessage direction
    .limit(options.limit ?? 20);
  
  if (options.cursorEntryId) {
    // Load entries OLDER than the cursor (for scroll-up pagination)
    const { data: cursor } = await supabase
      .from('patient_feed_entries')
      .select('created_at')
      .eq('id', options.cursorEntryId)
      .single();
    
    if (cursor) {
      query = query.lt('created_at', cursor.created_at);
    }
  }
  
  if (options.entryTypes?.length) {
    query = query.in('entry_type', options.entryTypes);
  }
  
  const { data: entries } = await query;
  
  return {
    entries: entries || [],
    hasMore: (entries?.length ?? 0) === (options.limit ?? 20),
  };
}
```

### 4.5 The Feed Real-Time Updates

When a new entry is added to a patient's feed during an active consultation, the consultation screen receives the update via Supabase Realtime (Bible 4.1 §9):

```typescript
// In the consultation screen client component
useEffect(() => {
  const channel = supabase
    .channel(`patient_feed:${patientId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'patient_feed_entries',
        filter: `patient_id=eq.${patientId}`
      },
      (payload) => {
        addEntryToFeed(payload.new as FeedEntry);
        scrollFeedToBottom();  // Maintain iMessage auto-scroll behaviour
      }
    )
    .subscribe();
  
  return () => { channel.unsubscribe(); };
}, [patientId]);
```

### 4.6 The Feed Edit and Delete

**Editing a feed entry**: not all entries are editable. Editability rules:

| Entry Type | Editable By | Window |
|---|---|---|
| Clinical note | Author | Within 24h of creation |
| Vital signs | Author | Within 24h |
| Prescription | Author | Only while status='draft'; after 'approved' is immutable |
| Lab order / Radiology order | Author | Only while status='draft' |
| Photos | Author | Annotations editable forever; photos themselves are immutable |
| Consents | Never editable | — |
| Referral letter | Author | Only while status='draft' |
| AI promotion | Author | Within 24h |

Edits are versioned — old version retained in `feed_entry_versions` table:

```sql
CREATE TABLE feed_entry_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id      UUID NOT NULL REFERENCES patient_feed_entries(id) ON DELETE CASCADE,
  payload       JSONB NOT NULL,
  edited_by     UUID NOT NULL REFERENCES auth.users(id),
  edited_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edit_reason   TEXT
);
```

**Deleting a feed entry**: Soft delete only (Bible 4.1 §5.3). Deleted entries hidden from default queries but visible to Caretaker audit view ("Show deleted" toggle in Bible 4.2 §4.4).

Hard delete is reserved for: GDPR right-to-erasure + Custodian-initiated cleanup. Always audit-logged with reason.

### 4.7 The Consultation Session Grouping

Entries created during a single consultation share a `consultation_id` (UUID generated when consultation opens). This enables:

- "Show only this consultation's entries" filter
- Discharge summary auto-generation from a consultation's entries (per §5)
- Consultation analytics (duration, entries created, AI usage)

Consultation lifecycle:
1. Clinician opens patient → `consultation_id` UUID generated
2. All entries created during this session tagged with this UUID
3. Clinician closes consultation (explicit "End consultation" or auto-timeout after 4h)
4. Background job creates a `consultation_summary` feed entry summarising what happened

---

## 5. The Letters Module

Bible 0 §12.8 / Bible 4.0 §12.8 commit to letter generation being intelligent, NOT user-templated. This module operationalises that.

### 5.1 The Letters Table

```sql
CREATE TYPE letter_type AS ENUM (
  'referral',
  'discharge_summary',
  'gp_letter',
  'sick_note',
  'fit_for_work',
  'medical_report',
  'specialist_letter',
  'patient_summary',
  'school_letter',
  'employer_letter',
  'insurance_letter',
  'other'
);

CREATE TYPE letter_status AS ENUM (
  'drafting',     -- AI generating
  'draft_ready',  -- AI completed, awaiting clinician review
  'reviewing',    -- Clinician currently editing
  'approved',     -- Clinician approved, awaiting send
  'sending',      -- In transit
  'sent',         -- Successfully delivered
  'failed',       -- Delivery failed
  'acknowledged', -- Recipient confirmed receipt (RolDe-network only)
  'cancelled'     -- Cancelled before sending
);

CREATE TABLE letters (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  
  -- Type
  letter_type       letter_type NOT NULL,
  
  -- Recipient
  recipient_type    TEXT NOT NULL,  -- 'rolde_network' | 'external_email' | 'paper_print' | 'patient_only'
  recipient_clinic_tenant_id  UUID REFERENCES tenants(id),  -- For rolde_network type
  recipient_email             TEXT,                          -- For external_email type
  recipient_name              TEXT NOT NULL,
  recipient_address_lines     TEXT[],                        -- For paper printing
  
  -- Specialty (for referrals)
  specialty         TEXT,
  
  -- Content
  subject           TEXT NOT NULL,
  body_markdown     TEXT NOT NULL,                          -- AI-generated, clinician-edited
  body_html         TEXT,                                   -- Rendered for display/PDF
  
  -- Source data referenced
  consultation_id   UUID,                                   -- The consultation this letter was generated from
  source_entry_ids  UUID[],                                 -- Specific feed entries referenced (notes, results, plans)
  
  -- AI provenance
  ai_drafted_at     TIMESTAMPTZ,                            -- When AI completed initial draft
  ai_model_version  TEXT,                                   -- Which model version drafted it
  
  -- Approval
  status            letter_status NOT NULL DEFAULT 'drafting',
  drafted_by        UUID REFERENCES auth.users(id),         -- Clinician (can be different from approving)
  approved_by       UUID REFERENCES auth.users(id),
  approved_at       TIMESTAMPTZ,
  
  -- Delivery
  pdf_url           TEXT,                                   -- Generated PDF in storage
  sent_at           TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  acknowledged_at   TIMESTAMPTZ,                            -- For RolDe-network: receiving Caretaker acknowledgment
  
  -- Failure handling
  failure_reason    TEXT,
  retry_count       INTEGER NOT NULL DEFAULT 0,
  
  -- Standard columns
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID REFERENCES auth.users(id),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_letters_tenant_status ON letters(tenant_id, status);
CREATE INDEX idx_letters_patient ON letters(patient_id);
CREATE INDEX idx_letters_consultation ON letters(consultation_id) WHERE consultation_id IS NOT NULL;
```

### 5.2 The Letter Drafting Flow

When the AI infers a letter is needed (per Bible 4.0 §9.1 — AI drafts everything autonomously):

1. AI server (Bible 4.7) detects letter need from consultation context
2. AI server calls letter-drafting subroutine with context (patient, clinical situation, target recipient)
3. AI server posts back to RolDe web app: "Letter draft ready — entry_id X for patient Y"
4. RolDe web app creates `letters` row with status `draft_ready`
5. AI panel surfaces a card: "Referral letter to Rheumatology drafted — review and approve"
6. Clinician clicks card → letter opens in modal for review
7. Clinician edits as needed (full markdown editor)
8. Clinician clicks "Approve and send"
9. Status → `approved`; sending pipeline triggers (§5.4)

### 5.3 The Letter Review Modal

```
+-------------------------------------------------------------------+
|  Referral Letter — Rheumatology                              [X] |
|  For: John Smith (DOB 15 Mar 1962)                                |
|  To: Edinburgh Rheumatology Clinic                                |
+-------------------------------------------------------------------+
|                                                                   |
|  TO:        Dr Sarah Jones                                        |
|             Edinburgh Rheumatology Clinic                         |
|             rolde:edinrheum.rolde.app                             |
|                                                                   |
|  SUBJECT:   [Acute gout flare — request for assessment______]    |
|                                                                   |
|  ─────────────────────────────────────────────────────────────    |
|                                                                   |
|  Dear Dr Jones,                                                   |
|                                                                   |
|  I would be grateful if you could see Mr John Smith, a 62-year-   |
|  old man with a presentation suggestive of acute gout flare...    |
|                                                                   |
|  HISTORY:                                                         |
|  - Sudden onset L 1st MTP joint pain overnight                    |
|  - Severity 9/10, woke from sleep                                 |
|  - First episode                                                  |
|  - No trauma                                                       |
|                                                                   |
|  EXAMINATION:                                                     |
|  - L 1st MTP red, hot, swollen                                    |
|  - Range of movement severely limited                             |
|  - No other joints affected                                       |
|                                                                   |
|  INVESTIGATIONS:                                                   |
|  - Serum uric acid: 0.52 mmol/L (raised)                          |
|  - WCC 11.2, CRP 32, U&E normal                                   |
|                                                                   |
|  PLAN:                                                            |
|  Started on naproxen 500mg BD with PPI cover. Patient advised on  |
|  hydration and dietary modification.                              |
|                                                                   |
|  I would value your assessment for ongoing management and any     |
|  recommendation for urate-lowering therapy.                       |
|                                                                   |
|  Many thanks,                                                     |
|                                                                   |
|  Dr Roland Jayasekhar                                             |
|  Doc For Skin (acting in capacity of urgent care)                 |
|                                                                   |
|  ─────────────────────────────────────────────────────────────    |
|                                                                   |
|  Citations used:                                                   |
|  • NICE CKS Gout (April 2026)                                     |
|  • eMC SmPC Naproxen                                              |
|                                                                   |
|  [Edit content]   [Approve and send →]   [Save as draft]   [X]    |
|                                                                   |
+-------------------------------------------------------------------+
```

The letter is editable inline (markdown). Clinician edits become tracked changes — original AI version retained for audit, edited version sent.

### 5.4 The Letter Sending Pipeline

When status → `approved`, pipeline triggers via Edge Function `send_letter`:

```typescript
// supabase/functions/send_letter/index.ts
export async function sendLetter(letterId: string) {
  const { data: letter } = await supabase
    .from('letters')
    .select('*')
    .eq('id', letterId)
    .single();
  
  if (letter.status !== 'approved') return;
  
  // Update status to sending
  await supabase.from('letters').update({ status: 'sending' }).eq('id', letterId);
  
  // Generate PDF
  const pdfUrl = await generateLetterPDF(letter);
  await supabase.from('letters').update({ pdf_url: pdfUrl }).eq('id', letterId);
  
  // Route based on recipient type
  switch (letter.recipient_type) {
    case 'rolde_network':
      await deliverViaRoldeNetwork(letter);
      break;
    case 'external_email':
      await deliverViaEmail(letter, pdfUrl);
      break;
    case 'paper_print':
      // Mark ready for clinician to print physically
      await supabase.from('letters').update({ status: 'sent', sent_at: new Date() }).eq('id', letterId);
      break;
    case 'patient_only':
      // Push to patient portal
      await deliverToPatientPortal(letter);
      break;
  }
}
```

### 5.5 The PDF Generation

Letters render to PDF using a server-side PDF library (e.g. Puppeteer headless Chrome or React-PDF):

- Template: tenant logo + clinic header + body content + clinician signature block + clinic footer
- A4 portrait orientation
- Standard medical letter format (per RCGP / NHS letter guidance)
- Embedded fonts (Inter for body, IBM Plex Serif for headers — Bible 0)
- Stored in `letter-pdfs` bucket per Bible 4.1 §8.2

DESIGN NEEDED: Letter PDF template visual design — Roland to design header/footer treatment.

### 5.6 The Discharge Summary Auto-Generation

When a consultation ends, the AI generates a discharge summary automatically (drafts it; clinician approves it):

1. Consultation closes
2. Background job triggers
3. AI reads all feed entries from this consultation_id
4. AI drafts discharge summary in standard format
5. Letter row created with status `draft_ready`
6. Clinician notified via dashboard or email (per tenant config)
7. Clinician reviews, approves, sends (typically to patient's GP)

The pattern is identical to the referral letter pattern; only the letter_type differs.

---

## 6. The Closed-Loop Referral Pipeline (Flagship)

The architectural commitment that distinguishes RolDe from every other EMR. Bible 4.0 §10.2 specifies six steps. This section operationalises them.

### 6.1 The Pipeline Sequence

```
[1. Trigger detection]
        ↓
[2. Letter generation]
        ↓
[3. Clinician approval]  ← THE GATE
        ↓
[4. Delivery (closed loop)]
        ↓
[5. Appointment intelligence] (in-network only)
        ↓
[6. Patient communication]
```

### 6.2 Step 1 — Trigger Detection

Implemented in Bible 4.7 (AI module). High-level: as the clinician types and the AI builds the working assessment, the AI infers from the plan (e.g. "rheumatology follow-up") that a referral is required.

The AI emits a structured trigger:

```typescript
interface ReferralTrigger {
  patient_id: string;
  consultation_id: string;
  specialty: string;
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  source_entry_ids: string[];  // The feed entries justifying the referral
}
```

This trigger lands in a `referral_triggers` queue (table or message bus) for the next step.

### 6.3 Step 2 — Letter Generation

The AI's letter-drafting subroutine consumes the trigger and produces a draft letter (per §5.2). The letter is created with status `draft_ready` and linked to the consultation.

Recipient resolution: the system checks the tenant's letter_routing config (Bible 4.3 §5.9) for the specialty and resolves to one of:
- An in-network RolDe tenant (e.g. `edinrheum.rolde.app`)
- An external email address (e.g. `rheum.referrals@nhsforth.scot.nhs.uk`)
- Paper-print fallback (no electronic recipient configured)

### 6.4 Step 3 — Clinician Approval (THE GATE)

The constitutional commitment (Bible 4.0 §4.3): RolDe sends nothing autonomously. The clinician must approve.

The AI panel surfaces a card:

```
+-----------------------------------------+
|  [intent icon] Referral drafted         |
+-----------------------------------------+
|                                         |
|  A referral letter to Rheumatology has  |
|  been drafted based on this consultation. |
|                                         |
|  Recipient: Edinburgh Rheumatology      |
|  (in-network — RolDe will arrange       |
|   appointment)                          |
|                                         |
+-----------------------------------------+
|  [Review & approve]  [Edit]  [Dismiss]  |
+-----------------------------------------+
```

Clicking "Review & approve" opens the letter review modal (§5.3). On approval:
- Letter status → `approved`
- Approval audit-logged
- Sending pipeline triggers

If the clinician dismisses the card, the trigger is logged but no letter is sent. The clinician can manually generate a referral later if circumstances change.

### 6.5 Step 4 — Delivery (Closed Loop)

**For in-network delivery (recipient_type = 'rolde_network')**:

1. Edge Function `deliver_via_rolde_network` invoked
2. Verifies receiving tenant exists and is active
3. Verifies receiving Caretaker has accepted "receivership of referral letters" from sending tenant (per Bible 4.3 §5.9 institutional consent)
4. If acceptance not yet given: status → `failed`, sending Caretaker notified, prompt to either configure relationship or fall back to email
5. If accepted: creates a `incoming_referral` record in receiving tenant's database; receiving tenant's notifications system fires; receiving clinician sees in their dashboard

```sql
CREATE TABLE incoming_referrals (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receiving_tenant_id           UUID NOT NULL REFERENCES tenants(id),
  
  -- Source
  sending_tenant_id             UUID NOT NULL REFERENCES tenants(id),
  sending_letter_id             UUID NOT NULL,  -- Reference ID; not FK because cross-tenant
  sending_clinician_name     TEXT NOT NULL,
  sending_clinician_gmc      TEXT,
  
  -- Patient (cross-tenant data — no FK)
  patient_first_name            TEXT NOT NULL,
  patient_last_name             TEXT NOT NULL,
  patient_dob                   DATE NOT NULL,
  patient_nhs_number            TEXT,
  patient_email                 TEXT,
  patient_phone                 TEXT,
  
  -- Referral content
  specialty                     TEXT NOT NULL,
  reason                        TEXT,
  urgency                       TEXT NOT NULL,
  letter_subject                TEXT NOT NULL,
  letter_body_markdown          TEXT NOT NULL,
  pdf_url                       TEXT NOT NULL,
  
  -- Receiving tenant action
  status                        TEXT NOT NULL DEFAULT 'pending',
    -- 'pending' | 'acknowledged' | 'accepted' | 'declined' | 'patient_created' | 'appointment_offered'
  
  acknowledged_by               UUID REFERENCES auth.users(id),
  acknowledged_at               TIMESTAMPTZ,
  
  receiving_patient_id          UUID,  -- Patient row created in receiving tenant
  appointment_id                UUID,  -- Appointment offered/scheduled
  
  decline_reason                TEXT,
  
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Critical: this table holds patient demographics in the receiving tenant's database, but ONLY for the purpose of processing the referral. Once accepted, the receiving tenant creates its own `patients` row. Patient identity is not federated (Bible 4.1 §3.6).

**For external email delivery (recipient_type = 'external_email')**:

1. Edge Function `deliver_via_email` invoked
2. PDF attached to email (with optional password protection per tenant policy)
3. Sent via Resend (Bible 4.1 §2.1) to configured recipient address
4. Status → `sent` on successful send
5. If bounce: status → `failed`, retry up to 3 times with exponential backoff
6. After 3 failures: notify Caretaker, prompt for alternative routing

**For paper-print fallback (recipient_type = 'paper_print')**:

1. PDF generated and stored
2. Status → `sent` (assumed delivered when clinician hands it to patient)
3. Audit log notes paper delivery

### 6.6 Step 5 — Appointment Intelligence

For in-network referrals only:

1. Receiving tenant's incoming_referrals shows status `pending`
2. Receiving clinician / Concierge reviews
3. Either accepts (creates patient + offers appointment slots) or declines (with reason)
4. If accepts: receiving tenant's calendar surfaces available slots
5. Available slots are fed back to sending tenant via the network protocol
6. Sending clinician sees in their AI panel: "Edinburgh Rheumatology has 3 slots available: Tue 14 May 14:30, Wed 15 May 09:00, Thu 16 May 11:00"
7. Sending clinician can share with patient before they leave the consultation
8. Sending clinician (or patient via portal) selects a slot
9. Receiving tenant locks the slot; appointment created

This is the magic. The patient walks out of Doc For Skin knowing they have a Rheumatology appointment Wednesday at 9am.

### 6.7 Step 6 — Patient Communication

Once appointment is confirmed:

1. Patient receives email + SMS (per their preferred_contact) with appointment details
2. Receiving clinic's patient portal credentials sent (if patient doesn't already have an account at the receiving tenant)
3. Sending clinic's record updated: referral status `acknowledged`
4. Both tenants' audit logs capture the cross-tenant flow

Patient experience: minimal friction. They didn't have to call anyone, navigate any waiting list, or fill out any forms. The system did it.

### 6.8 The Network Acceptance Flow

For two RolDe tenants to refer to each other, mutual acceptance must be configured:

1. Sending Caretaker configures receiving tenant in Letter Routing settings (Bible 4.3 §5.9)
2. Sending Caretaker sees: "Status: Pending receiving clinic acceptance"
3. Receiving Caretaker receives notification: "Doc For Skin (Edinburgh) has requested to refer rheumatology patients to your clinic. Accept?"
4. Receiving Caretaker reviews sending clinic's profile, accepts (or declines)
5. Once accepted, both tenants can refer/receive between each other

This is institutional consent (Bible 4.0 §10.1, Bible 4.3 §6.5). Patient consent for each individual referral is captured at consultation time (clinician's approval implicitly includes patient agreement; patient consent forms can be required by Caretaker config).

### 6.9 The Network Decline / Revocation

A receiving Caretaker can decline future referrals from a sending clinic at any time:

- Sets status of relationship to `declined`
- Existing in-flight referrals continue to be processed
- New referrals from that sending tenant are rejected at delivery with friendly message: "This receiving clinic is no longer accepting referrals via RolDe. Try alternative routing."

Symmetric: sending Caretaker can revoke a relationship if the receiving clinic is providing poor service.

---

## 7. The OCR Pipeline (Incoming Scanned Documents)

Per Bible 0 §8.9 / Bible 4.0 §3.3 — incoming scanned documents from external clinics get OCR'd into the patient feed as searchable text rather than opaque PDFs.

### 7.1 The Upload Flow

1. Clinician (or staff) uploads a PDF or image (typically a scanned letter from another hospital)
2. File lands in `patient-documents` bucket (Bible 4.1 §8.2)
3. Edge Function `ocr_uploaded_document` triggered
4. OCR extracts text via Gemma 4 multimodal (Phase 1.5) or Tesseract fallback (Phase 1)
5. Structured feed entry created with type `scanned_document`
6. Original PDF preserved; extracted text searchable

### 7.2 The Schema

```sql
-- The feed entry payload for scanned_document type
{
  "original_filename": "edinburgh_rheum_letter_15_may_2026.pdf",
  "uploaded_at": "2026-05-15T14:32:00Z",
  "ocr_extracted_text": "Dear Dr Jayasekhar, Thank you for referring...",
  "ocr_confidence": 0.94,  // 0.0-1.0; flag low confidence for manual review
  "ai_summary": "Rheumatology assessment confirms acute gout. Recommends urate-lowering therapy at 6-week mark.",
  "ai_key_findings": [
    "Diagnosis: Acute gout, R 1st MTP",
    "Plan: Allopurinol 100mg OD increasing to 300mg",
    "Follow-up: 6 weeks"
  ],
  "document_type": "specialist_letter",  // AI-classified
  "source_clinic": "Edinburgh Rheumatology Clinic",  // AI-extracted
  "document_date": "2026-05-15"
}
```

### 7.3 The OCR Quality Handling

OCR is imperfect. Quality safeguards:

- **Confidence threshold**: if OCR confidence < 0.85, the feed entry shows a warning: "Low-confidence OCR extraction — please review for accuracy"
- **Original always available**: clicking the entry shows the original PDF/image alongside extracted text
- **Manual correction**: clinician can edit the extracted text (changes audit-logged)
- **Re-run OCR**: if quality is poor, clinician can re-run with a different engine

### 7.4 The OCR Implementation (Phase 1)

Phase 1 uses Tesseract (open-source, free, local processing on Edge Function or AI server):

```typescript
// supabase/functions/ocr_uploaded_document/index.ts
import Tesseract from 'tesseract.js';

export async function ocrDocument(documentUrl: string, patientId: string, tenantId: string) {
  // Download document
  const response = await fetch(documentUrl);
  const buffer = await response.arrayBuffer();
  
  // OCR
  const { data } = await Tesseract.recognize(Buffer.from(buffer), 'eng', {
    logger: m => console.log(m)
  });
  
  // If PDF, may need to render pages first; Phase 1.5 will use Gemma 4 vision
  
  // Submit extracted text to AI server for summary + classification
  const aiResponse = await fetch(`${process.env.ROLDE_AI_SERVER_URL}/v1/document-analysis`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.ROLDE_AI_SERVER_API_KEY}` },
    body: JSON.stringify({ text: data.text }),
  });
  
  const analysis = await aiResponse.json();
  
  // Create feed entry
  await insertFeedEntry({
    patientId,
    entryType: 'scanned_document',
    payload: {
      original_filename: documentUrl.split('/').pop(),
      uploaded_at: new Date().toISOString(),
      ocr_extracted_text: data.text,
      ocr_confidence: data.confidence / 100,
      ai_summary: analysis.summary,
      ai_key_findings: analysis.key_findings,
      document_type: analysis.document_type,
      source_clinic: analysis.source_clinic,
      document_date: analysis.document_date,
    },
    documentUrl,
  });
}
```

### 7.5 The OCR Phase 1.5 (Gemma 4 Multimodal)

When Gemma 4's multimodal capability is integrated (per Bible 0 §9.7 — multimodal addition Phase 2), OCR upgrades to Gemma 4 directly:

- Higher accuracy (especially on handwriting and unusual fonts)
- Native understanding of medical document structure
- Combined OCR + summary + classification in one model call
- No separate Tesseract dependency

Migration: when Gemma 4 multimodal is online, the Edge Function changes from Tesseract to AI-server call. Existing Tesseract-OCR'd entries are not re-processed automatically; clinicians can request re-OCR if needed.

---

## 8. The Continuous Patient Monitoring Service

Per Bible 0 §12.7 / Bible 4.0 §9.6, a continuous background service watches across all patients in a clinic for safety patterns. This is distinct from consultation-time ambient AI.

### 8.1 The Monitoring Categories

Per Cluster D walkthrough:

| Category | Examples |
|---|---|
| **Drug safety** | Drug interactions; renal/hepatic dose adjustments; contraindicated combinations; anticoagulation interaction checks |
| **Care continuity** | Overdue follow-ups after abnormal results; missed surveillance (HbA1c, INR, BP recheck); unactioned referrals |
| **Pre-procedure safety** | Pregnancy status before procedures; fasting requirements; anticoagulation status; allergy verification |
| **Documentation completeness** | Unsigned consents; missing exam components; incomplete discharge summaries |
| **Behavioural patterns** | Repeated cancellations; prescription frequency anomalies; access issue indicators |
| **Specialty-specific** | Per-specialty rules defined in Bible 5 (Doc For Drivers), Bible 6 (Doc For Skin), and future specialty Bibles |

### 8.2 The Monitoring Job Schedule

```sql
-- Scheduled via pg_cron (Bible 4.1 §7.2)

SELECT cron.schedule(
  'daily_continuous_monitoring',
  '0 2 * * *',  -- 2am every day
  $$ SELECT continuous_monitoring_run(); $$
);

SELECT cron.schedule(
  'hourly_high_priority_monitoring',
  '0 * * * *',  -- Every hour
  $$ SELECT continuous_monitoring_high_priority_run(); $$
);
```

Daily checks: most categories (overdue surveillance, behavioural patterns).
Hourly checks: high-priority safety (new prescriptions for interaction check; pre-procedure safety with appointments tomorrow).

### 8.3 The Monitor Schema

```sql
CREATE TYPE monitoring_check_severity AS ENUM ('info', 'warning', 'urgent', 'critical');

CREATE TABLE monitoring_alerts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  patient_id        UUID NOT NULL REFERENCES patients(id),
  
  -- Alert detail
  category          TEXT NOT NULL,       -- 'drug_safety' | 'care_continuity' | etc.
  rule_slug         TEXT NOT NULL,       -- e.g. 'warfarin_inr_overdue', 'pregnancy_pre_procedure'
  title             TEXT NOT NULL,       -- Human-readable headline
  description       TEXT NOT NULL,       -- Detailed explanation
  severity          monitoring_check_severity NOT NULL,
  
  -- Linked context
  related_entry_ids UUID[],              -- Feed entries that triggered this alert
  related_appointment_id  UUID REFERENCES appointments(id),
  
  -- Action
  recommended_action TEXT,               -- "Order INR; review anticoagulation"
  
  -- Lifecycle
  status            TEXT NOT NULL DEFAULT 'open',  -- 'open' | 'acknowledged' | 'actioned' | 'dismissed'
  assigned_to       UUID REFERENCES auth.users(id),  -- Auto-assigned to patient's primary clinician
  acknowledged_by   UUID REFERENCES auth.users(id),
  acknowledged_at   TIMESTAMPTZ,
  actioned_by       UUID REFERENCES auth.users(id),
  actioned_at       TIMESTAMPTZ,
  dismissed_by      UUID REFERENCES auth.users(id),
  dismissed_at      TIMESTAMPTZ,
  dismissed_reason  TEXT,
  
  -- Suppression (don't keep re-alerting)
  suppressed_until  TIMESTAMPTZ,         -- "Don't alert again for 30 days"
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monitoring_open ON monitoring_alerts(tenant_id, severity, created_at)
  WHERE status = 'open';
```

### 8.4 The Monitoring Rules (Implementation Pattern)

Each rule is a function that runs against a tenant's data and produces alerts:

```typescript
// supabase/functions/continuous_monitoring/rules/warfarin_inr_overdue.ts

export async function warfarinINROverdueCheck(tenantId: string) {
  // Find patients on active warfarin prescription
  const { data: warfarinPatients } = await supabase
    .from('patient_feed_entries')
    .select('patient_id, payload')
    .eq('tenant_id', tenantId)
    .eq('entry_type', 'prescription')
    .filter('payload->>drug_name', 'ilike', '%warfarin%')
    .filter('payload->>status', 'eq', 'dispensed')
    .is('deleted_at', null);
  
  for (const prescription of warfarinPatients) {
    const patientId = prescription.patient_id;
    
    // Find their most recent INR result
    const { data: lastINR } = await supabase
      .from('patient_feed_entries')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .eq('patient_id', patientId)
      .eq('entry_type', 'lab_result')
      .filter('payload->results', 'cs', '[{"name":"INR"}]')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const daysSinceINR = lastINR
      ? Math.floor((Date.now() - new Date(lastINR.created_at).getTime()) / (24 * 60 * 60 * 1000))
      : 999;
    
    // Threshold: 90 days
    if (daysSinceINR > 90) {
      // Check if alert already exists
      const { data: existing } = await supabase
        .from('monitoring_alerts')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('patient_id', patientId)
        .eq('rule_slug', 'warfarin_inr_overdue')
        .eq('status', 'open')
        .single();
      
      if (existing) continue;  // Already alerted
      
      // Create alert
      await supabase.from('monitoring_alerts').insert({
        tenant_id: tenantId,
        patient_id: patientId,
        category: 'care_continuity',
        rule_slug: 'warfarin_inr_overdue',
        title: 'INR overdue for patient on warfarin',
        description: `Patient is on warfarin but INR has not been checked in ${daysSinceINR} days (last check before that, threshold 90 days).`,
        severity: daysSinceINR > 180 ? 'urgent' : 'warning',
        recommended_action: 'Arrange INR check; review dosing.',
      });
    }
  }
}
```

### 8.5 The Alert Surfacing

Alerts surface in three places:

1. **Bottom alert strip on consultation screen** (Bible 4.2 §3.8) — when the patient is opened and has open alerts
2. **Dashboard alert section** — Caretakers and Clinicians see a summary card on their dashboard listing open alerts assigned to them
3. **Per-patient alert list** — visible on the patient detail page (§2.6 — Alerts tab)

The constitutional commitment (Bible 4.2 §6.4 — calm test): alerts are factual, brief, dismissible. No urgency-creating language. No exclamation marks. No flashing.

### 8.6 The Critical Alert Override

Per Bible 4.2 §5.8: critical-severity alerts surface even when the clinician has paused suggestions during a consultation. Threshold for `critical`:

- Drug interactions with significant risk of harm (e.g. MAO inhibitor + new SSRI)
- Pre-procedure safety failure (e.g. unrecognised pregnancy on day of cosmetic procedure)
- Missed safety surveillance with active risk (e.g. anticoagulated patient with confirmed bleeding)

Critical alerts also notify outside the patient's open consultation:
- Email to the patient's primary clinician
- SMS to assigned Clinician if tenant has SMS module + opt-in
- Persistent dashboard banner

### 8.7 The Alert Resolution

Each alert has actions:

- **Acknowledge** — clinician has seen it, intends to action
- **Action** — clinician took action; recommended_action completed; alert closed
- **Dismiss** — clinician judges alert is not applicable; provides reason; alert closed; suppressed for tenant-configurable period (default 30 days)
- **Escalate** — clinician feels another team member should handle; reassigns to specific user

Resolution audit-logged with reason.

### 8.8 The Rule Catalogue (Phase 1)

Phase 1 ships with these rules. Each is a separate Edge Function module under `supabase/functions/continuous_monitoring/rules/`:

| Rule Slug | Category | Severity Range |
|---|---|---|
| `warfarin_inr_overdue` | care_continuity | warning–urgent |
| `drug_drug_interaction_new_prescription` | drug_safety | warning–critical |
| `egfr_below_threshold_for_drug` | drug_safety | warning–urgent |
| `pregnancy_pre_procedure` | pre_procedure_safety | critical |
| `anticoagulation_pre_procedure` | pre_procedure_safety | warning–urgent |
| `allergy_unverified_pre_prescription` | drug_safety | urgent |
| `consent_unsigned_pre_procedure` | documentation | warning–urgent |
| `repeated_cancellations` | behavioural | info–warning |
| `overdue_hba1c_diabetes` | care_continuity | warning |
| `overdue_bp_check_hypertension` | care_continuity | warning |
| `unactioned_abnormal_result` | care_continuity | warning–urgent |
| `polypharmacy_review_overdue` | drug_safety | warning |

More rules added incrementally. The rule catalogue is extensible — Custodian can add new rules via the Custodian admin (Phase 2 feature).

---

## 9. The Audit Log Surface

Bible 4.1 §5.4 specifies the audit_log table. Bible 4.3 §5.12 / §15 specifies who can see audit data. This section specifies how it's surfaced.

### 9.1 The Audit Log Page (Caretaker View)

`<subdomain>.rolde.app/admin/audit-log` (Caretaker only)

Shows all audit log entries for the Caretaker's tenant (Bible 4.3 §5.12 layout). Filters:

- **By actor**: filter to specific user
- **By action type**: e.g. only show prescription events
- **By resource type**: only show events affecting a specific patient
- **By date range**: arbitrary range
- **By severity**: clinically-significant events only (configurable filter)

Export to CSV always available. Export action itself audit-logged.

### 9.2 The Patient-Specific Audit View

`<subdomain>.rolde.app/patients/<id>/audit` (Caretaker + assigned clinicians only)

Shows audit log filtered to that single patient. Used for:
- Subject Access Requests (SAR) — show patient who has accessed their record
- Clinical incident review — reconstruct what happened
- Compliance reporting

### 9.3 The Custodian Cross-Tenant View

`rolde.app/custodian/audit` (Custodian only, MFA required)

Shows audit log across all tenants. Filters include `tenant_id` field. Custodian queries here are themselves audit-logged in the `custodian_audit_log` table.

### 9.4 The Audit Export Format

Exports include columns:

```
timestamp, tenant_subdomain, actor_email, actor_role, action,
resource_type, resource_id, ip_address, user_agent, before_state, after_state
```

`before_state` and `after_state` are JSON strings. Useful for reconstructing exact changes.

---

## 10. The Search and Filter System

A consistent search experience across the application.

### 10.1 The Universal Search Bar

Top of every page (when authenticated). Cmd/Ctrl+K shortcut to focus.

Searches across:
- Patients (name, DOB, NHS number, phone — §2.4)
- Appointments (today, upcoming, past)
- Letters (subject, recipient, body content)
- Feed entries (full-text via tsvector index — §4.1)
- Settings pages (where permitted)

Results grouped by type. Click result navigates directly.

### 10.2 The Per-Page Filters

Each list view (Patients, Appointments, Letters, Audit Log) has consistent filter controls:

- Date range picker
- Status filter (active, archived, etc.)
- Type filter (where applicable)
- Search-within-results
- Sort selector
- Saved filter presets (Caretaker can save commonly-used filter combinations)

---

## 11. The Print and Export System

Clinical work generates artefacts that may need to be printed or exported.

### 11.1 The Print Targets

| What | When |
|---|---|
| Letter PDF | When recipient_type is paper_print, or clinician opts to print extra copy |
| Prescription | NHS pharmacies that don't accept digital; clinic-stock dispensing receipt |
| Patient summary | Patient leaving clinic wants paper record |
| Appointment confirmation | Concierge printing for patient |
| Consent form | Patient signing on paper (rare; usually digital) |

All print targets render to PDF via the same PDF pipeline (§5.5). Clinic logo and details auto-included.

### 11.2 The Export Targets

| What | When |
|---|---|
| Patient full record (JSON + PDF archive) | Subject Access Request; tenant migration |
| Audit log CSV | Compliance reporting |
| Appointment schedule | Clinician taking schedule home |
| Financial summary | Caretaker / Cofferer for reconciliation |

Exports always audit-logged.

---

## 12. The Notifications System

How RolDe notifies users of relevant events.

### 12.1 The Notification Channels

| Channel | When |
|---|---|
| In-app notification (bell icon — Phase 1) | Always |
| Email | User-configurable per event type |
| SMS | User-configurable; only for tenants with SMS module |
| Push notifications | Phase 2 (PWA / mobile app) |

### 12.2 The Notification Events

| Event | Default Channel(s) | Recipients |
|---|---|---|
| Appointment reminder (48h before) | Email | Patient |
| Appointment reminder (24h before) | SMS + Email | Patient |
| Patient arrived | In-app | Clinician |
| New incoming referral | Email + In-app | Clinician, Caretaker |
| Letter sent successfully | In-app | Author |
| Letter delivery failed | Email + In-app | Author, Caretaker |
| Critical monitoring alert | Email + SMS + In-app | Clinician, Caretaker |
| Payment received | In-app | Caretaker, Cofferer |
| Payment failed | Email + In-app | Caretaker |
| Custodian accessed your tenant | Email | Caretaker (transparency commitment per Bible 4.3 §6.6) |
| Absence approved/denied | In-app | Requesting user |
| User invitation accepted | In-app | Caretaker who invited |

### 12.3 The Notification Schema

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recipient_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  event_type      TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  link            TEXT,                                -- URL to navigate to
  
  -- Delivery
  channels        TEXT[] NOT NULL,                     -- 'in_app', 'email', 'sms'
  email_sent_at   TIMESTAMPTZ,
  sms_sent_at     TIMESTAMPTZ,
  
  -- State
  read_at         TIMESTAMPTZ,
  dismissed_at   TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_unread ON notifications(recipient_id, created_at)
  WHERE read_at IS NULL AND dismissed_at IS NULL;
```

### 12.4 The Notification Preferences

Each user has notification preferences:

```typescript
interface UserNotificationPreferences {
  email: {
    appointment_reminders: boolean;
    incoming_referrals: boolean;
    letter_failures: boolean;
    monitoring_alerts: boolean;
    custodian_access: boolean;  // Always true; cannot disable transparency
  };
  sms: {
    enabled: boolean;
    critical_alerts_only: boolean;
  };
  in_app: {
    show_unread_count: boolean;  // Even this is configurable per Bible 4.2 §6.4 calm dashboard
  };
}
```

Sensible defaults; user can adjust in their profile.

### 12.5 The Notification UI

Bell icon in top-right of every page. Click opens dropdown with:
- Recent notifications (last 20)
- Mark all read
- Notification settings link

When unread count > 0, a small dot indicator (NOT a number, NOT a red counter — calm aesthetic per Bible 4.2). Clinician can tell there's something to read; they don't see "12 URGENT NOTIFICATIONS".

---

## 13. Module-Level Permissions

Permissions specific to core modules. Inherits from Bible 4.3 §7.

| Capability | Custodian | Caretaker | Clinician | Locum | Nurse | Concierge | Cofferer | Patient |
|---|---|---|---|---|---|---|---|---|
| Read patient list | A | Yes | Yes | Yes (session) | Yes | Yes | No | No |
| Create patient | A | Yes | Yes | Yes | Yes | Yes | No | Self-register only |
| Edit patient demographics | A | Yes | Yes | Yes | Yes | Yes | No | Self only |
| Read clinical notes | A | Yes | Yes | Yes | Yes | No | No | No |
| Write clinical notes | No | Yes | Yes | Yes | Yes | No | No | No |
| Edit own clinical note (24h) | No | Yes | Yes | Yes | Yes | No | No | No |
| Edit other's clinical note | No | Caretaker only | No | No | No | No | No | No |
| Soft-delete clinical note | No | Caretaker only | No | No | No | No | No | No |
| Generate letter | No | Yes | Yes | Yes | Yes | No | No | No |
| Approve and send letter | No | Yes | Yes | Yes | If specific permission | No | No | No |
| Read letter | A | Yes | Yes (own + assigned patients) | Yes | Yes | Yes (metadata only) | No | Self only |
| Book appointment | A | Yes | Yes | Yes | Yes | Yes | No | Self only |
| Cancel appointment | A | Yes | Yes (own) | Yes (own) | Yes (assigned) | Yes | No | Self only |
| Read monitoring alerts | A | Yes (all) | Yes (assigned) | Yes (session) | Yes (assigned) | No | No | No |
| Acknowledge/action alert | No | Yes | Yes (assigned) | Yes (session) | Yes (assigned) | No | No | No |
| Dismiss alert | No | Yes | Yes (assigned) | No | No | No | No | No |
| Read audit log (own actions) | A | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Read audit log (tenant-wide) | A | Yes | No | No | No | No | No | No |
| Export audit log | A | Yes | No | No | No | No | No | No |

A = Audit-logged Custodian elevation pattern.

---

## 14. Module Configuration (Per-Tenant)

Each module has Caretaker-configurable settings stored in `tenants.config` JSONB (Bible 4.3 §9).

### 14.1 Patient Management Configuration

```json
{
  "patient_management": {
    "self_registration_enabled": true,
    "auto_generate_portal_credentials_on_create": true,
    "require_nhs_number_for_uk_patients": false,
    "default_patient_status": "active",
    "duplicate_detection_threshold": 0.85
  }
}
```

### 14.2 Calendar Configuration

```json
{
  "calendar": {
    "working_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "default_working_hours": { "start": "09:00", "end": "17:00" },
    "default_appointment_duration_minutes": 30,
    "default_buffer_before_minutes": 0,
    "default_buffer_after_minutes": 5,
    "minimum_booking_notice_minutes": 60,
    "maximum_booking_horizon_days": 90,
    "reminder_email_hours_before": 48,
    "reminder_sms_hours_before": 24,
    "no_show_threshold_minutes": 30,
    "cancellation_cutoff_hours": 48
  }
}
```

### 14.3 Letters Configuration

```json
{
  "letters": {
    "auto_draft_referrals": true,
    "auto_draft_discharge_summaries": true,
    "approval_required_before_send": true,  // Cannot be set false (constitutional)
    "default_pdf_password_protection": false,
    "letter_routing": {
      "rheumatology": { "type": "external_email", "address": "rheum@nhsforth.scot.nhs.uk" },
      "dermatology": { "type": "rolde_network", "tenant_subdomain": "edinburghskin" }
    }
  }
}
```

Note: `approval_required_before_send` cannot be set to false. The constitutional commitment (Bible 4.0 §4.3) is non-negotiable. The schema validator enforces this.

### 14.4 Monitoring Configuration

```json
{
  "monitoring": {
    "rules_enabled": [
      "warfarin_inr_overdue",
      "drug_drug_interaction_new_prescription",
      "pregnancy_pre_procedure",
      "consent_unsigned_pre_procedure"
    ],
    "warfarin_inr_threshold_days": 90,
    "hba1c_diabetes_threshold_days": 365,
    "default_alert_assignee": "primary_clinician",
    "critical_alert_sms_enabled": true
  }
}
```

Each rule's threshold is tenant-tunable.

---

## 15. Acceptance Criteria for "Core Modules Are Built"

The core modules are "built" when:

### 15.1 The Patient Management Acceptance

- [ ] Patient creation via Concierge admin works
- [ ] Patient self-registration via public booking widget works
- [ ] Patient search returns results in < 200ms
- [ ] Patient detail page displays all tabs correctly
- [ ] Allergies and alerts display in consultation top-strip
- [ ] Demographics edits are audit-logged

### 15.2 The Calendar Acceptance

- [ ] Day, week, month, clinician views all render
- [ ] Slot availability algorithm respects working hours, absences, existing appointments
- [ ] Booking via public widget creates appointment
- [ ] Booking via admin creates appointment
- [ ] Reminders send at 48h and 24h
- [ ] No-show automation triggers correctly
- [ ] Cancellation respects tenant policy

### 15.3 The Clinical Notes / Feed Acceptance

- [ ] All 19 feed entry types renderable
- [ ] iMessage feed direction (oldest top, newest bottom)
- [ ] Real-time updates via Supabase Realtime
- [ ] Lazy loading works on 1000+ entry feeds
- [ ] Feed search via tsvector returns results in < 300ms
- [ ] Edit/delete rules enforced per entry type
- [ ] Consultation session grouping works

### 15.4 The Letters Acceptance

- [ ] AI drafts referral letters from consultation context
- [ ] Letter review modal renders correctly
- [ ] Edits to AI draft tracked
- [ ] PDF generation works for all letter types
- [ ] Email delivery via Resend works (with bounce handling)
- [ ] In-network delivery to receiving RolDe tenant works

### 15.5 The Closed-Loop Referral Acceptance

- [ ] All 6 pipeline steps tested end-to-end
- [ ] In-network referral: Doc For Drivers → Doc For Skin works
- [ ] External email referral: PDF arrives at recipient
- [ ] Network acceptance flow (Caretaker-to-Caretaker consent) works
- [ ] Appointment intelligence surfaces real slots from receiving tenant
- [ ] Patient receives appointment confirmation email/SMS

### 15.6 The OCR Acceptance

- [ ] PDF upload triggers OCR
- [ ] Image upload triggers OCR
- [ ] Tesseract Phase 1 implementation works
- [ ] OCR'd text is searchable in feed
- [ ] Low-confidence threshold flagged appropriately
- [ ] Original document preserved alongside extracted text

### 15.7 The Continuous Monitoring Acceptance

- [ ] All 12 Phase 1 rules implemented and tested
- [ ] Alerts surface in correct locations (alert strip, dashboard, patient page)
- [ ] Critical alert override works during paused suggestions
- [ ] Alert resolution actions audit-logged
- [ ] pg_cron schedules run reliably

### 15.8 The Operational Acceptance

- [ ] Roland uses RolDe end-to-end for at least one Doc For Drivers consultation
- [ ] Roland uses RolDe end-to-end for at least one Doc For Skin consultation
- [ ] At least one closed-loop referral flows successfully (Doc For Drivers → external email)
- [ ] At least one OCR document flows correctly into feed
- [ ] At least one monitoring alert raised and resolved
- [ ] Notification system delivers correct events to correct users

When all 15.1-15.8 criteria pass, RolDe Phase 1 core modules are built.

---

## End of Bible 4.4

This is the clinical heart of RolDe — the modules that handle the patient, the appointment, the note, the letter, the referral, the alert. Every constitutional commitment from Bible 4.0 manifests in code here.

When in doubt about a core-module decision: does it preserve the patient feed as the canonical view? Does it respect the agentic boundary (drafts everything, sends nothing without approval)? Does it complete the pipeline (no half-baked PDFs)? Does it leave the clinician unburdened?

The next sub-Bible to draft is **4.5 — RolDe Module: Prescribing** (the unified clinical orders flow including prescribing + labs + radiology, pharmacy integrations, payment-gating workflows).

— Roland Manoj Jayasekhar, with Devipangaj
RoDee, May 2026

---

## Addendum (2026-06-11): Clinical feature expansion

Per the market dive (canonical spec in Bible 4.8 §15):

- **§2 Patients:** saved segments, tags, bulk actions, merge duplicates,
  quick-view drawer. Patient record gains problem list, medication list +
  reconciliation, history tabs, document store, vitals/growth charts.
- **§3 Calendar:** online booking widget (LatePoint shape), **recalls + automated
  SMS/email reminders engine** (the biggest retention + no-show lever), waitlist/
  cancellation fill, recurring "course of treatment" series.
- **§6 Referrals + §7 Investigations:** closed-loop referrals, results inbox with
  **result trends** (graph a value over time) + abnormal flagging + seen/actioned.
- **NEW §13 — Inventory** (to draft): stock with **batch/expiry** for Botox/filler
  traceability (safety + product-recall capability).

See Bible 4.8 §15.4 for the build waves.
