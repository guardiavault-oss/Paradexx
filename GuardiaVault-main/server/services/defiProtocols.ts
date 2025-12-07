/**
 * DeFi Protocols Service
 * Real-time integration with DeFi protocols (Aave, Compound, Yearn, Curve)
 */

import { ethers } from "ethers";
import { logInfo, logError } from "./logger";
import { db } from "../db";
import { protocolCache } from "../../shared/schema";
import { and, eq, gt } from "../utils/drizzle-exports";

// Protocol contract addresses (Ethereum Mainnet)
const CONTRACTS = {
  AAVE_V3_POOL: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  COMPOUND_V3_USDC: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
  COMPOUND_CDAI: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
  YEARN_DAI_VAULT: "0xdA816459F1AB5631232FE5e97a05BBBb94970c95",
};

// ABIs (simplified)
const AAVE_POOL_ABI = [
  "function getReserveData(address asset) view returns (tuple(uint256 liquidityRate, uint256 variableBorrowRate, uint256 lastUpdateTimestamp))",
];

const COMPOUND_CTOKEN_ABI = ["function supplyRatePerBlock() view returns (uint256)"];

const YEARN_VAULT_ABI = [
  "function pricePerShare() view returns (uint256)",
  "function totalAssets() view returns (uint256)",
];

interface ProtocolAPY {
  protocol: string;
  asset: string;
  apy: number;
  tvl: number;
  lastUpdated: Date;
}

export class DeFiProtocolService {
  private provider: ethers.JsonRpcProvider;
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Get cached protocol data or fetch fresh if expired
   */
  private async getCachedOrFetch<T>(
    protocol: string,
    dataType: string,
    asset: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Check cache
    const [cached] = await db
      .select()
      .from(protocolCache)
      .where(
        and(
          eq(protocolCache.protocol, protocol),
          eq(protocolCache.dataType, dataType),
          eq(protocolCache.asset, asset),
          gt(protocolCache.expiresAt, new Date())
        )
      )
      .limit(1);

    if (cached) {
      logInfo("Using cached protocol data", { protocol, dataType, asset });
      return JSON.parse(cached.data as string) as T;
    }

    // Fetch fresh data
    logInfo("Fetching fresh protocol data", { protocol, dataType, asset });
    const data = await fetchFn();

    // Cache the result
    await db.insert(protocolCache).values({
      protocol,
      dataType,
      asset,
      data: JSON.stringify(data),
      expiresAt: new Date(Date.now() + this.cacheDuration),
      createdAt: new Date(),
    });

    return data;
  }

  /**
   * Get Aave V3 lending APY
   */
  async getAaveAPY(asset: string = "USDC"): Promise<number> {
    return this.getCachedOrFetch("aave", "apy", asset, async () => {
      try {
        const assetAddress = this.getAssetAddress(asset);
        const poolContract = new ethers.Contract(
          CONTRACTS.AAVE_V3_POOL,
          AAVE_POOL_ABI,
          this.provider
        );

        const reserveData = await poolContract.getReserveData(assetAddress);
        const liquidityRate = reserveData.liquidityRate;

        // Convert ray (1e27) to APY percentage
        const RAY = BigInt(10 ** 27);
        const SECONDS_PER_YEAR = 31536000n;
        const apr = Number(liquidityRate) / Number(RAY);
        const apy = (Math.pow(1 + apr / Number(SECONDS_PER_YEAR), Number(SECONDS_PER_YEAR)) - 1) * 100;

        logInfo("Fetched Aave APY", { asset, apy });
        return apy;
      } catch (error: any) {
        logError(error, { context: "getAaveAPY", asset });
        throw new Error(`Failed to fetch Aave APY: ${error.message}`);
      }
    });
  }

