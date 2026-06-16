-- New roles (Roland 2026-06-16): Clinician — Practitioner (nurse practitioner,
-- ANP, diabetic/physio practitioner …) and CodeWright (IT support, all-areas but
-- no clinical actions). Added to the user_role enum so they're assignable.
alter type public.user_role add value if not exists 'practitioner';
alter type public.user_role add value if not exists 'codewright';
