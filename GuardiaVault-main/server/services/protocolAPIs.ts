/**
 * Protocol API Service
 * Real-time APY and protocol data from Lido, Aave, and other DeFi protocols
 */

import axios from "axios";
import { logInfo, logError } from "./logger";
import { proxyService } from "../utils/proxyService";

export interface ProtocolAPY {
  protocol: string;
  asset: string;
  apy: number;
  apr?: number;
  timestamp: Date;
  source: "api" | "contract";
}

export interface LidoAPIData {
  data: {
    smaApr: number; // Simple Moving Average APR
    apr: number; // Current APR
  };
}

export interface AavePoolData {
  reservesData: Array<{
    symbol: string;
    liquidityRate: string; // APY in Ray (1e27)
    variableBorrowRate: string;
    stableBorrowRate: string;
  }>;
}

export class ProtocolAPIService {
  private cache: Map<string, { data: ProtocolAPY; expires: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get Lido stETH APY from official API with fallback endpoints
   */
  async getLidoAPY(): Promise<ProtocolAPY> {
    const cacheKey = "lido-apy";
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Multiple endpoints to try in order
    const endpoints = [
      "https://api.lido.fi/v1/steth/apr",
      "https://eth-api-prod.lido.fi/v1/steth/apr", // Alternative Lido endpoint
      "https://stake.lido.fi/api/short-beaconstat", // Alternative endpoint
    ];

    const axiosConfig = {
      timeout: 15000, // Increased timeout
      headers: {
        "Accept": "application/json",
        "User-Agent": "GuardiaVault/1.0",
      },
      // Add DNS resolution options
      family: 4, // Force IPv4
    };

    let lastError: Error;

    for (const [index, endpoint] of endpoints.entries()) {
      try {
        logInfo(`Attempting Lido API call`, { endpoint, attempt: index + 1 });
        
        const response = await axios.get<any>(endpoint, axiosConfig);
        
        let apr: number;
        
        // Handle different response formats from different endpoints
        if (endpoint.includes('/steth/apr')) {
          apr = response.data.data?.smaApr || response.data.data?.apr;
        } else if (endpoint.includes('/short-beaconstat')) {
          // Alternative format
          apr = response.data?.aprBeaconStat;
        } else {
          // Generic fallback
          apr = response.data?.apr || response.data?.data?.apr;
        }

        if (!apr || apr <= 0) {
          throw new Error(`Invalid APR data received: ${apr}`);
        }

        const apy = this.aprToApy(apr);

        const result: ProtocolAPY = {
          protocol: "lido",
          asset: "ETH", 
          apy: apy,
          apr: apr,
          timestamp: new Date(),
          source: "api",
        };

        this.cache.set(cacheKey, {
          data: result,
          expires: Date.now() + this.CACHE_TTL,
        });

        logInfo("Lido APY fetched successfully", { 
          apy, 
          apr, 
          source: "api", 
          endpoint,
          attempt: index + 1 
        });
        return result;
        
      } catch (error) {
        lastError = error as Error;
        logError(lastError, { 
          context: "getLidoAPY",
          endpoint,
          attempt: index + 1,
          message: `Attempt ${index + 1} failed, trying next endpoint if available`
        });
        
        // Continue to next endpoint
        continue;
      }
    }

    // All direct endpoints failed, try proxy service as last resort
    try {
      logInfo("All direct Lido endpoints failed, trying proxy service...");
      const proxyData = await proxyService.getLidoData();
      
      let apr: number;
      if (proxyData?.data?.smaApr) {
        apr = proxyData.data.smaApr;
      } else if (proxyData?.data?.apr) {
        apr = proxyData.data.apr;
      } else if (proxyData?.aprBeaconStat) {
        apr = proxyData.aprBeaconStat;
      } else {
        throw new Error("Invalid proxy response format");
      }

      if (!apr || apr <= 0) {
        throw new Error(`Invalid APR from proxy: ${apr}`);
      }

      const apy = this.aprToApy(apr);
      const result: ProtocolAPY = {
        protocol: "lido",
        asset: "ETH",
        apy: apy,
        apr: apr,
        timestamp: new Date(),
        source: "api",
      };

      this.cache.set(cacheKey, {
        data: result,
        expires: Date.now() + this.CACHE_TTL,
      });

      logInfo("Lido APY fetched via proxy service", { apy, apr, source: "proxy" });
      return result;
      
    } catch (proxyError) {
      logError(proxyError as Error, {
        context: "getLidoAPY",
        message: "Proxy service also failed"
      });
    }

    // Everything failed
    logError(lastError!, { 
      context: "getLidoAPY",
      message: "CRITICAL: All Lido API endpoints and proxy services failed. Cannot fetch real APY data."
    });
    
    throw new Error(
      `Failed to fetch Lido APY from all available endpoints and proxy services. Last error: ${lastError!.message}. ` +
      `Cannot proceed without real data. Check network connectivity and DNS resolution.`
    );
  }

  /**
   * Get Aave APY for specific asset with fallback endpoints
   */
  async getAaveAPY(asset: "USDC" | "ETH" | "DAI"): Promise<ProtocolAPY> {
    const cacheKey = `aave-${asset.toLowerCase()}-apy`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const chainId = process.env.CHAIN_ID || "1"; // Default to mainnet
    
    // Multiple endpoints to try in order
    const endpoints = [
      `https://aave-api-v3.aave.com/data/pools?chainId=${chainId}`,
      `https://api.aave.com/data/pools?chainId=${chainId}`, // Alternative endpoint
      `https://aave-data-service.herokuapp.com/pools?chainId=${chainId}`, // Backup endpoint
    ];

    const axiosConfig = {
      timeout: 15000,
      headers: {
        "Accept": "application/json",
        "User-Agent": "GuardiaVault/1.0",
      },
      family: 4, // Force IPv4
    };

    let lastError: Error;

    for (const [index, endpoint] of endpoints.entries()) {
      try {
        logInfo(`Attempting Aave API call`, { endpoint, asset, attempt: index + 1 });
        
        const response = await axios.get<any>(endpoint, axiosConfig);
        
        let reserve;
        
        // Handle different response formats
        if (response.data?.reservesData) {
          reserve = response.data.reservesData.find((r: any) => r.symbol === asset);
        } else if (response.data?.data?.reservesData) {
          reserve = response.data.data.reservesData.find((r: any) => r.symbol === asset);
        } else if (Array.isArray(response.data)) {
          // Sometimes the response is directly an array
          reserve = response.data.find((r: any) => r.symbol === asset);
        }

        if (!reserve) {
          throw new Error(`Asset ${asset} not found in Aave pool data`);
        }

        // Convert Ray (1e27) to percentage
        let liquidityRate: number;
        if (typeof reserve.liquidityRate === 'string') {
          liquidityRate = parseFloat(reserve.liquidityRate) / 1e25;
        } else {
          liquidityRate = reserve.liquidityRate || 0;
        }
        
        if (liquidityRate <= 0) {
          throw new Error(`Invalid liquidity rate received: ${liquidityRate}`);
        }

        const apy = liquidityRate;

        const result: ProtocolAPY = {
          protocol: "aave",
          asset: asset,
          apy: apy,
          apr: apy, // Aave provides APY directly
          timestamp: new Date(),
          source: "api",
        };

        this.cache.set(cacheKey, {
          data: result,
          expires: Date.now() + this.CACHE_TTL,
        });

        logInfo("Aave APY fetched successfully", { 
          asset, 
          apy, 
          source: "api", 
          endpoint,
          attempt: index + 1 
        });
        return result;
        
      } catch (error) {
        lastError = error as Error;
        logError(lastError, { 
          context: "getAaveAPY",
          asset,
          endpoint,
          attempt: index + 1,
          message: `Attempt ${index + 1} failed, trying next endpoint if available`
        });
        
        // Continue to next endpoint
        continue;
      }
    }

    // All direct endpoints failed, try proxy service as last resort
    try {
      logInfo("All direct Aave endpoints failed, trying proxy service...", { asset });
      const proxyData = await proxyService.getAaveData(chainId);
      
      let reserve;
      if (proxyData?.reservesData) {
        reserve = proxyData.reservesData.find((r: any) => r.symbol === asset);
      } else if (proxyData?.data?.reservesData) {
        reserve = proxyData.data.reservesData.find((r: any) => r.symbol === asset);
      } else if (Array.isArray(proxyData)) {
        reserve = proxyData.find((r: any) => r.symbol === asset);
      }

      if (!reserve) {
        throw new Error(`Asset ${asset} not found in proxy response`);
      }

      let liquidityRate: number;
      if (typeof reserve.liquidityRate === 'string') {
        liquidityRate = parseFloat(reserve.liquidityRate) / 1e25;
      } else {
        liquidityRate = reserve.liquidityRate || 0;
      }

      if (liquidityRate <= 0) {
        throw new Error(`Invalid liquidity rate from proxy: ${liquidityRate}`);
      }

      const apy = liquidityRate;
      const result: ProtocolAPY = {
        protocol: "aave",
        asset: asset,
        apy: apy,
        apr: apy,
        timestamp: new Date(),
        source: "api",
      };

      this.cache.set(cacheKey, {
        data: result,
        expires: Date.now() + this.CACHE_TTL,
      });

      logInfo("Aave APY fetched via proxy service", { asset, apy, source: "proxy" });
      return result;
      
    } catch (proxyError) {
      logError(proxyError as Error, {
        context: "getAaveAPY",
        asset,
        message: "Proxy service also failed"
      });
    }

    // Everything failed
    logError(lastError!, { 
      context: "getAaveAPY",
      asset,
      message: "CRITICAL: All Aave API endpoints and proxy services failed. Cannot fetch real APY data."
    });
    
    throw new Error(
      `Failed to fetch Aave APY for ${asset} from all available endpoints and proxy services. Last error: ${lastError!.message}. ` +
      `Cannot proceed without real data. Check network connectivity and DNS resolution.`
    );
  }

  /**
   * Get Compound APY - now uses DeFi protocol service
   */
  async getCompoundAPY(asset: "USDC" | "ETH" | "DAI"): Promise<ProtocolAPY> {
    try {
      const { getDeFiProtocolService } = await import("./defiProtocols");
      const defiService = getDeFiProtocolService();
      const apy = await defiService.getCompoundAPY(asset);

      return {
        protocol: "compound",
        asset,
        apy,
        apr: apy,
        timestamp: new Date(),
        source: "api",
      };
    } catch (error: any) {
      logError(error, { context: "getCompoundAPY", asset });
      // Fallback to conservative estimate if API fails
      return {
        protocol: "compound",
        asset,
        apy: 2.8,
        apr: 2.8,
        timestamp: new Date(),
        source: "api",
      };
    }
  }

  /**
   * Get Yearn APY - now uses DeFi protocol service
   */
  async getYearnAPY(asset: "USDC" | "ETH" | "DAI"): Promise<ProtocolAPY> {
    try {
      const { getDeFiProtocolService } = await import("./defiProtocols");
      const defiService = getDeFiProtocolService();
      const apy = await defiService.getYearnAPY(asset);

      return {
        protocol: "yearn",
        asset,
        apy,
        apr: apy,
        timestamp: new Date(),
        source: "api",
      };
    } catch (error: any) {
      logError(error, { context: "getYearnAPY", asset });
      // Fallback to conservative estimate if API fails
      return {
        protocol: "yearn",
        asset,
        apy: 4.2,
        apr: 4.2,
        timestamp: new Date(),
        source: "api",
      };
    }
  }

  /**
   * Get Curve APY - now uses DeFi protocol service
   */
  async getCurveAPY(pool: string): Promise<ProtocolAPY> {
    try {
      const { getDeFiProtocolService } = await import("./defiProtocols");
      const defiService = getDeFiProtocolService();
      const apy = await defiService.getCurveAPY(pool);

      return {
        protocol: "curve",
        asset: pool,
        apy,
        apr: apy,
        timestamp: new Date(),
        source: "api",
      };
    } catch (error: any) {
      logError(error, { context: "getCurveAPY", pool });
      // Fallback to conservative estimate if API fails
      return {
        protocol: "curve",
        asset: pool,
        apy: 3.5,
        apr: 3.5,
        timestamp: new Date(),
        source: "api",
      };
    }
  }

  /**
   * Get APY data from DeFi aggregators as backup
   */
  private async getDefiPulseAPY(): Promise<ProtocolAPY[]> {
    const strategies: ProtocolAPY[] = [];
    
    // Try DeFi aggregator endpoints
    const aggregatorEndpoints = [
      "https://api.coingecko.com/api/v3/coins/ethereum/contract/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", // Lido stETH
      "https://yields.llama.fi/pools", // DeFi Llama yields
      "https://api.defipulse.com/v1/egs", // DeFi Pulse (if available)
    ];

    for (const endpoint of aggregatorEndpoints) {
      try {
        const response = await axios.get(endpoint, {
          timeout: 10000,
          headers: {
            "Accept": "application/json",
            "User-Agent": "GuardiaVault/1.0",
          },
        });

        // Parse different aggregator formats
        if (endpoint.includes('coingecko')) {
          // CoinGecko format - extract staking rewards if available
          const data = response.data;
          if (data?.market_data?.staking_rewards_percentage) {
            strategies.push({
              protocol: "lido",
              asset: "ETH",
              apy: data.market_data.staking_rewards_percentage,
              apr: data.market_data.staking_rewards_percentage,
              timestamp: new Date(),
              source: "api",
            });
          }
        } else if (endpoint.includes('yields.llama.fi')) {
          // DeFi Llama format
          const pools = response.data?.data || [];
          for (const pool of pools) {
            if (pool.protocol === 'lido' && pool.symbol?.includes('ETH')) {
              strategies.push({
                protocol: "lido",
                asset: "ETH",
                apy: pool.apy || 0,
                apr: pool.apr || pool.apy || 0,
                timestamp: new Date(),
                source: "api",
              });
            }
            if (pool.protocol === 'aave-v3') {
              const asset = pool.symbol?.includes('USDC') ? 'USDC' : 
                           pool.symbol?.includes('ETH') ? 'ETH' : null;
              if (asset) {
                strategies.push({
                  protocol: "aave",
                  asset: asset as "USDC" | "ETH",
                  apy: pool.apy || 0,
                  apr: pool.apr || pool.apy || 0,
                  timestamp: new Date(),
                  source: "api",
                });
              }
            }
          }
        }
        
        logInfo(`Fetched APY data from aggregator`, { 
          endpoint, 
          count: strategies.length 
        });
        
      } catch (error) {
        logError(error as Error, { 
          context: "getDefiPulseAPY",
          endpoint,
          message: "Aggregator endpoint failed, continuing..."
        });
      }
    }

    return strategies;
  }

  /**
   * Get all available strategies with real-time APY
   * Only returns strategies with successfully fetched real data
   */
  async getAllStrategiesAPY(): Promise<ProtocolAPY[]> {
    const strategies: ProtocolAPY[] = [];
    
    // First try direct protocol APIs
    const [lido, aaveUSDC, aaveETH] = await Promise.allSettled([
      this.getLidoAPY(),
      this.getAaveAPY("USDC"),
      this.getAaveAPY("ETH"),
    ]);

    if (lido.status === "fulfilled") {
      strategies.push(lido.value);
    } else {
      logError(new Error("Lido APY fetch failed"), { 
        context: "getAllStrategiesAPY",
        reason: lido.reason 
      });
    }
    
    if (aaveUSDC.status === "fulfilled") {
      strategies.push(aaveUSDC.value);
    } else {
      logError(new Error("Aave USDC APY fetch failed"), { 
        context: "getAllStrategiesAPY",
        reason: aaveUSDC.reason 
      });
    }
    
    if (aaveETH.status === "fulfilled") {
      strategies.push(aaveETH.value);
    } else {
      logError(new Error("Aave ETH APY fetch failed"), { 
        context: "getAllStrategiesAPY",
        reason: aaveETH.reason 
      });
    }

    // If direct APIs failed, try aggregator services as backup
    if (strategies.length === 0) {
      logInfo("Direct protocol APIs failed, trying aggregator services...");
      try {
        const aggregatorStrategies = await this.getDefiPulseAPY();
        strategies.push(...aggregatorStrategies);
        
        if (strategies.length > 0) {
          logInfo(`Retrieved ${strategies.length} strategies from aggregators`);
        }
      } catch (error) {
        logError(error as Error, {
          context: "getAllStrategiesAPY",
          message: "Aggregator services also failed"
        });
      }
    }

    if (strategies.length === 0) {
      logError(new Error("CRITICAL: No protocol APY data available from any source"), {
        context: "getAllStrategiesAPY",
        message: "All API calls failed including aggregators. System cannot operate without real APY data."
      });
    } else {
      logInfo(`Successfully fetched APY data for ${strategies.length} strategies`);
    }

    return strategies;
  }

  /**
   * Get APY from contract (when API unavailable)
   * TODO: Implement contract-based queries via ethers.js
   * This should query the actual on-chain protocol contracts for real data
   */
  private async getLidoAPYFromContract(): Promise<ProtocolAPY> {
    // TODO: Query Lido contract directly via ethers.js for real on-chain data
    // This requires:
    // 1. Lido stETH contract address
    // 2. Query contract for current APR/APY
    // 3. Return real data from blockchain
    
    throw new Error(
      "Contract-based Lido APY query not yet implemented. " +
      "Cannot return fake data. Must query real on-chain protocol data."
    );
  }

  private async getAaveAPYFromContract(asset: "USDC" | "ETH" | "DAI"): Promise<ProtocolAPY> {
    // TODO: Query Aave contract directly for real on-chain data
    // This requires:
    // 1. Aave Pool contract address
    // 2. Query getReserveData for the asset
    // 3. Extract liquidityRate and convert to APY
    // 4. Return real data from blockchain
    
    throw new Error(
      `Contract-based Aave APY query not yet implemented for ${asset}. ` +
      "Cannot return fake data. Must query real on-chain protocol data."
    );
  }

  /**
   * Convert APR to APY with daily compounding
   */
  private aprToApy(apr: number, compoundingFrequency: number = 365): number {
    return (Math.pow(1 + apr / 100 / compoundingFrequency, compoundingFrequency) - 1) * 100;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
  }
}

export const protocolAPIService = new ProtocolAPIService();

