-- Migration: Add indexes for query optimization (N+1 query fixes)
-- This migration adds indexes to improve join performance for vaults, parties, and claim attestations

-- Index for vaults.owner_id (used in getVaultsByOwner and joins)
CREATE INDEX IF NOT EXISTS idx_vaults_owner_id ON vaults(owner_id);

-- Index for parties.vault_id (used in getPartiesByVault and joins)
CREATE INDEX IF NOT EXISTS idx_parties_vault_id ON parties(vault_id);

-- Composite index for parties.vault_id + role (used in getPartiesByRole and guardian filtering)
CREATE INDEX IF NOT EXISTS idx_parties_vault_id_role ON parties(vault_id, role);

-- Index for claim_attestations.claim_id (used in batch attestation queries)
-- Only create if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claim_attestations') THEN
        CREATE INDEX IF NOT EXISTS idx_claim_attestations_claim_id ON claim_attestations(claim_id);
        CREATE INDEX IF NOT EXISTS idx_claim_attestations_party_id ON claim_attestations(party_id);
    END IF;
END $$;

-- Index for vault_trigger_claims.vault_id (used in listVaultTriggerClaimsByVault)
-- Only create if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vault_trigger_claims') THEN
        CREATE INDEX IF NOT EXISTS idx_vault_trigger_claims_vault_id ON vault_trigger_claims(vault_id);
        CREATE INDEX IF NOT EXISTS idx_vault_trigger_claims_status ON vault_trigger_claims(status);
        CREATE INDEX IF NOT EXISTS idx_vault_trigger_claims_vault_status ON vault_trigger_claims(vault_id, status);
    END IF;
END $$;

-- Index for check_ins.vault_id (used in getCheckInsByVault)
CREATE INDEX IF NOT EXISTS idx_check_ins_vault_id ON check_ins(vault_id);

-- Index for fragments.vault_id (used in getFragmentsByVault)
CREATE INDEX IF NOT EXISTS idx_fragments_vault_id ON fragments(vault_id);

-- Index for fragments.party_id (used in getFragmentByGuardian/getFragmentsByParty)
CREATE INDEX IF NOT EXISTS idx_fragments_party_id ON fragments(party_id);

-- Index for notifications.vault_id (used when fetching vault notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_vault_id ON notifications(vault_id);

COMMENT ON INDEX idx_vaults_owner_id IS 'Optimizes queries for fetching vaults by owner';
COMMENT ON INDEX idx_parties_vault_id IS 'Optimizes joins between vaults and parties';
COMMENT ON INDEX idx_parties_vault_id_role IS 'Optimizes queries for parties by vault and role';
-- Comment on index (only if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_claim_attestations_claim_id') THEN
        COMMENT ON INDEX idx_claim_attestations_claim_id IS 'Optimizes batch queries for claim attestations';
    END IF;
END $$;
-- Comment on index (only if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vault_trigger_claims_vault_status') THEN
        COMMENT ON INDEX idx_vault_trigger_claims_vault_status IS 'Optimizes queries for pending claims by vault';
    END IF;
END $$;

