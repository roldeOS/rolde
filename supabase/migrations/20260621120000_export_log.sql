-- Wave D — the EXPORT LOG (URDS PDF Kit §9.5, the audit trail).
-- ---------------------------------------------------------------------------
-- EVERY data export (PDF and CSV) is recorded here — who · when · what (title +
-- scope + the columns that left) · the export reference · the SHA-256 of the
-- data · the format — WITH THE ACTUAL FILE STORED (artifact_base64), so any audit
-- can pull exactly what was downloaded and when. Self-hosted: the artifact lives
-- with its metadata in our own Postgres (base64 text, TOASTed + compressed
-- out-of-line — chosen over bytea because binary insert/read through PostgREST is
-- finicky) — never a 3rd-party store. Soft-delete only (deleted_at) — never
-- hard-deleted.
--
-- Access: EVERY clinic member reads their clinic's export log (everyone exports —
-- nurses, doctors, all roles), Custodian reads all; the SERVER (service role)
-- writes the row — no client write path. The `reference` is deterministic from
-- the data + date, so it is NOT unique (re-exporting the same data, or the same
-- data as both CSV + PDF, repeats it) — the `id` is the key. Re-runnable.
-- ---------------------------------------------------------------------------

create table if not exists public.export_log (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  reference      text not null,                          -- EXP-YYYYMMDD-XXXXXX (not unique)
  fingerprint    text not null,                          -- full 64-char SHA-256 of the data
  title          text not null,
  scope          text,
  format         text not null default 'pdf',            -- 'pdf' | 'csv'
  orientation    text,
  columns        jsonb not null default '[]'::jsonb,     -- the column headers exported
  row_count      integer not null default 0,
  byte_size      integer not null default 0,
  exporter_name  text,
  exporter_role  text,
  artifact_base64 text,                                  -- the file itself (base64)
  created_at     timestamptz not null default now(),
  deleted_at     timestamptz                             -- soft-delete only; never hard-delete
);

create index if not exists export_log_tenant_idx on public.export_log (tenant_id, created_at desc);
create index if not exists export_log_reference_idx on public.export_log (reference);

alter table public.export_log enable row level security;

-- Every clinic member reads their clinic's exports; Custodian reads all. Live rows only.
drop policy if exists export_log_read on public.export_log;
create policy export_log_read on public.export_log
  for select to authenticated
  using (
    (public.is_custodian() or tenant_id in (select public.current_user_tenant_ids()))
    and deleted_at is null
  );

-- No client insert/update/delete — the server (service role) owns the writes.
