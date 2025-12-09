// ============================================================================
// APEX SNIPER - On-Chain Scanner Service
// Monitors blockchain for new pairs, smart money activity, and trading signals
// ============================================================================

import EventEmitter from 'eventemitter3';
import { ethers, JsonRpcProvider, Contract, WebSocketProvider } from 'ethers';
import NodeCache from 'node-cache';
import {
  OnChainSignals,
  SmartWallet,
  NewPairEvent,
  TokenInfo,
  DEX,
  MemeHunterConfig
} from '../types';
import { config, KNOWN_FACTORIES } from '../config';
import {
  logger,
  generateId,
  checksumAddress,
  getTokenInfo,
  getPairInfo,
  formatEther,
  formatUnits,
  isContract
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
  'function owner() view returns (address)'
];

const PAIR_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112, uint112, uint32)',
  'function totalSupply() view returns (uint256)',
  'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)'
];

const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns (address pair)',
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint)'
];

// Known smart money addresses (would be loaded from database in production)
const INITIAL_SMART_WALLETS: SmartWallet[] = [
  {
    address: '0x5Dd9AA6a8F8e8B99eDE02A119a4A79A6b7F78bFC',
    label: 'DeFi Whale Alpha',
    winRate: 0.78,
    avgROI: 145,
    totalTrades: 234,
    avgHoldTime: 4.2,
    lastActive: Date.now(),
    tags: ['early_buyer', 'high_conviction']
  }
];

// ============================================================================
// EVENTS
// ============================================================================

export interface OnChainScannerEvents {
  'pair:created': (event: NewPairEvent) => void;
  'token:analyzed': (address: string, signals: OnChainSignals) => void;
  'smartMoney:buy': (wallet: SmartWallet, token: string, amount: bigint) => void;
  'smartMoney:sell': (wallet: SmartWallet, token: string, amount: bigint) => void;
  'holder:spike': (token: string, newHolders: number, percentChange: number) => void;
  'volume:spike': (token: string, volume: number, percentChange: number) => void;
}

// ============================================================================
// ON-CHAIN SCANNER SERVICE
// ============================================================================

export class OnChainScanner extends EventEmitter<OnChainScannerEvents> {
  private provider: JsonRpcProvider;
  private wsProvider: WebSocketProvider | null = null;
  private isRunning: boolean = false;
  private config: MemeHunterConfig;
  
  // Data stores
  private smartWallets: Map<string, SmartWallet> = new Map();
  private tokenSignalsCache: NodeCache;
  private holderSnapshots: Map<string, { count: number; timestamp: number }[]> = new Map();
  private volumeSnapshots: Map<string, { volume: number; timestamp: number }[]> = new Map();
  /** Maps token address to set of early buyer addresses */
  private earlyBuyers: Map<string, Set<string>> = new Map();
  
  // Event listeners
  private factoryListeners: Map<string, any> = new Map();

  constructor(memeHunterConfig: MemeHunterConfig) {
    super();
    this.config = memeHunterConfig;
    this.provider = new JsonRpcProvider(config.rpcUrl);
    
    // Initialize cache with 5 minute TTL
    this.tokenSignalsCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
    
    // Load initial smart wallets
    this.loadSmartWallets();
  }

  private loadSmartWallets(): void {
    for (const wallet of INITIAL_SMART_WALLETS) {
      this.smartWallets.set(wallet.address.toLowerCase(), wallet);
    }
    logger.info(`[OnChainScanner] Loaded ${this.smartWallets.size} smart wallets`);
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    logger.info('[OnChainScanner] Starting on-chain monitoring...');
    this.isRunning = true;
    
    // Connect WebSocket for real-time events
    await this.connectWebSocket();
    
    // Start factory monitoring
    await this.startFactoryMonitoring();
    
    // Start smart money tracking
    this.startSmartMoneyTracking();
    
    // Start periodic analysis
    this.startPeriodicAnalysis();
    
    logger.info('[OnChainScanner] On-chain monitoring started');
  }

  async stop(): Promise<void> {
    logger.info('[OnChainScanner] Stopping on-chain monitoring...');
    this.isRunning = false;
    
    // Remove factory listeners
    for (const [factory, listener] of this.factoryListeners) {
      this.provider.off(listener);
    }
    this.factoryListeners.clear();
    
    // Close WebSocket
    if (this.wsProvider) {
      await this.wsProvider.destroy();
      this.wsProvider = null;
    }
    
    logger.info('[OnChainScanner] On-chain monitoring stopped');
  }

