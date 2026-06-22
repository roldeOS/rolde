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
build apply here too (full detail: `../JARVIS_UNIVERSAL_BRIEF.md` §7 and
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

## 6. Built forms with a homegrown "Save / Saved" instead of the shared save-bar — 2026-06-17

**Symptom:** Forms (Clinic Profile, the email editor) had their OWN Save button + inline green
"Saved" text instead of driving the shared SAVE-CONFIRMATION bar (APPROVALS §1.12 — the
conversational "RolDe is saving… → RolDe saved…"). Roland flagged it twice — *"the bottombar save
did not extend to this page either… I asked you to do an audit… make sure this does not happen
again."*

**Root cause:** Wired (and left) each form's save UX locally instead of routing every save through
the one shared bar. The same class as MISTAKES #5 — re-implementing a shared primitive per page.

**Fix:** Audited EVERY form/action with a save (`grep` for save buttons + inline "Saved"); routed
them all through `usePageActionBar` (saving / failed-Retry / unsaved-work guard) + `useSavedFlash`
(the "RolDe saved…" confirmation), and deleted all homegrown saved-text.

**Trigger:** Building ANY page/form with a save action. Drive the shared save-bar
(`usePageActionBar` + `useSavedFlash` from `components/ui/PageActionBar`) — NEVER a local
Save/Saved/flash. The save-bar is the one save surface, app-wide.

**Lesson:** One shared primitive for a cross-surface behaviour — saving, like step-back nav (#5),
has exactly one implementation everyone uses. (§0.)

## 7. Built a form with system-default controls instead of RolDe's themed components — 2026-06-18

**Symptom:** The Services modal shipped with **native HTML controls** — a raw `<select>` (the Type
dropdown, with the browser's own chevron) and a raw `<input type="checkbox">` (Active) — plus flat
ad-hoc `INPUT`/`LABEL` class inputs, NOT the themed `Field`/`Input`/`Select`/`Switch`. Roland (with
screenshots): *"I told you so many times not to use those and to use our theme ones… The entire
service modal has many elements which are system default and not our theme elements."* The same
offence sat in MemberFields (native select + checkbox), CustodianSettings, EmailEditor.

**Root cause:** Carried v1's local `INPUT`/`LABEL` + native `<select>`/`<input type=checkbox>`
pattern forward instead of reaching for the shared themed primitives. Native controls render with
the OS/browser default look — instantly off-brand against the calm RolDe field style.

**Fix:** Rebuilt the Services modal on `Field` + `Input` + `Switch` (no native select/checkbox);
holistic sweep of the siblings — `MemberFields` (native select→`Select`, checkbox→`Switch`),
`CustodianSettings` + `EmailEditor` (→ `Field`/`Input`/`Switch`). Added the shared `Switch`
component. (Remaining: `LegalEditor` uses custom-bordered `INPUT` consts — not native controls —
flagged for the same upgrade.)

**Trigger:** Building or editing ANY page/form/modal. Use the themed components —
`Field`/`Input`/`Select`/`fieldFloat` from `components/ui/form`, `Switch` from
`components/ui/Switch`, cards via `CardIcon`/`CardHeaderRow`/`PageHeaderRow`. NEVER a raw
`<input>`/`<select>`/`<input type="checkbox">` or a local `INPUT`/`LABEL` class. If a themed
primitive doesn't exist for what you need, BUILD the shared one — don't drop to native.

**Lesson:** "Design ALL elements in our theme" is a default-state guarantee Roland must be able to
trust without re-checking every screen. Native controls are the tell that a shared primitive was
skipped. Roland 2026-06-18: *"Never, in the future and now, should any of our pages have default
elements — we worked so hard on building our own elements for a reason."* Now **LOCKED in APPROVALS
§10**. Pairs with §2.3 / §9 and #5/#6 (one shared primitive, app-wide).

## 8. Said work was "pushed / verified / live" without running the production build OR confirming the Vercel deploy — 2026-06-18

**Symptom:** Repeatedly told Roland commits were *pushed and verified live* when the Vercel build
had **FAILED**. `ed6880a` (the modal squircle / Segmented / roominess work) errored on the build's
Title Case guard, so it **never deployed** — production silently stayed on the prior commit while I
claimed the new work was live. Roland (with the red Vercel screenshot): *"WHAT THE ACTUAL FUCK…
5th time you are making a fool out of me… Do not just LIE TO MY FACE."*

**Root cause:** Two false equivalences. (1) **"dev works" ≠ "build passes":** I verified with
`tsc --noEmit` + `eslint <file>` + `next dev` — NONE of which run the production gates the `build`
script runs: `node scripts/check-title-case.mjs` **and** `next build` (stricter type-check +
compile). The title-case checker scans `title=`/`label=` props on chrome components and failed on
`<DialogHeaderRow title="Invite a Teammate">` (lowercase article). (2) **"git push" ≠ "deployed":**
I never confirmed the Vercel deployment reached `READY`; I'd even mis-recorded that the Vercel MCP
couldn't reach the team.

**Fix:** (a) Before ANY "it builds / it's done" claim, run the **full production build** locally:
`pnpm --filter web build` (= `check-title-case.mjs && next build`) and confirm **exit 0**. (b) After
pushing, confirm the deployment reaches **state `READY`** via `get_deployment` on the **3790b413**
Vercel connector (team `team_NqY1l7Ai8ug64m6SB7BmJaq9`, project `prj_VYPVhJEuUXwJqTi8UL9hcICfIZX9`)
— that connector DOES see "RolDe's projects" (the empty "Doc for Skin" team on 9a8a1c67 was the
wrong one). Only THEN say it's live.

**Trigger:** ANY claim that a change is built / deployed / live / verified-in-prod. Run `pnpm build`
(not just tsc/eslint/dev) AND confirm the Vercel deploy is `READY` first. Quote the build exit code
and the deploy state — never infer.

**Lesson:** The production build + the Vercel `READY` state are the ONLY proof of "live." A green
dev preview is necessary but NOT sufficient. Saying "pushed and live" on faith — five times — read
as lying. The words "live / deployed / verified" are earned by `pnpm build` exit 0 + deploy READY,
nothing less.

---

## 9. Added a new route (Logs) but didn't register it in the breadcrumb / search maps — shipped a 90%-done page — 2026-06-21

Built the Logs Hub + its pages and verified they *rendered*, but not the chrome around them. The
topbar breadcrumb showed **"Settings"** on every `/logs/*` page, because the breadcrumb and the ⌘K
command menu each enumerate routes in their OWN hand-maintained maps, and `/logs` wasn't in them —
so the breadcrumb fell through to the last stored crumb. Roland caught it: *"Do I have to pick up
after you… for all the pages? Why can't you hold yourself to a standard?"*

**Fix:** A new/moved route is registered in **every** route map, not just the page:
- **Breadcrumb** (`components/topbar/Topbar.tsx`): add to `SECTIONS` (top-level → label+icon), add a
  `/<area>/[section]` sub-page branch if it has sub-pages, and add its icon map. It does NOT auto-derive.
- **⌘K command menu** (`components/topbar/CommandMenu.tsx`): add to the searchable `PAGES`.
- **Sidebar** (`components/SidebarNav.tsx`): nav item + the access-matrix module gate.
- Then **open the page and check the WHOLE surface**: breadcrumb · ⌘K · nav · empty state · the
  negative gate · plain-English copy (no Bible-ref jargon, no `{expr}text` whitespace bugs).

**Audit (siblings found, 2026-06-21):** the **same gap exists in the Custodian area** —
`/custodian/*` isn't in `SECTIONS` and custodians share the topbar, so their breadcrumb falls through
too (the egregious sibling). Shallower cousins: deep Settings sub-pages (`/settings/email/[slug]`)
and `/legal/[slug]` show the *section* label, not the leaf. *(Custodian fix attempted but not shipped
— the dev preview's headless tab was throttling client effects so the breadcrumb couldn't be
runtime-verified; per MISTAKES #8 + this entry, an unverified breadcrumb change touching the shared
`useNavTrail` hook is not shipped. To fix WITH verification.)*

**Trigger:** Adding OR moving ANY route/page. Before "done", grep the sibling routes in `Topbar.tsx`
(`SECTIONS` + branches), `CommandMenu.tsx` (`PAGES`), and `SidebarNav.tsx`, register the new route in
each, then click into the page and SEE the breadcrumb + ⌘K + nav resolve correctly.

**Lesson:** A page that *renders* is not a page that's *done*. The chrome around it — breadcrumb,
search, nav — is part of the work, and it lives in separate maps that don't auto-update. Verify the
whole surface, every time. (Pairs with the memory *verify-whole-surface-not-just-happy-path*.)

---

*Append new mistakes to the bottom with the next sequential number on **"Add to Mistakes"**, or
when a diagnosed regression is worth locking and Roland approves the entry.*
