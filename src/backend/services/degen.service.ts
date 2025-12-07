import { EventEmitter } from 'events';
import { logger } from '../services/logger.service';
import axios, { AxiosInstance } from 'axios';

const DEGEN_API_URL = process.env.DEGEN_API_URL || 'http://localhost:8005';

export interface DegenServiceConfig {
  apiUrl: string;
  enabled: boolean;
  tier: 'basic' | 'pro' | 'enterprise';
}

export interface RecoveryFundStats {
  poolBalance: string;
  totalContributed: string;
  totalPaidOut: string;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  avgClaimAmount: string;
  contributorCount: number;
}

export interface RecoveryClaim {
  id: string;
  claimantAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  rugPullType: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'paid';
  amountLostWei: string;
  claimAmountWei: string;
  paidAmountWei?: string;
  votesFor: number;
  votesAgainst: number;
  submittedAt: number;
  expiresAt: number;
}

export interface StopLossConfig {
  tokenAddress: string;
  positionSize: string;
  stopLossPercentage: number;
  mlProtectionEnabled: boolean;
  autoExitEnabled: boolean;
  minConfidenceToAct: number;
}

export interface DistributionSignal {
  id: string;
  tokenAddress: string;
  pattern: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priceVelocity: number;
  volumeSpike: number;
  indicators: string[];
  recommendation: string;
  detectedAt: number;
}

export interface WhaleMirrorConfig {
  whaleAddress: string;
  mirrorPercentage: number;
  maxPositionSize: string;
  minProfitTarget: number;
  stopLoss: number;
  copyBuys: boolean;
  copySells: boolean;
  delaySeconds: number;
}

export interface WhalePosition {
  id: string;
  whaleAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  entryPrice: string;
  currentPrice: string;
  pnlPercentage: number;
  positionSize: string;
  holdingDuration: number;
  lastActivity: number;
}

export interface MirrorTrade {
  id: string;
  whaleAddress: string;
  tokenAddress: string;
  type: 'buy' | 'sell';
  whaleAmount: string;
  mirrorAmount: string;
  whalePrice: string;
  mirrorPrice: string;
  slippage: number;
  status: 'pending' | 'executed' | 'failed' | 'cancelled';
  pnl?: string;
  timestamp: number;
}

export interface MemeTokenAnalysis {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  viralityScore: number;
  socialMentions: {
    twitter: number;
    telegram: number;
    reddit: number;
    discord: number;
  };
  priceAction: {
    change24h: number;
    change7d: number;
    ath: string;
    currentPrice: string;
  };
  liquidity: {
    totalUsd: number;
    locked: boolean;
    lockDuration?: number;
  };
  holders: {
    total: number;
    whalePercentage: number;
    distribution: 'concentrated' | 'distributed';
  };
  riskScore: number;
  recommendation: 'avoid' | 'wait' | 'consider' | 'buy';
  detectedAt: number;
}

export interface WhaleAlert {
  id: string;
  whaleAddress: string;
  whaleName?: string;
  tokenAddress: string;
  tokenSymbol: string;
  action: 'buy' | 'sell' | 'transfer';
  amount: string;
  valueUsd: string;
  txHash: string;
  timestamp: number;
  significance: 'minor' | 'notable' | 'major' | 'massive';
}

