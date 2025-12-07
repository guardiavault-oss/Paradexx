// MEV Protection API Service - Real Integration with MEV Protection Service
// Calls actual endpoints from the MEV protection service (no mocks)

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from './logger.service';
import { ethers } from 'ethers';

// Configuration from environment variables
const MEV_PROTECTION_API_URL = process.env.MEV_PROTECTION_API_URL || 'http://localhost:8000';
const MEV_PROTECTION_API_KEY = process.env.MEV_PROTECTION_API_KEY || 'demo-api-key';

// Network name mapping
const NETWORK_MAP: Record<number, string> = {
  1: 'ethereum',
  137: 'polygon',
  56: 'bsc',
  42161: 'arbitrum',
  10: 'optimism',
  43114: 'avalanche',
  250: 'fantom',
  8453: 'base',
  59144: 'linea',
  534352: 'scroll',
};

export type ProtectionLevel = 'basic' | 'standard' | 'high' | 'maximum' | 'enterprise';

export interface TransactionProtectionRequest {
  transaction_hash: string;
  network: string;
  protection_level?: ProtectionLevel;
  gas_limit?: number;
  max_gas_price?: number;
  slippage_tolerance?: number;
  private_mempool?: boolean;
}

export interface TransactionProtectionResponse {
  status: string;
  protection: {
    transaction_hash: string;
    network: string;
    protection_level: string;
    strategies: string[];
    status: string;
    created_at: string;
    result?: {
      success: boolean;
      strategy_used: string;
      gas_saved: number;
      value_protected: number;
      execution_time: number;
    };
  };
  timestamp: string;
}

export interface ProtectionStatusResponse {
  is_active: boolean;
  status: string;
  protection_level: string;
  active_networks: string[];
  networks: string[];
  uptime_hours: number;
  threats_detected_24h: number;
  transactions_protected_24h: number;
  value_protected_usd: number;
  statistics: {
    threats_detected: number;
    transactions_protected: number;
    value_protected: number;
    success_rate: number;
  };
}

export interface ThreatDetectionResponse {
  threats: Array<{
    threat_id: string;
    threat_type: string;
    target_transaction: string;
    attacker_address: string;
    profit_potential: number;
    gas_price: number;
    confidence: number;
    severity: string;
    detected_at: string;
    network: string;
    protection_applied: boolean;
    mitigation_strategy: string;
    estimated_loss: number;
  }>;
  total_count: number;
  limit: number;
  offset: number;
  timestamp: string;
}

export interface MevMetricsResponse {
  total_mev_saved: number;
  transactions_protected: number;
  average_mev_per_transaction: number;
  gas_cost_saved: number;
  successful_protections: number;
  failed_protections: number;
  protection_success_rate: number;
  relay_usage_stats: Record<string, any>;
  time_period: string;
  network_breakdown: Record<string, number>;
  generated_at: string;
  timestamp: string;
}

export interface StartProtectionRequest {
  networks: string[];
  protection_level: ProtectionLevel;
}

export interface StartProtectionResponse {
  status: string;
  message: string;
  networks: string[];
  protection_level: string;
  timestamp: string;
}

