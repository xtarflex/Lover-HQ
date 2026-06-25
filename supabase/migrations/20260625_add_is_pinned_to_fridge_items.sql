-- Adds is_pinned column to fridge_items to prevent drag and auto-compaction
ALTER TABLE public.fridge_items ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
