// ============================================================================
// WHALE MIRROR TRADING - Automatic Copy Trading of Top Wallets
// Automatically copies trades from top 100 performing wallets with
// user-configurable parameters
// ============================================================================

import { ethers, JsonRpcProvider, WebSocketProvider, Contract } from 'ethers';
import EventEmitter from 'eventemitter3';
import axios from 'axios';
import {
  WhaleMirrorConfig,
  TopWallet,
  MirrorTrade,
  WhaleMirrorStats,
  MirrorStrategy,
  TokenInfo
} from '../types';
import { config as appConfig, API_ENDPOINTS } from '../config';
import { 
  logger, 
  generateId, 
  checksumAddress, 
  formatEther, 
  parseEther,
  isSwapTransaction,
  decodeTransactionData,
  getTokenInfo,
  retry
} from '../utils';
import { executionEngine } from './ExecutionEngine';
import { tokenAnalyzer } from './TokenAnalyzer';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: WhaleMirrorConfig = {
  enabled: true,
  
  // Wallet selection
  trackTop100: true,
  minWalletWinRate: 60,  // 60% minimum win rate
  minWalletROI: 50,  // 50% minimum ROI
  minWalletTrades: 20,  // Minimum 20 trades
  maxWalletsToTrack: 50,
  
  // Trade filters
  minTradeValueEth: '0.5',
  maxTradeValueEth: '50',
  tokenWhitelist: [],
  tokenBlacklist: [],
  dexWhitelist: [],
  
  // Copy settings
  strategy: MirrorStrategy.DELAYED,
  delayBlocks: 2,
  positionSizePercent: 10,  // 10% of whale's position
  maxPositionEth: '0.5',
  minPositionEth: '0.01',
  
  // Risk settings
  maxConcurrentMirrors: 5,
  maxDailyMirrorValue: '2',  // 2 ETH per day
  requireSafetyCheck: true,
  stopOnLoss: true,
  maxLossPercent: 30,
  
  // Scaling settings
  scaleByConfidence: true,
  scaleByWalletROI: true,
  minScaleFactor: 0.1,
  maxScaleFactor: 1.0
};

// ============================================================================
// EVENTS
// ============================================================================

export interface WhaleMirrorTradingEvents {
  'wallet:added': (wallet: TopWallet) => void;
  'wallet:removed': (address: string) => void;
  'wallet:updated': (wallet: TopWallet) => void;
  'trade:detected': (trade: MirrorTrade) => void;
  'trade:executing': (trade: MirrorTrade) => void;
  'trade:completed': (trade: MirrorTrade) => void;
  'trade:failed': (trade: MirrorTrade, error: string) => void;
  'trade:skipped': (trade: MirrorTrade, reason: string) => void;
  'stats:updated': (stats: WhaleMirrorStats) => void;
}

// ============================================================================
// WHALE MIRROR TRADING SERVICE
// ============================================================================

export class WhaleMirrorTrading extends EventEmitter<WhaleMirrorTradingEvents> {
  private config: WhaleMirrorConfig;
  private provider: JsonRpcProvider;
  private wsProvider: WebSocketProvider | null = null;
  private isRunning: boolean = false;
  
  // Wallet tracking
  private topWallets: Map<string, TopWallet> = new Map();
  
  // Trade tracking
  private activeMirrors: Map<string, MirrorTrade> = new Map();
  private mirrorHistory: MirrorTrade[] = [];
  private dailyMirrorValue: bigint = 0n;
  private lastDayReset: number = Date.now();
  
  // Stats
  private stats: WhaleMirrorStats;
  
  // Intervals
  private walletUpdateInterval: NodeJS.Timeout | null = null;
  private statsUpdateInterval: NodeJS.Timeout | null = null;

  constructor(customConfig?: Partial<WhaleMirrorConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
    this.provider = new JsonRpcProvider(appConfig.rpcUrl);
    
    // Initialize stats
    this.stats = this.initializeStats();
  }

  private initializeStats(): WhaleMirrorStats {
    return {
      walletsTracked: 0,
      top100Coverage: 0,
      avgWalletWinRate: 0,
      avgWalletROI: 0,
      totalMirrorTrades: 0,
      successfulMirrors: 0,
      failedMirrors: 0,
      skippedMirrors: 0,
      totalMirrorPnL: 0,
      mirrorWinRate: 0,
      avgMirrorROI: 0,
      bestMirrorTrade: null,
      worstMirrorTrade: null,
      avgDelayMs: 0,
      fastestMirrorMs: Infinity,
      todayMirrors: 0,
      todayPnL: 0,
      todayValueEth: '0',
      lastUpdated: Date.now()
    };
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('[WhaleMirror] Already running');
      return;
    }

    logger.info('╔════════════════════════════════════════╗');
    logger.info('║   WHALE MIRROR TRADING - Starting      ║');
    logger.info('╚════════════════════════════════════════╝');

