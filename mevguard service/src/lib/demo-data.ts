// Comprehensive Demo Data for MEVGUARD Dashboard
// All data is generated to look realistic for demo videos

// Helper function to generate random data
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) => Math.floor(randomBetween(min, max));
const randomChoice = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// Networks
const NETWORKS = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'bsc', 'avalanche', 'fantom', 'cronos', 'gnosis'];
const MEV_TYPES = ['sandwich', 'arbitrage', 'liquidation', 'frontrun', 'backrun'];
const THREAT_TYPES = ['Sandwich Attack', 'Frontrunning', 'Price Manipulation', 'Flash Loan Attack', 'Rug Pull', 'Smart Contract Exploit'];

// Generate time-series data for charts
export const generateTimeSeriesData = (points: number, baseValue: number, variance: number) => {
  const data = [];
  let value = baseValue;
  const now = Date.now();
  
  for (let i = points; i >= 0; i--) {
    value = Math.max(0, value + randomBetween(-variance, variance));
    data.push({
      timestamp: new Date(now - i * 5 * 60 * 1000).toISOString(), // 5 min intervals
      time: new Date(now - i * 5 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: Math.round(value)
    });
  }
  
  return data;
};

// Service Status
export const demoServiceStatus = {
  services: {
    'mempool-core': {
      healthy: true,
      url: 'http://localhost:8000',
      status: {
        uptime: '99.94%',
        response_time: '42ms',
        requests_processed: '1.2M',
        memory_usage: '1.8GB / 4GB'
      }
    },
    'mempool-hub': {
      healthy: true,
      url: 'http://localhost:8011',
      status: {
        uptime: '99.87%',
        response_time: '38ms',
        requests_processed: '2.4M',
        memory_usage: '2.1GB / 4GB'
      }
    },
    'unified-engine': {
      healthy: true,
      url: 'http://localhost:8001',
      status: {
        uptime: '99.96%',
        response_time: '45ms',
        requests_processed: '3.1M',
        memory_usage: '1.5GB / 4GB'
      }
    }
  }
};

// Dashboard Data
export const demoDashboard = {
  timestamp: new Date().toISOString(),
  services: {
    'unified-engine': {
      total_transactions: 4532,
      networks_monitored: 10,
      threats_detected: 12,
      mev_detected: 47,
      avg_block_time: '12.3s',
      network_health: '98.5%'
    },
    'mempool-hub': {
      pending_transactions: 2341,
      avg_gas_price: '25 gwei',
      network_health: 'excellent',
      active_pools: 156,
      total_value_locked: '$847.2M'
    },
    'mempool-core': {
      mev_opportunities: 23,
      analytics_processed: 8934,
      detection_accuracy: '98.5%',
      threat_models: 47,
      ml_predictions: 2341
    }
  },
  aggregated: {
    total_transactions: 18947,
    active_networks: 10,
    mev_opportunities: 67,
    threats_detected: 18
  }
};

// Generate realistic transaction data
export const demoTransactions = Array.from({ length: 200 }, (_, i) => ({
  hash: `0x${Math.random().toString(16).substr(2, 64)}`,
  from: `0x${Math.random().toString(16).substr(2, 40)}`,
  to: `0x${Math.random().toString(16).substr(2, 40)}`,
  value: (Math.random() * 50).toFixed(4),
  network: randomChoice(NETWORKS),
  timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  suspicious: Math.random() > 0.85,
  source: randomChoice(['mempool-core', 'mempool-hub', 'unified-engine']),
  gas_price: `${randomInt(15, 80)} gwei`,
  gas_used: randomInt(21000, 500000),
  status: randomChoice(['pending', 'confirmed', 'failed']),
  block: randomInt(18000000, 18500000)
}));

// MEV Opportunities
export const demoMEVOpportunities = Array.from({ length: 80 }, (_, i) => ({
  type: randomChoice(MEV_TYPES),
  network: randomChoice(NETWORKS),
  profit_estimate: randomBetween(50, 15000),
  confidence: randomBetween(0.3, 0.99),
  details: {
    target_tx: `0x${Math.random().toString(16).substr(2, 64)}`,
    estimated_gas: randomInt(100000, 500000),
    block: randomInt(18000000, 18500000),
    pool: randomChoice(['Uniswap V3', 'Curve', 'Balancer', '1inch', 'SushiSwap']),
    token_pair: randomChoice(['WETH/USDC', 'WBTC/WETH', 'DAI/USDC', 'USDT/USDC', 'LINK/WETH'])
  },
  timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
}));

// Threats
export const demoThreats = Array.from({ length: 100 }, (_, i) => ({
  id: `threat-${i}-${Date.now()}`,
  type: randomChoice(THREAT_TYPES),
  severity: randomChoice(['low', 'medium', 'high', 'critical'] as const),
  network: randomChoice(NETWORKS),
  description: 'Suspicious transaction pattern detected with potential MEV exploitation characteristics. Multiple transactions targeting the same liquidity pool with sandwich attack signatures.',
  timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
  source: randomChoice(['mempool-core', 'mempool-hub', 'unified-engine']),
  affected_addresses: randomInt(1, 20),
  estimated_loss: `$${randomBetween(100, 50000).toFixed(2)}`,
  status: randomChoice(['active', 'mitigated', 'monitoring'])
}));

// Network Statistics
export const demoNetworkStats = NETWORKS.reduce((acc, network) => {
  acc[network] = {
    name: network,
    status: randomChoice(['active', 'active', 'active', 'degraded']), // 75% active
    pending_tx: randomInt(100, 5000),
    avg_gas: randomInt(10, 100),
    block_time: randomBetween(2, 15).toFixed(1),
    tps: randomInt(10, 500),
    validators: randomInt(100, 10000),
    health: randomInt(85, 100),
    protected_tx_24h: randomInt(1000, 50000),
    threats_blocked_24h: randomInt(10, 500),
    value_protected_24h: randomBetween(100000, 5000000)
  };
  return acc;
}, {} as Record<string, any>);

// Relay Status
export const demoRelayStatus = [
  {
    name: 'Flashbots',
    status: 'connected',
    latency: 23,
    success_rate: 99.2,
    requests_24h: 1247,
    revenue_24h: 12847.50,
    endpoint: 'https://relay.flashbots.net'
  },
  {
    name: 'MEV-Share',
    status: 'connected',
    latency: 18,
    success_rate: 98.7,
    requests_24h: 2341,
    revenue_24h: 8934.20,
    endpoint: 'https://mev-share.flashbots.net'
  },
  {
    name: 'Eden Network',
    status: 'connected',
    latency: 31,
    success_rate: 97.5,
    requests_24h: 892,
    revenue_24h: 4521.80,
    endpoint: 'https://api.edennetwork.io'
  },
  {
    name: 'BloXroute',
    status: 'connected',
    latency: 27,
    success_rate: 98.1,
    requests_24h: 1523,
    revenue_24h: 7234.90,
    endpoint: 'https://api.bloxroute.com'
  },
  {
    name: 'Manifold',
    status: 'disconnected',
    latency: 0,
    success_rate: 0,
    requests_24h: 0,
    revenue_24h: 0,
    endpoint: 'https://api.manifoldfinance.com'
  }
];

// Alerts
export const demoAlerts = Array.from({ length: 50 }, (_, i) => ({
  id: `alert-${i}`,
  type: randomChoice(['critical', 'warning', 'info', 'success']),
  title: randomChoice([
    'High-value MEV opportunity detected',
    'Unusual sandwich attack pattern',
    'Network congestion detected',
    'Relay connection unstable',
    'Protection threshold exceeded',
    'Gas price spike detected',
    'Smart contract anomaly found',
    'Transaction successfully protected',
    'MEV attack successfully blocked',
    'Protection service optimized'
  ]),
  message: 'Automated detection system identified suspicious activity requiring attention.',
  timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  read: Math.random() > 0.3,
  network: randomChoice(NETWORKS)
}));

// Live Events
export const demoLiveEvents = Array.from({ length: 100 }, (_, i) => ({
  id: `event-${i}`,
  type: randomChoice(['protection', 'threat', 'mev', 'transaction']),
  network: randomChoice(NETWORKS),
  description: randomChoice([
    'Transaction protected from sandwich attack',
    'MEV opportunity detected and captured',
    'Frontrunning attempt blocked',
    'High-value transaction routed through private relay',
    'Flash loan attack prevented',
    'Price manipulation detected and mitigated'
  ]),
  value: `$${randomBetween(100, 50000).toFixed(2)}`,
  timestamp: new Date(Date.now() - i * 3000).toISOString(), // 3 sec intervals
  tx_hash: `0x${Math.random().toString(16).substr(2, 64)}`
}));

// Chart Data - Threats Over Time
export const demoThreatsChart = generateTimeSeriesData(48, 150, 20).map(item => ({
  ...item,
  threats: item.value,
  blocked: Math.round(item.value * 0.85),
  monitoring: Math.round(item.value * 0.15)
}));

// Chart Data - Protection Stats
export const demoProtectionChart = generateTimeSeriesData(48, 500, 50).map(item => ({
  ...item,
  protected: item.value,
  exposed: Math.round(item.value * 0.1),
  value_protected: Math.round(item.value * randomBetween(1000, 5000))
}));

// Chart Data - MEV Analytics
export const demoMEVChart = generateTimeSeriesData(48, 30, 5).map(item => ({
  ...item,
  opportunities: item.value,
  captured: Math.round(item.value * 0.6),
  missed: Math.round(item.value * 0.4),
  profit: Math.round(item.value * randomBetween(500, 2000))
}));

// Chart Data - Network Performance
export const demoNetworkChart = NETWORKS.map(network => ({
  network,
  transactions: randomInt(1000, 50000),
  protected: randomInt(800, 45000),
  threats_blocked: randomInt(10, 500),
  avg_gas: randomInt(15, 80)
}));

// Chart Data - Gas Price History
export const demoGasChart = generateTimeSeriesData(48, 35, 10).map(item => ({
  ...item,
  gas_price: item.value,
  base_fee: Math.round(item.value * 0.7),
  priority_fee: Math.round(item.value * 0.3)
}));

// Protected Tokens
export const demoProtectedTokens = [
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    name: 'USDC',
    symbol: 'USDC',
    network: 'ethereum',
    protected_since: '2024-01-15T10:30:00Z',
    tx_protected: 4523,
    threats_blocked: 127,
    value_saved: '$45,234.50'
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    name: 'Tether',
    symbol: 'USDT',
    network: 'ethereum',
    protected_since: '2024-01-20T14:20:00Z',
    tx_protected: 3241,
    threats_blocked: 89,
    value_saved: '$32,891.20'
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    network: 'ethereum',
    protected_since: '2024-02-01T09:15:00Z',
    tx_protected: 2134,
    threats_blocked: 67,
    value_saved: '$128,456.80'
  },
  {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    name: 'Uniswap',
    symbol: 'UNI',
    network: 'ethereum',
    protected_since: '2024-02-10T16:45:00Z',
    tx_protected: 1876,
    threats_blocked: 54,
    value_saved: '$23,567.90'
  }
];

