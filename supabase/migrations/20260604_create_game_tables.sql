-- ================================================================
-- Phase 5: Games Hub
-- Creates game_sessions (live tracking) and game_replays (move logs)
-- ================================================================

-- Game Sessions: tracks every completed or in-progress game
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type    TEXT        NOT NULL,
  player_a_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  player_b_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  winner_id    UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  ended_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view own game sessions"
  ON public.game_sessions FOR SELECT
  USING (auth.uid() = player_a_id OR auth.uid() = player_b_id);

CREATE POLICY "Players can insert own game sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = player_a_id OR auth.uid() = player_b_id);

CREATE POLICY "Players can update own game sessions"
  ON public.game_sessions FOR UPDATE
  USING (auth.uid() = player_a_id OR auth.uid() = player_b_id);

-- Game Replays: lightweight move-list storage (Option 1 – moves only, ~1KB/game)
CREATE TABLE IF NOT EXISTS public.game_replays (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type    TEXT        NOT NULL,
  player_a_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  player_b_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  winner_id    UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  moves        JSONB       NOT NULL DEFAULT '[]',   -- [{timestamp, playerId, action, payload}]
  duration     INTEGER     NOT NULL DEFAULT 0,      -- milliseconds
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.game_replays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view own replays"
  ON public.game_replays FOR SELECT
  USING (auth.uid() = player_a_id OR auth.uid() = player_b_id);

CREATE POLICY "Players can insert own replays"
  ON public.game_replays FOR INSERT
  WITH CHECK (auth.uid() = player_a_id OR auth.uid() = player_b_id);
