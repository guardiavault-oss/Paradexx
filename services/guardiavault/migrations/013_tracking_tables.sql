-- Migration 013: Tracking Tables
-- Adds optimization history, party history, protocol cache, death certificates, and system config tables
-- Created: 2025-11-07

-- ============================================
-- Optimization History Table
-- ============================================
CREATE TABLE IF NOT EXISTS optimization_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vault_id VARCHAR REFERENCES vaults(id) ON DELETE SET NULL,
  old_allocation TEXT NOT NULL, -- JSONB stored as TEXT
  new_allocation TEXT NOT NULL, -- JSONB stored as TEXT
  reason TEXT,
  estimated_apy_gain VARCHAR(10), -- Numeric as string (e.g., "2.50")
  status VARCHAR(20) DEFAULT 'pending', -- pending, applied, rejected
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  applied_at TIMESTAMP
);

-- Indexes for optimization_history
CREATE INDEX IF NOT EXISTS idx_opt_history_user ON optimization_history(user_id);
CREATE INDEX IF NOT EXISTS idx_opt_history_vault ON optimization_history(vault_id);
CREATE INDEX IF NOT EXISTS idx_opt_history_status ON optimization_history(status);
CREATE INDEX IF NOT EXISTS idx_opt_history_created ON optimization_history(created_at DESC);

-- ============================================
-- Party History Table
-- ============================================
CREATE TABLE IF NOT EXISTS party_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- vault_created, guardian_added, recovery_initiated, etc.
  event_data TEXT NOT NULL, -- JSONB stored as TEXT
  metadata TEXT, -- JSONB stored as TEXT (optional)
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for party_history
CREATE INDEX IF NOT EXISTS idx_party_history_user ON party_history(user_id);
CREATE INDEX IF NOT EXISTS idx_party_history_event ON party_history(event_type);
CREATE INDEX IF NOT EXISTS idx_party_history_timestamp ON party_history(timestamp DESC);

-- ============================================
-- Protocol Cache Table
-- ============================================
CREATE TABLE IF NOT EXISTS protocol_cache (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  protocol VARCHAR(50) NOT NULL, -- aave, compound, yearn, curve
  data_type VARCHAR(50) NOT NULL, -- apy, tvl, health
  asset VARCHAR(20), -- ETH, USDC, etc.
  data TEXT NOT NULL, -- JSONB stored as TEXT
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for protocol_cache
CREATE INDEX IF NOT EXISTS idx_protocol_cache_lookup ON protocol_cache(protocol, data_type, asset);
CREATE INDEX IF NOT EXISTS idx_protocol_cache_expires ON protocol_cache(expires_at);

-- ============================================
-- Death Certificates Table
-- ============================================
CREATE TABLE IF NOT EXISTS death_certificates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ipfs_hash TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMP,
  verification_status VARCHAR(20) DEFAULT 'pending' -- pending, verified, rejected
);

-- Indexes for death_certificates
CREATE INDEX IF NOT EXISTS idx_death_cert_user ON death_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_death_cert_status ON death_certificates(verification_status);
CREATE INDEX IF NOT EXISTS idx_death_cert_uploaded ON death_certificates(uploaded_at DESC);

-- ============================================
-- System Configuration Table
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by VARCHAR REFERENCES users(id) ON DELETE SET NULL
);

-- Index for system_config
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- ============================================
-- Comments for Documentation
-- ============================================
COMMENT ON TABLE optimization_history IS 'Tracks yield optimization recommendations and applications';
COMMENT ON TABLE party_history IS 'Tracks all events and changes related to guardians, beneficiaries, and parties';
COMMENT ON TABLE protocol_cache IS 'Caches DeFi protocol data to reduce API calls';
COMMENT ON TABLE death_certificates IS 'Stores death certificate documents with IPFS hashes';
COMMENT ON TABLE system_config IS 'Stores system-wide configuration settings';

-- ============================================
-- Seed Initial System Configuration
-- ============================================
INSERT INTO system_config (key, value, description)
VALUES
  ('protocol_cache_duration_ms', '300000', '5 minutes cache duration for protocol data'),
  ('max_optimization_history_days', '90', 'Maximum number of days to retain optimization history'),
  ('max_party_history_days', '365', 'Maximum number of days to retain party history')
ON CONFLICT (key) DO NOTHING;
