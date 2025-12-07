// Centralized API Client for Backend Services
// Backend routes are prefixed with /api/
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
}

// Helper to get auth headers
function getHeaders(accessToken?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(accessToken),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error: ApiError = {
      error: data.error || 'An error occurred',
      code: data.code,
      details: data.details,
    };
    throw error;
  }

  return data;
}

// ==================== WEB3 API ====================

export interface WalletBalance {
  balance: string;
  chain: string;
  formatted?: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
}

export interface TokenBalance {
  contractAddress: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  price?: number;
  value?: number;
  logo?: string;
}

export interface NFT {
  tokenAddress: string;
  tokenId: string;
  name: string;
  description?: string;
  image?: string;
  collection?: string;
  chain: string;
}

export interface Portfolio {
  totalValue: number;
  tokens: TokenBalance[];
  nfts: NFT[];
  chains: string[];
}

/**
 * Get wallet balance for a specific chain
 */
export async function getWalletBalance(
  address: string,
  chain: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base',
  accessToken: string
): Promise<WalletBalance> {
  return apiRequest<WalletBalance>(
    '/web3/balance',
    {
      method: 'POST',
      body: JSON.stringify({ address, chain }),
    },
    accessToken
  );
}

/**
 * Get transaction history for a wallet
 */
export async function getTransactionHistory(
  address: string,
  network: 'mainnet' | 'polygon' | 'arbitrum' | 'optimism' | 'base',
  accessToken: string
): Promise<Transaction[]> {
  const data = await apiRequest<{ transactions: Transaction[] }>(
    '/web3/transactions',
    {
      method: 'POST',
      body: JSON.stringify({ address, network }),
    },
    accessToken
  );
  return data.transactions || [];
}

/**
 * Get token balances for a wallet
 */
export async function getTokenBalances(
  address: string,
  chain: 'eth' | 'polygon' | 'arbitrum' | 'optimism' | 'base',
  accessToken: string
): Promise<TokenBalance[]> {
  const data = await apiRequest<{ balances: TokenBalance[] }>(
    '/web3/token-balances',
    {
      method: 'POST',
      body: JSON.stringify({ address, chain }),
    },
    accessToken
  );
  return data.balances || [];
}

/**
 * Get NFTs for a wallet
 */
export async function getNFTs(
  address: string,
  chain: 'eth' | 'polygon' | 'arbitrum' | 'optimism' | 'base',
  accessToken: string
): Promise<NFT[]> {
  const data = await apiRequest<{ nfts: NFT[] }>(
    '/web3/nfts',
    {
      method: 'POST',
      body: JSON.stringify({ address, chain }),
    },
    accessToken
  );
  return data.nfts || [];
}

/**
 * Get portfolio value and assets
 */
export async function getPortfolio(
  address: string,
  chainId: number,
  accessToken: string
): Promise<Portfolio> {
  return apiRequest<Portfolio>(
    '/web3/portfolio',
    {
      method: 'POST',
      body: JSON.stringify({ address, chainId }),
    },
    accessToken
  );
}

// ==================== AI API ====================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  conversationId?: string;
}

export interface TransactionAnalysis {
  analysis: string;
  riskLevel: 'low' | 'medium' | 'high';
  transactionType: string;
  recommendations?: string[];
}

export interface DeFiRecommendation {
  protocol: string;
  description: string;
  apy?: number;
  riskLevel: 'low' | 'medium' | 'high';
  minDeposit?: number;
}

/**
 * Chat with AI assistant (Scalette)
 */
export async function aiChat(
  message: string,
  conversationHistory: ChatMessage[] = [],
  accessToken: string
): Promise<ChatResponse> {
  return apiRequest<ChatResponse>(
    '/ai/chat',
    {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory }),
    },
    accessToken
  );
}

/**
 * Analyze a transaction for risks
 */
export async function analyzeTransaction(
  transaction: {
    from: string;
    to: string;
    value: string;
    data?: string;
    chain: string;
  },
  accessToken: string
): Promise<TransactionAnalysis> {
  return apiRequest<TransactionAnalysis>(
    '/ai/analyze-transaction',
    {
      method: 'POST',
      body: JSON.stringify(transaction),
    },
    accessToken
  );
}

/**
 * Get DeFi recommendations
 */
export async function getDeFiRecommendations(
  params: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    portfolioValue: number;
    experience: 'beginner' | 'intermediate' | 'advanced';
    interests?: string[];
  },
  accessToken: string
): Promise<DeFiRecommendation[]> {
  const data = await apiRequest<{ recommendations: DeFiRecommendation[] }>(
    '/ai/defi-recommendations',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
  return data.recommendations || [];
}

/**
 * Explain a crypto concept
 */
export async function explainConcept(
  concept: string,
  complexity: 'simple' | 'intermediate' | 'advanced' = 'simple',
  accessToken: string
): Promise<string> {
  const data = await apiRequest<{ explanation: string }>(
    '/ai/explain',
    {
      method: 'POST',
      body: JSON.stringify({ concept, complexity }),
    },
    accessToken
  );
  return data.explanation || '';
}

// ==================== TRADING API ====================

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  priceImpact: number;
  dex: string;
}

export interface SwapTransaction {
  from: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasLimit?: string;
}

/**
 * Get swap quote
 */
export async function getSwapQuote(
  params: {
    fromToken: string;
    toToken: string;
    amount: string;
    chainId?: number;
    slippage?: number;
  },
  accessToken: string
): Promise<SwapQuote> {
  return apiRequest<SwapQuote>(
    `/defi/quote?fromToken=${params.fromToken}&toToken=${params.toToken}&amount=${params.amount}&chainId=${params.chainId || 1}&slippage=${params.slippage || 1}`,
    {
      method: 'GET',
    },
    accessToken
  );
}

/**
 * Build swap transaction
 */
export async function buildSwapTransaction(
  params: {
    fromToken: string;
    toToken: string;
    amount: string;
    fromAddress: string;
    chainId?: number;
    slippage?: number;
  },
  accessToken: string
): Promise<{ quote: SwapQuote; transaction: SwapTransaction; simulation?: any }> {
  return apiRequest<{ quote: SwapQuote; transaction: SwapTransaction; simulation?: any }>(
    '/defi/swap',
    {
      method: 'POST',
      body: JSON.stringify({
        fromToken: params.fromToken,
        toToken: params.toToken,
        amount: params.amount,
        fromAddress: params.fromAddress,
        chainId: params.chainId || 1,
        slippage: params.slippage || 1,
      }),
    },
    accessToken
  );
}

/**
 * Get supported tokens
 */
export async function getSupportedTokens(
  chainId: number,
  accessToken: string
): Promise<any> {
  return apiRequest<any>(
    `/defi/tokens?chainId=${chainId}`,
    {
      method: 'GET',
    },
    accessToken
  );
}

/**
 * Get liquidity sources (DEXes)
 */
export async function getLiquiditySources(
  chainId: number,
  accessToken: string
): Promise<any[]> {
  const data = await apiRequest<{ sources: any[] }>(
    `/defi/liquidity-sources?chainId=${chainId}`,
    {
      method: 'GET',
    },
    accessToken
  );
  return data.sources || [];
}

/**
 * Get approval transaction
 */
export async function getApprovalTransaction(
  params: {
    tokenAddress: string;
    amount?: string;
    chainId?: number;
  },
  accessToken: string
): Promise<any> {
  return apiRequest<any>(
    '/defi/approve',
    {
      method: 'POST',
      body: JSON.stringify({
        tokenAddress: params.tokenAddress,
        amount: params.amount,
        chainId: params.chainId || 1,
      }),
    },
    accessToken
  );
}

/**
 * Check token allowance
 */
export async function checkTokenAllowance(
  params: {
    tokenAddress: string;
    walletAddress: string;
    chainId?: number;
  },
  accessToken: string
): Promise<{ allowance: string }> {
  return apiRequest<{ allowance: string }>(
    `/defi/allowance?tokenAddress=${params.tokenAddress}&walletAddress=${params.walletAddress}&chainId=${params.chainId || 1}`,
    {
      method: 'GET',
    },
    accessToken
  );
}

// ==================== GUARDIANX / CONTRACTS API ====================

export interface VaultInfo {
  address: string;
  owner: string;
  guardians: string[];
  threshold: number;
  timelockPeriod: number;
  status: number; // 0=Active, 1=Inheritance Initiated, etc.
  balance: string;
  network: string;
}

export interface VaultTxData {
  to: string;
  data: string;
  value: string;
  network: string;
  description: string;
  gasEstimate?: string;
}

/**
 * Create an inheritance vault
 */
