-- Migration 006: Multi-Sig Recovery System Database Schema
-- Adds tables for wallet recovery with 2-of-3 recovery keys

-- Recovery setups table
CREATE TABLE IF NOT EXISTS recovery_setups (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    recovery_keys JSONB NOT NULL, -- Array of 3 recovery key addresses
    recovery_key_emails JSONB NOT NULL, -- Array of 3 email addresses
    encrypted_seed_phrase TEXT NOT NULL, -- Encrypted seed phrase data
    recovery_fee_percentage INTEGER DEFAULT 15 CHECK (recovery_fee_percentage BETWEEN 10 AND 20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'completed', 'cancelled')),
    contract_recovery_id INTEGER, -- ID from smart contract
    created_at TIMESTAMP DEFAULT NOW(),
    triggered_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    UNIQUE(wallet_address, status) -- Only one active recovery per wallet
);

-- Recovery attestations table
CREATE TABLE IF NOT EXISTS recovery_attestations (
    id SERIAL PRIMARY KEY,
    recovery_id INTEGER REFERENCES recovery_setups(id) ON DELETE CASCADE,
    recovery_key VARCHAR(42) NOT NULL, -- Address of recovery key that attested
    signature TEXT NOT NULL, -- ECDSA signature proof
    attested_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(recovery_id, recovery_key) -- One attestation per key per recovery
);

-- Recovery fees table (for tracking payments)
CREATE TABLE IF NOT EXISTS recovery_fees (
    id SERIAL PRIMARY KEY,
    recovery_id INTEGER REFERENCES recovery_setups(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    recovered_balance DECIMAL(36, 18), -- Balance at time of recovery
    fee_percentage INTEGER NOT NULL,
    fee_amount DECIMAL(36, 18), -- Actual fee collected
    fee_token_address VARCHAR(42), -- Token address (NULL for native)
    fee_token_symbol VARCHAR(10), -- Token symbol
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    payment_tx_hash VARCHAR(66), -- Transaction hash of fee payment
    created_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP
);

-- Recovery key invitations table (for tracking email invitations)
CREATE TABLE IF NOT EXISTS recovery_key_invitations (
    id SERIAL PRIMARY KEY,
    recovery_id INTEGER REFERENCES recovery_setups(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    recovery_key_address VARCHAR(42) NOT NULL,
    invitation_token VARCHAR(64) NOT NULL UNIQUE, -- Secure token for portal access
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'accepted', 'expired')),
    sent_at TIMESTAMP DEFAULT NOW(),
    viewed_at TIMESTAMP,
    accepted_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recovery_setups_wallet_address ON recovery_setups(wallet_address);
CREATE INDEX IF NOT EXISTS idx_recovery_setups_user_id ON recovery_setups(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_setups_status ON recovery_setups(status);
CREATE INDEX IF NOT EXISTS idx_recovery_attestations_recovery_id ON recovery_attestations(recovery_id);
CREATE INDEX IF NOT EXISTS idx_recovery_fees_recovery_id ON recovery_fees(recovery_id);
CREATE INDEX IF NOT EXISTS idx_recovery_key_invitations_token ON recovery_key_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_recovery_key_invitations_recovery_id ON recovery_key_invitations(recovery_id);

-- Add recovery-related columns to users table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'recovery_setups_count') THEN
        ALTER TABLE users ADD COLUMN recovery_setups_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'recovery_fees_earned') THEN
        ALTER TABLE users ADD COLUMN recovery_fees_earned DECIMAL(36, 18) DEFAULT 0;
    END IF;
END $$;

-- Function to update recovery setup count
CREATE OR REPLACE FUNCTION update_user_recovery_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET recovery_setups_count = recovery_setups_count + 1 WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET recovery_setups_count = recovery_setups_count - 1 WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update recovery count
DROP TRIGGER IF EXISTS trigger_update_recovery_count ON recovery_setups;
CREATE TRIGGER trigger_update_recovery_count
    AFTER INSERT OR DELETE ON recovery_setups
    FOR EACH ROW EXECUTE FUNCTION update_user_recovery_count();

-- Grant permissions (only if app_user role exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON recovery_setups TO app_user;
        GRANT SELECT, INSERT, UPDATE, DELETE ON recovery_attestations TO app_user;
        GRANT SELECT, INSERT, UPDATE, DELETE ON recovery_fees TO app_user;
        GRANT SELECT, INSERT, UPDATE, DELETE ON recovery_key_invitations TO app_user;
        GRANT USAGE, SELECT ON SEQUENCE recovery_setups_id_seq TO app_user;
        GRANT USAGE, SELECT ON SEQUENCE recovery_attestations_id_seq TO app_user;
        GRANT USAGE, SELECT ON SEQUENCE recovery_fees_id_seq TO app_user;
        GRANT USAGE, SELECT ON SEQUENCE recovery_key_invitations_id_seq TO app_user;
    END IF;
END $$;

