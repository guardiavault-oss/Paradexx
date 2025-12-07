// Unified Mempool Service Integration
// Connects Node.js backend to Python unified mempool system

import axios, { AxiosInstance } from 'axios';
import { logger } from '../services/logger.service';
import { EventEmitter } from 'events';

const UNIFIED_MEMPOOL_API_URL = process.env.UNIFIED_MEMPOOL_API_URL || 'http://localhost:8001';
const MEMPOOL_CORE_URL = process.env.MEMPOOL_CORE_URL || 'http://localhost:8000';
const MEMPOOL_HUB_URL = process.env.MEMPOOL_HUB_URL || 'http://localhost:8011';

export interface MempoolTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  data: string;
  nonce: number;
  network: string;
  timestamp: number;
  blockNumber?: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface MempoolThreat {
  id: string;
  type: 'sandwich' | 'frontrun' | 'backrun' | 'jamming' | 'oracle_manipulation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  targetTx: string;
  attackerTx?: string;
  estimatedProfit?: string;
  estimatedLoss?: string;
  detectedAt: number;
  network: string;
}

export interface MempoolNetworkStats {
  network: string;
  pendingCount: number;
  averageGasPrice: string;
  topGasPrice: string;
  lowGasPrice: string;
  dexSwapsInPool: number;
  largeTransactions: number;
  sandwichAttacks24h: number;
  frontrunAttempts24h: number;
  lastUpdated: number;
}

export interface UnifiedMempoolStats {
  networks: Record<string, MempoolNetworkStats>;
  totalPending: number;
  totalThreats24h: number;
  avgGasPrice: Record<string, string>;
  systemHealth: {
    mempoolCore: boolean;
    mempoolHub: boolean;
    unifiedEngine: boolean;
  };
}

