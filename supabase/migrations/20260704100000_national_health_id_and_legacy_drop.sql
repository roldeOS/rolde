-- Deep clean (Roland 2026-07-04, both his words):
--
-- 1. "Yes do it" — nhs_number → national_health_id. The field went
--    country-aware (NHS/CHI · IHI/PPS · ABHA · IHI · NHI · Emirates ID), so
--    the column name follows, all the way down (no old names lurking).
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='patients' and column_name='nhs_number') then
    alter table public.patients rename column nhs_number to national_health_id;
  end if;
end $$;
comment on column public.patients.national_health_id is
  'The clinic country''s national health identifier — NHS/CHI (GB, Mod-11 checked) · IHI/PPS (IE) · ABHA (IN) · IHI (AU) · NHI (NZ) · Emirates ID (AE).';

-- 2. "Drop them" — the three unused scaffold leftovers, superseded by the
--    real homes: known_as, contact_preference, and patient_care_providers.
alter table public.patients
  drop column if exists preferred_name,
  drop column if exists preferred_contact,
  drop column if exists registered_gp_name,
  drop column if exists registered_gp_practice,
  drop column if exists registered_gp_address;
