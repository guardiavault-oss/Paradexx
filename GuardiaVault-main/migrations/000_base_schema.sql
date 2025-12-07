-- Base Schema Migration
-- Creates all core tables for GuardiaVault
-- Run this first before other migrations

BEGIN;

-- ========================
-- Create enums (if not exists)
-- ========================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vault_status') THEN
        CREATE TYPE vault_status AS ENUM ('active', 'warning', 'critical', 'triggered', 'cancelled');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'party_role') THEN
        CREATE TYPE party_role AS ENUM ('guardian', 'beneficiary', 'attestor');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'party_status') THEN
        CREATE TYPE party_status AS ENUM ('pending', 'active', 'declined', 'inactive');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================
-- Users table
-- ========================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    wallet_address TEXT UNIQUE,
    wallet_connected_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP,
    
    -- Death Verification Fields
    ssn_hash TEXT,
    full_name TEXT,
    date_of_birth TIMESTAMP,
    last_known_location TEXT,
    death_monitoring_enabled BOOLEAN DEFAULT false,
    verification_tier INTEGER DEFAULT 1,
    last_ssdi_check TIMESTAMP,
    ssdi_consent_given BOOLEAN DEFAULT false,
    ssdi_consent_date TIMESTAMP,
    ssdi_consent_ip_address TEXT,
    death_verified_at TIMESTAMP,
    death_confidence_score VARCHAR(5),
    status VARCHAR(20) DEFAULT 'active'
);

-- ========================
-- Vaults table
-- ========================

CREATE TABLE IF NOT EXISTS vaults (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    check_in_interval_days INTEGER NOT NULL DEFAULT 90,
    grace_period_days INTEGER NOT NULL DEFAULT 14,
    status vault_status NOT NULL DEFAULT 'active',
    last_check_in_at TIMESTAMP NOT NULL DEFAULT NOW(),
    next_check_in_due TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================
-- Parties table
-- ========================

CREATE TABLE IF NOT EXISTS parties (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id VARCHAR NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    role party_role NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    invite_token TEXT,
    invite_expires_at TIMESTAMP,
    status party_status NOT NULL DEFAULT 'pending',
    invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(vault_id, email)
);

-- ========================
-- Fragments table
-- ========================

CREATE TABLE IF NOT EXISTS fragments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id VARCHAR NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    party_id VARCHAR NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    fragment_index INTEGER NOT NULL,
    encrypted_fragment TEXT NOT NULL,
    passphrase_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(vault_id, fragment_index)
);

-- ========================
-- Check-ins table
-- ========================

CREATE TABLE IF NOT EXISTS check_ins (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id VARCHAR NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    verified BOOLEAN DEFAULT true
);

-- ========================
-- Subscriptions table
-- ========================

CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMIT;
