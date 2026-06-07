# MISTAKES — RolDe

The **authoritative log of regressions Jarvis has caused and the fixes that resolved them.**
Procedural: read before any UI / behaviour edit so the same class of mistake never silently repeats.

**Process — read before EVERY UI / behaviour edit:**
1. Scan for entries whose **Trigger** matches the work about to start.
2. If a match exists, name it in the plan (e.g. *"avoiding MISTAKES #N — …"*) and adjust.
3. Append on the locked trigger phrase **"Add to Mistakes"** (or a diagnosed regression Roland
   approves), under the next number, with Symptom / Root cause / Fix / Trigger / Lesson.
4. Never silently mutate or remove an entry. The `Trigger:` line is load-bearing — keep it
   concrete and grep-friendly.

Paired with `APPROVALS.md` (what's locked) and `CLAUDE.md` (read both before any edit).

---

## 0. Inherited cross-product lessons (carry over from day one)

RolDe has no regressions of its own yet. Until it does, these hard-won lessons from the mindate
build apply here too (full detail: `docs/jarvis_universal_brief.md` §7 and
`../mindate-admin/MISTAKES.md`). The most relevant to the current foundation/infra work:

- **Vercel "Sensitive" env vars are NEVER revealable after creation** (mindate #6). The eye icon
  won't show them; CLI `env pull` writes them empty. Never ask Roland to read a secret back out of
  Vercel. Generate secrets yourself; pull Supabase keys via MCP or from Supabase's own dashboard.
  *Trigger:* about to ask Roland to retrieve any secret from a third-party dashboard.
- **Verify live schema / handler topology before writing or building** (mindate #11, #19). Don't
  trust a sibling report's table/column/RPC names; don't build a handler that may already exist
  elsewhere and do more. *Trigger:* any code against a DB object, or any new webhook/cron/handler.
- **A spec in a doc ≠ enforcement; build the shared primitive** (mindate #15, #16). If something
  must look/behave identically across N surfaces, build the N-place component — an open `slot`
  invites drift. *Trigger:* locking a visual/behavioural spec meant for multiple surfaces.
- **"Done" is Roland's word, not mine** (mindate #21). Plan → greenlight → change → Roland confirms
  satisfied. Never self-declare "fixed / squared away". *Trigger:* every correction.
- **Verify at the right altitude — rendered, reachable, on screen** (mindate #4, #8, #18, #20).
  DOM-present ≠ interactive; a paper scale ≠ a font audit. Measure real pixels; verify in the
  running app. *Trigger:* any "it works" / "it's consistent" / pixel-alignment claim.

---

*Append new mistakes to the bottom with the next sequential number on **"Add to Mistakes"**, or
when a diagnosed regression is worth locking and Roland approves the entry.*
