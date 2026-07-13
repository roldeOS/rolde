-- Scribe T2 (Roland "go for Scribe T2", 2026-07-13) — PERSONAL templates: a
-- user builds their own template from the same parts palette the curated
-- library uses (body_map included). Personal means personal: visible and
-- editable ONLY by their author (clinic-official templates arrive at T3 with
-- Caretaker governance). Soft-delete only, like every record table.
create table if not exists public.user_templates (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id),
  user_id    uuid not null references auth.users(id),
  name       text not null,
  specialty  text not null default 'Personal',
  parts      jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
create index if not exists idx_user_templates_owner
  on public.user_templates(user_id, tenant_id) where deleted_at is null;

alter table public.user_templates enable row level security;

drop policy if exists user_templates_owner on public.user_templates;
create policy user_templates_owner on public.user_templates
  for all
  using      ( user_id = auth.uid() and tenant_id in (select public.current_user_tenant_ids()) )
  with check ( user_id = auth.uid() and tenant_id in (select public.current_user_tenant_ids()) );

grant select, insert, update on public.user_templates to authenticated;
