-- Migration: Add artwork and cache tracking columns to music_queue table
ALTER TABLE public.music_queue
  ADD COLUMN IF NOT EXISTS artwork_url TEXT,
  ADD COLUMN IF NOT EXISTS cached_by_partner BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cached_at TIMESTAMPTZ;

-- Index for TTL cleanup queries
CREATE INDEX IF NOT EXISTS idx_music_queue_cache_ttl
  ON public.music_queue (cached_by_partner, created_at)
  WHERE cached_by_partner = true;
