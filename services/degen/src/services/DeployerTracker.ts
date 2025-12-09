// ============================================================================
// APEX SNIPER - Deployer Tracker Service
// Track token deployers for early detection of new launches
// ============================================================================

import { ethers, JsonRpcProvider, Contract, WebSocketProvider } from 'ethers';
import EventEmitter from 'eventemitter3';
import axios from 'axios';
import {
  TokenInfo,
  TokenProject,
  DEX
} from '../types';
import { config, API_ENDPOINTS } from '../config';
import {
  logger,
  generateId,
  checksumAddress,
  getTokenInfo
} from '../utils';

// ============================================================================
// TYPES
// ============================================================================

export interface TrackedDeployer {
  id: string;
  address: string;
  label: string;
  type: 'WHALE' | 'DEV' | 'KNOWN_SCAMMER' | 'VERIFIED' | 'UNKNOWN';
  
  // Statistics
  totalDeployments: number;
  successfulTokens: number;
  ruggedTokens: number;
  avgATH: number; // Average All-Time High multiplier
  avgRugTime: number; // Average time before rug (if any)
  
  // History
  deployedTokens: DeployedToken[];
  
  // Settings
  enabled: boolean;
  autoSnipe: boolean;
  autoSnipeAmount: string;
  safetyCheckRequired: boolean;
  
  // Metadata
  notes?: string;
  tags: string[];
  reputation: number; // -100 to 100
  lastSeen: number;
  createdAt: number;
  updatedAt: number;
}

export interface DeployedToken {
  address: string;
  name: string;
  symbol: string;
  deployTxHash: string;
  deployBlock: number;
  deployTimestamp: number;
  pairAddress?: string;
  launchTimestamp?: number;
  initialLiquidity?: number;
  athMultiplier?: number;
  status: 'PENDING' | 'LAUNCHED' | 'ACTIVE' | 'RUGGED' | 'ABANDONED';
  rugTimestamp?: number;
}

export interface DeploymentEvent {
  deployer: string;
  contractAddress: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  bytecodeHash: string;
  isToken: boolean;
  tokenInfo?: TokenInfo;
}

export interface DeployerTrackerEvents {
  'deployer:newDeployment': (event: DeploymentEvent) => void;
  'deployer:tokenLaunch': (deployer: TrackedDeployer, token: DeployedToken) => void;
  'deployer:potentialRug': (deployer: TrackedDeployer, token: DeployedToken) => void;
  'deployer:added': (deployer: TrackedDeployer) => void;
}

// ============================================================================
// DEPLOYER TRACKER
// ============================================================================

export class DeployerTracker extends EventEmitter<DeployerTrackerEvents> {
  private provider: JsonRpcProvider;
  private wsProvider: WebSocketProvider | null = null;
  private trackedDeployers: Map<string, TrackedDeployer> = new Map();
  private recentDeployments: Map<string, DeploymentEvent> = new Map();
  private isMonitoring: boolean = false;
  private monitorInterval: NodeJS.Timeout | null = null;

  // Known patterns for token contracts
  private readonly TOKEN_SIGNATURES = [
    '0x06fdde03', // name()
    '0x95d89b41', // symbol()
    '0x313ce567', // decimals()
    '0x18160ddd', // totalSupply()
    '0x70a08231', // balanceOf(address)
  ];

