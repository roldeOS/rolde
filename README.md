# RolDe

**The clinical operating system, built by a doctor.**

RolDe is the multi-tenant clinical operating system that powers the RoDee Group's clinic
brands (`docforskin.rolde.app`, `docfordrivers.rolde.app`, and future external clinics).
It spans architecture, multi-tenancy, prescribing, clinical documentation, and ambient
clinical AI — a calm, source-grounded platform that drafts everything and sends nothing
without explicit clinician authorisation.

> *"RolDe is the platform that finally understood software needs in healthcare."*

## Status

**Phase 0 → Phase 1.0 (Codebase Launch).** Foundation stage — accounts, repo, and scaffold.
No application code yet.

## Start here

New Claude Code session? Read **`docs/JARVIS_SEED.md`** first — it loads the working
standards and points to the Bibles. Then load `docs/jarvis_universal_brief.md`,
`docs/bible_4_0_rolde_manifesto.md`, and `docs/bible_4_2_rolde_design_system.md`.

## Planned stack (Bible 4.1)

- **Web:** Next.js (App Router) + React + TypeScript, on Vercel
- **Data/Auth:** Supabase (PostgreSQL + RLS + Realtime + Storage)
- **AI:** Gemma 4 31B (Apache 2.0), self-hosted (MLX), via Cloudflare Tunnel
- **Monorepo:** pnpm + Turborepo (`apps/web`, `apps/ai-server`, `apps/widget`, `packages/*`)
- **Design:** Roland Design System (inherited from mindate), re-skinned to RolDe's
  calm clinical monochrome (Bible 4.2). IBM Plex Serif + Inter + IBM Plex Mono.

## Ledgers

- **`APPROVALS.md`** — visible/behavioural states Roland has locked. Read before any UI edit.
- **`MISTAKES.md`** — past regressions + triggers. Read before similar work.

CONFIDENTIAL · RolDe Ltd · part of the RoDee Group
