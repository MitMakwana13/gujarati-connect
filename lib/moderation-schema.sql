-- ============================================================
-- Content Moderation Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type TEXT CHECK (content_type IN ('post','comment','profile')) NOT NULL,
  content_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam','hate','nudity','violence','misinformation','other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','removed','dismissed')),
  is_auto_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add flag columns to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- 3. Add flag columns to comments
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;

-- 4. RLS on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create reports
CREATE POLICY "Users can insert reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Users can see their own reports
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Service role (admin panel) can do everything
CREATE POLICY "Service role full access"
  ON public.reports FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Prevent duplicate reports from same user on same content
CREATE UNIQUE INDEX IF NOT EXISTS reports_unique_per_user
  ON public.reports(reporter_id, content_type, content_id);
