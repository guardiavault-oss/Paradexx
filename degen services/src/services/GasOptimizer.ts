// ============================================================================
// APEX SNIPER - Advanced Gas Optimizer
// Dynamic gas estimation for competitive sniping
// ============================================================================

import { ethers, JsonRpcProvider, Block, FeeData } from 'ethers';
import axios from 'axios';
import { config } from '../config';
import { logger, sleep } from '../utils';
import { multiRpcProvider } from './MultiRpcProvider';

// ============================================================================
// TYPES
// ============================================================================

export interface GasEstimate {
  gasPrice: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  baseFee: bigint;
  estimatedGasLimit: bigint;
  confidence: 'low' | 'medium' | 'high';
  source: string;
}

export interface GasHistoryEntry {
  blockNumber: number;
  baseFee: bigint;
  gasUsedRatio: number;
  priorityFees: bigint[];
  timestamp: number;
}

export interface GasPrediction {
  nextBlock: GasEstimate;
  in2Blocks: GasEstimate;
  in5Blocks: GasEstimate;
  trend: 'rising' | 'falling' | 'stable';
}

export type GasPreset = 'safe' | 'fast' | 'instant' | 'custom';

// ============================================================================
// GAS PRESETS
// ============================================================================

const GAS_PRESETS = {
  safe: {
    priorityFeePercentile: 25,
    maxFeeMultiplier: 1.1,
    description: 'Low cost, may take longer'
  },
  fast: {
    priorityFeePercentile: 60,
    maxFeeMultiplier: 1.25,
    description: 'Balanced speed and cost'
  },
  instant: {
    priorityFeePercentile: 90,
    maxFeeMultiplier: 1.5,
    description: 'Fastest possible execution'
  },
  custom: {
    priorityFeePercentile: 75,
    maxFeeMultiplier: 1.3,
    description: 'Custom settings'
  }
};

// ============================================================================
// GAS OPTIMIZER
// ============================================================================

export class GasOptimizer {
  private provider: JsonRpcProvider;
  private gasHistory: GasHistoryEntry[] = [];
  private readonly historySize = 100;
  private readonly updateInterval = 12000; // ~1 block
  private updateTimer: NodeJS.Timeout | null = null;
  private lastBaseFee: bigint = 0n;
  private lastPriorityFee: bigint = 0n;