  private async connectWebSocket(): Promise<void> {
    try {
      this.wsProvider = new WebSocketProvider(config.wsRpcUrl);
      
      // Monitor pending transactions for smart money
      this.wsProvider.on('pending', (txHash: string) => {
        this.processPendingTransaction(txHash).catch(() => {});
      });
      
      logger.info('[OnChainScanner] WebSocket connected');
    } catch (error) {
      logger.warn('[OnChainScanner] WebSocket connection failed, using HTTP polling');
    }
  }

  // ==========================================================================
  // FACTORY MONITORING
  // ==========================================================================

  private async startFactoryMonitoring(): Promise<void> {
    // Monitor known DEX factories for new pairs
    const factories = [
      { address: config.contracts.uniswapV2Factory, name: 'Uniswap V2', dex: DEX.UNISWAP_V2 },
      { address: config.contracts.sushiswapFactory, name: 'SushiSwap', dex: DEX.SUSHISWAP }
    ];
    
    for (const factory of factories) {
      try {
        await this.monitorFactory(factory.address, factory.name, factory.dex);
      } catch (error) {
        logger.error(`[OnChainScanner] Failed to monitor ${factory.name}:`, error);
      }
    }
  }

  private async monitorFactory(
    factoryAddress: string,
    factoryName: string,
    dex: DEX
  ): Promise<void> {
    const factory = new Contract(factoryAddress, FACTORY_ABI, this.provider);
    
    // Listen for PairCreated events
    const filter = factory.filters.PairCreated();
    
    factory.on(filter, async (token0: string, token1: string, pair: string, _: bigint, event: any) => {
      if (!this.isRunning) return;
      
      try {
        // Get transaction details
        const tx = await event.getTransaction();
        const block = await event.getBlock();
        
        const pairEvent: NewPairEvent = {
          pair: checksumAddress(pair),
          token0: checksumAddress(token0),
          token1: checksumAddress(token1),
          factory: factoryAddress,
          dex,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: block?.timestamp ? block.timestamp * 1000 : Date.now(),
          deployer: checksumAddress(tx.from)
        };
        
        logger.info(`[OnChainScanner] New pair created on ${factoryName}: ${pairEvent.pair}`);
        
        // Check if it's a WETH pair (most interesting for trading)
        const weth = config.contracts.weth.toLowerCase();
        if (token0.toLowerCase() === weth || token1.toLowerCase() === weth) {
          this.emit('pair:created', pairEvent);
          
          // Start analyzing the new token
          const newToken = token0.toLowerCase() === weth ? token1 : token0;
          this.analyzeNewToken(newToken, pair, dex);
        }
      } catch (error) {
        logger.error('[OnChainScanner] Error processing PairCreated event:', error);
      }
    });
    
    logger.info(`[OnChainScanner] Monitoring ${factoryName} factory for new pairs`);
  }

  // ==========================================================================
  // TOKEN ANALYSIS
  // ==========================================================================

  private async analyzeNewToken(
    tokenAddress: string,
    pairAddress: string,
    dex: DEX
  ): Promise<void> {
    try {
      const signals = await this.getOnChainSignals(tokenAddress, pairAddress);
      
      // Cache the signals
      this.tokenSignalsCache.set(`signals_${tokenAddress.toLowerCase()}`, signals);
      
      // Emit analysis complete
      this.emit('token:analyzed', tokenAddress, signals);
      
      // Start tracking this token
      this.startTokenTracking(tokenAddress, pairAddress);
      
    } catch (error) {
      logger.error(`[OnChainScanner] Failed to analyze token ${tokenAddress}:`, error);
    }
  }

