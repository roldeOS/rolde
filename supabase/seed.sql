-- ============================================================================
-- RolDe — DEV SEED (rolde-dev only; never production).
-- Idempotent (ON CONFLICT DO NOTHING) so it is safe to re-run.
-- Two clinics, two Caretakers, and Roland's Custodian identity — enough to
-- exercise tenant isolation. Real users arrive via Supabase Auth signup later.
-- ============================================================================

-- Dev auth users (no passwords — we don't log in as these; they exist so
-- tenant_users / custodian_users FKs resolve and RLS can be exercised).
insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-4000-8000-000000000001','authenticated','authenticated','roland.custodian@dev.rolde.local', now(), now()),
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-4000-8000-000000000002','authenticated','authenticated','roland.skin@dev.rolde.local',      now(), now()),
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-4000-8000-000000000003','authenticated','authenticated','caretaker.drivers@dev.rolde.local',  now(), now())
on conflict (id) do nothing;

-- Clinics
insert into tenants (id, slug, name, legal_name, subdomain, status, activated_at)
values
  ('b0000000-0000-4000-8000-000000000001','docforskin','Doc For Skin','Doc For Skin Ltd','docforskin','active', now()),
  ('b0000000-0000-4000-8000-000000000002','docfordrivers','Doc For Drivers','Doc For Drivers Ltd','docfordrivers','active', now())
on conflict (id) do nothing;

-- Roland as the platform Custodian
insert into custodian_users (user_id)
values ('a0000000-0000-4000-8000-000000000001')
on conflict (user_id) do nothing;

-- Caretakers (clinic principal; one per clinic)
insert into tenant_users (tenant_id, user_id, role, display_name, prescribing_rights, gmc_number, specialties, accepted_at)
values
  ('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','caretaker','Dr Roland Jayasekhar', true, '0000000', array['general_practice','aesthetic_medicine'], now()),
  ('b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000003','caretaker','Dr Drivers Caretaker', true, '1111111', array['general_practice'],                      now())
on conflict (tenant_id, user_id) do nothing;
