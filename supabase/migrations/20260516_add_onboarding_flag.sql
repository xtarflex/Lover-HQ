-- Add onboarding_completed flag to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update the handle_new_user function to ensure the flag is initialized correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar_url, onboarding_completed)
  VALUES (new.id, split_part(new.email, '@', 1), 'cat', FALSE);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
