-- ════════════════════════════════════════════════════════════════════════════
-- Sign-in & Security Log  (Bible 4.1 §5.4 / the prescribed `auth_audit_log`)
--
-- The durable record of every authentication event — who signed in / out, who
-- FAILED to, who changed a password or hit MFA — and crucially FROM WHERE: the IP
-- address and the device. Append-only; only the SERVER writes (no client path).
--
-- Two feeders, because no single source has everything:
--   1) A pg_cron MIRROR of GoTrue's own journal (auth.audit_log_entries) — the
--      authoritative, IP + device-stamped source for login / logout / password /
--      MFA. GoTrue AUTO-PRUNES that journal, so we copy it somewhere permanent.
--      An Auth Hook can't do this: hook payloads carry no IP (only user_id).
--   2) Our login layer writes `login_failed` rows directly (the one event GoTrue's
--      journal doesn't stamp with an IP) — the server reads the request IP there.
--
-- Re-runnable: guarded creates + an idempotent (source_id) mirror.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.auth_audit_log (
  id          uuid primary key default gen_random_uuid(),
  -- the auth.audit_log_entries.id we mirrored (NULL for rows our app wrote directly).
  source_id   uuid unique,
  user_id     uuid references auth.users(id) on delete set null,
  actor_email text,
  -- 'login' | 'logout' | 'login_failed' | 'user_updated_password'
  -- | 'user_recovery_requested' | MFA actions | …
  action      text not null,
  ip_address  text,
  user_agent  text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_auth_audit_user    on public.auth_audit_log (user_id, created_at desc);
create index if not exists idx_auth_audit_action  on public.auth_audit_log (action, created_at desc);
create index if not exists idx_auth_audit_created on public.auth_audit_log (created_at desc);

alter table public.auth_audit_log enable row level security;

-- READ: the Custodian (platform), OR a Caretaker of a clinic the actor belongs to.
-- An auth event is NOT clinic-scoped (you sign in to the platform, not to a clinic),
-- so there is no tenant_id on the row — we scope by the actor's clinic membership,
-- so a Caretaker sees the sign-in activity of THEIR own members (and themselves).
drop policy if exists auth_audit_read on public.auth_audit_log;
create policy auth_audit_read on public.auth_audit_log
  for select using (
    is_custodian()
    or exists (
      select 1 from public.tenant_users m
      where m.user_id = auth_audit_log.user_id
        and is_caretaker_of(m.tenant_id)
    )
  );
-- No INSERT/UPDATE/DELETE policy → only the service role (mirror + login layer)
-- writes; the table is append-only, like audit_log.

-- ── Helper: resolve a user id from an email (for the login-layer failed-attempt
-- writer). SECURITY DEFINER so it can read auth.users; service-role only, so it
-- can never be used for account enumeration from the client. ──────────────────
create or replace function public.user_id_for_email(p_email text)
returns uuid
language sql
security definer
set search_path = auth, public, pg_temp
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;
revoke all on function public.user_id_for_email(text) from public, anon, authenticated;
grant execute on function public.user_id_for_email(text) to service_role;

-- ── The mirror: copy NEW journal rows into our durable log. Best-effort (never
-- raises), idempotent on source_id, and it SKIPS token_refreshed (pure noise —
-- every silent token refresh) so the security log stays about real sign-in events.
create or replace function public.mirror_auth_audit()
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.auth_audit_log
    (source_id, user_id, actor_email, action, ip_address, user_agent, metadata, created_at)
  select
    e.id,
    nullif((e.payload::jsonb)->>'actor_id', '')::uuid,
    (e.payload::jsonb)->>'actor_username',
    (e.payload::jsonb)->>'action',
    e.ip_address,
    coalesce((e.payload::jsonb)->>'user_agent', (e.payload::jsonb)->'traits'->>'user_agent'),
    coalesce((e.payload::jsonb)->'traits', '{}'::jsonb),
    e.created_at
  from auth.audit_log_entries e
  where (e.payload::jsonb)->>'action' is not null
    and (e.payload::jsonb)->>'action' <> 'token_refreshed'
    and not exists (select 1 from public.auth_audit_log a where a.source_id = e.id)
  on conflict (source_id) do nothing;
exception when others then
  -- a mirror failure must never cascade; coverage just catches up next run.
  null;
end;
$$;

-- ── Run the mirror every minute (near-real-time; safe polling — never a trigger
-- on the auth system's own table, which could block sign-ins). ────────────────
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('mirror-auth-audit');
exception when others then
  null; -- not scheduled yet
end $$;

select cron.schedule('mirror-auth-audit', '* * * * *', $cron$ select public.mirror_auth_audit(); $cron$);
