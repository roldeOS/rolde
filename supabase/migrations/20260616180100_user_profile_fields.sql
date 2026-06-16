-- User profile fields (Roland 2026-06-16, W1.1.7 Users & Roles):
--  - preferred_name : the name shown in the Clinical Note. If blank, the app
--    falls back to "<designation> <surname>" (e.g. "Dr Jayasekhar").
--  - designation    : Dr / Mr / Ms / Nr … — set by the CARETAKER at sign-up; the
--    individual user can't change their own designation.
--  - job_title      : free text, e.g. "Advanced Diabetic & Physiotherapy Practitioner".
--  - license_type/number : country-flexible professional registration (GMC, NMC,
--    GDC, GPhC, HCPC …) — the TYPE auto-populates from the clinic's country, the
--    number is what the person actually holds (a GMC doctor may not be UK-born).
alter table public.tenant_users
  add column if not exists preferred_name text,
  add column if not exists designation    text,
  add column if not exists job_title      text,
  add column if not exists license_type   text,
  add column if not exists license_number text;