  async getOnChainSignals(
    tokenAddress: string,
    pairAddress?: string
  ): Promise<OnChainSignals> {
    const address = tokenAddress.toLowerCase();
    
    // Check cache first
    const cached = this.tokenSignalsCache.get<OnChainSignals>(`signals_${address}`);
    if (cached) return cached;
    
    // Find pair if not provided
    if (!pairAddress) {
      pairAddress = await this.findPair(tokenAddress);
    }
    
    // Get token contract
    const token = new Contract(tokenAddress, ERC20_ABI, this.provider);
    
    // Get basic token info
    const [totalSupply, owner] = await Promise.all([
      token.totalSupply().catch(() => 0n),
      token.owner().catch(() => ethers.ZeroAddress)
    ]);
    
    // Get pair info if available
    let liquidityUSD = 0;
    let reserves: [bigint, bigint] = [0n, 0n];
    
    if (pairAddress) {
      const pairInfo = await getPairInfo(this.provider, pairAddress);
      if (pairInfo) {
        reserves = pairInfo.reserves;
        const wethAddress = config.contracts.weth.toLowerCase();
        const ethReserve = pairInfo.token0.toLowerCase() === wethAddress 
          ? reserves[0] 
          : reserves[1];
        const ethPrice = await this.getEthPrice();
        liquidityUSD = Number(formatEther(ethReserve)) * ethPrice * 2;
      }
    }
    
    // Get contract age
    const contractAge = await this.getContractAge(tokenAddress);
    
    // Get holder count estimate (simplified - would use Etherscan API in production)
    const holderInfo = await this.estimateHolderInfo(tokenAddress, totalSupply);
    
    // Get trading metrics from recent swaps
    const tradingMetrics = pairAddress 
      ? await this.getTradingMetrics(pairAddress) 
      : this.getEmptyTradingMetrics();
    
    // Check for smart money
    const smartMoneyInfo = await this.checkSmartMoney(tokenAddress);
    
    // Check contract safety (simplified)
    const contractCode = await this.provider.getCode(tokenAddress);
    const hasMint = contractCode.includes('40c10f19'); // mint(address,uint256)
    const hasBlacklist = contractCode.includes('404e5129'); // blacklist signature
    
    const signals: OnChainSignals = {
      // Liquidity
      totalLiquidity: reserves[0] + reserves[1],
      liquidityUSD,
      liquidityGrowth24h: 0, // Would track over time
      lpLocked: false, // Would check lock contracts
      lpLockDuration: 0,
      
      // Trading
      volume24h: tradingMetrics.volume,
      volumeGrowth: 0,
      txCount24h: tradingMetrics.txCount,
      buyPressure: tradingMetrics.buyPressure,
      avgBuySize: tradingMetrics.avgBuySize,
      avgSellSize: tradingMetrics.avgSellSize,
      uniqueBuyers24h: tradingMetrics.uniqueBuyers,
      uniqueSellers24h: tradingMetrics.uniqueSellers,
      
      // Holders
      totalHolders: holderInfo.count,
      holderGrowth24h: 0,
      top10Concentration: holderInfo.top10Percent,
      whaleCount: holderInfo.whaleCount,
      freshWallets: holderInfo.freshWallets,
      snipedAmount: 0, // Would track first block buys
      
      // Contract
      contractAge,
      isVerified: false, // Would check Etherscan
      hasHoneypot: false, // Would run simulation
      hasMintFunction: hasMint,
      hasBlacklist: hasBlacklist,
      maxTxAmount: 0n,
      maxWalletAmount: 0n,
      buyTax: 0,
      sellTax: 0,
      isOwnershipRenounced: owner === ethers.ZeroAddress,
      
      // Smart money
      smartWalletsBuying: smartMoneyInfo.wallets,
      avgSmartMoneyEntry: smartMoneyInfo.avgEntry,
      smartMoneyPnL: smartMoneyInfo.pnl,
      copytradeScore: smartMoneyInfo.score
    };
    
    // Cache result
    this.tokenSignalsCache.set(`signals_${address}`, signals);
    
    return signals;
  }