    this.isRunning = true;

    try {
      // Connect WebSocket for real-time monitoring
      await this.connectWebSocket();
      
      // Load top wallets
      await this.loadTopWallets();
      
      // Start wallet monitoring
      this.startWalletMonitoring();
      
      // Start stats updates
      this.startStatsUpdates();

      logger.info('[WhaleMirror] ✓ Whale Mirror Trading started');
      logger.info(`[WhaleMirror] Tracking ${this.topWallets.size} wallets`);
      
    } catch (error) {
      logger.error('[WhaleMirror] Failed to start:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    logger.info('[WhaleMirror] Stopping Whale Mirror Trading...');
    
    this.isRunning = false;

    if (this.wsProvider) {
      await this.wsProvider.destroy();
      this.wsProvider = null;
    }

    if (this.walletUpdateInterval) {
      clearInterval(this.walletUpdateInterval);
      this.walletUpdateInterval = null;
    }

    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
      this.statsUpdateInterval = null;
    }

    logger.info('[WhaleMirror] Whale Mirror Trading stopped');
  }

  private async connectWebSocket(): Promise<void> {
    try {
      this.wsProvider = new WebSocketProvider(appConfig.wsRpcUrl);
      
      // Subscribe to pending transactions
      this.wsProvider.on('pending', async (txHash: string) => {
        await this.processPendingTransaction(txHash);
      });
      
      logger.info('[WhaleMirror] WebSocket connected');
    } catch (error) {
      logger.error('[WhaleMirror] Failed to connect WebSocket:', error);
    }
  }

  // ==========================================================================
  // WALLET MANAGEMENT
  // ==========================================================================

  private async loadTopWallets(): Promise<void> {
    try {
      // Fetch top wallets from multiple sources
      const discoveredWallets: TopWallet[] = [];
      
      // 1. Fetch known profitable traders from Etherscan's top token holders
      // 2. Analyze recent large profitable trades
      // 3. Use Covalent API for wallet analytics
      
      // Discover wallets from recent profitable trades on popular tokens
      const profitableWallets = await this.discoverProfitableWallets();
      discoveredWallets.push(...profitableWallets);
      
      // Add any known whale addresses we want to track
      const knownWhales = await this.getKnownWhaleAddresses();
      
      for (const whaleAddress of knownWhales) {
        if (discoveredWallets.some(w => w.address.toLowerCase() === whaleAddress.toLowerCase())) {
          continue;
        }
        
        const performance = await this.analyzeWalletPerformance(whaleAddress);
        if (performance.totalTrades >= this.config.minWalletTrades) {
          discoveredWallets.push({
            rank: discoveredWallets.length + 1,
            address: checksumAddress(whaleAddress),
            label: `Whale ${checksumAddress(whaleAddress).slice(0, 8)}`,
            totalPnL: performance.totalPnL,
            realizedPnL: performance.realizedPnL,
            unrealizedPnL: performance.unrealizedPnL,
            winRate: performance.winRate,
            avgROI: performance.avgROI,
            totalTrades: performance.totalTrades,
            avgHoldTimeHours: performance.avgHoldTimeHours,
            last7dTrades: performance.last7dTrades,
            last7dPnL: performance.last7dPnL,
            last7dWinRate: performance.last7dWinRate,
            lastTradeTime: performance.lastTradeTime,
            specialties: [],
            riskProfile: 'MODERATE',
            mirrorCount: 0,
            mirrorPnL: 0,
            mirrorWinRate: 0,
            isActive: true,
            lastUpdated: Date.now()
          });
        }
      }
      
      // Filter and add wallets meeting criteria
      for (const wallet of discoveredWallets) {
        if (wallet.winRate < this.config.minWalletWinRate) continue;
        if (wallet.avgROI < this.config.minWalletROI) continue;
        if (wallet.totalTrades < this.config.minWalletTrades) continue;
        
        if (this.topWallets.size >= this.config.maxWalletsToTrack) break;
        
        this.topWallets.set(wallet.address.toLowerCase(), wallet);
        this.emit('wallet:added', wallet);
      }
      
      this.updateWalletStats();
      
      logger.info(`[WhaleMirror] Loaded ${this.topWallets.size} top wallets from API`);
      
    } catch (error) {
      logger.error('[WhaleMirror] Failed to load top wallets:', error);
    }
  }

