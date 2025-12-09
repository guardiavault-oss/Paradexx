// ============================================================================
// APEX SNIPER - Multi-DEX Arbitrage Detector
// Cross-DEX price discrepancy detection and arbitrage opportunity finder
// ============================================================================

import EventEmitter from 'eventemitter3';
import { ethers, JsonRpcProvider, Contract } from 'ethers';
import NodeCache from 'node-cache';
import { DEX, TokenInfo } from '../types';
import { config } from '../config';
import { logger, formatEther, formatUnits, checksumAddress } from '../utils';

// ============================================================================
// TYPES
// ============================================================================

export interface ArbitrageOpportunity {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  
  // Price info
  buyDex: DEX;
  sellDex: DEX;
  buyPrice: number;           // In ETH
  sellPrice: number;          // In ETH
  priceDifferencePercent: number;
  
  // Amounts
  optimalInputETH: number;
  expectedProfitETH: number;
  expectedProfitUSD: number;
  
  // Costs
  estimatedGasETH: number;
  estimatedSlippage: number;
  netProfitETH: number;
  netProfitUSD: number;
  
  // Risk metrics
  liquidityBuy: number;
  liquiditySell: number;
  confidence: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Execution info
  buyPath: string[];
  sellPath: string[];
  requiresFlashLoan: boolean;
  
  // Timing
  discoveredAt: number;
  expiresAt: number;
  isStale: boolean;
}

export interface DexPrice {
  dex: DEX;
  pairAddress: string;
  price: number;              // Token price in ETH
  priceImpact1ETH: number;    // Price impact for 1 ETH trade
  liquidity: number;          // USD liquidity
  reserves: [bigint, bigint];
  lastUpdated: number;
}

export interface ArbitrageConfig {
  enabled: boolean;
  minProfitPercent: number;
  minProfitUSD: number;
  maxSlippage: number;
  maxGasPriceGwei: number;
  refreshIntervalMs: number;
  opportunityTTLMs: number;
  monitoredTokens: string[];
  excludedDexes: DEX[];
  autoExecute: boolean;
  maxExecutionAmount: number;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface ArbitrageDetectorEvents {
  'opportunity:found': (opportunity: ArbitrageOpportunity) => void;
  'opportunity:expired': (opportunityId: string) => void;
  'opportunity:executed': (opportunity: ArbitrageOpportunity, txHash: string) => void;
  'prices:updated': (token: string, prices: DexPrice[]) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)',
  'function factory() external pure returns (address)'
];

const PAIR_ABI = [
  'function getReserves() view returns (uint112, uint112, uint32)',
  'function token0() view returns (address)',
  'function token1() view returns (address)'
];

const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns (address pair)'
];

const DEFAULT_CONFIG: ArbitrageConfig = {
  enabled: true,
  minProfitPercent: 0.5,      // 0.5% minimum profit
  minProfitUSD: 10,           // $10 minimum
  maxSlippage: 1,             // 1% max slippage
  maxGasPriceGwei: 50,
  refreshIntervalMs: 10000,   // 10 seconds
  opportunityTTLMs: 30000,    // 30 seconds
  monitoredTokens: [],
  excludedDexes: [],
  autoExecute: false,
  maxExecutionAmount: 1       // 1 ETH max
};

// ============================================================================
// MULTI-DEX ARBITRAGE DETECTOR
// ============================================================================

export class ArbitrageDetector extends EventEmitter<ArbitrageDetectorEvents> {
  private provider: JsonRpcProvider;
  private config: ArbitrageConfig;
  private cache: NodeCache;
  
  // DEX data
  private dexes: Map<DEX, { router: Contract; factory: Contract }> = new Map();
  private tokenPrices: Map<string, DexPrice[]> = new Map();
  private opportunities: Map<string, ArbitrageOpportunity> = new Map();
  
  // Monitoring
  private isRunning: boolean = false;
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor(customConfig?: Partial<ArbitrageConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.cache = new NodeCache({ stdTTL: 60, checkperiod: 30 });
    
    this.initializeDexes();
  }

