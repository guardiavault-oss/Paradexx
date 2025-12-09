-- Migration: Landing Page Features
-- Adds tables for AI Risk Monitor, Behavioral Biometrics, Legacy Messages, and Smart Contract Integration

-- ============ Legacy Messages Tables ============

CREATE TYPE legacy_message_type AS ENUM ('video', 'letter');
CREATE TYPE legacy_message_status AS ENUM ('draft', 'ready', 'delivered');

CREATE TABLE IF NOT EXISTS legacy_messages (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id VARCHAR NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    beneficiary_id VARCHAR REFERENCES parties(id) ON DELETE SET NULL,
    type legacy_message_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    file_url TEXT,
    file_hash TEXT,
    encrypted BOOLEAN NOT NULL DEFAULT true,
    status legacy_message_status NOT NULL DEFAULT 'draft',
    scheduled_delivery_date TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legacy_messages_vault_id ON legacy_messages(vault_id);
CREATE INDEX IF NOT EXISTS idx_legacy_messages_beneficiary_id ON legacy_messages(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_legacy_messages_status ON legacy_messages(status);

-- ============ Security Monitoring Tables ============

CREATE TYPE security_event_type AS ENUM (
    'suspicious_login',
    'unusual_activity',
    'failed_authentication',
    'biometric_mismatch',
    'ip_address_change',
    'device_change',
    'location_change'
);

CREATE TYPE security_event_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE IF NOT EXISTS ai_risk_events (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vault_id VARCHAR REFERENCES vaults(id) ON DELETE SET NULL,
    event_type security_event_type NOT NULL,
    severity security_event_severity NOT NULL,
    description TEXT NOT NULL,
    metadata TEXT,
    ip_address TEXT,
    user_agent TEXT,
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_risk_events_user_id ON ai_risk_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_risk_events_vault_id ON ai_risk_events(vault_id);
CREATE INDEX IF NOT EXISTS idx_ai_risk_events_resolved ON ai_risk_events(resolved);
CREATE INDEX IF NOT EXISTS idx_ai_risk_events_severity ON ai_risk_events(severity);
CREATE INDEX IF NOT EXISTS idx_ai_risk_events_created_at ON ai_risk_events(created_at);

-- ============ Behavioral Biometrics Tables ============

CREATE TYPE biometric_data_type AS ENUM (
    'typing_pattern',
    'mouse_movement',
    'interaction_signature',
    'device_fingerprint'
);

CREATE TABLE IF NOT EXISTS behavioral_biometrics (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_type biometric_data_type NOT NULL,
    signature TEXT NOT NULL,
    confidence VARCHAR(5),
    metadata TEXT,
    device_id TEXT,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_biometrics_user_id ON behavioral_biometrics(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_biometrics_data_type ON behavioral_biometrics(data_type);
CREATE INDEX IF NOT EXISTS idx_behavioral_biometrics_device_id ON behavioral_biometrics(device_id);

-- ============ Smart Contract Integration Tables ============

CREATE TYPE contract_deployment_status AS ENUM ('pending', 'deployed', 'failed', 'rejected');

CREATE TABLE IF NOT EXISTS vault_smart_contracts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id VARCHAR NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    contract_address TEXT UNIQUE,
    network TEXT NOT NULL DEFAULT 'ethereum',
    deployment_tx_hash TEXT,
    deployment_status contract_deployment_status NOT NULL DEFAULT 'pending',
    deployed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_smart_contracts_vault_id ON vault_smart_contracts(vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_smart_contracts_contract_address ON vault_smart_contracts(contract_address);
CREATE INDEX IF NOT EXISTS idx_vault_smart_contracts_deployment_status ON vault_smart_contracts(deployment_status);

-- Add comments for documentation
COMMENT ON TABLE legacy_messages IS 'Stores video messages and letters for delivery to beneficiaries';
COMMENT ON TABLE ai_risk_events IS 'Tracks security risk events detected by AI Risk Monitor';
COMMENT ON TABLE behavioral_biometrics IS 'Stores behavioral biometric signatures for user verification';
COMMENT ON TABLE vault_smart_contracts IS 'Tracks smart contract deployments and interactions for vaults';

