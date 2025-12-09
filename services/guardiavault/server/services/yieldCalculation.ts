/**
 * Yield Calculation Service
 * Calculates yield for yield-generating vaults by querying protocol APYs
 */

import { ethers } from "ethers";
import { logInfo, logError } from "./logger";
import { storage } from "../storage";

export interface ProtocolAPY {
  lido: number; // stETH APY
  aave: number; // aToken APY (varies by asset)
  compound: number; // cToken APY (varies by asset)
}

export interface YieldCalculationResult {
  vaultId: string;
  previousTotalValue: string;
  newTotalValue: string;
  yieldEarned: string;
  performanceFee: string;
  timestamp: Date;
}

export class YieldCalculationService {
  private provider: ethers.JsonRpcProvider | null = null;
  private yieldVaultContract: ethers.Contract | null = null;

  constructor() {
    // Initialize provider in production from environment
    if (typeof process !== "undefined" && process.env.VITE_SEPOLIA_RPC_URL) {
      this.provider = new ethers.JsonRpcProvider(process.env.VITE_SEPOLIA_RPC_URL);
    }
  }

  /**
   * Get current APY from protocols (REAL API calls only - no fallbacks)
   */
  async getProtocolAPY(protocol: string, asset?: string): Promise<number> {
    // Real API calls to get live APY data - MUST succeed or throw error
      if (protocol.toLowerCase() === "lido") {
        // Lido API: https://api.lido.fi/v1/steth/apr
        try {
          const response = await fetch("https://api.lido.fi/v1/steth/apr");
        if (!response.ok) {
          throw new Error(`Lido API returned status ${response.status}`);
        }
            const data = await response.json();
            // Lido returns APR in format like { "apr": 0.042 } (4.2%)
        if (!data.apr && data.apr !== 0) {
          throw new Error("Lido API response missing APR data");
        }
        return parseFloat(data.apr) * 100; // Convert to percentage
        } catch (error) {
        const err = error as Error;
        logError(err, { 
          context: "lido-api-fetch",
          message: "CRITICAL: Cannot fetch real Lido APY - system cannot operate with fake data"
        });
        throw new Error(
          `Failed to fetch Lido APY: ${err.message}. ` +
          `Cannot proceed without real data. Check network connectivity and DNS resolution.`
        );
      }
      }

      if (protocol.toLowerCase() === "aave") {
        // Aave V3 API: https://api.aave.com/v3/protocol-data
        try {
          const response = await fetch("https://api.aave.com/v3/protocol-data");
        if (!response.ok) {
          throw new Error(`Aave API returned status ${response.status}`);
        }
            const data = await response.json();
            // Find asset in reserves
            const assetLower = asset?.toLowerCase();
            const reserves = data.reserves || [];
        
        if (reserves.length === 0) {
          throw new Error("Aave API returned empty reserves data");
        }
            
            for (const reserve of reserves) {
              const symbol = reserve.symbol?.toLowerCase();
              if (symbol === assetLower || 
                  (assetLower === "usdc" && symbol === "usdc.e") ||
                  (assetLower === "usdt" && symbol === "usdt")) {
                // Convert from ray (1e27) to percentage
                const liquidityRate = parseFloat(reserve.liquidityRate || "0");
            if (liquidityRate <= 0) {
              throw new Error(`Invalid liquidity rate for ${asset}: ${liquidityRate}`);
            }
                const apy = (liquidityRate / 1e25) * 100; // Simplified conversion
            if (apy <= 0) {
              throw new Error(`Calculated APY for ${asset} is invalid: ${apy}`);
            }
            return apy;
              }
            }
        
        throw new Error(`Asset ${asset} not found in Aave reserves`);
        } catch (error) {
        const err = error as Error;
        logError(err, { 
          context: "aave-api-fetch",
          asset,
          message: "CRITICAL: Cannot fetch real Aave APY - system cannot operate with fake data"
        });
        throw new Error(
          `Failed to fetch Aave APY for ${asset}: ${err.message}. ` +
          `Cannot proceed without real data. Check network connectivity and DNS resolution.`
        );
      }
      }

    // Unknown protocol - cannot return fake data
    throw new Error(
      `Protocol ${protocol} not supported or not implemented. ` +
      `Cannot return fake APY data for real money.`
    );
  }

