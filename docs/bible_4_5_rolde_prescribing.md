# RolDe — Bible 4.5: Module — Prescribing

> *"Prescribing, lab requesting, and radiology requesting all command at the same umbrella. A unified clinical orders family."* — Roland, Cluster B3
>
> Version 1.0 | Last Updated: 10 May 2026 | RolDe Ltd | CONFIDENTIAL
>
> Implementation specification for the unified clinical orders module. Inherits from Bible 0 v1.2, Bible 4.0, Bible 4.1, Bible 4.2, Bible 4.3, and Bible 4.4.

---

## How to Use This Document

This is the **implementation specification for RolDe's unified clinical orders module** — the family of related actions that share UI, backend patterns, and safety architecture:

- **Prescribing** (medications)
- **Lab orders** (FBC, U&E, CRP, urine, microbiology, etc.)
- **Radiology orders** (X-ray, ultrasound, CT, MRI)
- **Pharmacy integrations** (NHS, private, clinic stock, paper print)
- **Payment-gating workflows** (clinics that require pre-payment)
- **Drug safety** (interactions, renal dose adjustment, contraindication checks)
- **Repeat prescriptions and recurring orders**

The architectural insight (Cluster B3): these three things are **the same kind of action**. They share UI patterns in the right pane of the consultation screen (Bible 4.2 §3.6). They share the same approval gate (Bible 4.0 §4.3 — clinician must approve). They share the same status lifecycle. They share the same drug-safety / appropriateness checks (different details, same architecture).

**Loading order for Claude Code sessions**:
1. Bible 0 v1.2 — group defaults
2. Bible 4.0 — RolDe constitution
3. Bible 4.1 — architecture (multi-tenant, schemas, file storage)
4. Bible 4.2 — design system (consultation screen layout, AI panel)
5. Bible 4.3 — multi-tenant foundation
6. Bible 4.4 — core modules (the patient feed where orders live as entries)
7. This Bible 4.5 — prescribing and orders
8. Bible 4.7 — AI ambient drug-safety reasoning (referenced)

---

## Table of Contents

1. The Unified Orders Architecture
2. The Right Pane: Tabbed Orders Surface
3. The Prescribing Flow
4. The Drug Database and Search
5. The Pharmacy Integration Layer
6. Drug Safety Checks
7. Repeat Prescriptions
8. The Lab Orders Flow
9. The Lab Result Reception Pipeline
10. The Radiology Orders Flow
11. The Radiology Result Reception
12. Payment-Gating Workflows
13. Cancellation and Modification
14. Order History and Audit
15. Permissions Matrix (Orders-Specific)
16. Per-Tenant Configuration
17. Acceptance Criteria for "Prescribing Module Is Built"

---

## 1. The Unified Orders Architecture

### 1.1 The Architectural Insight

Prescribing a drug, ordering a lab test, and ordering a radiology investigation share more than they differ:

| Aspect | Prescription | Lab Order | Radiology Order |
|---|---|---|---|
| Originates from | Consultation right pane | Consultation right pane | Consultation right pane |
| Requires | Clinical decision + clinician role | Clinical decision + clinician role | Clinical decision + clinician role |
| Has status lifecycle | draft → approved → sent → dispensed → completed | draft → approved → sent → collected → received → reviewed | draft → approved → sent → performed → reported → reviewed |
| Has approval gate | Clinician approves before send (Bible 4.0 §4.3) | Same | Same |
| Has safety checks | Drug interactions, allergies, renal dose | Lab appropriateness, fasting, repeat-test guidance | Imaging appropriateness, contrast contraindications, pregnancy |
| Has external recipient | Pharmacy | Lab provider | Radiology provider |
| Produces feed entry | `prescription` | `lab_order` then `lab_result` | `radiology_order` then `radiology_result` |
| Requires payment? | Optional (paywall module) | Optional (paywall module) | Optional (paywall module) |

This shared structure is the architectural truth. RolDe operationalises it via a **unified `clinical_orders` table** with type-discriminated payloads (similar to the `patient_feed_entries` pattern in Bible 4.4 §4.1).

### 1.2 The Unified Clinical Orders Table

```sql
CREATE TYPE clinical_order_type AS ENUM (
  'prescription',
  'lab_order',
  'radiology_order',
  'procedure_order',     -- For aesthetic / minor surgical procedures (Bible 6 detail)
  'referral_order'       -- The referral letter as an order (links to letters table)
);

CREATE TYPE clinical_order_status AS ENUM (
  'draft',           -- Created, not yet approved
  'approved',        -- Clinician approved, ready to send
  'sending',         -- Send pipeline running
  'sent',            -- Delivered to recipient (pharmacy / lab / etc.)
  'in_progress',     -- Recipient acting on order (drug being dispensed, sample being processed)
  'completed',       -- Order fulfilled (dispensed, results received, etc.)
  'failed',          -- Delivery or fulfilment failure
  'cancelled'        -- Explicitly cancelled before completion
);

CREATE TABLE clinical_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  patient_id            UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  
  -- Type and content
  order_type            clinical_order_type NOT NULL,
  payload               JSONB NOT NULL,                     -- Type-specific data; see §1.3
  
  -- Status
  status                clinical_order_status NOT NULL DEFAULT 'draft',
  
  -- Context
  appointment_id        UUID REFERENCES appointments(id),
  consultation_id       UUID,                               -- Groups orders from same consultation
  prescriber_id         UUID NOT NULL REFERENCES auth.users(id),  -- The clinician
  
  -- Linked feed entry
  feed_entry_id         UUID REFERENCES patient_feed_entries(id),  -- Set when order materialises in feed
  
  -- Recipient
  recipient_type        TEXT,                               -- 'pharmacy_partner' | 'lab_provider' | 'radiology_provider' | 'paper_print' | 'clinic_stock'
  recipient_id          UUID,                               -- FK depends on recipient_type
  recipient_name        TEXT,                               -- Cached for display
  
  -- Approval gate
  approved_by           UUID REFERENCES auth.users(id),
  approved_at           TIMESTAMPTZ,
  
  -- Sending
  sent_at               TIMESTAMPTZ,
  external_reference    TEXT,                               -- Pharmacy / lab confirmation ID
  
  -- Completion
  completed_at          TIMESTAMPTZ,
  
  -- Failure
  failure_reason        TEXT,
  retry_count           INTEGER NOT NULL DEFAULT 0,
  
  -- Cancellation
  cancelled_at          TIMESTAMPTZ,
  cancelled_by          UUID REFERENCES auth.users(id),
  cancelled_reason      TEXT,
  
  -- Payment (for paywall modules)
  requires_payment      BOOLEAN NOT NULL DEFAULT false,
  payment_status        TEXT,                               -- 'pending' | 'paid' | 'refunded' | 'waived'
  payment_intent_id     TEXT,                               -- Stripe Payment Intent ID
  payment_amount_pence  INTEGER,
  
  -- Standard universal columns
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID REFERENCES auth.users(id),
  deleted_at            TIMESTAMPTZ,
  deleted_by            UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_orders_tenant_status ON clinical_orders(tenant_id, status);
CREATE INDEX idx_orders_patient_chronological ON clinical_orders(patient_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_consultation ON clinical_orders(consultation_id) WHERE consultation_id IS NOT NULL;
CREATE INDEX idx_orders_prescriber ON clinical_orders(prescriber_id, created_at DESC);
CREATE INDEX idx_orders_pending_payment ON clinical_orders(tenant_id, payment_status)
  WHERE payment_status = 'pending';

ALTER TABLE clinical_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON clinical_orders
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
```

### 1.3 The Type-Specific Payloads

