-- Fix: reveal_daily_question INSERT RLS policy
-- The user_id column stores `coupleKey` = lexicographically first of the two partner UUIDs.
-- The original policy only allowed `user_id = auth.uid()` which fails when the current user's
-- UUID comes second alphabetically (i.e. the partner's UUID is stored as the coupleKey).
-- This policy allows either partner to create the shared daily question row.

DROP POLICY IF EXISTS "Paired users can create daily questions" ON public.reveal_daily_question;

CREATE POLICY "Paired users can create daily questions"
  ON public.reveal_daily_question
  FOR INSERT
  WITH CHECK (
    -- The inserting user IS the coupleKey holder
    user_id = auth.uid()
    OR
    -- The inserting user is paired with the coupleKey holder
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.partner_id = reveal_daily_question.user_id
    )
  );
