-- Wave C — clinic logo as PNG (rasterised at upload) for the URDS PDF Kit.
-- ---------------------------------------------------------------------------
-- @react-pdf renders raster images, not SVG, and runtime SVG→PNG (sharp) is
-- fragile on serverless. So the browser rasterises the light-background logo to
-- a PNG data-URL at upload and we store it here; the PDF route uses it directly,
-- needing NO native image lib in the lambda. logo_svg stays (the source + the
-- on-screen preview). Same column-scoped grant + caretaker RLS. Re-runnable.
-- ---------------------------------------------------------------------------

alter table public.tenants
  add column if not exists logo_png text;

revoke update on public.tenants from anon;
revoke update on public.tenants from authenticated;
grant update (
  name, legal_name,
  contact_email, contact_phone,
  address_line1, address_line2, city, postcode,
  ico_registration, his_registration, cqc_registration,
  logo_svg, logo_svg_dark, logo_png
) on public.tenants to authenticated;
