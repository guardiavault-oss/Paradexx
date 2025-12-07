/**
 * Database Transaction Utilities
 * 
 * Provides reusable transaction wrapper for critical database operations
 * Ensures atomicity and proper rollback on errors
 */

import { db } from "../db";
import { logError, logInfo } from "../services/logger";

/**
 * Transaction type from Drizzle ORM
 * This is the transaction object passed to the callback
 */
export type Transaction = typeof db extends { transaction: (callback: (tx: infer TX) => any) => any } ? TX : any;

/**
 * Execute a callback within a database transaction
 * 
 * @param callback - Function that receives the transaction object and returns a promise
 * @param operationName - Name of the operation for logging (e.g., "vault_creation")
 * @returns Promise that resolves when transaction commits or rejects on rollback
 * 
 * @example
 * ```typescript
 * const result = await withTransaction(async (tx) => {
 *   const vault = await tx.insert(vaults).values(vaultData).returning();
 *   const party = await tx.insert(parties).values(partyData).returning();
 *   return { vault, party };
 * }, "vault_creation");
 * ```
 */
export async function withTransaction<T>(
  callback: (tx: Transaction) => Promise<T>,
  operationName: string = "database_operation"
): Promise<T> {
  const startTime = Date.now();
  const operationId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logInfo(`🔄 Starting transaction: ${operationName}`, {
    operationId,
    operationName,
  });

  // Check if database is available
  if (!db) {
    const error = new Error(
      `Database not available for transaction: ${operationName}. ` +
      `Using in-memory storage - transactions are not supported.`
    );
    logError(error, { operationId, operationName });
    throw error;
  }

  try {
    // Execute transaction
    const result = await db.transaction(async (tx: Transaction) => {
      try {
        // Execute the callback with transaction object
        const callbackResult = await callback(tx);

        // Transaction will auto-commit if callback succeeds
        logInfo(`✅ Transaction committed: ${operationName}`, {
          operationId,
          operationName,
          duration: Date.now() - startTime,
        });

        return callbackResult;
      } catch (callbackError: any) {
        // Error in callback - transaction will auto-rollback
        logError(callbackError, {
          operationId,
          operationName,
          context: "transaction_callback_error",
          willRollback: true,
        });
        throw callbackError; // Re-throw to trigger rollback
      }
    });

    const duration = Date.now() - startTime;
    logInfo(`✅ Transaction completed successfully: ${operationName}`, {
      operationId,
      operationName,
      duration,
    });

    return result;
  } catch (error: any) {
    // Transaction was rolled back
    const duration = Date.now() - startTime;
    
    logError(error, {
      operationId,
      operationName,
      context: "transaction_rollback",
      duration,
      errorMessage: error.message,
      errorCode: error.code,
    });

    // Enhance error message with transaction context
    const enhancedError = new Error(
      `Transaction failed for ${operationName}: ${error.message}. ` +
      `All changes have been rolled back.`
    );
    (enhancedError as any).originalError = error;
    (enhancedError as any).operationId = operationId;
    (enhancedError as any).operationName = operationName;

    throw enhancedError;
  }
}

/**
 * Execute multiple operations in parallel within a transaction
 * Useful when you need to insert multiple records atomically
 * 
 * @param operations - Array of async functions that use the transaction
 * @param operationName - Name of the operation for logging
 * @returns Promise that resolves with array of results
 */
export async function withTransactionParallel<T>(
  operations: Array<(tx: Transaction) => Promise<T>>,
  operationName: string = "parallel_database_operation"
): Promise<T[]> {
  return withTransaction(async (tx) => {
    return Promise.all(operations.map(op => op(tx)));
  }, operationName);
}

/**
 * Check if database supports transactions (i.e., not in-memory storage)
 */
export function supportsTransactions(): boolean {
  return !!db;
}

/**
 * Execute a transaction with retry logic
 * Useful for handling transient database errors
 * 
 * @param callback - Function that receives the transaction object
 * @param operationName - Name of the operation for logging
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryDelayMs - Delay between retries in milliseconds (default: 1000)
 * @returns Promise that resolves when transaction commits
 */
export async function withTransactionRetry<T>(
  callback: (tx: Transaction) => Promise<T>,
  operationName: string = "database_operation",
  maxRetries: number = 3,
  retryDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        logInfo(`🔄 Retrying transaction: ${operationName} (attempt ${attempt + 1}/${maxRetries})`, {
          operationName,
          attempt,
          previousError: lastError?.message,
        });
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
      }
      
      return await withTransaction(callback, operationName);
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors (validation, constraints, etc.)
      const isRetryable = 
        error.code === '40P01' || // deadlock_detected
        error.code === '40001' || // serialization_failure
        error.code === '08003' || // connection_does_not_exist
        error.code === '08006' || // connection_failure
        error.message?.includes('timeout') ||
        error.message?.includes('connection') ||
        error.message?.includes('network');
      
      if (!isRetryable || attempt === maxRetries - 1) {
        // Not retryable or last attempt - throw error
        throw error;
      }
      
      // Will retry on next iteration
    }
  }
  
  throw lastError || new Error(`Transaction failed after ${maxRetries} attempts`);
}

