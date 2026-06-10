-- ============================================================================
-- RolDe patient number (Roland 2026-06-11): a per-clinic MRN.
-- Default format {PREFIX}-{5-digit sequence} (e.g. DFS-00001). The Caretaker can
-- later set the prefix and the starting number from their dashboard (stored on
-- the tenant). Auto-assigned by a BEFORE INSERT trigger — atomic, never dupes.
-- ============================================================================

alter table tenants
  add column patient_number_prefix text,
  add column patient_number_next   int not null default 1;

update tenants set patient_number_prefix = 'DFS' where slug = 'docforskin';
update tenants set patient_number_prefix = 'DFD' where slug = 'docfordrivers';

alter table patients add column patient_number text;
create unique index uq_patient_number on patients(tenant_id, patient_number)
  where patient_number is not null;

-- Locks the tenant row, returns the next formatted number, bumps the counter.
create or replace function next_patient_number(p_tenant uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_prefix text; v_next int;
begin
  select coalesce(patient_number_prefix, upper(left(slug, 3))), patient_number_next
    into v_prefix, v_next
  from tenants where id = p_tenant for update;
  update tenants set patient_number_next = v_next + 1 where id = p_tenant;
  return v_prefix || '-' || lpad(v_next::text, 5, '0');
end; $$;

create or replace function set_patient_number()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.patient_number is null then
    new.patient_number := next_patient_number(new.tenant_id);
  end if;
  return new;
end; $$;

create trigger trg_set_patient_number before insert on patients
  for each row execute function set_patient_number();

-- Backfill existing patients (per tenant, in registration order).
do $$
declare r record;
begin
  for r in select id, tenant_id from patients where patient_number is null order by tenant_id, created_at loop
    update patients set patient_number = next_patient_number(r.tenant_id) where id = r.id;
  end loop;
end $$;
