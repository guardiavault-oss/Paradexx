// ============================================================================
// APEX SNIPER - Multi-RPC Provider
// High-availability RPC management with failover and load balancing
// ============================================================================

import { ethers, JsonRpcProvider, WebSocketProvider, TransactionRequest, TransactionResponse } from 'ethers';
import EventEmitter from 'eventemitter3';
import { config } from '../config';
import { logger, sleep } from '../utils';

// ============================================================================
// TYPES
// ============================================================================

export interface RPCEndpoint {
  url: string;
  wsUrl?: string;
  name: string;
  priority: number;
  isHealthy: boolean;
  latencyMs: number;
  lastCheck: number;
  requestCount: number;
  errorCount: number;
}

export interface MultiRpcEvents {
  'rpc:healthy': (endpoint: RPCEndpoint) => void;
  'rpc:unhealthy': (endpoint: RPCEndpoint) => void;
  'rpc:switched': (from: string, to: string) => void;
}

// ============================================================================
// DEFAULT RPC ENDPOINTS
// ============================================================================

const DEFAULT_RPC_ENDPOINTS: Omit<RPCEndpoint, 'isHealthy' | 'latencyMs' | 'lastCheck' | 'requestCount' | 'errorCount'>[] = [
  // Free public endpoints
  { url: 'https://eth.llamarpc.com', wsUrl: 'wss://eth.llamarpc.com', name: 'LlamaRPC', priority: 1 },
  { url: 'https://rpc.ankr.com/eth', wsUrl: 'wss://rpc.ankr.com/eth/ws', name: 'Ankr', priority: 2 },
  { url: 'https://ethereum.publicnode.com', wsUrl: 'wss://ethereum.publicnode.com', name: 'PublicNode', priority: 3 },
  { url: 'https://cloudflare-eth.com', name: 'Cloudflare', priority: 4 },
  { url: 'https://1rpc.io/eth', name: '1RPC', priority: 5 },
  { url: 'https://eth.drpc.org', name: 'dRPC', priority: 6 },
];

// ============================================================================
// MULTI-RPC PROVIDER
// ============================================================================

export class MultiRpcProvider extends EventEmitter<MultiRpcEvents> {
  private endpoints: Map<string, RPCEndpoint> = new Map();
  private providers: Map<string, JsonRpcProvider> = new Map();
  private wsProviders: Map<string, WebSocketProvider> = new Map();
  private currentEndpoint: string = '';
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly healthCheckPeriod = 30000; // 30 seconds
  private readonly maxLatencyMs = 2000; // 2 seconds max latency
  private readonly errorThreshold = 5; // Switch after 5 consecutive errors

