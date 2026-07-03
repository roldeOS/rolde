-- Profile hardening (2026-07-03, from the adversarial review of the Profile
-- overlay build):
--
-- 1. assign_patient_gp — the GP-flag handoff becomes ATOMIC. The app saves the
--    care-provider row first (flag off), then calls this ONE-transaction
--    function; a failure anywhere leaves the previous GP intact — a patient is
--    never stranded GP-less by a half-completed save. SECURITY INVOKER: RLS
--    still decides what the caller may touch.
create or replace function public.assign_patient_gp(p_patient uuid, p_row uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update patient_care_providers
     set is_gp = false, updated_at = now()
   where patient_id = p_patient and is_gp = true and id <> p_row
     and deleted_at is null;

  update patient_care_providers
     set is_gp = true, updated_at = now()
   where id = p_row and patient_id = p_patient and deleted_at is null;

  if not found then
    raise exception 'care provider row not found for this patient';
  end if;
end $$;

-- 2. These record tables are SOFT-DELETE-ONLY by design (deleted_at/deleted_by;
--    every app path updates, never deletes) — so the blanket DELETE grant was a
--    loaded gun. Revoke it across the patient record family; hard deletes stay
--    a service-role/Custodian-surgery affair.
revoke delete on public.patient_contacts       from authenticated;
revoke delete on public.patient_care_providers from authenticated;
revoke delete on public.patient_problems       from authenticated;
revoke delete on public.patient_medications    from authenticated;
revoke delete on public.patient_allergies      from authenticated;