  private initializeDexes(): void {
    // Uniswap V2
    if (!this.config.excludedDexes.includes(DEX.UNISWAP_V2)) {
      this.dexes.set(DEX.UNISWAP_V2, {
        router: new Contract(config.contracts.uniswapV2Router, ROUTER_ABI, this.provider),
        factory: new Contract(config.contracts.uniswapV2Factory, FACTORY_ABI, this.provider)
      });
    }
    
    // SushiSwap
    if (!this.config.excludedDexes.includes(DEX.SUSHISWAP)) {
      this.dexes.set(DEX.SUSHISWAP, {
        router: new Contract(config.contracts.sushiswapRouter, ROUTER_ABI, this.provider),
        factory: new Contract(config.contracts.sushiswapFactory, FACTORY_ABI, this.provider)
      });
    }
    
    logger.info(`[Arbitrage] Initialized ${this.dexes.size} DEXes`);
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    logger.info('[Arbitrage] Starting multi-DEX arbitrage detector...');
    this.isRunning = true;
    
    // Initial scan
    await this.scanAllTokens();
    
    // Start periodic refresh
    this.refreshInterval = setInterval(async () => {
      if (!this.isRunning) return;
      await this.scanAllTokens();
      this.cleanupExpiredOpportunities();
    }, this.config.refreshIntervalMs);
    
    logger.info('[Arbitrage] Arbitrage detector started');
  }

  stop(): void {
    this.isRunning = false;
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    logger.info('[Arbitrage] Arbitrage detector stopped');
  }

  // ==========================================================================
  // PRICE SCANNING
  // ==========================================================================

  private async scanAllTokens(): Promise<void> {
    const tokens = this.config.monitoredTokens;
    
    if (tokens.length === 0) {
      // Auto-discover tokens with liquidity on multiple DEXes
      // For now, skip if no tokens configured
      return;
    }
    
    for (const token of tokens) {
      try {
        const prices = await this.getPricesAcrossDexes(token);
        
        if (prices.length >= 2) {
          this.tokenPrices.set(token.toLowerCase(), prices);
          this.emit('prices:updated', token, prices);
          
          // Check for arbitrage opportunities
          this.findArbitrageOpportunity(token, prices);
        }
      } catch (error) {
        logger.debug(`[Arbitrage] Failed to get prices for ${token}`);
      }
    }
  }

  private async getPricesAcrossDexes(tokenAddress: string): Promise<DexPrice[]> {
    const prices: DexPrice[] = [];
    const weth = config.contracts.weth;
    
    for (const [dex, { router, factory }] of this.dexes) {
      try {
        // Get pair address
        const pairAddress = await factory.getPair(tokenAddress, weth);
        
        if (pairAddress === ethers.ZeroAddress) {
          continue;
        }
        
        // Get reserves
        const pair = new Contract(pairAddress, PAIR_ABI, this.provider);
        const [reserve0, reserve1, timestamp] = await pair.getReserves();
        const token0 = await pair.token0();
        
        // Determine which reserve is token and which is WETH
        let tokenReserve: bigint;
        let wethReserve: bigint;
        
        if (token0.toLowerCase() === tokenAddress.toLowerCase()) {
          tokenReserve = reserve0;
          wethReserve = reserve1;
        } else {
          tokenReserve = reserve1;
          wethReserve = reserve0;
        }
        
        // Calculate price (tokens per ETH)
        if (wethReserve > 0n && tokenReserve > 0n) {
          // Price = amount of tokens you get for 1 ETH
          const amountIn = ethers.parseEther('1');
          
          try {
            const path = [weth, tokenAddress];
            const amountsOut = await router.getAmountsOut(amountIn, path);
            const tokensOut = amountsOut[1];
            
            // Price in ETH per token
            const pricePerToken = 1 / Number(formatEther(tokensOut));
            
            // Estimate liquidity in USD (rough)
            const ethPrice = await this.getEthPrice();
            const liquidityUSD = Number(formatEther(wethReserve)) * ethPrice * 2;
            
            // Calculate price impact for 1 ETH
            const priceImpact = this.calculatePriceImpact(
              amountIn,
              wethReserve,
              tokenReserve
            );
            
            prices.push({
              dex,
              pairAddress,
              price: pricePerToken,
              priceImpact1ETH: priceImpact,
              liquidity: liquidityUSD,
              reserves: [tokenReserve, wethReserve],
              lastUpdated: Date.now()
            });
          } catch {
            // Skip if getAmountsOut fails
          }
        }
      } catch {
        // Skip DEX if any error
      }
    }
    
    return prices;
  }

