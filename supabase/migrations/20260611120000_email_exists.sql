-- email_exists(text) — powers the login email field's green tick.
-- Returns ONLY a boolean: "is there an account with this email?" Never any row
-- data. SECURITY DEFINER so it can read auth.users (the anon caller cannot).
--
-- The tick should mean something REAL — a confirmed account — not just a valid
-- email shape (Roland 2026-06-11). The password field gets NO tick on login.
--
-- Trade-off: this is an account-enumeration surface (an attacker can learn which
-- emails are registered RolDe users). Accepted for the login UX, gated behind a
-- valid email format. HARDENING before public go-live: rate-limit per IP (and/or
-- move behind an API route with a captcha). See APPROVALS §8.3.

create or replace function public.email_exists(p_email text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(p_email))
  );
$$;

-- Lock it down: only the boolean check, callable by the login form (anon).
revoke all on function public.email_exists(text) from public;
grant execute on function public.email_exists(text) to anon, authenticated;