```typescript
// packages/db/types/clinical-order-payloads.ts

export const PrescriptionPayload = z.object({
  // Drug identity
  drug_name: z.string(),                        // 'Cephalexin'
  drug_form: z.string(),                        // 'capsule', 'tablet', 'solution'
  strength: z.string(),                         // '500mg'
  
  // Dose
  dose: z.string(),                             // '1 capsule'
  frequency: z.string(),                        // 'TDS' (three times daily)
  route: z.string(),                            // 'oral', 'topical', 'IV'
  
  // Duration
  duration: z.string(),                         // '7 days', 'until reviewed'
  duration_days: z.number().int().nullable(),   // Numeric for repeat-prescription logic
  
  // Quantity
  quantity: z.string(),                         // '21 capsules'
  quantity_value: z.number(),                   // 21
  quantity_unit: z.string(),                    // 'capsule'
  
  // Clinical
  indication: z.string(),                       // 'Acute bacterial UTI'
  instructions_for_patient: z.string(),         // 'Take with food. Complete the full course.'
  
  // Renal/hepatic dose adjustment
  dose_adjusted: z.boolean().default(false),
  dose_adjustment_reason: z.string().nullable(),  // 'Renal impairment (eGFR 48)'
  standard_dose_would_be: z.string().nullable(),
  
  // Off-label
  off_label: z.boolean().default(false),
  off_label_justification: z.string().nullable(),
  
  // Repeat
  is_repeat: z.boolean().default(false),
  repeat_of_order_id: z.string().uuid().nullable(),
  repeats_remaining: z.number().int().nullable(),
  
  // Prescriber
  prescriber_gmc: z.string(),                   // GMC number at time of prescription
  
  // Routing
  routing_type: z.enum(['nhs_pharmacy', 'private_pharmacy', 'clinic_stock', 'patient_print']),
  pharmacy_id: z.string().uuid().nullable(),
  
  // Citations from AI (if AI-drafted)
  citations: z.array(z.object({
    source: z.string(),
    section: z.string(),
  })).default([]),
});

export const LabOrderPayload = z.object({
  // Tests
  tests: z.array(z.object({
    code: z.string(),                           // SNOMED CT or local code
    name: z.string(),                           // 'Full Blood Count'
    category: z.string(),                       // 'haematology', 'biochemistry', 'microbiology'
  })),
  
  // Provider
  provider_id: z.string().uuid().nullable(),
  
  // Sample
  sample_type: z.enum(['venous_blood', 'urine', 'stool', 'swab', 'sputum', 'tissue', 'other']),
  sample_collection_location: z.enum(['clinic_phlebotomy', 'patient_self_collect', 'home_visit', 'lab_walkin']),
  fasting_required: z.boolean().default(false),
  fasting_hours_required: z.number().int().nullable(),
  
  // Clinical
  urgency: z.enum(['routine', 'urgent', 'emergency']),
  clinical_indication: z.string(),
  relevant_history: z.string().nullable(),     // Brief context for the lab
  
  // Special handling
  special_instructions: z.string().nullable(),  // 'Process within 4h of collection'
  protect_from_light: z.boolean().default(false),
  
  // Citations
  citations: z.array(z.object({
    source: z.string(),
    section: z.string(),
  })).default([]),
});

export const RadiologyOrderPayload = z.object({
  // Modality and study
  modality: z.enum(['xray', 'ultrasound', 'ct', 'mri', 'fluoroscopy', 'mammography', 'dexa', 'nuclear_medicine']),
  study_name: z.string(),                       // 'CT abdomen/pelvis with contrast'
  body_region: z.string(),                      // 'abdomen', 'pelvis', 'chest'
  
  // Provider
  provider_id: z.string().uuid().nullable(),
  
  // Clinical
  urgency: z.enum(['routine', 'urgent', 'emergency']),
  clinical_indication: z.string(),
  clinical_question: z.string(),                // What you want answered, e.g. 'Rule out hydronephrosis'
  relevant_history: z.string().nullable(),
  
  // Safety
  contrast_required: z.boolean().default(false),
  contrast_type: z.string().nullable(),         // 'IV iodinated', 'oral', 'IV gadolinium'
  contrast_contraindication_check_done: z.boolean().default(false),
  pregnancy_status_checked: z.boolean().default(false),
  pregnancy_status: z.enum(['not_pregnant', 'pregnant', 'unknown', 'not_applicable']).nullable(),
  egfr_value: z.number().nullable(),            // For contrast safety
  
  // Special
  special_instructions: z.string().nullable(),
  
  // Citations
  citations: z.array(z.object({
    source: z.string(),
    section: z.string(),
  })).default([]),
});

export const ProcedureOrderPayload = z.object({
  procedure_name: z.string(),                   // 'Botulinum toxin treatment, glabella'
  procedure_code: z.string().nullable(),
  
  // Aesthetic-specific (referenced from Bible 6)
  product: z.string().nullable(),               // 'Azzalure'
  product_dose: z.string().nullable(),
  injection_sites: z.array(z.string()).default([]),
  
  // Surgical-specific
  surgical_setting: z.enum(['clinic', 'day_unit', 'theatre']).nullable(),
  
  // Consent linkage
  consent_signed_id: z.string().uuid().nullable(),
  
  // Other
  scheduled_for: z.string().datetime().nullable(),
  notes: z.string().nullable(),
});
```

### 1.4 Why Not Three Separate Tables

Considered alternatives:
- Three separate tables (`prescriptions`, `lab_orders`, `radiology_orders`)
- Single base table with three child tables (table inheritance)

Reasons for unified table with discriminated payload:
1. The shared lifecycle (status, approval, payment, cancellation) is identical — duplicating across three tables means duplicating logic
2. Cross-cutting queries are common (e.g. "all orders for patient X", "pending approvals across all order types")
3. The patient feed (Bible 4.4 §4) treats each as a feed entry; one source-of-truth table makes feed entries consistent
4. New order types (procedure orders, referral orders) extend naturally without schema migration
5. JSONB payload validated at write time by Zod — type safety preserved

Trade-off: payload queries are JSONB queries (slightly less performant than typed columns). Mitigated by indexing JSONB paths where needed (e.g. `CREATE INDEX ON clinical_orders ((payload->>'drug_name')) WHERE order_type = 'prescription';`).

---

## 2. The Right Pane: Tabbed Orders Surface

The consultation screen's right pane (Bible 4.2 §3.6) hosts the orders surface. Four tabs:

```
+-----------------------------------------------------+
|  Prescribing  |  Labs  |  Radiology  |  Procedures  |  <- Tab strip
+-----------------------------------------------------+
|                                                     |
|  [Tab content — varies per tab]                     |
|                                                     |
+-----------------------------------------------------+
|  Pending in this consultation:                       |
|    • Cephalexin 500mg TDS x 7 days  [draft]          |
|    • FBC, U&E, CRP                  [draft]          |
|                                                     |
|  [Approve all and send →]                           |
+-----------------------------------------------------+
```

### 2.1 The Tab Persistence

Per Bible 4.2 §3.6: tab selection persists per-user across consultations. RolDe remembers what tab the doctor was last using and opens there next time. Stored in user preferences (a per-user JSONB column, separate from tenant config).

### 2.2 The Tab Common Pattern

Each tab follows the same UX pattern:

1. **Search bar at top** — find drug / lab test / imaging study
2. **Recently used items** — per-clinician personalised list (top 5-10 items the clinician has prescribed/ordered in last 30 days)
3. **"Add to plan" button per result** — adds as draft order
4. **Pending orders list at bottom** — draft orders for this consultation, ready for approval
5. **"Approve all and send" button** — single approval flow for multiple orders

This pattern is consistent. A clinician learning the prescribing tab knows the labs and radiology tabs by inference.

### 2.3 The Pending Orders List

Below the tab content area, a persistent list shows orders drafted in the current consultation that haven't been approved/sent yet:

```
PENDING IN THIS CONSULTATION

  [Rx]  Cephalexin 500mg TDS x 7 days       [draft]   [Edit]
        Indication: Acute bacterial UTI
        AI says: 'Renal-adjusted dose for eGFR 48'
        
  [Lab] FBC, U&E, CRP                        [draft]   [Edit]
        Sample: Venous blood, no fasting
        Provider: TDL Pathology
        
  [Procedure] Botulinum toxin, glabella      [draft]   [Edit]
        Product: Azzalure 50 units
        Consent required: Yes — signed 2 days ago ✓
        
  Total pending: 3 orders

  [Approve all and send →]    [Review each individually]
```

The "Approve all and send" path is the fast path. The "Review each individually" path opens a per-order modal for clinicians who want to scrutinise each order separately.

### 2.4 The Per-Order Edit

Click `[Edit]` on any pending order opens a modal with that order's full detail. Edits are tracked (for audit). Edits to AI-drafted content versus clinician-typed content are flagged differently in the audit log.

---

## 3. The Prescribing Flow

The most regulated, safety-critical of the three orders. Highest care taken.

### 3.1 The Prescribing Tab UI

