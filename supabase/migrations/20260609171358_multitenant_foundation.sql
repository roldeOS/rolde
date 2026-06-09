-- ============================================================================
-- RolDe multi-tenant foundation (squashed): tenancy + identity + RLS isolation.
-- The user_role enum is born with the final C-word taxonomy — no rename chain.
-- Canonical role list + reasoning: docs/rolde_role_taxonomy.md
--
-- RLS is Supabase-robust: policies derive the caller's tenant(s) from their
-- authenticated identity (auth.uid -> tenant_users) via SECURITY DEFINER helpers,
-- which bypass RLS and so cannot recurse. The database itself refuses any
-- cross-clinic read/write (Bible 4.1 §3-5, 4.3 §1; constitutional, 4.8 §13.2).
-- ============================================================================

create type user_role as enum (
  'custodian',   -- platform super-admin (Roland); cross-tenant
  'caretaker',   -- clinic principal/owner
  'curator',     -- practice manager
  'concierge',   -- reception / front-of-house / support
  'clinician',   -- doctor / clinical professional
  'locum',       -- sessional clinician; time-bounded
  'nurse',       -- nurse
  'chemist',     -- pharmacist
  'cunnere',     -- lab technician (Old English 'one who tests')
  'cofferer',    -- accounts / finance
  'patient'      -- patient portal user
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table tenants (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                text not null,
  legal_name          text not null,
  subdomain           text unique not null,
  custom_domain       text unique,
  status              text not null default 'pending',
  onboarding_step     text,
  config              jsonb not null default '{}'::jsonb,
  ico_registration    text,
  his_registration    text,
  cqc_registration    text,
  stripe_customer_id  text,
  subscription_tier   text not null default 'starter',
  subscription_status text not null default 'trialing',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  activated_at        timestamptz,
  constraint tenants_slug_format       check (slug ~ '^[a-z][a-z0-9-]{2,30}$'),
  constraint tenants_subdomain_format  check (subdomain ~ '^[a-z][a-z0-9-]{2,30}$'),
  constraint tenants_status_valid      check (status in ('pending','active','suspended','archived')),
  constraint tenants_tier_valid        check (subscription_tier in ('starter','professional','premium')),
  constraint tenants_sub_status_valid  check (subscription_status in ('trialing','active','past_due','cancelled'))
);
create index idx_tenants_status on tenants(status) where status = 'active';
create trigger trg_tenants_updated before update on tenants
  for each row execute function set_updated_at();

create table custodian_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_custodian()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from custodian_users where user_id = auth.uid());
$$;

create table tenant_users (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,
  role               user_role not null,
  gmc_number         text,
  gdc_number         text,
  nmc_pin            text,
  prescribing_rights boolean not null default false,
  specialties        text[],
  status             text not null default 'active',
  invited_by         uuid references auth.users(id),
  invited_at         timestamptz,
  accepted_at        timestamptz,
  last_login_at      timestamptz,
  display_name       text not null,
  photo_url          text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint tenant_users_unique unique (tenant_id, user_id),
  constraint tenant_users_status_valid check (status in ('active','suspended','archived'))
);
create index idx_tenant_users_tenant on tenant_users(tenant_id);
create index idx_tenant_users_user   on tenant_users(user_id);
create trigger trg_tenant_users_updated before update on tenant_users
  for each row execute function set_updated_at();

create or replace function current_user_tenant_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select tenant_id from tenant_users where user_id = auth.uid() and status = 'active';
$$;

create or replace function is_caretaker_of(p_tenant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tenant_users
    where user_id = auth.uid() and tenant_id = p_tenant_id
      and role = 'caretaker' and status = 'active'
  );
$$;

alter table tenants         enable row level security;
alter table tenant_users    enable row level security;
alter table custodian_users enable row level security;

create policy tenants_read on tenants
  for select using ( is_custodian() or id in (select current_user_tenant_ids()) );
create policy tenants_custodian_write on tenants
  for all using ( is_custodian() ) with check ( is_custodian() );

create policy tenant_users_read on tenant_users
  for select using ( is_custodian() or tenant_id in (select current_user_tenant_ids()) );
create policy tenant_users_write on tenant_users
  for all
  using      ( is_custodian() or is_caretaker_of(tenant_id) )
  with check ( is_custodian() or is_caretaker_of(tenant_id) );

create policy custodian_users_self on custodian_users
  for all using ( is_custodian() ) with check ( is_custodian() );

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on tenants      to authenticated;
grant select, insert, update, delete on tenant_users to authenticated;
