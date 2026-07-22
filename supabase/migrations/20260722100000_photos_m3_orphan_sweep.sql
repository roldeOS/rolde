-- Photo tool, Milestone 3 (Roland "Go for Milestone 3", 2026-07-22) — hygiene
-- for the photo store: a nightly sweep of ABORTED uploads.
--
-- When a clinician stages photos for a note then walks away WITHOUT Save or
-- Discard (a hard navigation, a closed tab), the rows are left attached to no
-- note (feed_entry_id is null) and never soft-deleted. Left alone they would
-- quietly inflate a patient's gallery and the platform's capacity figures. This
-- adds:
--   1) platform_maintenance_log — a Custodian-readable record of what the
--      platform swept, and when (observability, never a silent job).
--   2) sweep_orphan_staged_photos() — soft-deletes staged rows older than a
--      grace window that were never attached to a note. It NEVER touches a photo
--      that reached a note (feed_entry_id is not null) — those are records.
--   3) a daily pg_cron schedule (03:15 UTC, off-peak).
--
-- Byte reclamation for these non-record uploads (removing the Storage objects
-- themselves) rides the object-storage / Cloudflare-R2 workstream — it needs the
-- Storage API on a schedule (an Edge Function), not pure SQL. Soft-deleting the
-- metadata here is the record-integrity fix: swept rows never show or count.

-- 1) The maintenance log — platform-owned, Custodian-read-only.
create table if not exists public.platform_maintenance_log (
  id      uuid primary key default gen_random_uuid(),
  job     text not null,                -- e.g. 'sweep_orphan_staged_photos'
  swept   int  not null default 0,      -- rows affected this run
  detail  jsonb,
  ran_at  timestamptz not null default now()
);
create index if not exists idx_platform_maintenance_log_ran
  on public.platform_maintenance_log(ran_at desc);

alter table public.platform_maintenance_log enable row level security;
-- Only the platform (SECURITY DEFINER / service role) writes; Custodians read.
drop policy if exists platform_maintenance_log_read on public.platform_maintenance_log;
create policy platform_maintenance_log_read on public.platform_maintenance_log
  for select using ( is_custodian() );
grant select on public.platform_maintenance_log to authenticated;

-- 2) The sweep. SECURITY DEFINER so the scheduled job runs it with full rights;
-- a plain caller cannot (grants revoked below). Grace window defaults to 24h.
create or replace function public.sweep_orphan_staged_photos(
  p_grace interval default interval '24 hours'
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_swept int;
begin
  update public.patient_photo
     set deleted_at = now()
   where feed_entry_id is null      -- never attached to a note...
     and deleted_at is null         -- ...and not already cleared...
     and created_at < now() - p_grace;  -- ...past the grace window.
  get diagnostics v_swept = row_count;

  insert into public.platform_maintenance_log (job, swept, detail)
  values (
    'sweep_orphan_staged_photos',
    v_swept,
    jsonb_build_object('grace', p_grace::text)
  );

  return v_swept;
end;
$$;

-- Not a caller-facing function — only the schedule (and a Custodian tool, later)
-- should ever invoke it.
revoke all on function public.sweep_orphan_staged_photos(interval) from public, anon, authenticated;

-- 3) Schedule it — daily at 03:15 UTC. Re-runnable: drop any prior copy first.
select cron.unschedule(jobid) from cron.job where jobname = 'sweep-orphan-staged-photos';
select cron.schedule(
  'sweep-orphan-staged-photos',
  '15 3 * * *',
  $cron$ select public.sweep_orphan_staged_photos(); $cron$
);
