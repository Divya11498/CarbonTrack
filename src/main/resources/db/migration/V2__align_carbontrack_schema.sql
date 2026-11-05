
-- V2: Add supporting indexes for CarbonTrack core tables.
-- V1 already creates the complete schema, so no duplicate tables or columns are needed.

CREATE INDEX IF NOT EXISTS idx_users_email
    ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_is_active
    ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_org_members_user
    ON organization_members(user_id);

CREATE INDEX IF NOT EXISTS idx_org_members_org
    ON organization_members(organization_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user
    ON user_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_types_category
    ON activity_types(category_id);

CREATE INDEX IF NOT EXISTS idx_activity_types_active
    ON activity_types(is_active);

CREATE INDEX IF NOT EXISTS idx_emission_factors_activity
    ON emission_factors(activity_type_id);

CREATE INDEX IF NOT EXISTS idx_emission_factors_active
    ON emission_factors(is_active);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date
    ON activity_logs(user_id, log_date);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_category
    ON activity_logs(user_id, category_id, log_date);

CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type
    ON activity_logs(activity_type_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_org
    ON activity_logs(organization_id);

CREATE INDEX IF NOT EXISTS idx_goals_user_status
    ON goals(user_id, status);

CREATE INDEX IF NOT EXISTS idx_goals_org
    ON goals(organization_id);

CREATE INDEX IF NOT EXISTS idx_goal_progress_goal
    ON goal_progress(goal_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_user
    ON user_badges(user_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_user
    ON recommendations(user_id);

CREATE INDEX IF NOT EXISTS idx_feedback_user
    ON feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_period
    ON leaderboard(organization_id, period_end);

CREATE INDEX IF NOT EXISTS idx_leaderboard_user
    ON leaderboard(user_id);
