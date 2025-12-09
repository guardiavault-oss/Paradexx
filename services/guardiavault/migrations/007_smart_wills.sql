-- Smart Will Builder Tables
-- Handles on-chain will creation, guardians, beneficiaries, and trigger conditions

-- Wills table
CREATE TABLE IF NOT EXISTS wills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contract_address TEXT, -- Smart contract address after deployment
    contract_will_id INTEGER, -- Will ID from SmartWill contract
    pdf_s3_key TEXT, -- S3 key for generated PDF document
    metadata_hash TEXT, -- IPFS hash or document hash
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'triggered', 'executed', 'cancelled')),
    deployment_tx_hash TEXT, -- Transaction hash from on-chain deployment
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    finalized_at TIMESTAMP, -- When will was finalized and locked
    triggered_at TIMESTAMP, -- When death trigger was activated
    executed_at TIMESTAMP -- When will was executed on-chain
);

-- Beneficiaries table
CREATE TABLE IF NOT EXISTS will_beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    will_id UUID NOT NULL REFERENCES wills(id) ON DELETE CASCADE,
    address TEXT NOT NULL CHECK (address ~ '^0x[a-fA-F0-9]{40}$'),
    name TEXT, -- Optional human-readable name
    email TEXT, -- Optional contact email
    phone TEXT, -- Optional contact phone
    percent INTEGER NOT NULL CHECK (percent > 0 AND percent <= 100), -- Allocation percentage (1-100)
    token_address TEXT, -- Optional: specific token address for allocation
    is_nft_only BOOLEAN DEFAULT FALSE, -- If true, only NFTs allocated to this beneficiary
    is_charity_dao BOOLEAN DEFAULT FALSE, -- If true, marked as charity/DAO recipient
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(will_id, address) -- One allocation per address per will
);

-- Will guardians table (separate from vault guardians)
CREATE TABLE IF NOT EXISTS will_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    will_id UUID NOT NULL REFERENCES wills(id) ON DELETE CASCADE,
    guardian_type VARCHAR(20) NOT NULL CHECK (guardian_type IN ('email', 'wallet')),
    identifier TEXT NOT NULL, -- Email address or wallet address
    wallet_address TEXT CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$' OR wallet_address IS NULL),
    verified BOOLEAN DEFAULT FALSE, -- Whether guardian has verified their identity
    verification_token TEXT, -- OTP token or signature verification
    verification_expires_at TIMESTAMP, -- Token expiration
    verified_at TIMESTAMP, -- When verification completed
    public_key TEXT, -- Guardian public key for wallet-based guardians
    created_at TIMESTAMP DEFAULT NOW()
);

-- Will trigger conditions table
CREATE TABLE IF NOT EXISTS will_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    will_id UUID NOT NULL REFERENCES wills(id) ON DELETE CASCADE,
    trigger_type VARCHAR(30) NOT NULL CHECK (trigger_type IN ('time_lock', 'death_oracle', 'multisig_recovery', 'manual')),
    -- Time-lock (deadman switch) settings
    check_in_interval_days INTEGER, -- Days between required check-ins
    grace_period_days INTEGER, -- Grace period after missed check-in
    last_check_in_at TIMESTAMP,
    next_check_in_due TIMESTAMP,
    -- Death oracle settings
    death_oracle_address TEXT, -- Chainlink oracle or death verification service address
    required_confidence_score DECIMAL(3,2), -- Minimum confidence score (0.00-1.00)
    -- Multi-sig recovery settings
    recovery_contract_address TEXT, -- MultiSigRecovery contract address
    recovery_keys JSONB, -- Array of recovery key addresses
    threshold INTEGER, -- M-of-N threshold
    -- Manual trigger settings
    executor_address TEXT, -- Address authorized to trigger manually
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Will asset allowances table (on-chain token allowances to track)
CREATE TABLE IF NOT EXISTS will_asset_allowances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    will_id UUID NOT NULL REFERENCES wills(id) ON DELETE CASCADE,
    token_address TEXT NOT NULL CHECK (token_address ~ '^0x[a-fA-F0-9]{40}$'),
    token_symbol TEXT, -- e.g., USDC, DAI
    token_name TEXT,
    spender_address TEXT NOT NULL, -- Contract or address allowed to spend
    allowance_amount TEXT, -- BigNumber string (unlimited if NULL)
    network VARCHAR(20) DEFAULT 'ethereum', -- ethereum, polygon, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Will wizard state table (encrypted intermediate state)
CREATE TABLE IF NOT EXISTS will_wizard_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    will_id UUID REFERENCES wills(id) ON DELETE CASCADE, -- NULL until finalized
    encrypted_state TEXT NOT NULL, -- Encrypted JSON of wizard state
    current_step INTEGER DEFAULT 1, -- Current wizard step (1-6)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP, -- Auto-cleanup after 30 days
    UNIQUE(user_id) -- One draft will per user
);

-- Will execution events (on-chain execution tracking)
CREATE TABLE IF NOT EXISTS will_execution_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    will_id UUID NOT NULL REFERENCES wills(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL, -- 'guardian_approved', 'triggered', 'executed', 'distribution'
    transaction_hash TEXT, -- Blockchain transaction hash
    block_number BIGINT, -- Block number of event
    event_data JSONB, -- Additional event data
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wills_user_id ON wills(user_id);
CREATE INDEX IF NOT EXISTS idx_wills_status ON wills(status);
CREATE INDEX IF NOT EXISTS idx_wills_contract_address ON wills(contract_address);
CREATE INDEX IF NOT EXISTS idx_will_beneficiaries_will_id ON will_beneficiaries(will_id);
CREATE INDEX IF NOT EXISTS idx_will_guardians_will_id ON will_guardians(will_id);
CREATE INDEX IF NOT EXISTS idx_will_guardians_identifier ON will_guardians(identifier);
CREATE INDEX IF NOT EXISTS idx_will_triggers_will_id ON will_triggers(will_id);
CREATE INDEX IF NOT EXISTS idx_will_wizard_state_user_id ON will_wizard_state(user_id);
CREATE INDEX IF NOT EXISTS idx_will_execution_events_will_id ON will_execution_events(will_id);

-- Add column to users table for will count
ALTER TABLE users ADD COLUMN IF NOT EXISTS wills_count INTEGER DEFAULT 0;

-- Trigger to update wills_count
CREATE OR REPLACE FUNCTION update_user_wills_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET wills_count = wills_count + 1 WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET wills_count = GREATEST(wills_count - 1, 0) WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_wills_count
    AFTER INSERT OR DELETE ON wills
    FOR EACH ROW
    EXECUTE FUNCTION update_user_wills_count();

-- Comments for documentation
COMMENT ON TABLE wills IS 'On-chain will configurations with smart contract integration';
COMMENT ON TABLE will_beneficiaries IS 'Beneficiary allocations with percentages and asset restrictions';
COMMENT ON TABLE will_guardians IS 'Guardian verification for will execution (email or wallet-based)';
COMMENT ON TABLE will_triggers IS 'Trigger conditions for will execution (time-lock, oracle, multisig)';
COMMENT ON TABLE will_asset_allowances IS 'On-chain token allowances to track for will execution';
COMMENT ON TABLE will_wizard_state IS 'Encrypted intermediate state during will creation wizard';
COMMENT ON TABLE will_execution_events IS 'On-chain execution events and transaction tracking';

