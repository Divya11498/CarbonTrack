-- V10: Track read state & friendly description on in-app/email notification logs

ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS message TEXT;

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_unread
    ON notification_logs (user_id, is_read, created_at DESC);
