-- Scribe T3 (Roland "Go for it", 2026-07-21) — the Caretaker's governance
-- card: template lifecycle flags + the clinic-named body-map colour legend.
-- is_active: retired templates leave the picker but never history (the
-- snapshot law already guards old notes). patient_facing: T4's eligibility
-- flag, governed here from day one.
alter table public.clinic_templates
  add column if not exists is_active boolean not null default true,
  add column if not exists patient_facing boolean not null default false;

-- The clinic's colour legend (Roland approved 2026-07-13): the Caretaker
-- names the pin colours — coral = "Anti-Wrinkle", sage = "Filler"… — and the
-- names print on the record. One row per clinic; labels jsonb {tone: name}.
create table if not exists public.clinic_bodymap_legend (
  tenant_id  uuid primary key references public.tenants(id),
  labels     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.clinic_bodymap_legend enable row level security;
drop policy if exists bodymap_legend_read on public.clinic_bodymap_legend;
create policy bodymap_legend_read on public.clinic_bodymap_legend
  for select to authenticated
  using ( is_custodian() or tenant_id in (select public.current_user_tenant_ids()) );
drop policy if exists bodymap_legend_write on public.clinic_bodymap_legend;
create policy bodymap_legend_write on public.clinic_bodymap_legend
  for all to authenticated
  using ( is_custodian() or public.is_caretaker_of(tenant_id) )
  with check ( is_custodian() or public.is_caretaker_of(tenant_id) );

grant select, insert, update on public.clinic_bodymap_legend to authenticated;