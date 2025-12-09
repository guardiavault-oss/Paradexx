-- Migration: Admin RBAC and Audit System
-- This migration adds admin role-based access control and audit logging
-- Generated: 2025-11-07

BEGIN;

-- Extend users table with admin RBAC fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create indexes for admin fields
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for admin_audit_log
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON admin_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);

COMMIT;
