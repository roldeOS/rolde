-- Photo tool, Milestone 1 (Roland "Go for Milestone 1", 2026-07-22) — the
-- secure PHOTO STORE for aesthetics before/after work. Bytes live in a PRIVATE
-- Supabase Storage bucket (UK region, our own keys); only lightweight METADATA
-- lives in Postgres, so the DB never bloats. Every photo is a soft-deletable
-- clinical record, tenant-scoped by RLS, and only ever converted (we keep the
-- shrunk master + a thumbnail, never the bulky original — Roland's call).

create table if not exists public.patient_photo (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id),
  patient_id    uuid not null references public.patients(id),
  -- Paths within the private 'patient-photos' bucket, laid out as
  -- {tenant_id}/{patient_id}/{uuid}.webp so storage RLS can tenant-scope them.
  storage_path  text not null,       -- the display master (~2048px WebP)
  thumb_path    text not null,       -- the square gallery thumbnail (~512px)
  width         int,
  height        int,
  bytes         int,                 -- master size (post-shrink)
  mime          text not null default 'image/webp',
  -- before / after / other — the aesthetics comparison axis.
  phase         text not null default 'other' check (phase in ('before','after','other')),
  caption       text,
  taken_at      timestamptz,         -- capture time if the device reported it
  -- The feed entry this photo set is attached to (a note tile); nullable so a
  -- photo can exist before its note is written.
  feed_entry_id uuid references public.patient_feed_entries(id) on delete set null,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz          -- soft-delete only (a clinical image is never hard-erased)
);
create index if not exists idx_patient_photo_patient
  on public.patient_photo(patient_id, created_at) where deleted_at is null;
create index if not exists idx_patient_photo_tenant
  on public.patient_photo(tenant_id, created_at);

alter table public.patient_photo enable row level security;
drop policy if exists patient_photo_tenant on public.patient_photo;
create policy patient_photo_tenant on public.patient_photo
  for all
  using      ( is_custodian() or tenant_id in (select public.current_user_tenant_ids()) )
  with check ( is_custodian() or tenant_id in (select public.current_user_tenant_ids()) );

grant select, insert, update on public.patient_photo to authenticated;

-- The PRIVATE bucket (public = false → no anonymous access; the app serves
-- every image through short-lived server-signed URLs). 15 MB ceiling is
-- headroom — the client shrinks to a few hundred KB before upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-photos', 'patient-photos', false, 15728640,
  array['image/webp','image/jpeg','image/png','image/avif']
)
on conflict (id) do nothing;

-- Defense-in-depth storage RLS: even a direct authenticated client can only
-- touch objects whose FIRST path segment is a tenant they belong to. (Server
-- writes use the service role and signed reads carry their own grant, so this
-- never blocks the app's own flow — it only stops cross-tenant peeking.)
drop policy if exists patient_photos_read on storage.objects;
create policy patient_photos_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'patient-photos'
    and ( is_custodian()
          or (storage.foldername(name))[1] in (select public.current_user_tenant_ids()::text) )
  );
drop policy if exists patient_photos_write on storage.objects;
create policy patient_photos_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'patient-photos'
    and ( is_custodian()
          or (storage.foldername(name))[1] in (select public.current_user_tenant_ids()::text) )
  );
