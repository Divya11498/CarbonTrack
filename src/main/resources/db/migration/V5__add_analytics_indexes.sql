
-- V3: Add additional indexes for analytics and data retrieval.

CREATE INDEX IF NOT EXISTS idx_emission_factors_valid_dates
ON emission_factors (valid_from, valid_to);

CREATE INDEX IF NOT EXISTS idx_badges_code
ON badges (code);

CREATE INDEX IF NOT EXISTS idx_activity_log_audit_activity_log
ON activity_log_audit (activity_log_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expires
ON user_sessions (expires_at);
