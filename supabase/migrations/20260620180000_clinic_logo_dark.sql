-- Wave B+ — Clinic logo: a second variant for dark backgrounds (Roland 2026-06-21)
-- ---------------------------------------------------------------------------
-- A clinic supplies TWO logo SVGs:
--   • logo_svg       — the COLOURED logo, shown on LIGHT backgrounds (PDFs on
--                      parchment, invoices, light UI). The primary.
--   • logo_svg_dark  — the logo for DARK backgrounds (typically a white version),
--                      shown on dark UI / dark emails.
-- Both are sanitised server-side and rendered sandboxed. Same column-scoped grant
-- + tenants_caretaker_update RLS as the rest of the clinic profile. Re-runnable.
-- ---------------------------------------------------------------------------

alter table public.tenants
  add column if not exists logo_svg_dark text;

revoke update on public.tenants from anon;
revoke update on public.tenants from authenticated;
grant update (
  name, legal_name,
  contact_email, contact_phone,
  address_line1, address_line2, city, postcode,
  ico_registration, his_registration, cqc_registration,
  logo_svg, logo_svg_dark
) on public.tenants to authenticated;
