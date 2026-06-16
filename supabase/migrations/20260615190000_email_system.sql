-- ============================================================================
-- RolDe email system foundation: content-managed transactional email.
-- App-controlled — NOT Supabase's built-in auth templates (roadmap §15.5;
-- MISTAKES #3). Templates live in code (seed) -> these tables -> the
-- Custodian/Caretaker dashboard editor -> sent via Resend (a React Email shell)
-- -> every send is logged here.
--
--   email_templates      : platform rows (tenant_id NULL, Custodian-owned) +
--                          per-clinic rows (tenant_id set, Caretaker-owned).
--                          Stores STRUCTURED CONTENT (subject/headline/body/CTA),
--                          not raw HTML — the React Email shell renders it at
--                          send time, so editors touch content, never markup.
--   transactional_emails : append-only send log (powers /logs/emails). The
--                          rendered HTML is snapshotted so a send can be
--                          replayed exactly even after its template is edited.
-- ============================================================================

create table email_templates (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid references tenants(id) on delete cascade,  -- NULL = platform (Custodian)
  slug         text not null,
  name         text not null,
  description  text,
  category     text not null default 'system',
  subject      text not null,
  preheader    text,
  headline     text,
  paragraphs   text[] not null default '{}',
  cta_label    text,
  cta_url      text,
  footer_note  text,
  variables    text[] not null default '{}',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint email_templates_category_valid
    check (category in ('auth','system','operational','clinical'))
);
-- A slug is unique within its scope: once across all platform rows, and once
-- per clinic. Two PARTIAL unique indexes because SQL treats NULLs as distinct
-- (a plain unique(tenant_id, slug) would let duplicate platform slugs through).
create unique index uq_email_templates_platform_slug
  on email_templates(slug) where tenant_id is null;
create unique index uq_email_templates_clinic_slug
  on email_templates(tenant_id, slug) where tenant_id is not null;
create index idx_email_templates_tenant on email_templates(tenant_id);
create trigger trg_email_templates_updated before update on email_templates
  for each row execute function set_updated_at();

create table transactional_emails (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid references tenants(id) on delete set null,
  template_slug       text not null,
  to_email            text not null,
  to_name             text,
  subject             text not null,
  status              text not null,
  error_message       text,
  provider_message_id text,
  idempotency_key     text,                 -- same key never sends twice
  variables_used      jsonb,
  source              text not null default 'app',
  rendered_html       text,                 -- snapshot, for exact replay in /logs/emails
  rendered_text       text,
  created_at          timestamptz not null default now(),
  delivered_at        timestamptz,
  constraint transactional_emails_status_valid
    check (status in ('queued','sent','failed'))
);
create index idx_transactional_emails_tenant  on transactional_emails(tenant_id);
create index idx_transactional_emails_slug    on transactional_emails(template_slug);
create index idx_transactional_emails_created on transactional_emails(created_at desc);
create unique index uq_transactional_emails_idempotency
  on transactional_emails(idempotency_key) where idempotency_key is not null;

alter table email_templates      enable row level security;
alter table transactional_emails enable row level security;

-- email_templates — Custodian manages everything (incl. the platform rows a
-- clinic must never touch); a clinic's Caretaker manages that clinic's rows;
-- clinic members read their own clinic's rows.
create policy email_templates_read on email_templates
  for select using (
    is_custodian()
    or (tenant_id is not null and tenant_id in (select current_user_tenant_ids()))
  );
create policy email_templates_write on email_templates
  for all
  using (
    case when tenant_id is null then is_custodian()
         else (is_custodian() or is_caretaker_of(tenant_id)) end
  )
  with check (
    case when tenant_id is null then is_custodian()
         else (is_custodian() or is_caretaker_of(tenant_id)) end
  );

-- transactional_emails — read-only to humans (Custodian = all; clinic members =
-- their clinic's sends). INSERTs happen server-side via the service role, which
-- bypasses RLS — so no authenticated write policy is granted.
create policy transactional_emails_read on transactional_emails
  for select using (
    is_custodian()
    or (tenant_id is not null and tenant_id in (select current_user_tenant_ids()))
  );

grant select, insert, update, delete on email_templates      to authenticated;
grant select                          on transactional_emails to authenticated;
