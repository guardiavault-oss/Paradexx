// ============================================================================
// APEX SNIPER - Token Safety Analyzer
// Comprehensive honeypot detection and contract analysis
// ============================================================================

import { ethers, JsonRpcProvider, Contract, Interface } from 'ethers';
import axios from 'axios';
import NodeCache from 'node-cache';
import {
  TokenInfo,
  TokenSafetyAnalysis,
  SafetyFlag,
  SafetyFlagType,
  HoneypotTestResult,
  ContractAnalysis,
  LiquidityAnalysis,
  OwnerAnalysis,
  LPHolder,
  RiskLevel,
  DEX
} from '../types';
import { config, API_ENDPOINTS, SAFETY_THRESHOLDS } from '../config';
import {
  logger,
  checksumAddress,
  getTokenInfo,
  getPairInfo,
  formatUnits,
  retry
} from '../utils';

// ============================================================================
// CONSTANTS
// ============================================================================

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function transfer(address,uint256) returns (bool)',
  'function transferFrom(address,address,uint256) returns (bool)',
  'function owner() view returns (address)',
  'function getOwner() view returns (address)'
];

const PAIR_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112, uint112, uint32)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'
];

const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)',
  'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
  'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable'
];

// Suspicious function selectors to check for
const SUSPICIOUS_SELECTORS = {
  blacklist: ['0x404e5129', '0xecb8d348'], // addToBlacklist variants
  whitelist: ['0xe43252d7', '0x8b9e4d0d'], // addToWhitelist variants  
  pause: ['0x8456cb59', '0x02329a29'], // pause variants
  mint: ['0x40c10f19', '0xa0712d68'], // mint variants
  setFee: ['0x69fe0e2d', '0x8c0b5e22'], // setFee variants
  selfdestruct: ['0x9cb8a26a'] // selfdestruct
};

// Known lock contract patterns
const LOCK_CONTRACTS = [
  '0x663a5c229c09b049e36dcc11a9b0d4a8eb9db214', // Unicrypt
  '0xdead000000000000000000000000000000000000', // Dead address
  '0x000000000000000000000000000000000000dead', // Dead address
  '0x0000000000000000000000000000000000000000'  // Zero address
];

// ============================================================================
// TOKEN SAFETY ANALYZER
// ============================================================================

export class TokenSafetyAnalyzer {
  private provider: JsonRpcProvider;
  private cache: NodeCache;
  
  constructor() {
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.cache = new NodeCache({ 
      stdTTL: 300, // 5 minute cache
      checkperiod: 60 
    });
  }

  // ==========================================================================
  // MAIN ANALYSIS FUNCTION
  // ==========================================================================

