# RolDe — Bible 4.1: Architecture

> *"The architecture is the constitution made operational."*
>
> Version 1.0 | Last Updated: 10 May 2026 | RolDe Ltd | CONFIDENTIAL
>
> The technical foundation. Inherits from Bible 0 v1.2 (group defaults) and Bible 4.0 (RolDe constitution).

---

## How to Use This Document

This is the **technical foundation document** for the RolDe healthcare operating system. It defines:

- The infrastructure RolDe runs on
- The multi-tenant data architecture
- Authentication and authorisation patterns
- Database schema philosophy
- Deployment topology
- The boundary between web application (Vercel) and AI inference (M4 Max)
- Background job orchestration
- File storage patterns
- The technical decisions that operationalise Bible 4.0's constitutional principles

**Loading order for Claude Code sessions**:
1. Bible 0 v1.2 — group defaults
2. Bible 4.0 — RolDe constitution
3. This Bible 4.1 — technical foundation
4. Specific Bible 4.x — module being built

When this Bible specifies a technical decision, that decision is the default for every RolDe-powered product unless a specific Bible (4.4, 4.5, 4.6, 4.7) explicitly overrides it for a justified reason.

---

## Table of Contents

1. Architectural Constitution
2. Infrastructure Stack
3. Multi-Tenant Data Architecture
4. Authentication and Authorisation
5. Database Schema Philosophy
6. The Web App / AI Server Separation
7. Background Job Orchestration
8. File Storage Architecture
9. Real-Time Communication
10. The Embeddable Booking Widget
11. Deployment Topology
12. Environment and Secret Management
13. Logging, Monitoring, and Audit
14. Backup and Disaster Recovery
15. Security Posture
16. Performance Budget
17. Code Organisation
18. Testing Philosophy
19. Constitutional Principle Mapping
20. Acceptance Criteria for "RolDe Is Built"

---

## 1. Architectural Constitution

Before any specific technical decision, the architecture itself has a constitution. Every subsequent decision in this Bible derives from these:

### 1.1 The Independence Constitution

RolDe is **a network of independent clinic tenants linked by consent.** Each clinic's data exists in its own logical and physical isolation. There is no shared patient database. There is no federated read across clinic boundaries without explicit consent at both institutional and individual levels.

This constitutional commitment shapes every database decision, every API design, every authorisation rule.

### 1.2 The Self-Hosted Intelligence Constitution

The clinical AI (Gemma 4 31B, Apache 2.0) runs on infrastructure RoDee Ltd controls — initially Roland's M4 Max, eventually a dedicated Mac Studio, eventually UK-regulated GPU hosting. The AI is never API-rented. Per-token pricing is never the operational model.

This constitutional commitment shapes the inference stack, the training pipeline, and the operational cost structure.

### 1.3 The Calm Architecture Constitution

The architecture itself must be calm. Predictable behaviour. Clear failure modes. No mysterious timeouts. No magic retry loops. No silent degradation. When things break, they break observably; when they recover, they recover deterministically. The clinician should never wonder *"is RolDe broken or am I doing something wrong?"*

This constitutional commitment shapes the error handling, the observability stack, and the user-facing degradation patterns.

### 1.4 The Replaceable Substrate Constitution

Every dependency RolDe takes on must be replaceable. The model is Apache 2.0 (replaceable). The framework is open source (replaceable). The hosting is portable (Vercel today, but the codebase deploys anywhere with Node + PostgreSQL). The training data and methodology are RoDee's intellectual property, not any vendor's.

This constitutional commitment shapes vendor selection, code organisation, and the long-term independence of the platform.

---

## 2. Infrastructure Stack

The complete technical stack for RolDe-powered products, locked at v1.0.

### 2.1 Stack Summary Table

| Layer | Technology | Rationale |
|---|---|---|
| Web Framework | Next.js 15+ App Router | Industry standard, RSC support, Vercel-optimal, large talent pool |
| Hosting (Web) | Vercel | Native Next.js, edge network, predictable pricing |
| Database | Supabase (PostgreSQL 15+) | Row-Level Security, pgvector, Realtime, Edge Functions, Auth all in one |
| Authentication | Supabase Auth | Native, integrates with RLS, email/magic-link/OAuth |
| Vector Storage | Supabase pgvector | Same database, no extra service, free tier sufficient |
| AI Base Model | Gemma 4 31B (Apache 2.0) | See Bible 4.7 for full architecture |
| AI Inference Framework | MLX (production) / Ollama (development) | Apple Silicon native; one-command deployment |
| AI Hosting | M4 Max → M5 Studio → UK regulated GPU | See Bible 0 §9.7 for phasing |
| Background Jobs | Supabase pg_cron + Edge Functions | Native primitives, no Inngest, free tier |
| Real-Time Updates | Supabase Realtime | WebSocket subscriptions, native to stack |
| File Storage | Supabase Storage (S3-compatible) | Same provider, RLS-aware, signed URLs |
| Email Sending | Resend | Modern API, transactional + bulk, GDPR-friendly UK delivery |
| SMS/Voice | Plivo | Already in stack for mindate; UK-friendly pricing |
| Payment | Stripe | Industry standard, UK + global, Stripe Connect for tenant payouts |
| Search | Supabase pg_trgm + tsvector | Native PostgreSQL, no Algolia/Elasticsearch dependency |
| OCR | Gemma 4 multimodal (Phase 1.5) / Tesseract fallback | Native to AI stack |
| Component Library | shadcn/ui on Tailwind v4 | Bible 0 §8.3 default; copy-paste, no runtime dependency |
| Forms | React Hook Form + Zod | Type-safe validation, performant |
| Tunnel (AI Server) | Cloudflare Tunnel | Zero open ports, encrypted, free |
| Domain Registrar | Cloudflare Registrar | At-cost pricing, no markup |
| Code Repository | GitHub (private) | Industry standard |
| CI/CD | Vercel auto-deploy from main | Native Next.js integration |

### 2.2 What's Explicitly NOT In The Stack

To prevent drift, here's what RolDe explicitly does **not** use:

- **Inngest** — Supabase native primitives are sufficient; eliminates a paid dependency
- **Auth0 / Clerk** — Supabase Auth is sufficient; eliminates auth as a separate vendor
- **AWS / GCP / Azure for AI hosting** — too expensive at startup scale; bill-shock prone
- **MongoDB / DynamoDB** — PostgreSQL with JSONB columns covers all our needs without a second database
- **Redis as primary cache** — PostgreSQL with appropriate indexing is sufficient at our scale
- **Algolia / Elasticsearch** — pg_trgm and tsvector handle our search needs
- **Datadog / New Relic** — Vercel Analytics + Supabase Logs + custom Custodian dashboard sufficient
- **Zapier / n8n** — workflow automation lives in Supabase Edge Functions
- **Zoho** anything — Roland's documented preference (RoDee memory)

When a Claude Code session is tempted to suggest one of these, the answer is no unless an explicit decision has been recorded to add it.

