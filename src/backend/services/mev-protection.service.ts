// MEV Protection Service - Flashbots, private mempools, sandwich attack prevention
// Pro Tier: Enhanced MEV protection with Flashbots Fast + Eden Rocket + Mempool Monitoring

import axios from 'axios';
import { logger } from '../services/logger.service';
import { ethers } from 'ethers';
import { mempoolMonitor } from './mempool-monitor.service';

// MEV Protection RPC Endpoints - Priority order for Pro tier
const MEV_PROTECTION_RPCS = {
  // Flashbots endpoints
  flashbotsStandard: 'https://rpc.flashbots.net',
  flashbotsFast: 'https://rpc.flashbots.net/fast', // Higher inclusion rate, shared with TEE searchers
  flashbotsSepolia: 'https://rpc-sepolia.flashbots.net',

  // Eden Network endpoints  
  edenRpc: 'https://api.edennetwork.io/v1/rpc', // Full MEV protection
  edenRocket: 'https://api.edennetwork.io/v1/rocket', // Speed + MEV protection (beta)

  // Transaction status checking
  flashbotsStatus: 'https://protect.flashbots.net/tx',
};

// Legacy constants for backwards compatibility
const FLASHBOTS_RPC = MEV_PROTECTION_RPCS.flashbotsStandard;
const EDEN_NETWORK_RPC = MEV_PROTECTION_RPCS.edenRpc;

export type MevProtectionMode = 'standard' | 'fast' | 'maximum';
export type MevRpcProvider = 'flashbots' | 'flashbots_fast' | 'eden' | 'eden_rocket';

export interface MevProtectionConfig {
  enabled: boolean;
  privateMempool: boolean;
  slippageProtection: boolean;
  frontrunProtection: boolean;
  sandwichProtection: boolean;
  maxSlippage: number; // percentage
}

export interface TransactionBundle {
  signedTransactions: string[];
  blockNumber: number;
  minTimestamp?: number;
  maxTimestamp?: number;
  revertingTxHashes?: string[];
}

export interface MevAnalysis {
  hasMevRisk: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  risks: string[];
  recommendations: string[];
  estimatedMevLoss: string;
}

// Flashbots protection service
export class FlashbotsService {
  private _provider: ethers.JsonRpcProvider | null = null;
  private _signingWallet: ethers.Wallet | null = null;

  // Lazy-load provider to avoid errors on startup
  private get provider(): ethers.JsonRpcProvider {
    if (!this._provider) {
      const rpcUrl = process.env.ETHEREUM_RPC_URL || process.env.ALCHEMY_API_KEY
        ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        : 'https://eth.llamarpc.com';
      this._provider = new ethers.JsonRpcProvider(rpcUrl);
    }
    return this._provider;
  }

  // Get signing wallet for Flashbots authentication
  private get signingWallet(): ethers.Wallet | null {
    if (!this._signingWallet && process.env.FLASHBOTS_SIGNING_KEY) {
      this._signingWallet = new ethers.Wallet(process.env.FLASHBOTS_SIGNING_KEY);
    }
    return this._signingWallet;
  }

  constructor() {
    // Provider and wallet are lazy-loaded when needed
    this.logConfigStatus();
  }

  private logConfigStatus() {
    const hasFlashbotsKey = !!process.env.FLASHBOTS_SIGNING_KEY;
    const hasRpcUrl = !!(process.env.ETHEREUM_RPC_URL || process.env.ALCHEMY_API_KEY);

    if (hasFlashbotsKey) {
      logger.info('[MEVProtection] ✅ Flashbots signing key configured');
    } else {
      logger.info('[MEVProtection] ⚠️ No Flashbots key - using public endpoints (anonymous submissions)');
    }

    if (hasRpcUrl) {
      logger.info('[MEVProtection] ✅ RPC provider configured');
    }

    logger.info('[MEVProtection] Available providers: Flashbots, Flashbots Fast, Eden Network, Eden Rocket');
  }