  private calculatePriceImpact(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint
  ): number {
    // Using constant product formula: x * y = k
    // Price impact = 1 - (amountOut / expectedAmountOut)
    
    const amountInWithFee = amountIn * 997n;
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * 1000n + amountInWithFee;
    const amountOut = numerator / denominator;
    
    // Expected amount without impact
    const expectedOut = (amountIn * reserveOut) / reserveIn;
    
    if (expectedOut === 0n) return 0;
    
    const impact = 1 - Number(amountOut) / Number(expectedOut);
    return impact * 100;
  }

  // ==========================================================================
  // ARBITRAGE DETECTION
  // ==========================================================================

  private findArbitrageOpportunity(tokenAddress: string, prices: DexPrice[]): void {
    if (prices.length < 2) return;
    
    // Sort by price (lowest first = best buy)
    const sorted = [...prices].sort((a, b) => a.price - b.price);
    
    const buyPrice = sorted[0];
    const sellPrice = sorted[sorted.length - 1];
    
    // Calculate price difference
    const priceDiff = ((sellPrice.price - buyPrice.price) / buyPrice.price) * 100;
    
    // Check if meets minimum profit threshold
    if (priceDiff < this.config.minProfitPercent) {
      return;
    }
    
    // Calculate optimal trade size and profit
    const optimal = this.calculateOptimalTrade(buyPrice, sellPrice);
    
    // Check if meets minimum USD profit
    if (optimal.netProfitUSD < this.config.minProfitUSD) {
      return;
    }
    
    // Create opportunity
    const opportunity: ArbitrageOpportunity = {
      id: `arb_${tokenAddress.slice(0, 8)}_${Date.now()}`,
      tokenAddress: checksumAddress(tokenAddress),
      tokenSymbol: 'UNKNOWN', // Would fetch from token info
      
      buyDex: buyPrice.dex,
      sellDex: sellPrice.dex,
      buyPrice: buyPrice.price,
      sellPrice: sellPrice.price,
      priceDifferencePercent: priceDiff,
      
      optimalInputETH: optimal.inputETH,
      expectedProfitETH: optimal.grossProfitETH,
      expectedProfitUSD: optimal.grossProfitUSD,
      
      estimatedGasETH: optimal.gasETH,
      estimatedSlippage: optimal.slippage,
      netProfitETH: optimal.netProfitETH,
      netProfitUSD: optimal.netProfitUSD,
      
      liquidityBuy: buyPrice.liquidity,
      liquiditySell: sellPrice.liquidity,
      confidence: this.calculateConfidence(buyPrice, sellPrice, optimal),
      risk: this.assessRisk(optimal, buyPrice, sellPrice),
      
      buyPath: [config.contracts.weth, tokenAddress],
      sellPath: [tokenAddress, config.contracts.weth],
      requiresFlashLoan: optimal.inputETH > 5,
      
      discoveredAt: Date.now(),
      expiresAt: Date.now() + this.config.opportunityTTLMs,
      isStale: false
    };
    
    // Store and emit
    this.opportunities.set(opportunity.id, opportunity);
    this.emit('opportunity:found', opportunity);
    
    logger.info(`[Arbitrage] Found opportunity: ${opportunity.tokenSymbol} ${priceDiff.toFixed(2)}% diff, $${optimal.netProfitUSD.toFixed(2)} profit`);
    
    // Auto-execute if enabled
    if (this.config.autoExecute && opportunity.risk === 'LOW') {
      this.executeArbitrage(opportunity);
    }
  }

