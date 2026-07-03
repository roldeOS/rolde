-- Clinical Modules (W1.1, APPROVALS §4.2) — one row per clinic naming which
-- clinical tools it uses: Lab · Radiology · Procedures · Prescribing · RolDe AI.
-- The Caretaker switches off what the clinic doesn't do (a talking-therapy
-- practice runs no labs; an aesthetics studio may not prescribe) and the OS
-- puts it out of sight EVERYWHERE — the consult workspace reflows to 4/3/2
-- cards (Workup hides when all four order modules are off; the RolDe panel
-- hides with rolde_ai), Workup drops the disabled tabs, and the sidebar/⌘K
-- hide the matching sections. Everything defaults ON — a new clinic gets the
-- full common spine and trims from there (Roland 2026-07-01/03).
--
-- This is the CLINIC-level layer; the per-user Layouts card toggles sit under
-- it (a user can hide a card the clinic has on, never show one the clinic has
-- off). The per-specialty PACKS (Bible 4.8 §15.7c) will join this same table's
-- pattern when they land.
create table if not exists public.clinic_clinical_modules (
  tenant_id            uuid primary key references public.tenants(id) on delete cascade,

  lab_enabled          boolean not null default true,
  radiology_enabled    boolean not null default true,
  procedures_enabled   boolean not null default true,
  prescribing_enabled  boolean not null default true,
  rolde_ai_enabled     boolean not null default true,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.clinic_clinical_modules is
  'Per-clinic clinical-module switches (Lab · Radiology · Procedures · Prescribing · RolDe AI). Off = out of sight platform-wide; consult workspace reflows 4/3/2 cards.';

alter table public.clinic_clinical_modules enable row level security;

-- The whole clinic team READS the switches (the consult screen, sidebar and
-- search all reflow from them for every role).
drop policy if exists clinic_clinical_modules_read on public.clinic_clinical_modules;
create policy clinic_clinical_modules_read on public.clinic_clinical_modules
  for select to authenticated
  using (is_custodian() or tenant_id in (select public.current_user_tenant_ids()));

-- Only the Caretaker (or a Custodian) WRITES them — which tools the clinic
-- runs is a clinic-governance decision.
drop policy if exists clinic_clinical_modules_write on public.clinic_clinical_modules;
create policy clinic_clinical_modules_write on public.clinic_clinical_modules
  for all to authenticated
  using (is_custodian() or public.is_caretaker_of(tenant_id))
  with check (is_custodian() or public.is_caretaker_of(tenant_id));
