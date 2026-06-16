-- Email engagement (Roland 2026-06-16): capture FIRST open + FIRST click from
-- the Resend webhook (email.opened / email.clicked), so the Email Log can show
-- whether a message was not just delivered but actually opened / acted on.
-- NB open-tracking is approximate — Apple Mail Privacy Protection pre-fetches the
-- pixel, so an "opened" can be a proxy, not the human. Clicks are reliable.
alter table public.transactional_emails
  add column if not exists opened_at  timestamptz,
  add column if not exists clicked_at timestamptz;
