-- Performance indexes for analytics queries. Run after confirming equivalent indexes do not exist.
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date
    ON activity_logs (user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type_date
    ON activity_logs (activity_type_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_emission_factors_type_active
    ON emission_factors (activity_type_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_status
    ON user_goals (user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_badges_user
    ON user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user
    ON feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_read
    ON recommendations (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_users_org
    ON users (org_id);
