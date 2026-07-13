-- Scribe T2.5 — AUTOTEXT SHORTCUTS (the Carebit steal, approved 2026-07-13's
-- order). Personal typing expansions: ".sn" + space → the writer's own
-- safety-netting sentence, inline in Scribe. PERSONAL by design (unlike
-- templates, which are Caretaker-governed clinic documents): a shortcut is a
-- typing aid — the expanded text lands under the author's own eyes and
-- signature, so governance rides the note, not the snippet.
create table if not exists public.user_autotext (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id),
  user_id    uuid not null references auth.users(id),
  shortcut   text not null,
  expansion  text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index if not exists idx_user_autotext_unique
  on public.user_autotext(user_id, tenant_id, shortcut) where deleted_at is null;

alter table public.user_autotext enable row level security;
drop policy if exists user_autotext_owner on public.user_autotext;
create policy user_autotext_owner on public.user_autotext
  for all
  using      ( user_id = auth.uid() and tenant_id in (select public.current_user_tenant_ids()) )
  with check ( user_id = auth.uid() and tenant_id in (select public.current_user_tenant_ids()) );

grant select, insert, update on public.user_autotext to authenticated;