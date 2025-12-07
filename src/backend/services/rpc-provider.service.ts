// Multi-RPC Provider Service with Automatic Failover
// Supports Ethereum, Polygon, Arbitrum, BSC with health checking

import { ethers } from 'ethers';
import { logger } from '../services/logger.service';

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcs: RpcEndpoint[];
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface RpcEndpoint {
  url: string;
  priority: number;
  isHealthy: boolean;
  lastCheck: number;
  latency: number;
  type: 'alchemy' | 'infura' | 'quicknode' | 'public' | 'custom';
}

export interface ProviderHealth {
  chainId: number;
  activeRpc: string;
  healthyEndpoints: number;
  totalEndpoints: number;
  lastHealthCheck: number;
}

// Chain configurations with multiple RPC endpoints
const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: 'Ethereum',
    rpcs: [
      { url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`, priority: 1, isHealthy: true, lastCheck: 0, latency: 0, type: 'alchemy' },
      { url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`, priority: 2, isHealthy: true, lastCheck: 0, latency: 0, type: 'infura' },
      { url: 'https://eth.llamarpc.com', priority: 3, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
      { url: 'https://rpc.ankr.com/eth', priority: 4, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
      { url: 'https://cloudflare-eth.com', priority: 5, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
    ],
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  // Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcs: [
      { url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`, priority: 1, isHealthy: true, lastCheck: 0, latency: 0, type: 'alchemy' },
      { url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`, priority: 2, isHealthy: true, lastCheck: 0, latency: 0, type: 'infura' },
      { url: 'https://rpc.sepolia.org', priority: 3, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
    ],
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
  },
  // Polygon
  137: {
    chainId: 137,
    name: 'Polygon',
    rpcs: [
      { url: process.env.POLYGON_RPC_URL || `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`, priority: 1, isHealthy: true, lastCheck: 0, latency: 0, type: 'alchemy' },
      { url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`, priority: 2, isHealthy: true, lastCheck: 0, latency: 0, type: 'infura' },
      { url: 'https://polygon-rpc.com', priority: 3, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
      { url: 'https://rpc.ankr.com/polygon', priority: 4, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
    ],
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
  // Arbitrum One
  42161: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcs: [
      { url: process.env.ARBITRUM_RPC_URL || `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`, priority: 1, isHealthy: true, lastCheck: 0, latency: 0, type: 'alchemy' },
      { url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`, priority: 2, isHealthy: true, lastCheck: 0, latency: 0, type: 'infura' },
      { url: 'https://arb1.arbitrum.io/rpc', priority: 3, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
      { url: 'https://rpc.ankr.com/arbitrum', priority: 4, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
    ],
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  // BSC
  56: {
    chainId: 56,
    name: 'BNB Smart Chain',
    rpcs: [
      { url: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org', priority: 1, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
      { url: 'https://bsc-dataseed2.binance.org', priority: 2, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
      { url: 'https://rpc.ankr.com/bsc', priority: 3, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
      { url: 'https://bsc-rpc.gateway.pokt.network', priority: 4, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
    ],
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  },
  // Optimism
  10: {
    chainId: 10,
    name: 'Optimism',
    rpcs: [
      { url: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`, priority: 1, isHealthy: true, lastCheck: 0, latency: 0, type: 'alchemy' },
      { url: `https://optimism-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`, priority: 2, isHealthy: true, lastCheck: 0, latency: 0, type: 'infura' },
      { url: 'https://mainnet.optimism.io', priority: 3, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
    ],
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  // Base
  8453: {
    chainId: 8453,
    name: 'Base',
    rpcs: [
      { url: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`, priority: 1, isHealthy: true, lastCheck: 0, latency: 0, type: 'alchemy' },
      { url: 'https://mainnet.base.org', priority: 2, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
      { url: 'https://base.llamarpc.com', priority: 3, isHealthy: true, lastCheck: 0, latency: 0, type: 'public' },
    ],
    blockExplorer: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
};

class RpcProviderService {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private activeRpcs: Map<number, string> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private initialized = false;

  constructor() {
    // Delay initialization to avoid blocking startup
    setImmediate(() => {
      this.initializeProviders();
      this.startHealthChecking();
    });
  }

  // Check if URL is valid (not containing undefined or empty)
  private isValidRpcUrl(url: string): boolean {
    return url && 
           !url.includes('undefined') && 
           !url.includes('/v2/undefined') && 
           !url.includes('/v3/undefined') &&
           url.startsWith('http');
  }

  private initializeProviders(): void {
    for (const [chainId, config] of Object.entries(CHAIN_CONFIGS)) {
      const id = parseInt(chainId);
      const bestRpc = this.getBestRpc(id);
      if (bestRpc && this.isValidRpcUrl(bestRpc.url)) {
        try {
          // Use static network to avoid network detection on startup
          this.providers.set(id, new ethers.JsonRpcProvider(bestRpc.url, id, { staticNetwork: true }));
          this.activeRpcs.set(id, bestRpc.url);
          logger.info(`[RPC] Initialized ${config.name} with ${bestRpc.type} endpoint`);
        } catch (error: any) {
          logger.warn(`[RPC] Failed to initialize ${config.name}: ${error.message}`);
        }
      }
    }
    this.initialized = true;
  }

  private getBestRpc(chainId: number): RpcEndpoint | null {
    const config = CHAIN_CONFIGS[chainId];
    if (!config) return null;

    // Filter healthy endpoints and sort by priority
    const healthyRpcs = config.rpcs
      .filter(rpc => rpc.isHealthy && rpc.url && !rpc.url.includes('undefined'))
      .sort((a, b) => a.priority - b.priority);

    return healthyRpcs[0] || null;
  }

  private async checkRpcHealth(chainId: number, rpc: RpcEndpoint): Promise<boolean> {
    if (!this.isValidRpcUrl(rpc.url)) {
      rpc.isHealthy = false;
      return false;
    }

    try {
      const start = Date.now();
      // Use static network to avoid network detection
      const provider = new ethers.JsonRpcProvider(rpc.url, chainId, { staticNetwork: true });
      await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      rpc.latency = Date.now() - start;
      rpc.isHealthy = true;
      rpc.lastCheck = Date.now();
      return true;
    } catch (error) {
      rpc.isHealthy = false;
      rpc.lastCheck = Date.now();
      return false;
    }
  }

  private async healthCheck(): Promise<void> {
    for (const [chainId, config] of Object.entries(CHAIN_CONFIGS)) {
      const id = parseInt(chainId);
      
      // Check all RPCs in parallel
      await Promise.all(
        config.rpcs.map(rpc => this.checkRpcHealth(id, rpc))
      );

      // Switch to better RPC if current is unhealthy
      const currentRpc = this.activeRpcs.get(id);
      const currentRpcConfig = config.rpcs.find(r => r.url === currentRpc);
      
      if (!currentRpcConfig?.isHealthy) {
        const bestRpc = this.getBestRpc(id);
        if (bestRpc && bestRpc.url !== currentRpc) {
          logger.info(`[RPC] Switching ${config.name} from ${currentRpcConfig?.type || 'unknown'} to ${bestRpc.type}`);
          this.providers.set(id, new ethers.JsonRpcProvider(bestRpc.url, id));
          this.activeRpcs.set(id, bestRpc.url);
        }
      }
    }
  }

  private startHealthChecking(): void {
    // Initial health check
    this.healthCheck();

    // Periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.healthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  // Get provider for a specific chain
  getProvider(chainId: number = 1): ethers.JsonRpcProvider {
    let provider = this.providers.get(chainId);
    
    if (!provider) {
      const bestRpc = this.getBestRpc(chainId);
      if (bestRpc) {
        provider = new ethers.JsonRpcProvider(bestRpc.url, chainId);
        this.providers.set(chainId, provider);
        this.activeRpcs.set(chainId, bestRpc.url);
      } else {
        throw new Error(`No RPC available for chain ${chainId}`);
      }
    }
    
    return provider;
  }

  // Get chain configuration
  getChainConfig(chainId: number): ChainConfig | null {
    return CHAIN_CONFIGS[chainId] || null;
  }

  // Get all supported chains
  getSupportedChains(): ChainConfig[] {
    return Object.values(CHAIN_CONFIGS);
  }

  // Get health status for all chains
  getHealthStatus(): ProviderHealth[] {
    const status: ProviderHealth[] = [];
    
    for (const [chainId, config] of Object.entries(CHAIN_CONFIGS)) {
      const id = parseInt(chainId);
      const healthyCount = config.rpcs.filter(r => r.isHealthy).length;
      
      status.push({
        chainId: id,
        activeRpc: this.activeRpcs.get(id) || 'none',
        healthyEndpoints: healthyCount,
        totalEndpoints: config.rpcs.length,
        lastHealthCheck: config.rpcs[0]?.lastCheck || 0,
      });
    }
    
    return status;
  }

  // Add custom RPC for a chain
  addCustomRpc(chainId: number, url: string, priority: number = 0): void {
    const config = CHAIN_CONFIGS[chainId];
    if (!config) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    config.rpcs.unshift({
      url,
      priority,
      isHealthy: true,
      lastCheck: 0,
      latency: 0,
      type: 'custom',
    });

    // Re-initialize provider with new RPC
    const bestRpc = this.getBestRpc(chainId);
    if (bestRpc) {
      this.providers.set(chainId, new ethers.JsonRpcProvider(bestRpc.url, chainId));
      this.activeRpcs.set(chainId, bestRpc.url);
    }
  }

  // Execute with automatic failover
  async executeWithFailover<T>(
    chainId: number,
    operation: (provider: ethers.JsonRpcProvider) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    const config = CHAIN_CONFIGS[chainId];
    if (!config) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const sortedRpcs = [...config.rpcs]
      .filter(r => r.isHealthy && r.url && !r.url.includes('undefined'))
      .sort((a, b) => a.priority - b.priority);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < Math.min(maxRetries, sortedRpcs.length); attempt++) {
      const rpc = sortedRpcs[attempt];
      try {
        const provider = new ethers.JsonRpcProvider(rpc.url, chainId);
        return await operation(provider);
      } catch (error: any) {
        logger.warn(`[RPC] Attempt ${attempt + 1} failed for ${config.name} (${rpc.type}): ${error.message}`);
        rpc.isHealthy = false;
        lastError = error;
      }
    }

    throw lastError || new Error(`All RPC endpoints failed for chain ${chainId}`);
  }

  // Cleanup
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// Export singleton instance
export const rpcProviderService = new RpcProviderService();
export { RpcProviderService, CHAIN_CONFIGS };