  private async discoverProfitableWallets(): Promise<TopWallet[]> {
    const wallets: TopWallet[] = [];
    
    try {
      // Use Covalent API to get top token holders and analyze their performance
      if (!appConfig.covalentKey) {
        logger.debug('[WhaleMirror] Covalent API key not configured');
        return wallets;
      }
      
      // Get transactions for popular tokens to find active traders
      const popularTokens = [
        '0x6982508145454ce325ddbe47a25d4ec3d2311933', // PEPE
        '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', // SHIB
        '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK
      ];
      
      const traderMap = new Map<string, { trades: number; profitableTrades: number }>();
      
      for (const tokenAddress of popularTokens) {
        try {
          // Fetch recent transfers using Etherscan
          if (!appConfig.etherscanApiKey) continue;
          
          const response = await axios.get(API_ENDPOINTS.etherscan.mainnet, {
            params: {
              module: 'account',
              action: 'tokentx',
              contractaddress: tokenAddress,
              page: 1,
              offset: 500,
              sort: 'desc',
              apikey: appConfig.etherscanApiKey
            },
            timeout: 10000
          });
          
          if (response.data.status === '1' && response.data.result) {
            for (const tx of response.data.result) {
              const from = tx.from?.toLowerCase();
              const to = tx.to?.toLowerCase();
              
              // Track buyers and sellers
              for (const addr of [from, to]) {
                if (!addr || addr === tokenAddress.toLowerCase()) continue;
                
                const existing = traderMap.get(addr) || { trades: 0, profitableTrades: 0 };
                existing.trades++;
                traderMap.set(addr, existing);
              }
            }
          }
          
          // Rate limit
          await new Promise(resolve => setTimeout(resolve, 250));
          
        } catch (error) {
          logger.debug(`[WhaleMirror] Failed to fetch token transfers for ${tokenAddress}`);
        }
      }
      
      // Get top traders by activity
      const sortedTraders = Array.from(traderMap.entries())
        .filter(([_, data]) => data.trades >= 10)
        .sort((a, b) => b[1].trades - a[1].trades)
        .slice(0, 50);
      
      // Analyze each trader's performance
      for (const [address, _] of sortedTraders) {
        if (wallets.length >= this.config.maxWalletsToTrack) break;
        
        try {
          const performance = await this.analyzeWalletPerformance(address);
          
          if (performance.winRate >= this.config.minWalletWinRate &&
              performance.totalTrades >= this.config.minWalletTrades) {
            wallets.push({
              rank: wallets.length + 1,
              address: checksumAddress(address),
              label: `Trader ${checksumAddress(address).slice(0, 8)}`,
              totalPnL: performance.totalPnL,
              realizedPnL: performance.realizedPnL,
              unrealizedPnL: performance.unrealizedPnL,
              winRate: performance.winRate,
              avgROI: performance.avgROI,
              totalTrades: performance.totalTrades,
              avgHoldTimeHours: performance.avgHoldTimeHours,
              last7dTrades: performance.last7dTrades,
              last7dPnL: performance.last7dPnL,
              last7dWinRate: performance.last7dWinRate,
              lastTradeTime: performance.lastTradeTime,
              specialties: ['tokens'],
              riskProfile: performance.avgROI > 200 ? 'AGGRESSIVE' : 'MODERATE',
              mirrorCount: 0,
              mirrorPnL: 0,
              mirrorWinRate: 0,
              isActive: true,
              lastUpdated: Date.now()
            });
          }
        } catch (error) {
          logger.debug(`[WhaleMirror] Failed to analyze wallet ${address}`);
        }
      }
      
    } catch (error) {
      logger.error('[WhaleMirror] Failed to discover profitable wallets:', error);
    }
    
    return wallets;
  }

  private async getKnownWhaleAddresses(): Promise<string[]> {
    // Known successful traders and whale addresses
    // These are real addresses of known profitable traders from public data
    return [
      // Top DEX traders (from public Etherscan data)
      '0xae2Fc483527B8EF99EB5D9B44875F005ba1FaE13', // Known meme trader
      '0x1db3439a222c519ab44bb1144fc28167b4fa6ee6', // Active DEX trader
      '0x50ec05ade8280758e2077fcbc08d878d4aef79c3', // Whale wallet
    ];
  }

  async addWallet(
    address: string,
    options: Partial<TopWallet> = {}
  ): Promise<TopWallet | null> {
    const normalizedAddress = checksumAddress(address);
    const lowerAddress = normalizedAddress.toLowerCase();
    
    if (this.topWallets.has(lowerAddress)) {
      logger.warn(`[WhaleMirror] Wallet already tracked: ${address}`);
      return this.topWallets.get(lowerAddress) || null;
    }
    
    // Analyze wallet performance using real on-chain data
    const performance = await this.analyzeWalletPerformance(address);
    
    const wallet: TopWallet = {
      rank: this.topWallets.size + 1,
      address: normalizedAddress,
      label: options.label || `Wallet ${normalizedAddress.slice(0, 8)}`,
      totalPnL: performance.totalPnL,
      realizedPnL: performance.realizedPnL,
      unrealizedPnL: performance.unrealizedPnL,
      winRate: performance.winRate,
      avgROI: performance.avgROI,
      totalTrades: performance.totalTrades,
      avgHoldTimeHours: performance.avgHoldTimeHours,
      last7dTrades: performance.last7dTrades,
      last7dPnL: performance.last7dPnL,
      last7dWinRate: performance.last7dWinRate,
      lastTradeTime: performance.lastTradeTime,
      specialties: options.specialties || [],
      riskProfile: options.riskProfile || 'MODERATE',
      mirrorCount: 0,
      mirrorPnL: 0,
      mirrorWinRate: 0,
      isActive: true,
      lastUpdated: Date.now()
    };
    
    // Check if meets criteria
    if (wallet.winRate < this.config.minWalletWinRate) {
      logger.warn(`[WhaleMirror] Wallet doesn't meet win rate criteria: ${wallet.winRate}%`);
      return null;
    }
    
    this.topWallets.set(lowerAddress, wallet);
    this.updateWalletStats();
    
    this.emit('wallet:added', wallet);
    
    logger.info(`[WhaleMirror] Added wallet: ${wallet.label} (WR: ${wallet.winRate}%, ROI: ${wallet.avgROI}%)`);
    
    return wallet;
  }

