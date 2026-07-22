-- Patient Portal P1 — the Caretaker's settings writer.
--
-- Caretakers must set ONLY the two portal columns, never the rest of `tenants`
-- (subscription tier, status, numbering…). Rather than grant broad UPDATE on
-- tenants to `authenticated`, this SECURITY DEFINER function updates exactly
-- those two columns on the caller's OWN tenant, gated by is_caretaker_of. The
-- server action re-checks the caretaker role and audits.
create or replace function public.set_patient_portal(p_enabled boolean, p_mode text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_mode not in ('invite_only', 'open') then
    raise exception 'invalid registration mode';
  end if;
  update public.tenants
     set portal_enabled = p_enabled,
         portal_registration = p_mode
   where is_caretaker_of(id);
  if not found then
    raise exception 'not authorised';
  end if;
end;
$$;

revoke all on function public.set_patient_portal(boolean, text) from public, anon;
grant execute on function public.set_patient_portal(boolean, text) to authenticated;
