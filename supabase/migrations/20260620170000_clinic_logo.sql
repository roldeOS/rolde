-- Wave B — Clinic brand logo (Caretaker branding; URDS PDF Kit §9.5)
-- ---------------------------------------------------------------------------
-- Each clinic supplies an SVG logo, set by its Caretaker in Settings → Clinic
-- Profile → Branding. It renders top-right on every page of that clinic's PDFs
-- (the URDS PDF Kit) and anywhere the clinic's brand appears.
--
-- Stored as the raw SVG markup (text) — sanitised server-side on save and only
-- ever rendered sandboxed (an <img> data-URL in the app; rasterised via sharp
-- for the PDF), so it can never execute script. Security mirrors the clinic
-- profile (20260616120000): the column-scoped UPDATE grant + the
-- tenants_caretaker_update RLS policy keep writes to a clinic's own Caretaker.
-- Re-runnable.
-- ---------------------------------------------------------------------------

alter table public.tenants
  add column if not exists logo_svg text;

-- Re-grant the full safe column set INCLUDING logo_svg (re-runnable; mirrors
-- 20260616120000_clinic_profile.sql so the two stay in lockstep).
revoke update on public.tenants from anon;
revoke update on public.tenants from authenticated;
grant update (
  name, legal_name,
  contact_email, contact_phone,
  address_line1, address_line2, city, postcode,
  ico_registration, his_registration, cqc_registration,
  logo_svg
) on public.tenants to authenticated;