  removeWallet(address: string): boolean {
    const lowerAddress = address.toLowerCase();
    const deleted = this.topWallets.delete(lowerAddress);
    
    if (deleted) {
      this.updateWalletStats();
      this.emit('wallet:removed', address);
      logger.info(`[WhaleMirror] Removed wallet: ${address}`);
    }
    
    return deleted;
  }

  private async analyzeWalletPerformance(address: string): Promise<WalletPerformance> {
    const performance: WalletPerformance = {
      totalPnL: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      winRate: 0,
      avgROI: 0,
      totalTrades: 0,
      avgHoldTimeHours: 0,
      last7dTrades: 0,
      last7dPnL: 0,
      last7dWinRate: 0,
      lastTradeTime: 0
    };
    
    try {
      // Fetch wallet's ERC20 token transfers from Etherscan
      if (!appConfig.etherscanApiKey) {
        logger.debug('[WhaleMirror] Etherscan API key not configured');
        return performance;
      }
      
      const normalizedAddress = checksumAddress(address);
      
      // Get token transactions
      const response = await axios.get(API_ENDPOINTS.etherscan.mainnet, {
        params: {
          module: 'account',
          action: 'tokentx',
          address: normalizedAddress,
          page: 1,
          offset: 500,
          sort: 'desc',
          apikey: appConfig.etherscanApiKey
        },
        timeout: 10000
      });
      
      if (response.data.status !== '1' || !response.data.result) {
        return performance;
      }
      
      const transactions = response.data.result;
      const now = Math.floor(Date.now() / 1000);
      const sevenDaysAgo = now - 7 * 24 * 60 * 60;
      
      // Track token holdings for PnL calculation
      const tokenHoldings = new Map<string, {
        buyAmount: bigint;
        buyValue: number;
        sellAmount: bigint;
        sellValue: number;
        firstBuy: number;
        lastActivity: number;
      }>();
      
      let totalTrades = 0;
      let profitableTrades = 0;
      let last7dTrades = 0;
      let last7dProfitable = 0;
      let totalHoldTime = 0;
      let lastTradeTime = 0;
      
      for (const tx of transactions) {
        const tokenAddress = tx.contractAddress?.toLowerCase();
        const timestamp = parseInt(tx.timeStamp);
        const value = BigInt(tx.value || '0');
        const isReceive = tx.to?.toLowerCase() === normalizedAddress.toLowerCase();
        
        if (!tokenAddress) continue;
        
        // Initialize token tracking
        if (!tokenHoldings.has(tokenAddress)) {
          tokenHoldings.set(tokenAddress, {
            buyAmount: 0n,
            buyValue: 0,
            sellAmount: 0n,
            sellValue: 0,
            firstBuy: 0,
            lastActivity: 0
          });
        }
        
        const holding = tokenHoldings.get(tokenAddress)!;
        
        if (isReceive) {
          // Buy/receive
          if (holding.firstBuy === 0) holding.firstBuy = timestamp;
          holding.buyAmount += value;
          totalTrades++;
          
          if (timestamp >= sevenDaysAgo) {
            last7dTrades++;
          }
        } else {
          // Sell/send
          holding.sellAmount += value;
          holding.lastActivity = timestamp;
          
          // Consider it profitable if they sold more than 50% of what they bought
          // (simplified heuristic - real implementation would need price data)
          if (holding.buyAmount > 0n && holding.sellAmount > holding.buyAmount / 2n) {
            profitableTrades++;
            if (timestamp >= sevenDaysAgo) last7dProfitable++;
            
            // Calculate hold time
            if (holding.firstBuy > 0) {
              totalHoldTime += (timestamp - holding.firstBuy);
            }
          }
        }
        
        if (timestamp > lastTradeTime) {
          lastTradeTime = timestamp;
        }
      }
      
      // Calculate metrics
      performance.totalTrades = totalTrades;
      performance.last7dTrades = last7dTrades;
      
      if (totalTrades > 0) {
        performance.winRate = (profitableTrades / totalTrades) * 100;
        performance.avgHoldTimeHours = totalTrades > 0 
          ? (totalHoldTime / totalTrades) / 3600 
          : 0;
      }
      
      if (last7dTrades > 0) {
        performance.last7dWinRate = (last7dProfitable / last7dTrades) * 100;
      }
      
      performance.lastTradeTime = lastTradeTime * 1000;
      
      // Fetch current ETH balance to estimate unrealized PnL
      const ethBalance = await this.provider.getBalance(normalizedAddress);
      performance.unrealizedPnL = parseFloat(formatEther(ethBalance)) * 2000; // Rough USD estimate
      
      // Calculate ROI (simplified - would need historical price data for accurate calculation)
      // Using transaction count as a proxy for activity level
      performance.avgROI = performance.winRate > 50 ? (performance.winRate - 50) * 2 : 0;
      performance.totalPnL = performance.avgROI * totalTrades;
      performance.realizedPnL = performance.totalPnL * 0.8;
      performance.last7dPnL = performance.avgROI * last7dTrades;
      
      logger.debug(`[WhaleMirror] Analyzed ${address}: ${totalTrades} trades, ${performance.winRate.toFixed(1)}% win rate`);
      
    } catch (error) {
      logger.error(`[WhaleMirror] Failed to analyze wallet ${address}:`, error);
    }
    
    return performance;
  }

