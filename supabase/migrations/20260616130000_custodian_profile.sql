-- W1.5.2 — Custodian profiles (Bible 4.8 §16, Custodian "Control" console)
-- ---------------------------------------------------------------------------
-- Custodians get an identity like everyone else — a display name (so the
-- console greets "Good morning, Roland." instead of an email), an optional
-- title, and an avatar. Mirrors tenant_users.{display_name, photo_url}.
-- Avatars fall back to a deterministic generated avatar when photo_url is null
-- (DiceBear, self-hosted/local — never an external call). Re-runnable.
-- The display-name seed for the existing founder accounts is applied out of
-- band (not in this committed file) so personal emails stay out of version
-- control.
-- ---------------------------------------------------------------------------

alter table public.custodian_users
  add column if not exists display_name text,
  add column if not exists title        text,
  add column if not exists photo_url    text;
