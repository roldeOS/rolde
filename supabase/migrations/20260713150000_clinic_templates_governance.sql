-- Scribe T2 GOVERNANCE REWORK (Roland 2026-07-13: "Only Caretakers should be
-- able to design and add templates") — templates are CLINIC-OFFICIAL clinical
-- documentation, not personal drafts: the Caretaker designs them, the whole
-- team fills them (the same governance the NHS-grade systems apply to their
-- template libraries — documentation structure is a clinical-safety artefact).
-- Deep rename, no old names lurking: user_templates → clinic_templates,
-- user_id → created_by; owner-only RLS → team-read + Caretaker-write.
alter table public.user_templates rename to clinic_templates;
alter table public.clinic_templates rename column user_id to created_by;
alter index if exists idx_user_templates_owner rename to idx_clinic_templates_tenant;
drop index if exists idx_clinic_templates_tenant;
create index if not exists idx_clinic_templates_tenant
  on public.clinic_templates(tenant_id) where deleted_at is null;

drop policy if exists user_templates_owner on public.clinic_templates;
create policy clinic_templates_read on public.clinic_templates
  for select to authenticated
  using ( is_custodian() or tenant_id in (select public.current_user_tenant_ids()) );
create policy clinic_templates_write on public.clinic_templates
  for insert to authenticated
  with check ( is_custodian() or public.is_caretaker_of(tenant_id) );
create policy clinic_templates_update on public.clinic_templates
  for update to authenticated
  using ( is_custodian() or public.is_caretaker_of(tenant_id) )
  with check ( is_custodian() or public.is_caretaker_of(tenant_id) );