  private calculateOptimalTrade(
    buyPrice: DexPrice,
    sellPrice: DexPrice
  ): {
    inputETH: number;
    grossProfitETH: number;
    grossProfitUSD: number;
    gasETH: number;
    slippage: number;
    netProfitETH: number;
    netProfitUSD: number;
  } {
    // Start with a base amount and adjust for liquidity
    const maxFromLiquidity = Math.min(buyPrice.liquidity, sellPrice.liquidity) / 20; // 5% of liquidity
    const maxAmount = Math.min(maxFromLiquidity / 2000, this.config.maxExecutionAmount); // Cap by config
    
    // Calculate slippage at this size
    const slippage = (buyPrice.priceImpact1ETH + sellPrice.priceImpact1ETH) * (maxAmount / 1);
    
    // Price difference adjusted for slippage
    const effectiveDiff = ((sellPrice.price - buyPrice.price) / buyPrice.price) - slippage / 100;
    
    // Gross profit
    const grossProfitETH = maxAmount * effectiveDiff;
    const ethPrice = 2000; // Would fetch real price
    const grossProfitUSD = grossProfitETH * ethPrice;
    
    // Gas estimation (2 swaps)
    const gasLimit = 300000n;
    const gasPrice = 30000000000n; // 30 gwei
    const gasETH = Number(formatEther(gasLimit * gasPrice));
    
    // Net profit
    const netProfitETH = grossProfitETH - gasETH;
    const netProfitUSD = netProfitETH * ethPrice;
    
    return {
      inputETH: maxAmount,
      grossProfitETH,
      grossProfitUSD,
      gasETH,
      slippage,
      netProfitETH,
      netProfitUSD
    };
  }

  private calculateConfidence(
    buyPrice: DexPrice,
    sellPrice: DexPrice,
    optimal: { netProfitETH: number; slippage: number }
  ): number {
    let confidence = 0.5;
    
    // Higher liquidity = higher confidence
    if (buyPrice.liquidity > 100000 && sellPrice.liquidity > 100000) {
      confidence += 0.2;
    }
    
    // Lower slippage = higher confidence
    if (optimal.slippage < 0.5) {
      confidence += 0.15;
    }
    
    // Higher profit = higher confidence
    if (optimal.netProfitETH > 0.1) {
      confidence += 0.1;
    }
    
    // Fresh prices = higher confidence
    const priceAge = Math.max(
      Date.now() - buyPrice.lastUpdated,
      Date.now() - sellPrice.lastUpdated
    );
    if (priceAge < 5000) {
      confidence += 0.05;
    }
    
    return Math.min(0.95, confidence);
  }

