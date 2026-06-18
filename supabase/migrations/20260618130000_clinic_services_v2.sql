-- Services & Pricing v2 (W1.1.8) — make the service catalogue robust enough to
-- drive booking + billing (Roland 2026-06-18). v1 was a flat name/price/duration
-- list; v2 adds:
--   • category        — a grouping the UI sections by (free text, clinic's own).
--   • code            — a short service code (e.g. "BTX-1"), unique per clinic.
--   • service_type    — how it's sold: one-off · course (multi-session) · membership.
--   • course_sessions — how many sessions a course runs (only when type = course).
--   • vat_exempt      — when the clinic charges VAT, mark a service VAT-free.
--   • deposit_pence   — a per-service deposit; NULL inherits the clinic default.
-- These conditional fields (vat_exempt, deposit_pence) only surface in the UI when
-- the matching switch is on in Commercial Settings (clinic_commercial_settings).
alter table public.clinic_services
  add column if not exists category        text,
  add column if not exists code            text,
  add column if not exists service_type    text not null default 'one_off',
  add column if not exists course_sessions integer,
  add column if not exists vat_exempt      boolean not null default false,
  add column if not exists deposit_pence   integer;

-- Constrain the new columns (guard against bad writes even via raw PostgREST).
do $$ begin
  alter table public.clinic_services
    add constraint clinic_services_service_type_chk
    check (service_type in ('one_off', 'course', 'membership'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.clinic_services
    add constraint clinic_services_course_sessions_chk
    check (course_sessions is null or course_sessions > 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.clinic_services
    add constraint clinic_services_deposit_pence_chk
    check (deposit_pence is null or deposit_pence >= 0);
exception when duplicate_object then null; end $$;

-- A service code is unique within a clinic (case-insensitive), when set.
create unique index if not exists clinic_services_tenant_code_idx
  on public.clinic_services (tenant_id, lower(code))
  where code is not null and code <> '';
