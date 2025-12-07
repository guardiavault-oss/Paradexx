// Gas Optimization Service - EIP-1559, Flashbots, gas prediction

import axios from 'axios';
import { logger } from '../services/logger.service';
import { ethers } from 'ethers';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const BLOCKNATIVE_API_KEY = process.env.BLOCKNATIVE_API_KEY;

export interface GasEstimate {
  slow: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    estimatedTime: number; // seconds
    price: number; // USD
  };
  standard: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    estimatedTime: number;
    price: number;
  };
  fast: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    estimatedTime: number;
    price: number;
  };
  instant: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    estimatedTime: number;
    price: number;
  };
  baseFee: string;
  nextBaseFee: string;
  gasPrice: string; // Legacy
  ethPrice: number;
}

export interface GasHistory {
  timestamp: number;
  baseFee: string;
  gasPrice: string;
  utilization: number;
}

export class GasOptimizer {
  private provider: ethers.JsonRpcProvider;

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  // Get current gas prices (EIP-1559)
  async getCurrentGas(): Promise<GasEstimate> {
    try {
      // Get from multiple sources and compare
      const [etherscan, blocknative, onChain] = await Promise.allSettled([
        this.getEtherscanGas(),
        this.getBlocknativeGas(),
        this.getOnChainGas(),
      ]);

      // Use Blocknative if available (most accurate)
      if (blocknative.status === 'fulfilled') {
        return blocknative.value;
      }

      // Fall back to Etherscan
      if (etherscan.status === 'fulfilled') {
        return etherscan.value;
      }

      // Last resort: on-chain
      if (onChain.status === 'fulfilled') {
        return onChain.value;
      }

      throw new Error('All gas price sources failed');
    } catch (error) {
      logger.error('Gas price error:', error);
      throw new Error('Failed to get gas prices');
    }
  }

  // Get gas from Etherscan
  private async getEtherscanGas(): Promise<GasEstimate> {
    const response = await axios.get(
      'https://api.etherscan.io/api',
      {
        params: {
          module: 'gastracker',
          action: 'gasoracle',
          apikey: ETHERSCAN_API_KEY,
        },
      }
    );

    const data = response.data.result;
    const ethPrice = await this.getEthPrice();

    const baseFee = ethers.parseUnits(data.suggestBaseFee, 'gwei');
    const slow = ethers.parseUnits(data.SafeGasPrice, 'gwei');
    const standard = ethers.parseUnits(data.ProposeGasPrice, 'gwei');
    const fast = ethers.parseUnits(data.FastGasPrice, 'gwei');

    return {
      slow: {
        maxFeePerGas: slow.toString(),
        maxPriorityFeePerGas: (slow - baseFee).toString(),
        estimatedTime: 300, // 5 min
        price: this.calculateGasPrice(slow.toString(), ethPrice),
      },
      standard: {
        maxFeePerGas: standard.toString(),
        maxPriorityFeePerGas: (standard - baseFee).toString(),
        estimatedTime: 60, // 1 min
        price: this.calculateGasPrice(standard.toString(), ethPrice),
      },
      fast: {
        maxFeePerGas: fast.toString(),
        maxPriorityFeePerGas: (fast - baseFee).toString(),
        estimatedTime: 15, // 15 sec
        price: this.calculateGasPrice(fast.toString(), ethPrice),
      },
      instant: {
        maxFeePerGas: (fast * 120n / 100n).toString(), // 20% higher
        maxPriorityFeePerGas: ((fast - baseFee) * 120n / 100n).toString(),
        estimatedTime: 12, // Next block
        price: this.calculateGasPrice((fast * 120n / 100n).toString(), ethPrice),
      },
      baseFee: baseFee.toString(),
      nextBaseFee: this.predictNextBaseFee(baseFee.toString()),
      gasPrice: standard.toString(),
      ethPrice,
    };
  }

