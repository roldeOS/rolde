-- Courier evolving note (Roland 2026-07-23): a new feed entry_type for the ONE
-- entry that documents a form courier and evolves (sent → resent → opened →
-- responded). Its own migration so ALTER TYPE ADD VALUE runs in isolation.
alter type public.feed_entry_type add value if not exists 'courier_form';