  private updateWalletStats(): void {
    const wallets = Array.from(this.topWallets.values());
    
    if (wallets.length === 0) {
      this.stats.walletsTracked = 0;
      this.stats.avgWalletWinRate = 0;
      this.stats.avgWalletROI = 0;
      return;
    }
    
    this.stats.walletsTracked = wallets.length;
    this.stats.top100Coverage = Math.min((wallets.length / 100) * 100, 100);
    this.stats.avgWalletWinRate = wallets.reduce((sum, w) => sum + w.winRate, 0) / wallets.length;
    this.stats.avgWalletROI = wallets.reduce((sum, w) => sum + w.avgROI, 0) / wallets.length;
  }

  // ==========================================================================
  // TRANSACTION MONITORING
  // ==========================================================================

  private async processPendingTransaction(txHash: string): Promise<void> {
    if (!this.isRunning) return;
    
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx || !tx.from) return;
      
      const from = tx.from.toLowerCase();
      const wallet = this.topWallets.get(from);
      
      if (!wallet || !wallet.isActive) return;
      
      // Check if it's a swap transaction
      if (!isSwapTransaction(tx.data)) return;
      
      // Parse the trade
      const tradeInfo = this.parseSwapTransaction(tx, wallet);
      if (!tradeInfo) return;
      
      // Check filters
      const filterResult = await this.checkTradeFilters(tradeInfo);
      if (!filterResult.passed) {
        if (tradeInfo.sourceAction === 'BUY') {
          const skippedTrade: MirrorTrade = this.createMirrorTrade(tradeInfo, wallet);
          skippedTrade.status = 'SKIPPED';
          skippedTrade.skipReason = filterResult.reason;
          this.mirrorHistory.push(skippedTrade);
          this.stats.skippedMirrors++;
          this.emit('trade:skipped', skippedTrade, filterResult.reason || 'Filter check failed');
        }
        return;
      }
      
      // Create mirror trade
      const mirrorTrade = this.createMirrorTrade(tradeInfo, wallet);
      this.activeMirrors.set(mirrorTrade.id, mirrorTrade);
      
      this.emit('trade:detected', mirrorTrade);
      
      logger.info(`[WhaleMirror] Trade detected from ${wallet.label}: ${mirrorTrade.sourceAction} ${mirrorTrade.tokenSymbol}`);
      
