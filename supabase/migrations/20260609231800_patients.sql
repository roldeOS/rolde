-- ============================================================================
-- RolDe — Patients (Bible 4.4 §2.1). Tenant-scoped clinical record.
-- Every other clinical module references patients.
--
-- RLS uses the same Supabase-robust pattern as the foundation (membership-derived
-- via current_user_tenant_ids), not the Bible's literal session GUC. Soft-deleted
-- rows are excluded at the query layer for now; a deleted-exclusion policy is a
-- later hardening. Allergies/alerts tables + the pg_trgm search index land with
-- the consultation screen / search bar.
-- ============================================================================

create table patients (
  id                     uuid primary key default gen_random_uuid(),
  tenant_id              uuid not null references tenants(id) on delete restrict,

  -- Portal auth linkage (NULL until the patient activates their portal)
  user_id                uuid references auth.users(id) on delete set null,

  -- Identity
  first_name             text not null,
  last_name              text not null,
  preferred_name         text,
  pronouns               text,
  date_of_birth          date not null,
  sex_at_birth           text not null,
  gender_identity        text,

  -- Contact
  email                  text,
  phone_mobile           text,
  phone_landline         text,
  preferred_contact      text not null default 'email',

  -- Address
  address_line1          text,
  address_line2          text,
  city                   text,
  postcode               text,
  country                text not null default 'UK',

  -- Emergency contact
  emergency_name         text,
  emergency_relationship text,
  emergency_phone        text,

  -- Clinical context (high-level; detail lives in the feed)
  blood_group            text,
  ethnicity              text,
  occupation             text,

  -- NHS linkage (UK-specific; optional)
  nhs_number             text,
  registered_gp_name     text,
  registered_gp_practice text,
  registered_gp_address  text,

  -- Cached flag for the top-strip
  has_active_alerts      boolean not null default false,

  -- Patient-portal access
  portal_invited_at      timestamptz,
  portal_activated_at    timestamptz,

  -- Lifecycle
  status                 text not null default 'active',
  deceased_at            date,

  -- Universal columns
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  created_by             uuid references auth.users(id),
  updated_by             uuid references auth.users(id),
  deleted_at             timestamptz,
  deleted_by             uuid references auth.users(id),

  constraint patients_email_format check (email is null or email ~ '^[^@]+@[^@]+\.[^@]+$'),
  constraint patients_nhs_format   check (nhs_number is null or nhs_number ~ '^\d{10}$'),
  constraint patients_sex_valid    check (sex_at_birth in ('male','female','intersex','unknown')),
  constraint patients_contact_valid check (preferred_contact in ('email','sms','phone','post')),
  constraint patients_status_valid  check (status in ('active','inactive','deceased','transferred'))
);

create index idx_patients_tenant ON patients(tenant_id) where deleted_at is null;
create index idx_patients_search ON patients(tenant_id, last_name, first_name) where deleted_at is null;
create index idx_patients_dob    ON patients(tenant_id, date_of_birth) where deleted_at is null;
create index idx_patients_user   ON patients(user_id) where user_id is not null;

create trigger trg_patients_updated before update on patients
  for each row execute function set_updated_at();

-- RLS: the database refuses any cross-clinic access. Members of the patient's
-- clinic (or the Custodian) only.
alter table patients enable row level security;

create policy patients_tenant_isolation on patients
  for all
  using      ( is_custodian() or tenant_id in (select current_user_tenant_ids()) )
  with check ( is_custodian() or tenant_id in (select current_user_tenant_ids()) );

grant select, insert, update, delete on patients to authenticated;
