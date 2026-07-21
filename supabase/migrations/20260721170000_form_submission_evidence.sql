-- T4.1 — SUBMISSION EVIDENCE (Roland 2026-07-21: "do we store the patient
-- entry as a log? their IP address and so on?"). The e-consent/intake
-- industry standard: every open and submission carries WHO-WHEN-WHERE
-- evidence — IP address + user agent + timestamp — alongside the frozen
-- template snapshot, so a form response can stand as evidence (consent
-- disputes, integrity checks). IPs are personal data: held on the request
-- row (team RLS), purpose = record integrity/defence of legal claims.
alter table public.form_requests
  add column if not exists opened_ip text,
  add column if not exists opened_user_agent text,
  add column if not exists submitted_ip text,
  add column if not exists submitted_user_agent text;