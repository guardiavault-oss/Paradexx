/**
 * Add Performance Indexes Script
 * Creates database indexes to optimize query performance
 * Run this before production deployment
 */

import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import { logInfo, logError } from '../services/logger.js';

interface IndexInfo {
  name: string;
  table: string;
  columns: string[];
  description: string;
}

const indexes: IndexInfo[] = [
  // Users table indexes
  {
    name: 'idx_users_email',
    table: 'users',
    columns: ['email'],
    description: 'Fast email lookup for login',
  },
  {
    name: 'idx_users_wallet',
    table: 'users',
    columns: ['wallet_address'],
    description: 'Fast wallet address lookup for Web3 auth',
  },
  {
    name: 'idx_users_created',
    table: 'users',
    columns: ['created_at DESC'],
    description: 'Fast ordering by registration date',
  },
  {
    name: 'idx_users_tier',
    table: 'users',
    columns: ['tier'],
    description: 'Filter users by subscription tier',
  },

  // Vaults table indexes
  {
    name: 'idx_vaults_owner_id',
    table: 'vaults',
    columns: ['owner_id'],
    description: 'Fast lookup of vaults by owner',
  },
  {
    name: 'idx_vaults_status',
    table: 'vaults',
    columns: ['status'],
    description: 'Filter vaults by status',
  },
  {
    name: 'idx_vaults_created',
    table: 'vaults',
    columns: ['created_at DESC'],
    description: 'Fast ordering by creation date',
  },
  {
    name: 'idx_vaults_owner_status',
    table: 'vaults',
    columns: ['owner_id', 'status'],
    description: 'Composite index for user vault queries',
  },

  // Parties (Guardians & Beneficiaries) table indexes
  {
    name: 'idx_parties_vault_id',
    table: 'parties',
    columns: ['vault_id'],
    description: 'Fast lookup of parties by vault',
  },
  {
    name: 'idx_parties_role',
    table: 'parties',
    columns: ['role'],
    description: 'Filter parties by role (guardian/beneficiary)',
  },
  {
    name: 'idx_parties_status',
    table: 'parties',
    columns: ['status'],
    description: 'Filter parties by status',
  },
  {
    name: 'idx_parties_email',
    table: 'parties',
    columns: ['email'],
    description: 'Fast email lookup for invites',
  },
  {
    name: 'idx_parties_vault_role',
    table: 'parties',
    columns: ['vault_id', 'role'],
    description: 'Composite index for vault party queries',
  },
  {
    name: 'idx_parties_vault_status',
    table: 'parties',
    columns: ['vault_id', 'status'],
    description: 'Composite index for active party queries',
  },

  // Claims (Recovery) table indexes
  {
    name: 'idx_claims_vault_id',
    table: 'claims',
    columns: ['vault_id'],
    description: 'Fast lookup of claims by vault',
  },
  {
    name: 'idx_claims_status',
    table: 'claims',
    columns: ['status'],
    description: 'Filter claims by status',
  },
  {
    name: 'idx_claims_created',
    table: 'claims',
    columns: ['created_at DESC'],
    description: 'Fast ordering by claim date',
  },
  {
    name: 'idx_claims_vault_status',
    table: 'claims',
    columns: ['vault_id', 'status'],
    description: 'Composite index for vault claim queries',
  },
  {
    name: 'idx_claims_initiator_id',
    table: 'claims',
    columns: ['initiator_id'],
    description: 'Fast lookup of claims by initiator',
  },

  // Attestations table indexes
  {
    name: 'idx_attestations_claim_id',
    table: 'attestations',
    columns: ['claim_id'],
    description: 'Fast lookup of attestations by claim',
  },
  {
    name: 'idx_attestations_party_id',
    table: 'attestations',
    columns: ['party_id'],
    description: 'Fast lookup of attestations by guardian',
  },
  {
    name: 'idx_attestations_claim_party',
    table: 'attestations',
    columns: ['claim_id', 'party_id'],
    description: 'Composite unique constraint for attestations',
  },

  // Sessions table indexes
  {
    name: 'idx_sessions_expire',
    table: 'sessions',
    columns: ['expire_at'],
    description: 'Fast cleanup of expired sessions',
  },
  {
    name: 'idx_sessions_sid',
    table: 'sessions',
    columns: ['sid'],
    description: 'Fast session lookup by session ID',
  },

  // Check-ins table indexes
  {
    name: 'idx_checkins_vault_id',
    table: 'checkins',
    columns: ['vault_id'],
    description: 'Fast lookup of check-ins by vault',
  },
  {
    name: 'idx_checkins_created',
    table: 'checkins',
    columns: ['created_at DESC'],
    description: 'Fast ordering by check-in date',
  },
  {
    name: 'idx_checkins_vault_created',
    table: 'checkins',
    columns: ['vault_id', 'created_at DESC'],
    description: 'Composite index for vault check-in history',
  },

  // Messages table indexes
  {
    name: 'idx_messages_vault_id',
    table: 'messages',
    columns: ['vault_id'],
    description: 'Fast lookup of messages by vault',
  },
  {
    name: 'idx_messages_created',
    table: 'messages',
    columns: ['created_at DESC'],
    description: 'Fast ordering by message date',
  },

  // Referrals table indexes
  {
    name: 'idx_referrals_referrer_id',
    table: 'referrals',
    columns: ['referrer_id'],
    description: 'Fast lookup of referrals by referrer',
  },
  {
    name: 'idx_referrals_referee_id',
    table: 'referrals',
    columns: ['referee_id'],
    description: 'Fast lookup of referrals by referee',
  },
  {
    name: 'idx_referrals_status',
    table: 'referrals',
    columns: ['status'],
    description: 'Filter referrals by status',
  },

  // Notifications table indexes
  {
    name: 'idx_notifications_user_id',
    table: 'notifications',
    columns: ['user_id'],
    description: 'Fast lookup of notifications by user',
  },
  {
    name: 'idx_notifications_read',
    table: 'notifications',
    columns: ['is_read'],
    description: 'Filter unread notifications',
  },
  {
    name: 'idx_notifications_created',
    table: 'notifications',
    columns: ['created_at DESC'],
    description: 'Fast ordering by notification date',
  },
  {
    name: 'idx_notifications_user_read',
    table: 'notifications',
    columns: ['user_id', 'is_read'],
    description: 'Composite index for unread notifications',
  },
];