class UnifiedMempoolService extends EventEmitter {
  private unifiedClient: AxiosInstance;
  private coreClient: AxiosInstance;
  private hubClient: AxiosInstance;
  private isConnected: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    
    this.unifiedClient = axios.create({
      baseURL: UNIFIED_MEMPOOL_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.coreClient = axios.create({
      baseURL: MEMPOOL_CORE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.hubClient = axios.create({
      baseURL: MEMPOOL_HUB_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.connect();
  }

  async connect(): Promise<boolean> {
    try {
      const health = await this.checkHealth();
      if (health.systemHealth.unifiedEngine || health.systemHealth.mempoolCore) {
        this.isConnected = true;
        this.startHealthCheck();
        logger.info('[UnifiedMempool] Connected to mempool services');
        this.emit('connected');
        return true;
      }
      return false;
    } catch (error) {
      logger.warn('[UnifiedMempool] Connection failed - services may not be running');
      return false;
    }
  }

  private startHealthCheck(): void {
    if (this.healthCheckInterval) return;
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.checkHealth();
        if (!health.systemHealth.unifiedEngine && !health.systemHealth.mempoolCore) {
          this.isConnected = false;
          this.emit('disconnected');
        }
      } catch (error) {
        this.isConnected = false;
        this.emit('disconnected');
      }
    }, 30000);
  }

  async checkHealth(): Promise<UnifiedMempoolStats> {
    try {
      // Try unified API first
      try {
        const response = await this.unifiedClient.get('/api/v1/integrated/health', { timeout: 5000 });
        const health = response.data;
        
        return {
          networks: {},
          totalPending: 0,
          totalThreats24h: 0,
          avgGasPrice: {},
          systemHealth: {
            mempoolCore: health.services?.mempool_core === 'healthy',
            mempoolHub: health.services?.mempool_hub === 'healthy',
            unifiedEngine: health.status === 'healthy',
          },
        };
      } catch (error) {
        // Fallback to individual services
        const [coreHealth, hubHealth] = await Promise.allSettled([
          this.coreClient.get('/health', { timeout: 5000 }),
          this.hubClient.get('/health', { timeout: 5000 }),
        ]);

        return {
          networks: {},
          totalPending: 0,
          totalThreats24h: 0,
          avgGasPrice: {},
          systemHealth: {
            mempoolCore: coreHealth.status === 'fulfilled',
            mempoolHub: hubHealth.status === 'fulfilled',
            unifiedEngine: false,
          },
        };
      }
    } catch (error) {
      return {
        networks: {},
        totalPending: 0,
        totalThreats24h: 0,
        avgGasPrice: {},
        systemHealth: {
          mempoolCore: false,
          mempoolHub: false,
          unifiedEngine: false,
        },
      };
    }
  }

  async getTransactions(params: {
    network?: string;
    limit?: number;
    offset?: number;
    suspiciousOnly?: boolean;
  }): Promise<MempoolTransaction[]> {
    if (!this.isConnected) {
      return [];
    }

    try {
      const response = await this.unifiedClient.get('/api/v1/integrated/transactions', {
        params: {
          limit: params.limit || 100,
          network: params.network,
          ...params,
        },
        timeout: 10000,
      });

      return response.data.transactions || response.data || [];
    } catch (error) {
      logger.error('[UnifiedMempool] Get transactions failed:', error);
      return [];
    }
  }

  async getThreats(params: {
    limit?: number;
    severity?: string;
    network?: string;
  }): Promise<MempoolThreat[]> {
    if (!this.isConnected) {
      return [];
    }

    try {
      const response = await this.unifiedClient.get('/api/v1/integrated/threats', {
        params: {
          limit: params.limit || 50,
          ...params,
        },
        timeout: 10000,
      });

      return response.data.threats || response.data || [];
    } catch (error) {
      logger.error('[UnifiedMempool] Get threats failed:', error);
      return [];
    }
  }

  async getNetworkStats(network: string): Promise<MempoolNetworkStats | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const response = await this.hubClient.get(`/stats/${network}`, { timeout: 10000 });
      const data = response.data;
      
      return {
        network,
        pendingCount: data.pending_count || 0,
        averageGasPrice: data.avg_gas_price || '0',
        topGasPrice: data.top_gas_price || '0',
        lowGasPrice: data.low_gas_price || '0',
        dexSwapsInPool: data.dex_swaps || 0,
        largeTransactions: data.large_txs || 0,
        sandwichAttacks24h: data.sandwich_attacks_24h || 0,
        frontrunAttempts24h: data.frontrun_attempts_24h || 0,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      logger.error(`[UnifiedMempool] Get stats for ${network} failed:`, error);
      return null;
    }
  }

  async getAllNetworkStats(): Promise<Record<string, MempoolNetworkStats>> {
    const networks = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base'];
    const stats: Record<string, MempoolNetworkStats> = {};

    const results = await Promise.allSettled(
      networks.map(network => this.getNetworkStats(network))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        stats[networks[index]] = result.value;
      }
    });

    return stats;
  }

  async analyzeTransaction(txHash: string, network: string): Promise<any> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const response = await this.hubClient.post('/analyze', {
        transaction_hash: txHash,
        network,
      }, { timeout: 15000 });

      return response.data;
    } catch (error) {
      logger.error('[UnifiedMempool] Analyze transaction failed:', error);
      return null;
    }
  }

  async getUnifiedStats(): Promise<UnifiedMempoolStats> {
    const health = await this.checkHealth();
    const networkStats = await this.getAllNetworkStats();
    
    const totalPending = Object.values(networkStats).reduce(
      (sum, stats) => sum + stats.pendingCount, 0
    );

    const totalThreats24h = Object.values(networkStats).reduce(
      (sum, stats) => sum + stats.sandwichAttacks24h + stats.frontrunAttempts24h, 0
    );

    const avgGasPrice: Record<string, string> = {};
    Object.entries(networkStats).forEach(([network, stats]) => {
      avgGasPrice[network] = stats.averageGasPrice;
    });

    return {
      networks: networkStats,
      totalPending,
      totalThreats24h,
      avgGasPrice,
      systemHealth: health.systemHealth,
    };
  }

  isConnectedToServices(): boolean {
    return this.isConnected;
  }

  disconnect(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isConnected = false;
  }
}

export const unifiedMempoolService = new UnifiedMempoolService();
export { UnifiedMempoolService };