```
+-----------------------------------------------------+
|  Search drug...                          [search]   |
|  +------------------------------------------+        |
|  | cephalexin                               |        |
|  +------------------------------------------+        |
|                                                     |
|  Search results:                                    |
|  • Cephalexin 250mg capsules (Eli Lilly)            |
|  • Cephalexin 500mg capsules (Generic)              |
|  • Cephalexin 250mg/5ml suspension                  |
|  • Cefalexin 500mg capsules (Generic)               |
|                                                     |
|  Click to add → opens dose/frequency picker         |
+-----------------------------------------------------+
|                                                     |
|  Your recently used (last 30 days):                 |
|                                                     |
|  • Paracetamol 500mg                  [+ Add]       |
|  • Naproxen 500mg                     [+ Add]       |
|  • Amoxicillin 500mg                  [+ Add]       |
|  • Codeine 30mg                       [+ Add]       |
|  • Sertraline 50mg                    [+ Add]       |
|                                                     |
+-----------------------------------------------------+
```

### 3.2 The Drug Selection Modal

Once a drug is selected from search:

```
+----------------------------------------------+
|  Cephalexin 500mg capsules                   |
|                                              |
|  DOSE                                        |
|  [1] [capsule(s) ▼]                          |
|                                              |
|  FREQUENCY                                   |
|  [TDS — three times daily        ▼]          |
|                                              |
|  ROUTE                                       |
|  [Oral                            ▼]          |
|                                              |
|  DURATION                                    |
|  [7] [days                        ▼]          |
|  ☐ Until reviewed                            |
|                                              |
|  QUANTITY                                    |
|  21 capsules (auto-calculated)               |
|  [Override: ___]                             |
|                                              |
|  INDICATION                                  |
|  [Acute bacterial UTI______________________] |
|                                              |
|  INSTRUCTIONS FOR PATIENT                    |
|  [Take with food. Complete the full course] |
|                                              |
|  ─────────────────────────────────────────   |
|                                              |
|  ⚠ AI says: 'eGFR 48 — recommend dose        |
|     reduction to 500mg BD per BNF/eMC'       |
|     [Apply this adjustment]  [Override]      |
|                                              |
|  ─────────────────────────────────────────   |
|                                              |
|  ROUTING                                     |
|  ○ Send to NHS pharmacy                      |
|  ● Send to private pharmacy                  |
|  ○ Dispense from clinic stock                |
|  ○ Print for patient                         |
|                                              |
|  Pharmacy: [Lloyds Pharmacy, Morningside ▼]  |
|                                              |
|  ☐ This is a repeat prescription             |
|                                              |
|  [Add to plan]   [Cancel]                    |
+----------------------------------------------+
```

### 3.3 The AI-Drafted Prescription

When the AI drafts a prescription (per Bible 4.0 §9.1 — drafts everything autonomously), it surfaces in the AI panel as a card:

```
+-----------------------------------------+
|  [Rx] Prescription suggestion           |
+-----------------------------------------+
|                                         |
|  Cephalexin 500mg BD x 7 days           |
|  (renal-adjusted from standard TDS)     |
|                                         |
|  Indication: Acute bacterial UTI        |
|                                         |
|  Citations:                              |
|  • NICE NG109 (UTI)¹                    |
|  • eMC SmPC Cephalexin²                 |
|                                         |
+-----------------------------------------+
|  [+ Add to prescribing tab]  [Expand]   |
|  [👍 👎]                                |
+-----------------------------------------+
```

Clicking "Add to prescribing tab" inserts the AI's suggestion as a draft order in the prescribing tab. The clinician then reviews, edits if needed, approves.

### 3.4 The Approval Step

When the clinician clicks "Approve all and send" or per-order "Approve":

1. **Re-authentication required** — per Bible 4.1 §4.5, prescribing actions require fresh password re-entry (not just session). This is a constitutional safety commitment.
2. **Final safety check** — the AI runs the safety checks in §6 one more time (in case data changed since draft creation, e.g. an allergy was added).
3. **Audit log entry** — explicit: `prescription.approved` with full prescription detail
4. **Status update** — `clinical_orders.status` → 'approved'
5. **Send pipeline triggers** — Edge Function `send_clinical_order` invoked

### 3.5 The Send Pipeline (Per Routing Type)

**NHS Pharmacy (digital electronic prescribing)**:

UK NHS uses the Electronic Prescription Service (EPS) for primary care, and HEPMA for some Scottish settings. RolDe in Phase 1 does not directly integrate with EPS (this is a Phase 2/3 effort requiring NHS approvals).

Phase 1 NHS pharmacy fallback: print PDF, hand to patient, patient takes to pharmacy. Marked 'sent' once printed.

```typescript
// Phase 1 NHS routing
case 'nhs_pharmacy':
  await generatePrescriptionPDF(order);
  // Display in modal for clinician to print
  // Clinician confirms "Printed" → status: 'sent'
  break;
```

**Private Pharmacy (digital where supported)**:

Different private pharmacies have different capabilities. RolDe supports:
- **Email-based delivery**: PDF sent to pharmacy email; pharmacy receives, processes
- **API-based delivery** (where pharmacy partner has API): direct order submission
- **Print fallback**: same as NHS

Per pharmacy-partner configuration in Steward admin (Bible 4.3 §5.7).

**Clinic Stock**:

For clinics that maintain in-house dispensing (common in aesthetic and private GP):
- Order created with routing 'clinic_stock'
- Stock-keeping system updated (Phase 2 — clinic_stock_ledger table)
- Receipt generated for patient
- Payment captured (if private clinic)
- Status → 'completed' (no external dispensing pipeline)

```sql
-- Phase 2 stock-keeping (deferred)
CREATE TABLE clinic_stock_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  drug_name       TEXT NOT NULL,
  drug_form       TEXT NOT NULL,
  strength        TEXT NOT NULL,
  
  quantity_on_hand INTEGER NOT NULL,
  reorder_threshold INTEGER NOT NULL,
  
  unit_cost_pence  INTEGER,
  unit_price_pence INTEGER,
  
  expiry_date     DATE,
  batch_number    TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

For Phase 1, clinic stock is tracked manually by the clinic; RolDe records the prescription but doesn't track inventory.

**Patient Print**:

PDF generated, displayed in modal, clinician prints, hands to patient. Status → 'sent' on print confirmation.

### 3.6 The Prescription PDF

DESIGN NEEDED: Prescription PDF visual template — Roland to design.

Required content (per UK GMC standards):
- Clinic letterhead (auto from tenant config)
- Patient name, DOB, NHS number, address
- Drug name (with brand name in parentheses if generic substitution allowed/restricted)
- Strength, form, route
- Dose, frequency, duration
- Quantity (in words AND figures, per UK convention)
- Special directions
- Prescriber name (printed and signature)
- Prescriber GMC number
- Prescriber clinic address
- Date of prescription
- Whether this is a repeat (and number of repeats remaining)
- Whether the medication is a controlled drug (special handling)

Controlled drug prescriptions have additional UK legal requirements (handwritten quantity in words AND figures, full prescriber address, etc.). RolDe enforces these for Schedule 2 and 3 drugs.

### 3.7 The Status Lifecycle (Prescription)

```
[draft]  ──cancel──→  [cancelled]
   │
   │  clinician approves (with re-authentication)
   ↓
[approved]  ──send pipeline──→
   │
   ↓
[sending]
   │
   │  pharmacy receives / clinic prints
   ↓
[sent]
   │
   │  pharmacy reports dispensed (Phase 2 — webhook from pharmacy systems)
   │  OR clinic confirms dispensed
   ↓
[in_progress]  (drug being dispensed)
   │
   ↓