  async analyzeToken(
    tokenAddress: string,
    pairAddress?: string
  ): Promise<TokenSafetyAnalysis> {
    const cacheKey = `analysis:${tokenAddress}`;
    const cached = this.cache.get<TokenSafetyAnalysis>(cacheKey);
    if (cached) return cached;
    
    logger.info(`Analyzing token safety: ${tokenAddress}`);
    
    const flags: SafetyFlag[] = [];
    
    // Run all analyses in parallel
    const [
      honeypotTest,
      contractAnalysis,
      liquidityAnalysis,
      ownerAnalysis,
      goplusData
    ] = await Promise.all([
      this.testHoneypot(tokenAddress, pairAddress),
      this.analyzeContract(tokenAddress),
      pairAddress ? this.analyzeLiquidity(tokenAddress, pairAddress) : this.analyzeLiquidity(tokenAddress),
      this.analyzeOwner(tokenAddress),
      this.fetchGoPlusData(tokenAddress)
    ]);
    
    // Collect flags from honeypot test
    if (honeypotTest.isHoneypot) {
      flags.push({
        type: SafetyFlagType.HONEYPOT,
        severity: 'CRITICAL',
        message: 'Token detected as honeypot - cannot sell',
        data: { buyTax: honeypotTest.buyTax, sellTax: honeypotTest.sellTax }
      });
    }
    
    if (honeypotTest.buyTax > SAFETY_THRESHOLDS.maxBuyTax) {
      flags.push({
        type: SafetyFlagType.HIGH_TAX,
        severity: 'WARNING',
        message: `High buy tax: ${honeypotTest.buyTax}%`,
        data: { buyTax: honeypotTest.buyTax }
      });
    }
    
    if (honeypotTest.sellTax > SAFETY_THRESHOLDS.maxSellTax) {
      flags.push({
        type: SafetyFlagType.HIGH_TAX,
        severity: 'CRITICAL',
        message: `High sell tax: ${honeypotTest.sellTax}%`,
        data: { sellTax: honeypotTest.sellTax }
      });
    }
    
    // Collect flags from contract analysis
    if (contractAnalysis.hasBlacklist) {
      flags.push({
        type: SafetyFlagType.BLACKLIST,
        severity: 'WARNING',
        message: 'Contract has blacklist functionality'
      });
    }
    
    if (contractAnalysis.hasWhitelist) {
      flags.push({
        type: SafetyFlagType.WHITELIST,
        severity: 'WARNING',
        message: 'Contract has whitelist functionality'
      });
    }
    
    if (contractAnalysis.hasPauseFunction) {
      flags.push({
        type: SafetyFlagType.PAUSE_FUNCTION,
        severity: 'WARNING',
        message: 'Contract can be paused'
      });
    }
    
    if (contractAnalysis.hasMintFunction) {
      flags.push({
        type: SafetyFlagType.MINT_FUNCTION,
        severity: 'WARNING',
        message: 'Contract has mint functionality'
      });
    }
    
    if (contractAnalysis.hasModifiableTax) {
      flags.push({
        type: SafetyFlagType.MODIFIABLE_TAX,
        severity: 'WARNING',
        message: 'Tax rates can be modified'
      });
    }
    
    if (contractAnalysis.isProxy) {
      flags.push({
        type: SafetyFlagType.PROXY_CONTRACT,
        severity: 'INFO',
        message: 'Contract is a proxy - implementation can change'
      });
    }
    
    if (!contractAnalysis.verified) {
      flags.push({
        type: SafetyFlagType.UNVERIFIED_CONTRACT,
        severity: 'WARNING',
        message: 'Contract source code not verified'
      });
    }
    
    if (contractAnalysis.hasHiddenOwner) {
      flags.push({
        type: SafetyFlagType.HIDDEN_OWNER,
        severity: 'CRITICAL',
        message: 'Contract has hidden owner functionality'
      });
    }
    
    // Collect flags from liquidity analysis
    if (liquidityAnalysis.totalLiquidityUSD < SAFETY_THRESHOLDS.minLiquidityUSD) {
      flags.push({
        type: SafetyFlagType.LOW_LIQUIDITY,
        severity: 'WARNING',
        message: `Low liquidity: $${liquidityAnalysis.totalLiquidityUSD.toFixed(2)}`,
        data: { liquidity: liquidityAnalysis.totalLiquidityUSD }
      });
    }
    
    if (!liquidityAnalysis.isLocked) {
      flags.push({
        type: SafetyFlagType.UNLOCKED_LIQUIDITY,
        severity: 'WARNING',
        message: 'Liquidity is not locked'
      });
    }
    
    // Collect flags from owner analysis
    if (!ownerAnalysis.isRenounced && ownerAnalysis.ownerPercentage > SAFETY_THRESHOLDS.maxOwnerHoldings) {
      flags.push({
        type: SafetyFlagType.HIGH_HOLDER_CONCENTRATION,
        severity: 'WARNING',
        message: `Owner holds ${ownerAnalysis.ownerPercentage.toFixed(1)}% of supply`,
        data: { percentage: ownerAnalysis.ownerPercentage }
      });
    }
    
    // Calculate safety score
    const score = this.calculateSafetyScore(flags, honeypotTest, contractAnalysis, liquidityAnalysis);
    const riskLevel = this.determineRiskLevel(score, flags);
    
    const analysis: TokenSafetyAnalysis = {
      token: checksumAddress(tokenAddress),
      riskLevel,
      score,
      flags,
      honeypotTest,
      contractAnalysis,
      liquidityAnalysis,
      ownerAnalysis,
      timestamp: Date.now()
    };
    
    this.cache.set(cacheKey, analysis);
    
    logger.info(`Token ${tokenAddress} analysis complete: ${riskLevel} (score: ${score})`);
    
    return analysis;
  }

