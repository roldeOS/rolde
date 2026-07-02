-- W1.2.1/W1.2.2 — the structured record data layer behind SNAPSHOT (Roland 2026-07-01)
-- and, later, the full Problem List / Medication List tabs.
--
-- Two tables, mirroring patient_allergies' grammar exactly (tenant isolation ·
-- soft-delete · point-in-time authorship). SNOMED-ready from day one (NP.1): the
-- optional snomed_code column means the coded record needs no re-migration when
-- coding lands — clinics type free text today, pick coded concepts tomorrow.

-- ── Past Medical History / problems (W1.2.1) ────────────────────────────────
create table patient_problems (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id),
  patient_id  uuid not null references patients(id) on delete cascade,

  title       text not null,             -- e.g. 'Hypertension', 'Appendicectomy 1974'
  snomed_code text,                      -- optional now; the NP.1 coded record later
  onset_date  date,                      -- when it began (nullable — often unknown)
  notes       text,

  -- active = a current problem · resolved = past history (still shown in PMH) ·
  -- entered_in_error = struck (hidden; never hard-deleted).
  status      text not null default 'active'
              check (status in ('active', 'resolved', 'entered_in_error')),

  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users(id)
);

-- ── Medications (W1.2.2) ────────────────────────────────────────────────────
create table patient_medications (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id),
  patient_id  uuid not null references patients(id) on delete cascade,

  drug        text not null,             -- e.g. 'Amlodipine'
  dose        text,                      -- e.g. '5 mg'
  frequency   text,                      -- e.g. 'Once daily' / 'OD' / 'BD'
  route       text,                      -- e.g. 'Oral' (optional)
  snomed_code text,                      -- optional now; dm+d/SNOMED later (NP.1/W3.1)
  notes       text,

  status      text not null default 'active'
              check (status in ('active', 'stopped', 'entered_in_error')),
  started_on  date,
  stopped_on  date,

  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users(id)
);

create index idx_problems_patient    on patient_problems(patient_id, status) where deleted_at is null;
create index idx_medications_patient on patient_medications(patient_id, status) where deleted_at is null;

-- RLS — the database refuses cross-clinic access (same policy grammar as allergies).
alter table patient_problems    enable row level security;
alter table patient_medications enable row level security;

create policy problems_tenant_isolation on patient_problems
  for all
  using      ( is_custodian() or tenant_id in (select current_user_tenant_ids()) )
  with check ( is_custodian() or tenant_id in (select current_user_tenant_ids()) );

create policy medications_tenant_isolation on patient_medications
  for all
  using      ( is_custodian() or tenant_id in (select current_user_tenant_ids()) )
  with check ( is_custodian() or tenant_id in (select current_user_tenant_ids()) );

grant select, insert, update, delete on patient_problems    to authenticated;
grant select, insert, update, delete on patient_medications to authenticated;