[completed]  (drug dispensed and provided to patient)
```

For Phase 1 without pharmacy webhooks, status often jumps from 'sent' to 'completed' via clinician confirmation (e.g. "Patient confirmed they collected").

---

## 4. The Drug Database and Search

The prescribing tab needs a drug database. Choices and trade-offs.

### 4.1 The Source of Truth

**eMC (electronic Medicines Compendium)** is the chosen drug data source per Bible 0 §9.7 / Bible 4.0 §9.5.

Why eMC:
- Free (no licensing fees)
- Authoritative (official UK Summary of Product Characteristics)
- Comprehensive (every UK-licensed drug)
- Maintained (kept current by manufacturers + MHRA)
- API-accessible (some) and scrapeable (most)

Phase 1 implementation:
- Quarterly batch ingestion of eMC SmPCs
- Stored in `drugs` table within RolDe
- Search via PostgreSQL full-text index

### 4.2 The Drug Schema

```sql
CREATE TABLE drugs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  generic_name          TEXT NOT NULL,                   -- 'Cephalexin'
  brand_names           TEXT[] NOT NULL DEFAULT '{}',    -- ['Keflex', 'Ceporex']
  
  -- Form and strength
  form                  TEXT NOT NULL,                   -- 'capsule', 'tablet', 'solution'
  strength              TEXT NOT NULL,                   -- '500mg'
  strength_value        DECIMAL,                         -- 500
  strength_unit         TEXT,                            -- 'mg'
  
  -- Classification
  bnf_chapter           TEXT,                            -- BNF chapter (we don't license BNF but reference is helpful)
  atc_code              TEXT,                            -- WHO ATC classification (open)
  controlled_drug_schedule INTEGER,                      -- 1, 2, 3, 4, 5; NULL if not controlled
  
  -- Routes
  routes                TEXT[] NOT NULL DEFAULT '{}',    -- ['oral', 'topical']
  
  -- Pregnancy/breastfeeding
  pregnancy_category    TEXT,                            -- 'A', 'B', 'C', 'D', 'X' (FDA categories used for guidance)
  breastfeeding_safety  TEXT,                            -- 'safe', 'caution', 'avoid'
  
  -- Renal/hepatic dose adjustment data
  renal_dose_adjustment JSONB,                           -- Structured dose adjustment per eGFR ranges
  hepatic_dose_adjustment JSONB,
  
  -- Common uses (for autocomplete)
  common_indications    TEXT[],                          -- ['Acute bacterial UTI', 'Skin infection']
  
  -- Standard doses
  standard_doses        JSONB,                           -- Adult, paediatric, etc.
  
  -- Metadata
  emc_smpc_id           TEXT,                            -- Link to eMC
  last_updated_from_emc TIMESTAMPTZ,
  
  -- Search optimisation
  search_text           TEXT GENERATED ALWAYS AS (
    generic_name || ' ' || array_to_string(brand_names, ' ') || ' ' || form || ' ' || strength
  ) STORED,
  
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drugs_search ON drugs USING gin (to_tsvector('english', search_text));
CREATE INDEX idx_drugs_generic ON drugs(generic_name);
CREATE INDEX idx_drugs_atc ON drugs(atc_code);
CREATE INDEX idx_drugs_controlled ON drugs(controlled_drug_schedule)
  WHERE controlled_drug_schedule IS NOT NULL;
```

### 4.3 The Drug Search

```typescript
// src/lib/drugs/search.ts
export async function searchDrugs(query: string, limit: number = 10): Promise<Drug[]> {
  // Normalize query
  const normalized = query.trim().toLowerCase();
  
  // Use both fuzzy match and full-text
  const { data } = await supabase
    .from('drugs')
    .select('*')
    .textSearch('search_text', normalized.split(' ').join(' & '))
    .limit(limit);
  
  return data || [];
}
```

Searches by generic name, brand name, or partial match. Fuzzy via PostgreSQL trigram extension.

### 4.4 The Per-User Recently-Used Cache

Per-clinician personalisation. Each user has a `user_drug_recents` table:

```sql
CREATE TABLE user_drug_recents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  drug_id       UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  
  use_count     INTEGER NOT NULL DEFAULT 1,
  last_used_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, tenant_id, drug_id)
);

CREATE INDEX idx_user_drug_recents ON user_drug_recents(user_id, tenant_id, last_used_at DESC);
```

Updated each time a clinician prescribes a drug. The "Recently used" section in the prescribing tab queries this.

---

## 5. The Pharmacy Integration Layer

Tenants configure their pharmacy partners in Steward admin (Bible 4.3 §5.7).

### 5.1 The Pharmacy Partner Schema

```sql
CREATE TYPE pharmacy_type AS ENUM ('nhs', 'private', 'clinic_stock');