  constructor() {
    super();
    this.provider = new JsonRpcProvider(config.rpcUrl);
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  async start(): Promise<void> {
    if (this.isMonitoring) return;

    logger.info('Starting deployer tracker...');
    this.isMonitoring = true;

    // Connect WebSocket for real-time monitoring
    await this.connectWebSocket();

    // Start monitoring loop
    this.monitorInterval = setInterval(async () => {
      await this.checkPendingDeployments();
    }, 30000); // Every 30 seconds

    logger.info(`Deployer tracker started, watching ${this.trackedDeployers.size} deployers`);
  }

  async stop(): Promise<void> {
    this.isMonitoring = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    if (this.wsProvider) {
      await this.wsProvider.destroy();
      this.wsProvider = null;
    }

    logger.info('Deployer tracker stopped');
  }

  private async connectWebSocket(): Promise<void> {
    try {
      this.wsProvider = new WebSocketProvider(config.wsRpcUrl);

      // Monitor pending transactions
      this.wsProvider.on('pending', async (txHash: string) => {
        await this.checkPendingTransaction(txHash);
      });

      // Monitor new blocks for confirmed deployments
      this.wsProvider.on('block', async (blockNumber: number) => {
        await this.checkBlockForDeployments(blockNumber);
      });

      logger.info('WebSocket connected for deployer tracking');
    } catch (error) {
      logger.error('Failed to connect WebSocket:', error);
    }
  }

  // ==========================================================================
  // DEPLOYER MANAGEMENT
  // ==========================================================================

  async addDeployer(
    address: string,
    label: string,
    options: Partial<TrackedDeployer> = {}
  ): Promise<TrackedDeployer> {
    const normalizedAddress = checksumAddress(address);

    // Check for existing
    const existing = this.trackedDeployers.get(normalizedAddress.toLowerCase());
    if (existing) {
      return existing;
    }

    const deployer: TrackedDeployer = {
      id: generateId(),
      address: normalizedAddress,
      label,
      type: options.type || 'UNKNOWN',
      totalDeployments: 0,
      successfulTokens: 0,
      ruggedTokens: 0,
      avgATH: 0,
      avgRugTime: 0,
      deployedTokens: [],
      enabled: true,
      autoSnipe: options.autoSnipe || false,
      autoSnipeAmount: options.autoSnipeAmount || '0.1',
      safetyCheckRequired: options.safetyCheckRequired ?? true,
      notes: options.notes,
      tags: options.tags || [],
      reputation: 0,
      lastSeen: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Fetch historical data
    await this.fetchDeployerHistory(deployer);

    this.trackedDeployers.set(normalizedAddress.toLowerCase(), deployer);
    this.emit('deployer:added', deployer);

    logger.info(`Added deployer: ${label} (${normalizedAddress})`);
    return deployer;
  }

  removeDeployer(address: string): boolean {
    return this.trackedDeployers.delete(address.toLowerCase());
  }

  getDeployer(address: string): TrackedDeployer | undefined {
    return this.trackedDeployers.get(address.toLowerCase());
  }

  getAllDeployers(): TrackedDeployer[] {
    return Array.from(this.trackedDeployers.values());
  }

  updateDeployer(address: string, updates: Partial<TrackedDeployer>): TrackedDeployer | null {
    const deployer = this.trackedDeployers.get(address.toLowerCase());
    if (!deployer) return null;

    Object.assign(deployer, updates, { updatedAt: Date.now() });
    return deployer;
  }

  // ==========================================================================
  // DEPLOYMENT MONITORING
  // ==========================================================================

  private async checkPendingTransaction(txHash: string): Promise<void> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx || tx.to) return; // Not a deployment

      const deployerAddress = tx.from.toLowerCase();
      const deployer = this.trackedDeployers.get(deployerAddress);

      if (!deployer) return;

      // This is a deployment from a tracked deployer
      logger.info(`Pending deployment detected from ${deployer.label}`);

      // Store for later confirmation
      this.recentDeployments.set(txHash, {
        deployer: tx.from,
        contractAddress: '', // Will be filled on confirmation
        txHash,
        blockNumber: 0,
        timestamp: Date.now(),
        bytecodeHash: ethers.keccak256(tx.data),
        isToken: false // Will be determined later
      });

    } catch (error) {
      // Transaction might have been mined already
    }
  }

  private async checkBlockForDeployments(blockNumber: number): Promise<void> {
    try {
      const block = await this.provider.getBlock(blockNumber, true);
      if (!block) return;

      for (const txHash of block.transactions) {
        if (typeof txHash === 'string') {
          await this.checkConfirmedDeployment(txHash);
        }
      }
    } catch (error) {
      logger.debug(`Error checking block ${blockNumber}:`, error);
    }
  }

  private async checkConfirmedDeployment(txHash: string): Promise<void> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt || !receipt.contractAddress) return;

      const tx = await this.provider.getTransaction(txHash);
      if (!tx) return;

      const deployerAddress = tx.from.toLowerCase();
      const deployer = this.trackedDeployers.get(deployerAddress);

      // Check if it's a token contract
      const isToken = await this.isTokenContract(receipt.contractAddress);

      const event: DeploymentEvent = {
        deployer: tx.from,
        contractAddress: receipt.contractAddress,
        txHash,
        blockNumber: receipt.blockNumber,
        timestamp: Date.now(),
        bytecodeHash: ethers.keccak256(tx.data),
        isToken
      };

      if (isToken) {
        event.tokenInfo = await getTokenInfo(this.provider, receipt.contractAddress) || undefined;
      }

      this.emit('deployer:newDeployment', event);

      // Update deployer if tracked
      if (deployer && isToken) {
        await this.addTokenToDeployer(deployer, event);
      }

    } catch (error) {
      logger.debug(`Error checking deployment ${txHash}:`, error);
    }
  }

  private async isTokenContract(address: string): Promise<boolean> {
    try {
      const code = await this.provider.getCode(address);
      if (code === '0x') return false;

      // Check for ERC20 signatures in bytecode
      let matchCount = 0;
      for (const sig of this.TOKEN_SIGNATURES) {
        if (code.includes(sig.slice(2))) {
          matchCount++;
        }
      }

      // If has at least 3 of the 5 signatures, likely a token
      return matchCount >= 3;
    } catch {
      return false;
    }
  }

  private async addTokenToDeployer(
    deployer: TrackedDeployer,
    event: DeploymentEvent
  ): Promise<void> {
    const token: DeployedToken = {
      address: event.contractAddress,
      name: event.tokenInfo?.name || 'Unknown',
      symbol: event.tokenInfo?.symbol || '???',
      deployTxHash: event.txHash,
      deployBlock: event.blockNumber,
      deployTimestamp: event.timestamp,
      status: 'PENDING'
    };

    deployer.deployedTokens.push(token);
    deployer.totalDeployments++;
    deployer.lastSeen = Date.now();
    deployer.updatedAt = Date.now();

    logger.info(`New token from ${deployer.label}: ${token.symbol} (${token.address})`);
  }

  // ==========================================================================
  // HISTORICAL DATA
  // ==========================================================================

  private async fetchDeployerHistory(deployer: TrackedDeployer): Promise<void> {
    try {
      if (!config.etherscanApiKey) return;

      // Fetch internal transactions (contract creations)
      const response = await axios.get(
        API_ENDPOINTS.etherscan.mainnet,
        {
          params: {
            module: 'account',
            action: 'txlistinternal',
            address: deployer.address,
            startblock: 0,
            endblock: 99999999,
            page: 1,
            offset: 100,
            sort: 'desc',
            apikey: config.etherscanApiKey
          },
          timeout: 10000
        }
      );

      if (response.data.status !== '1') return;

      for (const tx of response.data.result) {
        if (tx.type === 'create' || tx.type === 'create2') {
          const isToken = await this.isTokenContract(tx.contractAddress);
          if (isToken) {
            const tokenInfo = await getTokenInfo(this.provider, tx.contractAddress);
            
            deployer.deployedTokens.push({
              address: tx.contractAddress,
              name: tokenInfo?.name || 'Unknown',
              symbol: tokenInfo?.symbol || '???',
              deployTxHash: tx.hash,
              deployBlock: parseInt(tx.blockNumber),
              deployTimestamp: parseInt(tx.timeStamp) * 1000,
              status: 'ACTIVE' // Assume active for historical
            });
            deployer.totalDeployments++;
          }
        }
      }

      logger.info(`Fetched ${deployer.totalDeployments} historical deployments for ${deployer.label}`);
    } catch (error) {
      logger.debug(`Failed to fetch deployer history: ${error}`);
    }
  }

  // ==========================================================================
  // CHECK PENDING DEPLOYMENTS
  // ==========================================================================

  private async checkPendingDeployments(): Promise<void> {
    for (const [txHash, event] of this.recentDeployments) {
      try {
        const receipt = await this.provider.getTransactionReceipt(txHash);
        if (receipt) {
          // Remove from pending
          this.recentDeployments.delete(txHash);

          if (receipt.contractAddress) {
            event.contractAddress = receipt.contractAddress;
            event.blockNumber = receipt.blockNumber;
            event.isToken = await this.isTokenContract(receipt.contractAddress);
            
            if (event.isToken) {
              event.tokenInfo = await getTokenInfo(this.provider, receipt.contractAddress) || undefined;
              this.emit('deployer:newDeployment', event);
            }
          }
        }
      } catch {
        // Transaction might not be mined yet
      }
    }

    // Clean old entries
    const now = Date.now();
    for (const [txHash, event] of this.recentDeployments) {
      if (now - event.timestamp > 600000) { // 10 minutes
        this.recentDeployments.delete(txHash);
      }
    }
  }

  // ==========================================================================
  // REPUTATION SCORING
  // ==========================================================================

  calculateReputation(deployer: TrackedDeployer): number {
    let score = 0;

    // Successful tokens (positive)
    score += deployer.successfulTokens * 10;

    // Rugged tokens (very negative)
    score -= deployer.ruggedTokens * 30;

    // Average ATH (positive if good)
    if (deployer.avgATH > 5) score += 10;
    if (deployer.avgATH > 10) score += 10;
    if (deployer.avgATH > 50) score += 20;

    // Type bonuses/penalties
    switch (deployer.type) {
      case 'VERIFIED':
        score += 30;
        break;
      case 'KNOWN_SCAMMER':
        score -= 100;
        break;
      case 'WHALE':
        score += 15;
        break;
    }

    // Clamp to -100 to 100
    return Math.max(-100, Math.min(100, score));
  }

  // ==========================================================================
  // SEARCH & DISCOVERY
  // ==========================================================================

  async searchDeployer(address: string): Promise<{
    address: string;
    deploymentCount: number;
    tokenCount: number;
    firstDeployment?: number;
    lastDeployment?: number;
  } | null> {
    try {
      if (!config.etherscanApiKey) return null;

      const response = await axios.get(
        API_ENDPOINTS.etherscan.mainnet,
        {
          params: {
            module: 'account',
            action: 'txlist',
            address,
            startblock: 0,
            endblock: 99999999,
            page: 1,
            offset: 1000,
            sort: 'asc',
            apikey: config.etherscanApiKey
          },
          timeout: 10000
        }
      );

      if (response.data.status !== '1') return null;

      const deployments = response.data.result.filter(
        (tx: any) => !tx.to || tx.to === ''
      );

      if (deployments.length === 0) return null;

      let tokenCount = 0;
      for (const tx of deployments.slice(0, 10)) { // Check first 10
        if (tx.contractAddress) {
          const isToken = await this.isTokenContract(tx.contractAddress);
          if (isToken) tokenCount++;
        }
      }

      return {
        address: checksumAddress(address),
        deploymentCount: deployments.length,
        tokenCount,
        firstDeployment: parseInt(deployments[0].timeStamp) * 1000,
        lastDeployment: parseInt(deployments[deployments.length - 1].timeStamp) * 1000
      };
    } catch (error) {
      logger.debug(`Failed to search deployer: ${error}`);
      return null;
    }
  }

  // ==========================================================================
  // STATUS
  // ==========================================================================

  getStatus(): {
    isMonitoring: boolean;
    deployersCount: number;
    pendingDeployments: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      deployersCount: this.trackedDeployers.size,
      pendingDeployments: this.recentDeployments.size
    };
  }

  getTopDeployers(limit: number = 10): TrackedDeployer[] {
    return Array.from(this.trackedDeployers.values())
      .sort((a, b) => this.calculateReputation(b) - this.calculateReputation(a))
      .slice(0, limit);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const deployerTracker = new DeployerTracker();
