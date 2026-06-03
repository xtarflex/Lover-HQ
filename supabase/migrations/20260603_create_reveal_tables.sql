-- Create table for custom reveal questions
CREATE TABLE IF NOT EXISTS public.reveal_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  scheduled_for_date DATE DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on reveal_questions
ALTER TABLE public.reveal_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow creator and their partner to manage custom questions
DROP POLICY IF EXISTS "Paired users can manage custom questions" ON public.reveal_questions;
CREATE POLICY "Paired users can manage custom questions" ON public.reveal_questions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (partner_id = reveal_questions.user_id OR id = reveal_questions.user_id)
  )
);

-- Create table for daily active question
CREATE TABLE IF NOT EXISTS public.reveal_daily_question (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- creator link representing couple
  question_id TEXT NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  active_date DATE NOT NULL,
  CONSTRAINT unique_couple_daily_question UNIQUE (user_id, active_date)
);

-- Enable RLS on reveal_daily_question
ALTER TABLE public.reveal_daily_question ENABLE ROW LEVEL SECURITY;

-- Policy: Allow couple to view daily active question
DROP POLICY IF EXISTS "Paired users can view daily questions" ON public.reveal_daily_question;
CREATE POLICY "Paired users can view daily questions" ON public.reveal_daily_question
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (partner_id = reveal_daily_question.user_id OR id = reveal_daily_question.user_id)
  )
);

-- Policy: Allow couple to insert daily active question
DROP POLICY IF EXISTS "Paired users can create daily questions" ON public.reveal_daily_question;
CREATE POLICY "Paired users can create daily questions" ON public.reveal_daily_question
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

-- Create table for Q&A answers
CREATE TABLE IF NOT EXISTS public.reveal_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_question_answer UNIQUE (user_id, question_id)
);

-- Enable RLS on reveal_answers
ALTER TABLE public.reveal_answers ENABLE ROW LEVEL SECURITY;

-- Policy: Select policy (blind reveal):
-- 1. Users can select their own answers.
-- 2. Users can select partner's answers only if they have already answered the same question.
DROP POLICY IF EXISTS "Allow reading own answers and partner answers if user has answered" ON public.reveal_answers;
CREATE POLICY "Allow reading own answers and partner answers if user has answered" ON public.reveal_answers
FOR SELECT
USING (
  user_id = auth.uid()
  OR (
    user_id = (SELECT partner_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.reveal_answers 
      WHERE user_id = auth.uid() AND question_id = reveal_answers.question_id
    )
  )
);

-- Policy: Insert own answers
DROP POLICY IF EXISTS "Allow inserting own answers" ON public.reveal_answers;
CREATE POLICY "Allow inserting own answers" ON public.reveal_answers
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

-- Policy: Update own reactions (allow modifying reactions on either user's answer if paired)
DROP POLICY IF EXISTS "Allow updating reactions on Q&A answers" ON public.reveal_answers;
CREATE POLICY "Allow updating reactions on Q&A answers" ON public.reveal_answers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (partner_id = reveal_answers.user_id OR id = reveal_answers.user_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (partner_id = reveal_answers.user_id OR id = reveal_answers.user_id)
  )
);

-- Create table for Q&A comments
CREATE TABLE IF NOT EXISTS public.reveal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on reveal_comments
ALTER TABLE public.reveal_comments ENABLE ROW LEVEL SECURITY;

-- Policy: View/manage comments if paired
DROP POLICY IF EXISTS "Paired users can manage Q&A comments" ON public.reveal_comments;
CREATE POLICY "Paired users can manage Q&A comments" ON public.reveal_comments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (partner_id = reveal_comments.user_id OR id = reveal_comments.user_id)
  )
);

-- Create table for Q&A favorites (starred)
CREATE TABLE IF NOT EXISTS public.reveal_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_favorite_question UNIQUE (user_id, question_id)
);

-- Enable RLS on reveal_favorites
ALTER TABLE public.reveal_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: View/manage own favorites
DROP POLICY IF EXISTS "Users can manage own Q&A favorites" ON public.reveal_favorites;
CREATE POLICY "Users can manage own Q&A favorites" ON public.reveal_favorites
FOR ALL
USING (
  user_id = auth.uid()
);

-- Enable Realtime replication for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.reveal_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reveal_comments;
