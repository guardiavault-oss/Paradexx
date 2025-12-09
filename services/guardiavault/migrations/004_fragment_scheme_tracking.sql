-- Migration: Fragment Scheme Tracking
-- Adds fragment_scheme column to vaults table for tracking 2-of-3 vs 3-of-5 schemes
-- Supports backward compatibility with legacy 3-of-5 vaults

BEGIN;

-- Add fragment_scheme column to vaults table
ALTER TABLE vaults 
ADD COLUMN IF NOT EXISTS fragment_scheme VARCHAR(10) DEFAULT '2-of-3'
  CHECK (fragment_scheme IN ('2-of-3', '3-of-5'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_vaults_fragment_scheme ON vaults(fragment_scheme);

-- Migrate existing vaults: detect scheme from fragment count
-- Vaults with 5 fragments are legacy 3-of-5, others default to 2-of-3
UPDATE vaults 
SET fragment_scheme = '3-of-5'
WHERE id IN (
  SELECT DISTINCT v.id
  FROM vaults v
  INNER JOIN fragments f ON f.vault_id = v.id
  GROUP BY v.id
  HAVING COUNT(DISTINCT f.fragment_index) = 5
);

-- Set all remaining vaults to 2-of-3 (default for new vaults)
UPDATE vaults 
SET fragment_scheme = '2-of-3'
WHERE fragment_scheme IS NULL OR fragment_scheme = '';

-- Add comment to column
COMMENT ON COLUMN vaults.fragment_scheme IS 'Shamir Secret Sharing scheme: 2-of-3 (new) or 3-of-5 (legacy)';

COMMIT;

