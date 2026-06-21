-- ════════════════════════════════════════════════════════════════════════════
-- Tax v2 — generalise UK-VAT to GLOBAL, configurable Tax (roadmap §15.7).
--
-- Hardcoding "VAT 20%" excludes the global market. Research (HMRC + Avalara/Stripe
-- Tax/Chargebee · India GST · US sales tax · AU GST) → Tax becomes fully
-- configurable: a NAME (VAT · GST · Sales Tax · Tax, defaulted by clinic country),
-- an editable RATE, a tax REGISTRATION number (VAT no./GSTIN, for invoices), and
-- tax-INCLUSIVE vs -exclusive pricing. The per-service taxable/exempt toggle stays
-- — it's universal (cosmetic = taxable, therapeutic/medical = exempt; UK/US/AU/IN
-- all draw this line; HMRC enforces it — Illuminate Skin Clinics v HMRC 2025).
--
-- DEEP rename, all the way down — no "vat" left anywhere (columns, constraint):
--   clinic_commercial_settings.vat_enabled  → tax_enabled
--   clinic_commercial_settings.vat_rate_bps → tax_rate_bps
--   clinic_services.vat_exempt              → tax_exempt
-- + new: tax_name · tax_registration · tax_inclusive. Re-runnable (guarded).
-- ════════════════════════════════════════════════════════════════════════════

do $$
declare c text;
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='clinic_commercial_settings' and column_name='vat_enabled') then
    alter table public.clinic_commercial_settings rename column vat_enabled to tax_enabled;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='clinic_commercial_settings' and column_name='vat_rate_bps') then
    alter table public.clinic_commercial_settings rename column vat_rate_bps to tax_rate_bps;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='clinic_services' and column_name='vat_exempt') then
    alter table public.clinic_services rename column vat_exempt to tax_exempt;
  end if;

  -- the rate's CHECK constraint keeps its old auto-name after a column rename —
  -- rename it too so nothing reads "vat" anywhere.
  select conname into c from pg_constraint
   where conrelid = 'public.clinic_commercial_settings'::regclass and conname like '%vat_rate_bps%'
   limit 1;
  if c is not null then
    execute format(
      'alter table public.clinic_commercial_settings rename constraint %I to clinic_commercial_settings_tax_rate_bps_check', c);
  end if;
end $$;

-- New configurable fields. tax_name defaults to 'VAT' (most tenants are UK today);
-- the app suggests the right name from the clinic's country on first set-up.
alter table public.clinic_commercial_settings
  add column if not exists tax_name        text    not null default 'VAT',
  add column if not exists tax_registration text,
  add column if not exists tax_inclusive   boolean not null default false;

comment on column public.clinic_commercial_settings.tax_name is
  'Display name for the tax (VAT · GST · Sales Tax · Tax) — defaulted by country, editable.';
comment on column public.clinic_commercial_settings.tax_registration is
  'The clinic''s tax registration number (VAT no. / GSTIN) — shown on invoices.';
comment on column public.clinic_commercial_settings.tax_inclusive is
  'true = service prices already include tax (UK aesthetics often quote inclusive); false = tax added on top.';
