BEGIN;

-- Remove the strict context constraint to allow global feed posts
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_must_have_context;

COMMIT;
