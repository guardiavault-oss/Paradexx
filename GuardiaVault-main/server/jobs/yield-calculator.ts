/**
 * Yield Calculator Cron Job
 * Updates yield for all active vaults by querying protocol values
 * Runs every hour to keep yield calculations up-to-date
 */

import cron from 'node-cron';
import { yieldService } from '../services/yieldService.js';
import { logInfo, logError } from '../services/logger.js';
import { storage } from '../storage.js';

let isRunning = false;

/**
 * Start the yield calculator cron job
 * Runs every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
 */
export function startYieldCalculator() {
  logInfo('Starting yield calculator cron job', {
    schedule: '0 * * * *',
    description: 'Runs every hour',
  });

  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    if (isRunning) {
      logInfo('Yield calculator already running, skipping this cycle', {});
      return;
    }

    isRunning = true;
    logInfo('Starting yield calculation cycle', {
      timestamp: new Date().toISOString(),
    });

    try {
      await updateAllVaultYields();
      logInfo('Yield calculation cycle completed successfully', {});
    } catch (error) {
      logError(error as Error, { context: 'yield-calculation-cron' });
    } finally {
      isRunning = false;
    }
  });

  logInfo('Yield calculator cron job started - runs every hour', {});
}

/**
 * Update yield for all active yield vaults
 */
async function updateAllVaultYields() {
  try {
    // Query all active yield vaults from database
    const activeVaults = await getActiveVaults();
    logInfo(`Found ${activeVaults.length} active vaults to update`, {
      count: activeVaults.length,
    });

    if (activeVaults.length === 0) {
      logInfo('No active yield vaults to update', {});
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ vaultId: string; error: string }> = [];

    for (const vault of activeVaults) {
      try {
        await yieldService.updateVaultYield(vault.id);
        successCount++;

        logInfo(`Updated yield for vault ${vault.id}`, {
          vaultId: vault.id,
          owner: vault.owner,
        });
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ vaultId: vault.id, error: errorMessage });

        logError(error as Error, {
          context: 'yield-calculation-vault',
          vaultId: vault.id,
          owner: vault.owner,
        });
      }
    }

    logInfo('Yield update cycle completed', {
      total: activeVaults.length,
      successful: successCount,
      failed: errorCount,
      errors: errors.length > 0 ? errors : undefined,
    });

    if (errorCount > 0) {
      logError(new Error(`Failed to update ${errorCount} vault(s)`), {
        context: 'yield-calculation-summary',
        failedVaults: errors,
      });
    }
  } catch (error) {
    logError(error as Error, {
      context: 'update-all-vault-yields',
    });
    throw error;
  }
}

/**
 * Get all active yield vaults from contract or storage
 */
async function getActiveVaults(): Promise<Array<{ id: string; owner: string }>> {
  try {
    const { yieldService } = await import('../services/yieldService.js');
    const yieldVaultContract = (yieldService as any).yieldVaultContract;

    // Try to get vaults from database/storage first
    if (storage && typeof (storage as any).getYieldVaults === 'function') {
      const vaults = await (storage as any).getYieldVaults();
      return vaults
        .filter((vault: any) => vault.status === 'active')
        .map((vault: any) => ({
          id: vault.id.toString(),
          owner: vault.owner || vault.ownerId || '',
        }));
    }

    // Fallback: Query contract events to find all vaults
    // This queries YieldVaultCreated events to build a list
    if (yieldVaultContract && process.env.YIELD_VAULT_ADDRESS) {
      try {
        const { ethers } = await import('ethers');
        const provider = yieldVaultContract.provider;

        // Query YieldVaultCreated events from contract deployment to now
        // This is a simplified approach - in production you'd want to maintain an index
        const contractAddress = process.env.YIELD_VAULT_ADDRESS;
        const filter = {
          address: contractAddress,
          topics: [
            ethers.id('YieldVaultCreated(uint256,address,address,address,uint256)'),
          ],
          fromBlock: 0, // From contract deployment
          toBlock: 'latest',
        };

        const logs = await provider.getLogs(filter);
        const vaults: Array<{ id: string; owner: string }> = [];

        for (const log of logs) {
          try {
            // Decode event: YieldVaultCreated(uint256 indexed vaultId, address indexed owner, address, address, uint256)
            const iface = new (await import('ethers')).Interface([
              'event YieldVaultCreated(uint256 indexed vaultId, address indexed owner, address, address, uint256)'
            ]);
            const decoded = iface.decodeEventLog(
              'YieldVaultCreated',
              log.data,
              log.topics
            );
            
            // Verify vault is still active by checking contract
            const vaultData = await yieldVaultContract.getVault(decoded.vaultId);
            if (vaultData && vaultData.isActive) {
              vaults.push({
                id: decoded.vaultId.toString(),
                owner: decoded.owner,
              });
            }
          } catch (error) {
            // Skip invalid logs
            continue;
          }
        }

        if (vaults.length > 0) {
          logInfo(`Found ${vaults.length} active yield vaults from contract events`, {
            count: vaults.length,
          });
          return vaults;
        }
      } catch (error) {
        logError(error as Error, {
          context: 'get-active-vaults.contract-events',
        });
      }
    }

    // If no vaults found, return empty array
    logInfo('No active yield vaults found', {});
    return [];

    // Future: Database implementation example
    /*
    const { db } = await import('../db.js');
    const { yieldVaults } = await import('../../shared/schema.js');
    const { eq } = await import('drizzle-orm');

    const vaults = await db
      .select({
        id: yieldVaults.id,
        owner: yieldVaults.ownerId,
      })
      .from(yieldVaults)
      .where(eq(yieldVaults.status, 'active'));

    return vaults.map(v => ({
      id: v.id.toString(),
      owner: v.owner,
    }));
    */
  } catch (error) {
    logError(error as Error, {
      context: 'get-active-vaults',
    });
    // Return empty array on error to prevent blocking the cron job
    return [];
  }
}

/**
 * Manual trigger for testing or admin use
 * @throws Error if calculation is already running
 */
export async function triggerYieldCalculation(): Promise<void> {
  if (isRunning) {
    throw new Error('Yield calculation already running');
  }

  logInfo('Manual yield calculation triggered', {
    timestamp: new Date().toISOString(),
  });

  isRunning = true;

  try {
    await updateAllVaultYields();
    logInfo('Manual yield calculation completed', {});
  } finally {
    isRunning = false;
  }
}

/**
 * Stop the yield calculator cron job
 * Note: node-cron doesn't support stopping individual schedules easily
 * This is mainly for reference - would need to store schedule reference
 */
export function stopYieldCalculator() {
  // node-cron doesn't provide easy way to stop a specific schedule
  // In production, you'd want to store the task reference and destroy it
  logInfo('Yield calculator stop requested (not implemented for node-cron)', {});
}

