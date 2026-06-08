-- ============================================================================
-- RolDe — Role taxonomy: the C-word naming (locked roles only).
-- Greenfield, so the C-word IS the enum value (no internal-code indirection).
-- Locked here: Steward->Caretaker, Receptionist->Concierge, Practitioner->Clinician,
-- + Curator and Chemist. Nurse / Lab Tech / accounts / Patient are still being
-- chosen and are deliberately NOT touched yet (avoid a second rename).
-- Full reasoning per role: docs/rolde_role_taxonomy.md.
-- ============================================================================

-- Renames (existing rows carrying these values are updated automatically).
alter type user_role rename value 'steward'      to 'caretaker';   -- clinic principal / admin
alter type user_role rename value 'receptionist' to 'concierge';   -- front desk / support
alter type user_role rename value 'practitioner' to 'clinician';   -- clinical professional

-- Additions.
alter type user_role add value if not exists 'curator';            -- practice manager
alter type user_role add value if not exists 'chemist';            -- pharmacist

-- Steward helper -> Caretaker helper.
create or replace function is_caretaker_of(p_tenant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tenant_users
    where user_id = auth.uid()
      and tenant_id = p_tenant_id
      and role = 'caretaker'
      and status = 'active'
  );
$$;

drop policy tenant_users_write on tenant_users;
create policy tenant_users_write on tenant_users
  for all
  using      ( is_custodian() or is_caretaker_of(tenant_id) )
  with check ( is_custodian() or is_caretaker_of(tenant_id) );

drop function if exists is_steward_of(uuid);