/**
 * Create a single index
 */
async function createIndex(index: IndexInfo): Promise<boolean> {
  try {
    const columnsStr = index.columns.join(', ');
    const query = `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table} (${columnsStr})`;

    logInfo(`Creating index: ${index.name}`, {
      table: index.table,
      columns: columnsStr,
    });

    await db.execute(sql.raw(query));

    logInfo(`✓ Created index: ${index.name}`, {
      description: index.description,
    });

    return true;
  } catch (error) {
    logError(error as Error, {
      context: 'createIndex',
      index: index.name,
      table: index.table,
    });
    return false;
  }
}

/**
 * Main function to create all indexes
 */
async function addPerformanceIndexes() {
  logInfo('Starting performance index creation');

  let successCount = 0;
  let failureCount = 0;

  for (const index of indexes) {
    const success = await createIndex(index);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  logInfo('Performance index creation completed', {
    total: indexes.length,
    success: successCount,
    failures: failureCount,
  });

  if (failureCount > 0) {
    logError(new Error(`Failed to create ${failureCount} indexes`), {
      context: 'addPerformanceIndexes',
    });
    process.exit(1);
  }

  process.exit(0);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addPerformanceIndexes().catch((error) => {
    logError(error, { context: 'addPerformanceIndexes.main' });
    process.exit(1);
  });
}

export { addPerformanceIndexes };
