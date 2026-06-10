# RolDe — Build Status

A living tracker of what's built vs what's left. ✅ done · ◑ partial · ◻ not started.
Scope = Phase 1 (Bible 4.8 §3.1) unless noted. _Last updated 2026-06-10 (evening)._

---

## ✅ Foundation & infrastructure — DONE
- ✅ rolde Vercel + Supabase accounts (`team@rolde.app`), connected alongside mindate
- ✅ GitHub repo `rolandmanoj/rolde` (private), auto-pushed
- ✅ Monorepo: pnpm + Turborepo, Next.js 16 + React 19 + Tailwind v4, TS strict (`apps/web`, `packages/db`)
- ✅ Supabase project `rolde-dev` — London (eu-west-2), Postgres 17
- ✅ Vercel project `rolde` — git-linked, **auto-deploy on push**, env wired
- ✅ Living ledgers: `APPROVALS.md`, `MISTAKES.md`, `LAUNCH_CHECKLIST.md`, `docs/rolde_role_taxonomy.md`
- ✅ Role taxonomy locked (C-words) + swept through code + bibles
- ✅ `middleware` → `proxy` (Next 16)

## ✅ The spine — first vertical slice — DONE & verified live
- ✅ Multi-tenant schema: `tenants`, `tenant_users` (8→11 role enum), `custodian_users`
- ✅ **RLS tenant isolation** — proven live across tenants AND patients (a clinic sees only its own)
- ✅ Supabase Auth (`@supabase/ssr`): login, session refresh, auth-gate
- ✅ Tenant context (from membership) + Welcome screen
- ✅ `patients` table (full schema) + RLS + list + create UI
- ✅ `patient_feed_entries` (polymorphic) + RLS + **consultation screen + chronological feed + note composer** (type → save → lands in feed)

## ✅ Clinic UI — Roland Design System inherited (2026-06-10)
- ✅ RDS primitives ported from mindate source: tonal Button, floating Card,
  CardIcon squircles (clinical tones), CardHeaderRow, 5-tier typography
- ✅ **FONT LAW** (APPROVALS §2): Plex Serif ONLY for the RolDe wordmark (SVG from Roland pending); Inter everywhere else
- ✅ **Sunny clinic accent** (APPROVALS §3): pastel warm palette drives sidebar + the one `--hover` token; per-clinic Caretaker setting later
- ✅ Shell v2 (APPROVALS §1): overall content card + floating glass topbar + sidebar-only outside; ◻ bottom save-bar (PageActionBar) — with the first dirty-tracking form
- ✅ HIS sidebar nav: Dashboard · Patients · Calendar · Investigations · Prescribing · Letters · Billing · Reports · Settings (stubs cite their Bibles)
- ✅ **Four-card consultation screen** (APPROVALS §4): clinical record 75 / composer 25 / tabbed orders 75 / RolDe panel 25 (offline state)
- ✅ **Resizable workspace** (APPROVALS §4): contextual (composer grows on focus) + presets (Consult/Document/Review) + bounded manual maximise; persisted. Verified live.
- ✅ **Clinical Notes feed**: verbatim, newest-bottom, progressive scroll-up load, filter (type/author) + sort. Verified live.
- ✅ **Allergies + alerts** (Bible 4.4 §2.2–2.3): migration + RLS + trigger-maintained `has_active_alerts`; seeded; **red allergy zone live in the glass topbar**. Verified live.
- ✅ **Note editing** (Bible 4.6): author-only (RLS-enforced) edit ≤1h with "· edited" tag; strikethrough (preserved); amendments (linked, "↳ Amendment"). Verified live.
- ✅ Topbar dynamic-island shows the patient address (seeded).

---

## Phase 1 — Capability set (Bible 4.8 §3.1) — TO BUILD

### Patient & clinical record
- ◑ Patient management (4.4 §2) — ✅ demographics + list/create; ◻ **allergies**, ◻ **alerts**, ◻ search
- ◑ Patient feed (4.4 §4 / 4.6) — ✅ feed + clinical notes; ◻ other 18 entry types, ◻ Draft/Final workflow, ◻ edit/delete, ◻ consultation grouping, ◻ realtime
- ◻ Consultation screen top-strip safety flags (allergies/NEWS2) — _next small win_
- ◻ Patient detail tabs (4.4 §2.6)

### Clinical workflow
- ◻ Calendar & scheduling (4.4 §3) — day/week/month/clinician views
- ◻ Clinical orders — unified (4.5): prescriptions, labs, radiology, procedures
- ◻ Prescribing + drug safety (4.5 §6) — allergy/interaction/renal/pregnancy checks
- ◻ Letters module (4.4 §5) — referrals, discharge summaries, GP letters, sick notes
- ◻ Closed-loop referral pipeline (4.4 §6) — in-network + external email
- ◻ Continuous patient monitoring (4.4 §8) — 12 Phase-1 rules
- ◻ OCR pipeline — Tesseract (4.4 §7)
- ◻ Photo management — 5-photo aesthetic standard (4.6 §4)

### Platform & ops
- ◻ Tenant onboarding wizard (4.3 §2) — self-service Steward signup
- ◻ Steward admin panel (4.3 §5) — clinic config, users, branding
- ◻ **Custodian console** (4.3 §6) — cross-tenant platform view _(you asked about this)_
- ◻ Custodian access notifications (4.3 §6.6)
- ◻ Audit log — table + Steward/Custodian surfaces (4.3 §5 / 4.4 §9) _(table not built yet)_
- ◻ Roles: add backlog enum values when needed (Carer, Collector, Cartographer… — `docs/rolde_role_taxonomy.md`)
- ◻ Notifications — email (Resend) + in-app (4.4 §12)
- ◻ Print & export — PDF + JSON SAR (4.6 §11)
- ◻ Documentation search (4.6 §12)
- ◻ Stripe Connect payments (4.3 §4.6)
- ◻ Subscription tiers — Starter/Professional/Premium (4.3 §16)
- ◻ Public booking widget (4.1 §10)
- ◻ Patient portal (4.2 §8) — `patient.‹clinic›.rolde.app`

### Ambient clinical AI (Bible 4.7) — the differentiator
- ◻ AI server: Gemma 4 31B on the M4 Max (MLX) + Cloudflare Tunnel at `ai.rolde.app`
- ◻ First fine-tune run (≥500 curated examples)
- ◻ AI panel: ambient suggestions (4.7 §13), direct queries (4.7 §14), confidence + "I don't know" (4.7 §15)
- ◻ AI-drafted referral letters + discharge summaries
- ◻ Validated Correction Pipeline (4.7 §10) + Custodian Update Console (4.7 §11)
- ◻ 48h shadow + 30d rollback gate (4.7 §18)

---

## Pre-launch (LAUNCH_CHECKLIST.md) — before Phase 1 goes live
- ◻ Wire the secret **service-role key** (server admin, the safe way)
- ◻ Point **rolde.app** + **dashboard.rolde.app** + **`*.rolde.app` wildcard** at Vercel (Cloudflare DNS)
- ◻ Turn Deployment Protection off for the public marketing site
- ◻ Create **rolde-production** Supabase project (London)
- ◻ 5-tier backup strategy (4.7 §6.5) + monthly integrity check
- ◻ Full RLS / tenant-isolation audit before real patient data

## The other track — rolde.app marketing site (Bible 8) — NOT STARTED
- ◻ The public sales site, 6 phased build stages (separate from the platform spine)

## Later phases (not now)
- ◻ Phase 1.5 (multimodal AI) · Phase 2 (M5 Studio, premium tier) · Phase 3 (UK hosting) · Phase 4 (NHS — deferred)
