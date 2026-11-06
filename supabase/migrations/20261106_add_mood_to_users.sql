-- Migration: Add mood column to users table
-- Enables couples to store and sync their real-time mood status across devices.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS mood TEXT DEFAULT 'happy';

-- Backfill existing users with default mood
UPDATE public.users
SET mood = 'happy'
WHERE mood IS NULL;
