-- W1.1.7 Users & Roles — time-limited access + clinic country.
--
-- Time-limited access (Roland 2026-06-16, LOCKED): when a Caretaker grants
-- access they set a WINDOW — indefinite (both null), *until a date* (ends set,
-- e.g. a doctor on 3-month probation), or a *from–to* span (both set, e.g. a
-- Locum for 48h two months out). Access lapses BY TIME, not a cron: the
-- membership query gates on now() being inside the window, so an expired Locum
-- simply lands on "No Workspace Yet" — the login is never deleted and every
-- record they authored keeps a valid author.
alter table public.tenant_users
  add column if not exists access_starts_at timestamptz,
  add column if not exists access_ends_at   timestamptz;

-- The clinic's COUNTRY drives the professional-license TYPE auto-populate in the
-- Users & Roles screen (a GB clinic offers GMC/NMC/GDC/GPhC/HCPC; the person's
-- NUMBER is still whatever they actually hold — a GMC doctor needn't be UK-born).
-- Default GB: RolDe OS is UK-first today (GMC/NMC/CQC/ICO throughout the bibles).
alter table public.tenants
  add column if not exists country text not null default 'GB';
