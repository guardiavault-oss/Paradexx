-- Migration: Hardware Devices Table
-- For hardware ping endpoint and device monitoring
-- Generated: 2025-01-27

BEGIN;

-- Hardware device status enum
DO $$ BEGIN
  CREATE TYPE hardware_device_status AS ENUM ('active', 'offline', 'suspended', 'lost');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Hardware devices table
CREATE TABLE IF NOT EXISTS hardware_devices (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL UNIQUE,
  device_name TEXT,
  public_key TEXT NOT NULL, -- Public key for signature verification (PEM format)
  last_ping TIMESTAMP,
  status hardware_device_status NOT NULL DEFAULT 'active',
  alert_threshold_minutes INTEGER DEFAULT 1440, -- 24 hours default
  last_alert_sent TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_device_id CHECK (char_length(device_id) >= 8),
  CONSTRAINT valid_public_key CHECK (char_length(public_key) > 0),
  CONSTRAINT valid_alert_threshold CHECK (alert_threshold_minutes > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hardware_devices_user_id ON hardware_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_hardware_devices_device_id ON hardware_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_hardware_devices_status ON hardware_devices(status);
CREATE INDEX IF NOT EXISTS idx_hardware_devices_last_ping ON hardware_devices(last_ping);
CREATE INDEX IF NOT EXISTS idx_hardware_devices_offline_check ON hardware_devices(status, last_ping) 
  WHERE status = 'active';

-- Hardware ping logs table (for audit trail)
CREATE TABLE IF NOT EXISTS hardware_ping_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR NOT NULL REFERENCES hardware_devices(device_id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  signature_valid BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  
  -- Index for queries
  CONSTRAINT fk_ping_logs_device FOREIGN KEY (device_id) REFERENCES hardware_devices(device_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hardware_ping_logs_device_id ON hardware_ping_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_hardware_ping_logs_timestamp ON hardware_ping_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_hardware_ping_logs_user_id ON hardware_ping_logs(user_id);

COMMIT;