  private assessRisk(
    optimal: { netProfitETH: number; slippage: number },
    buyPrice: DexPrice,
    sellPrice: DexPrice
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskScore = 0;
    
    // Low liquidity = higher risk
    if (buyPrice.liquidity < 50000 || sellPrice.liquidity < 50000) {
      riskScore += 2;
    } else if (buyPrice.liquidity < 100000 || sellPrice.liquidity < 100000) {
      riskScore += 1;
    }
    
    // High slippage = higher risk
    if (optimal.slippage > 2) {
      riskScore += 2;
    } else if (optimal.slippage > 1) {
      riskScore += 1;
    }
    
    // Low profit margin = higher risk
    if (optimal.netProfitETH < 0.05) {
      riskScore += 2;
    } else if (optimal.netProfitETH < 0.1) {
      riskScore += 1;
    }
    
    if (riskScore >= 4) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  // ==========================================================================
  // EXECUTION
  // ==========================================================================

  private async executeArbitrage(opportunity: ArbitrageOpportunity): Promise<void> {
    logger.info(`[Arbitrage] Executing arbitrage for ${opportunity.tokenSymbol}`);
    
    // This would integrate with ExecutionEngine
    // For now, just log the opportunity
    
    // In production:
    // 1. Buy tokens on buyDex
    // 2. Sell tokens on sellDex
    // 3. Or use flash swap for atomic execution
    
    logger.info(`[Arbitrage] Would execute: Buy on ${opportunity.buyDex}, Sell on ${opportunity.sellDex}`);
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  private cleanupExpiredOpportunities(): void {
    const now = Date.now();
    
    for (const [id, opportunity] of this.opportunities) {
      if (now > opportunity.expiresAt) {
        opportunity.isStale = true;
        this.opportunities.delete(id);
        this.emit('opportunity:expired', id);
      }
    }
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private async getEthPrice(): Promise<number> {
    const cached = this.cache.get<number>('ethPrice');
    if (cached) return cached;

    // Try CoinGecko API
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        { signal: AbortSignal.timeout(5000) }
      );
      const data = await response.json() as { ethereum?: { usd?: number } };
      
      if (data.ethereum?.usd) {
        const price = data.ethereum.usd;
        this.cache.set('ethPrice', price, 30);
        return price;
      }
    } catch (error) {
      logger.debug('[Arbitrage] CoinGecko price fetch failed');
    }

    // Fallback: Try DexScreener
    try {
      const response = await fetch(
        'https://api.dexscreener.com/latest/dex/tokens/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        { signal: AbortSignal.timeout(5000) }
      );
      const data = await response.json() as { pairs?: Array<{ priceUsd?: string }> };
      
      if (data.pairs?.[0]?.priceUsd) {
        const price = parseFloat(data.pairs[0].priceUsd);
        this.cache.set('ethPrice', price, 30);
        return price;
      }
    } catch (error) {
      logger.debug('[Arbitrage] DexScreener price fetch failed');
    }

    // Fallback: Try Chainlink oracle
    try {
      const chainlinkEthUsd = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';
      const chainlinkABI = ['function latestAnswer() view returns (int256)'];
      const oracle = new Contract(chainlinkEthUsd, chainlinkABI, this.provider);
      const answer = await oracle.latestAnswer();
      const price = Number(answer) / 1e8;
      this.cache.set('ethPrice', price, 30);
      return price;
    } catch (error) {
      logger.debug('[Arbitrage] Chainlink price fetch failed');
    }

    logger.warn('[Arbitrage] All ETH price sources failed');
    return 0;
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  addMonitoredToken(tokenAddress: string): void {
    const normalized = tokenAddress.toLowerCase();
    if (!this.config.monitoredTokens.includes(normalized)) {
      this.config.monitoredTokens.push(normalized);
      logger.info(`[Arbitrage] Added token to monitoring: ${tokenAddress}`);
    }
  }

  removeMonitoredToken(tokenAddress: string): void {
    const normalized = tokenAddress.toLowerCase();
    const index = this.config.monitoredTokens.indexOf(normalized);
    if (index > -1) {
      this.config.monitoredTokens.splice(index, 1);
      this.tokenPrices.delete(normalized);
      logger.info(`[Arbitrage] Removed token from monitoring: ${tokenAddress}`);
    }
  }

  getActiveOpportunities(): ArbitrageOpportunity[] {
    return Array.from(this.opportunities.values())
      .filter(o => !o.isStale)
      .sort((a, b) => b.netProfitUSD - a.netProfitUSD);
  }

  getOpportunity(id: string): ArbitrageOpportunity | undefined {
    return this.opportunities.get(id);
  }

  getTokenPrices(tokenAddress: string): DexPrice[] {
    return this.tokenPrices.get(tokenAddress.toLowerCase()) || [];
  }

  getConfig(): ArbitrageConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ArbitrageConfig>): void {
    this.config = { ...this.config, ...updates };
    logger.info('[Arbitrage] Configuration updated');
  }

  getStats(): {
    monitoredTokens: number;
    activeOpportunities: number;
    totalOpportunitiesFound: number;
    avgProfitPercent: number;
  } {
    const opportunities = this.getActiveOpportunities();
    const avgProfit = opportunities.length > 0
      ? opportunities.reduce((sum, o) => sum + o.priceDifferencePercent, 0) / opportunities.length
      : 0;
    
    return {
      monitoredTokens: this.config.monitoredTokens.length,
      activeOpportunities: opportunities.length,
      totalOpportunitiesFound: this.opportunities.size,
      avgProfitPercent: avgProfit
    };
  }

  // Force refresh prices for a token
  async refreshTokenPrices(tokenAddress: string): Promise<DexPrice[]> {
    const prices = await this.getPricesAcrossDexes(tokenAddress);
    
    if (prices.length >= 2) {
      this.tokenPrices.set(tokenAddress.toLowerCase(), prices);
      this.findArbitrageOpportunity(tokenAddress, prices);
    }
    
    return prices;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const arbitrageDetector = new ArbitrageDetector();
