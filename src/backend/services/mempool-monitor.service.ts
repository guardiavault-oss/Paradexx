// Mempool Monitoring Service - Pro Tier Feature
// Integrates with external mempool monitoring for MEV protection

import { EventEmitter } from 'events';
import { logger } from '../services/logger.service';
import WebSocket from 'ws';

export interface PendingTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  data: string;
  nonce: number;
  timestamp: number;
  detectedAt: number;
}

export interface SandwichAttack {
  victimTx: string;
  frontrunTx: string;
  backrunTx: string;
  targetToken: string;
  estimatedProfit: string;
  confidence: number;
  detectedAt: number;
}

export interface FrontrunRisk {
  transactionHash: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  reasons: string[];
  recommendations: string[];
  similarPendingTxs: number;
  estimatedLoss: string;
}

export interface MempoolStats {
  pendingCount: number;
  averageGasPrice: string;
  topGasPrice: string;
  lowGasPrice: string;
  lastUpdated: number;
  dexSwapsInPool: number;
  largeTransactions: number;
}

export interface MempoolMonitorConfig {
  wsUrl?: string;
  apiUrl?: string;
  apiKey?: string;
  enabled: boolean;
  alertThreshold: number; // Risk score threshold for alerts
  monitoredTokens: string[]; // Token addresses to watch
  monitoredPairs: string[]; // DEX pair addresses to watch
}

// Known DEX router addresses for sandwich detection
const DEX_ROUTERS: Record<string, string> = {
  'uniswapV2': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  'uniswapV3': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  'sushiswap': '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
  '1inch': '0x1111111254fb6c44bAC0beD2854e76F90643097d',
  'paraswap': '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
  'cowswap': '0x9008D19f58AAbD9eD0D60971565AA8510560ab41',
};

// Known MEV bot patterns
const MEV_BOT_PATTERNS = [
  /^0x00000000/i, // Common MEV bot prefix
  /^0x80/, // Flashbots builder pattern
];

