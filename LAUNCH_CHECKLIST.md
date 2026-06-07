# LAUNCH CHECKLIST — RolDe

Items we **consciously deferred** and must do before (or at) production launch. We park
things here the moment we defer them, so nothing is forgotten when Phase 1 goes live.
**Grep this before any launch.** Living doc — append (with a date) as we defer more.

Pairs with the roadmap's Phase 0 → Phase 1 gate (`docs/bible_4_8_rolde_roadmap.md` §2.3).

## Secrets & auth
- [ ] Wire the Supabase **service-role key** for server-side admin (never the browser).
      Generate / pull it the safe way — NEVER ask Roland to reveal a Vercel "Sensitive"
      var (MISTAKES, mindate #6). _Deferred 2026-06-07 (foundation) — do when server auth lands._

## Domains & DNS (Cloudflare → Vercel)
- [ ] Point **rolde.app** (apex) at Vercel — the marketing / sales site.
- [ ] Point **dashboard.rolde.app** at Vercel — the RolDe OS app.
- [ ] Add the **`*.rolde.app` wildcard** so each clinic gets `clinic.rolde.app`
      automatically on subscribe. Jarvis hands Roland the exact Cloudflare records.
- [ ] Settle patient-portal nesting (`patient.‹clinic›.rolde.app`) — single-level
      wildcards don't cover the nested level; decide routing (Bible 4.3) before
      multi-tenant launch. _Deferred 2026-06-07 (foundation)._

## Go-public / protection
- [ ] Turn **Vercel Deployment Protection** OFF selectively for the public marketing
      site (keep it ON for the dashboard + dev). _Deferred 2026-06-07._

## Database & backups
- [ ] Create **rolde-production** Supabase project (London / eu-west-2) — we're on
      `rolde-dev` only right now.
- [ ] Stand up the **5-tier backup strategy** (Bible 4.7 §6.5) before any real patient
      data; monthly integrity verification.
- [ ] Full **RLS / tenant-isolation audit** before the first real patient record.

---
*Append new deferrals with a date + where they came from. Nothing leaves this list
without being done or explicitly cancelled by Roland.*
