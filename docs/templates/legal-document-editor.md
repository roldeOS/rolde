# TEMPLATE — Content-Managed Legal Document Editor (draft → preview → publish)

> **Portable across RoDee Studio products.** Built first for **RolDe OS** (2026-06-17).
> Hand this to any Jarvis instance (mindate app/iOS, mindate-dashboard, a website, the
> next product) to build the same "edit your own legal docs" capability. The *architecture*
> transplants even when the stack doesn't — adapt the UI to your platform, keep the data
> model, the RLS read-tiers, and the atomic publish.

## 1. What it is (and why)

A way for the platform owner (Custodian / founder / admin — your top role) to **draft, preview
and publish** the product's legal & safety documents **themselves, from the app — no developer,
no redeploy**. Each document is **versioned**: publishing makes a new version live everywhere
and files the old one under "Superseded", kept for audit so anyone can always read the policy
that applied on a given date.

**Why content-managed, never the platform default** (mindate/RolDe MISTAKES #3 — *never drift*):
do NOT hardcode the documents and re-edit code to change them, and do NOT lean on a vendor's
dashboard template. The content lives in your own DB; the app owns the edit/publish flow.

## 2. The split that makes it simple

| Lives in CODE (a static catalog) | Lives in the DB (editable) |
|---|---|
| Which documents exist (keys) | The **content**: intro + sections |
| Each doc's title, icon, tone, summary | The **version + status** (draft/published/superseded) |
| The order they appear | `published_at`, `created_by`, timestamps |

The doc *identity* (title/icon) rarely changes and a UI icon is a code component that can't be
stored in a DB row or cross a server→client boundary — so keep it in code. Only the **words**
(what actually gets edited) go in the DB. Merge the two at read time.

## 3. Data model

One table, `*_doc_versions` (RolDe: `legal_doc_versions`):

```
id            uuid pk
doc_key       text         -- which document (matches a code-catalog key)
version       text         -- "1.0", "1.1", … (human, editor-set)
status        text         -- 'draft' | 'published' | 'superseded'   (CHECK)
intro         text         -- the lead paragraph
sections      jsonb        -- [{ heading, body?, items?[] }]
created_by    uuid         -- who drafted it (audit)
published_at  timestamptz
created_at / updated_at timestamptz
```

**Invariant — at most ONE published version per document.** Enforce in the DB, not just app
logic:

```sql
create unique index ..._one_published on *_doc_versions (doc_key) where status = 'published';
```

## 4. RLS read-tiers (the security spine)

Three audiences, three visibilities — enforce with row-level security so it holds even via raw
API access:

- **anon** (public policy pages): `status = 'published'` only.
- **authenticated** (in-app readers / staff — the version-history rail): `status in ('published','superseded')` (NOT drafts).
- **owner role** (Custodian/admin): everything, including drafts (a separate `for all` policy gated on your `is_owner()` check).

## 5. Atomic publish (the one thing you must get right)

Publishing is a **swap**: supersede the current published version, then promote the draft. Do it
in ONE transaction so a document is never left with zero or two published versions. A
`security definer` RPC, with the role check INSIDE:

```sql
create function publish_*_draft(p_doc_key text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_owner() then raise exception 'not authorised'; end if;
  update *_doc_versions set status='superseded' where doc_key=p_doc_key and status='published';
  update *_doc_versions set status='published', published_at=now()
    where id = (select id from *_doc_versions where doc_key=p_doc_key and status='draft'
                order by updated_at desc limit 1);
end $$;
```

Call it from the **caller's session** (not a service-role client) so `is_owner()` sees the real
user. Verify the swap + the invariant before shipping (RolDe proved it against the DB:
new→published, old→superseded, exactly one published).

## 6. Seed from code (one-off, idempotent)

The first published version of each doc is your existing written content. Seed it from the code
catalog into the DB **idempotently** (skip a doc+version that already exists, so re-running never
clobbers an owner's later edits). Expose it as an owner-gated `POST …/seed` endpoint AND/or a
one-off script.

## 7. The viewers (read path)

A small server helper merges DB content onto the code catalog and maps `status` for display
(`published` → your "in force" label). RLS already scopes what each caller sees, so the *same*
query serves the public page (gets published only) and the in-app reader (gets published +
superseded for the history rail). Render intro + sections with ONE shared presentational
component so the editor's **Preview** is pixel-identical to what publishes.

## 8. The editor (write path) — the two-pane flow

Mirror the "Campaigns" shape (Roland's standing pattern): **library left, flow right, history
below.**

- **LEFT** — the document library (the code catalog). A "Draft" chip on any doc that has an
  unpublished draft.
- **RIGHT** — for the selected doc, a 3-step colour-coded flow:
  - **① Edit** — version field + intro textarea + a list of section editors (heading + body +
    bullets-one-per-line) with add / remove. A persistent **Save Draft**.
  - **② Preview** — the shared body renderer on the current edit state, exactly as it'll publish.
  - **③ Publish** — a plain-English summary of what publishing does, then the button (→ the RPC).
- **BELOW** — version history (current + superseded), newest first.

Two endpoints, both owner-gated, both writing through the caller's session (RLS re-checks):
- `POST …/draft` — upsert the single working draft (one per doc).
- `POST …/publish` — verify a draft exists, then call the atomic RPC; `router.refresh()`.

## 9. RolDe reference files (copy the shape, not the stack)

```
supabase/migrations/*_legal_doc_versions.sql           -- table + unique index + RLS
supabase/migrations/*_legal_read_tiers_and_publish.sql -- read-tier policies + publish RPC
apps/web/src/lib/legal.ts                              -- the CODE catalog (keys/title/icon/tone) + the v1.0 content (seed source)
apps/web/src/lib/legalSeed.ts                          -- idempotent seed-from-code
apps/web/src/lib/legalDb.ts                            -- read helpers (merge DB onto catalog) + the editor loader
apps/web/src/components/LegalDocBody.tsx               -- the ONE shared renderer (viewer + preview)
apps/web/src/app/(app)/legal/{page,LegalReader}.tsx    -- in-app reader (server fetch + client interactivity)
apps/web/src/app/policy/[slug]/page.tsx                -- public page (published only)
apps/web/src/app/(app)/custodian/legal/{page,LegalEditor}.tsx  -- the two-pane editor
apps/web/src/app/api/custodian/legal/{draft,publish}/route.ts  -- the two endpoints
```

## 10. Adapting to another product / iOS

- **Keep:** the table shape, the `draft/published/superseded` status, the one-published index,
  the three RLS read-tiers, the atomic publish RPC, the catalog-in-code / content-in-DB split,
  the idempotent seed.
- **Adapt:** the UI to your platform (native SwiftUI screens instead of React; same 3-step
  flow), your role name for "owner", your `is_owner()` check, your table/route prefixes.
- **Don't skip:** the publish invariant (verify it) and the RLS tiers — they're the safety + the
  compliance correctness, the same on every stack.

---

*RoDee Studio cross-product template. Source of truth: this file + the RolDe reference files in
§9. If you improve the pattern in another product, fold the lesson back here.*