class DegenService extends EventEmitter {
  private client: AxiosInstance;
  private config: DegenServiceConfig;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<DegenServiceConfig>) {
    super();
    this.config = {
      apiUrl: DEGEN_API_URL,
      enabled: true,
      tier: 'basic',
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (this.config.enabled) {
      this.checkConnection().catch(() => {
        logger.info('[DegenService] API not available - running in offline mode');
      });
    }
  }

  private async checkConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/health', { timeout: 5000 });
      this.isConnected = response.data?.success === true || response.data?.data?.status === 'healthy';
      if (this.isConnected) {
        logger.info('[DegenService] Connected to Degen API');
        this.reconnectAttempts = 0;
      }
      return this.isConnected;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  private async makeRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    endpoint: string,
    data?: Record<string, unknown>,
    fallback?: T
  ): Promise<T> {
    try {
      let response;
      switch (method) {
        case 'get':
          response = await this.client.get(endpoint);
          break;
        case 'post':
          response = await this.client.post(endpoint, data);
          break;
        case 'put':
          response = await this.client.put(endpoint, data);
          break;
        case 'delete':
          response = await this.client.delete(endpoint);
          break;
      }

      const apiResponse = response.data as { success?: boolean; data?: T; error?: string };

      if (apiResponse.success === false && apiResponse.error) {
        logger.warn(`[DegenService] API error for ${endpoint}: ${apiResponse.error}`);
        if (fallback !== undefined) {
          return fallback;
        }
        throw new Error(apiResponse.error);
      }

      const result = apiResponse.data !== undefined ? apiResponse.data : (response.data as T);
      logger.info(`[DegenService] Successful request to ${endpoint}`);
      return result;
    } catch (error) {
      logger.warn(`[DegenService] API request failed for ${endpoint}:`, error);
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error(`Degen service unavailable for ${endpoint}`);
    }
  }

  async getRecoveryFundStats(): Promise<RecoveryFundStats> {
    const fallback: RecoveryFundStats = {
      poolBalance: '0',
      totalContributed: '0',
      totalPaidOut: '0',
      pendingClaims: 0,
      approvedClaims: 0,
      rejectedClaims: 0,
      avgClaimAmount: '0',
      contributorCount: 0,
    };
    return this.makeRequest('get', '/api/degen/recovery-fund/stats', undefined, fallback);
  }

  async contributeToRecoveryFund(
    contributorAddress: string,
    amountEth: string
  ): Promise<{ contributionId: string; newPoolBalance: string }> {
    return this.makeRequest('post', '/api/degen/recovery-fund/contribute', {
      contributorAddress,
      amountEth,
    });
  }

  async submitRecoveryClaim(
    claimantAddress: string,
    tokenAddress: string,
    rugPullType: string,
    amountLostWei: string,
    proofTxHash: string
  ): Promise<RecoveryClaim> {
    return this.makeRequest('post', '/api/degen/recovery-fund/claims', {
      claimantAddress,
      tokenAddress,
      rugPullType,
      amountLostWei,
      entryTxHash: proofTxHash,
    });
  }

  async voteOnClaim(
    claimId: string,
    voterAddress: string,
    approve: boolean
  ): Promise<{ success: boolean; newVotes: { for: number; against: number } }> {
    const response = await this.makeRequest<{ voted: boolean }>('post', `/api/degen/recovery-fund/claims/${claimId}/vote`, {
      voterAddress,
      approve,
    });
    return {
      success: response.voted,
      newVotes: { for: approve ? 1 : 0, against: approve ? 0 : 1 },
    };
  }

  async getPendingClaims(): Promise<RecoveryClaim[]> {
    return this.makeRequest('get', '/api/degen/recovery-fund/claims/pending', undefined, []);
  }

  async configureSmartStopLoss(config: StopLossConfig): Promise<{ configId: string; status: string }> {
    await this.makeRequest('post', '/api/degen/smart-stoploss/monitor', {
      tokenAddress: config.tokenAddress,
      positionId: `pos_${Date.now()}`,
      entryPrice: '0',
    });
    return { configId: `stopLoss_${config.tokenAddress}_${Date.now()}`, status: 'active' };
  }

  async getActiveStopLossConfigs(walletAddress: string): Promise<StopLossConfig[]> {
    const monitored = await this.makeRequest<Array<{ tokenAddress: string }>>('get', '/api/degen/smart-stoploss/monitored', undefined, []);
    return (monitored || []).map((item: { tokenAddress: string }) => ({
      tokenAddress: item.tokenAddress,
      positionSize: '0',
      stopLossPercentage: 15,
      mlProtectionEnabled: true,
      autoExitEnabled: true,
      minConfidenceToAct: 0.85,
    }));
  }

  async getDistributionSignals(tokenAddress?: string): Promise<DistributionSignal[]> {
    const signals = await this.makeRequest<DistributionSignal[]>('get', '/api/degen/smart-stoploss/signals', undefined, []);
    if (tokenAddress) {
      return (signals || []).filter((s: DistributionSignal) => s.tokenAddress === tokenAddress);
    }
    return signals || [];
  }

  async analyzeTokenForDistribution(tokenAddress: string): Promise<{
    riskScore: number;
    patterns: string[];
    signals: DistributionSignal[];
    recommendation: string;
  }> {
    const fallback = {
      riskScore: 0,
      patterns: [],
      signals: [],
      recommendation: 'Analysis unavailable - service offline',
    };
    const signal = await this.makeRequest<DistributionSignal | null>('post', `/api/degen/smart-stoploss/analyze/${tokenAddress}`, {}, null);
    if (signal) {
      return {
        riskScore: Math.round(signal.confidence * 100),
        patterns: [signal.pattern],
        signals: [signal],
        recommendation: signal.recommendation,
      };
    }
    return fallback;
  }

  async configureWhaleMirror(config: WhaleMirrorConfig): Promise<{ mirrorId: string; status: string; config?: WhaleMirrorConfig; error?: string }> {
    interface WalletResponse {
      address: string;
      id?: string;
      label?: string;
      copyEnabled?: boolean;
      copyParams?: {
        maxPositionSize?: string;
        mirrorPercentage?: number;
        minProfitTarget?: number;
        stopLoss?: number;
        copyBuys?: boolean;
        copySells?: boolean;
        delaySeconds?: number;
      };
    }

    try {
      const walletPayload = {
        address: config.whaleAddress,
        label: config.whaleAddress.slice(0, 8) + '...',
        copyEnabled: true,
        copyParams: {
          maxPositionSize: config.maxPositionSize,
          mirrorPercentage: config.mirrorPercentage,
          minProfitTarget: config.minProfitTarget,
          stopLoss: config.stopLoss,
          copyBuys: config.copyBuys,
          copySells: config.copySells,
          delaySeconds: config.delaySeconds,
        },
      };

      const wallet = await this.makeRequest<WalletResponse | null>('post', '/api/degen/whale-mirror/wallets', walletPayload, null);

      if (!wallet) {
        return { mirrorId: '', status: 'failed', error: 'Wallet does not meet criteria' };
      }

      await this.makeRequest<{ message?: string }>('post', '/api/degen/whale-mirror/start', {});

      const configPayload = {
        maxPositionSize: config.maxPositionSize,
        mirrorPercentage: config.mirrorPercentage,
        minProfitTarget: config.minProfitTarget,
        stopLoss: config.stopLoss,
        copyBuys: config.copyBuys,
        copySells: config.copySells,
        delaySeconds: config.delaySeconds,
      };
      await this.makeRequest<Record<string, unknown>>('put', '/api/degen/whale-mirror/config', configPayload);

      const resultConfig: WhaleMirrorConfig = {
        whaleAddress: wallet.address,
        mirrorPercentage: wallet.copyParams?.mirrorPercentage ?? config.mirrorPercentage,
        maxPositionSize: wallet.copyParams?.maxPositionSize ?? config.maxPositionSize,
        minProfitTarget: wallet.copyParams?.minProfitTarget ?? config.minProfitTarget,
        stopLoss: wallet.copyParams?.stopLoss ?? config.stopLoss,
        copyBuys: wallet.copyParams?.copyBuys ?? config.copyBuys,
        copySells: wallet.copyParams?.copySells ?? config.copySells,
        delaySeconds: wallet.copyParams?.delaySeconds ?? config.delaySeconds,
      };

      return {
        mirrorId: wallet.id || wallet.address,
        status: 'active',
        config: resultConfig,
      };
    } catch (error) {
      return { mirrorId: '', status: 'failed', error: (error as Error).message };
    }
  }

  async getActiveWhaleMirrors(_walletAddress: string): Promise<WhaleMirrorConfig[]> {
    interface WalletData {
      address: string;
      id?: string;
      label?: string;
      copyEnabled?: boolean;
      copyParams?: {
        maxPositionSize?: string;
        mirrorPercentage?: number;
        minProfitTarget?: number;
        stopLoss?: number;
        copyBuys?: boolean;
        copySells?: boolean;
        delaySeconds?: number;
      };
    }

    const wallets = await this.makeRequest<WalletData[]>('get', '/api/degen/whale-mirror/wallets', undefined, []);

    return (wallets || [])
      .filter(w => w.copyEnabled === true)
      .map(w => ({
        whaleAddress: w.address,
        mirrorPercentage: w.copyParams?.mirrorPercentage ?? 100,
        maxPositionSize: w.copyParams?.maxPositionSize ?? '0.1',
        minProfitTarget: w.copyParams?.minProfitTarget ?? 10,
        stopLoss: w.copyParams?.stopLoss ?? 15,
        copyBuys: w.copyParams?.copyBuys ?? true,
        copySells: w.copyParams?.copySells ?? true,
        delaySeconds: w.copyParams?.delaySeconds ?? 0,
      }));
  }

  async getWhalePositions(whaleAddress: string): Promise<WhalePosition[]> {
    interface MirrorPosition {
      id: string;
      whaleAddress: string;
      whaleLabel?: string;
      tokenAddress: string;
      tokenSymbol: string;
      entryPrice: string;
      currentPrice?: string;
      positionSize: string;
      enteredAt: number;
      exitedAt?: number;
      pnl?: bigint;
      pnlPercent?: number;
      status: 'active' | 'exited' | 'failed';
    }

    const positions = await this.makeRequest<MirrorPosition[]>('get', `/api/degen/whale-mirror/trades/wallet/${whaleAddress}`, undefined, []);
    return (positions || []).map(p => ({
      id: p.id,
      whaleAddress: p.whaleAddress,
      tokenAddress: p.tokenAddress,
      tokenSymbol: p.tokenSymbol,
      entryPrice: p.entryPrice,
      currentPrice: p.currentPrice ?? p.entryPrice,
      pnlPercentage: p.pnlPercent ?? 0,
      positionSize: p.positionSize,
      holdingDuration: p.enteredAt ? Date.now() - p.enteredAt : 0,
      lastActivity: p.exitedAt ?? p.enteredAt,
    }));
  }

  async getMirrorTradeHistory(_walletAddress: string): Promise<MirrorTrade[]> {
    interface MirrorHistoryItem {
      id: string;
      whaleAddress: string;
      whaleLabel?: string;
      tokenAddress: string;
      tokenSymbol: string;
      action: 'buy' | 'sell';
      whaleAmount: string;
      mirroredAmount: string;
      whalePrice: string;
      mirrorPrice: string;
      slippage: number;
      entryPrice: string;
      exitPrice?: string;
      positionSize: string;
      pnl?: string;
      pnlPercent?: number;
      enteredAt: number;
      exitedAt?: number;
      txHash?: string;
      status: 'pending' | 'executed' | 'failed' | 'cancelled';
    }

    const history = await this.makeRequest<MirrorHistoryItem[]>('get', '/api/degen/whale-mirror/trades/history', undefined, []);
    return (history || []).map(h => ({
      id: h.id,
      whaleAddress: h.whaleAddress,
      tokenAddress: h.tokenAddress,
      type: h.action,
      whaleAmount: h.whaleAmount,
      mirrorAmount: h.mirroredAmount,
      whalePrice: h.whalePrice,
      mirrorPrice: h.mirrorPrice,
      slippage: h.slippage,
      status: h.status,
      pnl: h.pnl,
      timestamp: h.exitedAt ?? h.enteredAt,
    }));
  }

  async getKnownWhales(): Promise<Array<{
    address: string;
    name?: string;
    profitability: number;
    winRate: number;
    totalTrades: number;
    avgHoldTime: number;
  }>> {
    const leaderboard = await this.makeRequest<Array<{ address: string; label?: string; winRate?: number; totalPnlPercent?: number; totalTrades?: number; avgHoldingTime?: number }>>('get', '/api/degen/whale-mirror/wallets/leaderboard', undefined, []);
    return (leaderboard || []).map((w) => ({
      address: w.address,
      name: w.label,
      profitability: w.totalPnlPercent || 0,
      winRate: w.winRate || 0,
      totalTrades: w.totalTrades || 0,
      avgHoldTime: w.avgHoldingTime || 0,
    }));
  }

  async getTrendingMemeTokens(): Promise<MemeTokenAnalysis[]> {
    const tokens = await this.makeRequest<Array<Record<string, unknown>>>('get', '/api/meme-hunter/tokens/trending', undefined, []);
    return (tokens || []).map((token) => this.mapMemeToken(token));
  }

  private mapMemeToken(token: Record<string, unknown>): MemeTokenAnalysis {
    return {
      tokenAddress: token.address as string || '',
      tokenName: token.name as string || 'Unknown',
      tokenSymbol: token.symbol as string || 'UNK',
      viralityScore: token.viralityScore as number || 0,
      socialMentions: token.socialMentions as { twitter: number; telegram: number; reddit: number; discord: number } || { twitter: 0, telegram: 0, reddit: 0, discord: 0 },
      priceAction: token.priceAction as { change24h: number; change7d: number; ath: string; currentPrice: string } || { change24h: 0, change7d: 0, ath: '0', currentPrice: '0' },
      liquidity: token.liquidity as { totalUsd: number; locked: boolean; lockDuration?: number } || { totalUsd: 0, locked: false },
      holders: token.holders as { total: number; whalePercentage: number; distribution: 'concentrated' | 'distributed' } || { total: 0, whalePercentage: 0, distribution: 'concentrated' },
      riskScore: token.riskScore as number || 100,
      recommendation: token.recommendation as 'avoid' | 'wait' | 'consider' | 'buy' || 'avoid',
      detectedAt: token.discoveredAt as number || Date.now(),
    };
  }

  async analyzeMemeToken(tokenAddress: string): Promise<MemeTokenAnalysis> {
    const fallback: MemeTokenAnalysis = {
      tokenAddress,
      tokenName: 'Unknown',
      tokenSymbol: 'UNK',
      viralityScore: 0,
      socialMentions: { twitter: 0, telegram: 0, reddit: 0, discord: 0 },
      priceAction: { change24h: 0, change7d: 0, ath: '0', currentPrice: '0' },
      liquidity: { totalUsd: 0, locked: false },
      holders: { total: 0, whalePercentage: 0, distribution: 'concentrated' },
      riskScore: 100,
      recommendation: 'avoid',
      detectedAt: Date.now(),
    };
    const token = await this.makeRequest<Record<string, unknown> | null>('post', `/api/meme-hunter/tokens/${tokenAddress}/analyze`, {}, null);
    if (token && Object.keys(token).length > 0) {
      return this.mapMemeToken(token);
    }
    return fallback;
  }

  async getRecentWhaleAlerts(limit: number = 20): Promise<WhaleAlert[]> {
    const transactions = await this.makeRequest<Array<Record<string, unknown>>>('get', '/api/whales/transactions/recent', undefined, []);
    return (transactions || []).slice(0, limit).map((tx) => ({
      id: tx.hash as string || `alert_${Date.now()}`,
      whaleAddress: tx.from as string || '',
      whaleName: tx.walletLabel as string,
      tokenAddress: tx.tokenAddress as string || '',
      tokenSymbol: tx.tokenSymbol as string || '',
      action: (tx.type as 'buy' | 'sell' | 'transfer') || 'transfer',
      amount: tx.amount as string || '0',
      valueUsd: tx.valueUsd as string || '0',
      txHash: tx.hash as string || '',
      timestamp: tx.timestamp as number || Date.now(),
      significance: tx.significance as 'minor' | 'notable' | 'major' | 'massive' || 'minor',
    }));
  }

  async subscribeToWhaleAlerts(
    walletAddress: string,
    whaleAddresses: string[],
    minValueUsd: number
  ): Promise<{ subscriptionId: string; status: string }> {
    const existingWallets = await this.makeRequest<Array<{ address: string }>>('get', '/api/degen/whale-mirror/wallets', undefined, []);
    const existingAddresses = new Set((existingWallets || []).map(w => w.address.toLowerCase()));

    for (const whaleAddress of whaleAddresses) {
      if (!existingAddresses.has(whaleAddress.toLowerCase())) {
        await this.makeRequest('post', '/api/degen/whale-mirror/wallets', {
          address: whaleAddress,
          label: `Alert tracked whale`,
          copyEnabled: false,
          alertOnActivity: true,
          minTransactionValue: minValueUsd.toString(),
        });
      }
    }
    return { subscriptionId: `sub_${Date.now()}`, status: 'active' };
  }

  async getServiceStats(): Promise<{
    recoveryFund: RecoveryFundStats;
    stopLoss: { activeConfigs: number; signalsToday: number; autoExitsToday: number };
    whaleMirror: { activeMirrors: number; totalPnl: string; tradesExecuted: number };
    memeHunter: { tokensTracked: number; alertsSent: number; successfulCalls: number };
  }> {
    interface StopLossStatus {
      active?: boolean;
      config?: Record<string, unknown>;
      modelState?: Record<string, unknown>;
      stats?: { signalsGenerated?: number; autoExitsTriggered?: number };
    }
    interface MemeHunterStats {
      tokensTracked?: number;
      alertsSent?: number;
      successfulCalls?: number;
    }
    interface WhaleMirrorStats {
      activeWallets?: number;
      totalPnlEth?: number;
      totalTrades?: number;
    }

    const [recoveryStats, stopLossStatus, memeHunterStats, whaleMirrorStats] = await Promise.all([
      this.getRecoveryFundStats(),
      this.makeRequest<StopLossStatus>('get', '/api/degen/smart-stoploss/status', undefined, {}),
      this.makeRequest<MemeHunterStats>('get', '/api/meme-hunter/stats', undefined, {}),
      this.makeRequest<WhaleMirrorStats>('get', '/api/degen/whale-mirror/stats', undefined, {}),
    ]);

    return {
      recoveryFund: recoveryStats,
      stopLoss: {
        activeConfigs: 0,
        signalsToday: stopLossStatus?.stats?.signalsGenerated || 0,
        autoExitsToday: stopLossStatus?.stats?.autoExitsTriggered || 0,
      },
      whaleMirror: {
        activeMirrors: whaleMirrorStats?.activeWallets || 0,
        totalPnl: `${whaleMirrorStats?.totalPnlEth || 0} ETH`,
        tradesExecuted: whaleMirrorStats?.totalTrades || 0,
      },
      memeHunter: {
        tokensTracked: memeHunterStats?.tokensTracked || 0,
        alertsSent: memeHunterStats?.alertsSent || 0,
        successfulCalls: memeHunterStats?.successfulCalls || 0,
      },
    };
  }

  isServiceConnected(): boolean {
    return this.isConnected;
  }

  getTier(): string {
    return this.config.tier;
  }

  setTier(tier: 'basic' | 'pro' | 'enterprise'): void {
    this.config.tier = tier;
    logger.info(`[DegenService] Tier updated to: ${tier}`);
  }
}

export const degenService = new DegenService();
export { DegenService };
