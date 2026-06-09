-- ============================================================================
-- RolDe — DEV SEED (rolde-dev only; never production). Idempotent / re-runnable.
-- Two clinics, two Caretakers, and Roland's Custodian identity — enough to
-- exercise tenant isolation AND a real email+password login in dev.
--
-- The auth.users rows are GoTrue-valid: blank (not NULL) token columns + an
-- auth.identities row, so Supabase Auth can actually sign them in. Hand-inserting
-- bare auth.users rows causes "Database error querying schema" on login.
-- Dev password for every seeded user: RolDeDev2026!
-- ============================================================================

insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-4000-8000-000000000001','authenticated','authenticated','roland.custodian@dev.rolde.local',
   crypt('RolDeDev2026!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   '','','','','','','','', now(), now()),
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-4000-8000-000000000002','authenticated','authenticated','roland.skin@dev.rolde.local',
   crypt('RolDeDev2026!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   '','','','','','','','', now(), now()),
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-4000-8000-000000000003','authenticated','authenticated','caretaker.drivers@dev.rolde.local',
   crypt('RolDeDev2026!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   '','','','','','','','', now(), now())
on conflict (id) do nothing;

-- Email identity per dev user (GoTrue's login query expects it).
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', u.id::text, now(), now(), now()
from auth.users u
where u.email like '%@dev.rolde.local'
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

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
  ('b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000003','caretaker','Dr Drivers Caretaker',  true, '1111111', array['general_practice'], now())
on conflict (tenant_id, user_id) do nothing;

-- Dev patients: three at Doc For Skin, one at Doc For Drivers (proves isolation).
insert into patients (id, tenant_id, first_name, last_name, date_of_birth, sex_at_birth, email, phone_mobile, created_by)
values
  ('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','Sarah','Jones','1985-03-12','female','sarah.jones@example.com','07700900001','a0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001','John','Smith','1972-11-05','male','john.smith@example.com','07700900002','a0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000001','Aisha','Khan','1990-07-21','female','aisha.khan@example.com','07700900003','a0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000002','David','Brown','1968-01-30','male','david.brown@example.com','07700900004','a0000000-0000-4000-8000-000000000003')
on conflict (id) do nothing;
