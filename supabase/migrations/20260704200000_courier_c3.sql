-- RolDe Courier C3 (Roland "Go" 2026-07-04) — OUTBOUND SENDING: dispatches +
-- their journey events. A dispatch is one letter leaving the clinic to one
-- recipient: a secure-link email (Resend) whose token-gated viewer is ALSO the
-- honest "Opened" signal (opening the link IS the open — no tracking pixels).
-- The letter tile's Status Dot + Status Trail read the journey via the feed
-- entry's payload.status, updated at each event.
create table if not exists public.courier_dispatches (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id),
  entry_id         uuid not null references public.patient_feed_entries(id),
  patient_id       uuid not null references public.patients(id),

  recipient_kind   text not null check (recipient_kind in ('gp','address_book','patient','custom')),
  recipient_name   text not null,
  recipient_email  text not null,
  care_provider_id uuid references public.patient_care_providers(id),
  address_book_id  uuid references public.clinic_address_book(id),

  channel          text not null default 'secure_link' check (channel in ('secure_link','attachment')),
  status           text not null default 'queued'
                   check (status in ('queued','sent','delivered','opened','failed')),

  -- The capability token for the public viewer (/courier/view/[token]) —
  -- long-random, single-letter, expiring. Possession = permission to read
  -- THIS letter only (the recognised secure-document-link pattern).
  view_token       text not null unique,
  token_expires_at timestamptz not null,

  sent_by          uuid references auth.users(id),
  sent_at          timestamptz,
  delivered_at     timestamptz,
  opened_at        timestamptz,
  failed_reason    text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_dispatches_entry  on public.courier_dispatches(entry_id);
create index if not exists idx_dispatches_tenant on public.courier_dispatches(tenant_id, created_at);

-- The journey, append-only — every hop is an audited fact.
create table if not exists public.courier_dispatch_events (
  id          uuid primary key default gen_random_uuid(),
  dispatch_id uuid not null references public.courier_dispatches(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id),
  event       text not null,             -- queued · sent · delivered · opened · failed · pdf_downloaded
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_dispatch_events on public.courier_dispatch_events(dispatch_id, created_at);

alter table public.courier_dispatches      enable row level security;
alter table public.courier_dispatch_events enable row level security;

drop policy if exists dispatches_tenant_isolation on public.courier_dispatches;
create policy dispatches_tenant_isolation on public.courier_dispatches
  for all
  using      ( is_custodian() or tenant_id in (select public.current_user_tenant_ids()) )
  with check ( is_custodian() or tenant_id in (select public.current_user_tenant_ids()) );

drop policy if exists dispatch_events_read on public.courier_dispatch_events;
create policy dispatch_events_read on public.courier_dispatch_events
  for select to authenticated
  using ( is_custodian() or tenant_id in (select public.current_user_tenant_ids()) );
drop policy if exists dispatch_events_insert on public.courier_dispatch_events;
create policy dispatch_events_insert on public.courier_dispatch_events
  for insert to authenticated
  with check ( is_custodian() or tenant_id in (select public.current_user_tenant_ids()) );

-- Append-only journeys; dispatches update their status but never vanish.
grant select, insert, update on public.courier_dispatches to authenticated;
grant select, insert on public.courier_dispatch_events to authenticated;

-- ── The Courier's PLATFORM email dress (Roland 2026-07-04: "the emails should
--    follow our elegant design") — content-managed like every RolDe email;
--    a clinic may later override with its own clinic-scoped row. PHI-minimal
--    by design: the letter itself lives behind the secure link. ─────────────
-- Courier grows its own email family (letters now; chase reminders and
-- countersign requests later) — widen the category law once, properly.
alter table public.email_templates drop constraint if exists email_templates_category_valid;
alter table public.email_templates add constraint email_templates_category_valid
  check (category in ('auth','system','operational','clinical','courier'));

insert into public.email_templates
  (tenant_id, slug, name, category, description, subject, preheader, headline,
   paragraphs, cta_label, cta_url, footer_note, variables, is_active)
select
  null, 'courier-letter', 'Courier — A Letter For You', 'courier',
  'The RolDe Courier envelope: carries a secure link to a clinical letter. Deliberately patient-minimal — the letter itself stays behind the link.',
  'A letter from {{clinic_name}}',
  'A secure letter is waiting for you',
  'A letter from {{clinic_name}}',
  array[
    'Hello {{recipient_name}},',
    '{{sender_line}}',
    'This letter is delivered through RolDe Courier. Open it securely with the button below — the link is personal to you, so please don''t forward this email.'
  ],
  'Open Your Letter Securely',
  '{{secure_link}}',
  'Sent on behalf of {{clinic_name}} by RolDe OS. If you weren''t expecting this letter, you can safely ignore this email.',
  array['clinic_name','recipient_name','sender_line','secure_link'],
  true
where not exists (
  select 1 from public.email_templates where slug = 'courier-letter' and tenant_id is null
);
