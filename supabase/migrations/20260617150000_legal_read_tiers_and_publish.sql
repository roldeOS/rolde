-- Read tiers (APPROVALS §1.9): the public /policy page (anon) sees PUBLISHED only;
-- authenticated clinic users see published + superseded (the in-app version
-- history); Custodians already read everything incl. drafts (legal_custodian_all).
drop policy if exists legal_published_read on public.legal_doc_versions;
create policy legal_anon_read on public.legal_doc_versions
  for select to anon using (status = 'published');
create policy legal_auth_read on public.legal_doc_versions
  for select to authenticated using (status in ('published', 'superseded'));

-- Atomic publish: supersede the current published version, then promote the
-- doc's latest draft to published. Custodian-only (checked inside).
create or replace function public.publish_legal_draft(p_doc_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_custodian() then
    raise exception 'not authorised';
  end if;
  update public.legal_doc_versions
    set status = 'superseded'
    where doc_key = p_doc_key and status = 'published';
  update public.legal_doc_versions
    set status = 'published', published_at = now()
    where id = (
      select id from public.legal_doc_versions
      where doc_key = p_doc_key and status = 'draft'
      order by updated_at desc limit 1
    );
end;
$$;
