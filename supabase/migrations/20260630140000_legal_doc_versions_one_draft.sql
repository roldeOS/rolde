-- Enforce AT MOST ONE DRAFT per legal document — the missing twin of the existing
-- one-published invariant (legal_doc_versions_one_published).
--
-- Why: the Custodian legal editor saves a draft with a find-then-update upsert
-- (SELECT ... WHERE status='draft' → maybeSingle() → update-or-insert,
-- apps/web/src/app/api/custodian/legal/draft/route.ts). The DB enforced one
-- PUBLISHED row per doc but only ASSUMED one draft, so a concurrent double-save
-- could leave two drafts — which then jams the upsert (maybeSingle() throws on
-- >1 row). With this partial unique index the DB guarantees the invariant, so the
-- race fails safely (a unique violation) instead of corrupting state.
--
-- Cross-product correctness fix flagged by mindate's Jarvis 2026-06-30 (the shared
-- legal-document-editor template enforced one-published but only assumed one-draft).
-- Both invariants are now enforced; the template (docs/templates/legal-document-editor.md
-- §3/§5) is updated to require BOTH partial unique indexes.
create unique index if not exists legal_doc_versions_one_draft
  on public.legal_doc_versions (doc_key)
  where status = 'draft';
