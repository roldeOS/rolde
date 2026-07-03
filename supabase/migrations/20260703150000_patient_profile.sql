-- The Profile overlay data layer (W1.2, greenlit Roland 2026-07-02; built
-- 2026-07-03): next-of-kin/emergency contacts + the patient's own care team
-- (their GP and other doctors — RolDe Courier's per-patient ADDRESS HOOKS:
-- C3 "send to GP" reads the is_gp row; the clinic-level Address Book (C2)
-- complements this with shared practice entries). Grammar mirrors
-- patient_problems exactly: tenant isolation · soft-delete · authorship.

-- Record changes are FEED entries (the gold-mine timeline law): problems and
-- medications join the existing allergy_recorded/alert_recorded types so every
-- clinically significant record change appears in Clinical Notes, typed.
alter type feed_entry_type add value if not exists 'problem_recorded';
alter type feed_entry_type add value if not exists 'medication_recorded';

-- ── Next of kin & personal contacts ─────────────────────────────────────────
create table if not exists patient_contacts (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id),
  patient_id   uuid not null references patients(id) on delete cascade,

  name         text not null,            -- 'Margaret Jones'
  relationship text not null,            -- 'Spouse' / 'Daughter' / 'Friend'
  -- next_of_kin = the formal NOK · emergency_contact · carer · other
  role         text not null default 'next_of_kin'
               check (role in ('next_of_kin', 'emergency_contact', 'carer', 'other')),
  phone        text,
  email        text,
  notes        text,

  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  deleted_by   uuid references auth.users(id)
);

-- ── The patient's care team (GP & other doctors) ────────────────────────────
create table if not exists patient_care_providers (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id),
  patient_id    uuid not null references patients(id) on delete cascade,

  name          text not null,           -- 'Dr Priya Patel'
  role          text,                    -- 'GP' / 'Consultant Dermatologist' (plain English)
  organisation  text,                    -- 'The Elms Surgery'
  phone         text,
  email         text,
  -- A structured postal address — the Courier posts real letters here (C3).
  address_line1 text,
  address_line2 text,
  city          text,
  postcode      text,
  -- The patient's REGISTERED GP — the Courier's default "send to GP" target.
  is_gp         boolean not null default false,
  notes         text,

  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users(id)
);

create index if not exists idx_contacts_patient
  on patient_contacts(patient_id) where deleted_at is null;
create index if not exists idx_care_providers_patient
  on patient_care_providers(patient_id) where deleted_at is null;
-- One registered GP per patient (PDS grammar) — the app moves the flag; the
-- database refuses a second.
create unique index if not exists idx_care_providers_one_gp
  on patient_care_providers(patient_id) where is_gp and deleted_at is null;

-- RLS — the database refuses cross-clinic access (same grammar as problems).
alter table patient_contacts       enable row level security;
alter table patient_care_providers enable row level security;

drop policy if exists contacts_tenant_isolation on patient_contacts;
create policy contacts_tenant_isolation on patient_contacts
  for all
  using      ( is_custodian() or tenant_id in (select current_user_tenant_ids()) )
  with check ( is_custodian() or tenant_id in (select current_user_tenant_ids()) );

drop policy if exists care_providers_tenant_isolation on patient_care_providers;
create policy care_providers_tenant_isolation on patient_care_providers
  for all
  using      ( is_custodian() or tenant_id in (select current_user_tenant_ids()) )
  with check ( is_custodian() or tenant_id in (select current_user_tenant_ids()) );

grant select, insert, update, delete on patient_contacts       to authenticated;
grant select, insert, update, delete on patient_care_providers to authenticated;
