-- V6: Auth extensions and password reset support

-- 1. Extend users table for avatars and Google OAuth
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- 2. Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash
    ON password_reset_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_password_reset_user_id
    ON password_reset_tokens(user_id);