  constructor() {
    this.provider = new JsonRpcProvider(config.rpcUrl);
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  async start(): Promise<void> {
    logger.info('Starting gas optimizer...');
    
    // Initialize gas history
    await this.fetchGasHistory();
    
    // Start periodic updates
    this.updateTimer = setInterval(async () => {
      await this.updateGasData();
    }, this.updateInterval);

    logger.info('Gas optimizer started');
  }

  stop(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  // ==========================================================================
  // GAS ESTIMATION
  // ==========================================================================

  async getGasEstimate(
    preset: GasPreset = 'fast',
    customMultiplier?: number
  ): Promise<GasEstimate> {
    try {
      // Try multiple sources for best accuracy
      const [feeData, blockData] = await Promise.all([
        this.provider.getFeeData(),
        this.provider.getBlock('latest')
      ]);

      const baseFee = blockData?.baseFeePerGas || feeData.gasPrice || 0n;
      const presetConfig = GAS_PRESETS[preset];

      // Calculate priority fee from history
      const priorityFee = await this.calculateOptimalPriorityFee(
        presetConfig.priorityFeePercentile
      );

      const multiplier = customMultiplier || presetConfig.maxFeeMultiplier;
      
      // Calculate max fee (base + priority) * multiplier
      const maxFeePerGas = BigInt(
        Math.ceil(Number(baseFee + priorityFee) * multiplier)
      );

      // Update last known values
      this.lastBaseFee = baseFee;
      this.lastPriorityFee = priorityFee;

      return {
        gasPrice: feeData.gasPrice || maxFeePerGas,
        maxFeePerGas,
        maxPriorityFeePerGas: priorityFee,
        baseFee,
        estimatedGasLimit: 300000n, // Default for swap
        confidence: this.gasHistory.length > 10 ? 'high' : 'medium',
        source: 'internal'
      };

    } catch (error) {
      logger.error('Gas estimation failed:', error);
      return this.getFallbackEstimate();
    }
  }

  async getAggressiveGasEstimate(
    competitorGasPrice?: bigint
  ): Promise<GasEstimate> {
    const baseEstimate = await this.getGasEstimate('instant');
    
    // If we know a competitor's gas price, outbid them
    if (competitorGasPrice) {
      const outbidAmount = competitorGasPrice / 10n; // Add 10%
      baseEstimate.maxPriorityFeePerGas = competitorGasPrice + outbidAmount;
      baseEstimate.maxFeePerGas = baseEstimate.baseFee + baseEstimate.maxPriorityFeePerGas;
    }

    // Apply safety cap
    const maxAllowed = config.maxGasPrice;
    if (baseEstimate.maxFeePerGas > maxAllowed) {
      baseEstimate.maxFeePerGas = maxAllowed;
      baseEstimate.maxPriorityFeePerGas = maxAllowed - baseEstimate.baseFee;
    }

    return baseEstimate;
  }

  async getSniperGasEstimate(
    urgency: 'normal' | 'high' | 'critical' = 'high'
  ): Promise<GasEstimate> {
    const multipliers = {
      normal: 1.2,
      high: 1.5,
      critical: 2.0
    };

    return this.getGasEstimate('instant', multipliers[urgency]);
  }

  // ==========================================================================
  // GAS PREDICTION
  // ==========================================================================

  async predictGasForNextBlocks(): Promise<GasPrediction> {
    const currentEstimate = await this.getGasEstimate('fast');
    
    // Analyze trend from history
    const trend = this.analyzeTrend();
    const trendMultiplier = {
      rising: 1.1,
      falling: 0.95,
      stable: 1.0
    }[trend];

    const createEstimate = (blocks: number): GasEstimate => {
      const multiplier = Math.pow(trendMultiplier, blocks);
      return {
        ...currentEstimate,
        baseFee: BigInt(Math.ceil(Number(currentEstimate.baseFee) * multiplier)),
        maxFeePerGas: BigInt(Math.ceil(Number(currentEstimate.maxFeePerGas) * multiplier))
      };
    };

    return {
      nextBlock: currentEstimate,
      in2Blocks: createEstimate(2),
      in5Blocks: createEstimate(5),
      trend
    };
  }

  private analyzeTrend(): 'rising' | 'falling' | 'stable' {
    if (this.gasHistory.length < 5) return 'stable';

    const recent = this.gasHistory.slice(-5);
    const avgRecent = recent.reduce((sum, h) => sum + Number(h.baseFee), 0) / recent.length;
    
    const older = this.gasHistory.slice(-10, -5);
    if (older.length === 0) return 'stable';
    
    const avgOlder = older.reduce((sum, h) => sum + Number(h.baseFee), 0) / older.length;

    const changePercent = ((avgRecent - avgOlder) / avgOlder) * 100;

    if (changePercent > 5) return 'rising';
    if (changePercent < -5) return 'falling';
    return 'stable';
  }

  // ==========================================================================
  // PRIORITY FEE CALCULATION
  // ==========================================================================

  private async calculateOptimalPriorityFee(percentile: number): Promise<bigint> {
    if (this.gasHistory.length === 0) {
      // Fallback to network estimate
      const feeData = await this.provider.getFeeData();
      return feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei');
    }

    // Collect all priority fees from history
    const allPriorityFees: bigint[] = [];
    for (const entry of this.gasHistory) {
      allPriorityFees.push(...entry.priorityFees);
    }

    if (allPriorityFees.length === 0) {
      return ethers.parseUnits('2', 'gwei');
    }

    // Sort and get percentile
    allPriorityFees.sort((a, b) => Number(a - b));
    const index = Math.floor(allPriorityFees.length * percentile / 100);
    
    return allPriorityFees[Math.min(index, allPriorityFees.length - 1)];
  }

  // ==========================================================================
  // GAS HISTORY
  // ==========================================================================

  private async fetchGasHistory(): Promise<void> {
    try {
      const latestBlock = await this.provider.getBlockNumber();
      const blocksToFetch = Math.min(20, this.historySize);

      for (let i = 0; i < blocksToFetch; i++) {
        const blockNum = latestBlock - i;
        await this.addBlockToHistory(blockNum);
      }

      logger.info(`Fetched gas history for ${blocksToFetch} blocks`);
    } catch (error) {
      logger.error('Failed to fetch gas history:', error);
    }
  }

  private async addBlockToHistory(blockNumber: number): Promise<void> {
    try {
      const block = await this.provider.getBlock(blockNumber, true);
      if (!block) return;

      // Collect priority fees from transactions
      const priorityFees: bigint[] = [];
      
      if (block.prefetchedTransactions) {
        for (const tx of block.prefetchedTransactions) {
          if (tx.maxPriorityFeePerGas) {
            priorityFees.push(tx.maxPriorityFeePerGas);
          } else if (tx.gasPrice && block.baseFeePerGas) {
            // Calculate effective priority fee
            const priorityFee = tx.gasPrice - block.baseFeePerGas;
            if (priorityFee > 0n) {
              priorityFees.push(priorityFee);
            }
          }
        }
      }

      const entry: GasHistoryEntry = {
        blockNumber: block.number,
        baseFee: block.baseFeePerGas || 0n,
        gasUsedRatio: Number(block.gasUsed) / Number(block.gasLimit),
        priorityFees,
        timestamp: block.timestamp
      };

      this.gasHistory.push(entry);

      // Trim to max size
      if (this.gasHistory.length > this.historySize) {
        this.gasHistory.shift();
      }
    } catch (error) {
      logger.debug(`Failed to add block ${blockNumber} to history:`, error);
    }
  }

  private async updateGasData(): Promise<void> {
    try {
      const latestBlock = await this.provider.getBlockNumber();
      const lastHistoryBlock = this.gasHistory.length > 0 
        ? this.gasHistory[this.gasHistory.length - 1].blockNumber 
        : 0;

      // Add new blocks since last update
      for (let bn = lastHistoryBlock + 1; bn <= latestBlock; bn++) {
        await this.addBlockToHistory(bn);
      }
    } catch (error) {
      logger.debug('Failed to update gas data:', error);
    }
  }

  // ==========================================================================
  // EXTERNAL DATA SOURCES
  // ==========================================================================

  async getExternalGasEstimate(): Promise<GasEstimate | null> {
    try {
      // Try Etherscan Gas Tracker
      if (config.etherscanApiKey) {
        const response = await axios.get(
          `https://api.etherscan.io/api`,
          {
            params: {
              module: 'gastracker',
              action: 'gasoracle',
              apikey: config.etherscanApiKey
            },
            timeout: 3000
          }
        );

        if (response.data.status === '1') {
          const data = response.data.result;
          return {
            gasPrice: ethers.parseUnits(data.SafeGasPrice, 'gwei'),
            maxFeePerGas: ethers.parseUnits(data.ProposeGasPrice, 'gwei'),
            maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
            baseFee: ethers.parseUnits(data.suggestBaseFee || '0', 'gwei'),
            estimatedGasLimit: 300000n,
            confidence: 'high',
            source: 'etherscan'
          };
        }
      }
    } catch (error) {
      logger.debug('External gas estimate failed:', error);
    }

    return null;
  }

  // ==========================================================================
  // FALLBACK
  // ==========================================================================

  private getFallbackEstimate(): GasEstimate {
    return {
      gasPrice: ethers.parseUnits('30', 'gwei'),
      maxFeePerGas: ethers.parseUnits('50', 'gwei'),
      maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
      baseFee: ethers.parseUnits('25', 'gwei'),
      estimatedGasLimit: 300000n,
      confidence: 'low',
      source: 'fallback'
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  formatGwei(value: bigint): string {
    return `${ethers.formatUnits(value, 'gwei')} gwei`;
  }

  getLastKnownBaseFee(): bigint {
    return this.lastBaseFee;
  }

  getLastKnownPriorityFee(): bigint {
    return this.lastPriorityFee;
  }

  getHistoryStats(): {
    avgBaseFee: bigint;
    minBaseFee: bigint;
    maxBaseFee: bigint;
    avgGasUsedRatio: number;
  } {
    if (this.gasHistory.length === 0) {
      return {
        avgBaseFee: 0n,
        minBaseFee: 0n,
        maxBaseFee: 0n,
        avgGasUsedRatio: 0
      };
    }

    let sumBaseFee = 0n;
    let minBaseFee = this.gasHistory[0].baseFee;
    let maxBaseFee = this.gasHistory[0].baseFee;
    let sumGasRatio = 0;

    for (const entry of this.gasHistory) {
      sumBaseFee += entry.baseFee;
      if (entry.baseFee < minBaseFee) minBaseFee = entry.baseFee;
      if (entry.baseFee > maxBaseFee) maxBaseFee = entry.baseFee;
      sumGasRatio += entry.gasUsedRatio;
    }

    return {
      avgBaseFee: sumBaseFee / BigInt(this.gasHistory.length),
      minBaseFee,
      maxBaseFee,
      avgGasUsedRatio: sumGasRatio / this.gasHistory.length
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const gasOptimizer = new GasOptimizer();
