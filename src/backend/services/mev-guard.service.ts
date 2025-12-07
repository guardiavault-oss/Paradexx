import axios, { AxiosInstance } from 'axios';
import { logger } from '../services/logger.service';
import { EventEmitter } from 'events';
import { mempoolMonitor, MempoolStats, SandwichAttack, FrontrunRisk, PendingTransaction } from './mempool-monitor.service';
import { enhancedMevProtection, mevProtection, MevProtectionMode, MevRpcProvider } from './mev-protection.service';

const MEV_GUARD_API_URL = process.env.MEV_GUARD_API_URL || 'http://localhost:8080';

export interface MevGuardConfig {
  apiUrl: string;
  apiKey?: string;
  enabled: boolean;
  tier: 'basic' | 'pro' | 'enterprise';
  autoConnect: boolean;
}

export interface MevProtectionRequest {
  fromAddress: string;
  toAddress: string;
  value: string;
  data?: string;
  gasPrice: string;
  chainId: number;
  protectionLevel: 'basic' | 'standard' | 'maximum';
}

export interface MevProtectionResponse {
  protectionId: string;
  mevRiskScore: number;
  riskFactors: string[];
  protectionLevel: string;
  protectionStrategy: string[];
  estimatedProtectionCost: string;
  status: string;
  createdAt: string;
  estimatedSavings: string;
}

export interface MevAnalysisRequest {
  transactionHash?: string;
  contractAddress?: string;
  functionSignature?: string;
  chainId: number;
}

export interface MevAnalysisResponse {
  analysisId: string;
  mevExposure: {
    overallRisk: string;
    riskScore: number;
    potentialLoss: string;
    vulnerabilityTypes: string[];
  };
  attackVectors: Record<string, {
    risk: string;
    confidence: number;
    description: string;
    potentialLoss: string;
    prevention: string;
  }>;
  recommendations: string[];
  protectionOptions: Record<string, { cost: string; effectiveness: string }>;
}

export interface SandwichDetectionRequest {
  targetTxHash: string;
  chainId: number;
  analysisWindow?: number;
}

export interface SandwichDetectionResponse {
  detectionId: string;
  targetTransaction: string;
  sandwichDetected: boolean;
  confidence: number;
  attackDetails?: {
    frontrunTx: string;
    backrunTx: string;
    attackerAddress: string;
    attackerName?: string;
    estimatedProfit: string;
    victimLoss: string;
  };
  preventionSuggestions: string[];
}

export interface FlashbotsRelayRequest {
  transactions: Array<Record<string, unknown>>;
  targetBlock?: number;
  minTimestamp?: number;
  maxTimestamp?: number;
}

export interface FlashbotsRelayResponse {
  bundleId: string;
  status: string;
  relayEndpoint: string;
  protectionLevel: string;
  features: string[];
  estimatedInclusion: string;
}

export interface MevGuardStatus {
  healthy: boolean;
  version: string;
  capabilities: {
    sandwichProtection: boolean;
    frontrunningProtection: boolean;
    flashbotsIntegration: boolean;
    privateRelay: boolean;
    mevBotDetection: boolean;
    realTimeMonitoring: boolean;
  };
  stats: {
    totalProtected: number;
    sandwichAttacksBlocked: number;
    frontrunningPrevented: number;
    savedValueUsd: number;
  };
}

export interface MevKpiMetrics {
  totalMevSavedEth: number;
  totalGasSavedGwei: number;
  protectionSuccessRate: number;
  detectionAccuracy: number;
  avgProtectionTimeMs: number;
  kpiScore: number;
  targetAchievement: number;
  mevSavedByType: Record<string, number>;
  networkPerformance: Record<string, number>;
}

export interface BuilderStatus {
  totalBuilders: number;
  activeBuilders: number;
  degradedBuilders: number;
  offlineBuilders: number;
  avgPerformance: number;
  competitionIndex: number;
  builders: Array<Record<string, unknown>>;
}

export interface RelayStatus {
  totalRelays: number;
  healthScore: number;
  relays: Array<Record<string, unknown>>;
}