---

## 3. Multi-Tenant Data Architecture

### 3.1 The Tenancy Model: Logical Isolation in Shared Database

RolDe uses **shared-database multi-tenancy with row-level enforcement.** All tenants share the same Supabase PostgreSQL database, but every row in every table that contains tenant-scoped data has a `tenant_id` foreign key, and Supabase Row-Level Security (RLS) policies enforce that no query returns data across tenant boundaries without explicit Custodian elevation.

This pattern is chosen over alternatives:

| Alternative | Why Not |
|---|---|
| Separate database per tenant | Operational cost explodes at 10+ tenants; backups, migrations, monitoring all multiply |
| Separate schema per tenant | Better than separate DB but still adds operational overhead; Supabase RLS handles isolation cleanly |
| Logical isolation in shared tables | **Selected.** Single database, one schema, RLS policies enforce isolation. |

### 3.2 The `tenants` Table — Foundation

Every RolDe-powered installation has a `tenants` table that is the root of the tenant graph. Every other tenant-scoped table references it.

```sql
CREATE TABLE tenants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT UNIQUE NOT NULL,        -- e.g. 'docforskin', 'docfordrivers'
  name              TEXT NOT NULL,               -- e.g. 'Doc For Skin'
  legal_name        TEXT NOT NULL,               -- e.g. 'Doc For Skin Ltd'
  
  -- Subdomain and routing
  subdomain         TEXT UNIQUE NOT NULL,        -- 'docforskin' (becomes docforskin.rolde.app)
  custom_domain     TEXT UNIQUE,                 -- 'docforskin.com' (optional, with cert verification)
  
  -- Status
  status            TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'active' | 'suspended' | 'archived'
  onboarding_step   TEXT,                             -- tracks where in onboarding the tenant is
  
  -- Configuration (JSONB for flexibility on per-tenant features)
  config            JSONB NOT NULL DEFAULT '{}',  -- modules enabled, integrations, branding
  
  -- Compliance
  ico_registration  TEXT,                         -- ICO Data Controller number
  his_registration  TEXT,                         -- Healthcare Improvement Scotland number (for Scottish clinics)
  cqc_registration  TEXT,                         -- CQC number (for English clinics, future)
  
  -- Billing
  stripe_customer_id    TEXT,
  subscription_tier     TEXT NOT NULL DEFAULT 'starter',  -- 'starter' | 'professional' | 'premium'
  subscription_status   TEXT NOT NULL DEFAULT 'trialing', -- 'trialing' | 'active' | 'past_due' | 'cancelled'
  
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at      TIMESTAMPTZ,
  
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z][a-z0-9-]{2,30}$'),
  CONSTRAINT subdomain_format CHECK (subdomain ~ '^[a-z][a-z0-9-]{2,30}$')
);

CREATE INDEX idx_tenants_status ON tenants(status) WHERE status = 'active';
CREATE INDEX idx_tenants_subscription_status ON tenants(subscription_status);
```

### 3.3 The Tenant-Scoping Convention

Every table that holds tenant-scoped data follows this convention:

```sql
CREATE TABLE patients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  -- ... other columns ...
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_tenant_id ON patients(tenant_id);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON patients
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
```

The application sets `app.current_tenant_id` at the start of every database session based on the authenticated user's tenant membership. RLS policies then prevent any cross-tenant query from returning data.

### 3.4 The Custodian Elevation Pattern

The Custodian (Roland) needs to access cross-tenant data for support, debugging, and platform-level operations. This is handled via an explicit elevation pattern, NOT by bypassing RLS:

```sql
-- Custodian can query across tenants only via this function
CREATE FUNCTION custodian_query<table_name>(target_tenant_id UUID)
  RETURNS SETOF <table_name>
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is Custodian
  IF NOT EXISTS (
    SELECT 1 FROM custodian_users WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Custodian access required';
  END IF;
  
  -- Audit log every cross-tenant access
  INSERT INTO custodian_audit_log (custodian_user_id, action, target_tenant_id, target_table, accessed_at)
  VALUES (auth.uid(), 'cross_tenant_query', target_tenant_id, '<table_name>', NOW());
  
  RETURN QUERY SELECT * FROM <table_name> WHERE tenant_id = target_tenant_id;
END;
$$;
```

Every Custodian access is logged. There is no way for the Custodian to access tenant data without leaving an audit trail.

### 3.5 Subdomain-to-Tenant Resolution

When a request arrives at `docforskin.rolde.app/api/whatever`, the middleware resolves the subdomain to a tenant_id and sets the database session variable:

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = extractSubdomain(hostname);
  
  if (!subdomain || subdomain === 'rolde' || subdomain === 'www') {
    // Public marketing site, no tenant context
    return NextResponse.next();
  }
  
  if (subdomain === 'patient') {
    // Patient portal subdomain — different routing handled separately
    return handlePatientPortalRouting(request);
  }
  
  // Tenant subdomain — resolve to tenant_id
  const supabase = getSupabaseServerClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, status')
    .eq('subdomain', subdomain)
    .single();
  
  if (!tenant || tenant.status !== 'active') {
    return NextResponse.redirect(new URL('/tenant-not-found', request.url));
  }
  
  // Attach tenant_id to request for downstream handlers
  const response = NextResponse.next();
  response.headers.set('x-tenant-id', tenant.id);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
```

Every API route and server component then reads `x-tenant-id` from headers and sets the database session variable before any query.

### 3.6 The Patient Identity Architecture

This is critical and constitutional (Bible 4.0 §10.1).

**Patients are tenant-scoped, NOT global.** The same physical person who is a patient at Doc For Skin AND Doc For Drivers exists as TWO separate patient records in two separate tenants. There is no global patient identity. There is no federated patient record.

When a referral flows from Doc For Drivers to Doc For Skin, the referral letter carries patient information across the tenant boundary with explicit consent at both institutional and individual levels (Bible 0 §12.5). The receiving tenant creates its own patient record from the referral information; the sending tenant retains its own.

This is right for clinical safety, GDPR, and tenant data isolation. It is NOT a limitation; it is a deliberate architectural commitment.

---

## 4. Authentication and Authorisation

### 4.1 The Auth Provider: Supabase Auth

All RolDe-powered products use Supabase Auth as the single authentication provider. No Auth0, no Clerk, no custom auth.

Authentication methods enabled:
- **Email + password** (default for all roles)
- **Email magic link** (alternative for clinicians who prefer passwordless)
- **OAuth via Google** (optional, configured per-tenant by Steward)
- **OAuth via Microsoft** (optional, for clinics with M365 ecosystem)

NOT enabled:
- **SMS/phone OTP** — patients receive booking SMS but don't authenticate via SMS; SIM-swap risk
- **Social logins via Facebook, GitHub, etc.** — not appropriate for healthcare

### 4.2 The Role Taxonomy (Bible 0 §8.5 working names confirmed)

Every authenticated user belongs to exactly one tenant (with the exception of Custodian users, who span tenants). Every user has a role within their tenant.

```sql
CREATE TYPE user_role AS ENUM (
  'custodian',        -- RoDee platform owner (Roland); cross-tenant authority
  'steward',          -- Clinic principal; controls tenant configuration
  'practitioner',     -- Doctor, ANP, nurse practitioner; clinical user
  'locum',            -- Sessional/temporary clinician; time-bounded scope
  'nurse',            -- Nurse without prescribing rights
  'receptionist',     -- Front-desk staff; appointments, payments, registration
  'accountant',       -- Read-only access to financial data
  'patient'           -- Patient portal user
);