  private async findPair(tokenAddress: string): Promise<string | undefined> {
    const factory = new Contract(
      config.contracts.uniswapV2Factory,
      FACTORY_ABI,
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
    
    return undefined;
  }

  private async getContractAge(address: string): Promise<number> {
    try {
      // In production, use Etherscan API for deployment timestamp
      // For now, estimate based on current block
      const code = await this.provider.getCode(address);
      if (code === '0x') return 0;
      
      // Use Etherscan API to get contract creation block/timestamp
      const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
      if (etherscanApiKey) {
        try {
          const response = await fetch(
            `https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${etherscanApiKey}`
          );
          const data = await response.json() as { 
            status: string; 
            result?: Array<{ txHash?: string }> 
          };
          
          if (data.status === '1' && data.result?.[0]?.txHash) {
            const tx = await this.provider.getTransaction(data.result[0].txHash);
            if (tx?.blockNumber) {
              const block = await this.provider.getBlock(tx.blockNumber);
              if (block?.timestamp) {
                const ageInSeconds = Math.floor(Date.now() / 1000) - block.timestamp;
                return Math.floor(ageInSeconds / 3600); // Convert to hours
              }
            }
          }
        } catch (error) {
          logger.debug(`[OnChainScanner] Failed to get contract age from Etherscan: ${error}`);
        }
      }
      
      // Fallback: Estimate based on binary search of blocks
      return await this.estimateContractAgeFromBlocks(address);
    } catch {
      return 0;
    }
  }

  private async estimateContractAgeFromBlocks(address: string): Promise<number> {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      let low = currentBlock - 50000; // ~1 week back
      let high = currentBlock;
      
      // Binary search to find when contract was deployed
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        try {
          const code = await this.provider.getCode(address, mid);
          if (code === '0x' || code === '0x0') {
            low = mid + 1;
          } else {
            high = mid;
          }
        } catch {
          low = mid + 1;
        }
      }
      
      // Get timestamp from deployment block
      if (high < currentBlock) {
        const block = await this.provider.getBlock(high);
        if (block?.timestamp) {
          const ageInSeconds = Math.floor(Date.now() / 1000) - block.timestamp;
          return Math.floor(ageInSeconds / 3600);
        }
      }
      
      return 0;
    } catch {
      return 0;
    }
  }

  private async estimateHolderInfo(
    tokenAddress: string,
    totalSupply: bigint
  ): Promise<{
    count: number;
    top10Percent: number;
    whaleCount: number;
    freshWallets: number;
  }> {
    // Use Etherscan API for holder data
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
    
    if (etherscanApiKey) {
      try {
        // Get token holder list from Etherscan
        const response = await fetch(
          `https://api.etherscan.io/api?module=token&action=tokenholderlist&contractaddress=${tokenAddress}&page=1&offset=100&apikey=${etherscanApiKey}`
        );
        const data = await response.json() as {
          status: string;
          result?: Array<{ TokenHolderQuantity: string }>
        };
        
        if (data.status === '1' && Array.isArray(data.result)) {
          const holders = data.result;
          const holderCount = holders.length >= 100 ? 100 : holders.length; // Minimum visible
          
          // Calculate top 10 concentration
          let top10Total = 0n;
          const sortedHolders = holders
            .map((h: { TokenHolderQuantity: string }) => BigInt(h.TokenHolderQuantity))
            .sort((a: bigint, b: bigint) => (b > a ? 1 : -1));
          
          for (let i = 0; i < Math.min(10, sortedHolders.length); i++) {
            top10Total += sortedHolders[i];
          }
          
          const top10Percent = totalSupply > 0n 
            ? Number((top10Total * 100n) / totalSupply)
            : 0;
          
          // Count whales (holders with > 1% of supply)
          const whaleThreshold = totalSupply / 100n;
          const whaleCount = sortedHolders.filter((h: bigint) => h > whaleThreshold).length;
          
          // Fresh wallets - would need historical data, estimate from recent transfers
          const freshWallets = await this.countFreshWallets(tokenAddress);
          
          return {
            count: holderCount,
            top10Percent,
            whaleCount,
            freshWallets
          };
        }
      } catch (error) {
        logger.debug(`[OnChainScanner] Failed to get holder info from Etherscan: ${error}`);
      }
    }
    
    // Fallback: Analyze from Transfer events
    return await this.estimateHolderInfoFromEvents(tokenAddress, totalSupply);
  }

  private async countFreshWallets(tokenAddress: string): Promise<number> {
    try {
      const token = new Contract(tokenAddress, [
        'event Transfer(address indexed from, address indexed to, uint256 value)'
      ], this.provider);
      
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = currentBlock - 1000; // ~3.5 hours of blocks
      
      const filter = token.filters.Transfer();
      const events = await token.queryFilter(filter, fromBlock, currentBlock);
      
      // Count unique new recipients (from address is zero for mints, or new holders)
      const recipients = new Set<string>();
      for (const event of events) {
        const to = (event as any).args?.to as string;
        if (to && to !== ethers.ZeroAddress) {
          recipients.add(to.toLowerCase());
        }
      }
      
      return recipients.size;
    } catch {
      return 0;
    }
  }

  private async estimateHolderInfoFromEvents(
    tokenAddress: string,
    totalSupply: bigint
  ): Promise<{
    count: number;
    top10Percent: number;
    whaleCount: number;
    freshWallets: number;
  }> {
    try {
      const token = new Contract(tokenAddress, [
        'event Transfer(address indexed from, address indexed to, uint256 value)'
      ], this.provider);
      
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = currentBlock - 5000; // ~17 hours of blocks
      
      const filter = token.filters.Transfer();
      const events = await token.queryFilter(filter, fromBlock, currentBlock);
      
      // Build holder balances from events
      const balances = new Map<string, bigint>();
      
      for (const event of events) {
        const args = (event as any).args;
        const from = args?.from as string;
        const to = args?.to as string;
        const value = args?.value as bigint;
        
        if (from && from !== ethers.ZeroAddress) {
          const current = balances.get(from.toLowerCase()) || 0n;
          balances.set(from.toLowerCase(), current - value);
        }
        
        if (to && to !== ethers.ZeroAddress) {
          const current = balances.get(to.toLowerCase()) || 0n;
          balances.set(to.toLowerCase(), current + value);
        }
      }
      
      // Filter out zero/negative balances
      const holders = Array.from(balances.entries())
        .filter(([_, balance]) => balance > 0n)
        .map(([addr, balance]) => ({ address: addr, balance }))
        .sort((a, b) => (b.balance > a.balance ? 1 : -1));
      
      // Calculate metrics
      const holderCount = holders.length;
      
      let top10Total = 0n;
      for (let i = 0; i < Math.min(10, holders.length); i++) {
        top10Total += holders[i].balance;
      }
      
      const top10Percent = totalSupply > 0n 
        ? Number((top10Total * 100n) / totalSupply)
        : 0;
      
      const whaleThreshold = totalSupply / 100n;
      const whaleCount = holders.filter(h => h.balance > whaleThreshold).length;
      
      return {
        count: holderCount,
        top10Percent: Math.min(100, top10Percent),
        whaleCount,
        freshWallets: Math.min(holderCount, 50)
      };
    } catch (error) {
      logger.debug(`[OnChainScanner] Failed to estimate holders from events: ${error}`);
      return {
        count: 0,
        top10Percent: 0,
        whaleCount: 0,
        freshWallets: 0
      };
    }
  }

  private async getTradingMetrics(pairAddress: string): Promise<{
    volume: number;
    txCount: number;
    buyPressure: number;
    avgBuySize: number;
    avgSellSize: number;
    uniqueBuyers: number;
    uniqueSellers: number;
  }> {
    try {
      const pair = new Contract(pairAddress, PAIR_ABI, this.provider);
      
      // Get recent swap events
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = currentBlock - 7200; // ~24 hours of blocks
      
      const filter = pair.filters.Swap();
      const events = await pair.queryFilter(filter, fromBlock, currentBlock);
      
      let totalVolume = 0n;
      let buys = 0, sells = 0;
      let buyVolume = 0n, sellVolume = 0n;
      const buyers = new Set<string>();
      const sellers = new Set<string>();
      
      for (const event of events) {
        const args = (event as any).args;
        const amount0In = args.amount0In as bigint;
        const amount1In = args.amount1In as bigint;
        const amount0Out = args.amount0Out as bigint;
        const amount1Out = args.amount1Out as bigint;
        const to = args.to as string;
        
        const volume = amount0In + amount1In;
        totalVolume += volume;
        
        // Determine if buy or sell (simplified)
        if (amount0In > 0n) {
          sells++;
          sellVolume += volume;
          sellers.add(to);
        } else {
          buys++;
          buyVolume += volume;
          buyers.add(to);
        }
      }
      
      const ethPrice = await this.getEthPrice();
      
      return {
        volume: Number(formatEther(totalVolume)) * ethPrice,
        txCount: events.length,
        buyPressure: events.length > 0 ? (buys / events.length) * 100 : 50,
        avgBuySize: buys > 0 ? Number(formatEther(buyVolume / BigInt(buys))) * ethPrice : 0,
        avgSellSize: sells > 0 ? Number(formatEther(sellVolume / BigInt(sells))) * ethPrice : 0,
        uniqueBuyers: buyers.size,
        uniqueSellers: sellers.size
      };
    } catch (error) {
      return this.getEmptyTradingMetrics();
    }
  }

  private getEmptyTradingMetrics() {
    return {
      volume: 0,
      txCount: 0,
      buyPressure: 50,
      avgBuySize: 0,
      avgSellSize: 0,
      uniqueBuyers: 0,
      uniqueSellers: 0
    };
  }

  /**
   * Get current ETH price in USD from real price sources
   */
  private async getEthPrice(): Promise<number> {
    // Check cache first
    const cached = this.tokenSignalsCache.get<number>('eth_price');
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
        this.tokenSignalsCache.set('eth_price', price, 60); // Cache for 60 seconds
        return price;
      }
    } catch (error) {
      logger.debug('[OnChainScanner] CoinGecko price fetch failed, trying DexScreener');
    }

    // Fallback: Try DexScreener
    try {
      const response = await fetch(
        'https://api.dexscreener.com/latest/dex/tokens/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        { signal: AbortSignal.timeout(5000) }
      );
      const data = await response.json() as { pairs?: Array<{ priceUsd?: string }> };
      
      if (data.pairs?.[0]?.priceUsd) {
        const price = parseFloat(data.pairs[0].priceUsd);
        this.tokenSignalsCache.set('eth_price', price, 60);
        return price;
      }
    } catch (error) {
      logger.debug('[OnChainScanner] DexScreener price fetch failed, trying Chainlink');
    }

    // Fallback: Try Chainlink oracle on-chain
    try {
      const chainlinkEthUsd = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'; // Mainnet ETH/USD
      const chainlinkABI = ['function latestAnswer() view returns (int256)'];
      const oracle = new Contract(chainlinkEthUsd, chainlinkABI, this.provider);
      const answer = await oracle.latestAnswer();
      const price = Number(answer) / 1e8; // Chainlink uses 8 decimals
      this.tokenSignalsCache.set('eth_price', price, 60);
      return price;
    } catch (error) {
      logger.debug('[OnChainScanner] Chainlink price fetch failed');
    }

    // Last resort fallback - return cached or approximate value
    logger.warn('[OnChainScanner] All ETH price sources failed');
    return 2000; // Only used as absolute last resort
  }

  // ==========================================================================
  // SMART MONEY TRACKING
  // ==========================================================================

  private startSmartMoneyTracking(): void {
    // Track smart wallet activity
    for (const [address, wallet] of this.smartWallets) {
      this.trackWallet(address, wallet);
    }
    
    logger.info(`[OnChainScanner] Tracking ${this.smartWallets.size} smart wallets`);
  }

  private trackWallet(address: string, wallet: SmartWallet): void {
    // Set up event listeners for wallet activity
    // In production, would use more sophisticated tracking
    
    const transferFilter = {
      topics: [
        ethers.id('Transfer(address,address,uint256)'),
        null,
        ethers.zeroPadValue(address, 32)
      ]
    };
    
    this.provider.on(transferFilter, (log) => {
      this.handleSmartMoneyTransfer(wallet, log, 'receive');
    });
  }

  private handleSmartMoneyTransfer(
    wallet: SmartWallet,
    log: ethers.Log,
    type: 'receive' | 'send'
  ): void {
    // Process smart money transfer
    const tokenAddress = log.address;
    const amount = BigInt(log.data);
    
    if (type === 'receive') {
      this.emit('smartMoney:buy', wallet, tokenAddress, amount);
      logger.info(`[OnChainScanner] Smart money ${wallet.label} bought token ${tokenAddress}`);
    } else {
      this.emit('smartMoney:sell', wallet, tokenAddress, amount);
      logger.info(`[OnChainScanner] Smart money ${wallet.label} sold token ${tokenAddress}`);
    }
    
    // Update wallet last active
    wallet.lastActive = Date.now();
  }

  private async processPendingTransaction(txHash: string): Promise<void> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) return;
      
      const from = tx.from.toLowerCase();
      const wallet = this.smartWallets.get(from);
      
      if (wallet) {
        // Smart money is making a transaction
        logger.debug(`[OnChainScanner] Smart money ${wallet.label} pending tx: ${txHash}`);
      }
    } catch {
      // Transaction might have been mined
    }
  }

  private async checkSmartMoney(tokenAddress: string): Promise<{
    wallets: string[];
    avgEntry: number;
    pnl: number;
    score: number;
  }> {
    const earlyBuyerSet = this.earlyBuyers.get(tokenAddress.toLowerCase());
    const wallets: string[] = [];
    
    if (earlyBuyerSet) {
      for (const buyer of earlyBuyerSet) {
        if (this.smartWallets.has(buyer.toLowerCase())) {
          wallets.push(buyer);
        }
      }
    }
    
    // Calculate copytrade score based on smart money presence
    const score = Math.min(100, wallets.length * 20);
    
    return {
      wallets,
      avgEntry: 0,
      pnl: 0,
      score
    };
  }

  // ==========================================================================
  // TOKEN TRACKING
  // ==========================================================================

  private startTokenTracking(tokenAddress: string, pairAddress: string): void {
    // Track early buyers
    this.trackEarlyBuyers(tokenAddress, pairAddress);
  }

  private async trackEarlyBuyers(tokenAddress: string, pairAddress: string): Promise<void> {
    const address = tokenAddress.toLowerCase();
    
    if (!this.earlyBuyers.has(address)) {
      this.earlyBuyers.set(address, new Set());
    }
    
    try {
      const pair = new Contract(pairAddress, PAIR_ABI, this.provider);
      const filter = pair.filters.Swap();
      
      // Listen for swaps in first 100 blocks
      const startBlock = await this.provider.getBlockNumber();
      
      const listener = async (...args: any[]) => {
        const event = args[args.length - 1];
        if (event.blockNumber > startBlock + 100) {
          pair.off(filter, listener);
          return;
        }
        
        const to = args[4] as string; // 'to' address from Swap event
        this.earlyBuyers.get(address)?.add(to.toLowerCase());
      };
      
      pair.on(filter, listener);
      
      // Stop tracking after 10 minutes
      setTimeout(() => {
        pair.off(filter, listener);
      }, 600000);
      
    } catch (error) {
      logger.debug(`[OnChainScanner] Failed to track early buyers for ${tokenAddress}`);
    }
  }

  private startPeriodicAnalysis(): void {
    // Update signals periodically
    setInterval(async () => {
      if (!this.isRunning) return;
      
      // Check for holder/volume spikes
      this.checkForSpikes();
    }, 60000); // Every minute
  }

  private checkForSpikes(): void {
    // Check holder growth
    for (const [token, snapshots] of this.holderSnapshots) {
      if (snapshots.length >= 2) {
        const latest = snapshots[snapshots.length - 1];
        const previous = snapshots[snapshots.length - 2];
        const growth = ((latest.count - previous.count) / previous.count) * 100;
        
        if (growth > 20) { // 20% holder growth
          this.emit('holder:spike', token, latest.count, growth);
        }
      }
    }
    
    // Check volume growth
    for (const [token, snapshots] of this.volumeSnapshots) {
      if (snapshots.length >= 2) {
        const latest = snapshots[snapshots.length - 1];
        const previous = snapshots[snapshots.length - 2];
        if (previous.volume > 0) {
          const growth = ((latest.volume - previous.volume) / previous.volume) * 100;
          
          if (growth > 50) { // 50% volume growth
            this.emit('volume:spike', token, latest.volume, growth);
          }
        }
      }
    }
  }

  // ==========================================================================
  // SMART WALLET MANAGEMENT
  // ==========================================================================

  addSmartWallet(wallet: SmartWallet): void {
    this.smartWallets.set(wallet.address.toLowerCase(), wallet);
    
    if (this.isRunning) {
      this.trackWallet(wallet.address.toLowerCase(), wallet);
    }
    
    logger.info(`[OnChainScanner] Added smart wallet: ${wallet.label}`);
  }

  removeSmartWallet(address: string): boolean {
    return this.smartWallets.delete(address.toLowerCase());
  }

  getSmartWallets(): SmartWallet[] {
    return Array.from(this.smartWallets.values());
  }

  getSmartWallet(address: string): SmartWallet | undefined {
    return this.smartWallets.get(address.toLowerCase());
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  getCachedSignals(tokenAddress: string): OnChainSignals | undefined {
    return this.tokenSignalsCache.get<OnChainSignals>(`signals_${tokenAddress.toLowerCase()}`);
  }

  getEarlyBuyers(tokenAddress: string): string[] {
    const set = this.earlyBuyers.get(tokenAddress.toLowerCase());
    return set ? Array.from(set) : [];
  }

  getStats(): {
    pairsMonitored: number;
    smartWalletsTracked: number;
    tokensAnalyzed: number;
  } {
    return {
      pairsMonitored: this.factoryListeners.size,
      smartWalletsTracked: this.smartWallets.size,
      tokensAnalyzed: this.tokenSignalsCache.keys().length
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createOnChainScanner(config: MemeHunterConfig): OnChainScanner {
  return new OnChainScanner(config);
}
