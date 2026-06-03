-- Migration: Fix Reconnect Validation
-- Updates public.validate_users_update() to support accepting reconnect requests.
-- Allows updating partner_id if there is a pending reconnect request.

CREATE OR REPLACE FUNCTION public.validate_users_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Case 1: User is updating their own record
  IF auth.uid() = NEW.id THEN
    -- Prevent arbitrary setting of partner_id to random users
    IF NEW.partner_id IS NOT NULL AND (OLD.partner_id IS DISTINCT FROM NEW.partner_id) THEN
      -- Allow pairing only if target user has an active code, reconnect request, or is already linked back to us
      IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = NEW.partner_id
        AND (partner_id = NEW.id OR (pairing_code IS NOT NULL AND pairing_code_expires_at > now()))
      ) AND NOT EXISTS (
        SELECT 1 FROM public.reconnect_requests
        WHERE sender_id = NEW.partner_id AND receiver_id = NEW.id
      ) THEN
        RAISE EXCEPTION 'Target partner must have a valid pairing code, reconnect request, or already be paired with you.';
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

  -- Case 5: User is updating someone else's record to accept a reconnect request
  -- This happens when receiver (auth.uid()) is linking back to sender (OLD.id)
  IF EXISTS (
    SELECT 1 FROM public.reconnect_requests
    WHERE sender_id = OLD.id AND receiver_id = auth.uid()
  ) THEN
    -- Ensure they are setting partner_id = auth.uid()
    IF NEW.partner_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Can only pair with yourself.';
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
      RAISE EXCEPTION 'Unauthorized column modification during reconnect link.';
    END IF;

    RETURN NEW;
  END IF;

  -- Case 4: Any other cross-user update is denied
  RAISE EXCEPTION 'Unauthorized user update.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