  constructor() {
    super();
    this.initializeEndpoints();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  private initializeEndpoints(): void {
    // Add user-configured RPC first (highest priority)
    if (config.rpcUrl) {
      this.addEndpoint({
        url: config.rpcUrl,
        wsUrl: config.wsRpcUrl,
        name: 'Primary',
        priority: 0,
        isHealthy: true,
        latencyMs: 0,
        lastCheck: 0,
        requestCount: 0,
        errorCount: 0
      });
    }

    // Add default endpoints
    for (const ep of DEFAULT_RPC_ENDPOINTS) {
      this.addEndpoint({
        ...ep,
        isHealthy: true,
        latencyMs: 0,
        lastCheck: 0,
        requestCount: 0,
        errorCount: 0
      });
    }

    // Set initial endpoint
    this.currentEndpoint = this.getBestEndpoint()?.url || config.rpcUrl;
    logger.info(`Multi-RPC initialized with ${this.endpoints.size} endpoints`);
  }

  addEndpoint(endpoint: RPCEndpoint): void {
    this.endpoints.set(endpoint.url, endpoint);
    this.providers.set(endpoint.url, new JsonRpcProvider(endpoint.url));
    
    if (endpoint.wsUrl) {
      try {
        const wsProvider = new WebSocketProvider(endpoint.wsUrl);
        this.wsProviders.set(endpoint.url, wsProvider);
      } catch (error) {
        logger.debug(`Failed to create WebSocket for ${endpoint.name}`);
      }
    }
  }

  // ==========================================================================
  // PROVIDER ACCESS
  // ==========================================================================

  getProvider(): JsonRpcProvider {
    return this.providers.get(this.currentEndpoint) || new JsonRpcProvider(config.rpcUrl);
  }

  getWebSocketProvider(): WebSocketProvider | null {
    return this.wsProviders.get(this.currentEndpoint) || null;
  }

  getAllProviders(): JsonRpcProvider[] {
    return Array.from(this.providers.values());
  }

  // ==========================================================================
  // PARALLEL EXECUTION
  // ==========================================================================

  async executeParallel<T>(
    method: (provider: JsonRpcProvider) => Promise<T>,
    useAll: boolean = false
  ): Promise<T> {
    const providers = useAll 
      ? Array.from(this.providers.values())
      : [this.getProvider()];

    const promises = providers.map(provider => 
      method(provider).catch(error => {
        // Track error for this endpoint
        const endpoint = this.findEndpointByProvider(provider);
        if (endpoint) {
          endpoint.errorCount++;
          this.checkEndpointHealth(endpoint);
        }
        throw error;
      })
    );

    // Return first successful result
    return Promise.race(promises);
  }

  async executeFirst<T>(
    method: (provider: JsonRpcProvider) => Promise<T>
  ): Promise<T> {
    const sortedEndpoints = this.getSortedHealthyEndpoints();
    
    for (const endpoint of sortedEndpoints) {
      const provider = this.providers.get(endpoint.url);
      if (!provider) continue;

      try {
        const start = Date.now();
        const result = await method(provider);
        
        // Update stats
        endpoint.latencyMs = Date.now() - start;
        endpoint.requestCount++;
        endpoint.errorCount = 0; // Reset on success
        
        return result;
      } catch (error) {
        endpoint.errorCount++;
        this.checkEndpointHealth(endpoint);
        logger.debug(`RPC ${endpoint.name} failed, trying next...`);
      }
    }

    throw new Error('All RPC endpoints failed');
  }

  // ==========================================================================
  // BLOCK SUBSCRIPTION
  // ==========================================================================

  async subscribeToBlocks(callback: (blockNumber: number) => void): Promise<void> {
    // Subscribe via WebSocket for fastest updates
    const wsProvider = this.getWebSocketProvider();
    
    if (wsProvider) {
      wsProvider.on('block', callback);
      logger.info('Subscribed to blocks via WebSocket');
    } else {
      // Fallback to polling
      const provider = this.getProvider();
      provider.on('block', callback);
      logger.info('Subscribed to blocks via polling');
    }

    // Also subscribe to backup endpoints for redundancy
    for (const [url, wsProvider] of this.wsProviders) {
      if (url !== this.currentEndpoint) {
        try {
          wsProvider.on('block', (blockNum) => {
            // Only use if faster than primary
          });
        } catch {
          // Ignore backup subscription failures
        }
      }
    }
  }

  // ==========================================================================
  // TRANSACTION SUBMISSION
  // ==========================================================================

  async sendTransaction(signedTx: string): Promise<TransactionResponse> {
    // Send to multiple endpoints simultaneously for faster propagation
    const providers = this.getSortedHealthyEndpoints()
      .slice(0, 3) // Top 3 healthy endpoints
      .map(ep => this.providers.get(ep.url))
      .filter((p): p is JsonRpcProvider => p !== undefined);

    const promises = providers.map(provider =>
      provider.broadcastTransaction(signedTx)
    );

    // Return first successful response
    return Promise.race(promises);
  }

  async getBlockNumber(): Promise<number> {
    return this.executeFirst(provider => provider.getBlockNumber());
  }

  async getGasPrice(): Promise<bigint> {
    const feeData = await this.executeFirst(provider => provider.getFeeData());
    return feeData.gasPrice || 0n;
  }

  async getTransaction(hash: string): Promise<TransactionResponse | null> {
    return this.executeFirst(provider => provider.getTransaction(hash));
  }

  async getTransactionCount(address: string, tag: 'latest' | 'pending' = 'pending'): Promise<number> {
    return this.executeFirst(provider => provider.getTransactionCount(address, tag));
  }

  // ==========================================================================
  // HEALTH MONITORING
  // ==========================================================================

  async startHealthMonitor(): Promise<void> {
    // Initial health check
    await this.checkAllEndpoints();

    // Periodic health checks
    this.healthCheckInterval = setInterval(async () => {
      await this.checkAllEndpoints();
    }, this.healthCheckPeriod);

    logger.info('RPC health monitor started');
  }

  stopHealthMonitor(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private async checkAllEndpoints(): Promise<void> {
    const promises = Array.from(this.endpoints.values()).map(endpoint =>
      this.checkEndpointLatency(endpoint)
    );
    await Promise.allSettled(promises);

    // Switch to better endpoint if needed
    const best = this.getBestEndpoint();
    if (best && best.url !== this.currentEndpoint) {
      const oldEndpoint = this.currentEndpoint;
      this.currentEndpoint = best.url;
      this.emit('rpc:switched', oldEndpoint, best.url);
      logger.info(`Switched RPC from ${oldEndpoint} to ${best.name}`);
    }
  }

  private async checkEndpointLatency(endpoint: RPCEndpoint): Promise<void> {
    const provider = this.providers.get(endpoint.url);
    if (!provider) return;

    try {
      const start = Date.now();
      await provider.getBlockNumber();
      
      endpoint.latencyMs = Date.now() - start;
      endpoint.lastCheck = Date.now();
      endpoint.isHealthy = endpoint.latencyMs < this.maxLatencyMs;

      if (endpoint.isHealthy && !endpoint.isHealthy) {
        this.emit('rpc:healthy', endpoint);
      }
    } catch (error) {
      endpoint.isHealthy = false;
      endpoint.latencyMs = Infinity;
      this.emit('rpc:unhealthy', endpoint);
    }
  }

  private checkEndpointHealth(endpoint: RPCEndpoint): void {
    if (endpoint.errorCount >= this.errorThreshold) {
      endpoint.isHealthy = false;
      this.emit('rpc:unhealthy', endpoint);
      
      // Try to switch to a better endpoint
      const best = this.getBestEndpoint();
      if (best && best.url !== endpoint.url) {
        this.currentEndpoint = best.url;
        this.emit('rpc:switched', endpoint.url, best.url);
      }
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private getBestEndpoint(): RPCEndpoint | null {
    const healthy = this.getSortedHealthyEndpoints();
    return healthy.length > 0 ? healthy[0] : null;
  }

  private getSortedHealthyEndpoints(): RPCEndpoint[] {
    return Array.from(this.endpoints.values())
      .filter(ep => ep.isHealthy)
      .sort((a, b) => {
        // Sort by priority first, then latency
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.latencyMs - b.latencyMs;
      });
  }

  private findEndpointByProvider(provider: JsonRpcProvider): RPCEndpoint | null {
    for (const [url, p] of this.providers) {
      if (p === provider) {
        return this.endpoints.get(url) || null;
      }
    }
    return null;
  }

  getStatus(): {
    currentEndpoint: string;
    endpoints: RPCEndpoint[];
    healthyCount: number;
  } {
    const endpoints = Array.from(this.endpoints.values());
    return {
      currentEndpoint: this.currentEndpoint,
      endpoints,
      healthyCount: endpoints.filter(e => e.isHealthy).length
    };
  }

  async destroy(): Promise<void> {
    this.stopHealthMonitor();
    
    for (const wsProvider of this.wsProviders.values()) {
      try {
        await wsProvider.destroy();
      } catch {
        // Ignore errors during cleanup
      }
    }
    
    this.providers.clear();
    this.wsProviders.clear();
    this.endpoints.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const multiRpcProvider = new MultiRpcProvider();
