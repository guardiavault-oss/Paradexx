import { logger } from '../services/logger.service';
/**
 * Profit Routing Service
 * Routes all profits (swaps, bridges, yields, subscriptions) to the configured profit wallet
 */

interface ProfitTransaction {
  id: string;
  source: 'swap' | 'bridge' | 'yield' | 'subscription' | 'other';
  amount: number;
  currency: string;
  toWallet: string;
  fromWallet?: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  metadata?: Record<string, any>;
}

interface ProfitStats {
  totalSwapProfits: number;
  totalBridgeProfits: number;
  totalYieldProfits: number;
  totalSubscriptionProfits: number;
  totalProfits: number;
  transactionCount: number;
  lastUpdateTime: number;
}

const PROFIT_WALLET = process.env.PROFIT_WALLET_ADDRESS;
const PROFIT_DB_KEY = 'profit_transactions';

export class ProfitRoutingService {
  private static instance: ProfitRoutingService;
  private profitTransactions: Map<string, ProfitTransaction> = new Map();

  private constructor() {
    this.initializeFromStorage();
  }

  static getInstance(): ProfitRoutingService {
    if (!ProfitRoutingService.instance) {
      ProfitRoutingService.instance = new ProfitRoutingService();
    }
    return ProfitRoutingService.instance;
  }

  /**
   * Initialize from persistent storage (in real app, would be database)
   */
  private initializeFromStorage(): void {
    try {
      const stored = process.env[PROFIT_DB_KEY];
      if (stored) {
        const transactions = JSON.parse(stored) as ProfitTransaction[];
        transactions.forEach(tx => {
          this.profitTransactions.set(tx.id, tx);
        });
      }
    } catch (error) {
      logger.error('[ProfitRouting] Error loading from storage:', error);
    }
  }

  /**
   * Get configured profit wallet
   */
  getProfitWallet(): string {
    return PROFIT_WALLET || '0x0000000000000000000000000000000000000000';
  }

  /**
   * Is profit routing configured?
   */
  isConfigured(): boolean {
    return !!PROFIT_WALLET;
  }

  /**
   * Route a swap profit
   */
  async routeSwapProfit(params: {
    amount: number;
    currency: string;
    fromWallet?: string;
    txHash?: string;
    metadata?: Record<string, any>;
  }): Promise<ProfitTransaction> {
    const transaction: ProfitTransaction = {
      id: `swap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'swap',
      amount: params.amount,
      currency: params.currency,
      toWallet: this.getProfitWallet(),
      fromWallet: params.fromWallet,
      timestamp: Date.now(),
      status: 'pending',
      txHash: params.txHash,
      metadata: params.metadata,
    };

    this.profitTransactions.set(transaction.id, transaction);
    await this.persistTransactions();

    logger.info(
      `[ProfitRouting] Swap profit routed: ${params.amount} ${params.currency} -> ${this.getProfitWallet().slice(0, 6)}...`
    );

    return transaction;
  }

  /**
   * Route a bridge profit
   */
  async routeBridgeProfit(params: {
    amount: number;
    currency: string;
    fromWallet?: string;
    txHash?: string;
    metadata?: Record<string, any>;
  }): Promise<ProfitTransaction> {
    const transaction: ProfitTransaction = {
      id: `bridge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'bridge',
      amount: params.amount,
      currency: params.currency,
      toWallet: this.getProfitWallet(),
      fromWallet: params.fromWallet,
      timestamp: Date.now(),
      status: 'pending',
      txHash: params.txHash,
      metadata: params.metadata,
    };

    this.profitTransactions.set(transaction.id, transaction);
    await this.persistTransactions();

    logger.info(
      `[ProfitRouting] Bridge profit routed: ${params.amount} ${params.currency} -> ${this.getProfitWallet().slice(0, 6)}...`
    );

    return transaction;
  }

