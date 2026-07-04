-- RolDe Courier C2 (Bible 4.8 §15.7c; Roland "Go" 2026-07-04) — the clinic
-- ADDRESS BOOK Courier sends to, and the clinic's Courier SETTINGS.
--
-- The address book is the CLINIC-level directory (GP practices · pharmacies —
-- Church/Fox/nominated · laboratories · hospitals · clinics · specialists);
-- it complements the per-patient care team (patient_care_providers), whose
-- registered-GP row stays C3's default "send to GP" target. Soft-delete only:
-- a letter sent to an address must forever know where it went.
create table if not exists public.clinic_address_book (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id),

  kind          text not null default 'gp_practice'
                check (kind in ('gp_practice','pharmacy','laboratory','hospital','clinic','specialist','other')),
  name          text not null,            -- 'The Elms Surgery' · 'Church Pharmacy'
  contact_name  text,                     -- a named person there, if any
  email         text,
  phone         text,
  address_line1 text,
  address_line2 text,
  city          text,
  postcode      text,
  notes         text,

  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users(id)
);

create index if not exists idx_address_book_tenant
  on public.clinic_address_book(tenant_id, kind) where deleted_at is null;

alter table public.clinic_address_book enable row level security;
drop policy if exists address_book_tenant_isolation on public.clinic_address_book;
create policy address_book_tenant_isolation on public.clinic_address_book
  for all
  using      ( is_custodian() or tenant_id in (select public.current_user_tenant_ids()) )
  with check ( is_custodian() or tenant_id in (select public.current_user_tenant_ids()) );
-- Soft-delete only — no hard DELETE for the team.
grant select, insert, update on public.clinic_address_book to authenticated;

-- ── Courier settings — one row per clinic (the C2 slice of the spec'd set;
--    C3/C5 read these at send/chase time) ─────────────────────────────────────
create table if not exists public.clinic_courier_settings (
  tenant_id            uuid primary key references public.tenants(id) on delete cascade,

  -- Outbound email carries a SECURE LINK by default (recipient authenticates
  -- to read) rather than a raw attachment.
  secure_link_default  boolean not null default true,
  -- The external-domain double-check before a send leaves the clinic.
  typo_guard           boolean not null default true,
  -- Letters authored by non-clinician roles need a clinician countersign.
  countersign_required boolean not null default false,
  -- Staff may dispatch on a clinician's behalf (the author stays the author).
  delegated_sending    boolean not null default false,
  quiet_hours_enabled  boolean not null default false,
  quiet_start          text not null default '20:00',
  quiet_end            text not null default '08:00',
  -- C5: auto-chase an unopened letter after N days.
  chase_after_days     integer not null default 7 check (chase_after_days between 1 and 30),

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.clinic_courier_settings enable row level security;
drop policy if exists courier_settings_read on public.clinic_courier_settings;
create policy courier_settings_read on public.clinic_courier_settings
  for select to authenticated
  using (is_custodian() or tenant_id in (select public.current_user_tenant_ids()));
drop policy if exists courier_settings_write on public.clinic_courier_settings;
create policy courier_settings_write on public.clinic_courier_settings
  for all to authenticated
  using (is_custodian() or public.is_caretaker_of(tenant_id))
  with check (is_custodian() or public.is_caretaker_of(tenant_id));
grant select, insert, update on public.clinic_courier_settings to authenticated;
