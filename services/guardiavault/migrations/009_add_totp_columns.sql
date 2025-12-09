-- Add TOTP/2FA columns to users table
-- Migration 009: Add missing TOTP columns for two-factor authentication

BEGIN;

-- Add TOTP columns to users table if they don't exist
DO $$ 
BEGIN
  -- Add totp_secret column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'totp_secret'
  ) THEN
    ALTER TABLE users ADD COLUMN totp_secret TEXT;
  END IF;

  -- Add totp_enabled column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'totp_enabled'
  ) THEN
    ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN DEFAULT false;
  END IF;

  -- Add backup_codes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'backup_codes'
  ) THEN
    ALTER TABLE users ADD COLUMN backup_codes TEXT;
  END IF;
END $$;

COMMIT;

