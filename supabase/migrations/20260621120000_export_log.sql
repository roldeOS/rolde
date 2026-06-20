-- Wave D — the EXPORT LOG (URDS PDF Kit §9.5, the audit trail).
-- ---------------------------------------------------------------------------
-- Every audit-grade PDF export is recorded here — who · when · what (title +
-- scope + the columns that left) · the export reference · the SHA-256 of the
-- data — WITH THE ACTUAL PDF ARTIFACT STORED (pdf_base64), so any audit can pull
-- exactly what was downloaded and when. Self-hosted: the artifact lives with its
-- metadata in our own Postgres (base64 text, TOASTed + compressed out-of-line —
-- chosen over bytea because binary insert/read through PostgREST is finicky) —
-- never a 3rd-party store. Soft-delete only (deleted_at) — never hard-deleted.
-- RLS mirrors patient_access_log: Caretaker reads their clinic's trail, Custodian
-- reads all; the SERVER (service role) writes the row — no client insert path.
-- Re-runnable.
-- ---------------------------------------------------------------------------

create table if not exists public.export_log (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  reference     text not null,                          -- EXP-YYYYMMDD-XXXXXX
  fingerprint   text not null,                          -- full 64-char SHA-256 of the data
  title         text not null,
  scope         text,
  format        text not null default 'pdf',
  orientation   text,
  columns       jsonb not null default '[]'::jsonb,     -- the column headers exported
  row_count     integer not null default 0,
  byte_size     integer not null default 0,
  exporter_name text,
  exporter_role text,
  pdf_base64    text,                                   -- the artifact itself (base64)
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz                             -- soft-delete only; never hard-delete
);

create index if not exists export_log_tenant_idx on public.export_log (tenant_id, created_at desc);
create unique index if not exists export_log_reference_idx on public.export_log (reference);

alter table public.export_log enable row level security;

-- Caretaker reads their clinic's exports; Custodian reads all. Live rows only.
drop policy if exists export_log_read on public.export_log;
create policy export_log_read on public.export_log
  for select to authenticated
  using ((public.is_custodian() or public.is_caretaker_of(tenant_id)) and deleted_at is null);

-- No client insert/update/delete — the server (service role) owns the writes.
-- The bytea artifact is never exposed via column grants to anon/authenticated
-- beyond the RLS select above (the download route uses the user's RLS session).
