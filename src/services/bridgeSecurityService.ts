/**
 * Cross-Chain Bridge Security Service Client
 * Provides comprehensive security analysis and monitoring for cross-chain bridges
 */

const SECURITY_SERVICE_URL = 
  import.meta.env.VITE_BRIDGE_SECURITY_SERVICE_URL || 
  'http://localhost:8000/api/v1';

export interface BridgeSecurityInfo {
  address: string;
  name: string;
  type: string;
  source_network: string;
  target_network: string;
  is_verified: boolean;
  total_value_locked: number;
  daily_volume: number;
  security_score?: number;
  risk_level?: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  vulnerabilities?: Vulnerability[];
  recommendations?: string[];
  last_updated: string;
}

export interface Vulnerability {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  remediation?: string;
  affected_contracts?: string[];
  affected_networks?: string[];
}

export interface SecurityScore {
  bridge_address: string;
  network: string;
  overall_score: number;
  scores: {
    code_quality?: number;
    audit_status?: number;
    governance_decentralization?: number;
    validator_set?: number;
    economic_security?: number;
    operational_security?: number;
  };
  risk_level: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
}

export interface BridgeAnalysis {
  bridge_address: string;
  source_network: string;
  target_network: string;
  security_score: number;
  risk_level: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  vulnerabilities: Vulnerability[];
  recommendations: string[];
  analysis_timestamp: string;
}

export interface ComprehensiveScanResult {
  bridge_address: string;
  network: string;
  scan_timestamp: string;
  scan_result: {
    overall_risk_score: number;
    scan_summary: {
      risk_level: string;
      total_alerts: number;
      total_recommendations: number;
    };
    alerts: Array<{
      severity: string;
      message: string;
    }>;
    recommendations: string[];
  };
  executive_summary: {
    overall_risk_score: number;
    risk_level: string;
    total_alerts: number;
    total_recommendations: number;
    critical_findings: string[];
  };
}

export interface NetworkStatus {
  network: string;
  chain_id: number;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN';
  last_block: number;
  block_time: number;
  gas_price: number;
  pending_transactions: number;
  last_updated: string;
}

export interface TransactionValidation {
  transaction_hash: string;
  source_network: string;
  target_network: string;
  is_valid: boolean;
  amount_matches: boolean;
  recipient_matches: boolean;
  finality_confirmed: boolean;
  slippage_within_limits: boolean;
  validation_timestamp: string;
  validation_errors: string[];
}

export interface SecurityAlert {
  alert_id: string;
  event_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  description: string;
  affected_bridge?: string;
  affected_network?: string;
  timestamp: string;
  acknowledged: boolean;
}

