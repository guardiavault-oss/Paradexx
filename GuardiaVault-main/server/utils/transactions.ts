/**
 * Database Transaction Utilities
 * Provides transaction wrapping for critical multi-step operations
 */

import { db } from "../db";
import { logError } from "../services/logger";

/**
 * Execute multiple database operations in a transaction
 * If any operation fails, all changes are rolled back
 */
export async function withTransaction<T>(
  operations: (tx: any) => Promise<T>
): Promise<T> {
  if (!db) {
    throw new Error("Database not initialized");
  }

  // Start transaction
  const client = await (db as any).client;
  let tx: any = null;

  try {
    // Begin transaction
    await client.query("BEGIN");
    
    // Create transaction context
    tx = {
      ...db,
      query: async (sql: string, params?: any[]) => {
        return client.query(sql, params);
      },
    };

    // Execute operations
    const result = await operations(tx);

    // Commit transaction
    await client.query("COMMIT");
    
    return result;
  } catch (error: any) {
    // Rollback on error
    if (client && !client.query) {
      // If using Drizzle, we need to access the underlying client differently
      try {
        await (db as any).execute("ROLLBACK");
      } catch (rollbackError) {
        logError("Transaction rollback failed", rollbackError as Error);
      }
    } else {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        logError("Transaction rollback failed", rollbackError as Error);
      }
    }

    logError("Transaction failed, rolled back", error);
    throw error;
  } finally {
    // Release client back to pool (handled automatically by pool)
  }
}

/**
 * Wrapper for vault operations that should be atomic
 * Example: Creating vault with guardians and beneficiaries
 */
export async function vaultTransaction<T>(
  operations: (tx: any) => Promise<T>
): Promise<T> {
  return withTransaction(operations);
}