CREATE TABLE pharmacy_partners (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  pharmacy_type         pharmacy_type NOT NULL,
  display_name          TEXT NOT NULL,
  
  -- Contact (for email-based delivery)
  email                 TEXT,
  phone                 TEXT,
  
  -- Physical address
  address_line1         TEXT,
  address_line2         TEXT,
  city                  TEXT,
  postcode              TEXT,
  
  -- Integration
  delivery_method       TEXT NOT NULL,                   -- 'email' | 'api' | 'print_fallback'
  api_endpoint          TEXT,                            -- For API-based partners
  api_credentials_id    UUID,                            -- Reference to vault
  
  -- Hours
  opening_hours         JSONB,                           -- Per day-of-week
  
  -- Patient-facing info
  patient_facing_info   TEXT,                            -- Shown to patient: "Collect from..."
  
  -- Default
  is_default            BOOLEAN NOT NULL DEFAULT false,
  
  status                TEXT NOT NULL DEFAULT 'active',
  
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 5.2 The Default Pharmacy Logic

When a clinician creates a prescription, the routing defaults to:

1. Patient's preferred pharmacy if set on patient record
2. Tenant's default pharmacy if no patient preference
3. Manual selection if neither is set

Patient pharmacy preferences stored on `patients.config` JSONB:

```json
{
  "preferred_pharmacy_id": "uuid-of-pharmacy-partner",
  "preferred_pharmacy_notes": "Pharmacy near home, opening hours match work schedule"
}
```

### 5.3 The Email-Based Delivery

For pharmacies without API integration:

1. Prescription PDF generated
2. Email sent via Resend to pharmacy email
3. Email body: structured details (patient name, DOB, drug, dose, quantity); PDF attached for legal record
4. Optional: email read receipts (limited reliability — depend on pharmacy email client)
5. Confirmation: pharmacy can reply or acknowledge via a unique link in email

### 5.4 The API-Based Delivery (Phase 2)

For pharmacy partners with API integration (some chains, future EPS):

```typescript
// supabase/functions/deliver_prescription_api/index.ts
async function deliverPrescriptionViaAPI(orderId: string) {
  const order = await getOrder(orderId);
  const partner = await getPharmacyPartner(order.recipient_id);
  
  const apiCredentials = await getCredentialsFromVault(partner.api_credentials_id);
  
  const response = await fetch(partner.api_endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiCredentials.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_id: order.id,
      patient: getPatientForAPI(order.patient_id),
      prescription: order.payload,
      prescriber: getPrescriberForAPI(order.prescriber_id),
    }),
  });
  
  if (!response.ok) {
    await markOrderFailed(orderId, `API error: ${response.status}`);
    return;
  }
  
  const result = await response.json();
  await updateOrder(orderId, {
    status: 'sent',
    sent_at: new Date(),
    external_reference: result.confirmation_id,
  });
}
```

Phase 1 does not ship API-based pharmacy integrations. The architecture is in place for Phase 2.

---

## 6. Drug Safety Checks

Before any prescription is approved, RolDe runs safety checks. Some are automatic; some require clinician acknowledgement.

### 6.1 The Check Categories

| Check | Trigger | Severity |
|---|---|---|
| **Allergy match** | Drug shares ingredient with documented allergy | Critical (block) |
| **Drug-drug interaction** | Drug interacts with patient's current medications | Warning to Critical (graded) |
| **Renal dose adjustment** | eGFR below threshold for standard dose | Warning (recommend adjustment) |
| **Hepatic dose adjustment** | LFT abnormalities suggesting hepatic impairment | Warning |
| **Pregnancy contraindication** | Drug contraindicated in pregnancy + patient pregnant or unknown | Warning to Critical |
| **Age-inappropriate** | Drug not for this age group (paediatric, elderly) | Warning |
| **Duplicate therapy** | Same class drug already prescribed | Warning |
| **Off-label use** | Indication is off-label per SmPC | Info (require justification) |
| **Controlled drug compliance** | UK CD prescription requirements met | Block if not met |
| **Repeat exhaustion** | This is a repeat with no remaining authorised repeats | Warning |

### 6.2 The Allergy Match Check (Critical Block)

When a drug is added to draft, RolDe checks against the patient's documented allergies:

```typescript
async function checkAllergyMatch(drugId: string, patientId: string) {
  const { data: drug } = await supabase.from('drugs').select('generic_name, atc_code').eq('id', drugId).single();
  const { data: allergies } = await supabase
    .from('patient_allergies')
    .select('substance, reaction, severity')
    .eq('patient_id', patientId)
    .eq('status', 'active');
  
  const matches = [];
  for (const allergy of allergies) {
    // Direct name match
    if (allergy.substance.toLowerCase().includes(drug.generic_name.toLowerCase())) {
      matches.push({ allergy, match_type: 'direct_name' });
    }
    // ATC class match (e.g. penicillin allergy + cephalosporin)
    if (await isATCRelated(drug.atc_code, allergy.substance)) {
      matches.push({ allergy, match_type: 'cross_reactive_class' });
    }
  }
  
  return matches;
}
```

If matches found:

- **Direct match + severity 'severe' or 'life_threatening'**: BLOCK approval. Force clinician to either remove the drug or explicitly override with documented reason.
- **Direct match + severity 'moderate'**: Warning, require acknowledgement, allow override
- **Cross-reactive class match**: Warning with cross-reactivity rate (e.g. penicillin → cephalosporin: 5-10% per literature), require acknowledgement

UI presentation:

```
+-----------------------------------------------+
|  ⚠ ALLERGY ALERT                              |
+-----------------------------------------------+
|                                               |
|  Patient is allergic to:                      |
|  Penicillin (severe — anaphylaxis)            |
|                                               |
|  Cephalexin is a cephalosporin antibiotic     |
|  with cross-reactivity to penicillins         |
|  (~5-10% rate per literature).                |
|                                               |
|  Source: BMJ 2024;385:e078057                  |
|                                               |
+-----------------------------------------------+
|  [Override and proceed]   [Remove drug]       |
|                                               |
|  If overriding, document reason:              |
|  [_______________________________________]    |
|                                               |
+-----------------------------------------------+
```

Override action audit-logged with full rationale.

### 6.3 The Drug-Drug Interaction Check

Implementation: maintained interaction database. Phase 1 sources:

- **DrugBank Open Data** (free for academic; commercial licence required for clinical use — needs review)
- **OpenFDA** (US-focused but useful for major interactions)
- **eMC SmPCs** (interactions section of each drug's SmPC)
- **Curated subset for UK practice**

For Phase 1, RolDe ships with a curated database of approximately 5,000 most clinically significant interactions covering common drugs. Severity graded:

```sql
CREATE TYPE interaction_severity AS ENUM ('mild', 'moderate', 'severe', 'contraindicated');

CREATE TABLE drug_interactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_a_id       UUID NOT NULL REFERENCES drugs(id),
  drug_b_id       UUID NOT NULL REFERENCES drugs(id),
  
  severity        interaction_severity NOT NULL,
  mechanism       TEXT NOT NULL,
  clinical_effect TEXT NOT NULL,
  management      TEXT,
  
  evidence_level  TEXT,                            -- 'major studies' | 'case reports' | 'theoretical'
  
  source_citation TEXT,
  
  CONSTRAINT no_self_interaction CHECK (drug_a_id != drug_b_id)
);

CREATE INDEX idx_interactions_pair ON drug_interactions(drug_a_id, drug_b_id);
CREATE INDEX idx_interactions_severity ON drug_interactions(severity);
```

Lookup is symmetric (we check both `(A, B)` and `(B, A)` orderings).

### 6.4 The Renal Dose Adjustment Check

For drugs with renal dose adjustment data, RolDe checks the patient's most recent eGFR:

```typescript
async function checkRenalDoseAdjustment(drugId: string, patientId: string, currentDose: string) {
  const drug = await getDrug(drugId);
  if (!drug.renal_dose_adjustment) return null;
  
  const recentEGFR = await getMostRecentEGFR(patientId);
  if (!recentEGFR) return { warning: 'eGFR not recorded; consider renal function before prescribing' };
  
  // The renal_dose_adjustment JSONB is structured like:
  // [
  //   { "egfr_min": 50, "egfr_max": 999, "recommended_dose": "Standard dose" },
  //   { "egfr_min": 30, "egfr_max": 49, "recommended_dose": "Reduce frequency to BD" },
  //   { "egfr_min": 15, "egfr_max": 29, "recommended_dose": "Reduce to OD" },
  //   { "egfr_min": 0, "egfr_max": 14, "recommended_dose": "Avoid; consult specialist" }
  // ]
  
  const recommendation = drug.renal_dose_adjustment.find(
    r => recentEGFR.value >= r.egfr_min && recentEGFR.value <= r.egfr_max
  );
  
  if (recommendation && recommendation.recommended_dose !== 'Standard dose') {
    return {
      warning: `eGFR ${recentEGFR.value} — ${recommendation.recommended_dose}`,
      egfr_value: recentEGFR.value,
      egfr_date: recentEGFR.date,
      recommendation: recommendation.recommended_dose,
    };
  }
  
  return null;
}
```

### 6.5 The Pregnancy Contraindication Check

For female patients of childbearing age (defined as age 12-55 in tenant config), pregnancy status is checked before any drug with pregnancy contraindication:

1. Most recent pregnancy test result checked (if available in feed)
2. If no test in last 30 days AND drug is contraindicated in pregnancy → warning surfaced
3. Clinician must either confirm patient is not pregnant (documented) or order pregnancy test before prescribing

This check is also part of the continuous monitoring service (Bible 4.4 §8.8 — `pregnancy_pre_procedure` rule, extended here for prescription).

### 6.6 The Controlled Drug Compliance Check

UK Misuse of Drugs Regulations require specific format for controlled drug prescriptions:

- Schedule 2 and 3: prescription must include:
  - Quantity in words AND figures
  - Form of preparation
  - Strength (where appropriate)
  - Total quantity
  - Prescriber's full address
  - Handwritten signature (digital where regs allow)
- Maximum 30-day quantity for many CDs
- Cannot be repeated electronically (must re-issue each time)

RolDe enforces these:

- Quantity field auto-formats with words AND figures for CD prescriptions
- 30-day max quantity validated for relevant CDs
- "Repeat" option disabled for CDs
- Digital signature added (per 2015 regs allowing this for primary care)
- Prescriber's full address auto-included from clinic settings

### 6.7 The Off-Label Justification

When a clinician prescribes off-label (indication not in eMC SmPC for that drug), RolDe requires explicit justification:

```
+-----------------------------------------------+
|  This is an off-label use                     |
|                                               |
|  Cephalexin is licensed for:                  |
|    • Bacterial respiratory infections         |
|    • Skin and soft tissue infections          |
|    • Bone and joint infections                |
|    • UTI                                      |
|    • Otitis media                             |
|                                               |
|  Your stated indication:                      |
|  "Prophylaxis for invasive dental procedure"  |
|                                               |
|  Clinical justification (required):           |
|  [______________________________________]    |
|                                               |
|  ☑ I have informed the patient this is an    |
|    off-label use                              |
|                                               |
|  [Confirm]   [Cancel]                         |
+-----------------------------------------------+
```

Justification stored on the order. Patient information acknowledgement audit-logged.

### 6.8 The Safety Check Integration With Approval

Before any prescription approval (§3.4):

1. All safety checks run server-side (cannot be bypassed by client)
2. Critical checks (allergy match severe, contraindicated interaction) → block approval; force clinician to remove drug or explicitly override
3. Warnings → display warnings, require clinician acknowledgement
4. All overrides documented with reason
5. All check outcomes audit-logged with the order

---

## 7. Repeat Prescriptions

Many clinical scenarios require ongoing prescriptions (e.g. statins, antihypertensives, contraceptive pills, hormone replacement).

### 7.1 The Repeat Schema

A repeat prescription is a regular prescription with `is_repeat = true` and additional repeat-specific fields:

```typescript
// In PrescriptionPayload
{
  is_repeat: true,
  repeat_of_order_id: 'original-prescription-uuid',  // The first prescription in this series
  repeats_remaining: 5,                              // Authorised repeats
  repeat_authorised_until: '2027-05-10',             // Repeat authorisation expiry
  repeat_review_required_at: '2026-11-10',           // Next clinical review
}
```

### 7.2 The Repeat Issue Flow

When a patient requests a repeat (via patient portal or by contacting the clinic):

1. Receptionist or clinician opens patient → Repeat Prescriptions tab
2. List of active repeats with `repeats_remaining > 0` and not past `repeat_authorised_until`
3. Click "Issue repeat" → creates new prescription order
4. New order inherits all clinical content from the parent
5. `repeats_remaining` decremented on parent
6. New order goes through normal approval flow (clinician must still approve each repeat)
7. If `repeats_remaining` reaches 0 OR review is overdue → repeat is "exhausted"; requires fresh review

### 7.3 The Repeat Review

Before exhaustion, RolDe surfaces an alert (continuous monitoring rule from Bible 4.4 §8.8):

- 30 days before review date: warning
- At review date: action required
- Past review date: blocking — patient cannot get further repeats until reviewed

The review is a clinical activity (e.g. annual statin review) that the clinician documents in clinical notes. Once documented with the magic phrase or structured field "Repeat reviewed", a new repeat authorisation is issued for the next period.

### 7.4 The Patient-Initiated Repeat Request

Via patient portal (Bible 4.3 §5.8 — patient portal):

```
+---------------------------------------------+
|  YOUR REPEAT MEDICATIONS                    |
|                                             |
|  Cephalexin 500mg BD                        |
|  Indication: Acute UTI                      |
|  Last issued: 3 May 2026                    |
|  ❌ Not eligible for self-request           |
|     (acute course completed)                |
|                                             |
|  Atorvastatin 40mg OD                       |
|  Indication: Cardiovascular protection      |
|  Last issued: 2 April 2026                  |
|  ✓ Eligible for repeat                      |
|  Next review: 12 December 2026              |
|                                             |
|  [Request repeat]                           |
|                                             |
+---------------------------------------------+
```

Click "Request repeat":
1. Patient confirms request
2. Request lands in clinic's queue
3. Clinician reviews (typically same day for routine repeats)
4. Clinician approves or contacts patient if review needed
5. Approved repeat sent to patient's preferred pharmacy
6. Patient receives confirmation email/SMS

---

## 8. The Lab Orders Flow

Labs follow the unified orders pattern. Most logic from §1-3 reused.

### 8.1 The Labs Tab UI

Similar layout to prescribing tab:

```
+-----------------------------------------------------+
|  Search labs...                                     |
|  +------------------------------------------+        |
|  | renal function                           |        |
|  +------------------------------------------+        |
|                                                     |
|  Search results:                                    |
|  • U&E (Urea, Electrolytes, Creatinine, eGFR)       |
|  • Renal function panel (full)                      |
|  • Cystatin C                                       |
|                                                     |
|  Test panels (commonly ordered together):           |
|  • Septic screen (FBC, U&E, CRP, LFT, lactate, ...) |
|  • Diabetes monitoring (HbA1c, U&E, lipids, urine)  |
|  • Pre-procedure bloods (FBC, U&E, clotting)        |
|                                                     |
|  Recent (your last 30 days):                        |
|  • FBC + U&E + CRP                  [+ Add]         |
|  • TFT                              [+ Add]         |
|  • HbA1c                            [+ Add]         |
+-----------------------------------------------------+
```

### 8.2 The Test Catalogue

Lab tests stored in `lab_tests` table:

```sql
CREATE TABLE lab_tests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  code              TEXT NOT NULL UNIQUE,            -- SNOMED CT or local code
  name              TEXT NOT NULL,                   -- 'Full Blood Count'
  short_name        TEXT,                            -- 'FBC'
  category          TEXT NOT NULL,                   -- 'haematology' | 'biochemistry' | 'microbiology'
  
  -- Sample
  default_sample_type TEXT NOT NULL,                 -- 'venous_blood', 'urine'
  default_volume_ml    DECIMAL,
  default_tube_type    TEXT,                         -- 'EDTA', 'serum', 'lithium heparin'
  
  -- Logistics
  fasting_required  BOOLEAN NOT NULL DEFAULT false,
  fasting_hours     INTEGER,
  protect_from_light BOOLEAN NOT NULL DEFAULT false,
  process_within_hours INTEGER,                       -- Lactate must be processed within 1h, etc.
  
  -- Reference ranges
  reference_ranges  JSONB,                            -- Per age/sex/condition
  
  -- Common indications (for AI suggestion)
  common_indications TEXT[],
  
  status            TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE lab_test_panels (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  test_ids          UUID[] NOT NULL,                  -- Tests in this panel
  
  status            TEXT NOT NULL DEFAULT 'active'
);
```

### 8.3 The Lab Order Modal

```
+------------------------------------------------+
|  Lab order                                     |
|                                                |
|  TESTS                                         |
|  ✓ FBC                                  [×]   |
|  ✓ U&E (with eGFR)                      [×]   |
|  ✓ CRP                                  [×]   |
|  [+ Add another test]                          |
|                                                |
|  CLINICAL INDICATION                           |
|  [Acute infection — query pyelonephritis ___]  |
|                                                |
|  URGENCY                                       |
|  ○ Routine (results 2-4 days)                  |
|  ● Urgent (results within 24h)                 |
|  ○ Emergency (results within 4h)               |
|                                                |
|  SAMPLE COLLECTION                             |
|  ● At clinic phlebotomy                        |
|  ○ Patient self-collect (urine)                |
|  ○ Home visit                                  |
|                                                |
|  ☐ Fasting required (auto-checked if needed)   |
|                                                |
|  PROVIDER                                      |
|  [TDL Pathology                       ▼]       |
|                                                |
|  PAYMENT (if module enabled)                   |
|  Total: £67.50                                 |
|  ○ Charge to patient now                       |
|  ○ Bill to insurance                           |
|  ● Send first, settle later                    |
|                                                |
|  [Add to plan]   [Cancel]                      |
+------------------------------------------------+
```

### 8.4 The Lab Order Send Pipeline

Similar to prescription send. Per provider:

- **Email-based**: order PDF emailed to lab; sample sent separately to lab (clinic phlebotomy)
- **API-based** (some private labs have APIs): direct order submission with electronic requisition
- **Print fallback**: print form with sample for patient to take to walk-in lab

### 8.5 The AI-Drafted Lab Order

The AI (per Bible 4.0 §9.1) infers labs needed from clinical context. Cluster B3 example: fever → AI suggests FBC, U&E, CRP, blood cultures, urinalysis with culture.

The AI drafts the order with:
- Test selection
- Clinical indication (synthesised from notes)
- Urgency (inferred from severity)
- Citations

Surfaces in AI panel as a card with "[+ Add to labs tab]" action.

---

## 9. The Lab Result Reception Pipeline

Lab results arrive asynchronously after the order. RolDe needs to receive, display, and surface them.

### 9.1 The Result Reception Channels

| Channel | When |
|---|---|
| **API webhook** | When provider supports integration |
| **Email + parsing** | Provider emails report PDF; OCR'd via §7 of Bible 4.4 |
| **HL7 / FHIR** | Future Phase 3+ — for NHS-grade integration |
| **Manual entry** | Receptionist or clinician types result from phone or paper |

### 9.2 The Result Linking

When a result arrives, it must be linked to the originating order:

1. Provider's reference ID matched against `clinical_orders.external_reference`
2. If match found: result linked to order
3. If no match: orphan result; placed in "Unmatched results" queue for clinical staff review

### 9.3 The Result Feed Entry Creation

Once linked:

```typescript
async function createLabResultEntry(orderId: string, result: LabResultData) {
  const order = await getOrder(orderId);
  
  // Generate AI synthesis (Bible 4.0 §9.3 — synthesis over enumeration)
  const synthesis = await callAIServer('/v1/synthesize-lab-result', {
    order: order,
    result: result,
    patient_context: await getPatientContext(order.patient_id),
  });
  
  // Create feed entry
  await insertFeedEntry({
    patientId: order.patient_id,
    entryType: 'lab_result',
    payload: {
      order_id: orderId,
      results: result.values,
      ai_synthesis: synthesis.text,
      reviewed_by: null,  // Awaiting clinician review
    },
    relatedEntryId: order.feed_entry_id,
  });
  
  // Update order status
  await updateOrder(orderId, { status: 'in_progress' });
  
  // Notify clinician
  await notifyClinician({
    user_id: order.prescriber_id,
    event_type: 'lab_result_received',
    title: `Result ready: ${order.payload.tests.map(t => t.name).join(', ')}`,
    link: `/patients/${order.patient_id}`,
  });
  
  // Trigger continuous monitoring check (abnormal results may need urgent attention)
  await checkResultForUrgentFlags(order.patient_id, result);
}
```

### 9.4 The Result Review

Per Bible 4.4 §4.3 LabResultPayload, the result feed entry shows:

- AI synthesis at top (e.g. "Acute infection picture (WCC 18.4, neutrophilia, CRP 247). Renal impairment (eGFR 48 — moderate).")
- Raw values on expand
- Abnormal values colour-flagged

When the clinician opens the entry, they can mark it 'reviewed' (sets `reviewed_by` and `reviewed_at` on the payload).

### 9.5 The Critical Result Handling

Some results are critical (potassium > 6.5, lactate > 4, etc.). Continuous monitoring (Bible 4.4 §8) flags these:

- Critical alert raised
- Email + SMS to ordering clinician
- Persistent dashboard banner
- AI panel surfaces card during any subsequent consultation
- Patient flagged in Today's Patients list

Threshold for critical results stored in tenant config (default values per RCPath / NICE guidance).

### 9.6 The Unactioned Result Monitoring

Continuous monitoring rule (Bible 4.4 §8.8 — `unactioned_abnormal_result`): if abnormal result has been received but not marked reviewed by ordering clinician within X days, alert raised. Default X = 3 days for routine, 1 day for urgent, 4 hours for emergency.

---

## 10. The Radiology Orders Flow

Almost identical to lab orders structurally. Differences in payload (modality, contrast, body region) and safety checks (pregnancy for ionising radiation, contrast contraindications).

### 10.1 The Radiology Tab UI

```
+-----------------------------------------------------+
|  Search imaging...                                  |
|  +------------------------------------------+        |
|  | abdominal ultrasound                     |        |
|  +------------------------------------------+        |
|                                                     |
|  Search results:                                    |
|  • Abdominal USS                                    |
|  • Renal USS                                        |
|  • USS abdomen + pelvis                             |
|                                                     |
|  Common imaging:                                    |
|  • Chest X-ray                       [+ Add]         |
|  • Abdominal X-ray                   [+ Add]         |
|  • CT abdomen/pelvis with contrast   [+ Add]         |
|  • MRI brain                         [+ Add]         |
|                                                     |
|  Recent (your last 30 days):                        |
|  • USS abdomen                       [+ Add]         |
|  • CT urgent                         [+ Add]         |
+-----------------------------------------------------+
```

### 10.2 The Radiology Order Modal

```
+------------------------------------------------+
|  Imaging order                                 |
|                                                |
|  STUDY                                         |
|  CT abdomen / pelvis with contrast             |
|                                                |
|  CLINICAL INDICATION                           |
|  [Suspected ureteric stone vs hydronephrosis]  |
|                                                |
|  CLINICAL QUESTION                             |
|  [Identify cause of acute right loin pain___]  |
|                                                |
|  RELEVANT HISTORY                              |
|  [54M, sudden onset right loin pain, frank ___|
|   haematuria. eGFR 78, weight 82kg__________]  |
|                                                |
|  URGENCY                                       |
|  ○ Routine (1-2 weeks)                         |
|  ● Urgent (24-48h)                             |
|  ○ Emergency (within 4h)                       |
|                                                |
|  ⚠ SAFETY CHECKS                              |
|                                                |
|  Pregnancy status                              |
|  ✓ Not applicable (male patient)               |
|                                                |
|  Contrast contraindications                    |
|  ○ Patient eGFR < 30                           |
|  ○ Previous contrast reaction                  |
|  ○ Iodine allergy                              |
|  ● No contraindications identified             |
|                                                |
|  Patient prepared for contrast?                |
|  [Hydration advice given to patient        ]  |
|                                                |
|  PROVIDER                                      |
|  [Spire Murrayfield, Edinburgh        ▼]      |
|                                                |
|  [Add to plan]   [Cancel]                      |
+------------------------------------------------+
```

### 10.3 The Radiology Safety Checks

Specific to imaging:

- **Pregnancy for ionising radiation** (X-ray, CT, fluoroscopy, mammography, nuclear medicine):
  - Female patients of childbearing age: require explicit pregnancy status check
  - "Not pregnant" requires recent test (last 30 days) OR clinician confirmation
  - "Pregnant or unknown" + ionising radiation → require justification (reasonable risk-benefit; alternative imaging considered)

- **Contrast contraindications** (CT with IV contrast, MRI with gadolinium, etc.):
  - eGFR check: < 30 contraindicates IV iodinated contrast (high risk of contrast nephropathy)
  - Allergy check: iodine, gadolinium
  - Metformin + IV iodinated contrast: hold metformin 48h before and after

- **MRI safety**:
  - Pacemaker, ICD, cochlear implant: contraindicated for MRI (with exceptions for MRI-conditional devices)
  - Metallic foreign body: assessment required
  - Claustrophobia: alternative or sedation considered

These checks run as part of the Drug Safety pattern (§6) — same architecture, different rule set.

---

## 11. The Radiology Result Reception

Similar to lab results.

### 11.1 The Reception Channels

- API webhook from provider (where supported)
- Email with PDF report — OCR'd via Bible 4.4 §7
- HL7/FHIR for future enterprise integration
- Manual entry

### 11.2 The Report Components

A radiology report typically contains:

- Clinical history (what the referrer sent)
- Technique (modality, sequences, contrast given)
- Findings (anatomic details)
- Impression (the radiologist's diagnostic conclusion)
- Recommendations (further imaging or actions)

The AI synthesis surfaces the impression and recommendations prominently in the feed entry.

### 11.3 The Image Access

For some providers, the actual images are available (PACS link). RolDe can:
- Embed a PACS viewer link in the feed entry (Phase 2)
- Download key images and attach to the feed entry as `scanned_document` type (Phase 1, manual)

Phase 1: text report only; PACS integration deferred.

---

## 12. Payment-Gating Workflows

For clinics that require patient payment before fulfilling orders. Premium-tier feature (Bible 4.3 §16.2).

### 12.1 The Configuration

Enabled in Steward admin → Modules → Payment-gating:

```json
{
  "payment_gating": {
    "enabled": true,
    "applies_to": {
      "prescriptions": false,
      "lab_orders": true,
      "radiology_orders": true,
      "procedures": true
    },
    "default_charge_strategy": "charge_at_approval"
    // 'charge_at_approval' | 'charge_after_completion' | 'manual'
  }
}
```

### 12.2 The Payment Charge Flow

When an order is approved with `requires_payment = true`:

1. Order status set to 'pending_payment'
2. Stripe Payment Intent created with the patient as customer
3. Payment link sent to patient via email + SMS
4. Patient pays via Stripe (card, Apple Pay, Google Pay, etc.)
5. Webhook receives `payment_intent.succeeded`
6. Order moves to 'approved' and proceeds with normal send pipeline

If patient doesn't pay:
- Reminder at 24h, 48h, 7 days
- After 14 days: order cancelled with reason "Payment not received"

### 12.3 The Refund Flow

If an order is cancelled after payment:
- Refund triggered automatically (Stripe API)
- Patient notified
- Refund amount and reason audit-logged

---

## 13. Cancellation and Modification

### 13.1 The Cancellation Rules

| Order Status | Can Cancel? | By Whom |
|---|---|---|
| draft | Yes (just delete) | Author or any clinician |
| approved | Yes (before send) | Author or Steward |
| sending | Yes (best-effort cancellation) | Author or Steward |
| sent | Provider-dependent | Author or Steward (with provider notification) |
| in_progress | Provider-dependent | Steward only |
| completed | No (cannot uncomplete) | — |
| failed | Mark cancelled (closure) | Author or Steward |

### 13.2 The Cancellation Pipeline

When cancelling a sent order:

1. Order status → 'cancelled'
2. Cancellation reason recorded
3. Provider notified:
   - Pharmacy: "Cancel prescription [external_reference] for [patient]"
   - Lab: "Cancel order [external_reference] for [patient]"
4. Patient notified if appropriate
5. Refund triggered if payment was taken
6. Audit log entry

### 13.3 The Modification

You cannot modify a sent order. You cancel and re-issue.

You can modify a draft or approved-but-not-sent order:
- Edit the order
- Re-run safety checks
- Re-approve

Edit history retained on the order (`feed_entry_versions` pattern from Bible 4.4 §4.6).

---

## 14. Order History and Audit

### 14.1 The Per-Patient Order History

On the patient detail page, an "Orders" tab shows all clinical orders for the patient:

- Filter by type (prescriptions / labs / radiology / procedures)
- Filter by status
- Filter by date range
- Filter by prescriber

Each order shows:
- Type icon
- Summary (drug name + dose, or test panel, etc.)
- Status badge
- Date
- Prescriber name
- Click → full detail modal

### 14.2 The Audit Trail Per Order

Each order has a complete audit trail viewable in the order detail:

```
ORDER AUDIT TRAIL

10 May 14:32  Created (status: draft)              by Roland (AI-drafted)
10 May 14:33  Edited                                by Roland
              Changed: dose '500mg TDS' → '500mg BD'
              Reason: 'Renal adjustment per AI'
10 May 14:34  Approved                              by Roland (re-authenticated)
10 May 14:34  Status: sending                       
10 May 14:35  PDF generated                         system
10 May 14:35  Email sent to Lloyds Pharmacy         system
10 May 14:35  Status: sent                          
10 May 16:42  Pharmacy confirmation received        system
              External ref: LP-20260510-1432
10 May 16:42  Status: in_progress                   
11 May 09:15  Marked dispensed                      by Lisa Wong (Receptionist)
              Status: completed                     
```

### 14.3 The Custodian Audit View

Custodian can query orders across tenants for safety review:

- "All prescriptions of [drug X] in last quarter, across all tenants" — pharmacovigilance
- "All orders cancelled with reason 'duplicate'" — quality improvement
- "All orders with safety check overrides" — clinical governance review

Each Custodian query audit-logged (Bible 4.3 §6.6).

---

## 15. Permissions Matrix (Orders-Specific)

Inherits from Bible 4.4 §13, with these specific orders-related capabilities:

| Capability | Custodian | Steward | Practitioner | Locum | Nurse | Receptionist | Accountant | Patient |
|---|---|---|---|---|---|---|---|---|
| Create draft prescription | No | If GMC + rights | If GMC + rights | If GMC + rights | No | No | No | No |
| Approve and send prescription | No | If GMC + rights | If GMC + rights | If GMC + rights | No | No | No | No |
| Override allergy block | No | If GMC + rights | If GMC + rights | If GMC + rights | No | No | No | No |
| Issue Schedule 2/3 controlled drug | No | If GMC + rights | If GMC + rights | No (Steward review required) | No | No | No | No |
| Issue repeat prescription | No | If GMC + rights | If GMC + rights | If GMC + rights | No | No | No | No |
| Authorise repeat (set repeats_remaining) | No | If GMC + rights | If GMC + rights | If GMC + rights | No | No | No | Self-request only |
| Create draft lab order | No | If clinical role | If clinical role | If clinical role | If clinical role | No | No | No |
| Approve and send lab order | No | If clinical role | If clinical role | If clinical role | If clinical role | No | No | No |
| Mark result reviewed | No | Yes | Yes | Yes | Yes | No | No | No |
| Create draft radiology order | No | If clinical role | If clinical role | If clinical role | If clinical role | No | No | No |
| Cancel order (sent) | No | Yes | Author only | Author only | No | No | No | No |
| View order detail | A | Yes | Yes (assigned) | Yes | Yes (assigned) | Yes (own clinic) | No (financial only) | Self only |
| Take payment for order | A | Yes | Yes | Yes | No | Yes | View | Self-pay only |

A = Audit-logged Custodian elevation pattern.

Locum prescribers cannot issue Schedule 2/3 CDs without Steward review (additional safeguard for sessional clinicians).

---

## 16. Per-Tenant Configuration

```json
{
  "prescribing": {
    "enabled": true,
    "pharmacy_partners": [...],
    "default_pharmacy_id": "uuid",
    "allow_clinic_stock": true,
    "controlled_drug_compliance_strict": true,
    "off_label_justification_required": true,
    "renal_dose_check_enabled": true,
    "drug_interaction_check_enabled": true,
    "drug_interaction_min_severity": "moderate",
    "allergy_block_severity_threshold": "severe",
    "repeat_review_default_months": 6,
    "repeat_authorisation_default_months": 12
  },
  
  "lab_orders": {
    "enabled": true,
    "providers": [...],
    "default_provider_id": "uuid",
    "default_urgency": "routine",
    "auto_synthesis_enabled": true,
    "abnormal_result_alert_enabled": true,
    "critical_result_thresholds": {
      "potassium_high": 6.5,
      "potassium_low": 2.5,
      "haemoglobin_low": 70,
      "lactate_high": 4.0,
      "creatinine_acute_rise_percent": 50
    },
    "unactioned_result_alert_days": 3
  },
  
  "radiology_orders": {
    "enabled": false,
    "providers": [],
    "pregnancy_check_age_min": 12,
    "pregnancy_check_age_max": 55,
    "contrast_egfr_threshold": 30
  },
  
  "payment_gating": {
    "enabled": false,
    "applies_to": {
      "prescriptions": false,
      "lab_orders": false,
      "radiology_orders": false,
      "procedures": false
    },
    "default_charge_strategy": "charge_at_approval"
  }
}
```

---

## 17. Acceptance Criteria for "Prescribing Module Is Built"

### 17.1 The Core Order Architecture

- [ ] Unified `clinical_orders` table created with all 5 order types supported
- [ ] Type-specific Zod schemas validated at write
- [ ] Status lifecycle enforced for all transitions
- [ ] Feed entry creation linked to order

### 17.2 The Prescribing Acceptance

- [ ] Drug search returns results in < 100ms
- [ ] Drug selection modal collects all required fields
- [ ] Re-authentication required for prescription approval
- [ ] PDF generation correct for routine and CD prescriptions
- [ ] All four routing paths functional (NHS, private, clinic stock, patient print)
- [ ] AI-drafted prescriptions surface correctly in panel + add to tab

### 17.3 The Drug Safety Acceptance

- [ ] Allergy match check blocks severe matches; warns moderate
- [ ] Drug-drug interaction check fires with appropriate severity
- [ ] Renal dose adjustment check uses recent eGFR
- [ ] Pregnancy contraindication check fires for childbearing-age females
- [ ] Controlled drug compliance enforced (quantity in words, no electronic repeat)
- [ ] Off-label justification required and stored
- [ ] All overrides audit-logged with reason

### 17.4 The Repeat Prescriptions Acceptance

- [ ] Repeats authorised with specific repeats_remaining and review date
- [ ] Patient self-request functional via portal
- [ ] Clinician approval still required for each repeat
- [ ] Review reminders fire at 30 days, on date, post-date

### 17.5 The Lab Orders Acceptance

- [ ] Lab test catalogue searchable
- [ ] Test panels (FBC + U&E + CRP) addable as a unit
- [ ] AI-drafted lab orders surface and add correctly
- [ ] Order PDF generation correct
- [ ] Result reception via email parses correctly
- [ ] Lab result feed entry includes AI synthesis
- [ ] Critical result alerts fire correctly
- [ ] Unactioned result monitoring rule operational

### 17.6 The Radiology Orders Acceptance

- [ ] Radiology study catalogue searchable
- [ ] Modality-specific safety checks fire (pregnancy, contrast, MRI safety)
- [ ] Order PDF generation correct
- [ ] Result reception (text report) parses correctly
- [ ] Radiology result feed entry includes AI synthesis

### 17.7 The Payment-Gating Acceptance

- [ ] Module enables conditional on Premium tier subscription
- [ ] Payment Intent created on order approval (when gating enabled)
- [ ] Patient receives payment link via email + SMS
- [ ] Webhook updates order status on payment received
- [ ] Refund flow works on cancellation

### 17.8 The Cancellation/Modification Acceptance

- [ ] Cancellation rules enforced per status
- [ ] Cancellation propagates to provider (where applicable)
- [ ] Refund triggered for paid + cancelled orders
- [ ] Modification not allowed on sent orders

### 17.9 The Operational Acceptance

- [ ] Roland prescribes a real prescription end-to-end at Doc For Drivers
- [ ] Roland prescribes Botox at Doc For Skin (procedure order)
- [ ] At least one lab order goes out and receives a real result
- [ ] At least one repeat prescription cycle (issue → patient request → clinician approval → re-issue)
- [ ] At least one safety check fires correctly in real consultation
- [ ] Doc For Skin uses payment-gating module for procedures (Premium tier required)

When all 17.1-17.9 criteria pass, RolDe Phase 1 prescribing module is built.

---

## End of Bible 4.5

This is the unified clinical orders module — prescribing, labs, radiology, procedures all flowing through a single architecture with shared safety checks, approval gates, payment workflows, and audit trails. The Cluster B3 architectural insight made operational.

When in doubt about an orders decision: does it preserve the agentic boundary (drafts everything, sends nothing without approval)? Does it run the appropriate safety checks? Does it produce a feed entry that lives in the patient's canonical view? Does it handle failure modes gracefully?

The next sub-Bible to draft is **4.6 — RolDe Module: Clinical Documentation** (the patient feed architecture in detail, photo management, document handling, the everything-in-the-feed principle operationalised).

— Roland Manoj Jayasekhar, with Devipangaj
RoDee, May 2026
