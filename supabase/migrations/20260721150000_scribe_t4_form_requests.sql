-- Scribe T4 (Roland "Go for T4", 2026-07-21) — PATIENT-FACING FORMS: a
-- patient-facing template travels to the patient as a Courier secure link
-- (the same token-viewer law as letters: envelope first, a human's press is
-- the honest signal), the patient fills it, and the submission lands in the
-- feed as a typed form_response entry. The form is SNAPSHOTTED at send —
-- what the patient saw is frozen forever (the records law).
alter type feed_entry_type add value if not exists 'form_response';

create table if not exists public.form_requests (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id),
  patient_id       uuid not null references public.patients(id),
  template_id      uuid not null references public.clinic_templates(id),
  -- The frozen form: {name, specialty, parts} exactly as sent.
  template_snapshot jsonb not null,
  recipient_name   text not null,
  recipient_email  text not null,
  status           text not null default 'queued'
                   check (status in ('queued','sent','opened','submitted','failed')),
  view_token       text not null unique,
  token_expires_at timestamptz not null,
  sent_by          uuid references auth.users(id),
  sent_at          timestamptz,
  opened_at        timestamptz,
  submitted_at     timestamptz,
  response_entry_id uuid references public.patient_feed_entries(id),
  failed_reason    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_form_requests_patient
  on public.form_requests(patient_id, created_at);
create index if not exists idx_form_requests_tenant
  on public.form_requests(tenant_id, created_at);

alter table public.form_requests enable row level security;
drop policy if exists form_requests_tenant on public.form_requests;
create policy form_requests_tenant on public.form_requests
  for all
  using      ( is_custodian() or tenant_id in (select public.current_user_tenant_ids()) )
  with check ( is_custodian() or tenant_id in (select public.current_user_tenant_ids()) );

grant select, insert, update on public.form_requests to authenticated;

-- The form envelope's PLATFORM email dress (PHI-minimal: the form lives
-- behind the secure link) — clinic-overridable like every RolDe email.
insert into public.email_templates
  (tenant_id, slug, name, category, description, subject, preheader, headline,
   paragraphs, cta_label, cta_url, footer_note, variables, is_active)
select
  null, 'courier-form', 'Courier — A Form To Complete', 'courier',
  'The RolDe Courier form envelope: carries a secure link to a clinic form (intake, consent, questionnaire). Deliberately patient-minimal.',
  '{{clinic_name}} has a form for you',
  'A short form to complete before your visit',
  'A form from {{clinic_name}}',
  array[
    'Hello {{recipient_name}},',
    '{{sender_line}}',
    'It only takes a few minutes, and your answers go straight to your clinical record — nowhere else. The link is personal to you, so please don''t forward this email.'
  ],
  'Complete Your Form Securely',
  '{{secure_link}}',
  'Sent on behalf of {{clinic_name}} by RolDe OS. If you weren''t expecting this, you can safely ignore this email.',
  array['clinic_name','recipient_name','sender_line','secure_link'],
  true
where not exists (
  select 1 from public.email_templates where slug = 'courier-form' and tenant_id is null
);