  // Get gas from Blocknative
  private async getBlocknativeGas(): Promise<GasEstimate> {
    const response = await axios.get(
      'https://api.blocknative.com/gasprices/blockprices',
      {
        headers: {
          Authorization: BLOCKNATIVE_API_KEY,
        },
      }
    );

    const data = response.data.blockPrices[0];
    const ethPrice = await this.getEthPrice();

    const baseFee = ethers.parseUnits(data.baseFeePerGas.toString(), 'gwei');

    return {
      slow: {
        maxFeePerGas: ethers.parseUnits(
          data.estimatedPrices[3].maxFeePerGas.toString(),
          'gwei'
        ).toString(),
        maxPriorityFeePerGas: ethers.parseUnits(
          data.estimatedPrices[3].maxPriorityFeePerGas.toString(),
          'gwei'
        ).toString(),
        estimatedTime: 300,
        price: this.calculateGasPrice(
          ethers.parseUnits(data.estimatedPrices[3].maxFeePerGas.toString(), 'gwei').toString(),
          ethPrice
        ),
      },
      standard: {
        maxFeePerGas: ethers.parseUnits(
          data.estimatedPrices[2].maxFeePerGas.toString(),
          'gwei'
        ).toString(),
        maxPriorityFeePerGas: ethers.parseUnits(
          data.estimatedPrices[2].maxPriorityFeePerGas.toString(),
          'gwei'
        ).toString(),
        estimatedTime: 60,
        price: this.calculateGasPrice(
          ethers.parseUnits(data.estimatedPrices[2].maxFeePerGas.toString(), 'gwei').toString(),
          ethPrice
        ),
      },
      fast: {
        maxFeePerGas: ethers.parseUnits(
          data.estimatedPrices[1].maxFeePerGas.toString(),
          'gwei'
        ).toString(),
        maxPriorityFeePerGas: ethers.parseUnits(
          data.estimatedPrices[1].maxPriorityFeePerGas.toString(),
          'gwei'
        ).toString(),
        estimatedTime: 15,
        price: this.calculateGasPrice(
          ethers.parseUnits(data.estimatedPrices[1].maxFeePerGas.toString(), 'gwei').toString(),
          ethPrice
        ),
      },
      instant: {
        maxFeePerGas: ethers.parseUnits(
          data.estimatedPrices[0].maxFeePerGas.toString(),
          'gwei'
        ).toString(),
        maxPriorityFeePerGas: ethers.parseUnits(
          data.estimatedPrices[0].maxPriorityFeePerGas.toString(),
          'gwei'
        ).toString(),
        estimatedTime: 12,
        price: this.calculateGasPrice(
          ethers.parseUnits(data.estimatedPrices[0].maxFeePerGas.toString(), 'gwei').toString(),
          ethPrice
        ),
      },
      baseFee: baseFee.toString(),
      nextBaseFee: this.predictNextBaseFee(baseFee.toString()),
      gasPrice: ethers.parseUnits(
        data.estimatedPrices[2].maxFeePerGas.toString(),
        'gwei'
      ).toString(),
      ethPrice,
    };
  }

  // Get gas on-chain
  private async getOnChainGas(): Promise<GasEstimate> {
    const feeData = await this.provider.getFeeData();
    const ethPrice = await this.getEthPrice();

    const baseFee = feeData.maxFeePerGas || 0n;
    const priorityFee = feeData.maxPriorityFeePerGas || 0n;

    return {
      slow: {
        maxFeePerGas: (baseFee + priorityFee / 2n).toString(),
        maxPriorityFeePerGas: (priorityFee / 2n).toString(),
        estimatedTime: 300,
        price: this.calculateGasPrice((baseFee + priorityFee / 2n).toString(), ethPrice),
      },
      standard: {
        maxFeePerGas: (baseFee + priorityFee).toString(),
        maxPriorityFeePerGas: priorityFee.toString(),
        estimatedTime: 60,
        price: this.calculateGasPrice((baseFee + priorityFee).toString(), ethPrice),
      },
      fast: {
        maxFeePerGas: (baseFee + priorityFee * 2n).toString(),
        maxPriorityFeePerGas: (priorityFee * 2n).toString(),
        estimatedTime: 15,
        price: this.calculateGasPrice((baseFee + priorityFee * 2n).toString(), ethPrice),
      },
      instant: {
        maxFeePerGas: (baseFee + priorityFee * 3n).toString(),
        maxPriorityFeePerGas: (priorityFee * 3n).toString(),
        estimatedTime: 12,
        price: this.calculateGasPrice((baseFee + priorityFee * 3n).toString(), ethPrice),
      },
      baseFee: baseFee.toString(),
      nextBaseFee: this.predictNextBaseFee(baseFee.toString()),
      gasPrice: (baseFee + priorityFee).toString(),
      ethPrice,
    };
  }