class MempoolMonitorService extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: MempoolMonitorConfig;
  private pendingTxs: Map<string, PendingTransaction> = new Map();
  private sandwichAlerts: SandwichAttack[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000;
  private isConnected: boolean = false;
  private stats: MempoolStats = {
    pendingCount: 0,
    averageGasPrice: '0',
    topGasPrice: '0',
    lowGasPrice: '0',
    lastUpdated: 0,
    dexSwapsInPool: 0,
    largeTransactions: 0,
  };

  constructor(config?: Partial<MempoolMonitorConfig>) {
    super();
    this.config = {
      wsUrl: process.env.MEMPOOL_WS_URL,
      apiUrl: process.env.MEMPOOL_API_URL,
      apiKey: process.env.MEMPOOL_API_KEY,
      enabled: !!process.env.MEMPOOL_WS_URL,
      alertThreshold: 70,
      monitoredTokens: [],
      monitoredPairs: [],
      ...config,
    };

    if (this.config.enabled) {
      logger.info('[MempoolMonitor] Service initialized - Pro feature enabled');
    } else {
      logger.info('[MempoolMonitor] Service disabled - No mempool URL configured');
    }
  }

  // Connect to external mempool monitoring service
  async connect(): Promise<boolean> {
    if (!this.config.enabled || !this.config.wsUrl) {
      logger.info('[MempoolMonitor] Connection skipped - not configured');
      return false;
    }

    return new Promise((resolve) => {
      try {
        const baseUrl = this.config.wsUrl;
        if (!baseUrl) {
          logger.info('[MempoolMonitor] No WebSocket URL configured');
          resolve(false);
          return;
        }
        
        const wsUrl = this.config.apiKey 
          ? `${baseUrl}?apiKey=${this.config.apiKey}`
          : baseUrl;

        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
          logger.info('[MempoolMonitor] Connected to mempool service');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          
          // Subscribe to pending transactions
          this.subscribe();
          resolve(true);
        });

        this.ws.on('message', (data: Buffer) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('close', () => {
          logger.info('[MempoolMonitor] Connection closed');
          this.isConnected = false;
          this.emit('disconnected');
          this.attemptReconnect();
        });

        this.ws.on('error', (error) => {
          logger.error('[MempoolMonitor] WebSocket error:', error.message);
          this.emit('error', error);
        });

      } catch (error) {
        logger.error('[MempoolMonitor] Connection failed:', error);
        resolve(false);
      }
    });
  }

  private subscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Subscribe to pending transactions
    this.ws.send(JSON.stringify({
      type: 'subscribe',
      channel: 'pending_transactions',
      filters: {
        to: Object.values(DEX_ROUTERS),
        minValue: '1000000000000000000', // 1 ETH minimum
      },
    }));

    // Subscribe to DEX swaps
    if (this.config.monitoredPairs.length > 0) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'dex_swaps',
        pairs: this.config.monitoredPairs,
      }));
    }
  }

  private handleMessage(message: string): void {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'pending_tx':
          this.handlePendingTransaction(data.transaction);
          break;
        case 'sandwich_detected':
          this.handleSandwichDetection(data.attack);
          break;
        case 'stats_update':
          this.updateStats(data.stats);
          break;
        case 'alert':
          this.emit('alert', data);
          break;
      }
    } catch (error) {
      logger.error('[MempoolMonitor] Message parse error:', error);
    }
  }

  private handlePendingTransaction(tx: PendingTransaction): void {
    this.pendingTxs.set(tx.hash, {
      ...tx,
      detectedAt: Date.now(),
    });

    // Cleanup old transactions (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [hash, pendingTx] of this.pendingTxs) {
      if (pendingTx.detectedAt < fiveMinutesAgo) {
        this.pendingTxs.delete(hash);
      }
    }

    // Analyze for MEV risk
    const risk = this.analyzeTransaction(tx);
    if (risk.riskScore >= this.config.alertThreshold) {
      this.emit('high_risk_tx', { transaction: tx, risk });
    }

    this.emit('pending_tx', tx);
  }

  private handleSandwichDetection(attack: SandwichAttack): void {
    this.sandwichAlerts.push(attack);
    
    // Keep only last 100 alerts
    if (this.sandwichAlerts.length > 100) {
      this.sandwichAlerts = this.sandwichAlerts.slice(-100);
    }

    this.emit('sandwich_detected', attack);
  }

  private updateStats(stats: Partial<MempoolStats>): void {
    this.stats = {
      ...this.stats,
      ...stats,
      lastUpdated: Date.now(),
    };
    this.emit('stats_update', this.stats);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.info('[MempoolMonitor] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    logger.info(`[MempoolMonitor] Reconnecting (attempt ${this.reconnectAttempts})...`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // Analyze transaction for frontrun/sandwich risk
  analyzeTransaction(tx: PendingTransaction): FrontrunRisk {
    const reasons: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Check if it's a DEX swap
    const isDexSwap = Object.values(DEX_ROUTERS).some(
      router => tx.to.toLowerCase() === router.toLowerCase()
    );

    if (isDexSwap) {
      riskScore += 30;
      reasons.push('Transaction targets known DEX router');
      recommendations.push('Consider using MEV-protected RPC (Flashbots/Eden)');
    }

    // Check transaction value
    const valueInEth = parseFloat(tx.value) / 1e18;
    if (valueInEth > 10) {
      riskScore += 25;
      reasons.push(`Large transaction value (${valueInEth.toFixed(2)} ETH)`);
      recommendations.push('Split into smaller transactions');
    } else if (valueInEth > 1) {
      riskScore += 10;
    }

    // Check gas price competitiveness
    const txGasPrice = BigInt(tx.gasPrice || tx.maxFeePerGas || '0');
    const avgGasPrice = BigInt(this.stats.averageGasPrice || '0');
    
    if (avgGasPrice > 0n && txGasPrice < avgGasPrice) {
      riskScore += 15;
      reasons.push('Gas price below mempool average');
      recommendations.push('Increase gas price for faster inclusion');
    }

    // Check for similar pending transactions (potential competition)
    const similarTxs = this.findSimilarPendingTxs(tx);
    if (similarTxs > 0) {
      riskScore += Math.min(similarTxs * 5, 20);
      reasons.push(`${similarTxs} similar transactions in mempool`);
      recommendations.push('High competition - consider using private mempool');
    }

    // Check for MEV bot patterns in data
    if (this.looksLikeMevBot(tx.from)) {
      riskScore = Math.max(riskScore - 20, 0); // Lower risk if sender is likely MEV bot
    }

    // Estimate potential loss
    const estimatedLoss = this.estimateMevLoss(tx, riskScore);

    // Determine risk level
    let riskLevel: FrontrunRisk['riskLevel'];
    if (riskScore >= 80) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';
    else riskLevel = 'low';

    return {
      transactionHash: tx.hash,
      riskLevel,
      riskScore,
      reasons,
      recommendations,
      similarPendingTxs: similarTxs,
      estimatedLoss,
    };
  }

  private findSimilarPendingTxs(tx: PendingTransaction): number {
    let count = 0;
    for (const [, pendingTx] of this.pendingTxs) {
      if (pendingTx.hash === tx.hash) continue;
      if (pendingTx.to.toLowerCase() === tx.to.toLowerCase()) {
        // Check if same method signature (first 4 bytes of data)
        if (tx.data.slice(0, 10) === pendingTx.data.slice(0, 10)) {
          count++;
        }
      }
    }
    return count;
  }

  private looksLikeMevBot(address: string): boolean {
    return MEV_BOT_PATTERNS.some(pattern => pattern.test(address));
  }

  private estimateMevLoss(tx: PendingTransaction, riskScore: number): string {
    // Rough estimation based on risk score and transaction value
    const valueInEth = parseFloat(tx.value) / 1e18;
    const estimatedLossPercentage = (riskScore / 100) * 0.05; // Up to 5% loss at max risk
    const estimatedLoss = valueInEth * estimatedLossPercentage;
    return estimatedLoss.toFixed(4);
  }

  // Public API methods

  // Check if a transaction should use private mempool
  shouldUsePrivateMempool(tx: { to: string; value: string; data: string }): boolean {
    // Check if targeting DEX
    const isDexSwap = Object.values(DEX_ROUTERS).some(
      router => tx.to.toLowerCase() === router.toLowerCase()
    );
    if (!isDexSwap) return false;

    // Check value threshold (> 0.5 ETH)
    const valueInEth = parseFloat(tx.value) / 1e18;
    if (valueInEth > 0.5) return true;

    // Check if high activity in mempool for this contract
    const pendingToSameContract = [...this.pendingTxs.values()].filter(
      ptx => ptx.to.toLowerCase() === tx.to.toLowerCase()
    ).length;
    if (pendingToSameContract > 5) return true;

    return false;
  }

  // Get current mempool stats
  getStats(): MempoolStats {
    return { ...this.stats };
  }

  // Get recent sandwich attacks
  getRecentSandwichAttacks(limit: number = 10): SandwichAttack[] {
    return this.sandwichAlerts.slice(-limit);
  }

  // Get pending transactions for an address
  getPendingForAddress(address: string): PendingTransaction[] {
    return [...this.pendingTxs.values()].filter(
      tx => tx.from.toLowerCase() === address.toLowerCase() ||
            tx.to.toLowerCase() === address.toLowerCase()
    );
  }

  // Check connection status
  isActive(): boolean {
    return this.isConnected;
  }

  // Disconnect
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  // Add token to monitoring list
  addMonitoredToken(tokenAddress: string): void {
    if (!this.config.monitoredTokens.includes(tokenAddress)) {
      this.config.monitoredTokens.push(tokenAddress);
    }
  }

  // Add pair to monitoring list
  addMonitoredPair(pairAddress: string): void {
    if (!this.config.monitoredPairs.includes(pairAddress)) {
      this.config.monitoredPairs.push(pairAddress);
      if (this.isConnected) {
        this.subscribe(); // Resubscribe with new pair
      }
    }
  }
}

// Export singleton instance
export const mempoolMonitor = new MempoolMonitorService();
export { MempoolMonitorService, DEX_ROUTERS };