CREATE TABLE tenant_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role NOT NULL,
  
  -- Clinician-specific fields
  gmc_number          TEXT,    -- For practitioners with GMC registration
  gdc_number          TEXT,    -- For dental practitioners
  nmc_pin             TEXT,    -- For nurses
  prescribing_rights  BOOLEAN NOT NULL DEFAULT false,
  specialties         TEXT[],  -- e.g. ARRAY['general_practice', 'aesthetic_medicine']
  
  -- Operational
  status              TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'suspended' | 'archived'
  invited_by          UUID REFERENCES auth.users(id),
  invited_at          TIMESTAMPTZ,
  accepted_at         TIMESTAMPTZ,
  last_login_at       TIMESTAMPTZ,
  
  -- Profile
  display_name        TEXT NOT NULL,
  photo_url           TEXT,
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tenant_id, user_id)
);
```

A user can theoretically be a member of multiple tenants (e.g. a locum working at three clinics simultaneously), but each membership is a separate `tenant_users` row.

### 4.3 The Role-Based Access Patterns

For each role, the following access is granted by default. Sub-Bibles for specific modules may override.

| Role | Read Patient Data | Write Notes | Prescribe | Manage Users | Configure Tenant | Cross-Tenant |
|---|---|---|---|---|---|---|
| Custodian | Audit-logged | No (clinical work is for clinicians) | No | Yes (any tenant) | Yes (any tenant) | Yes |
| Steward | Yes | Yes | If GMC + prescribing_rights | Yes (own tenant) | Yes (own tenant) | No |
| Practitioner | Yes (assigned + clinic) | Yes | If prescribing_rights | No | No | No |
| Locum | Yes (session-scoped) | Yes | If prescribing_rights | No | No | No |
| Nurse | Yes (assigned + clinic) | Yes (nursing notes) | No | No | No | No |
| Receptionist | Yes (demographics + appts only) | No (clinical) | No | No | No | No |
| Accountant | No (financial only) | No | No | No | No | No |
| Patient | Yes (own data only) | No | No | No | No | No |

These defaults are encoded in RLS policies on every table.

### 4.4 The Patient Portal Auth Flow

Patients authenticate at `patient.<clinicname>.rolde.app` using a separate auth flow:

1. When a patient is created (by Receptionist or via self-booking), credentials are auto-generated
2. The patient receives a welcome email with login link (Bible 0 §12.6)
3. First login forces password reset
4. Subsequent logins use email + password OR magic link
5. Optional: QR code login for mobile users (token-based, single-use, expires 5 min)

Patient sessions are scoped to their own data only. RLS policies ensure a patient can only ever query rows where `patient_id = current_authenticated_patient_id` in addition to the tenant scoping.

### 4.5 Session Management

- **Session duration**: 8 hours of inactivity for clinical users; 30 minutes for patient portal
- **Refresh tokens**: rotated on each use (security best practice)
- **MFA**: optional in Phase 1, mandatory for Steward role in Phase 2, mandatory for prescribing actions even in Phase 1 (re-authenticate with password before prescribing)
- **Audit on auth events**: every login, logout, failed login, password change, MFA event logged to `auth_audit_log` table

---

## 5. Database Schema Philosophy

### 5.1 Naming Conventions

| Object | Convention | Example |
|---|---|---|
| Tables | snake_case, plural | `patients`, `clinical_notes` |
| Columns | snake_case | `created_at`, `tenant_id` |
| Primary keys | `id` (UUID) | `gen_random_uuid()` default |
| Foreign keys | `<table_singular>_id` | `tenant_id`, `patient_id` |
| Booleans | `is_<x>` or `has_<x>` | `is_active`, `has_consent` |
| Timestamps | `<verb>_at` | `created_at`, `updated_at`, `deleted_at` |
| Enums | snake_case type with prefix | `user_role`, `appointment_status` |
| Junction tables | alphabetical concat | `patients_tags`, not `tags_patients` |
| Indexes | `idx_<table>_<columns>` | `idx_patients_tenant_id` |
| RLS policies | descriptive | `tenant_isolation`, `patient_self_access` |

### 5.2 The Universal Columns

Every tenant-scoped table includes these columns by default:

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
created_by  UUID REFERENCES auth.users(id),
updated_by  UUID REFERENCES auth.users(id),
```

### 5.3 Soft Delete Pattern

Clinical data is never hard-deleted. Soft delete via `deleted_at` timestamp:

```sql
deleted_at  TIMESTAMPTZ,
deleted_by  UUID REFERENCES auth.users(id)
```

RLS policies exclude soft-deleted rows from default queries:

```sql
CREATE POLICY exclude_deleted ON <table>
  FOR SELECT
  USING (deleted_at IS NULL OR is_custodian_query());
```

Hard delete is reserved for: duplicate test data, GDPR right-to-erasure requests (with audit log entry), and Custodian-initiated cleanup.

### 5.4 The Audit Log Pattern

Every clinically-significant action writes to `audit_log`:

```sql
CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  
  actor_user_id UUID NOT NULL REFERENCES auth.users(id),
  actor_role    user_role NOT NULL,
  
  action        TEXT NOT NULL,           -- e.g. 'patient.create', 'note.update', 'prescription.send'
  resource_type TEXT NOT NULL,           -- e.g. 'patient', 'note', 'prescription'
  resource_id   UUID NOT NULL,
  
  before_state  JSONB,                   -- For updates and deletes
  after_state   JSONB,                   -- For creates and updates
  
  ip_address    INET,
  user_agent    TEXT,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tenant_resource ON audit_log(tenant_id, resource_type, resource_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_user_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action, created_at DESC);
```

Audit log entries are append-only — never updated, never deleted (separate from soft-delete; `audit_log` itself has no `deleted_at`).

### 5.5 The JSONB Configuration Pattern

For configuration that varies per tenant (which modules enabled, integration credentials, branding), JSONB columns are used rather than rigid schemas.

```sql
ALTER TABLE tenants ADD COLUMN config JSONB NOT NULL DEFAULT '{}';
```

Example tenant config structure:

