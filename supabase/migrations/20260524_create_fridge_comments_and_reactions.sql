-- Create table for comments
CREATE TABLE IF NOT EXISTS public.fridge_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.fridge_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on fridge_comments
ALTER TABLE public.fridge_comments ENABLE ROW LEVEL SECURITY;

-- Allow paired users to view and manage comments
DROP POLICY IF EXISTS "Paired users can manage comments" ON public.fridge_comments;
CREATE POLICY "Paired users can manage comments"
ON public.fridge_comments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (partner_id = fridge_comments.user_id OR id = fridge_comments.user_id)
  )
);

-- Add reactions JSONB column to fridge_items if it doesn't exist
ALTER TABLE public.fridge_items ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- Drop the old fridge_items type check constraint and add the new one including 'emoji'
ALTER TABLE public.fridge_items DROP CONSTRAINT IF EXISTS fridge_items_type_check;
ALTER TABLE public.fridge_items ADD CONSTRAINT fridge_items_type_check CHECK (type IN ('note', 'photo', 'voice', 'emoji'));

-- Enable Realtime replication for fridge_comments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.fridge_comments;
