-- 1. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar_url)
  VALUES (new.id, split_part(new.email, '@', 1), 'cat');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Backfill existing users from auth.users to public.users
INSERT INTO public.users (id, name, avatar_url)
SELECT id, split_part(email, '@', 1), 'cat'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. Fix RLS policies for users table
-- We need to allow users to update their own profile AND their partner's profile
DROP POLICY IF EXISTS "Users can update partner profile only" ON users;

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update partner profile"
ON public.users FOR UPDATE
USING (auth.uid() = partner_id)
WITH CHECK (auth.uid() = partner_id);

-- 5. Add missing indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON public.users(partner_id);
CREATE INDEX IF NOT EXISTS idx_fridge_items_user_id ON public.fridge_items(user_id);
CREATE INDEX IF NOT EXISTS idx_music_queue_added_by ON public.music_queue(added_by);
CREATE INDEX IF NOT EXISTS idx_reveals_user_a_id ON public.reveals(user_a_id);
CREATE INDEX IF NOT EXISTS idx_reveals_user_b_id ON public.reveals(user_b_id);
CREATE INDEX IF NOT EXISTS idx_presence_user_id ON public.presence(user_id);
CREATE INDEX IF NOT EXISTS idx_users_pairing_code ON public.users(pairing_code);
