-- Soft-revoke reads as "Pause" (Roland 2026-06-17 — "revoke/suspended are harsh
-- words, Pause is good"). Rename the MEMBERSHIP off-state from 'suspended' to
-- 'paused' so the screen and the database say the same thing (no lurking old
-- word — MISTAKES #1). A paused member keeps their login + authored records and
-- can be restored to 'active'. The TENANT (whole-clinic) status keeps its own
-- 'suspended' value untouched — that's a different concept (a clinic suspended).
alter table public.tenant_users drop constraint if exists tenant_users_status_valid;
update public.tenant_users set status = 'paused' where status = 'suspended';
alter table public.tenant_users
  add constraint tenant_users_status_valid check (status in ('active', 'paused', 'archived'));