class MevProtectionApiService {
  private client: AxiosInstance;
  private isConnected: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: MEV_PROTECTION_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': MEV_PROTECTION_API_KEY,
        'Authorization': `Bearer ${MEV_PROTECTION_API_KEY}`,
      },
    });

    // Start health check
    this.checkConnection();
  }

  /**
   * Check if the MEV protection service is available
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      this.isConnected = response.data.status === 'healthy';
      
      if (this.isConnected && !this.healthCheckInterval) {
        this.startHealthCheck();
        logger.info('[MEV Protection API] Connected successfully');
      }
      
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      logger.warn('[MEV Protection API] Service unavailable:', (error as Error).message);
      return false;
    }
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkConnection();
    }, 60000); // Check every minute
  }

  /**
   * Start MEV protection for specified networks
   */
  async startProtection(request: StartProtectionRequest): Promise<StartProtectionResponse> {
    try {
      const response = await this.client.post<StartProtectionResponse>(
        '/api/v1/protection/start',
        request
      );
      logger.info(`[MEV Protection] Started for networks: ${request.networks.join(', ')}`);
      return response.data;
    } catch (error) {
      logger.error('[MEV Protection] Failed to start protection:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Stop MEV protection
   */
  async stopProtection(networks?: string[]): Promise<{ status: string; message: string; timestamp: string }> {
    try {
      const response = await this.client.post('/api/v1/protection/stop', {
        networks: networks || null,
      });
      logger.info('[MEV Protection] Stopped protection');
      return response.data;
    } catch (error) {
      logger.error('[MEV Protection] Failed to stop protection:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get current protection status
   */
  async getProtectionStatus(): Promise<ProtectionStatusResponse> {
    try {
      const response = await this.client.get<ProtectionStatusResponse>(
        '/api/v1/protection/status'
      );
      return response.data;
    } catch (error) {
      logger.error('[MEV Protection] Failed to get status:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Protect a specific transaction
   */
  async protectTransaction(
    txHash: string,
    chainId: number,
    options?: {
      protectionLevel?: ProtectionLevel;
      gasLimit?: number;
      maxGasPrice?: number;
      slippageTolerance?: number;
      privateMempool?: boolean;
    }
  ): Promise<TransactionProtectionResponse> {
    if (!this.isConnected) {
      throw new Error('MEV Protection service is not available. Please ensure the service is running.');
    }

    const network = NETWORK_MAP[chainId];
    if (!network) {
      throw new Error(`Unsupported network chain ID: ${chainId}`);
    }

    try {
      const request: TransactionProtectionRequest = {
        transaction_hash: txHash,
        network,
        protection_level: options?.protectionLevel || 'high',
        gas_limit: options?.gasLimit,
        max_gas_price: options?.maxGasPrice,
        slippage_tolerance: options?.slippageTolerance,
        private_mempool: options?.privateMempool ?? true,
      };

      const response = await this.client.post<TransactionProtectionResponse>(
        '/api/v1/transactions/protect',
        request
      );

      logger.info(`[MEV Protection] Transaction protected: ${txHash}`);
      return response.data;
    } catch (error) {
      logger.error('[MEV Protection] Failed to protect transaction:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Detect MEV threats
   */
  async detectThreats(filters?: {
    network?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    threatType?: 'sandwich' | 'frontrun' | 'backrun' | 'other';
    limit?: number;
    offset?: number;
  }): Promise<ThreatDetectionResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.network) params.append('network', filters.network);
      if (filters?.severity) params.append('severity', filters.severity);
      if (filters?.threatType) params.append('threat_type', filters.threatType);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await this.client.get<ThreatDetectionResponse>(
        `/api/v1/threats?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      logger.error('[MEV Protection] Failed to detect threats:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get MEV metrics
   */
  async getMevMetrics(timePeriod: string = '1h'): Promise<MevMetricsResponse> {
    try {
      const response = await this.client.get<MevMetricsResponse>(
        `/api/v1/mev/metrics?time_period=${timePeriod}`
      );
      return response.data;
    } catch (error) {
      logger.error('[MEV Protection] Failed to get MEV metrics:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get protection statistics
   */
  async getStats(network?: string, timeframe: string = '24h'): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (network) params.append('network', network);
      params.append('timeframe', timeframe);

      const response = await this.client.get(`/api/v1/stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      logger.error('[MEV Protection] Failed to get stats:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboard(): Promise<any> {
    try {
      const response = await this.client.get('/api/v1/dashboard');
      return response.data;
    } catch (error) {
      logger.error('[MEV Protection] Failed to get dashboard:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Analyze transaction for MEV exposure
   */
  async analyzeTransaction(
    txHash: string,
    chainId: number,
    detectionLevel: 'basic' | 'standard' | 'advanced' = 'standard'
  ): Promise<any> {
    try {
      const network = NETWORK_MAP[chainId];
      if (!network) {
        throw new Error(`Unsupported network chain ID: ${chainId}`);
      }

      const response = await this.client.post('/api/v1/mev/detect', {
        transaction_data: {
          hash: txHash,
        },
        network,
        detection_level: detectionLevel,
      });
      return response.data;
    } catch (error) {
      logger.error('[MEV Protection] Failed to analyze transaction:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus(chainId: number): Promise<any> {
    try {
      const network = NETWORK_MAP[chainId];
      if (!network) {
        throw new Error(`Unsupported network chain ID: ${chainId}`);
      }

      const response = await this.client.get(`/api/v1/networks/${network}/status`);
      return response.data;
    } catch (error) {
      logger.error('[MEV Protection] Failed to get network status:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get relay status
   */
  async getRelayStatus(): Promise<any> {
    try {
      const response = await this.client.get('/api/v1/relays');
      return response.data;
    } catch (error) {
      logger.error('[MEV Protection] Failed to get relay status:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Check if service is connected
   */
  isConnectedToService(): boolean {
    return this.isConnected;
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        return new Error(
          `MEV Protection API Error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`
        );
      } else if (axiosError.request) {
        return new Error('MEV Protection API: No response received. Is the service running?');
      }
    }
    return new Error(`MEV Protection API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export singleton instance
export const mevProtectionApi = new MevProtectionApiService();


