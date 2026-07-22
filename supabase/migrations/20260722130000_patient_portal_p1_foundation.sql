-- Patient Portal — Phase 1 FOUNDATION (Roland "go for P1", 2026-07-22).
--
-- The patient PRINCIPAL and the ACCESS BOUNDARY, built + crash-tested before any
-- patient UI or real data flows (Roland: build it, try to crash it, then call it
-- iron-clad). A portal patient is a NEW kind of user — never staff — linked to
-- exactly one patient record, who can read ONLY their own record and ONLY items
-- a clinician has shared. Read-only: no policy grants a portal patient any write.
--
-- Safety of the additive policies: staff are never portal accounts, so the new
-- portal policies never widen staff access; and a portal patient is not in
-- tenant_users, so they match NO staff policy — their only door is the narrow
-- portal policy below. Defence in depth: access requires BOTH an ACTIVE account
-- AND the clinic's portal switched on (either lever cuts it instantly).

-- 1) Per-clinic portal config: master on/off + how patients register.
alter table public.tenants
  add column if not exists portal_enabled boolean not null default false,
  add column if not exists portal_registration text not null default 'invite_only'
    check (portal_registration in ('invite_only', 'open'));

-- 2) The portal account — links ONE auth user to ONE patient record.
create table if not exists public.patient_portal_account (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id),
  patient_id  uuid not null references public.patients(id),
  status      text not null default 'invited'
                check (status in ('invited', 'active', 'revoked')),
  created_at  timestamptz not null default now(),
  unique (user_id)  -- one portal identity per auth user
);
create index if not exists idx_portal_account_patient
  on public.patient_portal_account(patient_id);

-- 3) Who is the current session a portal patient FOR? Returns the patient_id
-- only when the account is ACTIVE and the clinic's portal is ON — else null.
-- SECURITY DEFINER (reads the link table past RLS), like current_user_tenant_ids.
create or replace function public.current_portal_patient_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select a.patient_id
    from patient_portal_account a
    join tenants t on t.id = a.tenant_id
   where a.user_id = auth.uid()
     and a.status = 'active'
     and t.portal_enabled = true
   limit 1;
$$;

-- 4) Sharing: an entry reaches the patient ONLY when explicitly shared (default
-- off — nothing is visible by accident; the clinician's "share" is the gate).
alter table public.patient_feed_entries
  add column if not exists shared_with_patient boolean not null default false;

-- 5) RLS — the boundary. Narrow, additive, SELECT-only portal policies.
alter table public.patient_portal_account enable row level security;
-- A portal patient sees only their OWN account row; staff manage accounts.
drop policy if exists portal_account_self on public.patient_portal_account;
create policy portal_account_self on public.patient_portal_account
  for select using (
    user_id = (select auth.uid())
    or is_custodian()
    or tenant_id in (select public.current_user_tenant_ids())
  );
-- Only staff create / activate / revoke accounts (the invite flow). A patient
-- never writes their own account row.
drop policy if exists portal_account_staff_write on public.patient_portal_account;
create policy portal_account_staff_write on public.patient_portal_account
  for all using (
    is_custodian() or tenant_id in (select public.current_user_tenant_ids())
  ) with check (
    is_custodian() or tenant_id in (select public.current_user_tenant_ids())
  );
grant select, insert, update on public.patient_portal_account to authenticated;

-- patients — a portal patient reads ONLY their own patient row.
drop policy if exists patients_portal_self on public.patients;
create policy patients_portal_self on public.patients
  for select using ( id = (select public.current_portal_patient_id()) );

-- patient_feed_entries — a portal patient reads ONLY their own, SHARED, live.
drop policy if exists feed_portal_shared on public.patient_feed_entries;
create policy feed_portal_shared on public.patient_feed_entries
  for select using (
    patient_id = (select public.current_portal_patient_id())
    and shared_with_patient = true
    and deleted_at is null
  );

-- patient_photo — a portal patient reads ONLY their own photos that hang off a
-- SHARED entry (and are live).
drop policy if exists photo_portal_shared on public.patient_photo;
create policy photo_portal_shared on public.patient_photo
  for select using (
    patient_id = (select public.current_portal_patient_id())
    and deleted_at is null
    and feed_entry_id in (
      select id from public.patient_feed_entries
       where patient_id = (select public.current_portal_patient_id())
         and shared_with_patient = true
         and deleted_at is null
    )
  );
