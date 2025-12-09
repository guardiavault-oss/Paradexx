-- Migration: Multi-Sig Recovery System
-- Adds tables for wallet recovery with 2-of-3 recovery keys

-- ============ Recovery Status Enum ============
CREATE TYPE recovery_status AS ENUM ('active', 'triggered', 'completed', 'cancelled');

-- ============ Recoveries Table ============
CREATE TABLE IF NOT EXISTS recoveries (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contract_recovery_id INTEGER, -- Recovery ID from MultiSigRecovery contract
    wallet_address TEXT NOT NULL,
    encrypted_data TEXT NOT NULL, -- Encrypted seed phrase
    status recovery_status NOT NULL DEFAULT 'active',
    triggered_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recoveries_user_id ON recoveries(user_id);
CREATE INDEX IF NOT EXISTS idx_recoveries_contract_recovery_id ON recoveries(contract_recovery_id);
CREATE INDEX IF NOT EXISTS idx_recoveries_status ON recoveries(status);
CREATE INDEX IF NOT EXISTS idx_recoveries_wallet_address ON recoveries(wallet_address);

-- ============ Recovery Keys Table ============
CREATE TABLE IF NOT EXISTS recovery_keys (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    recovery_id VARCHAR NOT NULL REFERENCES recoveries(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    wallet_address TEXT, -- Wallet address for recovery key (generated if needed)
    invite_token TEXT NOT NULL UNIQUE,
    invite_expires_at TIMESTAMP NOT NULL,
    has_attested BOOLEAN DEFAULT false,
    attested_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recovery_keys_recovery_id ON recovery_keys(recovery_id);
CREATE INDEX IF NOT EXISTS idx_recovery_keys_invite_token ON recovery_keys(invite_token);
CREATE INDEX IF NOT EXISTS idx_recovery_keys_wallet_address ON recovery_keys(wallet_address);
CREATE INDEX IF NOT EXISTS idx_recovery_keys_email ON recovery_keys(email);

