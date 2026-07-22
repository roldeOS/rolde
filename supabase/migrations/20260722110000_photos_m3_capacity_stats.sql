-- Photo tool, Milestone 3 — the Custodian Capacity read.
--
-- The true storage FOOTPRINT lives in storage.objects (master + thumbnail bytes,
-- including photos whose metadata row is soft-deleted — we still hold, and pay
-- for, those bytes until reclamation). That schema isn't reachable through the
-- JS client, so this SECURITY DEFINER function gathers the figures server-side
-- and hands back one JSON blob. It is Custodian-only: a non-Custodian caller is
-- refused inside the function, so a stray grant can never leak platform-wide
-- storage across tenants.

create or replace function public.photo_capacity_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not is_custodian() then
    raise exception 'not authorised';
  end if;

  select jsonb_build_object(
    'total_bytes',      coalesce(sum((o.metadata->>'size')::bigint), 0),
    'objects',          count(*),
    'thumbs',           count(*) filter (where o.name like '%.thumb.jpg'),
    'masters',          count(*) filter (where o.name not like '%.thumb.jpg'),
    'bytes_this_month', coalesce(sum((o.metadata->>'size')::bigint)
                          filter (where o.created_at >= date_trunc('month', now())), 0),
    'live_photos',      (select count(*) from public.patient_photo where deleted_at is null),
    'tenants', coalesce((
      select jsonb_agg(row_to_json(x) order by x.bytes desc)
      from (
        select
          (storage.foldername(o2.name))[1]           as tenant_id,
          coalesce(tn.name, 'Unknown clinic')         as name,
          sum((o2.metadata->>'size')::bigint)         as bytes,
          count(*)                                    as objects
        from storage.objects o2
        left join public.tenants tn
          on tn.id::text = (storage.foldername(o2.name))[1]
        where o2.bucket_id = 'patient-photos'
        group by 1, 2
      ) x
    ), '[]'::jsonb)
  )
  into v_result
  from storage.objects o
  where o.bucket_id = 'patient-photos';

  return v_result;
end;
$$;

-- Custodian-only by the internal guard; execute grant is safe (non-Custodians
-- are refused). Anon/public never touch it.
revoke all on function public.photo_capacity_overview() from public, anon;
grant execute on function public.photo_capacity_overview() to authenticated;