```json
{
  "modules": {
    "prescribing": { "enabled": true, "tier": "core" },
    "labs": { "enabled": true, "integration": "tdl_pathology" },
    "radiology": { "enabled": false },
    "aesthetic_photography": { "enabled": true, "watermark": "© Doc For Skin 2026" }
  },
  "integrations": {
    "stripe": { "account_id": "acct_xxx" },
    "pharmacy": { "type": "private", "default_partner": "lloyds_pharmacy_morningside" }
  },
  "branding": {
    "logo_url": "https://storage.../docforskin-logo.svg",
    "primary_color": "#000000",
    "tagline": "Where your skin sees a doctor"
  },
  "consent_settings": {
    "cooling_off_days": { "botox_first": 7, "botox_repeat": 2, "filler_first": 7 }
  },
  "letter_routing": {
    "rheumatology": { "type": "email", "address": "rheum.referrals@nhsforth.scot.nhs.uk" }
  }
}
```

The schema for `config` is documented in Bible 4.3 (Multi-Tenant Foundation) and validated via Zod schemas in the application layer.

### 5.6 Migration Strategy

- All schema changes go through Supabase migrations (`/supabase/migrations/`)
- Migrations are versioned, dated, and reviewed before deployment
- Production migrations are applied via `supabase db push` after staging verification
- No manual SQL changes to production database, ever
- Every migration is reversible (down migration written even if rarely used)

---

## 6. The Web App / AI Server Separation

### 6.1 The Architectural Separation (Critical)

This is one of the most important architectural decisions in RolDe and was a source of confusion earlier in the planning conversation. Captured here unambiguously:

**Vercel hosts the WEB APPLICATION. The M4 Max (or future dedicated Mac Studio) hosts the AI INFERENCE. They are separate services that communicate via HTTPS APIs and websockets.**

```
                    CLINICIAN'S BROWSER
                            |
                            v
                   RolDe Web Application
                  (Next.js on Vercel)
                            |
                            v
                  +----------------------+
                  |   Vercel handles:    |
                  | - UI rendering       |
                  | - Booking flows      |
                  | - Auth & sessions    |
                  | - Database CRUD via  |
                  |   Supabase           |
                  | - Patient portal     |
                  | - Steward admin      |
                  +----------------------+
                            |
                            | HTTPS API call
                            | (when AI is needed)
                            v
              +-------------------------------+
              |   AI Inference Server         |
              |   (Roland's M4 Max via        |
              |    Cloudflare Tunnel)         |
              |                               |
              |   - Gemma 4 31B running       |
              |     locally via MLX/Ollama    |
              |   - RAG against Supabase      |
              |     pgvector                  |
              |   - PubMedBERT embeddings     |
              +-------------------------------+
                            |
                            | Streams response back
                            | via Supabase Realtime
                            v
                    Browser receives streamed AI output
```

Vercel never touches the LLM. Vercel doesn't have GPUs. Vercel can't run Gemma 4. But Vercel happily hosts everything else, and "everything else" is most of RolDe — the consultation UI, the booking flows, the patient portal, the Steward admin, the marketing site, the public clinic websites that embed the booking widget.

The AI is a separate microservice the web app talks to.

### 6.2 The AI API Contract

The AI server exposes a small number of endpoints (specified in detail in Bible 4.7):

| Endpoint | Purpose | Communication |
|---|---|---|
| `POST /v1/consultation/open` | Open ambient AI session for a consultation | HTTPS |
| `WS /v1/consultation/<session_id>` | Persistent websocket for streaming clinical context | WebSocket |
| `POST /v1/query` | Direct question from clinician to AI | HTTPS |
| `POST /v1/draft/<artefact_type>` | Request specific artefact draft (referral letter, prescription, etc.) | HTTPS |
| `GET /v1/health` | Health check endpoint | HTTPS |

All endpoints require an API key bearer token. The web app holds the API key in environment variables; the AI server validates against a known set.

### 6.3 The Cloudflare Tunnel Pattern

Roland's M4 Max sits at his home or office. It is not exposed to the public internet via port forwarding. Instead, **Cloudflare Tunnel** (free, no exposed ports, end-to-end encrypted) makes the AI server reachable at a Cloudflare-issued hostname:

```
ai.rolde.app  →  Cloudflare Tunnel  →  Roland's M4 Max  →  Gemma 4 31B
```

The web app talks to `ai.rolde.app/v1/...`. The tunnel handles certificates, encryption, and reachability. There is no port-forwarding on Roland's home router.

When the M4 Max is offline (Roland is asleep, on holiday, doing maintenance), the tunnel is down. The web app handles this gracefully: ambient AI suggestions don't appear, the panel shows "RolDe is currently offline — clinical work continues normally." This is acceptable behaviour for Phase 1; redundancy is a Phase 2 concern.

### 6.4 Graceful Degradation When AI Is Offline

When the AI server is unreachable:
- The clinical workflow continues without interruption
- The ambient AI panel shows: *"RolDe is currently offline. Clinical work continues normally; AI suggestions will resume when the service is restored."*
- Manual workflows still function (manual prescribing, manual referral letter typing — though slower)
- Background continuous monitoring jobs queue and run when AI returns
- No clinical action is blocked by AI unavailability

This is constitutional (Bible 4.0 Principle 2 — clinician's time is sacred, even more so when AI is unavailable).

### 6.5 Why Not Run AI On Vercel

Vercel doesn't offer GPU-backed serverless functions. Even if it did, the per-second pricing would be hostile to the scale we need. Running Gemma 4 31B on rented per-second GPU would cost £200-£1000/month for our query volume; running it on Roland's M4 Max costs £0/month after the existing hardware purchase.

The architecture embeds the constitutional commitment to self-hosted intelligence (§1.2).

---

## 7. Background Job Orchestration

### 7.1 The Native Supabase Pattern (NO Inngest)

All background jobs run via Supabase native primitives:

| Pattern | Mechanism | Use Case |
|---|---|---|
| Scheduled job (recurring) | `pg_cron` extension | Nightly continuous patient monitoring scan; weekly model evaluation; quarterly RAG corpus refresh |
| Triggered job (event-driven) | Supabase Edge Function + database trigger | When a patient is created, send welcome email |
| Long-running job (with progress) | Edge Function + status row in DB | Fine-tuning pipeline run; OCR'ing uploaded documents |
| Real-time fan-out | Supabase Realtime | AI streaming responses to consultation panel |

### 7.2 The pg_cron Pattern

```sql
-- Schedule a job to run every night at 2am (server time)
SELECT cron.schedule(
  'continuous_patient_monitoring',
  '0 2 * * *',
  $$ SELECT continuous_patient_monitoring_run(); $$
);

-- The function runs across all active tenants
CREATE FUNCTION continuous_patient_monitoring_run() RETURNS void AS $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id FROM tenants WHERE status = 'active' LOOP
    PERFORM monitor_warfarin_inr_overdue(tenant_record.id);
    PERFORM monitor_drug_interactions(tenant_record.id);
    PERFORM monitor_pre_procedure_safety(tenant_record.id);
    PERFORM monitor_overdue_surveillance(tenant_record.id);
    -- etc.
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 7.3 The Edge Function Pattern

For event-driven jobs (sending welcome emails, generating PDFs, calling external APIs):

```
/supabase/functions/
  ├─ send_welcome_email/         (triggered when patient created)
  ├─ generate_referral_pdf/      (triggered when referral approved)
  ├─ ocr_uploaded_document/      (triggered when document uploaded)
  ├─ usage_dashboard_calculator/ (scheduled, calculates per-tenant usage)
  └─ ai_correction_validator/    (triggered when correction submitted)
```

Each function is a TypeScript file deployed to Supabase Edge Runtime. They are stateless, idempotent (re-runnable safely), and have execution time up to 10 minutes (Supabase limit).

### 7.4 The Long-Running Job Pattern

Some jobs (fine-tuning a model, OCR'ing a 200-page document) take longer than 10 minutes. Pattern:

1. Create a row in `background_jobs` table with status `queued`
2. Edge Function picks up the job and updates status to `running`
3. If job exceeds 9 minutes, it persists progress to the row, updates status to `paused`, exits
4. Next pg_cron run picks up `paused` jobs and continues from saved progress
5. On completion, status becomes `completed`; on failure, `failed` with error message

Schema:

```sql
CREATE TABLE background_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id),  -- NULL for cross-tenant jobs
  job_type      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'queued',  -- 'queued' | 'running' | 'paused' | 'completed' | 'failed'
  progress      JSONB NOT NULL DEFAULT '{}',
  input         JSONB NOT NULL,
  result        JSONB,
  error_message TEXT,
  started_at    TIMESTAMPTZ,
  paused_at     TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON background_jobs(status, created_at) WHERE status IN ('queued', 'paused');
