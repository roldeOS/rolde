-- RolDe Courier C1 (Roland 2026-07-02, greenlit) — per-user READ RECEIPTS for the
-- Clinical Notes feed: who has SEEN which entry, when. Append-only by design (a
-- receipt is a recorded fact — no update/delete path for users), which makes the
-- unread system auditable: "was this result ever seen, and by whom?"
--
-- Read-state flips ONLY via a deliberate click on the tile's "New" pill (never by
-- scrolling) — the UI contract locked in Bible 4.8 §15.7c (RolDe Courier).
create table feed_entry_reads (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id),
  entry_id   uuid not null references patient_feed_entries(id) on delete cascade,
  user_id    uuid not null references auth.users(id),
  read_at    timestamptz not null default now(),
  unique (entry_id, user_id)
);

create index idx_feed_reads_user on feed_entry_reads(user_id, entry_id);

alter table feed_entry_reads enable row level security;

-- Same-clinic members can SEE receipts (the "Seen by …" trail) and record their
-- OWN — never anyone else's, never edit, never delete (append-only for users).
create policy feed_reads_select on feed_entry_reads
  for select
  using ( is_custodian() or tenant_id in (select current_user_tenant_ids()) );

create policy feed_reads_insert_own on feed_entry_reads
  for insert
  with check (
    user_id = auth.uid()
    and tenant_id in (select current_user_tenant_ids())
  );

grant select, insert on feed_entry_reads to authenticated;
