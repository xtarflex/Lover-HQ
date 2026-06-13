-- Migration: Restore Partner Profile Update RLS Policy
-- Re-creates the policy allowing users to update their partner's profile row
-- under the users table. Updates are constrained by the BEFORE UPDATE trigger.

DROP POLICY IF EXISTS "Users can update partner profile" ON public.users;

CREATE POLICY "Users can update partner profile"
ON public.users FOR UPDATE TO authenticated
USING (auth.uid() = partner_id)
WITH CHECK (auth.uid() = partner_id OR partner_id IS NULL);