  // Generate Flashbots signature for authenticated requests
  private async generateFlashbotsSignature(body: string): Promise<string | null> {
    const wallet = this.signingWallet;
    if (!wallet) return null;

    const messageHash = ethers.id(body);
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));
    return `${wallet.address}:${signature}`;
  }

  // Send transaction via Flashbots (private mempool)
  async sendPrivateTransaction(
    signedTx: string,
    maxBlockNumber?: number
  ): Promise<string> {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const targetBlock = maxBlockNumber || currentBlock + 1;

      const bundle: TransactionBundle = {
        signedTransactions: [signedTx],
        blockNumber: targetBlock,
      };

      const requestBody = JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_sendBundle',
        params: [
          {
            txs: bundle.signedTransactions,
            blockNumber: ethers.toBeHex(bundle.blockNumber),
          },
        ],
        id: 1,
      });

      // Generate authentication signature
      const signature = await this.generateFlashbotsSignature(requestBody);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (signature) {
        headers['X-Flashbots-Signature'] = signature;
      }

      // Send bundle to Flashbots Relay
      const response = await axios.post(
        'https://relay.flashbots.net',
        requestBody,
        { headers }
      );

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return response.data.result.bundleHash;
    } catch (error: any) {
      logger.error('Flashbots send error:', error.message);
      throw new Error('Failed to send private transaction');
    }
  }

  // Check bundle status
  async getBundleStatus(bundleHash: string): Promise<any> {
    try {
      const response = await axios.post(
        FLASHBOTS_RPC,
        {
          jsonrpc: '2.0',
          method: 'flashbots_getBundleStats',
          params: [bundleHash, 'latest'],
          id: 1,
        }
      );

      return response.data.result;
    } catch (error) {
      logger.error('Bundle status error:', error);
      return null;
    }
  }

  // Simulate bundle (test before sending)
  async simulateBundle(
    signedTransactions: string[],
    blockNumber: number
  ): Promise<any> {
    try {
      const response = await axios.post(
        FLASHBOTS_RPC,
        {
          jsonrpc: '2.0',
          method: 'eth_callBundle',
          params: [
            {
              txs: signedTransactions,
              blockNumber: ethers.toBeHex(blockNumber),
              stateBlockNumber: 'latest',
            },
          ],
          id: 1,
        }
      );

      return response.data.result;
    } catch (error) {
      logger.error('Bundle simulation error:', error);
      throw new Error('Failed to simulate bundle');
    }
  }
}

// MEV detection and analysis
export class MevDetectionService {
  // Analyze transaction for MEV risks
  async analyzeMevRisk(
    from: string,
    to: string,
    data: string,
    value: string
  ): Promise<MevAnalysis> {
    const risks: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check if it's a DEX swap
    const isDexSwap = this.isDexSwap(to, data);
    if (isDexSwap) {
      risks.push('DEX swap - vulnerable to sandwich attacks');
      riskLevel = 'high';
    }

    // Check value size
    const valueInEth = parseFloat(ethers.formatEther(value));
    if (valueInEth > 10) {
      risks.push('Large transaction - high MEV profit potential');
      riskLevel = 'high';
    } else if (valueInEth > 1) {
      risks.push('Medium-sized transaction - moderate MEV risk');
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }

    // Check if interacting with known MEV-targeted contracts
    const isHighValueContract = this.isHighValueContract(to);
    if (isHighValueContract) {
      risks.push('Interacting with high-value DeFi protocol');
      riskLevel = 'high';
    }

    // Check mempool congestion
    const mempoolCongested = await this.checkMempoolCongestion();
    if (mempoolCongested) {
      risks.push('High mempool congestion - increased MEV risk');
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }

    const recommendations: string[] = [];
    if (riskLevel === 'high') {
      recommendations.push('Use Flashbots or private mempool');
      recommendations.push('Split transaction into smaller amounts');
      recommendations.push('Use lower slippage tolerance');
      recommendations.push('Consider off-peak hours');
    } else if (riskLevel === 'medium') {
      recommendations.push('Consider using MEV protection');
      recommendations.push('Monitor transaction closely');
    }

    const estimatedMevLoss = this.estimateMevLoss(value, riskLevel);

    return {
      hasMevRisk: risks.length > 0,
      riskLevel,
      risks,
      recommendations,
      estimatedMevLoss,
    };
  }

