-- Rename the membership "paused" state to "deactivated" (Roland 2026-06-28): the
-- Users & Roles action reads "Activate / Deactivate", so the stored value matches —
-- no old word lurking. (0 rows were 'paused', so nothing to migrate; kept for safety.)
update public.tenant_users set status = 'deactivated' where status = 'paused';

alter table public.tenant_users drop constraint if exists tenant_users_status_valid;
alter table public.tenant_users
  add constraint tenant_users_status_valid
  check (status = any (array['active'::text, 'deactivated'::text, 'archived'::text]));
