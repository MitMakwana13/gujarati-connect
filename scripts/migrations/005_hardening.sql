-- Refresh token blocklist (enables "log out everywhere")
CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti         UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revoked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_user ON revoked_tokens(user_id);

-- Missing post index for author lookup
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id) 
  WHERE deleted_at IS NULL;