```

### 7.5 Why Not Inngest

Inngest is a perfectly good service. RolDe doesn't use it because:

1. Supabase native primitives cover our use cases
2. Adding Inngest means another vendor dependency, another bill, another auth credential
3. Roland's documented preference for in-house solutions over rented services (RoDee memory)
4. At our scale (Phase 1: 5-50 tenants), pg_cron + Edge Functions is sufficient

If at scale (Phase 3: 500+ tenants) we need more sophisticated orchestration, we revisit. Until then, no Inngest.

---

## 8. File Storage Architecture

### 8.1 The Storage Provider: Supabase Storage

All RolDe-powered products store files via Supabase Storage (S3-compatible, RLS-aware, signed URL support). Same provider as the database, no separate vendor.

### 8.2 Bucket Structure

| Bucket | Purpose | Access |
|---|---|---|
| `tenant-public` | Tenant logos, public branding assets | Public read |
| `tenant-private` | Steward-managed confidential files (legal docs, contracts) | Tenant + Custodian only |
| `patient-documents` | OCR'd letters, scanned reports, uploaded files attached to patients | Tenant clinicians + patient (where Steward authorises) |
| `patient-photos` | Aesthetic photography, clinical photography (5-photo standard for Doc For Skin) | Tenant clinicians only (NOT patients by default) |
| `consent-forms` | Signed consent PDFs | Tenant + patient (own only) |
| `letter-pdfs` | Generated referral letters, discharge summaries (final approved versions) | Tenant + patient (where applicable) |
| `ai-training-data` | Anonymised training corpus for fine-tuning | Custodian only |
| `audio-recordings` | Voice ambient AI recordings (where consented; auto-deleted after transcription unless retained) | Tenant + Custodian (encrypted at rest with per-tenant keys) |

### 8.3 The Storage Path Convention

```
<bucket>/<tenant_id>/<resource_type>/<resource_id>/<filename>

Examples:
  patient-photos/<tenant_uuid>/<patient_uuid>/2026-05-10-frontal-before.jpg
  letter-pdfs/<tenant_uuid>/<referral_uuid>/referral-rheumatology-signed.pdf
  consent-forms/<tenant_uuid>/<patient_uuid>/<consent_uuid>/botox-consent-signed.pdf
```

Tenant_id is always the first path segment after the bucket. RLS policies on the storage bucket enforce that requests with a different tenant context cannot read or write across boundaries.

### 8.4 Signed URLs For Patient Access

When a patient accesses a document via the patient portal, the application generates a signed URL with short expiry (15 minutes default):

```typescript
const { data: signedUrl } = await supabase.storage
  .from('patient-documents')
  .createSignedUrl(filePath, 60 * 15);  // 15 min expiry