  // ==========================================================================
  // HONEYPOT TESTING
  // ==========================================================================

  async testHoneypot(
    tokenAddress: string,
    pairAddress?: string
  ): Promise<HoneypotTestResult> {
    try {
      // Try honeypot.is API first
      const honeypotIsResult = await this.checkHoneypotIs(tokenAddress);
      if (honeypotIsResult) return honeypotIsResult;
      
      // Fallback to simulation
      return await this.simulateHoneypot(tokenAddress, pairAddress);
    } catch (error) {
      logger.error(`Honeypot test failed for ${tokenAddress}:`, error);
      return {
        isHoneypot: false,
        buyTax: 0,
        sellTax: 0,
        transferTax: 0,
        buyGas: 0,
        sellGas: 0,
        error: 'Test failed'
      };
    }
  }

  private async checkHoneypotIs(tokenAddress: string): Promise<HoneypotTestResult | null> {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.honeypotIs}/IsHoneypot`,
        {
          params: {
            address: tokenAddress,
            chainID: config.chainId
          },
          timeout: 5000
        }
      );
      
      const data = response.data;
      
      if (data.simulationSuccess === false) {
        return null;
      }
      
      return {
        isHoneypot: data.honeypotResult?.isHoneypot || false,
        buyTax: data.simulationResult?.buyTax || 0,
        sellTax: data.simulationResult?.sellTax || 0,
        transferTax: data.simulationResult?.transferTax || 0,
        buyGas: data.simulationResult?.buyGas || 0,
        sellGas: data.simulationResult?.sellGas || 0,
        maxBuy: data.maxBuy ? BigInt(data.maxBuy) : undefined,
        maxSell: data.maxSell ? BigInt(data.maxSell) : undefined,
        maxWallet: data.maxWallet ? BigInt(data.maxWallet) : undefined
      };
    } catch {
      return null;
    }
  }

  private async simulateHoneypot(
    tokenAddress: string,
    pairAddress?: string
  ): Promise<HoneypotTestResult> {
    // Basic simulation using eth_call
    const router = new Contract(
      config.contracts.uniswapV2Router,
      ROUTER_ABI,
      this.provider
    );
    
    const weth = config.contracts.weth;
    const testAmount = ethers.parseEther('0.1');
    
    try {
      // Test buy
      const buyPath = [weth, tokenAddress];
      const buyAmounts = await router.getAmountsOut(testAmount, buyPath);
      const expectedTokens = buyAmounts[1];
      
      // Test sell
      const sellPath = [tokenAddress, weth];
      const sellAmounts = await router.getAmountsOut(expectedTokens, sellPath);
      const finalEth = sellAmounts[1];
      
      // Calculate effective tax
      const totalLoss = testAmount - finalEth;
      const totalTaxPercent = Number(totalLoss * 10000n / testAmount) / 100;
      
      // Estimate buy/sell split (assuming equal)
      const estimatedBuyTax = totalTaxPercent / 2;
      const estimatedSellTax = totalTaxPercent / 2;
      
      // Check if it's a honeypot (can't sell)
      const isHoneypot = finalEth === 0n || totalTaxPercent > 90;
      
      return {
        isHoneypot,
        buyTax: estimatedBuyTax,
        sellTax: estimatedSellTax,
        transferTax: 0,
        buyGas: 150000,
        sellGas: 200000
      };
    } catch (error) {
      // If simulation fails, likely a honeypot
      return {
        isHoneypot: true,
        buyTax: 0,
        sellTax: 100,
        transferTax: 0,
        buyGas: 0,
        sellGas: 0,
        error: 'Simulation failed - likely honeypot'
      };
    }
  }

  // ==========================================================================
  // CONTRACT ANALYSIS
  // ==========================================================================

  async analyzeContract(tokenAddress: string): Promise<ContractAnalysis> {
    const result: ContractAnalysis = {
      verified: false,
      isProxy: false,
      hasBlacklist: false,
      hasWhitelist: false,
      hasPauseFunction: false,
      hasMintFunction: false,
      hasModifiableTax: false,
      hasSelfDestruct: false,
      hasHiddenOwner: false,
      suspiciousFunctions: [],
      similarContracts: []
    };
    
    try {
      // Get contract bytecode
      const bytecode = await this.provider.getCode(tokenAddress);
      if (bytecode === '0x') return result;
      
      // Check for suspicious function selectors in bytecode
      for (const [name, selectors] of Object.entries(SUSPICIOUS_SELECTORS)) {
        for (const selector of selectors) {
          if (bytecode.includes(selector.slice(2))) {
            switch (name) {
              case 'blacklist':
                result.hasBlacklist = true;
                break;
              case 'whitelist':
                result.hasWhitelist = true;
                break;
              case 'pause':
                result.hasPauseFunction = true;
                break;
              case 'mint':
                result.hasMintFunction = true;
                break;
              case 'setFee':
                result.hasModifiableTax = true;
                break;
              case 'selfdestruct':
                result.hasSelfDestruct = true;
                break;
            }
            result.suspiciousFunctions.push(name);
          }
        }
      }
      
      // Check if proxy (simple check for delegate call pattern)
      if (bytecode.includes('363d3d373d3d3d363d73')) {
        result.isProxy = true;
      }
      
      // Check Etherscan verification
      result.verified = await this.checkEtherscanVerification(tokenAddress);
      
      // Check for hidden owner patterns
      result.hasHiddenOwner = await this.checkHiddenOwner(tokenAddress, bytecode);
      
    } catch (error) {
      logger.error(`Contract analysis failed for ${tokenAddress}:`, error);
    }
    
    return result;
  }

  private async checkEtherscanVerification(tokenAddress: string): Promise<boolean> {
    try {
      const endpoint = config.chainId === 1 
        ? API_ENDPOINTS.etherscan.mainnet 
        : API_ENDPOINTS.etherscan.sepolia;
        
      const response = await axios.get(endpoint, {
        params: {
          module: 'contract',
          action: 'getabi',
          address: tokenAddress,
          apikey: config.etherscanApiKey
        },
        timeout: 5000
      });
      
      return response.data.status === '1';
    } catch {
      return false;
    }
  }

  private async checkHiddenOwner(tokenAddress: string, bytecode: string): Promise<boolean> {
    // Check for patterns that indicate hidden owner functionality
    // This is a simplified check - real implementation would be more thorough
    
    // Check if there's an owner variable but owner() returns address(0)
    try {
      const contract = new Contract(tokenAddress, ERC20_ABI, this.provider);
      const owner = await contract.owner().catch(() => null);
      
      if (owner === ethers.ZeroAddress) {
        // Owner is supposedly renounced, check if there are still owner-like functions
        const ownerPatterns = ['onlyOwner', 'owner()', '_owner'];
        for (const pattern of ownerPatterns) {
          if (bytecode.toLowerCase().includes(ethers.id(pattern).slice(2, 10))) {
            return true; // Has owner-like functions despite renounced
          }
        }
      }
    } catch {
      // Ignore errors
    }
    
    return false;
  }

  // ==========================================================================
  // LIQUIDITY ANALYSIS
  // ==========================================================================

  async analyzeLiquidity(
    tokenAddress: string,
    pairAddress?: string
  ): Promise<LiquidityAnalysis> {
    const result: LiquidityAnalysis = {
      totalLiquidityUSD: 0,
      mainPairAddress: '',
      mainPairDex: DEX.UNISWAP_V2,
      isLocked: false,
      lpHolders: []
    };
    
    try {
      // Find pair if not provided
      if (!pairAddress) {
        const foundPair = await this.findMainPair(tokenAddress);
        if (!foundPair) return result;
        pairAddress = foundPair;
      }
      
      result.mainPairAddress = checksumAddress(pairAddress);
      
      // Get pair info
      const pairInfo = await getPairInfo(this.provider, pairAddress);
      if (!pairInfo) return result;
      
      // Get ETH price
      const ethPrice = await this.getEthPrice();
      
      // Calculate liquidity
      const wethAddress = config.contracts.weth.toLowerCase();
      let ethReserve: bigint;
      
      if (pairInfo.token0.toLowerCase() === wethAddress) {
        ethReserve = pairInfo.reserves[0];
      } else if (pairInfo.token1.toLowerCase() === wethAddress) {
        ethReserve = pairInfo.reserves[1];
      } else {
        // Neither token is WETH, need to find WETH value differently
        ethReserve = 0n;
      }
      
      const ethValue = Number(formatUnits(ethReserve, 18));
      result.totalLiquidityUSD = ethValue * ethPrice * 2; // *2 because pool has both sides
      
      // Get LP holders
      result.lpHolders = await this.getLPHolders(pairAddress);
      
      // Check if locked
      result.isLocked = this.checkLPLocked(result.lpHolders);
      
      // Find lock details if locked
      for (const holder of result.lpHolders) {
        if (holder.isLockContract) {
          result.lockAddress = holder.address;
          break;
        }
      }
      
    } catch (error) {
      logger.error(`Liquidity analysis failed for ${tokenAddress}:`, error);
    }
    
    return result;
  }

  private async findMainPair(tokenAddress: string): Promise<string | null> {
    // Check Uniswap V2
    const factory = new Contract(
      config.contracts.uniswapV2Factory,
      ['function getPair(address, address) view returns (address)'],
      this.provider
    );
    
    try {
      const pair = await factory.getPair(tokenAddress, config.contracts.weth);
      if (pair !== ethers.ZeroAddress) {
        return pair;
      }
    } catch {
      // Ignore
    }
    
    // Check SushiSwap
    try {
      const sushiFactory = new Contract(
        config.contracts.sushiswapFactory,
        ['function getPair(address, address) view returns (address)'],
        this.provider
      );
      
      const pair = await sushiFactory.getPair(tokenAddress, config.contracts.weth);
      if (pair !== ethers.ZeroAddress) {
        return pair;
      }
    } catch {
      // Ignore
    }
    
    return null;
  }

  private async getLPHolders(pairAddress: string): Promise<LPHolder[]> {
    const holders: LPHolder[] = [];
    
    try {
      const pair = new Contract(pairAddress, PAIR_ABI, this.provider);
      const totalSupply = await pair.totalSupply();
      
      // Check known lock contracts
      for (const lockAddr of LOCK_CONTRACTS) {
        try {
          const balance = await pair.balanceOf(lockAddr);
          if (balance > 0n) {
            const percentage = Number(balance * 10000n / totalSupply) / 100;
            holders.push({
              address: lockAddr,
              balance,
              percentage,
              isContract: true,
              isLockContract: true
            });
          }
        } catch {
          // Ignore
        }
      }
      
      // Note: Full holder analysis would require Etherscan API or event scanning
      
    } catch (error) {
      logger.error(`Failed to get LP holders for ${pairAddress}:`, error);
    }
    
    return holders;
  }

  private checkLPLocked(holders: LPHolder[]): boolean {
    // Check if significant portion is in lock contracts
    const lockedPercentage = holders
      .filter(h => h.isLockContract)
      .reduce((sum, h) => sum + h.percentage, 0);
      
    return lockedPercentage > 50;
  }

  private async getEthPrice(): Promise<number> {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.coingecko}/simple/price`,
        {
          params: {
            ids: 'ethereum',
            vs_currencies: 'usd'
          },
          timeout: 5000
        }
      );
      
      return response.data.ethereum.usd;
    } catch {
      return 2000; // Fallback price
    }
  }

  // ==========================================================================
  // OWNER ANALYSIS
  // ==========================================================================

  async analyzeOwner(tokenAddress: string): Promise<OwnerAnalysis> {
    const result: OwnerAnalysis = {
      isRenounced: false,
      ownerBalance: 0n,
      ownerPercentage: 0,
      ownerTransactions: 0,
      previousProjects: []
    };
    
    try {
      const token = new Contract(tokenAddress, ERC20_ABI, this.provider);
      
      // Get owner
      let owner: string | null = null;
      try {
        owner = await token.owner();
      } catch {
        try {
          owner = await token.getOwner();
        } catch {
          // No owner function
        }
      }
      
      if (!owner || owner === ethers.ZeroAddress) {
        result.isRenounced = true;
        return result;
      }
      
      result.ownerAddress = checksumAddress(owner);
      
      // Get owner balance
      const [ownerBalance, totalSupply] = await Promise.all([
        token.balanceOf(owner),
        token.totalSupply()
      ]);
      
      result.ownerBalance = ownerBalance;
      result.ownerPercentage = Number(ownerBalance * 10000n / totalSupply) / 100;
      
      // Note: Full owner analysis would check their history on-chain
      
    } catch (error) {
      logger.error(`Owner analysis failed for ${tokenAddress}:`, error);
    }
    
    return result;
  }

  // ==========================================================================
  // EXTERNAL DATA SOURCES
  // ==========================================================================

  private async fetchGoPlusData(tokenAddress: string): Promise<any> {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.goplusLabs}/token_security/${config.chainId}`,
        {
          params: { contract_addresses: tokenAddress },
          timeout: 5000
        }
      );
      
      return response.data.result?.[tokenAddress.toLowerCase()];
    } catch {
      return null;
    }
  }

  // ==========================================================================
  // SCORING
  // ==========================================================================

  private calculateSafetyScore(
    flags: SafetyFlag[],
    honeypot: HoneypotTestResult,
    contract: ContractAnalysis,
    liquidity: LiquidityAnalysis
  ): number {
    let score = 100;
    
    // Deduct for flags
    for (const flag of flags) {
      switch (flag.severity) {
        case 'CRITICAL':
          score -= 30;
          break;
        case 'WARNING':
          score -= 10;
          break;
        case 'INFO':
          score -= 2;
          break;
      }
    }
    
    // Bonus for positive signals
    if (contract.verified) score += 5;
    if (liquidity.isLocked) score += 10;
    if (liquidity.totalLiquidityUSD > 50000) score += 5;
    if (honeypot.buyTax < 3 && honeypot.sellTax < 3) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private determineRiskLevel(score: number, flags: SafetyFlag[]): RiskLevel {
    // Check for immediate disqualifiers
    if (flags.some(f => f.type === SafetyFlagType.HONEYPOT)) {
      return RiskLevel.HONEYPOT;
    }
    
    if (flags.filter(f => f.severity === 'CRITICAL').length >= 2) {
      return RiskLevel.CRITICAL;
    }
    
    if (score >= 80) return RiskLevel.SAFE;
    if (score >= 60) return RiskLevel.LOW;
    if (score >= 40) return RiskLevel.MEDIUM;
    if (score >= 20) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  // ==========================================================================
  // QUICK CHECKS
  // ==========================================================================

  async quickSafetyCheck(tokenAddress: string): Promise<{
    safe: boolean;
    reason?: string;
  }> {
    // Fast safety check for time-sensitive operations
    const honeypot = await this.testHoneypot(tokenAddress);
    
    if (honeypot.isHoneypot) {
      return { safe: false, reason: 'Honeypot detected' };
    }
    
    if (honeypot.sellTax > SAFETY_THRESHOLDS.maxSellTax) {
      return { safe: false, reason: `Sell tax too high: ${honeypot.sellTax}%` };
    }
    
    if (honeypot.buyTax > SAFETY_THRESHOLDS.maxBuyTax) {
      return { safe: false, reason: `Buy tax too high: ${honeypot.buyTax}%` };
    }
    
    return { safe: true };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const tokenAnalyzer = new TokenSafetyAnalyzer();