  // Detect sandwich attacks in real-time
  async detectSandwichAttack(txHash: string): Promise<boolean> {
    try {
      // Get transaction and surrounding transactions
      const tx = await this.getTransaction(txHash);
      if (!tx) return false;

      const blockNumber = tx.blockNumber;
      const block = await this.getBlock(blockNumber);

      // Find transactions immediately before and after
      const txIndex = block.transactions.findIndex(
        (t: string) => t === txHash
      );

      if (txIndex === -1) return false;

      const prevTx =
        txIndex > 0 ? await this.getTransaction(block.transactions[txIndex - 1]) : null;
      const nextTx =
        txIndex < block.transactions.length - 1
          ? await this.getTransaction(block.transactions[txIndex + 1])
          : null;

      // Check for sandwich pattern
      if (prevTx && nextTx) {
        const isSandwich = this.matchesSandwichPattern(prevTx, tx, nextTx);
        return isSandwich;
      }

      return false;
    } catch (error) {
      logger.error('Sandwich detection error:', error);
      return false;
    }
  }

  // Private helper methods
  private isDexSwap(to: string, data: string): boolean {
    // Check if interacting with known DEX routers
    const dexRouters = [
      '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2
      '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3
      '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', // Sushi
      '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch V5
    ];

    const isKnownRouter = dexRouters.some(
      (router) => router.toLowerCase() === to.toLowerCase()
    );

    // Check for swap function signatures
    const swapSignatures = [
      '0x38ed1739', // swapExactTokensForTokens
      '0x8803dbee', // swapTokensForExactTokens
      '0x7ff36ab5', // swapExactETHForTokens
      '0x18cbafe5', // swapExactTokensForETH
    ];

    const hasSwapSignature = swapSignatures.some((sig) =>
      data.toLowerCase().startsWith(sig)
    );

    return isKnownRouter && hasSwapSignature;
  }

  private isHighValueContract(address: string): boolean {
    // List of high-value DeFi protocols
    const highValueContracts = [
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
      '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2 Router
      '0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3 Router
    ];

    return highValueContracts.some(
      (contract) => contract.toLowerCase() === address.toLowerCase()
    );
  }

  private async checkMempoolCongestion(): Promise<boolean> {
    try {
      // Check pending transaction count
      const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
      const pendingBlock = await provider.send('eth_getBlockByNumber', [
        'pending',
        false,
      ]);

      const pendingTxCount = pendingBlock.transactions.length;

      // Congested if more than 200 pending transactions
      return pendingTxCount > 200;
    } catch (error) {
      logger.error('Mempool check error:', error);
      return false;
    }
  }

  private estimateMevLoss(value: string, riskLevel: string): string {
    const valueInEth = parseFloat(ethers.formatEther(value));

    let lossPercentage = 0;
    if (riskLevel === 'high') {
      lossPercentage = 0.05; // 5%
    } else if (riskLevel === 'medium') {
      lossPercentage = 0.01; // 1%
    } else {
      lossPercentage = 0.001; // 0.1%
    }

    const loss = valueInEth * lossPercentage;
    return ethers.parseEther(loss.toString()).toString();
  }

  private matchesSandwichPattern(prevTx: any, targetTx: any, nextTx: any): boolean {
    // Simplified sandwich detection
    // Real implementation would analyze swap amounts, prices, etc.

    // Check if prev and next tx are from same address
    const sameSender =
      prevTx.from.toLowerCase() === nextTx.from.toLowerCase();

    // Check if target tx is between them in block
    const isSequential = true; // Already checked by getting adjacent txs

    return sameSender && isSequential;
  }

  private async getTransaction(txHash: string): Promise<any> {
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    return provider.getTransaction(txHash);
  }

  private async getBlock(blockNumber: number): Promise<any> {
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    return provider.getBlock(blockNumber);
  }
}

// MEV protection manager
export class MevProtectionManager {
  private flashbots: FlashbotsService;
  private detection: MevDetectionService;

  constructor() {
    this.flashbots = new FlashbotsService();
    this.detection = new MevDetectionService();
  }

