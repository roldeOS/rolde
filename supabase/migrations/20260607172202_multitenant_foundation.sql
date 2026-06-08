-- ============================================================================
-- RolDe — Multi-tenant foundation
-- Tenancy + identity + the RLS that isolates every clinic's data at the database
-- layer (not just the app being careful). Bible 4.1 §3-5, Bible 4.3 §1.
-- Tenant isolation is constitutional and cannot be retrofitted (Bible 4.8 §13.2).
--
-- NOTE — deliberate refinement of the Bible's literal SQL (Bible 4.2 "frame, not
-- law"): Bible 4.1 §3.3 isolates rows via a per-session GUC
-- (current_setting('app.current_tenant_id')). That is fragile on Supabase's pooled
-- connections (SET doesn't survive transaction-mode pooling) and risks RLS
-- recursion. We achieve the SAME isolation guarantee the Supabase-robust way:
-- policies derive the caller's tenant(s) from their authenticated identity
-- (auth.uid() -> tenant_users) via SECURITY DEFINER helpers, which bypass RLS and
-- so cannot recurse. Same guarantee, sturdier mechanism.
-- ============================================================================

-- 1. Roles (Bible 4.1 §4.2) --------------------------------------------------
create type user_role as enum (
  'custodian',     -- RoDee platform owner (Roland); cross-tenant authority
  'steward',       -- clinic principal; controls tenant configuration
  'practitioner',  -- doctor / ANP / NP; clinical user
  'locum',         -- sessional clinician; time-bounded scope
  'nurse',         -- nurse without prescribing rights
  'receptionist',  -- front desk; appointments, payments, registration
  'accountant',    -- read-only financial access
  'patient'        -- patient portal user
);

-- 2. Shared updated_at trigger ----------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3. tenants — root of the tenant graph (Bible 4.1 §3.2) ---------------------
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

-- 4. custodian_users — platform owners; cross-tenant (Bible 4.1 §3.4) ---------
create table custodian_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER: runs with owner rights, so it bypasses RLS and never recurses.
create or replace function is_custodian()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from custodian_users where user_id = auth.uid());
$$;

-- 5. tenant_users — membership + role within a tenant (Bible 4.1 §4.2) --------
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

-- 6. Isolation helpers (SECURITY DEFINER -> bypass RLS, no recursion) ---------
-- Which active tenants does the caller belong to?
create or replace function current_user_tenant_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from tenant_users
  where user_id = auth.uid() and status = 'active';
$$;

-- Is the caller an active Steward of this tenant?
create or replace function is_steward_of(p_tenant_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tenant_users
    where user_id = auth.uid()
      and tenant_id = p_tenant_id
      and role = 'steward'
      and status = 'active'
  );
$$;

-- 7. RLS — the database itself refuses cross-tenant access -------------------
alter table tenants         enable row level security;
alter table tenant_users    enable row level security;
alter table custodian_users enable row level security;

-- tenants: read only your own tenant(s); Custodian reads all.
create policy tenants_read on tenants
  for select using ( is_custodian() or id in (select current_user_tenant_ids()) );
-- tenants: only the Custodian writes for now (Steward onboarding wizard comes later).
create policy tenants_custodian_write on tenants
  for all using ( is_custodian() ) with check ( is_custodian() );

-- tenant_users: read memberships within your own tenant(s); Custodian reads all.
create policy tenant_users_read on tenant_users
  for select using ( is_custodian() or tenant_id in (select current_user_tenant_ids()) );
-- tenant_users: a Steward manages users in their tenant; Custodian anywhere.
create policy tenant_users_write on tenant_users
  for all
  using      ( is_custodian() or is_steward_of(tenant_id) )
  with check ( is_custodian() or is_steward_of(tenant_id) );

-- custodian_users: only Custodians see or manage the Custodian list.
create policy custodian_users_self on custodian_users
  for all using ( is_custodian() ) with check ( is_custodian() );

-- 8. Grants — the logged-in role may touch these tables; RLS gates which ROWS.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on tenants      to authenticated;
grant select, insert, update, delete on tenant_users to authenticated;
