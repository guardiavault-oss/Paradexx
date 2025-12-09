-- Security Constraints Migration
-- Adds database-level constraints and indexes for security and performance

BEGIN;

-- Add indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_vaults_owner_id ON vaults(owner_id);
CREATE INDEX IF NOT EXISTS idx_vaults_status ON vaults(status);
CREATE INDEX IF NOT EXISTS idx_parties_vault_id ON parties(vault_id);
CREATE INDEX IF NOT EXISTS idx_parties_email ON parties(email);
CREATE INDEX IF NOT EXISTS idx_parties_role ON parties(role);
CREATE INDEX IF NOT EXISTS idx_parties_status ON parties(status);
CREATE INDEX IF NOT EXISTS idx_fragments_vault_id ON fragments(vault_id);
CREATE INDEX IF NOT EXISTS idx_fragments_party_id ON fragments(party_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_vault_id ON check_ins(vault_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_checked_in_at ON check_ins(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Add unique constraint to prevent duplicate guardian emails per vault
-- (Guardians can be beneficiaries in other vaults, but not duplicate guardians in same vault)
CREATE UNIQUE INDEX IF NOT EXISTS idx_parties_vault_role_email_unique 
  ON parties(vault_id, role, LOWER(email))
  WHERE role = 'guardian';

-- Add check constraint to ensure minimum guardians (enforced at application level, but adding for safety)
-- Note: This is complex to enforce at DB level due to status filtering, so application validation is primary

-- Add constraint to ensure vault status transitions are valid
-- Only allow: active -> warning -> critical -> triggered
-- Or: any -> cancelled (if owner cancels)
ALTER TABLE vaults DROP CONSTRAINT IF EXISTS check_vault_status_transition;
-- This would be complex, so we handle in application logic

-- Add constraint to ensure fragments match vault scheme
-- This is handled in application logic, but we can add a comment for documentation
COMMENT ON TABLE fragments IS 'Fragments must match vault fragment_scheme: 2-of-3 needs 3 fragments, 3-of-5 needs 5 fragments';

-- Add constraint to prevent orphaned fragments
-- Already handled by CASCADE DELETE, but ensure foreign key exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fragments_party_id_fkey' 
    AND conrelid = 'fragments'::regclass
  ) THEN
    ALTER TABLE fragments 
    ADD CONSTRAINT fragments_party_id_fkey 
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add timestamp indexes for time-based queries
CREATE INDEX IF NOT EXISTS idx_vaults_next_check_in_due ON vaults(next_check_in_due);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_death_verified_at ON users(death_verified_at);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_parties_vault_role_status ON parties(vault_id, role, status);
CREATE INDEX IF NOT EXISTS idx_vaults_owner_status ON vaults(owner_id, status);

COMMIT;

