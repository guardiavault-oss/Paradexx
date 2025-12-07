-- Guardian Referral Discounts Migration
-- Tracks guardian referrals for premium plan discounts

BEGIN;

-- Create guardian referral discounts table
CREATE TABLE IF NOT EXISTS guardian_referral_discounts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id VARCHAR NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  vault_id VARCHAR NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  guardian_email TEXT NOT NULL,
  discount_code VARCHAR(50) UNIQUE NOT NULL DEFAULT (UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 12))),
  discount_percentage INTEGER NOT NULL DEFAULT 50, -- 50% off
  used BOOLEAN DEFAULT false,
  used_by_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  used_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_guardian_referral_guardian_email ON guardian_referral_discounts(guardian_email);
CREATE INDEX IF NOT EXISTS idx_guardian_referral_discount_code ON guardian_referral_discounts(discount_code);
CREATE INDEX IF NOT EXISTS idx_guardian_referral_vault ON guardian_referral_discounts(vault_id);

COMMIT;

