-- V9: Additive enhancements for preferences, goals metrics, achievement badges, and notification deduplication

-- 1. User preferences and organization department fields
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS department VARCHAR(100),
    ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS weekly_report_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS goal_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS leaderboard_anonymized BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS avatar_seed VARCHAR(150);

-- 2. Goal baseline and reduction percentage columns + MISSED/ACHIEVED status support
ALTER TABLE goals
    ADD COLUMN IF NOT EXISTS reduction_percentage NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS baseline_co2e_kg NUMERIC(12,2);

ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_status_check;
ALTER TABLE goals
    ADD CONSTRAINT goals_status_check
    CHECK (status IN ('ACTIVE', 'COMPLETED', 'ACHIEVED', 'MISSED', 'ARCHIVED', 'CANCELLED'));

-- 3. Seed additional achievement badges requested for milestone and reduction events
INSERT INTO badges (code, name, description, icon_url, badge_type)
VALUES
    ('first_goal_achieved', 'First Goal Achieved', 'Completed your first sustainability reduction goal', '/icons/badges/first_goal_achieved.png', 'SPECIAL'),
    ('reduction_10kg', '10 kg CO2e Saver', 'Saved at least 10 kg CO2e compared to your baseline', '/icons/badges/reduction_10kg.png', 'REDUCTION'),
    ('reduction_25kg', '25 kg CO2e Champion', 'Saved at least 25 kg CO2e compared to your baseline', '/icons/badges/reduction_25kg.png', 'REDUCTION'),
    ('reduction_50kg', '50 kg CO2e Guardian', 'Saved at least 50 kg CO2e compared to your baseline', '/icons/badges/reduction_50kg.png', 'REDUCTION')
ON CONFLICT (code) DO NOTHING;

-- 4. Notification logs for duplicate prevention and audit trail
CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(60) NOT NULL,
    reference_key VARCHAR(150) NOT NULL DEFAULT '',
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, notification_type, reference_key)
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user
    ON notification_logs(user_id, created_at DESC);
