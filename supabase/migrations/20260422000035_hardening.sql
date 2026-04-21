-- 1. UNIQUE display_name to prevent impersonation
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_display_name_unique UNIQUE (display_name);

-- 2. ON DELETE CASCADE for posts (so deleting a user deletes their posts)
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_author_id_fkey,
ADD CONSTRAINT posts_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. ON DELETE CASCADE for audit_logs
ALTER TABLE public.audit_logs
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey,
ADD CONSTRAINT audit_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Add missing index on posts for author lookup
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);

-- 5. Add refresh token blocklist table for "logout everywhere"
CREATE TABLE IF NOT EXISTS public.revoked_tokens (
  jti UUID PRIMARY KEY,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON public.revoked_tokens(expires_at);
