-- Photo tool — multi-angle Step B: per-clinic PHOTO PROTOCOLS (Roland, 2026-07-22).
--
-- A protocol is a named, ordered list of views (angles) a clinic shoots for a
-- procedure — "Full Face · 5-view", "Abdomen · 3-view", a 10-shot sweep, etc.
-- ANY count. It drives the capture grid + the before/after pairing. Caretaker-
-- owned (Settings), read by the whole clinic. Soft-delete only (config history).
create table if not exists public.clinic_photo_protocol (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id),
  name        text not null,
  views       text[] not null default '{}',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists idx_photo_protocol_tenant
  on public.clinic_photo_protocol(tenant_id, sort_order) where deleted_at is null;

alter table public.clinic_photo_protocol enable row level security;
-- Read: the whole clinic (+ Custodian). Write: the Caretaker only.
drop policy if exists photo_protocol_read on public.clinic_photo_protocol;
create policy photo_protocol_read on public.clinic_photo_protocol
  for select using (
    is_custodian() or tenant_id in (select public.current_user_tenant_ids())
  );
drop policy if exists photo_protocol_write on public.clinic_photo_protocol
;
create policy photo_protocol_write on public.clinic_photo_protocol
  for all using ( is_caretaker_of(tenant_id) )
  with check ( is_caretaker_of(tenant_id) );

grant select, insert, update on public.clinic_photo_protocol to authenticated;
