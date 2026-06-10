-- ============================================================================
-- RolDe — Clinical note editing model (Bible 4.6; Roland 2026-06-10).
-- A note is editable IN PLACE for ~1 hour by its AUTHOR; thereafter it locks
-- and corrections become amendments (new linked notes) + an optional
-- strikethrough. The original is NEVER deleted.
--   • edited_at  — set when edited in place (the real "· edited" signal).
--   • struck_at / struck_by — strikethrough (note remains, rendered struck).
--   • amendments reuse the existing related_entry_id self-reference.
--
-- Author-only is enforced at the DATABASE (the feed_update policy below); the
-- 1-hour window is enforced in the server action (editNote).
-- ============================================================================

alter table patient_feed_entries
  add column edited_at  timestamptz,
  add column struck_at  timestamptz,
  add column struck_by  uuid references auth.users(id);

-- Split the blanket for-all policy into per-command policies so that UPDATE is
-- author-only, while select/insert/delete stay tenant-scoped.
drop policy feed_tenant_isolation on patient_feed_entries;

create policy feed_select on patient_feed_entries for select
  using ( is_custodian() or tenant_id in (select current_user_tenant_ids()) );

create policy feed_insert on patient_feed_entries for insert
  with check ( is_custodian() or tenant_id in (select current_user_tenant_ids()) );

create policy feed_update on patient_feed_entries for update
  using ( (is_custodian() or tenant_id in (select current_user_tenant_ids())) and created_by = auth.uid() )
  with check ( created_by = auth.uid() );

create policy feed_delete on patient_feed_entries for delete
  using ( is_custodian() or tenant_id in (select current_user_tenant_ids()) );
