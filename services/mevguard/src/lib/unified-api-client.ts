// Unified Mempool Service API Client
// Base URL configured via environment or fallback

import {
  demoServiceStatus,
  demoDashboard,
  demoTransactions,
  demoMEVOpportunities,
  demoThreats
} from './demo-data';

interface ApiConfig {
  baseURL: string;
  timeout: number;
  useMockData: boolean;
}

const config: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_MEMPOOL_API_URL || 'http://localhost:8002',
  timeout: 30000,
  useMockData: false, // Real API by default - will fallback to demo data on failure
};

class UnifiedApiClient {
  private baseURL: string;
  private timeout: number;
  private useMockData: boolean;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.useMockData = config.useMockData;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Return mock data if enabled or if real API fails
    if (this.useMockData) {
      return this.getMockData(endpoint) as T;
    }

    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      // Fallback to mock data if API call fails
      console.log(`API call failed, using mock data for ${endpoint}`);
      return this.getMockData(endpoint) as T;
    }
  }

  private getMockData(endpoint: string): any {
    if (endpoint.includes('/services')) {
      return demoServiceStatus;
    }
    if (endpoint.includes('/dashboard')) {
      return demoDashboard;
    }
    if (endpoint.includes('/transactions')) {
      return { transactions: demoTransactions };
    }
    if (endpoint.includes('/mev')) {
      return { opportunities: demoMEVOpportunities };
    }
    if (endpoint.includes('/threats')) {
      return { threats: demoThreats };
    }
    if (endpoint.includes('/health')) {
      return { status: 'healthy', services: 3 };
    }
    if (endpoint === '/') {
      return { 
        name: 'Unified Mempool Service',
        version: '1.0.0',
        services: ['mempool-core', 'mempool-hub', 'unified-engine']
      };
    }
    return {};
  }

  // Health & Status
  async getHealth() {
    return this.request('/health');
  }

  async getServiceStatus() {
    return this.request('/api/v1/services');
  }

  async getServiceInfo() {
    return this.request('/');
  }

  // Dashboard
  async getDashboard() {
    return this.request('/api/v1/dashboard');
  }

  // Transactions
  async getTransactions(params?: {
    limit?: number;
    network?: string;
    min_value?: number;
    suspicious_only?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.network) queryParams.append('network', params.network);
    if (params?.min_value) queryParams.append('min_value', params.min_value.toString());
    if (params?.suspicious_only) queryParams.append('suspicious_only', 'true');

    const query = queryParams.toString();
    return this.request(`/api/v1/transactions${query ? `?${query}` : ''}`);
  }

  // Analytics
  async getAnalytics(params?: {
    endpoint?: string;
    network?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.endpoint) queryParams.append('endpoint', params.endpoint);
    if (params?.network) queryParams.append('network', params.network);

    const query = queryParams.toString();
    return this.request(`/api/v1/analytics${query ? `?${query}` : ''}`);
  }

  // MEV
  async getMEV(params?: {
    endpoint?: string;
    network?: string;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.endpoint) queryParams.append('endpoint', params.endpoint);
    if (params?.network) queryParams.append('network', params.network);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/api/v1/mev${query ? `?${query}` : ''}`);
  }

  // Threats
  async getThreats(params?: {
    network?: string;
    severity?: string;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.network) queryParams.append('network', params.network);
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/api/v1/threats${query ? `?${query}` : ''}`);
  }

  // Network Stats
  async getNetworkStats(network?: string) {
    const queryParams = network ? `?network=${network}` : '';
    return this.request(`/api/v1/stats${queryParams}`);
  }
}

// Export singleton instance
export const unifiedApi = new UnifiedApiClient(config);

// Export types
export interface ServiceStatus {
  healthy: boolean;
  url: string;
  status: any;
}

export interface ServicesResponse {
  services: {
    'mempool-core': ServiceStatus;
    'mempool-hub': ServiceStatus;
    'unified-engine': ServiceStatus;
  };
}

export interface DashboardResponse {
  timestamp: string;
  services: {
    'unified-engine': any;
    'mempool-hub': any;
    'mempool-core': any;
  };
  aggregated: {
    total_transactions: number;
    active_networks: number;
    mev_opportunities: number;
    threats_detected: number;
  };
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  network: string;
  timestamp: string;
  suspicious: boolean;
  source: string;
}

export interface MEVOpportunity {
  type: string;
  network: string;
  profit_estimate: number;
  confidence: number;
  details: any;
}

export interface Threat {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  network: string;
  description: string;
  timestamp: string;
  source: string;
}