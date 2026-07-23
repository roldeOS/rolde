-- Photo phase: rename the value 'other' -> 'general' ALL the way down (Roland
-- 2026-07-23: "I don't want any ambiguity in code later on"). A non-before/after
-- shot is a GENERAL clinical photo. Deep rename — value, default, and constraint.
alter table public.patient_photo drop constraint if exists patient_photo_phase_check;
update public.patient_photo set phase = 'general' where phase = 'other';
alter table public.patient_photo alter column phase set default 'general';
alter table public.patient_photo
  add constraint patient_photo_phase_check
  check (phase in ('before', 'after', 'general'));