// Cache for security scores (5 minute TTL)
const securityScoreCache = new Map<string, { data: SecurityScore; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
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
  const url = `${SECURITY_SERVICE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Cross-Chain Bridge Security Service Client
 */
export const bridgeSecurityService = {
  /**
   * Check service health
   */
  async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    return apiRequest('/health');
  },

  /**
   * Analyze a cross-chain bridge for security vulnerabilities
   */
  async analyzeBridge(
    bridgeAddress: string,
    sourceNetwork: string,
    targetNetwork: string,
    analysisDepth: 'basic' | 'comprehensive' | 'deep' = 'comprehensive'
  ): Promise<BridgeAnalysis> {
    return apiRequest('/bridge/analyze', {
      method: 'POST',
      body: JSON.stringify({
        bridge_address: bridgeAddress,
        source_network: sourceNetwork,
        target_network: targetNetwork,
        analysis_depth: analysisDepth,
      }),
    });
  },

  /**
   * Get detailed security score for a bridge (with caching)
   */
  async getSecurityScore(
    bridgeAddress: string,
    network: string,
    scoringCriteria?: string[]
  ): Promise<SecurityScore> {
    const cacheKey = `${bridgeAddress}:${network}`;
    const cached = securityScoreCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const score = await apiRequest<SecurityScore>('/bridge/security-score', {
      method: 'POST',
      body: JSON.stringify({
        bridge_address: bridgeAddress,
        network,
        scoring_criteria: scoringCriteria || [
          'code_quality',
          'audit_status',
          'governance_decentralization',
          'validator_set',
          'economic_security',
          'operational_security',
        ],
      }),
    });

    // Cache the result
    securityScoreCache.set(cacheKey, {
      data: score,
      expires: Date.now() + CACHE_TTL,
    });

    return score;
  },

  /**
   * Get bridge information including security details
   */
  async getBridgeInfo(bridgeAddress: string): Promise<BridgeSecurityInfo> {
    return apiRequest(`/bridge/${bridgeAddress}/info`);
  },

  /**
   * Comprehensive security scan before transaction
   */
  async comprehensiveSecurityScan(
    bridgeAddress: string,
    network: string,
    transactionData?: any[],
    scanOptions?: {
      include_attack_analysis?: boolean;
      include_signature_analysis?: boolean;
      include_attestation_analysis?: boolean;
      include_quorum_analysis?: boolean;
      deep_scan?: boolean;
    }
  ): Promise<ComprehensiveScanResult> {
    return apiRequest('/bridge/comprehensive-security-scan', {
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
   * Detect attestation anomalies
   */
  async detectAttestationAnomalies(
    bridgeAddress: string,
    network: string,
    timeRange: string = '24h'
  ): Promise<{
    bridge_address: string;
    network: string;
    anomalies: Array<{
      anomaly_id: string;
      anomaly_type: string;
      severity: string;
      description: string;
      confidence: number;
    }>;
    summary: {
      total_anomalies: number;
      severity_score: number;
      risk_level: string;
    };
  }> {
    return apiRequest('/bridge/detect-attestation-anomalies', {
      method: 'POST',
      body: JSON.stringify({
        bridge_address: bridgeAddress,
        network,
        time_range: timeRange,
        include_details: true,
      }),
    });
  },

  /**
   * Validate a cross-chain transaction
   */
  async validateTransaction(
    transactionHash: string,
    sourceNetwork: string,
    targetNetwork: string,
    expectedAmount?: number,
    expectedRecipient?: string
  ): Promise<TransactionValidation> {
    return apiRequest('/transaction/validate', {
      method: 'POST',
      body: JSON.stringify({
        transaction_hash: transactionHash,
        source_network: sourceNetwork,
        target_network: targetNetwork,
        expected_amount: expectedAmount,
        expected_recipient: expectedRecipient,
        validate_finality: true,
        check_slippage: true,
      }),
    });
  },

  /**
   * Get network status
   */
  async getNetworkStatus(network?: string): Promise<NetworkStatus | NetworkStatus[]> {
    const endpoint = network ? `/network/${network}/status` : '/network/status';
    return apiRequest(endpoint);
  },

  /**
   * Get supported networks
   */
  async getSupportedNetworks(): Promise<{
    networks: Array<{
      name: string;
      chain_id: number;
      is_testnet: boolean;
    }>;
    total_networks: number;
  }> {
    return apiRequest('/network/supported');
  },

  /**
   * Get security dashboard
   */
  async getSecurityDashboard(): Promise<{
    overall_security_score: number;
    component_health: Record<string, string>;
    recent_events: any[];
    active_alerts: SecurityAlert[];
    recommendations: string[];
  }> {
    return apiRequest('/security/dashboard');
  },

  /**
   * Get active security alerts
   */
  async getSecurityAlerts(): Promise<{ alerts: SecurityAlert[] }> {
    return apiRequest('/security/alerts');
  },

  /**
   * Get recent security events
   */
  async getSecurityEvents(hours: number = 24): Promise<{ events: any[] }> {
    return apiRequest(`/security/events?hours=${hours}`);
  },

  /**
   * List known bridges
   */
  async listBridges(
    network?: string,
    bridgeType?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    bridges: BridgeSecurityInfo[];
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (network) params.append('network', network);
    if (bridgeType) params.append('bridge_type', bridgeType);
    
    return apiRequest(`/bridge/list?${params.toString()}`);
  },

  /**
   * Scan for vulnerabilities
   */
  async scanVulnerabilities(
    contractAddresses: string[],
    networks: string[],
    scanType: 'basic' | 'comprehensive' | 'deep' = 'comprehensive'
  ): Promise<{
    report_id: string;
    total_vulnerabilities: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    overall_risk_score: number;
    risk_level: string;
    vulnerabilities: Vulnerability[];
    recommendations: string[];
  }> {
    return apiRequest('/vulnerability/scan', {
      method: 'POST',
      body: JSON.stringify({
        contract_addresses: contractAddresses,
        networks,
        scan_type: scanType,
        include_deep_analysis: true,
        analyze_bridge_risks: true,
        check_governance: true,
      }),
    });
  },

  /**
   * Clear security score cache
   */
  clearCache(): void {
    securityScoreCache.clear();
  },

  /**
   * Clear cache for specific bridge
   */
  clearCacheForBridge(bridgeAddress: string, network: string): void {
    const cacheKey = `${bridgeAddress}:${network}`;
    securityScoreCache.delete(cacheKey);
  },
};

export default bridgeSecurityService;

