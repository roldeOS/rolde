-- Add 'emergency' to the break-glass purpose vocabulary (Bible 4.8 §15.7b). The
-- blocking break-glass modal offers an Emergency-access escape so a clinician in a
-- genuine crisis is never delayed — and an emergency access is its OWN auditable
-- reason (an auditor looks for it specifically), not folded into "direct care".
alter table public.patient_access_log
  drop constraint if exists patient_access_log_purpose_chk;
alter table public.patient_access_log
  add constraint patient_access_log_purpose_chk
  check (purpose is null or purpose in
    ('direct_care','administrative','records_request','safeguarding','emergency','other'));