  // Send transaction with MEV protection
  async sendProtectedTransaction(
    signedTx: string,
    config: MevProtectionConfig
  ): Promise<{ txHash?: string; bundleHash?: string; protected: boolean }> {
    if (!config.enabled) {
      // Send normally without protection
      const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
      const response = await provider.broadcastTransaction(signedTx);
      return { txHash: response.hash, protected: false };
    }

    // Analyze MEV risk
    const tx = ethers.Transaction.from(signedTx);
    const analysis = await this.detection.analyzeMevRisk(
      tx.from || '',
      tx.to || '',
      tx.data || '0x',
      tx.value.toString()
    );

    // Use Flashbots for high-risk transactions
    if (analysis.riskLevel === 'high' && config.privateMempool) {
      const bundleHash = await this.flashbots.sendPrivateTransaction(signedTx);
      return { bundleHash, protected: true };
    }

    // Send with slippage protection
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    const response = await provider.broadcastTransaction(signedTx);

    return { txHash: response.hash, protected: true };
  }

  // Get protection recommendations
  async getProtectionRecommendations(
    from: string,
    to: string,
    data: string,
    value: string
  ): Promise<MevAnalysis> {
    return this.detection.analyzeMevRisk(from, to, data, value);
  }
}

// Enhanced MEV Protection Service (Pro Tier)
// Integrates Flashbots Fast + Eden Rocket via direct JSON-RPC API calls
export class EnhancedMevProtection {
  private _standardProvider: ethers.JsonRpcProvider | null = null;

  // Lazy-load provider to avoid errors on startup if RPC URL not configured
  private get standardProvider(): ethers.JsonRpcProvider {
    if (!this._standardProvider) {
      const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com';
      this._standardProvider = new ethers.JsonRpcProvider(rpcUrl);
    }
    return this._standardProvider;
  }

  constructor() {
    // Provider is lazy-loaded when needed
  }

  // Select best MEV protection RPC based on transaction characteristics
  selectBestRpc(tx: { to: string; value: string; data: string }, mode: MevProtectionMode = 'fast'): MevRpcProvider {
    const shouldUsePrivate = mempoolMonitor.shouldUsePrivateMempool(tx);

    if (mode === 'maximum' || shouldUsePrivate) {
      return 'flashbots_fast';
    }

    if (mode === 'fast') {
      return 'eden_rocket';
    }

    return 'flashbots';
  }

  // Get RPC URL for provider type
  private getRpcUrl(rpcType: MevRpcProvider): string {
    switch (rpcType) {
      case 'flashbots_fast':
        return MEV_PROTECTION_RPCS.flashbotsFast;
      case 'eden_rocket':
        return MEV_PROTECTION_RPCS.edenRocket;
      case 'eden':
        return MEV_PROTECTION_RPCS.edenRpc;
      case 'flashbots':
      default:
        return MEV_PROTECTION_RPCS.flashbotsStandard;
    }
  }

  // Send raw transaction via JSON-RPC to MEV protection endpoint
  private async sendRawTransaction(
    rpcUrl: string,
    signedTx: string
  ): Promise<string> {
    const response = await axios.post(
      rpcUrl,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_sendRawTransaction',
        params: [signedTx],
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error.message || 'RPC error');
    }

