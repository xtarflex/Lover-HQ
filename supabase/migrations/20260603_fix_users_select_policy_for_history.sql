-- Migration: Fix users select policy for pairing history and reconnect requests securely
-- Restores the strict SELECT policy on users to protect private columns (phone_number, birthday, pairing_code).
-- Deploys get_public_profiles() RPC function which runs with SECURITY DEFINER to return only (id, name, avatar_url)
-- for users with whom the current authenticated user shares a history, active reconnect request, or active partnership.

DROP POLICY IF EXISTS "Users can view own, partner, or linked profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view own or partner profile" ON public.users;

CREATE POLICY "Users can view own or partner profile" ON public.users
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = id) OR
    (auth.uid() = partner_id)
  );

-- Create secure get_public_profiles RPC helper
CREATE OR REPLACE FUNCTION public.get_public_profiles(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.avatar_url
  FROM public.users u
  WHERE u.id = ANY(user_ids)
    AND (
      u.id = auth.uid() OR
      u.partner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.pairing_history
        WHERE (user_a_id = auth.uid() AND user_b_id = u.id)
           OR (user_b_id = auth.uid() AND user_a_id = u.id)
      ) OR
      EXISTS (
        SELECT 1 FROM public.reconnect_requests
        WHERE (sender_id = auth.uid() AND receiver_id = u.id)
           OR (receiver_id = auth.uid() AND sender_id = u.id)
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
