-- ============================================================================
-- Live Feed (Roland 2026-07-23) — the patient timeline updates in real time so a
-- pharmacist's entry appears while a clinician writes, without polling and
-- without overloading the app.
--
-- Transport = Postgres Changes on patient_feed_entries (RLS-filtered per patient
-- by the subscriber's JWT). Each change is only a NUDGE; the client then fetches
-- ONLY the rows newer than it holds (feedDelta). Bounded by OPEN pages, not
-- patients. DB-broadcast (realtime.send) was evaluated and rejected: this project
-- has no realtime.messages partitions provisioned, so it silently no-ops — and
-- hand-managing Realtime's internal partitions is brittle. The app design
-- (nudge -> delta) is transport-agnostic, so a future swap needs no app change.
-- ============================================================================

-- Publish the feed table so authorised clients receive INSERT/UPDATE change
-- events. Supabase enforces patient_feed_entries' own RLS per subscriber, so a
-- client only ever sees changes to patients it may access (verified: a caretaker
-- of another clinic receives zero events for this patient). Idempotent.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'patient_feed_entries'
  ) then
    alter publication supabase_realtime add table public.patient_feed_entries;
  end if;
end $$;

-- Realtime health — when a client's live channel fails, it records WHICH clinic,
-- so the Custodian (all clinics) and that clinic's Caretaker can see a clinic
-- whose realtime is flaky. The feed has already fallen back to refetch-on-focus
-- by then: this is the visibility, not the failure.
create table if not exists public.realtime_health (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  patient_id   uuid,
  user_id      uuid not null,
  reason       text not null,
  user_agent   text,
  occurred_at  timestamptz not null default now()
);
create index if not exists realtime_health_tenant_time
  on public.realtime_health (tenant_id, occurred_at desc);
alter table public.realtime_health enable row level security;

-- Reads are role-scoped: Custodian sees all; a clinic's Caretaker sees their own.
-- A plain clinician sees none (verified). A member may log ONLY their own failure,
-- for their own clinic (with_check blocks forging a row for another clinic).
drop policy if exists "rh_select" on public.realtime_health;
create policy "rh_select" on public.realtime_health
  for select to authenticated
  using (public.is_custodian() or public.is_caretaker_of(tenant_id));

drop policy if exists "rh_insert" on public.realtime_health;
create policy "rh_insert" on public.realtime_health
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and tenant_id in (select public.current_user_tenant_ids())
  );
