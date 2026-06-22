-- Patient Access — auditor-grade enrichment + BREAK-GLASS (Bible 4.8 §15.7b Phase 2,
-- Roland 2026-06-22). The thinnest, most audit-critical log. ISO 27001 A.12.4 / NHS+GDPR
-- want who(+role) · where(IP/device) · purpose · break-glass on every record access.
--
-- Break-glass model: purpose is INFERRED at access time (zero friction) — `direct_care`
-- when a legitimate relationship exists (today's signals: the accessor CREATED the patient
-- record, or AUTHORED a clinical note for them). On the ABSENCE of any care link the access
-- is still logged immediately (break_glass = true, purpose left NULL = "unjustified"), the
-- record opens, and a non-blocking chip captures the reason just-in-time.
alter table public.patient_access_log
  add column if not exists actor_role  text,   -- the accessor's role AT access time (point-in-time)
  add column if not exists ip_address  text,   -- request IP (first x-forwarded-for / x-real-ip)
  add column if not exists user_agent  text,   -- request device string
  add column if not exists purpose     text,   -- why (inferred or break-glass reason); NULL = pending/unjustified
  add column if not exists reason      text,   -- free-text, only for purpose = 'other'
  add column if not exists break_glass boolean not null default false;

-- Constrain the purpose vocabulary (NULL allowed = pending break-glass / legacy rows).
alter table public.patient_access_log
  drop constraint if exists patient_access_log_purpose_chk;
alter table public.patient_access_log
  add constraint patient_access_log_purpose_chk
  check (purpose is null or purpose in
    ('direct_care','administrative','records_request','safeguarding','other'));

-- Surfacing the break-glass accesses fast (the auditor's first question).
create index if not exists patient_access_log_break_glass_idx
  on public.patient_access_log (tenant_id, at desc) where break_glass;

-- RLS UNCHANGED — still append-only for users (insert-own, read-caretaker/custodian, no
-- user UPDATE/DELETE). The just-in-time reason is filled SERVER-SIDE via the service role,
-- gated to the accessor's OWN still-pending break-glass row (one-time completion of the same
-- event, never a rewrite of recorded facts) — same trust model as the central audit_log.
