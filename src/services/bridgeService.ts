/**
 * Bridge Service API Client
 * Provides methods to interact with the cross-chain bridge security service
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface BridgeAnalysisRequest {
  bridge_address: string;
  source_network: string;
  target_network: string;
  analysis_depth?: 'basic' | 'comprehensive' | 'deep';
}

export interface BridgeAnalysis {
  bridge_address: string;
  source_network: string;
  target_network: string;
  security_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: Array<{
    type: string;
    severity: string;
    description: string;
    mitigation?: string;
  }>;
  recommendations: string[];
  analysis_timestamp: string;
}

export interface SecurityScoreRequest {
  bridge_address: string;
  network: string;
  scoring_criteria?: string[];
}

export interface SecurityScore {
  bridge_address: string;
  network: string;
  overall_score: number;
  scores: Record<string, number>;
  risk_level: string;
}

export interface NetworkStatus {
  network: string;
  status: 'operational' | 'degraded' | 'down';
  liveness: string;
  last_check: string;
}

export interface BridgeQuote {
  from_network: string;
  to_network: string;
  amount: number;
  asset: string;
  estimated_fee: number;
  estimated_time: string;
  bridge_available: boolean;
  security_score: number;
  recommended_bridge?: string;
  alternative_bridges?: string[];
}

export interface ComprehensiveScanResult {
  bridge_address: string;
  network: string;
  overall_risk_score: number;
  risk_level: string;
  alerts: Array<{
    severity: string;
    message: string;
  }>;
  recommendations: string[];
  scan_timestamp: string;
}

export interface AttestationAnomaly {
  bridge_address: string;
  network: string;
  anomalies: Array<{
    type: string;
    severity: string;
    description: string;
    timestamp: string;
  }>;
  severity_score: number;
  risk_level: string;
}

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'An error occurred');
  }
  
  return data.data || data;
}

/**
 * Bridge Service API Client
 */
export const bridgeService = {
  /**
   * Check bridge service health
   */
  async healthCheck(): Promise<{ status: string }> {
    return apiRequest('/bridge-service/health');
  },

  /**
   * Analyze a cross-chain bridge for security
   */
  async analyzeBridge(request: BridgeAnalysisRequest): Promise<BridgeAnalysis> {
    return apiRequest('/bridge-service/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get bridge security score
   */
  async getSecurityScore(request: SecurityScoreRequest): Promise<SecurityScore> {
    return apiRequest('/bridge-service/security-score', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Simulate bridge attack
   */
  async simulateAttack(
    bridgeAddress: string,
    attackType: string,
    attackParameters?: Record<string, any>
  ): Promise<any> {
    return apiRequest('/bridge-service/simulate-attack', {
      method: 'POST',
      body: JSON.stringify({
        bridge_address: bridgeAddress,
        attack_type: attackType,
        attack_parameters: attackParameters || {},
      }),
    });
  },

  /**
   * Get bridge metrics
   */
  async getMetrics(bridgeAddress?: string, timeRange: string = '7d'): Promise<any> {
    const params = new URLSearchParams({ time_range: timeRange });
    if (bridgeAddress) {
      params.append('bridge_address', bridgeAddress);
    }
    return apiRequest(`/bridge-service/metrics?${params.toString()}`);
  },

  /**
   * List known bridges
   */
  async listBridges(
    network?: string,
    bridgeType?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ bridges: any[]; total: number }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (network) params.append('network', network);
    if (bridgeType) params.append('bridge_type', bridgeType);
    
    return apiRequest(`/bridge-service/list?${params.toString()}`);
  },

  /**
   * Get bridge information
   */
  async getBridgeInfo(bridgeAddress: string): Promise<any> {
    return apiRequest(`/bridge-service/${bridgeAddress}/info`);
  },

  /**
   * Detect attestation anomalies
   */
  async detectAttestationAnomalies(
    bridgeAddress: string,
    network: string,
    timeRange: string = '24h',
    includeDetails: boolean = true
  ): Promise<AttestationAnomaly> {
    return apiRequest('/bridge-service/detect-attestation-anomalies', {
      method: 'POST',
      body: JSON.stringify({
        bridge_address: bridgeAddress,
        network,
        time_range: timeRange,
        include_details: includeDetails,
      }),
    });
  },

  /**
   * Analyze quorum skews
   */
  async analyzeQuorumSkews(
    bridgeAddress: string,
    network: string,
    analysisPeriod: string = '7d'
  ): Promise<any> {
    return apiRequest('/bridge-service/analyze-quorum-skews', {
      method: 'POST',
      body: JSON.stringify({
        bridge_address: bridgeAddress,
        network,
        analysis_period: analysisPeriod,
      }),
    });
  },

  /**
   * Monitor proof of reserves
   */
  async proofOfReserves(
    bridgeAddress: string,
    network: string,
    includeAssetBreakdown: boolean = true
  ): Promise<any> {
    return apiRequest('/bridge-service/proof-of-reserves', {
      method: 'POST',
      body: JSON.stringify({
        bridge_address: bridgeAddress,
        network,
        include_asset_breakdown: includeAssetBreakdown,
      }),
    });
  },

  /**
   * Comprehensive security scan
   */
  async comprehensiveScan(
    bridgeAddress: string,
    network: string,
    transactionData?: any[],
    scanOptions?: Record<string, any>
  ): Promise<ComprehensiveScanResult> {
    return apiRequest('/bridge-service/comprehensive-scan', {
      method: 'POST',
      body: JSON.stringify({
        bridge_address: bridgeAddress,
        network,
        transaction_data: transactionData || [],
        scan_options: scanOptions || {
          include_attack_analysis: true,
          include_signature_analysis: true,
          include_attestation_analysis: true,
          include_quorum_analysis: true,
          deep_scan: false,
        },
      }),
    });
  },

  /**
   * Get network status
   */
  async getNetworkStatus(network?: string): Promise<NetworkStatus> {
    const endpoint = network
      ? `/bridge-service/network/status?network=${network}`
      : '/bridge-service/network/status';
    return apiRequest(endpoint);
  },

  /**
   * Get supported networks
   */
  async getSupportedNetworks(): Promise<string[]> {
    const response = await apiRequest<{ data?: string[] }>('/bridge-service/network/supported');
    return response.data || response as any;
  },

  /**
   * Validate transaction
   */
  async validateTransaction(txHash: string, network: string): Promise<any> {
    return apiRequest('/bridge-service/transaction/validate', {
      method: 'POST',
      body: JSON.stringify({
        transaction_hash: txHash,
        network,
      }),
    });
  },

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash: string): Promise<any> {
    return apiRequest(`/bridge-service/transaction/${txHash}/status`);
  },

  /**
   * Scan vulnerabilities
   */
  async scanVulnerabilities(
    contractAddresses: string[],
    networks: string[],
    scanType: string = 'comprehensive'
  ): Promise<any> {
    return apiRequest('/bridge-service/vulnerability/scan', {
      method: 'POST',
      body: JSON.stringify({
        contract_addresses: contractAddresses,
        networks,
        scan_type: scanType,
      }),
    });
  },

  /**
   * Get security dashboard
   */
  async getSecurityDashboard(): Promise<any> {
    return apiRequest('/bridge-service/security/dashboard');
  },

  /**
   * Get security events
   */
  async getSecurityEvents(limit: number = 50, offset: number = 0): Promise<any> {
    return apiRequest(
      `/bridge-service/security/events?limit=${limit}&offset=${offset}`
    );
  },
};