  /**
   * Get Compound V2 lending APY
   */
  async getCompoundAPY(asset: string = "DAI"): Promise<number> {
    return this.getCachedOrFetch("compound", "apy", asset, async () => {
      try {
        const cTokenContract = new ethers.Contract(
          CONTRACTS.COMPOUND_CDAI,
          COMPOUND_CTOKEN_ABI,
          this.provider
        );

        const supplyRatePerBlock = await cTokenContract.supplyRatePerBlock();

        // Compound uses blocks, ~13.15 seconds per block on Ethereum
        const blocksPerYear = 2102400; // Approximate
        const supplyRate = Number(supplyRatePerBlock) / 1e18;
        const apy = (Math.pow(1 + supplyRate, blocksPerYear) - 1) * 100;

        logInfo("Fetched Compound APY", { asset, apy });
        return apy;
      } catch (error: any) {
        logError(error, { context: "getCompoundAPY", asset });
        throw new Error(`Failed to fetch Compound APY: ${error.message}`);
      }
    });
  }

  /**
   * Get Yearn vault APY
   */
  async getYearnAPY(asset: string = "DAI"): Promise<number> {
    return this.getCachedOrFetch("yearn", "apy", asset, async () => {
      try {
        // Fetch from Yearn API (more reliable than calculating from chain)
        const response = await fetch("https://api.yearn.finance/v1/chains/1/vaults/all");
        const vaults = await response.json();

        const vault = vaults.find((v: any) => v.token.symbol === asset && v.version === "3.0.0");

        if (!vault) {
          throw new Error(`Yearn vault not found for ${asset}`);
        }

        const apy = vault.apy.net_apy * 100;
        logInfo("Fetched Yearn APY", { asset, apy });
        return apy;
      } catch (error: any) {
        logError(error, { context: "getYearnAPY", asset });
        throw new Error(`Failed to fetch Yearn APY: ${error.message}`);
      }
    });
  }

  /**
   * Get Curve pool APY
   */
  async getCurveAPY(pool: string = "tri-pool"): Promise<number> {
    return this.getCachedOrFetch("curve", "apy", pool, async () => {
      try {
        // Fetch from Curve API
        const response = await fetch("https://api.curve.fi/api/getSubgraphData/ethereum");
        const data = await response.json();

        const poolData = data.data.poolList.find((p: any) =>
          p.name.toLowerCase().includes(pool.toLowerCase())
        );

        if (!poolData) {
          throw new Error(`Curve pool not found: ${pool}`);
        }

        const apy = parseFloat(poolData.apy || "0");
        logInfo("Fetched Curve APY", { pool, apy });
        return apy;
      } catch (error: any) {
        logError(error, { context: "getCurveAPY", pool });
        throw new Error(`Failed to fetch Curve APY: ${error.message}`);
      }
    });
  }

  /**
   * Get all protocol APYs for comparison
   */
  async getAllProtocolAPYs(asset: string = "USDC"): Promise<ProtocolAPY[]> {
    const [aaveAPY, compoundAPY, yearnAPY] = await Promise.allSettled([
      this.getAaveAPY(asset),
      this.getCompoundAPY(asset),
      this.getYearnAPY(asset),
    ]);

    const results: ProtocolAPY[] = [];

    if (aaveAPY.status === "fulfilled") {
      results.push({
        protocol: "Aave V3",
        asset,
        apy: aaveAPY.value,
        tvl: 0, // TODO: Fetch TVL
        lastUpdated: new Date(),
      });
    }

    if (compoundAPY.status === "fulfilled") {
      results.push({
        protocol: "Compound",
        asset,
        apy: compoundAPY.value,
        tvl: 0,
        lastUpdated: new Date(),
      });
    }

    if (yearnAPY.status === "fulfilled") {
      results.push({
        protocol: "Yearn",
        asset,
        apy: yearnAPY.value,
        tvl: 0,
        lastUpdated: new Date(),
      });
    }

    return results.sort((a, b) => b.apy - a.apy);
  }

  private getAssetAddress(symbol: string): string {
    const addresses: Record<string, string> = {
      USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    };
    return addresses[symbol] || addresses["USDC"];
  }
}

// Singleton instance
let defiServiceInstance: DeFiProtocolService | null = null;

export function getDeFiProtocolService(): DeFiProtocolService {
  if (!defiServiceInstance) {
    const rpcUrl = process.env.MAINNET_RPC_URL || process.env.RPC_URL || "";
    if (!rpcUrl) {
      throw new Error("RPC_URL not configured for DeFi protocol service");
    }
    defiServiceInstance = new DeFiProtocolService(rpcUrl);
  }
  return defiServiceInstance;
}
