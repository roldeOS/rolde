-- Body-Map v2 (Roland greenlit 2026-07-04): a body-map save is a FIRST-CLASS
-- feed entry (the gold-mine timeline law) — payload carries the rendered text
-- + the structured marks (pins with site/note, freehand strokes, view).
alter type feed_entry_type add value if not exists 'body_map';
