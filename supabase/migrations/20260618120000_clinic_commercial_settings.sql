-- Commercial Settings (W1.1.16) — one row per clinic holding its MONEY POLICY:
-- whether it charges VAT, takes deposits, runs a redeemable consultation credit,
-- and offers discount codes. Everything is toggle-first: a detail value only
-- matters when its switch is on, so a VAT-free, deposit-free clinic keeps a clean
-- page (Roland 2026-06-18). These switches GATE the conditional fields in Services
-- v2, the booking widget, and billing.
--
-- Money is stored as integer PENCE (never a float). Rates are stored in BASIS
-- POINTS (1 bps = 0.01%), so 2000 = 20.00% VAT — integer-precise, no float drift.
create table if not exists public.clinic_commercial_settings (
  tenant_id              uuid primary key references public.tenants(id) on delete cascade,

  -- VAT
  vat_enabled            boolean not null default false,
  vat_rate_bps           integer not null default 2000 check (vat_rate_bps between 0 and 10000),

  -- Deposits (a default; Services v2 may override per service)
  deposit_enabled        boolean not null default false,
  deposit_default_pence  integer not null default 0 check (deposit_default_pence >= 0),

  -- Consultation Credit — credit-on-account: the consult fee a patient pays becomes
  -- a balance auto-applied to their next treatment. Label is clinic-configurable.
  consult_credit_enabled boolean not null default false,
  consult_credit_pence   integer not null default 5000 check (consult_credit_pence >= 0),
  consult_credit_label   text    not null default 'Consultation Credit',

  -- Seasonal discount codes (the on/off; the codes themselves are W4)
  discount_codes_enabled boolean not null default false,

  currency               text    not null default 'GBP',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.clinic_commercial_settings enable row level security;

-- The whole clinic team READS the policy (booking / billing / record surfaces all
-- need to know the VAT rate, deposit, credit, etc.).
drop policy if exists clinic_commercial_settings_read on public.clinic_commercial_settings;
create policy clinic_commercial_settings_read on public.clinic_commercial_settings
  for select to authenticated
  using (is_custodian() or tenant_id in (select public.current_user_tenant_ids()));

-- Only the Caretaker (or a Custodian) WRITES it — commercial policy is theirs.
drop policy if exists clinic_commercial_settings_write on public.clinic_commercial_settings;
create policy clinic_commercial_settings_write on public.clinic_commercial_settings
  for all to authenticated
  using (is_custodian() or public.is_caretaker_of(tenant_id))
  with check (is_custodian() or public.is_caretaker_of(tenant_id));
