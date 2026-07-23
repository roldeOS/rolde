-- Courier evolving note (Roland 2026-07-23): a form courier is now ONE feed
-- entry that evolves — created on send, a "Resent" line on resend, and UPDATED in
-- place on the patient's response (not a separate form_response entry). This links
-- the request to that single evolving entry so send/resend/respond all find it.
-- (Legacy in-flight requests with a null link fall back to a form_response entry.)
alter table public.form_requests
  add column if not exists feed_entry_id uuid
    references public.patient_feed_entries(id) on delete set null;
