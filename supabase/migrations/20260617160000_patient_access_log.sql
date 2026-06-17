-- Per-patient ACCESS LOG (W1.1.7 §6.14, Roland): every time anyone opens a patient
-- record it's logged — the clinical-governance trail. Access metadata only (who,
-- which record, when, what) — never patient clinical data. Append-only.
create table if not exists public.patient_access_log (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  action     text not null default 'view',
  at         timestamptz not null default now()
);
create index if not exists patient_access_log_tenant_idx on public.patient_access_log (tenant_id, at desc);
create index if not exists patient_access_log_patient_idx on public.patient_access_log (patient_id, at desc);

alter table public.patient_access_log enable row level security;

-- A member logs their OWN access in their OWN clinic.
create policy patient_access_log_insert on public.patient_access_log
  for insert to authenticated
  with check (user_id = auth.uid() and tenant_id in (select public.current_user_tenant_ids()));

-- Caretaker reads their clinic's trail; Custodian reads all. No update/delete (append-only).
create policy patient_access_log_read on public.patient_access_log
  for select to authenticated
  using (public.is_custodian() or public.is_caretaker_of(tenant_id));