```

This means patient portal links cannot be shared or screenshot-stored long-term; each access generates a fresh signed URL.

### 8.5 The Watermarking Pipeline

Aesthetic photographs uploaded to `patient-photos` are watermarked automatically (Bible 0 §8.9 — applies to Doc For Skin's 5-photo standard).

When a photo is uploaded:
1. Original raw file uploaded to `patient-photos/<tenant>/raw/<photo_id>.jpg`
2. Edge Function triggered, applies watermark per Steward configuration
3. Watermarked version stored at `patient-photos/<tenant>/watermarked/<photo_id>.jpg`
4. Patient feed references the watermarked version
5. Raw version retained for high-quality export (audit-logged access only)

---

## 9. Real-Time Communication

### 9.1 Supabase Realtime For Live Updates

Real-time updates use Supabase Realtime (WebSocket-based, subscribes to PostgreSQL changes). Used for:

- AI streaming responses to consultation panel (Bible 4.7)
- Dashboard updates when a new appointment is booked
- Notification of incoming referrals (RolDe network)
- Live status updates on background jobs (Custodian Update Console)
- Patient portal updates when clinic uploads a result

### 9.2 The Subscription Pattern

```typescript
// Client subscribes to changes in the patient feed for a specific patient
const subscription = supabase
  .channel(`patient_feed:${patientId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'patient_notes',
      filter: `patient_id=eq.${patientId}`
    },
    (payload) => {
      // Update UI with new entry
      addToFeed(payload.new);
    }
  )
  .subscribe();
```

### 9.3 Realtime Free Tier Considerations

Supabase Realtime is generous on the free tier:
- 200 concurrent connections (sufficient for ~50 active clinicians per tenant simultaneously)
- 2 million messages per month
- No throttling on tenant-isolated channels

At scale (Phase 3+), the Pro plan ($25/month) gives 500 concurrent connections and 5 million messages/month. Sufficient until ~200+ active concurrent clinicians.

---

## 10. The Embeddable Booking Widget

### 10.1 The Widget Purpose

RolDe-powered clinics often have their own brand-identity websites (e.g. `docforskin.com`, future external clinics). These websites need to embed RolDe's booking flow without iframe ugliness or breaking the visual brand.

The Embeddable Booking Widget is a JavaScript snippet that any external website can embed. Bookings made through the widget flow into the clinic's RolDe tenant dashboard.

### 10.2 The Embed Code

A clinic's Steward generates an embed code from their tenant settings:

```html
<div id="rolde-booking-widget" data-tenant="docforskin"></div>
<script src="https://rolde.app/widget/booking.js" async></script>
```

The widget JavaScript:
1. Reads `data-tenant` attribute
2. Fetches the tenant's public configuration (services offered, available slots, branding)
3. Renders the booking flow inline (LatePoint-style modal-driven UX per Bible 0 §8.4)
4. On booking completion, calls back to RolDe API
5. Triggers welcome email + onboarding flow per Bible 0 §12.6

### 10.3 The Widget Customisation

Per-tenant customisation of the widget is configured via the Steward settings:
- Primary brand colour
- Logo
- Available services (subset of full service list)
- Specific practitioners exposed
- Booking confirmation message
- Optional pre-screening questions before booking confirmed

The widget never breaks the host site's CSS — it uses Shadow DOM for full style isolation.

### 10.4 The Widget Performance Requirement

The widget must:
- Add less than 50KB to initial page weight (gzipped)
- Render within 200ms of page load on a fast connection
- Function without blocking the host site's other JavaScript
- Work on browsers IE11+ (just kidding — last 2 versions of Chrome/Safari/Firefox/Edge)

---

## 11. Deployment Topology

### 11.1 The Three Environments

| Environment | Purpose | URL | Database |
|---|---|---|---|
| `local` | Developer machine | `localhost:3000` | Local Supabase (Docker) |
| `staging` | Pre-production testing | `staging.rolde.app` | Supabase staging project |
| `production` | Live | `rolde.app` and `*.rolde.app` | Supabase production project |

### 11.2 The Deployment Flow

```
Developer pushes to feature branch
          ↓
Vercel Preview Deploy (auto, ephemeral URL)
          ↓
Pull request review (Roland)
          ↓
Merge to `main` branch
          ↓
Vercel Production Deploy (auto)
          ↓
Supabase migration applied (manual, after staging verification)
```

### 11.3 The Tenant Subdomain Routing

DNS configuration:
- `rolde.app` — A record to Vercel
- `*.rolde.app` — wildcard CNAME to Vercel
- `ai.rolde.app` — CNAME to Cloudflare Tunnel endpoint

Vercel handles wildcard subdomain routing. The Next.js middleware (§3.5) resolves the subdomain to a tenant_id at request time.

### 11.4 The Custom Domain Pattern

Tenants can optionally serve their RolDe instance via a custom domain (e.g. `app.docforskin.com` instead of `docforskin.rolde.app`). Configuration:

1. Tenant's Steward enters custom domain in tenant settings
2. RolDe issues DNS instructions (CNAME to `cname.rolde.app`)
3. Vercel auto-provisions SSL certificate via Let's Encrypt
4. Middleware resolves custom domain to tenant_id (alternative to subdomain resolution)

This is a Phase 2 feature; Phase 1 ships subdomain-only.

### 11.5 The Public Marketing Site

`rolde.app` (no subdomain) serves the public marketing site:
- Hero section (the constitutional commitments)
- Feature pages (the closed-loop referral, the calm dashboard, the ambient AI)
- Pricing page
- Self-serve onboarding flow (Bible 0 §12.3)
- Documentation
- Blog (future)
- Privacy policy, terms, DPA template

The marketing site is the entry funnel for every future clinic customer (Bible 0 §12.3). Bible 4.M (Marketing) details its content and conversion design.

---

## 12. Environment and Secret Management

### 12.1 The Secret Storage

| Where | What | Examples |
|---|---|---|
| Vercel Environment Variables | App secrets needed at build/runtime | Supabase URL, Supabase anon key, Stripe public key |
| Vercel Server-Side Env Vars | App secrets needed only on server | Supabase service role key, Stripe secret key, AI server API key |
| Supabase Vault | Database-internal secrets | Encryption keys for at-rest patient data, OAuth provider secrets |
| 1Password (team vault) | Operational secrets accessed manually | Cloudflare API tokens, Vercel team tokens, deployment credentials |

NOTHING goes into Git. NOTHING gets emailed. NOTHING is shared via Slack DM.

### 12.2 The .env.example Pattern

Every repository has an `.env.example` file showing what environment variables are required, with placeholder values:

```bash
# Public (safe to expose to client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only (never exposed to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_xxx
ROLDE_AI_SERVER_URL=https://ai.rolde.app
ROLDE_AI_SERVER_API_KEY=your-ai-api-key

# Feature flags
NEXT_PUBLIC_ENABLE_VOICE_AMBIENT_AI=false
NEXT_PUBLIC_ENABLE_CLAUDE_API_FALLBACK=false
```

### 12.3 Secret Rotation Policy

- Service role keys rotated quarterly (or immediately on suspected compromise)
- API keys for inter-service calls rotated semi-annually
- Database passwords are managed by Supabase (rotation handled internally)
- Audit log captures every secret rotation event

---

## 13. Logging, Monitoring, and Audit

### 13.1 The Three Layers

| Layer | Purpose | Tool |
|---|---|---|
| Application logs | Code execution, errors, performance | Vercel Logs (built-in) + Supabase Logs |
| Database audit | Every clinically-significant action | `audit_log` table (§5.4) |
| Custodian metrics | Platform health, tenant usage, costs | Custom Custodian dashboard reading from Supabase metrics API |

### 13.2 The Custodian Dashboard

Built into the RolDe Custodian admin (Roland-only access). Tracks:

- Edge Function invocations per tenant per day
- AI inference count per tenant
- Database storage and query volume
- Realtime subscription count
- Email/SMS/voice send volume (cost driver)
- Cumulative monthly costs against tier limits

Alerts:
- 70% of any free-tier limit (gives runway to act)
- 90% of any free-tier limit (must upgrade now)

Per-tenant breakdown identifies heavy users so RolDe Ltd can have informed pricing conversations.

This is a Phase 1 deliverable, not a future enhancement (Bible 0 §12.7 captured this commitment).

### 13.3 The Error Tracking

Vercel's built-in error tracking is sufficient for Phase 1. Supplemented by:
- Supabase database errors logged to `supabase_logs` table
- AI server errors posted to a dedicated webhook that writes to `ai_error_log` table
- Critical errors (failed prescriptions, failed referrals) trigger a notification to Roland personally

### 13.4 The Performance Monitoring

- Vercel Analytics enabled on production
- Custom timing logs for AI request latency
- Database slow query log (Supabase native) reviewed weekly
- Patient feed render performance measured per tenant (must stay under 500ms for first paint)

---

## 14. Backup and Disaster Recovery

### 14.1 The Backup Strategy

| Data | Backup Method | Frequency | Retention |
|---|---|---|---|
| Supabase database | Native Supabase backups + manual `pg_dump` | Daily automated; weekly manual to S3 | 30 days automated; indefinite for manual |
| Supabase Storage | S3 cross-region replication | Continuous | Indefinite for clinical data; 90 days for transient |
| AI training data | Triple-redundant: M4 Max + Mac Studio + cloud encrypted backup | Continuous | Indefinite (crown jewel — Bible 4.0 Principle 9) |
| Code repository | GitHub + offline mirror to encrypted external drive | Push-triggered | Indefinite |
| Configuration secrets | 1Password + offline encrypted backup | On rotation | Indefinite |

### 14.2 The Recovery Time Objectives

| Scenario | Target RTO | Approach |
|---|---|---|
| Vercel outage | 0 (Vercel handles automatic failover) | None needed |
| Supabase outage (rare, regional) | 4 hours | Manual restore from latest backup to alternative provider if extended |
| AI server down (M4 Max offline) | 0 (graceful degradation per §6.4) | Clinical workflow continues without AI |
| Data corruption | 24 hours | Point-in-time recovery from Supabase backup |
| Catastrophic data loss | 7 days | Restore from offline backups + replay from audit log where possible |

### 14.3 The Disaster Recovery Drill

Quarterly: Roland (or RoDee operations team in future) runs a recovery drill — restore staging from production backup, verify data integrity, document any issues.

Annually: Tabletop exercise — what if Supabase is acquired and changes terms? What if the M4 Max is stolen? What if the AI training data is corrupted? Each scenario walked through, mitigation plans documented.

---

## 15. Security Posture

### 15.1 The Threat Model

RolDe is healthcare software handling sensitive patient data. The threat model:

| Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Casual unauthorised access (compromised user password) | Medium | High | MFA for clinical roles; session timeouts; password complexity rules |
| Targeted phishing of Steward credentials | Low-Medium | High | MFA mandatory for Steward; audit log review; suspicious-login detection |
| SQL injection / web vulnerabilities | Low (Next.js + parameterised queries) | High | Code review; dependency scanning; security headers |
| Insider threat (Custodian misuse of cross-tenant access) | Low | High | Every Custodian access audit-logged; immutable audit log |
| Lost/stolen device with active session | Medium | Medium | Session timeout; remote logout capability; device-aware session invalidation |
| Supabase platform compromise | Very low | Catastrophic | Backups, encryption at rest, ability to migrate to alternative PostgreSQL host |
| AI training data leak | Low | High | Triple-redundant backup; access audit log; encryption at rest |
| Subdomain takeover | Very low | High | Wildcard cert managed by Vercel; DNS owned by RolDe |

### 15.2 The Security Checklist

For Phase 1 launch:

- [x] HTTPS everywhere (Vercel + Cloudflare automatic)
- [x] Security headers (CSP, HSTS, X-Frame-Options, etc.) via Next.js middleware
- [x] CSRF protection (SameSite cookies, origin checks)
- [x] Rate limiting on auth endpoints (Supabase native + middleware)
- [x] Password complexity rules (Supabase Auth configuration)
- [x] Account lockout after repeated failed logins
- [x] Audit log immutable (append-only, no UPDATE/DELETE policies)
- [x] Encrypted at rest (Supabase native)
- [x] Encrypted in transit (TLS 1.3)
- [x] RLS enabled on every tenant-scoped table
- [x] Service role key never exposed to client
- [x] Dependency vulnerability scanning (GitHub Dependabot)
- [x] Code review on every pull request before merge

For Phase 2:
- [ ] MFA mandatory for all clinical roles (not just Steward)
- [ ] WAF rules via Cloudflare
- [ ] Penetration test by independent security firm
- [ ] Bug bounty programme (when scale justifies)

### 15.3 The GDPR Posture

- ICO registration as Data Controller (RolDe Ltd) and as Data Processor (acting on behalf of tenant clinics who are themselves Data Controllers for their patients)
- DPA template offered to every tenant during onboarding (auto-generated, lawyer-reviewed)
- Privacy policy on `rolde.app` and on every tenant subdomain
- Right to access: patients can request all their data via patient portal; tenants can request all clinic data via Steward admin
- Right to erasure: requests handled via Custodian, audit-logged, hard-delete pattern with audit trail
- Data residency: all data in EU/UK regions (Supabase EU region; Vercel EU edge nodes; Cloudflare EU/UK)

---

## 16. Performance Budget

### 16.1 The Page-Level Budget

Every RolDe page has a performance budget. Pages exceeding budget block deployment.

| Page Type | First Contentful Paint | Time to Interactive | Largest Contentful Paint | Bundle Size |
|---|---|---|---|---|
| Marketing site (`rolde.app`) | < 1.0s | < 2.0s | < 1.5s | < 200KB |
| Tenant dashboard | < 1.5s | < 2.5s | < 2.0s | < 400KB |
| Consultation screen | < 1.0s | < 2.0s | < 1.5s | < 350KB |
| Patient portal | < 1.5s | < 2.5s | < 2.0s | < 250KB |
| Booking widget (embedded) | < 0.5s | < 1.5s | < 1.0s | < 50KB |

These are budgets, not targets. The actual numbers should be lower.

### 16.2 The Patient Feed Performance

Bible 0 §8.9 commits to lazy loading. Specific implementation:

- Initial load: most recent 20 entries
- Each scroll-up batch: 20 more entries
- Virtualised rendering (react-window or similar) for scroll performance
- Images lazy-loaded as they enter viewport
- AI suggestion cards prefetched once when consultation opens
- Total memory footprint: < 100MB even with 5+ years of patient history

### 16.3 The AI Response Performance

| Metric | Target | Acceptable | Unacceptable |
|---|---|---|---|
| Time to first token (ambient AI) | < 500ms | < 1s | > 2s |
| Tokens per second (Gemma 4 31B at 4-bit on M4 Max) | 25-40 | 20-25 | < 20 |
| Citation lookup (RAG retrieval) | < 200ms | < 500ms | > 1s |
| Direct query response (full) | < 3s | < 5s | > 8s |

---

## 17. Code Organisation

### 17.1 The Monorepo Structure

RolDe is a monorepo containing all RolDe-powered products plus shared infrastructure.

```
rolde/
├── apps/
│   ├── web/                    # Main Next.js app (rolde.app + tenant subdomains)
│   ├── ai-server/              # Python AI inference server (runs on M4 Max)
│   ├── widget/                 # Embeddable booking widget
│   └── docs/                   # Documentation site
├── packages/
│   ├── ui/                     # Shared React components (shadcn/ui based)
│   ├── db/                     # Supabase migrations, type definitions
│   ├── ai-types/               # Shared types for AI server <-> web app contract
│   ├── auth/                   # Auth utilities shared across apps
│   ├── billing/                # Stripe integration shared utilities
│   └── eslint-config/          # Shared ESLint config
├── supabase/
│   ├── migrations/             # Database migrations (timestamped)
│   ├── functions/              # Edge Functions
│   └── seed.sql                # Seed data for development
├── infrastructure/
│   ├── cloudflare/             # Cloudflare Tunnel config
│   └── vercel/                 # Vercel project config (vercel.json per app)
├── docs/                       # The Bibles (Bible 0, 4.0, 4.1, etc.)
├── package.json
├── turbo.json                  # Turborepo config for monorepo orchestration
└── pnpm-workspace.yaml
```

### 17.2 The Package Manager

**pnpm** (not npm, not yarn). Rationale: faster installs, strict dependency resolution, monorepo-friendly via workspaces.

### 17.3 The Build Tool

**Turborepo** for monorepo orchestration. Caches builds, parallelises tasks, runs tests only on affected packages.

### 17.4 The TypeScript Configuration

Strict mode enabled across all packages:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

No `any` allowed in production code (except in narrow exception cases with explicit justification comment).

### 17.5 The File Naming Conventions

| File Type | Convention | Example |
|---|---|---|
| React components | PascalCase | `PatientFeed.tsx` |
| Hooks | camelCase, prefix `use` | `useTenantContext.ts` |
| Server actions | camelCase | `createPatient.ts` |
| API routes | kebab-case | `/api/patients/[id]/route.ts` |
| Utility functions | camelCase | `formatDateForFeed.ts` |
| Types | PascalCase | `Patient.ts`, `ClinicalNote.ts` |
| Database migrations | timestamp_description | `20260510120000_create_tenants.sql` |
| Bibles | snake_case with version | `bible_4_1_architecture.md` |

---

## 18. Testing Philosophy

### 18.1 The Testing Pyramid

| Layer | Coverage Target | Tool |
|---|---|---|
| Unit tests | 70% of business logic | Vitest |
| Integration tests | All critical paths | Vitest + Supabase test instance |
| End-to-end tests | All user-facing flows | Playwright |
| AI evaluation | Held-out clinical scenarios | Custom evaluation harness (Bible 4.7) |

### 18.2 The Critical Test Cases

These tests must pass before any deployment to production:

- [ ] User cannot access another tenant's patient data
- [ ] RLS policies prevent cross-tenant queries even with crafted SQL
- [ ] Custodian cross-tenant queries are audit-logged
- [ ] Patient cannot access another patient's data
- [ ] Soft-deleted records don't appear in default queries
- [ ] Audit log is append-only (UPDATE/DELETE rejected)
- [ ] AI responses cite sources for every clinical claim
- [ ] AI says "I don't have a confident answer" when below confidence threshold
- [ ] Approved referrals route correctly (in-network vs PDF email)
- [ ] Patient onboarding email triggers and signed consents flow into patient feed
- [ ] Lazy loading works on patient feeds with 1000+ entries
- [ ] Booking widget functions on a clean external host page

### 18.3 The Manual Testing By Roland

Some things Roland (as the founder-clinician) personally tests before any external clinic sees them:

- Every clinical workflow used at Doc For Drivers and Doc For Skin
- Every AI suggestion pattern in real consultations
- Every consent form integration
- Every dashboard layout variant
- Every error message a clinician might see

This is not a substitute for automated testing; it's the constitutional commitment that the founder-clinician validates the product against his own clinical practice before strangers do.

---

## 19. Constitutional Principle Mapping

This section explicitly maps each constitutional principle from Bible 4.0 §7 to its operationalisation in this Bible. Future Claude Code sessions can use this to verify their implementations honour the principles.

| Bible 4.0 Principle | Operationalised In Bible 4.1 As |
|---|---|
| 1. Patient safety is absolute | RLS isolation; audit log; soft-delete pattern; security checklist |
| 2. Clinician's time is sacred | Performance budget; graceful AI degradation; lazy-loading patient feed |
| 3. Authority comes from sources, not voices | (Operationalised in Bible 4.7 — AI architecture) |
| 4. Drafts autonomously, sends nothing autonomously | (Operationalised in Bible 4.4 — referral pipeline; Bible 4.7 — AI architecture) |
| 5. Honest about uncertainty | (Operationalised in Bible 4.7 — confidence-aware output) |
| 6. Calm is the default aesthetic | (Operationalised in Bible 4.2 — design system) |
| 7. One canonical view of the patient | Patient feed schema; lazy loading; bucket structure |
| 8. Configuration per tenant, not one-size-fits-all | JSONB tenant config; subdomain routing; embeddable widget |
| 9. Training data is the crown jewel | Backup strategy (triple-redundant); audit log on training data access |
| 10. The brand is the promise | Code organisation; testing philosophy; Roland's manual validation |

---

## 20. Acceptance Criteria for "RolDe Is Built"

This Bible defines success at the architectural level. RolDe's architecture is "built" when:

### 20.1 Phase 1 Architectural Acceptance

- [ ] Monorepo structure created with `apps/web`, `apps/ai-server`, `apps/widget`, packages, supabase, infrastructure
- [ ] Supabase project provisioned with RLS enabled on every tenant-scoped table
- [ ] `tenants` table created and seeded with Doc For Drivers and Doc For Skin
- [ ] Subdomain routing works: `docforskin.rolde.app` resolves to Doc For Skin tenant context
- [ ] Custom domain support deferred to Phase 2 (acceptable)
- [ ] Patient portal subdomain routing works: `patient.docforskin.rolde.app`
- [ ] Auth flows tested for all roles (Custodian, Steward, Practitioner, Receptionist, Patient)
- [ ] Audit log captures every clinically-significant action
- [ ] AI server reachable via Cloudflare Tunnel at `ai.rolde.app`
- [ ] Web app gracefully degrades when AI server is offline
- [ ] Background job orchestration via pg_cron + Edge Functions operational
- [ ] File storage buckets created with correct RLS policies
- [ ] Custodian dashboard shows usage metrics for tracking against free-tier limits
- [ ] Backups configured and at least one successful manual backup completed
- [ ] Security checklist passed
- [ ] Performance budgets met for marketing site, dashboard, consultation screen, patient portal
- [ ] Booking widget renders on a test external host (`docforskin.com`) and creates a booking that flows into the tenant
- [ ] All Phase 1 critical test cases pass

### 20.2 The Operational Acceptance

- [ ] Roland can use RolDe for actual Doc For Drivers consultations end-to-end
- [ ] Roland can use RolDe for actual Doc For Skin consultations end-to-end (post-HIS registration)
- [ ] At least one external test clinic onboarded via self-serve flow
- [ ] At least one cross-tenant referral flowed successfully (Doc For Drivers → Doc For Skin)
- [ ] At least one external referral PDF emailed correctly to NHS service
- [ ] Custodian Update Console runs at least one full pipeline cycle
- [ ] No P0 incidents in first month of operation
- [ ] Roland personally validates every workflow before any external clinic uses it (Bible 4.0 §11.1)

When all 20.1 and 20.2 criteria are met, RolDe Phase 1 architecture is complete.

---

## End of Bible 4.1

This is the technical foundation. Every other RolDe sub-Bible (4.2 through 4.M, plus 5 and 6) inherits from here.

When in doubt about a technical decision: does this honour the four architectural constitutions (§1.1-1.4)? Does it operationalise a Bible 4.0 constitutional principle without violating it? Does it survive the calm architecture test — predictable, observable, replaceable?

The next sub-Bible to draft is **4.2 — RolDe Design System** (RolDe-specific extensions to Bible 0's group defaults, including the consultation screen layout, the AI panel design, the calm dashboard pattern, and the per-specialty design tokens).

— Roland Manoj Jayasekhar, with Devipangaj
RoDee, May 2026
