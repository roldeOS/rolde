-- Retire the per-register columns (gmc_number / gdc_number / nmc_pin) now that
-- the generic license_type + license_number pair covers every profession
-- (Roland 2026-06-17). Carry any held number across FIRST so nothing is lost,
-- then drop the three old columns — no lurking superseded fields (MISTAKES #1).
update public.tenant_users set license_type = 'GMC', license_number = gmc_number
  where gmc_number is not null and license_type is null;
update public.tenant_users set license_type = 'GDC', license_number = gdc_number
  where gdc_number is not null and license_type is null;
update public.tenant_users set license_type = 'NMC', license_number = nmc_pin
  where nmc_pin is not null and license_type is null;

alter table public.tenant_users
  drop column if exists gmc_number,
  drop column if exists gdc_number,
  drop column if exists nmc_pin;
