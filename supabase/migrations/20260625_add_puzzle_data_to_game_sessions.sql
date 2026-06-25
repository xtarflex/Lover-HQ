-- Add puzzle_data and player_states columns to public.game_sessions
ALTER TABLE public.game_sessions
ADD COLUMN IF NOT EXISTS puzzle_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS player_states JSONB DEFAULT '{}'::jsonb;
