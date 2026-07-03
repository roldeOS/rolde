-- Patient demographics — the COMPLETE registration dataset (Roland 2026-07-03:
-- "make sure the Full Profile has all the elements that actually need adding").
-- Dug against the industry standards a 2026 UK-first clinical OS must speak:
--   · NHS PDS / GP Connect patient banner: title · middle names · known-as ·
--     gender identity (DISTINCT from sex at birth) · pronouns
--   · NHS ethnicity categories (2021 census groups) — clinical datasets expect it
--   · Accessible Information Standard (DCB1605): preferred language ·
--     interpreter needed · communication needs (large print, BSL, easy read…)
--   · contact preference (how the patient wants to be reached — feeds Courier)
--   · occupation (clinically live: occ-health pack, contact dermatitis…)
--   · nominated pharmacy (free text today; a Courier address hook at W3)
-- All nullable — nothing new is forced on existing records; the registration
-- minimum (name · DOB · sex · mobile · email) stays the minimum.
--
-- HONEST NOTE (post-apply): the ORIGINAL patients scaffold already carried all
-- twelve columns — this migration was a guarded no-op that formalises them in
-- the migration history; the app's Details form + audit map now actually USE
-- them. (The scaffold also holds unused siblings — preferred_name,
-- preferred_contact, registered_gp_name/practice/address — flagged to Roland
-- as deep-clean candidates now that known_as/contact_preference and
-- patient_care_providers are the real homes.)
alter table public.patients
  add column if not exists title                text,
  add column if not exists middle_names         text,
  add column if not exists known_as             text,
  add column if not exists gender_identity      text,
  add column if not exists pronouns             text,
  add column if not exists ethnicity            text,
  add column if not exists preferred_language   text,
  add column if not exists interpreter_needed   boolean not null default false,
  add column if not exists communication_needs  text,
  add column if not exists contact_preference   text,
  add column if not exists occupation           text,
  add column if not exists nominated_pharmacy   text;

comment on column public.patients.known_as is
  'Preferred / known-as name — what the clinic actually calls the patient.';
comment on column public.patients.gender_identity is
  'Gender identity — distinct from sex_at_birth (NHS standard); free-select.';
comment on column public.patients.communication_needs is
  'Accessible Information Standard needs — large print, BSL interpreter, easy read…';
comment on column public.patients.nominated_pharmacy is
  'The patient''s nominated pharmacy (free text v1; a Courier address hook at W3).';
