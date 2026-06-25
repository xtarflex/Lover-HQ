-- Create table for chat messages
DROP TABLE IF EXISTS public.messages CASCADE;

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  fridge_item_id UUID REFERENCES public.fridge_items(id) ON DELETE SET NULL,
  reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  media_url TEXT DEFAULT NULL,
  media_type VARCHAR(50) DEFAULT NULL, -- 'image' or 'voice'
  is_edited BOOLEAN DEFAULT FALSE,
  reactions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow creator and their partner to view and create messages
DROP POLICY IF EXISTS "Paired users can manage messages" ON public.messages;
CREATE POLICY "Paired users can manage messages" ON public.messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (partner_id = messages.user_id OR id = messages.user_id)
  )
);

-- Enable Realtime replication for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