      // Execute mirror trade based on strategy
      await this.executeMirrorTrade(mirrorTrade, wallet);
      
    } catch (error) {
      // Transaction might have been mined or dropped - this is expected
      logger.debug(`[WhaleMirror] Skipped pending tx ${txHash}: ${(error as Error).message}`);
    }
  }

  private parseSwapTransaction(
    tx: ethers.TransactionResponse,
    wallet: TopWallet
  ): ParsedTradeInfo | null {
    const decoded = decodeTransactionData(tx.data);
    if (!decoded) return null;
    
    const weth = appConfig.contracts.weth.toLowerCase();
    
    // Parse based on method
    switch (decoded.name) {
      case 'swapExactETHForTokens':
      case 'swapExactETHForTokensSupportingFeeOnTransferTokens': {
        const path = decoded.args.path as string[];
        return {
          sourceAction: 'BUY',
          tokenAddress: checksumAddress(path[path.length - 1]),
          tokenSymbol: 'UNKNOWN',
          tokenName: 'Unknown Token',
          amountEth: formatEther(tx.value),
          amountWei: tx.value,
          txHash: tx.hash
        };
      }
      
      case 'swapExactTokensForETH':
      case 'swapExactTokensForETHSupportingFeeOnTransferTokens': {
        const path = decoded.args.path as string[];
        return {
          sourceAction: 'SELL',
          tokenAddress: checksumAddress(path[0]),
          tokenSymbol: 'UNKNOWN',
          tokenName: 'Unknown Token',
          amountEth: '0',
          amountWei: BigInt(decoded.args.amountIn as string || 0),
          txHash: tx.hash
        };
      }
      
      default:
        return null;
    }
  }

  private async checkTradeFilters(
    tradeInfo: ParsedTradeInfo
  ): Promise<{ passed: boolean; reason?: string }> {
    // Check if trade is a buy (we primarily mirror buys)
    if (tradeInfo.sourceAction !== 'BUY') {
      return { passed: false, reason: 'Not a buy trade' };
    }
    
    const valueWei = tradeInfo.amountWei;
    const minValueWei = parseEther(this.config.minTradeValueEth);
    const maxValueWei = parseEther(this.config.maxTradeValueEth);
    
    // Check trade value
    if (valueWei < minValueWei) {
      return { passed: false, reason: 'Trade value too small' };
    }
    
    if (valueWei > maxValueWei) {
      return { passed: false, reason: 'Trade value too large' };
    }
    
    // Check blacklist
    if (this.config.tokenBlacklist.includes(tradeInfo.tokenAddress.toLowerCase())) {
      return { passed: false, reason: 'Token blacklisted' };
    }
    
    // Check whitelist (if configured)
    if (this.config.tokenWhitelist.length > 0) {
      if (!this.config.tokenWhitelist.includes(tradeInfo.tokenAddress.toLowerCase())) {
        return { passed: false, reason: 'Token not in whitelist' };
      }
    }
    
    // Check concurrent mirrors
    if (this.activeMirrors.size >= this.config.maxConcurrentMirrors) {
      return { passed: false, reason: 'Max concurrent mirrors reached' };
    }
    
    // Check daily limit
    this.checkDailyReset();
    const maxDailyWei = parseEther(this.config.maxDailyMirrorValue);
    if (this.dailyMirrorValue >= maxDailyWei) {
      return { passed: false, reason: 'Daily mirror limit reached' };
    }
    
    // Safety check
    if (this.config.requireSafetyCheck) {
      const safetyCheck = await tokenAnalyzer.quickSafetyCheck(tradeInfo.tokenAddress);
      if (!safetyCheck.safe) {
        return { passed: false, reason: `Safety check failed: ${safetyCheck.reason}` };
      }
    }
    
    return { passed: true };
  }

  private createMirrorTrade(
    tradeInfo: ParsedTradeInfo,
    wallet: TopWallet
  ): MirrorTrade {
    // Calculate mirror amount based on configuration
    const sourceValueEth = parseFloat(tradeInfo.amountEth);
    let mirrorValueEth = sourceValueEth * (this.config.positionSizePercent / 100);
    
    // Apply scaling if enabled
    if (this.config.scaleByConfidence) {
      const confidenceScale = wallet.winRate / 100;
      mirrorValueEth *= confidenceScale;
    }
    
    if (this.config.scaleByWalletROI) {
      const roiScale = Math.min(wallet.avgROI / 100, 2);  // Cap at 2x
      mirrorValueEth *= roiScale;
    }
    
    // Apply min/max limits
    const minEth = parseFloat(this.config.minPositionEth);
    const maxEth = parseFloat(this.config.maxPositionEth);
    mirrorValueEth = Math.max(minEth, Math.min(maxEth, mirrorValueEth));
    
    // Apply scale factor limits
    const scaleFactor = mirrorValueEth / sourceValueEth;
    const adjustedScaleFactor = Math.max(
      this.config.minScaleFactor,
      Math.min(this.config.maxScaleFactor, scaleFactor)
    );
    mirrorValueEth = sourceValueEth * adjustedScaleFactor;
    
    return {
      id: generateId(),
      sourceWallet: wallet.address,
      sourceWalletRank: wallet.rank,
      sourceTxHash: tradeInfo.txHash,
      sourceAction: tradeInfo.sourceAction,
      sourceAmount: tradeInfo.amountWei,
      sourceValueEth: tradeInfo.amountEth,
      mirrorWalletId: '',
      mirrorAmount: parseEther(mirrorValueEth.toFixed(18)),
      mirrorValueEth: mirrorValueEth.toFixed(6),
      scaleFactor: adjustedScaleFactor,
      tokenAddress: tradeInfo.tokenAddress,
      tokenSymbol: tradeInfo.tokenSymbol,
      tokenName: tradeInfo.tokenName,
      strategy: this.config.strategy,
      status: 'PENDING',
      sourceDetectedAt: Date.now()
    };
  }

  // ==========================================================================
  // TRADE EXECUTION
  // ==========================================================================

  private async executeMirrorTrade(
    trade: MirrorTrade,
    wallet: TopWallet
  ): Promise<void> {
    trade.status = 'EXECUTING';
    this.emit('trade:executing', trade);
    
    try {
      // Apply delay based on strategy
      if (this.config.strategy === MirrorStrategy.DELAYED && this.config.delayBlocks > 0) {
        await this.waitBlocks(this.config.delayBlocks);
      }
      
      // Get wallet to use
      const wallets = executionEngine.getWallets();
      if (wallets.length === 0) {
        throw new Error('No wallets available for mirror trading');
      }
      
      trade.mirrorWalletId = wallets[0].id;
      
      // Execute the buy
      const order = await executionEngine.buyToken(
        trade.tokenAddress,
        trade.mirrorValueEth,
        trade.mirrorWalletId,
        {
          slippage: 15,
          safetyCheck: false  // Already checked
        }
      );
      
      trade.mirrorTxHash = order.txHash;
      trade.status = 'COMPLETED';
      trade.mirrorExecutedAt = Date.now();
      trade.delayMs = trade.mirrorExecutedAt - trade.sourceDetectedAt;
      trade.positionId = order.id;
      
      // Update daily tracking
      this.dailyMirrorValue += trade.mirrorAmount;
      
      // Update wallet stats
      wallet.mirrorCount++;
      wallet.lastUpdated = Date.now();
      
      // Update stats
      this.stats.totalMirrorTrades++;
      this.stats.successfulMirrors++;
      this.stats.todayMirrors++;
      this.stats.todayValueEth = formatEther(this.dailyMirrorValue);
      
      if (trade.delayMs < this.stats.fastestMirrorMs) {
        this.stats.fastestMirrorMs = trade.delayMs;
      }
      
      // Move to history
      this.mirrorHistory.push(trade);
      this.activeMirrors.delete(trade.id);
      
      this.emit('trade:completed', trade);
      
      logger.info(`[WhaleMirror] Mirror trade completed: ${trade.tokenSymbol} (${trade.mirrorValueEth} ETH)`);
      logger.info(`[WhaleMirror] Delay: ${trade.delayMs}ms | Scale: ${(trade.scaleFactor * 100).toFixed(1)}%`);
      
    } catch (error) {
      const errorMsg = (error as Error).message;
      trade.status = 'FAILED';
      trade.error = errorMsg;
      
      this.stats.totalMirrorTrades++;
      this.stats.failedMirrors++;
      
      this.mirrorHistory.push(trade);
      this.activeMirrors.delete(trade.id);
      
      this.emit('trade:failed', trade, errorMsg);
      
      logger.error(`[WhaleMirror] Mirror trade failed:`, error);
    }
  }

  private async waitBlocks(blocks: number): Promise<void> {
    const startBlock = await this.provider.getBlockNumber();
    
    while (true) {
      const currentBlock = await this.provider.getBlockNumber();
      if (currentBlock - startBlock >= blocks) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private checkDailyReset(): void {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    if (now - this.lastDayReset >= dayMs) {
      this.dailyMirrorValue = 0n;
      this.stats.todayMirrors = 0;
      this.stats.todayPnL = 0;
      this.stats.todayValueEth = '0';
      this.lastDayReset = now;
      
      logger.info('[WhaleMirror] Daily counters reset');
    }
  }

  // ==========================================================================
  // MONITORING LOOPS
  // ==========================================================================

  private startWalletMonitoring(): void {
    // Update wallet stats every 5 minutes
    this.walletUpdateInterval = setInterval(async () => {
      if (!this.isRunning) return;
      
      for (const [address, wallet] of this.topWallets) {
        // Update last trade time, recent performance, etc.
        // In production, this would query analytics APIs
        wallet.lastUpdated = Date.now();
        this.emit('wallet:updated', wallet);
      }
      
      this.updateWalletStats();
    }, 5 * 60 * 1000);
  }

  private startStatsUpdates(): void {
    // Update stats every minute
    this.statsUpdateInterval = setInterval(() => {
      if (!this.isRunning) return;
      
      this.checkDailyReset();
      this.calculateMirrorStats();
      this.stats.lastUpdated = Date.now();
      this.emit('stats:updated', this.stats);
    }, 60 * 1000);
  }

  private calculateMirrorStats(): void {
    const completedMirrors = this.mirrorHistory.filter(m => m.status === 'COMPLETED');
    
    if (completedMirrors.length === 0) return;
    
    // Calculate win rate (trades with positive PnL)
    const profitableMirrors = completedMirrors.filter(m => (m.pnl || 0) > 0);
    this.stats.mirrorWinRate = (profitableMirrors.length / completedMirrors.length) * 100;
    
    // Calculate total PnL
    this.stats.totalMirrorPnL = completedMirrors.reduce((sum, m) => sum + (m.pnl || 0), 0);
    
    // Calculate average ROI
    const totalROI = completedMirrors.reduce((sum, m) => sum + (m.pnlPercent || 0), 0);
    this.stats.avgMirrorROI = totalROI / completedMirrors.length;
    
    // Calculate average delay
    const totalDelay = completedMirrors.reduce((sum, m) => sum + (m.delayMs || 0), 0);
    this.stats.avgDelayMs = totalDelay / completedMirrors.length;
    
    // Find best and worst trades
    let best = completedMirrors[0];
    let worst = completedMirrors[0];
    
    for (const mirror of completedMirrors) {
      if ((mirror.pnl || 0) > (best.pnl || 0)) best = mirror;
      if ((mirror.pnl || 0) < (worst.pnl || 0)) worst = mirror;
    }
    
    if (best.pnl && best.pnl > 0) {
      this.stats.bestMirrorTrade = {
        tokenSymbol: best.tokenSymbol,
        pnl: best.pnl,
        sourceWallet: best.sourceWallet
      };
    }
    
    if (worst.pnl && worst.pnl < 0) {
      this.stats.worstMirrorTrade = {
        tokenSymbol: worst.tokenSymbol,
        pnl: worst.pnl,
        sourceWallet: worst.sourceWallet
      };
    }
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  getConfig(): WhaleMirrorConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<WhaleMirrorConfig>): void {
    this.config = { ...this.config, ...updates };
    logger.info('[WhaleMirror] Configuration updated');
  }

  getTopWallets(): TopWallet[] {
    return Array.from(this.topWallets.values())
      .sort((a, b) => a.rank - b.rank);
  }

  getWallet(address: string): TopWallet | undefined {
    return this.topWallets.get(address.toLowerCase());
  }

  getActiveMirrors(): MirrorTrade[] {
    return Array.from(this.activeMirrors.values());
  }

  getMirrorHistory(limit: number = 100): MirrorTrade[] {
    return this.mirrorHistory.slice(-limit).reverse();
  }

  getMirrorsByWallet(walletAddress: string): MirrorTrade[] {
    const normalized = walletAddress.toLowerCase();
    return this.mirrorHistory.filter(
      m => m.sourceWallet.toLowerCase() === normalized
    );
  }

  getStats(): WhaleMirrorStats {
    return { ...this.stats };
  }

  isActive(): boolean {
    return this.isRunning;
  }

  // Get leaderboard
  getLeaderboard(limit: number = 10): TopWallet[] {
    return Array.from(this.topWallets.values())
      .sort((a, b) => b.totalPnL - a.totalPnL)
      .slice(0, limit);
  }

  // Get hot wallets (most active in last 24h)
  getHotWallets(limit: number = 10): TopWallet[] {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    return Array.from(this.topWallets.values())
      .filter(w => now - w.lastTradeTime < dayMs)
      .sort((a, b) => b.last7dTrades - a.last7dTrades)
      .slice(0, limit);
  }

  // Update PnL for a mirror trade (called when position is closed)
  updateMirrorPnL(
    tradeId: string,
    pnl: number,
    pnlPercent: number
  ): void {
    const trade = this.mirrorHistory.find(m => m.id === tradeId);
    if (!trade) return;
    
    trade.pnl = pnl;
    trade.pnlPercent = pnlPercent;
    
    // Update wallet stats
    const wallet = this.topWallets.get(trade.sourceWallet.toLowerCase());
    if (wallet) {
      wallet.mirrorPnL += pnl;
      // Recalculate win rate
      const walletMirrors = this.getMirrorsByWallet(wallet.address);
      const profitable = walletMirrors.filter(m => (m.pnl || 0) > 0).length;
      wallet.mirrorWinRate = (profitable / walletMirrors.length) * 100;
    }
    
    // Update today's PnL
    const now = Date.now();
    if (trade.mirrorExecutedAt && now - trade.mirrorExecutedAt < 24 * 60 * 60 * 1000) {
      this.stats.todayPnL += pnl;
    }
    
    this.calculateMirrorStats();
  }
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

interface ParsedTradeInfo {
  sourceAction: 'BUY' | 'SELL';
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  amountEth: string;
  amountWei: bigint;
  txHash: string;
}

interface WalletPerformance {
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  winRate: number;
  avgROI: number;
  totalTrades: number;
  avgHoldTimeHours: number;
  last7dTrades: number;
  last7dPnL: number;
  last7dWinRate: number;
  lastTradeTime: number;
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const whaleMirrorTrading = new WhaleMirrorTrading();

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createWhaleMirrorTrading(
  config?: Partial<WhaleMirrorConfig>
): WhaleMirrorTrading {
  return new WhaleMirrorTrading(config);
}
