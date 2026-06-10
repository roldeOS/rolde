-- ============================================================================
-- RolDe — Patient allergies + clinical alerts (Bible 4.4 §2.2–2.3).
-- Allergies are critical: they appear on the consultation top strip, never
-- hidden (Bible 4.2 §3.2). Alerts cover everything else clinically loud
-- (MRSA-positive, risk of falls, DNAR, pregnant…).
--
-- patients.has_active_alerts is a CACHED flag for top-strip/list rendering —
-- maintained by trigger here, never by hopeful application code.
-- RLS: same membership-derived tenant isolation as the rest of the schema.
-- ============================================================================

create type allergy_severity as enum ('low','moderate','severe','life_threatening');

create table patient_allergies (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id),
  patient_id  uuid not null references patients(id) on delete cascade,

  substance   text not null,            -- e.g. 'Penicillin', 'Latex'
  reaction    text not null,            -- e.g. 'Anaphylaxis', 'Rash'
  severity    allergy_severity not null,
  notes       text,

  reported_by text,                     -- 'patient' | 'parent' | 'carer' | 'medical_record'
  verified_by uuid references auth.users(id),
  verified_at timestamptz,

  status      text not null default 'active',

  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users(id),

  constraint allergies_status_valid check (status in ('active','inactive','rejected'))
);
create index idx_allergies_patient on patient_allergies(patient_id)
  where status = 'active' and deleted_at is null;

create type alert_priority as enum ('info','warning','critical');

create table patient_alerts (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id),
  patient_id      uuid not null references patients(id) on delete cascade,

  category        text not null,        -- 'infection' | 'safety' | 'clinical' | 'social' | 'other'
  title           text not null,
  description     text,
  priority        alert_priority not null default 'warning',

  expires_at      date,

  status          text not null default 'active',
  resolved_by     uuid references auth.users(id),
  resolved_at     timestamptz,
  resolved_reason text,

  created_at      timestamptz not null default now(),
  created_by      uuid not null references auth.users(id),

  constraint alerts_status_valid check (status in ('active','resolved','expired'))
);
create index idx_alerts_patient_active on patient_alerts(patient_id)
  where status = 'active';

-- Keep patients.has_active_alerts true while ANY active alert exists.
create or replace function sync_has_active_alerts()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pid uuid := coalesce(new.patient_id, old.patient_id);
begin
  update patients set has_active_alerts = exists (
    select 1 from patient_alerts
    where patient_id = pid and status = 'active'
  ) where id = pid;
  return coalesce(new, old);
end;
$$;
create trigger trg_alerts_sync_flag
  after insert or update or delete on patient_alerts
  for each row execute function sync_has_active_alerts();

-- RLS — the database refuses cross-clinic access.
alter table patient_allergies enable row level security;
alter table patient_alerts    enable row level security;

create policy allergies_tenant_isolation on patient_allergies
  for all
  using      ( is_custodian() or tenant_id in (select current_user_tenant_ids()) )
  with check ( is_custodian() or tenant_id in (select current_user_tenant_ids()) );

create policy alerts_tenant_isolation on patient_alerts
  for all
  using      ( is_custodian() or tenant_id in (select current_user_tenant_ids()) )
  with check ( is_custodian() or tenant_id in (select current_user_tenant_ids()) );

grant select, insert, update, delete on patient_allergies to authenticated;
grant select, insert, update, delete on patient_alerts    to authenticated;