// API Statistics
export const demoAPIStats = {
  total_requests: 1247893,
  requests_24h: 45234,
  avg_response_time: 142,
  success_rate: 99.4,
  rate_limit: '10,000 / hour',
  rate_limit_remaining: 8734,
  endpoints: [
    { path: '/api/v1/protect', calls: 18234, avg_time: 95 },
    { path: '/api/v1/threats', calls: 12456, avg_time: 78 },
    { path: '/api/v1/transactions', calls: 8934, avg_time: 125 },
    { path: '/api/v1/mev', calls: 5123, avg_time: 156 },
    { path: '/api/v1/networks', calls: 4567, avg_time: 45 }
  ]
};

// System Settings
export const demoSettings = {
  protection: {
    auto_protect: true,
    max_gas_price: 100,
    slippage_tolerance: 0.5,
    min_profit_threshold: 10,
    enable_flashbots: true,
    enable_mev_share: true
  },
  notifications: {
    email_alerts: true,
    discord_webhook: true,
    telegram_bot: false,
    slack_integration: true
  },
  api: {
    api_key: 'mevguard_demo_key_************************',
    rate_limit: 10000,
    webhook_url: 'https://api.example.com/webhook'
  }
};

// Summary Statistics
export const demoSummaryStats = {
  total_value_protected: 2847392.50,
  total_threats_blocked: 1543,
  total_transactions: 18947,
  active_protections: 247,
  networks_monitored: 10,
  relays_connected: 4,
  avg_response_time: 142,
  uptime_percentage: 99.94
};