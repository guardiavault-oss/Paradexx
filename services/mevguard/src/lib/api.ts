// MEVGUARD API Client
// Centralized API service for all backend communication

// Update this URL to point to your API server
const API_BASE_URL = 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          status: response.status,
          error: data.detail || data.message || 'API request failed',
        };
      }

      return {
        status: response.status,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        status: 500,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Health & Status
  async getHealth() {
    return this.request('/health');
  }

  async getStatus() {
    return this.request('/status');
  }

  async getDashboard() {
    return this.request('/api/v1/dashboard');
  }

  async getServices() {
    return this.request('/api/v1/services');
  }

  async getNetworkStatus() {
    return this.request('/api/v1/network/status');
  }

  async getRelaysStatus() {
    return this.request('/api/v1/relays/status');
  }

  async getPBSRelayStatus() {
    return this.request('/api/v1/pbs/relay/status');
  }

  // Protection Management
  async startProtection(data: { network?: string; protection_level?: string }) {
    return this.request('/api/v1/protection/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async stopProtection() {
    return this.request('/api/v1/protection/stop', {
      method: 'POST',
    });
  }

  async getProtectionStatus() {
    return this.request('/api/v1/protection/status');
  }

  // Transactions & Approvals
  async protectTransaction(data: {
    transaction_hash?: string;
    from_address?: string;
    to_address?: string;
    value?: number;
    network?: string;
    protection_level?: string;
  }) {
    return this.request('/api/v1/transactions/protect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

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
    if (params?.suspicious_only) queryParams.append('suspicious_only', params.suspicious_only.toString());

    const query = queryParams.toString();
    return this.request(`/api/v1/transactions${query ? '?' + query : ''}`);
  }

  async getTransaction(txHash: string) {
    return this.request(`/api/v1/transactions/${txHash}`);
  }

  async getProtectedAddresses() {
    return this.request('/api/v1/protected-addresses');
  }

  async getProtectedAddress(address: string) {
    return this.request(`/api/v1/protected-addresses/${address}`);
  }

  async getProtectedAddressesStats() {
    return this.request('/api/v1/protected-addresses/stats');
  }

  // Threat Detection & Intelligence
  async getThreats(params?: {
    network?: string;
    severity?: string;
    threat_type?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.network) queryParams.append('network', params.network);
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.threat_type) queryParams.append('threat_type', params.threat_type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request(`/api/v1/threats${query ? '?' + query : ''}`);
  }

  async getThreat(threatId: string) {
    return this.request(`/api/v1/threats/${threatId}`);
  }

  async detectMEV(data: {
    transaction_hash?: string;
    from_address?: string;
    to_address?: string;
    value?: number;
    network?: string;
  }) {
    return this.request('/api/v1/mev/detect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMEVHistory() {
    return this.request('/api/v1/mev/history');
  }

  // Statistics & Analytics
  async getStats(params?: { network?: string; timeframe?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.network) queryParams.append('network', params.network);
    if (params?.timeframe) queryParams.append('timeframe', params.timeframe);

    const query = queryParams.toString();
    return this.request(`/api/v1/stats${query ? '?' + query : ''}`);
  }

  async getMEVMetrics(params?: { time_period?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.time_period) queryParams.append('time_period', params.time_period);

    const query = queryParams.toString();
    return this.request(`/api/v1/mev/metrics${query ? '?' + query : ''}`);
  }

  async getMEVStats() {
    return this.request('/api/v1/mev/stats');
  }

  async getKPIMetrics() {
    return this.request('/api/v1/kpi/metrics');
  }

  async getAnalyticsDashboard() {
    return this.request('/api/v1/analytics/dashboard');
  }

  async getAnalyticsPerformance() {
    return this.request('/api/v1/analytics/performance');
  }

  async getAnalyticsSecurity() {
    return this.request('/api/v1/analytics/security');
  }

  // Network Management
  async getNetworks() {
    return this.request('/api/v1/networks');
  }

  async getNetworkDetail(network: string) {
    return this.request(`/api/v1/networks/${network}/status`);
  }

  // Private Relay & PBS
  async getRelays() {
    return this.request('/api/v1/relays');
  }

  async testRelay(relayType: string) {
    return this.request(`/api/v1/relays/${relayType}/test`, {
      method: 'POST',
    });
  }

  async getPBSBuilders() {
    return this.request('/api/v1/pbs/builders');
  }

  async getBuildersStatus() {
    return this.request('/api/v1/builders/status');
  }

  async getFallbackStatus() {
    return this.request('/api/v1/fallback/status');
  }

  // Order Flow Auction (OFA)
  async getOFAAuctions() {
    return this.request('/api/v1/ofa/auctions');
  }

  async createOFAAuction(data: any) {
    return this.request('/api/v1/ofa/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Intent & Orderflow Control
  async submitIntent(data: any) {
    return this.request('/api/v1/intent/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getIntent(intentId: string) {
    return this.request(`/api/v1/intent/${intentId}`);
  }

  // Export & Monitoring
  async exportTransactions(params?: any) {
    const queryParams = new URLSearchParams(params);
    const query = queryParams.toString();
    return this.request(`/api/v1/export/transactions${query ? '?' + query : ''}`);
  }

  async getLiveMonitoring() {
    return this.request('/api/v1/monitoring/live');
  }

  async getMonitoringStream() {
    return this.request('/api/v1/monitoring/stream');
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Export types for API responses
export interface DashboardData {
  overview: {
    active_protections: number;
    threats_detected_24h: number;
    transactions_protected_24h: number;
    value_protected_24h: number;
  };
  networks: {
    [key: string]: {
      threats: number;
      protected: number;
    };
  };
  recent_threats: any[];
  timestamp: string;
}

export interface StatsData {
  statistics: {
    threats_detected: number;
    threats_mitigated: number;
    transactions_protected: number;
    value_protected: number;
    gas_saved: number;
    protection_success_rate: number;
    ai_predictions?: number;
    false_positives?: number;
    total_threats?: number;
    active_protections: number;
  };
  timeframe: string;
  timestamp: string;
}

export interface Threat {
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
}

export interface ThreatsData {
  threats: Threat[];
  total_count: number;
  limit: number;
  offset: number;
  timestamp: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  network: string;
  timestamp: string;
  suspicious: boolean;
  source: string;
}

export interface TransactionsData {
  transactions: Transaction[];
  total_count: number;
  limit: number;
  offset: number;
  timestamp: string;
}

export interface MEVMetrics {
  total_mev_saved: number;
  transactions_protected: number;
  average_mev_per_transaction: number;
  gas_cost_saved: number;
  successful_protections: number;
  failed_protections: number;
  protection_success_rate: number;
  relay_usage_stats: any;
  time_period: string;
  network_breakdown: {
    [key: string]: number;
  };
  generated_at: string;
  timestamp: string;
}

export interface Relay {
  relay_type: string;
  status: string;
  latency: number;
  success_rate: number;
  last_used: string;
  enabled: boolean;
  endpoint: string;
  supported_networks: string[];
}

export interface RelaysData {
  relays: {
    [key: string]: Relay;
  };
  total_relays: number;
  active_relays: number;
  timestamp: string;
}

export interface Network {
  name: string;
  display_name: string;
  chain_id: number;
  status: string;
  rpc_endpoint: string;
  supported: boolean;
}

export interface NetworksData {
  networks: Network[];
  total_networks: number;
  active_networks: number;
  timestamp: string;
}

export interface ProtectedAddress {
  address: string;
  network: string;
  status: string;
  protected_since: string;
  transactions_protected: number;
  value_protected: number;
  threats_blocked: number;
}

export interface ProtectedAddressesData {
  addresses: ProtectedAddress[];
  total_protected: number;
  timestamp: string;
}