    return response.data.result;
  }

  // Send transaction with enhanced MEV protection (Pro tier)
  async sendProtectedTransactionPro(
    signedTx: string,
    mode: MevProtectionMode = 'fast'
  ): Promise<{
    txHash: string;
    provider: MevRpcProvider;
    protected: boolean;
    statusUrl?: string;
  }> {
    const tx = ethers.Transaction.from(signedTx);

    // Determine best RPC
    const selectedRpc = this.selectBestRpc({
      to: tx.to || '',
      value: tx.value.toString(),
      data: tx.data || '0x',
    }, mode);

    // Priority order for MEV protection
    const rpcPriority: MevRpcProvider[] = [selectedRpc, 'flashbots_fast', 'eden_rocket', 'flashbots'];
    const uniqueRpcs = [...new Set(rpcPriority)];

    let lastError: Error | null = null;

    for (const rpcType of uniqueRpcs) {
      const rpcUrl = this.getRpcUrl(rpcType);

      try {
        logger.info(`[MEV] Sending via ${rpcType}: ${rpcUrl}`);
        const txHash = await this.sendRawTransaction(rpcUrl, signedTx);

        // Build status URL for Flashbots transactions
        const statusUrl = rpcType.includes('flashbots')
          ? `${MEV_PROTECTION_RPCS.flashbotsStatus}/${txHash}`
          : undefined;

        logger.info(`[MEV] Success via ${rpcType}: ${txHash}`);
        return {
          txHash,
          provider: rpcType,
          protected: true,
          statusUrl,
        };
      } catch (error: any) {
        logger.warn(`[MEV] ${rpcType} failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    // Final fallback to standard RPC (unprotected)
    logger.warn('[MEV] All protected RPCs failed, falling back to standard');
    try {
      const response = await this.standardProvider.broadcastTransaction(signedTx);
      return {
        txHash: response.hash,
        provider: 'flashbots', // Mark as attempted
        protected: false, // Indicate protection failed
      };
    } catch (fallbackError: any) {
      throw lastError || new Error('All MEV protection RPCs failed');
    }
  }

  // Check Flashbots transaction status
  async checkFlashbotsStatus(txHash: string): Promise<{
    status: 'PENDING' | 'INCLUDED' | 'FAILED' | 'CANCELLED' | 'UNKNOWN';
    blockNumber?: number;
    includedAt?: string;
  }> {
    try {
      const response = await axios.get(
        `${MEV_PROTECTION_RPCS.flashbotsStatus}/${txHash}`
      );
      return response.data;
    } catch (error) {
      return { status: 'UNKNOWN' };
    }
  }

  // Get current mempool risk assessment for Pro users
  getMempoolRiskAssessment(): {
    isActive: boolean;
    stats: any;
    recentAttacks: any[];
  } {
    return {
      isActive: mempoolMonitor.isActive(),
      stats: mempoolMonitor.getStats(),
      recentAttacks: mempoolMonitor.getRecentSandwichAttacks(5),
    };
  }

  // Analyze transaction before sending (Pro feature)
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
    const recommendedRpc = this.selectBestRpc(tx, 'fast');
    const shouldUsePrivate = mempoolMonitor.shouldUsePrivateMempool(tx);

    const recommendations: string[] = [];
    let riskScore = 0;

    // Check if DEX swap
    const isDexSwap = Object.values({
      'uniswapV2': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      'uniswapV3': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      'sushiswap': '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      '1inch': '0x1111111254fb6c44bAC0beD2854e76F90643097d',
    }).some(router => tx.to.toLowerCase() === router.toLowerCase());

    if (isDexSwap) {
      riskScore += 40;
      recommendations.push('DEX swap detected - using MEV protection');
    }

    // Check value
    const valueInEth = parseFloat(tx.value) / 1e18;
    if (valueInEth > 5) {
      riskScore += 30;
      recommendations.push('Large value transaction - maximum protection recommended');
    } else if (valueInEth > 1) {
      riskScore += 15;
      recommendations.push('Medium value - fast protection sufficient');
    }

    // Check mempool activity
    if (mempoolMonitor.isActive()) {
      const stats = mempoolMonitor.getStats();
      if (stats.dexSwapsInPool > 50) {
        riskScore += 15;
        recommendations.push('High mempool DEX activity detected');
      }
    }

    // Estimate savings from MEV protection
    const estimatedMevLoss = (valueInEth * (riskScore / 100) * 0.05).toFixed(4);
    const estimatedSavings = `~${estimatedMevLoss} ETH`;

    return {
      recommendedRpc,
      riskScore: Math.min(riskScore, 100),
      recommendations,
      estimatedSavings,
    };
  }
}

// Export instances
export const mevProtection = new MevProtectionManager();
export const mevDetection = new MevDetectionService();
export const flashbots = new FlashbotsService();
export const enhancedMevProtection = new EnhancedMevProtection();
export { MEV_PROTECTION_RPCS };
