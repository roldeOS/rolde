-- Patient Portal P1 — share a note with the patient.
--
-- A note reaches the patient only when it's explicitly shared. Who may set that:
-- the note's AUTHOR (their own note's patient-visibility is theirs) OR a
-- CARETAKER of the clinic (governance — "as approved by the caretaker"). The
-- base feed_update RLS is author-only, so this SECURITY DEFINER function carries
-- the author-OR-caretaker rule and flips only the one column. A portal patient
-- (neither author nor caretaker) is refused.
create or replace function public.set_note_shared(p_entry uuid, p_shared boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_tenant uuid;
  v_author uuid;
begin
  select tenant_id, created_by into v_tenant, v_author
    from public.patient_feed_entries where id = p_entry;
  if v_tenant is null then
    raise exception 'no such entry';
  end if;
  if not (v_author = auth.uid() or is_caretaker_of(v_tenant)) then
    raise exception 'not authorised';
  end if;
  update public.patient_feed_entries
     set shared_with_patient = p_shared
   where id = p_entry;
end;
$$;

revoke all on function public.set_note_shared(uuid, boolean) from public, anon;
grant execute on function public.set_note_shared(uuid, boolean) to authenticated;
