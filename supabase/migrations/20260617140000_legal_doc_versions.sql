-- Legal & Safety documents become EDITABLE (Roland 2026-06-17, Campaigns-style
-- flow). Each document's CONTENT lives here as versioned rows a Custodian can
-- draft → preview → publish; publishing supersedes the prior version (kept for
-- audit). The doc CATALOG (which docs exist, their title/icon/tone) stays in code
-- (lib/legal.ts) — only the editable content (intro + sections) is in the DB.
create table if not exists public.legal_doc_versions (
  id           uuid primary key default gen_random_uuid(),
  doc_key      text not null,
  version      text not null,
  status       text not null default 'draft'
                 check (status in ('draft', 'published', 'superseded')),
  intro        text not null default '',
  sections     jsonb not null default '[]'::jsonb,
  created_by   uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- At most ONE published version per document (the one in force).
create unique index if not exists legal_doc_versions_one_published
  on public.legal_doc_versions (doc_key) where status = 'published';
create index if not exists legal_doc_versions_doc_idx
  on public.legal_doc_versions (doc_key, created_at desc);

alter table public.legal_doc_versions enable row level security;

-- Anyone (incl. anon — the public /policy pages) may read the PUBLISHED version.
drop policy if exists legal_published_read on public.legal_doc_versions;
create policy legal_published_read on public.legal_doc_versions
  for select to anon, authenticated using (status = 'published');

-- Custodians manage everything (draft / publish / supersede).
drop policy if exists legal_custodian_all on public.legal_doc_versions;
create policy legal_custodian_all on public.legal_doc_versions
  for all to authenticated using (public.is_custodian()) with check (public.is_custodian());
