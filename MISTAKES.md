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

## 1. Renamed a role's labels but left the old word in code identifiers — assumed shallow scope — 2026-06-08

**Symptom:** During the role rename to the C-word taxonomy, the sweep updated the display labels
and the enum VALUES, but I deliberately left the old word embedded in code identifiers — a
foreign-key column id, indexes, a policy name, request fields — reasoning to myself that
"identifiers are a separate decision." Roland does not want the old word in the code, EVER, and
rightly called it a half-baked, assumed-scope change.

**Root cause:** I made a scope assumption instead of asking. A rename has a shallow form (labels
only) and a deep form (labels + every identifier). I silently chose shallow and never surfaced
the choice.

**Fix:** Eradicated the old word from every spec + prose — identifiers became the new form
(`<role>_id`, indexes, policy names, fields) — verified by a repo-wide grep dropping to zero
outside two flagged historical files. Flagged the only legitimate survivors (immutable migration
history; the original interview transcript) for Roland's explicit decision instead of editing
them silently.

**Trigger:** ANY rename — a role, an entity, a column, a concept. Sweep the IDENTIFIERS (columns,
indexes, policies, fields, file names), not just the display labels. And whenever a change has a
shallow-vs-deep scope, ASK Roland which he wants — never assume the shallow one.

**Lesson:** Roland wants things clean and cleared, never half-baked. "Don't assume — ASK" is
absolute. A rename that leaves the old word lurking in code is a regression even when the UI looks right.

---

## 2. Used IBM Plex Serif for headings — Roland's law: serif is for the wordmark ONLY — 2026-06-10

**Symptom:** The first UI pass set IBM Plex Serif on page headings, card titles and patient
names. Roland: the serif is ONLY for the RolDe wordmark/icon (SVG to come); Inter everywhere
else — "the IBM font should be nowhere" else.

**Root cause:** Followed Bible 4.2's literal token sheet (serif headings) without checking
Roland's living standard — mindate APPROVALS §2.1 already locked the same rule there ("Plex
Serif reserved ONLY for the wordmark"). The bibles are a frame; Roland's standards override.

**Fix:** `--font-heading` → Inter; added `--font-wordmark` (Plex Serif) used exclusively by the
RolDe wordmark (sidebar, login, AI-panel header). Locked as APPROVALS §2.

**Trigger:** Any font/typography choice. Check the FONT LAW (APPROVALS §2) first; a bible's
font spec does NOT outrank Roland's standards. Serif = wordmark only.

**Lesson:** Cross-product taste rules (mindate's ledgers) are precedent for RolDe. When a bible
and Roland's established taste conflict, ask or follow the taste — never silently follow the doc.

---

## 3. Drifted to Supabase's built-in auth-email templates instead of the planned app-controlled email system — 2026-06-15

**Symptom:** For the password-reset email I built a **Supabase built-in auth template** (HTML to be
pasted into the Supabase dashboard), instead of the Custodian-controlled, code-seeded, Resend-sent
template system the roadmap (§15.5) had *always* planned — mindate's proven pattern. Roland: *"mindate
never asked me to do any of this… why are you making a rigid email system in supabase… Something is
not right… NEVER DRIFT."*

**Root cause:** I took the quick platform-default shortcut (Supabase sends; you configure its
dashboard template) instead of building the harder, correct, content-managed system. Classic
quick-and-dirty over harder-and-best, and a drift from both the documented plan AND the mindate
precedent I should have checked first.

**Fix:** Deleted the Supabase-paste artifact; corrected the roadmap; adopted mindate's architecture —
`email_templates` table + code **seed** + `sendTemplatedEmail` via **Resend** + `transactional_emails`
log + a **Custodian dashboard editor**. RolDe keeps Supabase **Auth**, so for auth emails a server
route uses Supabase admin `generateLink` to mint the secure link and WE send the branded email.

**Trigger:** Building ANY cross-cutting system (email, notifications, templates, auth flows). Check
the roadmap's planned architecture AND for a mindate precedent (read the mindate-admin code) BEFORE
building. If a quick platform-default path tempts you while a content-managed / Custodian-controlled
system is the plan — STOP; that temptation is the signal to build the harder-best one.

**Lesson:** **NEVER DRIFT** from the planned/precedented architecture to a shortcut. Harder-and-best
over quick-and-dirty — never even surface the shortcut (CLAUDE.md). Query the plan + the mindate code
first; priors and shortcuts are wrong by default.

## 4. Shipped transactional email without deliverability hardening (no DMARC) — 2026-06-16

I built the Resend send pipeline (Chunks 1–5) and called it done, but never set up **email
deliverability hardening**. The password-reset to `rolandmanoj@icloud.com` was *accepted* by Resend
yet **junked by iCloud**, because rolde.app had DKIM but **no DMARC record** (and is a young sending
domain). Roland: *"Remember not to make mistakes like this DMARC anymore… you should have known
this."* He's right — for a clinical product whose password resets and patient notices ALL ride
email, deliverability is foundational, not an afterthought.

**Fix:** Diagnosed with `dig` (DKIM ✓ `resend._domainkey`, SPF ✓ Google Workspace, **DMARC ✗**).
Gave Roland the DMARC TXT record (`v=DMARC1; p=none; rua=…`) for Cloudflare DNS; building Resend
delivery webhooks → `transactional_emails` so the Email Log shows true Delivered/Bounced, not just
"accepted".

**Trigger:** Setting up or touching ANY email sending (new provider, domain, or template system).
Before "done", verify the FULL deliverability chain for the sending domain with `dig` — SPF, DKIM,
**DMARC** — and wire a delivery-event webhook. "status: sent" means the provider ACCEPTED it, NOT
that the inbox received it.

**Lesson:** Deliverability hardening (SPF/DKIM/DMARC) is PART of building transactional email.
"Sent" is a happy-path signal, not proof of delivery — pairs with
[[verify-the-negative-case-for-gates]].

## 5. Added a vestigial in-page back-link ("← All Settings") that duplicates the topbar breadcrumb — 2026-06-17

**Symptom:** New pages (every Settings sub-page, the Services & Pricing page, the email
editors, the `[section]` scaffolds) carried a `PageHeaderRow` `actions` back-link — "← All
Settings" / "Email Templates". Roland: *"Why did you add a breadcrumb there? … That is precisely
the reason we created a robust breadcrumbing system in the top-bar. Remember not to do this in
any of the new pages."*

**Root cause:** Copied a page-header back-link into new pages without registering that the topbar
JOURNEY breadcrumb (APPROVALS §1.11) — now clickable to any ancestor including the Settings hub —
ALREADY provides step-back. A second, page-level back affordance is redundant chrome creep.

**Fix:** Removed the back-link from every `(app)`-shell page; the topbar breadcrumb is the ONE
back-navigation. Audited the whole app for the pattern (`ArrowLeft` + a hub `Link` in a page
header) and stripped it. PUBLIC pages with no topbar (`/policy/[slug]`, `not-found`) keep their
own back-link — that's legitimate, not a vestige.

**Trigger:** Building ANY page inside the `(app)` shell. Do NOT add an in-page back-link, an
"All X" link, or any breadcrumb in the page body — the topbar JOURNEY breadcrumb (APPROVALS §1.11)
is the single back-nav. A page-level back affordance is the regression.

**Lesson:** Reuse the established navigation primitive; never re-implement step-back per page. The
topbar breadcrumb is the one place for it — pairs with the "build the shared primitive" rule
(MISTAKES §0).

---

*Append new mistakes to the bottom with the next sequential number on **"Add to Mistakes"**, or
when a diagnosed regression is worth locking and Roland approves the entry.*
