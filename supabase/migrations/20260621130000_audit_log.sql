-- The central ACTIVITY / AUDIT LOG (Bible 4.1 §5.4, 4.3 §5.12, §15.2).
-- ---------------------------------------------------------------------------
-- Every clinically-significant action writes one append-only row here — who did
-- what, to which record, when. This is the spine behind Logs → Activity Log: the
-- single "what happened in this clinic" timeline. APPEND-ONLY — never updated,
-- never deleted (no deleted_at; no UPDATE/DELETE policies) — the medico-legal
-- record. 7-year retention (§15.2). The SERVER (service role) writes; only the
-- Caretaker (their clinic) / Custodian (platform) reads. Re-runnable.
-- ---------------------------------------------------------------------------

create table if not exists public.audit_log (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  actor_user_id  uuid references auth.users(id) on delete set null,
  action         text not null,            -- e.g. 'profile.update', 'patient.create'
  resource_type  text,                     -- e.g. 'clinic_profile', 'patient'
  resource_id    text,                     -- the affected record's id (free text)
  summary        text,                     -- human one-liner ("Updated the clinic profile")
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists audit_log_tenant_idx on public.audit_log (tenant_id, created_at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor_user_id, created_at desc);
create index if not exists audit_log_action_idx on public.audit_log (action, created_at desc);

alter table public.audit_log enable row level security;

-- Caretaker reads their clinic's activity; Custodian reads all. Append-only:
-- NO insert/update/delete policy — the server's service-role writes; nothing is
-- ever mutated or removed.
drop policy if exists audit_log_read on public.audit_log;
create policy audit_log_read on public.audit_log
  for select to authenticated
  using (public.is_custodian() or public.is_caretaker_of(tenant_id));