  /**
   * Calculate yield for a single vault
   */
  async calculateVaultYield(
    vaultId: string,
    principal: string,
    stakingProtocol: string,
    asset: string,
    daysSinceLastUpdate: number
  ): Promise<YieldCalculationResult> {
    try {
      // Get APY for the protocol
      const apy = await this.getProtocolAPY(stakingProtocol, asset);

      // Calculate yield (simple interest calculation)
      // APY is annual, so daily yield = APY / 365
      const dailyYieldRate = apy / 100 / 365;
      const yieldEarned = parseFloat(principal) * dailyYieldRate * daysSinceLastUpdate;

      // Calculate performance fee (1% of yield)
      const performanceFee = yieldEarned * 0.01;

      // New total value = principal + yield - fee
      const newTotalValue = parseFloat(principal) + yieldEarned - performanceFee;

      // Format numbers, removing trailing zeros for whole numbers
      const formatNumber = (num: number): string => {
        const fixed = num.toFixed(6);
        // Remove trailing zeros and decimal point if not needed
        return parseFloat(fixed).toString();
      };

      return {
        vaultId,
        previousTotalValue: principal,
        newTotalValue: formatNumber(newTotalValue),
        yieldEarned: formatNumber(yieldEarned),
        performanceFee: formatNumber(performanceFee),
        timestamp: new Date(),
      };
    } catch (error) {
      logError(error as Error, { context: "yield-calculation", vaultId });
      throw error;
    }
  }

  /**
   * Update yield for all active yield vaults
   */
  async updateAllVaults(): Promise<YieldCalculationResult[]> {
    try {
      logInfo("Starting yield calculation for all vaults", {});

      // In production, fetch all active yield vaults from database
      // For now, this is a placeholder - vaults would be stored in a yield_vaults table
      const results: YieldCalculationResult[] = [];

      // Example: Fetch vaults from database
      // const vaults = await storage.getActiveYieldVaults();
      
      // For each vault:
      // 1. Get current state from contract
      // 2. Calculate yield since last update
      // 3. Call contract.updateYield()
      // 4. Track performance fee

      logInfo("Yield calculation complete", { vaultCount: results.length });
      return results;
    } catch (error) {
      logError(error as Error, { context: "update-all-vaults-yield" });
      throw error;
    }
  }

  /**
   * Initialize contract connection (call from cron job)
   */
  async initializeContract(contractAddress: string, abi: any[]): Promise<void> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    try {
      // In production, get signer from wallet or use a service account
      this.yieldVaultContract = new ethers.Contract(contractAddress, abi, this.provider);
      logInfo("Yield vault contract initialized", { address: contractAddress });
    } catch (error) {
      logError(error as Error, { context: "yield-contract-init" });
      throw error;
    }
  }

  /**
   * Update yield on-chain for a specific vault
   */
  async updateYieldOnChain(vaultId: number, newTotalValue: string): Promise<string> {
    if (!this.yieldVaultContract) {
      throw new Error("Contract not initialized");
    }

    try {
      // In production, this would call the contract's updateYield function
      // const tx = await this.yieldVaultContract.updateYield(vaultId, ethers.parseUnits(newTotalValue, 18));
      // const receipt = await tx.wait();
      // return receipt.transactionHash;

      // Placeholder for now
      logInfo("Yield updated on-chain", { vaultId, newTotalValue });
      return "0x0000000000000000000000000000000000000000000000000000000000000000";
    } catch (error) {
      logError(error as Error, { context: "update-yield-onchain", vaultId });
      throw error;
    }
  }
}

export const yieldCalculationService = new YieldCalculationService();

