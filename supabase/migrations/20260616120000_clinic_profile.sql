-- W1.1.2 — Clinic Profile (Bible 4.3 §5 / 4.8 §16, W1.1.2)
-- ---------------------------------------------------------------------------
-- Lets a Caretaker edit THEIR clinic's profile — name, contact details and
-- regulator registrations — without ever being able to touch billing or
-- lifecycle columns (subscription_tier, status, slug, subdomain, stripe…).
--
-- Defense in depth, three layers:
--   1. Column GRANT  — the hard DB backstop. `authenticated` may UPDATE only the
--      safe columns, even via a hand-rolled PostgREST call. `anon` may not
--      UPDATE tenants at all.
--   2. RLS policy    — `tenants_caretaker_update` row-scopes writes to the
--      caller's own clinic via is_caretaker_of(id).
--   3. Endpoint      — /api/settings/clinic-profile whitelists the same fields.
--
-- Custodian full-column writes (billing, lifecycle, slug/subdomain) go through
-- the service-role admin client, which bypasses both column grants and RLS. No
-- session-client code writes `tenants` today, so narrowing `authenticated`'s
-- UPDATE here breaks nothing. `updated_at` is maintained by the existing
-- trg_tenants_updated trigger, so it is intentionally NOT granted.
-- Re-runnable.
-- ---------------------------------------------------------------------------

alter table public.tenants
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city         text,
  add column if not exists postcode     text;

-- 1 — Column-scoped write privilege -----------------------------------------
revoke update on public.tenants from anon;
revoke update on public.tenants from authenticated;
grant update (
  name, legal_name,
  contact_email, contact_phone,
  address_line1, address_line2, city, postcode,
  ico_registration, his_registration, cqc_registration
) on public.tenants to authenticated;

-- 2 — Caretakers may update their own clinic's row --------------------------
drop policy if exists tenants_caretaker_update on public.tenants;
create policy tenants_caretaker_update on public.tenants
  for update
  using (is_caretaker_of(id))
  with check (is_caretaker_of(id));
