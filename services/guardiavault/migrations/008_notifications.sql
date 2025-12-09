-- Migration: Notifications System
-- Adds notification queue table for email/SMS notifications

-- ============ Notification Enums ============

CREATE TYPE notification_type AS ENUM (
    'check_in_reminder',
    'check_in_warning',
    'check_in_critical',
    'guardian_invitation',
    'beneficiary_notification',
    'attestor_request'
);

CREATE TYPE notification_status AS ENUM (
    'pending',
    'sent',
    'failed'
);

-- ============ Notifications Table ============

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id VARCHAR NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    recipient TEXT NOT NULL,
    channel TEXT NOT NULL, -- 'email', 'sms', or 'telegram'
    status notification_status NOT NULL DEFAULT 'pending',
    message TEXT NOT NULL,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============ Indexes ============

CREATE INDEX IF NOT EXISTS idx_notifications_vault_id ON notifications(vault_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Queue for email, SMS, and Telegram notifications';
COMMENT ON COLUMN notifications.channel IS 'Delivery channel: email, sms, or telegram';
COMMENT ON COLUMN notifications.status IS 'Processing status: pending, sent, or failed';