  // Get gas history (last 24h)
  async getGasHistory(hours: number = 24): Promise<GasHistory[]> {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const blocksToFetch = Math.floor((hours * 3600) / 12); // ~12 sec per block
      const history: GasHistory[] = [];

      // Sample every 100 blocks
      for (let i = 0; i < blocksToFetch; i += 100) {
        const blockNumber = currentBlock - i;
        const block = await this.provider.getBlock(blockNumber);

        if (block) {
          history.push({
            timestamp: block.timestamp * 1000,
            baseFee: block.baseFeePerGas?.toString() || '0',
            gasPrice: block.baseFeePerGas?.toString() || '0',
            utilization: block.gasUsed ? 
              Number((BigInt(block.gasUsed) * 100n) / BigInt(block.gasLimit)) : 0,
          });
        }
      }

      return history.reverse();
    } catch (error) {
      logger.error('Gas history error:', error);
      return [];
    }
  }

  // Predict next base fee
  private predictNextBaseFee(currentBaseFee: string): string {
    // EIP-1559 formula: baseFee * (1 + 0.125 * (gasUsed - gasTarget) / gasTarget)
    // Simplified: assume 50% utilization -> no change
    return currentBaseFee;
  }

  // Calculate gas price in USD
  private calculateGasPrice(gasPrice: string, ethPrice: number): number {
    const gasPriceGwei = Number(ethers.formatUnits(gasPrice, 'gwei'));
    const gasLimit = 21000; // Standard transfer
    const ethCost = (gasPriceGwei * gasLimit) / 1e9;
    return ethCost * ethPrice;
  }

  // Get ETH price
  private async getEthPrice(): Promise<number> {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price',
        {
          params: {
            ids: 'ethereum',
            vs_currencies: 'usd',
          },
        }
      );
      return response.data.ethereum.usd;
    } catch (error) {
      return 2000; // Fallback
    }
  }

  // Optimize transaction for lowest gas
  async optimizeTransaction(tx: {
    to: string;
    data: string;
    value: string;
  }): Promise<{
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    gasLimit: string;
  }> {
    // Get current gas
    const gas = await this.getCurrentGas();

    // Estimate gas limit
    const gasLimit = await this.provider.estimateGas({
      to: tx.to,
      data: tx.data,
      value: tx.value,
    });

    // Add 10% buffer
    const bufferedGasLimit = (gasLimit * 110n) / 100n;

    return {
      maxFeePerGas: gas.standard.maxFeePerGas,
      maxPriorityFeePerGas: gas.standard.maxPriorityFeePerGas,
      gasLimit: bufferedGasLimit.toString(),
    };
  }
}

// Flashbots integration (MEV protection)
export class FlashbotsService {
  private flashbotsRpc = 'https://relay.flashbots.net';

  // Send private transaction
  async sendPrivateTransaction(
    signedTx: string,
    maxBlockNumber?: number
  ): Promise<string> {
    try {
      const response = await axios.post(
        this.flashbotsRpc,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_sendPrivateTransaction',
          params: [
            {
              tx: signedTx,
              maxBlockNumber: maxBlockNumber || 'latest',
              preferences: {
                fast: true,
              },
            },
          ],
        }
      );

      return response.data.result;
    } catch (error) {
      logger.error('Flashbots error:', error);
      throw new Error('Failed to send private transaction');
    }
  }

  // Cancel private transaction
  async cancelPrivateTransaction(txHash: string): Promise<boolean> {
    try {
      const response = await axios.post(
        this.flashbotsRpc,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_cancelPrivateTransaction',
          params: [{ txHash }],
        }
      );

      return response.data.result;
    } catch (error) {
      logger.error('Flashbots cancel error:', error);
      return false;
    }
  }
}

// Export singletons
export const gasOptimizer = new GasOptimizer(
  process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'
);
export const flashbotsService = new FlashbotsService();
