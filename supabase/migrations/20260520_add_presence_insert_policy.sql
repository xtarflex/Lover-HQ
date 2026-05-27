-- Allow users to insert their own presence row
CREATE POLICY "Users can insert own presence"
ON public.presence FOR INSERT
WITH CHECK (auth.uid() = user_id);
