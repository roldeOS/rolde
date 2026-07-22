-- Photo tool — multi-angle sets, Step A (Roland "Go for A", 2026-07-22).
--
-- An aesthetics before/after isn't one pair — it's a SWEEP of standard angles
-- (e.g. 5 or 10 shots left→right), before AND after. So a photo carries a
-- `view` (which angle it is); before/after then pair BY VIEW, any count. The
-- label set is a per-clinic "photo protocol" — Step B makes it Caretaker-editable;
-- Step A uses a sensible default + free-text. Nullable: an un-tagged photo just
-- behaves as before (order/singles).
alter table public.patient_photo
  add column if not exists view text;
