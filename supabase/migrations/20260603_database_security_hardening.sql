-- Migration: Database Security Hardening
-- Hardens RLS policies, implements column-level update validation triggers,
-- adds a secure search RPC function, and restructures storage path security.

-- =========================================================================
-- 1. Create secure search RPC for pairing code lookups
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_user_by_pairing_code(input_code text)
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  onboarding_completed boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.avatar_url, u.onboarding_completed
  FROM public.users u
  WHERE u.pairing_code = input_code
    AND u.pairing_code_expires_at > now()
    AND u.id != auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 2. Create BEFORE UPDATE security validation trigger on public.users
-- =========================================================================
CREATE OR REPLACE FUNCTION public.validate_users_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Case 1: User is updating their own record
  IF auth.uid() = NEW.id THEN
    -- Prevent arbitrary setting of partner_id to random users
    IF NEW.partner_id IS NOT NULL AND (OLD.partner_id IS DISTINCT FROM NEW.partner_id) THEN
      -- Allow pairing only if target user has an active code or is already linked back to us
      IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = NEW.partner_id
        AND (partner_id = NEW.id OR (pairing_code IS NOT NULL AND pairing_code_expires_at > now()))
      ) THEN
        RAISE EXCEPTION 'Target partner must have a valid pairing code or already be paired with you.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Case 2: User is updating their partner's record (already paired)
  -- In Lover-HQ, a user can customize their partner's display details (name, avatar_url)
  -- or unpair (set partner_id to NULL).
  IF OLD.partner_id = auth.uid() THEN
    -- Ensure no sensitive/private fields are modified
    IF (
      OLD.id IS DISTINCT FROM NEW.id OR
      OLD.phone_number IS DISTINCT FROM NEW.phone_number OR
      OLD.birthday IS DISTINCT FROM NEW.birthday OR
      OLD.onboarding_completed IS DISTINCT FROM NEW.onboarding_completed OR
      OLD.created_at IS DISTINCT FROM NEW.created_at
    ) THEN
      RAISE EXCEPTION 'Cannot modify partner private columns.';
    END IF;

    -- If unpairing, ensure they set partner_id to NULL
    IF NEW.partner_id IS DISTINCT FROM OLD.partner_id AND NEW.partner_id IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot change partner_id to another user.';
    END IF;

    RETURN NEW;
  END IF;

  -- Case 3: User is updating someone else's record to pair with them via code
  -- This happens during the onboarding link flow (updates partner's row to set partner_id = auth.uid())
  IF OLD.pairing_code IS NOT NULL AND OLD.pairing_code_expires_at > now() THEN
    -- Ensure they are setting partner_id = auth.uid() and clearing the code columns
    IF NEW.partner_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Can only pair with yourself.';
    END IF;
    IF NEW.pairing_code IS NOT NULL OR NEW.pairing_code_expires_at IS NOT NULL THEN
      RAISE EXCEPTION 'Pairing code must be consumed and cleared.';
    END IF;

    -- Ensure no other columns are modified during the pairing update
    IF (
      OLD.id IS DISTINCT FROM NEW.id OR
      OLD.name IS DISTINCT FROM NEW.name OR
      OLD.avatar_url IS DISTINCT FROM NEW.avatar_url OR
      OLD.phone_number IS DISTINCT FROM NEW.phone_number OR
      OLD.birthday IS DISTINCT FROM NEW.birthday OR
      OLD.onboarding_completed IS DISTINCT FROM NEW.onboarding_completed OR
      OLD.created_at IS DISTINCT FROM NEW.created_at
    ) THEN
      RAISE EXCEPTION 'Unauthorized column modification during pairing link.';
    END IF;

    RETURN NEW;
  END IF;

  -- Case 4: Any other cross-user update is denied
  RAISE EXCEPTION 'Unauthorized user update.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_users_update_validation ON public.users;
CREATE TRIGGER on_users_update_validation
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_users_update();

-- =========================================================================
-- 3. Harden users RLS Policies
-- =========================================================================
-- Drop the insecure cross-user link update policy
DROP POLICY IF EXISTS "Users can link with partner via code" ON public.users;

-- Recreate select policy to only show own profile or partner profile, removing the wildcard pairing code check
DROP POLICY IF EXISTS "Users can view own, partner, or by pairing code" ON public.users;
CREATE POLICY "Users can view own or partner profile" ON public.users
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = id) OR
    (auth.uid() = partner_id)
  );

-- =========================================================================
-- 4. Create BEFORE UPDATE security validation trigger on public.reveals
-- =========================================================================
CREATE OR REPLACE FUNCTION public.validate_reveals_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If current user is User A
  IF auth.uid() = OLD.user_a_id THEN
    -- Block editing anything other than user_a_answer
    IF (
      OLD.id IS DISTINCT FROM NEW.id OR
      OLD.question IS DISTINCT FROM NEW.question OR
      OLD.user_a_id IS DISTINCT FROM NEW.user_a_id OR
      OLD.user_b_id IS DISTINCT FROM NEW.user_b_id OR
      OLD.user_b_answer IS DISTINCT FROM NEW.user_b_answer OR
      OLD.date IS DISTINCT FROM NEW.date OR
      OLD.created_at IS DISTINCT FROM NEW.created_at
    ) THEN
      RAISE EXCEPTION 'Cannot modify partner answer or question columns.';
    END IF;
    RETURN NEW;
  END IF;

  -- If current user is User B
  IF auth.uid() = OLD.user_b_id THEN
    -- Block editing anything other than user_b_answer
    IF (
      OLD.id IS DISTINCT FROM NEW.id OR
      OLD.question IS DISTINCT FROM NEW.question OR
      OLD.user_a_id IS DISTINCT FROM NEW.user_a_id OR
      OLD.user_a_answer IS DISTINCT FROM NEW.user_a_answer OR
      OLD.user_b_id IS DISTINCT FROM NEW.user_b_id OR
      OLD.date IS DISTINCT FROM NEW.date OR
      OLD.created_at IS DISTINCT FROM NEW.created_at
    ) THEN
      RAISE EXCEPTION 'Cannot modify partner answer or question columns.';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Unauthorized answer submission.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reveals_update_validation ON public.reveals;
CREATE TRIGGER on_reveals_update_validation
  BEFORE UPDATE ON public.reveals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_reveals_update();

-- =========================================================================
-- 5. Secure storage.objects policies
-- =========================================================================
-- Recreate Storage policies for path safety
DROP POLICY IF EXISTS "Authenticated users can upload fridge media" ON storage.objects;
CREATE POLICY "Authenticated users can upload own fridge media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fridge-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can view fridge media" ON storage.objects;
CREATE POLICY "Users can view paired fridge media" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'fridge-media' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      (storage.foldername(name))[1] = (SELECT partner_id::text FROM public.users WHERE id = auth.uid())
    )
  );

-- =========================================================================
-- 6. Secure public.fridge_comments policies
-- =========================================================================
-- Drop the broad Paired users can manage comments policy
DROP POLICY IF EXISTS "Paired users can manage comments" ON public.fridge_comments;

-- SELECT: Allow viewing comments on parent fridge items the user has access to
CREATE POLICY "Users can view comments on accessible fridge items" ON public.fridge_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fridge_items
      WHERE fridge_items.id = fridge_comments.item_id
    )
  );

-- INSERT: Allow inserting own comments
CREATE POLICY "Users can insert own comments" ON public.fridge_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- DELETE: Allow deleting own comments
CREATE POLICY "Users can delete own comments" ON public.fridge_comments
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
  );