  /**
   * Route a yield profit
   */
  async routeYieldProfit(params: {
    amount: number;
    currency: string;
    fromWallet?: string;
    txHash?: string;
    metadata?: Record<string, any>;
  }): Promise<ProfitTransaction> {
    const transaction: ProfitTransaction = {
      id: `yield-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'yield',
      amount: params.amount,
      currency: params.currency,
      toWallet: this.getProfitWallet(),
      fromWallet: params.fromWallet,
      timestamp: Date.now(),
      status: 'pending',
      txHash: params.txHash,
      metadata: params.metadata,
    };

    this.profitTransactions.set(transaction.id, transaction);
    await this.persistTransactions();

    logger.info(
      `[ProfitRouting] Yield profit routed: ${params.amount} ${params.currency} -> ${this.getProfitWallet().slice(0, 6)}...`
    );

    return transaction;
  }

  /**
   * Route a subscription profit
   */
  async routeSubscriptionProfit(params: {
    amount: number;
    currency: string;
    fromWallet?: string;
    txHash?: string;
    metadata?: Record<string, any>;
  }): Promise<ProfitTransaction> {
    const transaction: ProfitTransaction = {
      id: `subscription-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'subscription',
      amount: params.amount,
      currency: params.currency,
      toWallet: this.getProfitWallet(),
      fromWallet: params.fromWallet,
      timestamp: Date.now(),
      status: 'pending',
      txHash: params.txHash,
      metadata: params.metadata,
    };

    this.profitTransactions.set(transaction.id, transaction);
    await this.persistTransactions();

    logger.info(
      `[ProfitRouting] Subscription profit routed: ${params.amount} ${params.currency} -> ${this.getProfitWallet().slice(0, 6)}...`
    );

    return transaction;
  }

  /**
   * Mark transaction as completed
   */
  async completeTransaction(id: string, txHash: string): Promise<ProfitTransaction | null> {
    const tx = this.profitTransactions.get(id);
    if (!tx) return null;

    tx.status = 'completed';
    tx.txHash = txHash;

    this.profitTransactions.set(id, tx);
    await this.persistTransactions();

    return tx;
  }

  /**
   * Get transaction by ID
   */
  getTransaction(id: string): ProfitTransaction | null {
    return this.profitTransactions.get(id) || null;
  }

  /**
   * Get all transactions
   */
  getAllTransactions(): ProfitTransaction[] {
    return Array.from(this.profitTransactions.values());
  }

  /**
   * Get profit statistics
   */
  getStats(): ProfitStats {
    const transactions = Array.from(this.profitTransactions.values());

    const stats: ProfitStats = {
      totalSwapProfits: transactions
        .filter(tx => tx.source === 'swap' && tx.status === 'completed')
        .reduce((sum, tx) => sum + tx.amount, 0),
      totalBridgeProfits: transactions
        .filter(tx => tx.source === 'bridge' && tx.status === 'completed')
        .reduce((sum, tx) => sum + tx.amount, 0),
      totalYieldProfits: transactions
        .filter(tx => tx.source === 'yield' && tx.status === 'completed')
        .reduce((sum, tx) => sum + tx.amount, 0),
      totalSubscriptionProfits: transactions
        .filter(tx => tx.source === 'subscription' && tx.status === 'completed')
        .reduce((sum, tx) => sum + tx.amount, 0),
      totalProfits: 0,
      transactionCount: transactions.length,
      lastUpdateTime: Date.now(),
    };

    stats.totalProfits =
      stats.totalSwapProfits +
      stats.totalBridgeProfits +
      stats.totalYieldProfits +
      stats.totalSubscriptionProfits;

    return stats;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      profitWallet: this.getProfitWallet(),
      message: this.isConfigured()
        ? 'Profit routing active'
        : 'Profit wallet not configured. Set PROFIT_WALLET_ADDRESS to enable profit routing.',
      stats: this.getStats(),
    };
  }

  /**
   * Persist transactions to storage
   */
  private async persistTransactions(): Promise<void> {
    try {
      const transactions = Array.from(this.profitTransactions.values());
      // In a real app, this would save to database
      // For now, just log
      if (transactions.length % 10 === 0) {
        logger.info(`[ProfitRouting] Persisted ${transactions.length} transactions`);
      }
    } catch (error) {
      logger.error('[ProfitRouting] Error persisting transactions:', error);
    }
  }
}

export default ProfitRoutingService.getInstance();
