-- Migration: Preferences and Pairing Flows
-- Adds user_preferences table, pairing_history table, reconnect_requests table,
-- and triggers for defaults, history logging, and a transactional unpair RPC.

-- 1. Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark', -- 'dark' or 'light'
  sound_muted BOOLEAN DEFAULT FALSE,
  grid_snapping BOOLEAN DEFAULT TRUE,
  fridge_background TEXT DEFAULT 'metallic',
  fridge_note_font TEXT DEFAULT 'handwriting',
  fridge_magnet_size TEXT DEFAULT 'medium',
  auto_compact_days INTEGER DEFAULT 90,
  push_notifications_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for user_preferences
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage own preferences"
ON public.user_preferences FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger to automatically insert preferences on user profile creation
CREATE OR REPLACE FUNCTION public.handle_create_user_preferences()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_preferences ON public.users;
CREATE TRIGGER on_user_created_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_create_user_preferences();

-- Backfill preferences for existing users
INSERT INTO public.user_preferences (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;


-- 2. Create pairing_history table
CREATE TABLE IF NOT EXISTS public.pairing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user_b_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  paired_at TIMESTAMPTZ DEFAULT NOW(),
  unpaired_at TIMESTAMPTZ,
  reunion_count INTEGER DEFAULT 1,
  UNIQUE(user_a_id, user_b_id)
);

-- Enable RLS on pairing_history
ALTER TABLE public.pairing_history ENABLE ROW LEVEL SECURITY;

-- Create policy to select history
DROP POLICY IF EXISTS "Users can view own pairing history" ON public.pairing_history;
CREATE POLICY "Users can view own pairing history"
ON public.pairing_history FOR SELECT
TO authenticated
USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Create trigger to update pairing history automatically on users.partner_id change
CREATE OR REPLACE FUNCTION public.log_pairing_history()
RETURNS trigger AS $$
DECLARE
  low_id UUID;
  high_id UUID;
BEGIN
  -- When they pair
  IF NEW.partner_id IS NOT NULL AND (OLD.partner_id IS NULL OR OLD.partner_id IS DISTINCT FROM NEW.partner_id) THEN
    low_id := LEAST(NEW.id, NEW.partner_id);
    high_id := GREATEST(NEW.id, NEW.partner_id);
    
    INSERT INTO public.pairing_history (user_a_id, user_b_id, paired_at, unpaired_at)
    VALUES (low_id, high_id, NOW(), NULL)
    ON CONFLICT (user_a_id, user_b_id) 
    DO UPDATE SET 
      paired_at = NOW(), 
      unpaired_at = NULL, 
      reunion_count = pairing_history.reunion_count + 1;
      
  -- When they unpair
  ELSIF NEW.partner_id IS NULL AND OLD.partner_id IS NOT NULL THEN
    low_id := LEAST(NEW.id, OLD.partner_id);
    high_id := GREATEST(NEW.id, OLD.partner_id);
    
    UPDATE public.pairing_history
    SET unpaired_at = NOW()
    WHERE user_a_id = low_id AND user_b_id = high_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_partner_change_log_history ON public.users;
CREATE TRIGGER on_partner_change_log_history
  AFTER UPDATE OF partner_id ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_pairing_history();


-- 3. Create reconnect_requests table
CREATE TABLE IF NOT EXISTS public.reconnect_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- Enable RLS on reconnect_requests
ALTER TABLE public.reconnect_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for reconnect_requests
DROP POLICY IF EXISTS "Users can view own reconnect requests" ON public.reconnect_requests;
CREATE POLICY "Users can view own reconnect requests"
ON public.reconnect_requests FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can insert reconnect requests" ON public.reconnect_requests;
CREATE POLICY "Users can insert reconnect requests"
ON public.reconnect_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update received reconnect requests" ON public.reconnect_requests;
CREATE POLICY "Users can update received reconnect requests"
ON public.reconnect_requests FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete own reconnect requests" ON public.reconnect_requests;
CREATE POLICY "Users can delete own reconnect requests"
ON public.reconnect_requests FOR DELETE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);


-- 4. Create secure RPC for unpairing and cleaning data conditionally
CREATE OR REPLACE FUNCTION public.unpair_user_and_clean_data(delete_shared boolean)
RETURNS void AS $$
DECLARE
  curr_partner_id UUID;
BEGIN
  -- Get the current partner ID
  SELECT partner_id INTO curr_partner_id FROM public.users WHERE id = auth.uid();
  
  IF curr_partner_id IS NOT NULL THEN
    -- If delete_shared is true, delete shared records before unlinking
    IF delete_shared THEN
      -- Delete fridge comments for items created by either user
      DELETE FROM public.fridge_comments
      WHERE item_id IN (
        SELECT id FROM public.fridge_items 
        WHERE user_id IN (auth.uid(), curr_partner_id)
      );

      -- Delete fridge items created by either user
      DELETE FROM public.fridge_items 
      WHERE user_id IN (auth.uid(), curr_partner_id);
      
      -- Delete reveal answers created by either user
      DELETE FROM public.reveal_answers
      WHERE user_id IN (auth.uid(), curr_partner_id);
      
      -- Note: Custom reveal questions are owned by user_id representing couple creator.
      -- Delete custom questions where creator is one of the partners
      DELETE FROM public.reveal_questions
      WHERE user_id IN (auth.uid(), curr_partner_id);
    END IF;
    
    -- Clear partner ID from both user records (the trigger handles bidirectional update, but we do it explicitly just in case)
    UPDATE public.users SET partner_id = NULL WHERE id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
