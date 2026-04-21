-- ============================================================
-- MIGRATION 005: Security hardening & performance indexes
-- ============================================================
-- Safe to run multiple times (all statements are IF NOT EXISTS).
-- Do NOT add display_name UNIQUE — display names are not usernames.
-- Do NOT add ON DELETE CASCADE to posts.author_id — use soft delete
-- pattern instead (keep orphaned posts attributed to deleted account).

-- ── Refresh token blocklist ───────────────────────────────────
-- Enables real logout and "log out everywhere".
-- auth plugin checks this table on every authenticate() call.
-- Pruned on each logout to stay lean.
CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti         UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revoked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires
  ON revoked_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_user
  ON revoked_tokens(user_id);

-- ── Performance indexes ───────────────────────────────────────
-- Speeds up "get all posts by author" queries used in profile view.
CREATE INDEX IF NOT EXISTS idx_posts_author_active
  ON posts(author_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Speeds up feed queries that filter by group.
CREATE INDEX IF NOT EXISTS idx_posts_group_published
  ON posts(group_id, created_at DESC)
  WHERE deleted_at IS NULL AND moderation_status = 'published';

-- Speeds up reaction lookups on the feed.
CREATE INDEX IF NOT EXISTS idx_reactions_user_target
  ON reactions(user_id, target_type, target_id);

-- Speeds up conversation participant lookups for messaging.
CREATE INDEX IF NOT EXISTS idx_conv_participants_user
  ON conversation_participants(user_id, status)
  WHERE status = 'active';

-- ── Username uniqueness ────────────────────────────────────────
-- username/handle is unique (like @handle on Twitter).
-- display_name is NOT unique — it is a human-readable label.
-- If you do not have a username column yet, add it here:
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username)
--   WHERE username IS NOT NULL;

-- ── Audit log is intentionally immutable ──────────────────────
-- No changes to audit_log. It is INSERT-only by DB role grant
-- (see migration 003_roles_and_permissions.sql).