export async function createVault(
  params: {
    owner: string;
    guardians: string[];
    threshold: number;
    timelockPeriod: number; // in seconds
    network: 'ethereum' | 'polygon' | 'arbitrum' | 'base';
  },
  accessToken: string
): Promise<VaultTxData> {
  return apiRequest<VaultTxData>(
    '/contracts/create-vault',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

/**
 * Get user's vaults
 */
export async function getUserVaults(
  owner: string,
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'base',
  accessToken: string
): Promise<VaultInfo[]> {
  const data = await apiRequest<{ vaults: VaultInfo[] }>(
    '/contracts/my-vaults',
    {
      method: 'POST',
      body: JSON.stringify({ owner, network }),
    },
    accessToken
  );
  return data.vaults || [];
}

/**
 * Get vault information
 */
export async function getVaultInfo(
  vaultAddress: string,
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'base',
  accessToken: string
): Promise<VaultInfo> {
  return apiRequest<VaultInfo>(
    '/contracts/vault-info',
    {
      method: 'POST',
      body: JSON.stringify({ vaultAddress, network }),
    },
    accessToken
  );
}

/**
 * Get contract addresses for a network
 */
export async function getContractAddresses(
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'base'
): Promise<{
  factory: string;
  registry: string;
  chainId: number;
}> {
  const data = await apiRequest<{ addresses: any }>(
    `/contracts/addresses/${network}`,
    {
      method: 'GET',
    }
  );
  return data.addresses;
}

// ==================== PAYMENTS API ====================

export interface CheckoutSession {
  id: string;
  url: string;
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  product: 'degenx' | 'guardianx',
  tier: 'basic' | 'pro' | 'essential' | 'advanced',
  accessToken: string
): Promise<CheckoutSession> {
  const data = await apiRequest<{ session: CheckoutSession }>(
    '/payments/create-checkout',
    {
      method: 'POST',
      body: JSON.stringify({ product, tier }),
    },
    accessToken
  );
  return data.session;
}

// ==================== WALLET API ====================

export interface WalletProfile {
  id: string;
  email: string;
  name: string;
  walletAddress?: string;
  subscription_tier: string;
  degenx_tier?: string | null;
  guardianx_tier?: string | null;
  biometric_enabled: boolean;
  created_at: string;
}

/**
 * Get user profile
 */
export async function getUserProfile(accessToken: string): Promise<WalletProfile> {
  const data = await apiRequest<{ profile: WalletProfile }>(
    '/user/profile',
    {
      method: 'GET',
    },
    accessToken
  );
  return data.profile;
}

/**
 * Update user profile
 */
// ==================== SECURITY API ====================

/**
 * Analyze MEV risk for a transaction
 */
export async function analyzeMEVRisk(params: {
  from: string;
  to: string;
  data: string;
  value: string;
  chainId?: number;
}, accessToken: string): Promise<any> {
  return apiRequest<any>(
    '/security/mev/analyze',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

/**
 * Send transaction with MEV protection (via Wallet Guard)
 */
export async function sendProtectedTransaction(params: {
  signedTx: string;
  config?: any;
}, accessToken: string): Promise<any> {
  return apiRequest<any>(
    '/security/mev/protect',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

// ==================== TRANSACTION SIMULATION API ====================

export interface SimulationBalanceChange {
  address: string;
  token: string | null;
  symbol: string;
  before: string;
  after: string;
  change: string;
  changeUSD?: number;
  isPositive: boolean;
}

export interface SimulationStateChange {
  address: string;
  before: any;
  after: any;
  type: 'balance' | 'storage' | 'code';
}

export interface TokenApproval {
  token: string;
  tokenSymbol: string;
  spender: string;
  spenderName?: string;
  amount: string;
  isUnlimited: boolean;
}

export interface ContractInteraction {
  address: string;
  name?: string;
  isVerified: boolean;
  method?: string;
  methodId?: string;
}

export interface SimulationRiskAssessment {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  warnings: Array<{
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'danger';
  }>;
  recommendations: string[];
}

export interface TransactionSimulationResult {
  success: boolean;
  simulationId: string;
  gasEstimate: string;
  gasPriceGwei: string;
  gasCostETH: string;
  gasCostUSD: number;
  expectedOutcome: 'success' | 'fail' | 'revert';
  revertReason?: string;
  balanceChanges: SimulationBalanceChange[];
  stateChanges: SimulationStateChange[];
  tokenApprovals: TokenApproval[];
  contractInteractions: ContractInteraction[];
  riskAssessment: SimulationRiskAssessment;
  blockNumber: number;
  timestamp: string;
}

export interface SimulationRequest {
  from: string;
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  chainId?: number;
  tokenAddress?: string;
}

export interface SimulationHistoryItem {
  id: string;
  request: SimulationRequest;
  result: TransactionSimulationResult;
  timestamp: string;
}

/**
 * Simulate a transaction before execution
 */
export async function simulateTransaction(
  params: SimulationRequest,
  accessToken: string
): Promise<TransactionSimulationResult> {
  return apiRequest<TransactionSimulationResult>(
    '/security/simulate',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

/**
 * Simulate a token transfer transaction
 */
export async function simulateTokenTransfer(
  params: {
    from: string;
    to: string;
    tokenAddress: string;
    amount: string;
    chainId?: number;
  },
  accessToken: string
): Promise<TransactionSimulationResult> {
  return apiRequest<TransactionSimulationResult>(
    '/security/simulate/token-transfer',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

/**
 * Get estimated gas for a transaction with USD cost
 */
export async function getGasEstimate(
  params: SimulationRequest,
  accessToken: string
): Promise<{
  gasLimit: string;
  gasPriceGwei: string;
  gasCostETH: string;
  gasCostUSD: number;
  speeds: {
    slow: { price: string; time: string; costUSD: number };
    standard: { price: string; time: string; costUSD: number };
    fast: { price: string; time: string; costUSD: number };
  };
}> {
  return apiRequest(
    '/security/gas-estimate',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

/**
 * Get simulation history for a wallet
 */
export async function getSimulationHistory(
  walletAddress: string,
  limit: number = 10,
  accessToken: string
): Promise<SimulationHistoryItem[]> {
  const data = await apiRequest<{ history: SimulationHistoryItem[] }>(
    `/security/simulations/history?address=${walletAddress}&limit=${limit}`,
    {
      method: 'GET',
    },
    accessToken
  );
  return data.history || [];
}

/**
 * Execute a previously simulated transaction
 */
export async function executeSimulatedTransaction(
  params: {
    simulationId: string;
    signedTx: string;
    useMevProtection?: boolean;
  },
  accessToken: string
): Promise<{
  txHash: string;
  status: 'pending' | 'submitted' | 'failed';
  message: string;
}> {
  return apiRequest(
    '/security/simulate/execute',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

// ==================== WALLET GUARD API ====================

/**
 * Simulate transaction through Wallet Guard
 */
export async function simulateTransactionWalletGuard(params: {
  wallet_address: string;
  transaction: {
    from: string;
    to: string;
    value?: string;
    data?: string;
    gas?: string;
  };
  network?: string;
  simulation_depth?: number;
}, accessToken?: string): Promise<{
  simulation_id: string;
  result: 'SAFE' | 'RISKY' | 'DANGEROUS';
  risks: Array<{
    type: string;
    severity: string;
    description: string;
    confidence: number;
    mitigation_suggestions: string[];
  }>;
  warnings: Array<{
    type: string;
    message: string;
    suggested_action: string;
  }>;
  recommendations: string[];
  confidence_score: number;
  execution_time: number;
  gas_estimate: string;
  balance_changes: Record<string, string>;
}> {
  // Use direct connection to Wallet Guard service
  const WALLET_GUARD_URL = import.meta.env.VITE_WALLET_GUARD_URL || 'http://localhost:8001';
  
  const response = await fetch(`${WALLET_GUARD_URL}/api/v1/wallet-guard/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Simulation failed');
  }

  return response.json();
}

/**
 * Get wallet risk score from Wallet Guard
 */
export async function getWalletRiskScore(params: {
  wallet_address: string;
  network?: string;
}, accessToken?: string): Promise<{
  score: number;
  confidence: number;
  level: 'SAFE' | 'RISKY' | 'DANGEROUS';
  reasons: string[];
  timestamp: string;
}> {
  const WALLET_GUARD_URL = import.meta.env.VITE_WALLET_GUARD_URL || 'http://localhost:8001';
  
  const response = await fetch(`${WALLET_GUARD_URL}/api/v1/guardianx/risk-score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Risk score fetch failed');
  }

  return response.json();
}

/**
 * Check if transaction is safe (via Wallet Guard)
 */
export async function checkTransactionSafety(params: {
  tx: {
    from: string;
    to: string;
    value?: string;
    data?: string;
  };
  network?: string;
}, accessToken?: string): Promise<{
  isSafe: boolean;
  riskScore: number;
  level: 'SAFE' | 'RISKY' | 'DANGEROUS';
  warnings: string[];
  recommendations: string[];
  timestamp: string;
}> {
  const WALLET_GUARD_URL = import.meta.env.VITE_WALLET_GUARD_URL || 'http://localhost:8001';
  
  const response = await fetch(`${WALLET_GUARD_URL}/api/v1/guardianx/safe-tx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Transaction safety check failed');
  }

  return response.json();
}

/**
 * Relay transaction through private relayer with MEV protection
 */
export async function relayTransactionPrivate(params: {
  tx: {
    from: string;
    to: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
    nonce?: number;
  };
  network?: string;
  use_private?: boolean;
  use_flashbots?: boolean;
  priority?: 'low' | 'normal' | 'high';
}, accessToken?: string): Promise<{
  message: string;
  tx_hash: string;
  network: string;
  status: string;
  relayed_at: string;
  private: boolean;
  bundle_id?: string;
}> {
  const WALLET_GUARD_URL = import.meta.env.VITE_WALLET_GUARD_URL || 'http://localhost:8001';
  
  const response = await fetch(`${WALLET_GUARD_URL}/api/v1/guardianx/relay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Transaction relay failed');
  }

  return response.json();
}

/**
 * Start monitoring wallet with Wallet Guard
 */
export async function startWalletMonitoring(params: {
  wallet_address: string;
  network?: string;
}, accessToken?: string): Promise<{
  message: string;
  address: string;
  network: string;
  wallet_info: any;
  monitoring_features: any;
}> {
  const WALLET_GUARD_URL = import.meta.env.VITE_WALLET_GUARD_URL || 'http://localhost:8001';
  
  const response = await fetch(`${WALLET_GUARD_URL}/api/v1/wallet-guard/monitor?wallet_address=${params.wallet_address}&network=${params.network || 'ethereum'}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Monitoring start failed');
  }

  return response.json();
}

/**
 * Get Wallet Guard threats
 */
export async function getWalletGuardThreats(params: {
  limit?: number;
  hours?: number;
}, accessToken?: string): Promise<{
  threats: Array<any>;
  count: number;
  window_hours: number;
}> {
  const WALLET_GUARD_URL = import.meta.env.VITE_WALLET_GUARD_URL || 'http://localhost:8001';
  
  const queryParams = new URLSearchParams({
    limit: (params.limit || 50).toString(),
    hours: (params.hours || 24).toString(),
  });
  
  const response = await fetch(`${WALLET_GUARD_URL}/threats?${queryParams}`, {
    method: 'GET',
    headers: {
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch threats');
  }

  return response.json();
}

/**
 * Check if token is honeypot
 */
export async function checkHoneypot(params: {
  tokenAddress: string;
  chainId?: number;
}, accessToken: string): Promise<any> {
  return apiRequest<any>(
    '/security/honeypot/check',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

/**
 * Get token safety score
 */
export async function getTokenSafetyScore(
  tokenAddress: string,
  chainId: number,
  accessToken: string
): Promise<any> {
  return apiRequest<any>(
    `/security/honeypot/safety-score/${tokenAddress}?chainId=${chainId}`,
    {
      method: 'GET',
    },
    accessToken
  );
}

// ==================== BRIDGE API ====================

/**
 * Get supported bridge chains
 */
export async function getBridgeChains(accessToken: string): Promise<any[]> {
  return apiRequest<any[]>(
    '/bridge/chains',
    {
      method: 'GET',
    },
    accessToken
  );
}

/**
 * Get bridge quote
 */
export async function getBridgeQuote(params: {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  amount: string;
  recipient?: string;
}, accessToken: string): Promise<any> {
  return apiRequest<any>(
    '/bridge/quote',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

// ==================== WALLET GUARD API ====================

export interface WalletGuardStatus {
  wallet_address: string;
  network: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  is_monitored: boolean;
  last_check: string;
  threats_detected: number;
  protection_enabled: boolean;
}

export interface WalletGuardThreat {
  threat_id: string;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  wallet_address: string;
  network: string;
  description: string;
  confidence: number;
  timestamp: string;
  metadata?: any;
}

export interface WalletGuardAnalytics {
  total_monitored: number;
  threats_detected_24h: number;
  threats_detected_7d: number;
  protection_actions_taken: number;
  high_risk_wallets: number;
  average_threat_level: string;
}

/**
 * Get wallet status
 */
export async function getWalletGuardStatus(
  walletAddress: string,
  network?: string,
  accessToken?: string
): Promise<WalletGuardStatus> {
  const endpoint = network
    ? `/wallet-guard/status/${walletAddress}?network=${network}`
    : `/wallet-guard/status/${walletAddress}`;

  return apiRequest<WalletGuardStatus>(
    endpoint,
    {
      method: 'GET',
    },
    accessToken
  );
}

/**
 * Apply protection action
 */
export async function applyWalletProtection(params: {
  wallet_address: string;
  action_type: 'freeze' | 'quarantine' | 'alert' | 'emergency';
  network?: string;
}, accessToken: string): Promise<any> {
  return apiRequest<any>(
    '/wallet-guard/protect',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

/**
 * Get wallet guard analytics
 */
export async function getWalletGuardAnalytics(params: {
  wallet_address?: string;
  network?: string;
  timeframe?: string;
}, accessToken: string): Promise<WalletGuardAnalytics> {
  const queryParams = new URLSearchParams();
  if (params.wallet_address) queryParams.append('wallet_address', params.wallet_address);
  if (params.network) queryParams.append('network', params.network);
  if (params.timeframe) queryParams.append('timeframe', params.timeframe);

  return apiRequest<WalletGuardAnalytics>(
    `/wallet-guard/analytics?${queryParams.toString()}`,
    {
      method: 'GET',
    },
    accessToken
  );
}

/**
 * Stop monitoring a wallet
 */
export async function stopWalletMonitoring(params: {
  wallet_address: string;
  network?: string;
}, accessToken: string): Promise<any> {
  return apiRequest<any>(
    '/wallet-guard/stop',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

/**
 * Get transaction relay status from Wallet Guard
 */
export interface RelayedTransactionStatus {
  tx_hash: string;
  status: 'pending' | 'submitted' | 'mined' | 'included' | 'failed';
  block_number?: number;
  confirmations?: number;
  mev_protected?: boolean;
  private_pool?: string;
  submitted_at?: string;
  mined_at?: string;
  error?: string;
}

export async function getRelayedTransactionStatus(
  txHash: string,
  network: string = 'ethereum'
): Promise<RelayedTransactionStatus> {
  const WALLET_GUARD_URL = import.meta.env.VITE_WALLET_GUARD_URL || 'http://localhost:8001';
  
  const response = await fetch(
    `${WALLET_GUARD_URL}/api/v1/guardianx/relay/status/${txHash}?network=${network}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get relay status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get monitored wallets
 */
export async function getMonitoredWallets(accessToken: string): Promise<any[]> {
  return apiRequest<any[]>(
    '/wallet-guard/monitored',
    {
      method: 'GET',
    },
    accessToken
  );
}

/**
 * Build bridge transaction
 */
export async function buildBridgeTransaction(params: {
  bridgeId: string;
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  amount: string;
  recipient?: string;
}, accessToken: string): Promise<any> {
  return apiRequest<any>(
    '/bridge/build',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function updateUserProfile(
  updates: Partial<WalletProfile>,
  accessToken: string
): Promise<WalletProfile> {
  const data = await apiRequest<{ profile: WalletProfile }>(
    '/user/profile',
    {
      method: 'PUT',
      body: JSON.stringify(updates),
    },
    accessToken
  );
  return data.profile;
}

// Export API base URL for direct use if needed
export { API_BASE };

// ==================== GUARDIAN / INHERITANCE API ====================

export interface Guardian {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'pending' | 'active' | 'declined';
  lastCheckIn?: string;
  createdAt: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  allocation: number; // percentage
  relationship: string;
  status: 'active' | 'pending';
}

export interface InheritanceConfig {
  timelockDays: number;
  lastCheckIn: string;
  guardians: Guardian[];
  beneficiaries: Beneficiary[];
  status: 'active' | 'pending' | 'triggered';
}

/**
 * Invite a guardian
 */
export async function inviteGuardian(
  params: {
    guardianEmail: string;
    guardianName: string;
    guardianPhone?: string;
  },
  accessToken: string
): Promise<{ success: boolean; guardianId: string; portalUrl: string }> {
  return apiRequest<{ success: boolean; guardianId: string; portalUrl: string }>(
    '/guardian-portal/internal/invite',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

/**
 * Get user's guardians
 */
export async function getGuardians(accessToken: string): Promise<Guardian[]> {
  const data = await apiRequest<{ guardians: Guardian[] }>(
    '/guardian-portal/internal/guardians',
    {
      method: 'GET',
    },
    accessToken
  );
  return data.guardians || [];
}

/**
 * Perform check-in (reset dead man's switch)
 */
export async function performCheckIn(accessToken: string): Promise<{ success: boolean; nextCheckIn: string }> {
  return apiRequest<{ success: boolean; nextCheckIn: string }>(
    '/guardian-portal/internal/check-in',
    {
      method: 'POST',
    },
    accessToken
  );
}

/**
 * Update timelock configuration
 */
export async function updateTimelockConfig(
  timelockDays: number,
  accessToken: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    '/guardian-portal/internal/timelock',
    {
      method: 'PUT',
      body: JSON.stringify({ timelockDays }),
    },
    accessToken
  );
}

/**
 * Add beneficiary
 */
export async function addBeneficiary(
  params: {
    name: string;
    email: string;
    walletAddress: string;
    allocation: number;
    relationship: string;
  },
  accessToken: string
): Promise<{ success: boolean; beneficiaryId: string }> {
  return apiRequest<{ success: boolean; beneficiaryId: string }>(
    '/guardian-portal/internal/beneficiaries',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

/**
 * Update beneficiary
 */
export async function updateBeneficiary(
  beneficiaryId: string,
  updates: Partial<Beneficiary>,
  accessToken: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/guardian-portal/internal/beneficiaries/${beneficiaryId}`,
    {
      method: 'PUT',
      body: JSON.stringify(updates),
    },
    accessToken
  );
}

/**
 * Delete beneficiary
 */
export async function deleteBeneficiary(
  beneficiaryId: string,
  accessToken: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/guardian-portal/internal/beneficiaries/${beneficiaryId}`,
    {
      method: 'DELETE',
    },
    accessToken
  );
}

/**
 * Get inheritance configuration
 */
export async function getInheritanceConfig(accessToken: string): Promise<InheritanceConfig> {
  return apiRequest<InheritanceConfig>(
    '/guardian-portal/internal/config',
    {
      method: 'GET',
    },
    accessToken
  );
}

// ==================== ACCOUNT MANAGEMENT API ====================

export interface AccountInfo {
  id: string;
  email: string;
  name: string;
  walletAddress?: string;
  createdAt: string;
  lastLogin?: string;
  subscription: {
    tier: string;
    status: string;
    expiresAt?: string;
  };
  settings: {
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
    notificationsEnabled: boolean;
  };
}

export interface UserWallet {
  id: string;
  address: string;
  name: string;
  network: string;
  isPrimary: boolean;
  isArchived: boolean;
  createdAt: string;
  balance?: string;
}

export interface CreateWalletParams {
  name: string;
  network: string;
  type?: 'imported' | 'generated' | 'hardware';
}

export interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'browser' | 'hardware';
  lastSeen: string;
  isTrusted: boolean;
  browser?: string;
  os?: string;
  ipAddress?: string;
}

export interface RegisterDeviceParams {
  name: string;
  type: 'mobile' | 'desktop' | 'browser' | 'hardware';
  fingerprint?: string;
  pushToken?: string;
}

export interface Session {
  id: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  location?: string;
  createdAt: string;
  lastActivity: string;
  isCurrent: boolean;
}

export async function getAccountInfo(accessToken: string): Promise<AccountInfo> {
  return apiRequest<AccountInfo>(
    '/account/',
    { method: 'GET' },
    accessToken
  );
}

export async function getUserWallets(accessToken: string): Promise<UserWallet[]> {
  const data = await apiRequest<{ wallets: UserWallet[] }>(
    '/account/wallets',
    { method: 'GET' },
    accessToken
  );
  return data.wallets || [];
}

export async function createWallet(
  params: CreateWalletParams,
  accessToken: string
): Promise<{ wallet: UserWallet; success: boolean }> {
  return apiRequest<{ wallet: UserWallet; success: boolean }>(
    '/account/wallets',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function renameWallet(
  walletId: string,
  name: string,
  accessToken: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/account/wallets/${walletId}/rename`,
    {
      method: 'PUT',
      body: JSON.stringify({ name }),
    },
    accessToken
  );
}

export async function archiveWallet(
  walletId: string,
  accessToken: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/account/wallets/${walletId}/archive`,
    { method: 'POST' },
    accessToken
  );
}

export async function getDevices(accessToken: string): Promise<Device[]> {
  const data = await apiRequest<{ devices: Device[] }>(
    '/account/devices',
    { method: 'GET' },
    accessToken
  );
  return data.devices || [];
}

export async function registerDevice(
  params: RegisterDeviceParams,
  accessToken: string
): Promise<{ device: Device; success: boolean }> {
  return apiRequest<{ device: Device; success: boolean }>(
    '/account/devices',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function trustDevice(
  deviceId: string,
  accessToken: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/account/devices/${deviceId}/trust`,
    { method: 'POST' },
    accessToken
  );
}

export async function getSessions(accessToken: string): Promise<Session[]> {
  const data = await apiRequest<{ sessions: Session[] }>(
    '/account/sessions',
    { method: 'GET' },
    accessToken
  );
  return data.sessions || [];
}

export async function revokeSession(
  sessionId: string,
  accessToken: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/account/sessions/${sessionId}`,
    { method: 'DELETE' },
    accessToken
  );
}

export async function revokeAllSessions(accessToken: string): Promise<{ success: boolean; revokedCount: number }> {
  return apiRequest<{ success: boolean; revokedCount: number }>(
    '/account/sessions/revoke-all',
    { method: 'POST' },
    accessToken
  );
}

// ==================== MEV PROTECTION API ====================

export interface MevRouteParams {
  transaction: {
    from: string;
    to: string;
    value: string;
    data?: string;
    gas?: string;
  };
  network?: string;
  useFlashbots?: boolean;
  usePrivatePool?: boolean;
  maxPriorityFee?: string;
}

export interface MevRouteResponse {
  bundleId: string;
  txHash?: string;
  status: 'pending' | 'submitted' | 'included' | 'failed';
  protectionType: string;
  estimatedSavings?: string;
  submittedAt: string;
}

export interface MevStatus {
  enabled: boolean;
  protectedTransactions: number;
  totalSaved: string;
  lastProtectedAt?: string;
  activeNetworks: string[];
}

export interface MevStats {
  totalTransactions: number;
  protectedTransactions: number;
  totalMevSaved: string;
  averageSavingsPerTx: string;
  protectionRate: number;
  byNetwork: Record<string, {
    transactions: number;
    saved: string;
  }>;
  last24Hours: {
    transactions: number;
    saved: string;
  };
  last7Days: {
    transactions: number;
    saved: string;
  };
}

export async function routeMevProtected(
  params: MevRouteParams,
  accessToken: string
): Promise<MevRouteResponse> {
  return apiRequest<MevRouteResponse>(
    '/mev/route',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function getMevStatus(accessToken: string): Promise<MevStatus> {
  return apiRequest<MevStatus>(
    '/mev/status',
    { method: 'GET' },
    accessToken
  );
}

export async function getMevStats(accessToken: string): Promise<MevStats> {
  return apiRequest<MevStats>(
    '/mev/stats',
    { method: 'GET' },
    accessToken
  );
}

export async function toggleMevProtection(
  enabled: boolean,
  accessToken: string
): Promise<{ success: boolean; enabled: boolean }> {
  return apiRequest<{ success: boolean; enabled: boolean }>(
    '/mev/toggle',
    {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    },
    accessToken
  );
}

// ==================== MEV GUARD API ====================

export interface MevGuardStatus {
  connected: boolean;
  tier: 'basic' | 'pro' | 'enterprise';
  health: {
    healthy: boolean;
    version: string;
    capabilities: {
      sandwichProtection: boolean;
      frontrunningProtection: boolean;
      flashbotsIntegration: boolean;
      privateRelay: boolean;
      mevBotDetection: boolean;
      realTimeMonitoring: boolean;
    };
    stats: {
      totalProtected: number;
      sandwichAttacksBlocked: number;
      frontrunningPrevented: number;
      savedValueUsd: number;
    };
  };
  mempool: {
    active: boolean;
    stats: MempoolStats | null;
  };
}

export interface MempoolStats {
  pendingTxCount: number;
  highValueTxCount: number;
  potentialSandwichTargets: number;
  avgGasPrice: string;
  highPriorityTxCount: number;
  mevBotActivity: number;
  lastBlockNumber: number;
  lastUpdated: string;
}

export interface MevAnalysisRequest {
  transactionHash?: string;
  contractAddress?: string;
  functionSignature?: string;
  chainId: number;
}

export interface MevAnalysisResponse {
  analysisId: string;
  mevExposure: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    potentialLoss: string;
    vulnerabilityTypes: string[];
  };
  attackVectors: Record<string, {
    risk: string;
    confidence: number;
    description: string;
    potentialLoss: string;
    prevention: string;
  }>;
  recommendations: string[];
  protectionOptions: Record<string, { cost: string; effectiveness: string }>;
}

export interface SandwichAttack {
  id: string;
  targetTxHash: string;
  frontrunTxHash: string;
  backrunTxHash: string;
  attackerAddress: string;
  victimAddress: string;
  estimatedProfit: string;
  victimLoss: string;
  detectedAt: string;
  status: 'detected' | 'blocked' | 'confirmed';
}

export interface MempoolRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: string[];
  recommendations: string[];
  activeBots: number;
  recentAttacks: number;
}

export interface MempoolStatsResponse {
  active: boolean;
  stats: MempoolStats | null;
  recentAttacks: SandwichAttack[];
  assessment: MempoolRiskAssessment | null;
  unified?: {
    networks: Record<string, NetworkMempoolStats>;
    totalPending: number;
    totalThreats24h: number;
    avgGasPrice: Record<string, string>;
    systemHealth: {
      mempoolCore: boolean;
      mempoolHub: boolean;
      unifiedEngine: boolean;
    };
  };
}

export interface ProtectedTransaction {
  id: string;
  txHash: string;
  protectionType: 'flashbots' | 'private_relay' | 'standard';
  status: 'pending' | 'protected' | 'confirmed' | 'failed';
  savedAmount: string;
  attacksBlocked: number;
  timestamp: string;
  network: string;
}

export async function getMevGuardStatus(accessToken: string): Promise<MevGuardStatus> {
  return apiRequest<MevGuardStatus>(
    '/mev-guard/status',
    { method: 'GET' },
    accessToken
  );
}

export async function analyzeMevExposure(
  params: MevAnalysisRequest,
  accessToken: string
): Promise<MevAnalysisResponse> {
  return apiRequest<MevAnalysisResponse>(
    '/mev-guard/analyze',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function getMempoolStats(accessToken: string): Promise<MempoolStatsResponse> {
  return apiRequest<MempoolStatsResponse>(
    '/mev-guard/mempool/stats',
    { method: 'GET' },
    accessToken
  );
}

/**
 * Get pending transactions from mempool
 */
export async function getMempoolTransactions(params: {
  network?: string;
  limit?: number;
  offset?: number;
  suspiciousOnly?: boolean;
}, accessToken: string): Promise<MempoolTransaction[]> {
  const queryParams = new URLSearchParams();
  if (params.network) queryParams.append('network', params.network);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());
  if (params.suspiciousOnly) queryParams.append('suspiciousOnly', 'true');

  const data = await apiRequest<{ transactions: MempoolTransaction[] } | MempoolTransaction[]>(
    `/mev-guard/mempool/transactions?${queryParams.toString()}`,
    { method: 'GET' },
    accessToken
  );
  
  return Array.isArray(data) ? data : (data.transactions || []);
}

/**
 * Get detected threats from mempool
 */
export async function getMempoolThreats(params: {
  limit?: number;
  severity?: string;
  network?: string;
}, accessToken: string): Promise<MempoolThreat[]> {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.severity) queryParams.append('severity', params.severity);
  if (params.network) queryParams.append('network', params.network);

  const data = await apiRequest<{ threats: MempoolThreat[] } | MempoolThreat[]>(
    `/mev-guard/mempool/threats?${queryParams.toString()}`,
    { method: 'GET' },
    accessToken
  );
  
  return Array.isArray(data) ? data : (data.threats || []);
}

/**
 * Get network-specific mempool stats
 */
export async function getNetworkMempoolStats(network: string, accessToken: string): Promise<NetworkMempoolStats> {
  return apiRequest<NetworkMempoolStats>(
    `/mev-guard/mempool/networks/${network}/stats`,
    { method: 'GET' },
    accessToken
  );
}

/**
 * Analyze a transaction in the mempool
 */
export async function analyzeMempoolTransaction(txHash: string, network: string, accessToken: string): Promise<any> {
  return apiRequest(
    '/mev-guard/mempool/analyze',
    {
      method: 'POST',
      body: JSON.stringify({ txHash, network }),
    },
    accessToken
  );
}

export async function getMevGuardKpi(accessToken: string): Promise<{
  totalMevSavedEth: number;
  totalGasSavedGwei: number;
  protectionSuccessRate: number;
  detectionAccuracy: number;
  avgProtectionTimeMs: number;
  kpiScore: number;
  targetAchievement: number;
  mevSavedByType: Record<string, number>;
  networkPerformance: Record<string, number>;
}> {
  return apiRequest<any>(
    '/mev-guard/kpi',
    { method: 'GET' },
    accessToken
  );
}

export async function getRecentProtectedTransactions(
  limit: number = 10,
  accessToken: string
): Promise<ProtectedTransaction[]> {
  return apiRequest<ProtectedTransaction[]>(
    `/mev-guard/protected-transactions?limit=${limit}`,
    { method: 'GET' },
    accessToken
  );
}

// ==================== TRANSACTION HISTORY API ====================

export interface TransactionFilters {
  network?: string;
  status?: 'pending' | 'confirmed' | 'failed';
  type?: 'send' | 'receive' | 'swap' | 'bridge' | 'contract';
  fromDate?: string;
  toDate?: string;
  minValue?: string;
  maxValue?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionRecord {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  network: string;
  status: 'pending' | 'confirmed' | 'failed';
  type: string;
  timestamp: string;
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  fee?: string;
  note?: string;
  tags?: string[];
  tokenTransfers?: Array<{
    token: string;
    from: string;
    to: string;
    value: string;
  }>;
}

export interface TransactionDetails extends TransactionRecord {
  input?: string;
  logs?: any[];
  internalTransactions?: any[];
  simulation?: any;
  riskAnalysis?: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

export interface TransactionStats {
  totalTransactions: number;
  totalVolume: string;
  totalFees: string;
  averageFee: string;
  byNetwork: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  last30Days: {
    transactions: number;
    volume: string;
  };
}

export interface ExportTransactionsParams {
  format: 'csv' | 'json' | 'pdf';
  filters?: TransactionFilters;
  includeInternal?: boolean;
}

export async function getTransactions(
  filters: TransactionFilters,
  accessToken: string
): Promise<{ transactions: TransactionRecord[]; total: number; hasMore: boolean }> {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });
  return apiRequest<{ transactions: TransactionRecord[]; total: number; hasMore: boolean }>(
    `/transactions/?${queryParams.toString()}`,
    { method: 'GET' },
    accessToken
  );
}

export async function getTransactionDetails(
  txId: string,
  accessToken: string
): Promise<TransactionDetails> {
  return apiRequest<TransactionDetails>(
    `/transactions/${txId}`,
    { method: 'GET' },
    accessToken
  );
}

export async function getTransactionStats(accessToken: string): Promise<TransactionStats> {
  return apiRequest<TransactionStats>(
    '/transactions/stats/summary',
    { method: 'GET' },
    accessToken
  );
}

export async function addTransactionNote(
  txId: string,
  note: string,
  accessToken: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/transactions/${txId}/note`,
    {
      method: 'POST',
      body: JSON.stringify({ note }),
    },
    accessToken
  );
}

export async function addTransactionTag(
  txId: string,
  tag: string,
  accessToken: string
): Promise<{ success: boolean; tags: string[] }> {
  return apiRequest<{ success: boolean; tags: string[] }>(
    `/transactions/${txId}/tag`,
    {
      method: 'POST',
      body: JSON.stringify({ tag }),
    },
    accessToken
  );
}

export async function exportTransactions(
  params: ExportTransactionsParams,
  accessToken: string
): Promise<{ downloadUrl: string; expiresAt: string }> {
  return apiRequest<{ downloadUrl: string; expiresAt: string }>(
    '/transactions/export',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

// ==================== SETTINGS API ====================

export interface UserSettings {
  notifications: NotificationSettings;
  display: DisplaySettings;
  security: SecuritySettings;
  legal: LegalSettings;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  transactionAlerts: boolean;
  priceAlerts: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
}

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: string;
  timezone: string;
  compactMode: boolean;
  showTestnets: boolean;
  hideSmallBalances: boolean;
  smallBalanceThreshold: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number;
  requirePasswordForTransactions: boolean;
  whitelistEnabled: boolean;
  antiPhishingCode?: string;
}

export interface LegalSettings {
  termsAccepted: boolean;
  termsAcceptedAt?: string;
  privacyAccepted: boolean;
  privacyAcceptedAt?: string;
  ageVerified: boolean;
  jurisdiction?: string;
}

export interface AppVersion {
  version: string;
  buildNumber: string;
  releaseDate: string;
  changelog?: string;
  updateAvailable: boolean;
  latestVersion?: string;
}

export async function getSettings(accessToken: string): Promise<UserSettings> {
  return apiRequest<UserSettings>(
    '/settings/',
    { method: 'GET' },
    accessToken
  );
}

export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>,
  accessToken: string
): Promise<{ success: boolean; settings: NotificationSettings }> {
  return apiRequest<{ success: boolean; settings: NotificationSettings }>(
    '/settings/notifications',
    {
      method: 'PUT',
      body: JSON.stringify(settings),
    },
    accessToken
  );
}

export async function updateDisplaySettings(
  settings: Partial<DisplaySettings>,
  accessToken: string
): Promise<{ success: boolean; settings: DisplaySettings }> {
  return apiRequest<{ success: boolean; settings: DisplaySettings }>(
    '/settings/display',
    {
      method: 'PUT',
      body: JSON.stringify(settings),
    },
    accessToken
  );
}

export async function updateSecuritySettings(
  settings: Partial<SecuritySettings>,
  accessToken: string
): Promise<{ success: boolean; settings: SecuritySettings }> {
  return apiRequest<{ success: boolean; settings: SecuritySettings }>(
    '/settings/security',
    {
      method: 'PUT',
      body: JSON.stringify(settings),
    },
    accessToken
  );
}

export async function acceptLegalTerms(
  params: { termsVersion: string; privacyVersion: string },
  accessToken: string
): Promise<{ success: boolean; acceptedAt: string }> {
  return apiRequest<{ success: boolean; acceptedAt: string }>(
    '/settings/legal/accept',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function verifyAge(
  params: { dateOfBirth: string; attestation?: string },
  accessToken: string
): Promise<{ success: boolean; verified: boolean }> {
  return apiRequest<{ success: boolean; verified: boolean }>(
    '/settings/legal/verify-age',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function setJurisdiction(
  params: { country: string; region?: string },
  accessToken: string
): Promise<{ success: boolean; jurisdiction: string; restrictions?: string[] }> {
  return apiRequest<{ success: boolean; jurisdiction: string; restrictions?: string[] }>(
    '/settings/legal/set-jurisdiction',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function exportUserData(accessToken: string): Promise<{ downloadUrl: string; expiresAt: string }> {
  return apiRequest<{ downloadUrl: string; expiresAt: string }>(
    '/settings/export-data',
    { method: 'GET' },
    accessToken
  );
}

export async function scheduleAccountDeletion(accessToken: string): Promise<{ success: boolean; scheduledAt: string; deletionDate: string }> {
  return apiRequest<{ success: boolean; scheduledAt: string; deletionDate: string }>(
    '/settings/account/delete',
    { method: 'POST' },
    accessToken
  );
}

export async function cancelAccountDeletion(accessToken: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    '/settings/account/delete/cancel',
    { method: 'POST' },
    accessToken
  );
}

export async function getAppVersion(accessToken?: string): Promise<AppVersion> {
  return apiRequest<AppVersion>(
    '/settings/app-version',
    { method: 'GET' },
    accessToken
  );
}

// ==================== NOTIFICATIONS API ====================

export interface Notification {
  id: string;
  type: 'transaction' | 'security' | 'price' | 'system' | 'marketing';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
  actionUrl?: string;
}

export interface BadgeCount {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export async function getNotifications(accessToken: string): Promise<{ notifications: Notification[]; total: number }> {
  return apiRequest<{ notifications: Notification[]; total: number }>(
    '/notifications/',
    { method: 'GET' },
    accessToken
  );
}

export async function getBadgeCount(accessToken: string): Promise<BadgeCount> {
  return apiRequest<BadgeCount>(
    '/notifications/badge-count',
    { method: 'GET' },
    accessToken
  );
}

export async function markNotificationRead(
  notificationId: string,
  accessToken: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/notifications/${notificationId}/read`,
    { method: 'POST' },
    accessToken
  );
}

export async function markAllNotificationsRead(accessToken: string): Promise<{ success: boolean; markedCount: number }> {
  return apiRequest<{ success: boolean; markedCount: number }>(
    '/notifications/read-all',
    { method: 'POST' },
    accessToken
  );
}

export async function deleteNotification(
  notificationId: string,
  accessToken: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/notifications/${notificationId}`,
    { method: 'DELETE' },
    accessToken
  );
}

// ==================== BIOMETRIC API ====================

export interface BiometricSetupParams {
  type: 'fingerprint' | 'faceId' | 'touchId';
  deviceId: string;
  publicKey?: string;
}

export interface BiometricVerifyParams {
  type: 'fingerprint' | 'faceId' | 'touchId';
  signature: string;
  challenge: string;
}

export interface BiometricConsentParams {
  consent: boolean;
  dataProcessingAgreed: boolean;
}

export interface BiometricStatus {
  enabled: boolean;
  type?: 'fingerprint' | 'faceId' | 'touchId';
  setupAt?: string;
  lastUsed?: string;
  deviceId?: string;
  consentGiven: boolean;
}

export interface BiometricTransactionAuthParams {
  transactionId: string;
  signature: string;
  challenge: string;
}

export async function setupBiometric(
  params: BiometricSetupParams,
  accessToken: string
): Promise<{ success: boolean; challenge: string }> {
  return apiRequest<{ success: boolean; challenge: string }>(
    '/biometric/setup',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function verifyBiometric(
  params: BiometricVerifyParams,
  accessToken: string
): Promise<{ success: boolean; token?: string }> {
  return apiRequest<{ success: boolean; token?: string }>(
    '/biometric/verify',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function setBiometricConsent(
  params: BiometricConsentParams,
  accessToken: string
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    '/biometric/consent',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function getBiometricStatus(accessToken: string): Promise<BiometricStatus> {
  return apiRequest<BiometricStatus>(
    '/biometric/status',
    { method: 'GET' },
    accessToken
  );
}

export async function authorizeBiometricTransaction(
  params: BiometricTransactionAuthParams,
  accessToken: string
): Promise<{ success: boolean; authorized: boolean }> {
  return apiRequest<{ success: boolean; authorized: boolean }>(
    '/biometric/transaction/authorize',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function disableBiometric(accessToken: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    '/biometric/disable',
    { method: 'DELETE' },
    accessToken
  );
}

// ==================== SUPPORT API ====================

export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  lastUpdated: string;
}

export interface CreateTicketParams {
  subject: string;
  category: 'technical' | 'account' | 'transaction' | 'security' | 'billing' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  attachments?: string[];
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    sender: 'user' | 'support';
    message: string;
    createdAt: string;
    attachments?: string[];
  }>;
}

export interface SystemStatus {
  overall: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  services: Array<{
    name: string;
    status: 'operational' | 'degraded' | 'down';
    latency?: number;
  }>;
  incidents: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    resolvedAt?: string;
  }>;
  lastUpdated: string;
}

export async function getHelpArticles(accessToken?: string): Promise<{ articles: HelpArticle[]; categories: string[] }> {
  return apiRequest<{ articles: HelpArticle[]; categories: string[] }>(
    '/support/help',
    { method: 'GET' },
    accessToken
  );
}

export async function createSupportTicket(
  params: CreateTicketParams,
  accessToken: string
): Promise<{ ticket: SupportTicket; success: boolean }> {
  return apiRequest<{ ticket: SupportTicket; success: boolean }>(
    '/support/tickets',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function getSupportTickets(accessToken: string): Promise<{ tickets: SupportTicket[] }> {
  return apiRequest<{ tickets: SupportTicket[] }>(
    '/support/tickets',
    { method: 'GET' },
    accessToken
  );
}

export async function getSupportTicketDetails(
  ticketId: string,
  accessToken: string
): Promise<SupportTicket> {
  return apiRequest<SupportTicket>(
    `/support/tickets/${ticketId}`,
    { method: 'GET' },
    accessToken
  );
}

export async function getSystemStatus(accessToken?: string): Promise<SystemStatus> {
  return apiRequest<SystemStatus>(
    '/support/status',
    { method: 'GET' },
    accessToken
  );
}

// ==================== LEGAL API ====================

export interface LegalDocument {
  title: string;
  version: string;
  effectiveDate: string;
  content: string;
  lastUpdated: string;
}

export interface LegalVersions {
  termsOfService: string;
  privacyPolicy: string;
  cookiePolicy: string;
  biometricConsent: string;
}

export async function getTermsOfService(accessToken?: string): Promise<LegalDocument> {
  return apiRequest<LegalDocument>(
    '/legal/terms-of-service',
    { method: 'GET' },
    accessToken
  );
}

export async function getPrivacyPolicy(accessToken?: string): Promise<LegalDocument> {
  return apiRequest<LegalDocument>(
    '/legal/privacy-policy',
    { method: 'GET' },
    accessToken
  );
}

export async function getCookiePolicy(accessToken?: string): Promise<LegalDocument> {
  return apiRequest<LegalDocument>(
    '/legal/cookie-policy',
    { method: 'GET' },
    accessToken
  );
}

export async function getBiometricConsentDocument(accessToken?: string): Promise<LegalDocument> {
  return apiRequest<LegalDocument>(
    '/legal/biometric-consent',
    { method: 'GET' },
    accessToken
  );
}

export async function getLegalVersions(accessToken?: string): Promise<LegalVersions> {
  return apiRequest<LegalVersions>(
    '/legal/versions',
    { method: 'GET' },
    accessToken
  );
}

// ==================== FIAT ON-RAMP API ====================

export interface FiatProvider {
  id: string;
  name: string;
  logo: string;
  supportedCurrencies: string[];
  supportedCryptos: string[];
  minAmount: number;
  maxAmount: number;
  fees: {
    percentage: number;
    fixed: number;
  };
  paymentMethods: string[];
  kycRequired: boolean;
}

export interface FiatQuoteParams {
  provider?: string;
  fiatCurrency: string;
  cryptoCurrency: string;
  fiatAmount?: number;
  cryptoAmount?: number;
  paymentMethod?: string;
}

export interface FiatQuote {
  provider: string;
  fiatCurrency: string;
  cryptoCurrency: string;
  fiatAmount: number;
  cryptoAmount: number;
  exchangeRate: number;
  fees: {
    provider: number;
    network: number;
    total: number;
  };
  paymentMethod: string;
  estimatedTime: string;
  expiresAt: string;
  redirectUrl?: string;
}

export async function getFiatProviders(accessToken?: string): Promise<{ providers: FiatProvider[] }> {
  return apiRequest<{ providers: FiatProvider[] }>(
    '/fiat/providers',
    { method: 'GET' },
    accessToken
  );
}

export async function getFiatQuote(
  params: FiatQuoteParams,
  accessToken: string
): Promise<{ quotes: FiatQuote[] }> {
  return apiRequest<{ quotes: FiatQuote[] }>(
    '/fiat/quote',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

// ==================== DEX AGGREGATOR API ====================

export interface SwapAggregatorParams {
  fromToken: string;
  toToken: string;
  amount: string;
  fromAddress: string;
  chainId: number;
  slippage?: number;
  aggregators?: string[];
}

export interface AggregatorQuote {
  aggregator: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  gasEstimate: string;
  fees: {
    protocol: string;
    gas: string;
    total: string;
  };
  route: Array<{
    dex: string;
    fromToken: string;
    toToken: string;
    portion: number;
  }>;
  transaction?: {
    to: string;
    data: string;
    value: string;
    gasLimit: string;
  };
}

export async function getSwapAggregatorQuotes(
  params: SwapAggregatorParams,
  accessToken: string
): Promise<{ quotes: AggregatorQuote[]; bestQuote: AggregatorQuote }> {
  return apiRequest<{ quotes: AggregatorQuote[]; bestQuote: AggregatorQuote }>(
    '/swaps/aggregators',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

// ==================== CROSS-CHAIN SWAPS API ====================

export interface CrossChainRouteParams {
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
  fromAddress: string;
  toAddress?: string;
  slippage?: number;
  bridges?: string[];
}

export interface CrossChainRoute {
  bridge: string;
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  estimatedTime: string;
  fees: {
    bridge: string;
    gas: string;
    total: string;
  };
  steps: Array<{
    type: 'swap' | 'bridge' | 'approve';
    protocol: string;
    fromToken: string;
    toToken: string;
    fromChain: number;
    toChain: number;
  }>;
  transaction?: {
    to: string;
    data: string;
    value: string;
    chainId: number;
  };
  securityScore?: number;
}

export async function getCrossChainRoutes(
  params: CrossChainRouteParams,
  accessToken: string
): Promise<{ routes: CrossChainRoute[]; bestRoute: CrossChainRoute }> {
  return apiRequest<{ routes: CrossChainRoute[]; bestRoute: CrossChainRoute }>(
    '/cross-chain/routes',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

// ==================== NFT GALLERY API ====================

export interface NftGalleryParams {
  walletAddress: string;
  chainId?: number;
  collections?: string[];
  limit?: number;
  offset?: number;
}

export interface NftItem {
  tokenId: string;
  tokenAddress: string;
  name: string;
  description?: string;
  image: string;
  animationUrl?: string;
  collection: {
    name: string;
    address: string;
    verified: boolean;
  };
  traits: Array<{
    traitType: string;
    value: string;
    rarity?: number;
  }>;
  rarity?: {
    rank: number;
    score: number;
  };
  chainId: number;
  owner: string;
  lastSalePrice?: string;
  floorPrice?: string;
}

export async function getNftGallery(
  params: NftGalleryParams,
  accessToken: string
): Promise<{ nfts: NftItem[]; total: number; hasMore: boolean }> {
  return apiRequest<{ nfts: NftItem[]; total: number; hasMore: boolean }>(
    '/nft/gallery',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

// ==================== MARKET DATA API ====================

export interface MarketPricesParams {
  tokens: Array<{
    address: string;
    chainId: number;
  }>;
  currency?: string;
}

export interface TokenPrice {
  address: string;
  chainId: number;
  price: number;
  change24h: number;
  change7d?: number;
  volume24h?: number;
  marketCap?: number;
  lastUpdated: string;
}

export interface PendleMarket {
  id: string;
  name: string;
  underlyingAsset: string;
  maturityDate: string;
  ptPrice: number;
  ytPrice: number;
  impliedApy: number;
  tvl: string;
  volume24h: string;
}

export interface PendlePositionsParams {
  walletAddress: string;
  chainId?: number;
}

export interface PendlePosition {
  marketId: string;
  marketName: string;
  ptBalance: string;
  ytBalance: string;
  lpBalance: string;
  ptValue: string;
  ytValue: string;
  totalValue: string;
  pendingRewards: string;
}

export interface PendleSdkParams {
  method: string;
  params: any;
}

export async function getMarketPrices(
  params: MarketPricesParams,
  accessToken: string
): Promise<{ prices: TokenPrice[] }> {
  return apiRequest<{ prices: TokenPrice[] }>(
    '/market/prices',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export interface TrendingToken {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  large?: string;
  marketCapRank: number;
  priceChange24h?: number;
  price?: number;
}

export async function getTrendingTokens(): Promise<{ trending: TrendingToken[] }> {
  return apiRequest<{ trending: TrendingToken[] }>(
    '/market/trending',
    { method: 'GET' }
  );
}

export async function getPendleMarkets(accessToken: string): Promise<{ markets: PendleMarket[] }> {
  return apiRequest<{ markets: PendleMarket[] }>(
    '/market/pendle/markets',
    { method: 'GET' },
    accessToken
  );
}

export async function getPendlePositions(
  params: PendlePositionsParams,
  accessToken: string
): Promise<{ positions: PendlePosition[] }> {
  return apiRequest<{ positions: PendlePosition[] }>(
    '/market/pendle/positions',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function proxyPendleSdk(
  params: PendleSdkParams,
  accessToken: string
): Promise<any> {
  return apiRequest<any>(
    '/market/pendle/hosted-sdk',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

// ==================== WHALE TRACKER API ====================

export interface WhaleAlert {
  id: string;
  whaleAddress: string;
  whaleName?: string;
  tokenAddress: string;
  tokenSymbol: string;
  action: 'buy' | 'sell' | 'transfer';
  amount: string;
  valueUsd: string;
  txHash: string;
  timestamp: number;
  significance: 'minor' | 'notable' | 'major' | 'massive';
}

export interface WhaleMirrorConfig {
  whaleAddress: string;
  mirrorPercentage: number;
  maxPositionSize: string;
  minProfitTarget: number;
  stopLoss: number;
  copyBuys: boolean;
  copySells: boolean;
  delaySeconds: number;
}

export interface MirroredPosition {
  id: string;
  whaleAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  entryPrice: string;
  currentPrice: string;
  pnlPercentage: number;
  positionSize: string;
  currentValue: string;
  holdingDuration: number;
  lastActivity: number;
}

export interface KnownWhale {
  address: string;
  name?: string;
  label?: string;
  winRate: number;
  totalPnL: string;
  totalTrades: number;
  avgTradeSize: string;
  followers?: number;
  lastActive: number;
}

export async function getRecentWhaleAlerts(
  limit: number = 20,
  accessToken: string
): Promise<WhaleAlert[]> {
  const data = await apiRequest<WhaleAlert[] | { alerts: WhaleAlert[] }>(
    `/degenx/whale-alerts/recent?limit=${limit}`,
    { method: 'GET' },
    accessToken
  );
  return Array.isArray(data) ? data : (data.alerts || []);
}

export async function configureWhaleMirror(
  config: WhaleMirrorConfig,
  accessToken: string
): Promise<{ mirrorId: string; status: string; config?: WhaleMirrorConfig; error?: string }> {
  return apiRequest<{ mirrorId: string; status: string; config?: WhaleMirrorConfig; error?: string }>(
    '/degenx/whale-mirror/configure',
    {
      method: 'POST',
      body: JSON.stringify(config),
    },
    accessToken
  );
}

export async function getMirroredPositions(
  walletAddress: string,
  accessToken: string
): Promise<MirroredPosition[]> {
  const data = await apiRequest<MirroredPosition[] | { positions: MirroredPosition[] }>(
    `/degenx/whale-mirror/positions?walletAddress=${walletAddress}`,
    { method: 'GET' },
    accessToken
  );
  return Array.isArray(data) ? data : (data.positions || []);
}

export async function getKnownWhales(
  accessToken: string
): Promise<KnownWhale[]> {
  const data = await apiRequest<KnownWhale[] | { whales: KnownWhale[] }>(
    '/degenx/whale-mirror/known-whales',
    { method: 'GET' },
    accessToken
  );
  return Array.isArray(data) ? data : (data.whales || []);
}

export async function subscribeToWhaleAlerts(
  params: {
    walletAddress: string;
    whaleAddresses: string[];
    minValueUsd?: number;
  },
  accessToken: string
): Promise<{ subscriptionId: string; status: string }> {
  return apiRequest<{ subscriptionId: string; status: string }>(
    '/degenx/whale-alerts/subscribe',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    accessToken
  );
}

export async function getActiveWhaleMirrors(
  walletAddress: string,
  accessToken: string
): Promise<WhaleMirrorConfig[]> {
  const data = await apiRequest<WhaleMirrorConfig[] | { mirrors: WhaleMirrorConfig[] }>(
    `/degenx/whale-mirror/active?walletAddress=${walletAddress}`,
    { method: 'GET' },
    accessToken
  );
  return Array.isArray(data) ? data : (data.mirrors || []);
}

export async function getMirrorTradeHistory(
  walletAddress: string,
  accessToken: string
): Promise<any[]> {
  const data = await apiRequest<any[] | { trades: any[] }>(
    `/degenx/whale-mirror/history?walletAddress=${walletAddress}`,
    { method: 'GET' },
    accessToken
  );
  return Array.isArray(data) ? data : (data.trades || []);
}

// ==================== SMART SIGNALS API ====================

export interface StopLossConfig {
  tokenAddress: string;
  positionSize: string;
  stopLossPercentage: number;
  mlProtectionEnabled: boolean;
  autoExitEnabled: boolean;
  minConfidenceToAct: number;
}

export interface DistributionSignal {
  id: string;
  tokenAddress: string;
  tokenSymbol?: string;
  tokenName?: string;
  pattern: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priceVelocity: number;
  volumeSpike: number;
  indicators: string[];
  recommendation: 'hold' | 'reduce' | 'exit';
  detectedAt: number;
}

export interface SmartSignalsSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  minConfidenceThreshold: number;
  autoExitEnabled: boolean;
}

export async function configureSmartStopLoss(
  config: StopLossConfig,
  accessToken: string
): Promise<{ configId: string; status: string }> {
  return apiRequest<{ configId: string; status: string }>(
    '/degenx/stop-loss/configure',
    {
      method: 'POST',
      body: JSON.stringify(config),
    },
    accessToken
  );
}

export async function getDistributionSignals(
  tokenAddress?: string,
  accessToken?: string
): Promise<DistributionSignal[]> {
  const endpoint = tokenAddress 
    ? `/degenx/stop-loss/signals?tokenAddress=${tokenAddress}`
    : '/degenx/stop-loss/signals';
  
  const data = await apiRequest<DistributionSignal[] | { signals: DistributionSignal[] }>(
    endpoint,
    { method: 'GET' },
    accessToken || ''
  );
  return Array.isArray(data) ? data : (data.signals || []);
}

export async function getActiveStopLossConfigs(
  walletAddress: string,
  accessToken: string
): Promise<StopLossConfig[]> {
  const data = await apiRequest<StopLossConfig[] | { configs: StopLossConfig[] }>(
    `/degenx/stop-loss/active?walletAddress=${walletAddress}`,
    { method: 'GET' },
    accessToken
  );
  return Array.isArray(data) ? data : (data.configs || []);
}

export async function analyzeTokenDistribution(
  tokenAddress: string,
  accessToken: string
): Promise<{
  riskScore: number;
  patterns: string[];
  signals: DistributionSignal[];
  recommendation: string;
}> {
  return apiRequest<{
    riskScore: number;
    patterns: string[];
    signals: DistributionSignal[];
    recommendation: string;
  }>(
    '/degenx/stop-loss/analyze',
    {
      method: 'POST',
      body: JSON.stringify({ tokenAddress }),
    },
    accessToken
  );
}

// ==================== MEME HUNTER API ====================

export interface MemeTokenAnalysis {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  viralityScore: number;
  socialMentions: {
    twitter: number;
    telegram: number;
    reddit: number;
    discord: number;
  };
  priceAction: {
    change24h: number;
    change7d: number;
    ath: string;
    currentPrice: string;
  };
  liquidity: {
    totalUsd: number;
    locked: boolean;
    lockDuration?: number;
  };
  holders: {
    total: number;
    whalePercentage: number;
    distribution: 'concentrated' | 'distributed';
  };
  riskScore: number;
  recommendation: 'avoid' | 'wait' | 'consider' | 'buy';
  detectedAt: number;
  chainId?: number;
  contractVerified?: boolean;
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    website?: string;
  };
}

export async function getTrendingMemeTokens(
  params: {
    chainId?: number;
    sortBy?: 'virality' | 'volume' | 'priceChange';
    riskLevel?: 'all' | 'low' | 'medium' | 'high';
    limit?: number;
  } = {},
  accessToken: string
): Promise<MemeTokenAnalysis[]> {
  const queryParams = new URLSearchParams();
  if (params.chainId) queryParams.append('chainId', params.chainId.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.riskLevel) queryParams.append('riskLevel', params.riskLevel);
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const endpoint = `/degenx/meme-hunter/trending${queryParams.toString() ? `?${queryParams}` : ''}`;
  
  const data = await apiRequest<MemeTokenAnalysis[] | { tokens: MemeTokenAnalysis[] }>(
    endpoint,
    { method: 'GET' },
    accessToken
  );
  return Array.isArray(data) ? data : (data.tokens || []);
}

export async function analyzeMemeToken(
  tokenAddress: string,
  accessToken: string
): Promise<MemeTokenAnalysis> {
  return apiRequest<MemeTokenAnalysis>(
    '/degenx/meme-hunter/analyze',
    {
      method: 'POST',
      body: JSON.stringify({ tokenAddress }),
    },
    accessToken
  );
}

// Export a default apiClient object for convenience
export const apiClient = {
  // Web3 methods
  getWalletBalance,
  getTransactionHistory,
  getTokenBalances,
  getNFTs,
  getPortfolio,

  // AI methods
  aiChat,
  analyzeTransaction,
  getDeFiRecommendations,
  explainConcept,

  // Trading methods
  getSwapQuote,
  buildSwapTransaction,
  getSupportedTokens,
  getLiquiditySources,
  getApprovalTransaction,
  checkTokenAllowance,

  // Contract methods
  createVault,
  getUserVaults,
  getVaultInfo,
  getContractAddresses,

  // Payment methods
  createCheckoutSession,

  // User methods
  getUserProfile,
  updateUserProfile,

  // Security methods
  analyzeMEVRisk,
  sendProtectedTransaction,
  checkHoneypot,
  getTokenSafetyScore,

  // Transaction Simulation methods
  simulateTransaction,
  simulateTokenTransfer,
  getGasEstimate,
  getSimulationHistory,
  executeSimulatedTransaction,

  // Bridge methods
  getBridgeChains,
  getBridgeQuote,
  buildBridgeTransaction,

  // Wallet Guard methods
  simulateTransactionWalletGuard,
  getWalletRiskScore,
  checkTransactionSafety,
  relayTransactionPrivate,
  startWalletMonitoring,
  getWalletGuardThreats,

  // Guardian / Inheritance methods
  inviteGuardian,
  getGuardians,
  performCheckIn,
  updateTimelockConfig,
  addBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  getInheritanceConfig,

  // Account Management methods
  getAccountInfo,
  getUserWallets,
  createWallet,
  renameWallet,
  archiveWallet,
  getDevices,
  registerDevice,
  trustDevice,
  getSessions,
  revokeSession,
  revokeAllSessions,

  // MEV Protection methods
  routeMevProtected,
  getMevStatus,
  getMevStats,
  toggleMevProtection,

  // MEV Guard methods
  getMevGuardStatus,
  analyzeMevExposure,
  getMempoolStats,
  getMempoolTransactions,
  getMempoolThreats,
  getNetworkMempoolStats,
  analyzeMempoolTransaction,
  getMevGuardKpi,
  getRecentProtectedTransactions,

  // Transaction History methods
  getTransactions,
  getTransactionDetails,
  getTransactionStats,
  addTransactionNote,
  addTransactionTag,
  exportTransactions,

  // Settings methods
  getSettings,
  updateNotificationSettings,
  updateDisplaySettings,
  updateSecuritySettings,
  acceptLegalTerms,
  verifyAge,
  setJurisdiction,
  exportUserData,
  scheduleAccountDeletion,
  cancelAccountDeletion,
  getAppVersion,

  // Notifications methods
  getNotifications,
  getBadgeCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,

  // Biometric methods
  setupBiometric,
  verifyBiometric,
  setBiometricConsent,
  getBiometricStatus,
  authorizeBiometricTransaction,
  disableBiometric,

  // Support methods
  getHelpArticles,
  createSupportTicket,
  getSupportTickets,
  getSupportTicketDetails,
  getSystemStatus,

  // Legal methods
  getTermsOfService,
  getPrivacyPolicy,
  getCookiePolicy,
  getBiometricConsentDocument,
  getLegalVersions,

  // Fiat On-Ramp methods
  getFiatProviders,
  getFiatQuote,

  // DEX Aggregator methods
  getSwapAggregatorQuotes,

  // Cross-Chain Swaps methods
  getCrossChainRoutes,

  // NFT Gallery methods
  getNftGallery,

  // Market Data methods
  getMarketPrices,
  getPendleMarkets,
  getPendlePositions,
  proxyPendleSdk,

  // Whale Tracker methods
  getRecentWhaleAlerts,
  configureWhaleMirror,
  getMirroredPositions,
  getKnownWhales,
  subscribeToWhaleAlerts,
  getActiveWhaleMirrors,
  getMirrorTradeHistory,

  // Smart Signals methods
  configureSmartStopLoss,
  getDistributionSignals,
  getActiveStopLossConfigs,
  analyzeTokenDistribution,

  // Meme Hunter methods
  getTrendingMemeTokens,
  analyzeMemeToken,
};

