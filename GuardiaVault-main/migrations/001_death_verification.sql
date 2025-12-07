-- Migration: Death Verification System
-- This migration adds death verification tables and extends users table
-- Generated: 2025-01-02

BEGIN;

-- Create enums for death verification
DO $$ BEGIN
  CREATE TYPE death_verification_status AS ENUM ('pending', 'confirmed', 'rejected', 'disputed', 'needs_confirmation');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE death_verification_source AS ENUM ('ssdi', 'obituary', 'death_certificate', 'death_certificate_official', 'insurance_claim', 'hospital_ehr', 'funeral_home');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extend users table with death verification fields
-- Note: Multiple ALTER TABLE statements for compatibility with some PostgreSQL versions
ALTER TABLE users ADD COLUMN IF NOT EXISTS ssn_hash VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_known_location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS death_monitoring_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_tier INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ssdi_check TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ssdi_consent_given BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ssdi_consent_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ssdi_consent_ip_address INET;
ALTER TABLE users ADD COLUMN IF NOT EXISTS death_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS death_confidence_score DECIMAL(3,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Create death verification events table
CREATE TABLE IF NOT EXISTS death_verification_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source death_verification_source NOT NULL,
  confidence_score DECIMAL(3,2),
  verification_data JSONB,
  verified_at TIMESTAMP NOT NULL DEFAULT NOW(),
  verified_by VARCHAR(100),
  reported_death_date TIMESTAMP,
  reported_location VARCHAR(255),
  death_certificate_url TEXT,
  status death_verification_status NOT NULL DEFAULT 'pending',
  requires_review BOOLEAN DEFAULT false,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for death verification events
CREATE INDEX IF NOT EXISTS idx_death_verification_user_status ON death_verification_events(user_id, status);
CREATE INDEX IF NOT EXISTS idx_death_verification_date ON death_verification_events(verified_at);
CREATE INDEX IF NOT EXISTS idx_death_verification_source ON death_verification_events(source);

-- Create SSDI check log table
CREATE TABLE IF NOT EXISTS ssdi_check_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_date TIMESTAMP NOT NULL DEFAULT NOW(),
  ssdi_provider VARCHAR(50),
  match_found BOOLEAN,
  match_data JSONB,
  api_response_time_ms INTEGER,
  CONSTRAINT fk_user_ssdi FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for SSDI check log
CREATE INDEX IF NOT EXISTS idx_ssdi_check_user_date ON ssdi_check_log(user_id, check_date);

-- Create death certificate orders table
CREATE TABLE IF NOT EXISTS death_certificate_orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id VARCHAR(100) NOT NULL UNIQUE,
  vendor VARCHAR(50),
  state VARCHAR(2),
  status VARCHAR(20) DEFAULT 'pending',
  estimated_delivery TIMESTAMP,
  delivered_at TIMESTAMP,
  certificate_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user_cert FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for death certificate orders
CREATE INDEX IF NOT EXISTS idx_cert_order_user ON death_certificate_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_cert_order_status ON death_certificate_orders(status);

-- Create consent log table
CREATE TABLE IF NOT EXISTS consent_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user_consent FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for consent log
CREATE INDEX IF NOT EXISTS idx_consent_user ON consent_log(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_type ON consent_log(consent_type);

-- Create proof of life challenges table
CREATE TABLE IF NOT EXISTS proof_of_life_challenges (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_code VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user_challenge FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for proof of life challenges
CREATE INDEX IF NOT EXISTS idx_challenge_user ON proof_of_life_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_code ON proof_of_life_challenges(challenge_code);
CREATE INDEX IF NOT EXISTS idx_challenge_expires ON proof_of_life_challenges(expires_at);

COMMIT;

