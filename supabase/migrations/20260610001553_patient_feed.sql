-- ============================================================================
-- RolDe — Patient feed (Bible 4.4 §4.1). The canonical chronological record of a
-- patient: one polymorphic table, entry_type + JSONB payload. The consultation
-- screen reads it oldest-top / newest-bottom (Bible 4.2 §3.4).
--
-- Tenant-isolation RLS (Supabase-robust, membership-derived), consistent with the
-- rest of the schema. appointment_id is a plain column for now — its FK to
-- appointments lands when the calendar module does (Bible 4.4 §3).
-- ============================================================================

create type feed_entry_type as enum (
  'clinical_note',
  'vital_signs',
  'prescription',
  'lab_order',
  'lab_result',
  'radiology_order',
  'radiology_result',
  'photo_set',
  'consent_signed',
  'referral_letter',
  'discharge_summary',
  'sick_note',
  'gp_letter',
  'scanned_document',
  'ai_promotion',
  'consultation_summary',
  'appointment_record',
  'allergy_recorded',
  'alert_recorded'
);

create table patient_feed_entries (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete restrict,
  patient_id        uuid not null references patients(id) on delete cascade,
  entry_type        feed_entry_type not null,
  payload           jsonb not null,
  appointment_id    uuid,
  consultation_id   uuid,
  status            text not null default 'active',
  document_url      text,
  related_entry_id  uuid references patient_feed_entries(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  deleted_at        timestamptz,
  deleted_by        uuid references auth.users(id)
);

create index idx_feed_patient_chronological on patient_feed_entries(patient_id, created_at) where deleted_at is null;
create index idx_feed_tenant_type on patient_feed_entries(tenant_id, entry_type, created_at);
create index idx_feed_consultation on patient_feed_entries(consultation_id) where consultation_id is not null;
create index idx_feed_search on patient_feed_entries using gin (
  to_tsvector('english', coalesce(payload->>'text','') || ' ' || coalesce(payload->>'title',''))
);

create trigger trg_feed_updated before update on patient_feed_entries
  for each row execute function set_updated_at();

alter table patient_feed_entries enable row level security;

create policy feed_tenant_isolation on patient_feed_entries
  for all
  using      ( is_custodian() or tenant_id in (select current_user_tenant_ids()) )
  with check ( is_custodian() or tenant_id in (select current_user_tenant_ids()) );

grant select, insert, update, delete on patient_feed_entries to authenticated;
