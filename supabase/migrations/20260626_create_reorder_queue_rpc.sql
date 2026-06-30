-- Migration: Create RPC function for bulk updating music queue positions
-- Fixes N+1 issue when reordering the queue

CREATE OR REPLACE FUNCTION public.update_queue_positions(payload JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER -- Ensures row-level security (RLS) policies are enforced for the calling user
SET search_path = public
AS $$
BEGIN
  -- The payload is expected to be an array of objects: [{"id": "uuid", "position_index": 0}, ...]

  -- Update the music_queue table by joining against the parsed JSON payload
  UPDATE public.music_queue mq
  SET position_index = (elem->>'position_index')::integer
  FROM jsonb_array_elements(payload) AS elem
  WHERE mq.id = (elem->>'id')::uuid;

END;
$$;
