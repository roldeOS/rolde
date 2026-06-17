-- Services & Pricing (W1.1.8): the treatments/services a clinic offers + their
-- price. Money is stored as integer PENCE (never a float). Read by the clinic
-- team (for booking/billing later); managed by the Caretaker. Precursor to W4.
create table if not exists public.clinic_services (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  name             text not null,
  description      text,
  price_pence      integer not null default 0 check (price_pence >= 0),
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  active           boolean not null default true,
  sort             integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists clinic_services_tenant_idx on public.clinic_services (tenant_id, sort, name);

alter table public.clinic_services enable row level security;

-- The whole clinic team reads the service list (booking / billing surfaces).
create policy clinic_services_read on public.clinic_services
  for select to authenticated
  using (is_custodian() or tenant_id in (select public.current_user_tenant_ids()));

-- Only the Caretaker (or a Custodian) manages it.
create policy clinic_services_write on public.clinic_services
  for all to authenticated
  using (is_custodian() or public.is_caretaker_of(tenant_id))
  with check (is_custodian() or public.is_caretaker_of(tenant_id));