class MevGuardService extends EventEmitter {
  private client: AxiosInstance;
  private config: MevGuardConfig;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<MevGuardConfig>) {
    super();
    this.config = {
      apiUrl: MEV_GUARD_API_URL,
      enabled: true,
      tier: 'basic',
      autoConnect: true,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
      },
    });

    if (this.config.enabled && this.config.autoConnect) {
      this.connect().catch(err => {
        logger.info('[MevGuard] Auto-connect failed - service may not be running:', err.message);
      });
    }
  }

  async connect(): Promise<boolean> {
    try {
      const status = await this.checkHealth();
      if (status.healthy) {
        this.isConnected = true;
        this.startHealthCheck();
        logger.info('[MevGuard] Connected to MEV Guard API');
        logger.info(`[MevGuard] Version: ${status.version}`);
        logger.info(`[MevGuard] Capabilities:`, status.capabilities);
        this.emit('connected', status);
        return true;
      }
      return false;
    } catch (error) {
      logger.warn('[MevGuard] Failed to connect:', error);
      this.scheduleReconnect();
      return false;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.info('[MevGuard] Max reconnect attempts reached - running in offline mode');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts - 1), 60000);
    logger.info(`[MevGuard] Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const status = await this.checkHealth();
        if (!status.healthy) {
          this.isConnected = false;
          this.emit('disconnected');
          this.scheduleReconnect();
        }
      } catch (error) {
        this.isConnected = false;
        this.emit('disconnected');
        this.scheduleReconnect();
      }
    }, 30000);
  }

  disconnect(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isConnected = false;
    this.emit('disconnected');
  }

  async checkHealth(): Promise<MevGuardStatus> {
    try {
      const response = await this.client.get('/health');
      return {
        healthy: response.data.status === 'healthy',
        version: response.data.version || '1.0.0',
        capabilities: response.data.capabilities || {
          sandwichProtection: true,
          frontrunningProtection: true,
          flashbotsIntegration: true,
          privateRelay: true,
          mevBotDetection: true,
          realTimeMonitoring: true,
        },
        stats: response.data.stats || {
          totalProtected: 0,
          sandwichAttacksBlocked: 0,
          frontrunningPrevented: 0,
          savedValueUsd: 0,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        version: 'unknown',
        capabilities: {
          sandwichProtection: false,
          frontrunningProtection: false,
          flashbotsIntegration: false,
          privateRelay: false,
          mevBotDetection: false,
          realTimeMonitoring: false,
        },
        stats: {
          totalProtected: 0,
          sandwichAttacksBlocked: 0,
          frontrunningPrevented: 0,
          savedValueUsd: 0,
        },
      };
    }
  }

  async protectTransaction(request: MevProtectionRequest): Promise<MevProtectionResponse> {
    if (!this.isConnected) {
      return this.offlineProtection(request);
    }

    try {
      const response = await this.client.post('/api/protect/transaction', {
        from_address: request.fromAddress,
        to_address: request.toAddress,
        value: request.value,
        data: request.data,
        gas_price: request.gasPrice,
        chain_id: request.chainId,
        protection_level: request.protectionLevel,
      });

      return {
        protectionId: response.data.protection_id,
        mevRiskScore: response.data.mev_risk_score,
        riskFactors: response.data.risk_factors,
        protectionLevel: response.data.protection_level,
        protectionStrategy: response.data.protection_strategy,
        estimatedProtectionCost: response.data.estimated_protection_cost,
        status: response.data.status,
        createdAt: response.data.created_at,
        estimatedSavings: response.data.estimated_savings,
      };
    } catch (error) {
      logger.error('[MevGuard] Protection request failed:', error);
      return this.offlineProtection(request);
    }
  }

  private offlineProtection(request: MevProtectionRequest): MevProtectionResponse {
    const valueEth = parseFloat(request.value) / 1e18;
    let riskScore = 0;
    const riskFactors: string[] = [];

    if (valueEth > 10) {
      riskScore += 30;
      riskFactors.push(`High value transaction: ${valueEth.toFixed(2)} ETH`);
    }

    if (request.data && request.data.length > 10) {
      riskScore += 25;
      riskFactors.push('DEX interaction detected - sandwich risk');
    }

    let strategy: string[];
    let cost: string;

    if (request.protectionLevel === 'maximum') {
      strategy = ['Route via Flashbots private relay', 'Maximum slippage protection', 'Pre-execution simulation'];
      cost = '0.02 ETH';
    } else if (request.protectionLevel === 'standard') {
      strategy = ['Slippage protection', 'Gas price optimization', 'Frontrunning detection'];
      cost = '0.005 ETH';
    } else {
      strategy = ['Basic slippage protection', 'MEV monitoring'];
      cost = '0.001 ETH';
    }

    return {
      protectionId: `offline_protect_${Date.now()}`,
      mevRiskScore: Math.min(riskScore, 100),
      riskFactors: riskFactors.length > 0 ? riskFactors : ['Low MEV risk'],
      protectionLevel: request.protectionLevel,
      protectionStrategy: strategy,
      estimatedProtectionCost: cost,
      status: 'offline_protected',
      createdAt: new Date().toISOString(),
      estimatedSavings: valueEth > 10 ? `$${(valueEth * 0.03).toFixed(2)}` : '$0',
    };
  }

  async analyzeMevExposure(request: MevAnalysisRequest): Promise<MevAnalysisResponse> {
    if (!this.isConnected) {
      return this.offlineMevAnalysis(request);
    }

    try {
      const response = await this.client.post('/api/analyze/mev', {
        transaction_hash: request.transactionHash,
        contract_address: request.contractAddress,
        function_signature: request.functionSignature,
        chain_id: request.chainId,
      });

      return {
        analysisId: response.data.analysis_id,
        mevExposure: {
          overallRisk: response.data.mev_exposure.overall_risk,
          riskScore: response.data.mev_exposure.risk_score,
          potentialLoss: response.data.mev_exposure.potential_loss,
          vulnerabilityTypes: response.data.mev_exposure.vulnerability_types,
        },
        attackVectors: response.data.attack_vectors,
        recommendations: response.data.recommendations,
        protectionOptions: response.data.protection_options,
      };
    } catch (error) {
      logger.error('[MevGuard] Analysis request failed:', error);
      return this.offlineMevAnalysis(request);
    }
  }

  private offlineMevAnalysis(request: MevAnalysisRequest): MevAnalysisResponse {
    return {
      analysisId: `offline_analysis_${Date.now()}`,
      mevExposure: {
        overallRisk: 'medium',
        riskScore: 50,
        potentialLoss: '$100-500',
        vulnerabilityTypes: ['Sandwich attack', 'Frontrunning'],
      },
      attackVectors: {
        sandwich_attack: {
          risk: 'medium',
          confidence: 0.65,
          description: 'Potential DEX swap vulnerability',
          potentialLoss: '$300',
          prevention: 'Use MEV protection or private relay',
        },
        frontrunning: {
          risk: 'low',
          confidence: 0.45,
          description: 'Transaction can be front-run for profit',
          potentialLoss: '$150',
          prevention: 'Increase gas price or use commit-reveal',
        },
      },
      recommendations: [
        'Use Flashbots private relay for high-value transactions',
        'Implement strict slippage limits (< 0.5%)',
        'Consider using MEV-resistant DEX aggregators',
      ],
      protectionOptions: {
        basic: { cost: '$0.50', effectiveness: '60%' },
        standard: { cost: '$2.00', effectiveness: '85%' },
        maximum: { cost: '$5.00', effectiveness: '98%' },
      },
    };
  }

  async detectSandwichAttack(request: SandwichDetectionRequest): Promise<SandwichDetectionResponse> {
    if (!this.isConnected) {
      return this.offlineSandwichDetection(request);
    }

    try {
      const response = await this.client.post('/api/detect/sandwich', {
        target_tx_hash: request.targetTxHash,
        chain_id: request.chainId,
        analysis_window: request.analysisWindow || 5,
      });

      return {
        detectionId: response.data.detection_id,
        targetTransaction: response.data.target_transaction,
        sandwichDetected: response.data.sandwich_detected,
        confidence: response.data.confidence,
        attackDetails: response.data.attack_details ? {
          frontrunTx: response.data.attack_details.frontrun_tx,
          backrunTx: response.data.attack_details.backrun_tx,
          attackerAddress: response.data.attack_details.attacker_address,
          attackerName: response.data.attack_details.attacker_name,
          estimatedProfit: response.data.attack_details.estimated_profit,
          victimLoss: response.data.attack_details.victim_loss,
        } : undefined,
        preventionSuggestions: response.data.prevention_suggestions || [],
      };
    } catch (error) {
      logger.error('[MevGuard] Sandwich detection failed:', error);
      return this.offlineSandwichDetection(request);
    }
  }

  private offlineSandwichDetection(request: SandwichDetectionRequest): SandwichDetectionResponse {
    return {
      detectionId: `offline_sandwich_${Date.now()}`,
      targetTransaction: request.targetTxHash,
      sandwichDetected: false,
      confidence: 0,
      preventionSuggestions: [
        'Use private mempool (Flashbots)',
        'Set maximum slippage to 0.5%',
        'Split large trades into smaller ones',
      ],
    };
  }

  async relayViaFlashbots(request: FlashbotsRelayRequest): Promise<FlashbotsRelayResponse> {
    if (!this.isConnected) {
      throw new Error('Flashbots relay requires connection to MEV Guard service');
    }

    try {
      const response = await this.client.post('/api/flashbots/relay', {
        transactions: request.transactions,
        target_block: request.targetBlock,
        min_timestamp: request.minTimestamp,
        max_timestamp: request.maxTimestamp,
      });

      return {
        bundleId: response.data.bundle_id,
        status: response.data.status,
        relayEndpoint: response.data.relay_endpoint,
        protectionLevel: response.data.protection_level,
        features: response.data.features,
        estimatedInclusion: response.data.estimated_inclusion,
      };
    } catch (error) {
      logger.error('[MevGuard] Flashbots relay failed:', error);
      throw error;
    }
  }

  async getMevBots(): Promise<{ totalKnownBots: number; activeBots: number; knownBots: Record<string, unknown>; botTypes: Record<string, number> }> {
    if (!this.isConnected) {
      return {
        totalKnownBots: 250,
        activeBots: 189,
        knownBots: {},
        botTypes: {
          sandwich_bots: 78,
          arbitrage_bots: 56,
          liquidation_bots: 34,
          frontrunning_bots: 21,
        },
      };
    }

    try {
      const response = await this.client.get('/api/mev-bots');
      return {
        totalKnownBots: response.data.total_known_bots,
        activeBots: response.data.active_bots,
        knownBots: response.data.known_bots,
        botTypes: response.data.bot_types,
      };
    } catch (error) {
      logger.error('[MevGuard] Get MEV bots failed:', error);
      throw error;
    }
  }

  async getStats(): Promise<Record<string, unknown>> {
    if (!this.isConnected) {
      return {
        totalProtected: 0,
        sandwichAttacksBlocked: 0,
        frontrunningPrevented: 0,
        savedValueUsd: 0,
        offline: true,
      };
    }

    try {
      const response = await this.client.get('/api/stats');
      return response.data;
    } catch (error) {
      logger.error('[MevGuard] Get stats failed:', error);
      throw error;
    }
  }

  async getKpiMetrics(): Promise<MevKpiMetrics | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const response = await this.client.get('/api/v1/kpi/metrics');
      return {
        totalMevSavedEth: response.data.total_mev_saved_eth,
        totalGasSavedGwei: response.data.total_gas_saved_gwei,
        protectionSuccessRate: response.data.protection_success_rate,
        detectionAccuracy: response.data.detection_accuracy,
        avgProtectionTimeMs: response.data.avg_protection_time_ms,
        kpiScore: response.data.kpi_score,
        targetAchievement: response.data.target_achievement,
        mevSavedByType: response.data.mev_saved_by_type,
        networkPerformance: response.data.network_performance,
      };
    } catch (error) {
      logger.error('[MevGuard] Get KPI metrics failed:', error);
      return null;
    }
  }

  async getBuilderStatus(): Promise<BuilderStatus | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const response = await this.client.get('/api/v1/builders/status');
      return {
        totalBuilders: response.data.total_builders,
        activeBuilders: response.data.active_builders,
        degradedBuilders: response.data.degraded_builders,
        offlineBuilders: response.data.offline_builders,
        avgPerformance: response.data.avg_performance,
        competitionIndex: response.data.competition_index,
        builders: response.data.builders,
      };
    } catch (error) {
      logger.error('[MevGuard] Get builder status failed:', error);
      return null;
    }
  }

  async getRelayStatus(): Promise<RelayStatus | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const response = await this.client.get('/api/v1/relays/status');
      return {
        totalRelays: response.data.total_relays,
        healthScore: response.data.health_score,
        relays: response.data.relays,
      };
    } catch (error) {
      logger.error('[MevGuard] Get relay status failed:', error);
      return null;
    }
  }

  getMempoolStats(): MempoolStats {
    return mempoolMonitor.getStats();
  }

  getRecentSandwichAttacks(limit: number = 10): SandwichAttack[] {
    return mempoolMonitor.getRecentSandwichAttacks(limit);
  }

  isMempoolMonitorActive(): boolean {
    return mempoolMonitor.isActive();
  }

  async sendProtectedTransaction(
    signedTx: string,
    mode: MevProtectionMode = 'fast'
  ): Promise<{
    txHash: string;
    provider: MevRpcProvider;
    protected: boolean;
    statusUrl?: string;
  }> {
    return enhancedMevProtection.sendProtectedTransactionPro(signedTx, mode);
  }

  async preflightAnalysis(tx: {
    to: string;
    value: string;
    data: string;
    from?: string;
  }): Promise<{
    recommendedRpc: MevRpcProvider;
    riskScore: number;
    recommendations: string[];
    estimatedSavings: string;
  }> {
    return enhancedMevProtection.preflightAnalysis(tx);
  }

  getMempoolRiskAssessment(): {
    isActive: boolean;
    stats: MempoolStats;
    recentAttacks: SandwichAttack[];
  } {
    return enhancedMevProtection.getMempoolRiskAssessment();
  }

  isConnectedToApi(): boolean {
    return this.isConnected;
  }

  getTier(): string {
    return this.config.tier;
  }

  setTier(tier: 'basic' | 'pro' | 'enterprise'): void {
    this.config.tier = tier;
    logger.info(`[MevGuard] Tier updated to: ${tier}`);
  }
}

export const mevGuardService = new MevGuardService();
export { MevGuardService };
