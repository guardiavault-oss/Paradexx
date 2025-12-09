// ============================================================================
// APEX SNIPER - Type Definitions
// Enterprise-grade Ethereum Sniper Bot
// ============================================================================

import { BigNumberish, TransactionResponse, TransactionReceipt } from 'ethers';

// ============================================================================
// CORE ENUMS
// ============================================================================

export enum SnipeType {
  LIQUIDITY_LAUNCH = 'LIQUIDITY_LAUNCH',
  TOKEN_LAUNCH = 'TOKEN_LAUNCH',
  LIMIT_ORDER = 'LIMIT_ORDER',
  NFT_MINT = 'NFT_MINT',
  COPY_TRADE = 'COPY_TRADE',
  WHALE_FOLLOW = 'WHALE_FOLLOW'
}

export enum ExecutionMethod {
  FLASHBOTS = 'FLASHBOTS',
  PRIVATE_RPC = 'PRIVATE_RPC',
  DIRECT = 'DIRECT',
  MEV_BLOCKER = 'MEV_BLOCKER'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  SIMULATING = 'SIMULATING',
  EXECUTING = 'EXECUTING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum PositionStatus {
  OPEN = 'OPEN',
  PARTIAL_CLOSE = 'PARTIAL_CLOSE',
  CLOSED = 'CLOSED',
  LIQUIDATED = 'LIQUIDATED'
}

export enum RiskLevel {
  SAFE = 'SAFE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  HONEYPOT = 'HONEYPOT'
}

export enum DEX {
  UNISWAP_V2 = 'UNISWAP_V2',
  UNISWAP_V3 = 'UNISWAP_V3',
  SUSHISWAP = 'SUSHISWAP',
  PANCAKESWAP = 'PANCAKESWAP',
  CUSTOM = 'CUSTOM'
}

export enum ChainId {
  ETHEREUM = 1,
  GOERLI = 5,
  SEPOLIA = 11155111,
  BSC = 56,
  POLYGON = 137,
  ARBITRUM = 42161,
  BASE = 8453
}

// ============================================================================
// TOKEN & CONTRACT TYPES
// ============================================================================

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  owner?: string;
  deployer?: string;
  deployedAt?: number;
  verified?: boolean;
  proxy?: boolean;
}

export interface TokenSafetyAnalysis {
  token: string;
  riskLevel: RiskLevel;
  score: number; // 0-100, higher is safer
  flags: SafetyFlag[];
  honeypotTest: HoneypotTestResult;
  contractAnalysis: ContractAnalysis;
  liquidityAnalysis: LiquidityAnalysis;
  ownerAnalysis: OwnerAnalysis;
  timestamp: number;
}

export interface SafetyFlag {
  type: SafetyFlagType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  data?: Record<string, unknown>;
}

export enum SafetyFlagType {
  HONEYPOT = 'HONEYPOT',
  HIGH_TAX = 'HIGH_TAX',
  MODIFIABLE_TAX = 'MODIFIABLE_TAX',
  BLACKLIST = 'BLACKLIST',
  WHITELIST = 'WHITELIST',
  PAUSE_FUNCTION = 'PAUSE_FUNCTION',
  MINT_FUNCTION = 'MINT_FUNCTION',
  PROXY_CONTRACT = 'PROXY_CONTRACT',
  HIDDEN_OWNER = 'HIDDEN_OWNER',
  LOW_LIQUIDITY = 'LOW_LIQUIDITY',
  LOCKED_LIQUIDITY = 'LOCKED_LIQUIDITY',
  UNLOCKED_LIQUIDITY = 'UNLOCKED_LIQUIDITY',
  HIGH_HOLDER_CONCENTRATION = 'HIGH_HOLDER_CONCENTRATION',
  SUSPICIOUS_FUNCTIONS = 'SUSPICIOUS_FUNCTIONS',
  UNVERIFIED_CONTRACT = 'UNVERIFIED_CONTRACT',
  RECENT_DEPLOYMENT = 'RECENT_DEPLOYMENT',
  SIMILAR_TO_SCAM = 'SIMILAR_TO_SCAM'
}

export interface HoneypotTestResult {
  isHoneypot: boolean;
  buyTax: number;
  sellTax: number;
  transferTax: number;
  buyGas: number;
  sellGas: number;
  maxBuy?: bigint;
  maxSell?: bigint;
  maxWallet?: bigint;
  error?: string;
}

export interface ContractAnalysis {
  verified: boolean;
  isProxy: boolean;
  hasBlacklist: boolean;
  hasWhitelist: boolean;
  hasPauseFunction: boolean;
  hasMintFunction: boolean;
  hasModifiableTax: boolean;
  hasSelfDestruct: boolean;
  hasHiddenOwner: boolean;
  suspiciousFunctions: string[];
  similarContracts: string[];
}

export interface LiquidityAnalysis {
  totalLiquidityUSD: number;
  mainPairAddress: string;
  mainPairDex: DEX;
  isLocked: boolean;
  lockDuration?: number;
  lockAddress?: string;
  lpHolders: LPHolder[];
}

export interface LPHolder {
  address: string;
  balance: bigint;
  percentage: number;
  isContract: boolean;
  isLockContract: boolean;
}

export interface OwnerAnalysis {
  ownerAddress?: string;
  isRenounced: boolean;
  ownerBalance: bigint;
  ownerPercentage: number;
  ownerTransactions: number;
  previousProjects: TokenProject[];
}

export interface TokenProject {
  address: string;
  name: string;
  status: 'ACTIVE' | 'RUGGED' | 'ABANDONED';
  launchDate: number;
}

// ============================================================================
// TRADING TYPES
// ============================================================================

export interface SnipeConfig {
  id: string;
  type: SnipeType;
  enabled: boolean;
  
  // Target configuration
  targetToken?: string;
  targetPair?: string;
  targetDex: DEX;
  
  // Execution parameters
  executionMethod: ExecutionMethod;
  walletIds: string[];
  amountInWei: bigint;
  amountType: 'FIXED' | 'PERCENTAGE';
  
  // Timing
  blockDelay: number;
  maxBlocks: number;
  gasMultiplier: number;
  maxGasPrice: bigint;
  priorityFee: bigint;
  
  // Safety
  minLiquidity: number;
  maxBuyTax: number;
  maxSellTax: number;
  safetyCheckEnabled: boolean;
  antiRugEnabled: boolean;
  
  // Position management
  autoSellEnabled: boolean;
  takeProfitPercentages: number[];
  stopLossPercentage: number;
  trailingStopEnabled: boolean;
  trailingStopPercentage: number;
  
  // Advanced
  slippagePercent: number;
  deadline: number;
  retries: number;
  
  createdAt: number;
  updatedAt: number;
}

export interface SnipeOrder {
  id: string;
  configId: string;
  type: SnipeType;
  status: OrderStatus;
  
  // Target
  tokenIn: string;
  tokenOut: string;
  pair: string;
  dex: DEX;
  
  // Amounts
  amountIn: bigint;
  amountOutMin: bigint;
  expectedAmountOut: bigint;
  actualAmountOut?: bigint;
  
  // Execution
  walletId: string;
  walletAddress: string;
  executionMethod: ExecutionMethod;
  
  // Transaction
  txHash?: string;
  blockNumber?: number;
  gasUsed?: bigint;
  gasPrice?: bigint;
  effectiveGasPrice?: bigint;
  
  // Timing
  detectedAt: number;
  submittedAt?: number;
  confirmedAt?: number;
  latencyMs?: number;
  
  // Status
  error?: string;
  retryCount: number;
  
  createdAt: number;
  updatedAt: number;
}

export interface Position {
  id: string;
  orderId: string;
  status: PositionStatus;
  
  // Token info
  token: string;
  tokenInfo: TokenInfo;
  
  // Entry
  entryPrice: number;
  entryAmountIn: bigint;
  entryAmountOut: bigint;
  entryTxHash: string;
  entryBlock: number;
  entryTimestamp: number;
  
  // Current state
  currentBalance: bigint;
  currentPrice: number;
  currentValueUSD: number;
  unrealizedPnL: number;
  unrealizedPnLPercentage: number;
  
  // Exit tracking
  exits: PositionExit[];
  realizedPnL: number;
  totalSold: bigint;
  
  // Management
  takeProfitTargets: TakeProfitTarget[];
  stopLoss?: StopLoss;
  trailingStop?: TrailingStop;
  
  // Metadata
  walletId: string;
  notes?: string;
  tags: string[];
  
  createdAt: number;
  updatedAt: number;
}

export interface PositionExit {
  id: string;
  type: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'MANUAL';
  amountSold: bigint;
  amountReceived: bigint;
  price: number;
  pnl: number;
  pnlPercentage: number;
  txHash: string;
  timestamp: number;
}

export interface TakeProfitTarget {
  id: string;
  percentage: number;
  sellPercentage: number;
  triggered: boolean;
  triggeredAt?: number;
  txHash?: string;
}

export interface StopLoss {
  percentage: number;
  triggered: boolean;
  triggeredAt?: number;
  txHash?: string;
}

export interface TrailingStop {
  percentage: number;
  highestPrice: number;
  triggerPrice: number;
  triggered: boolean;
  triggeredAt?: number;
  txHash?: string;
}

// ============================================================================
// MEMPOOL TYPES
// ============================================================================

export interface PendingTransaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasLimit: bigint;
  nonce: number;
  data: string;
  chainId: number;
  type: number;
  
  // Decoded
  decodedMethod?: DecodedMethod;
  
  // Analysis
  isSwap: boolean;
  isDeploy: boolean;
  isAddLiquidity: boolean;
  isRemoveLiquidity: boolean;
  isNFTMint: boolean;
  
  // Metadata
  receivedAt: number;
  source: 'PUBLIC' | 'PRIVATE' | 'FLASHBOTS';
}

export interface DecodedMethod {
  name: string;
  signature: string;
  args: Record<string, unknown>;
}

export interface LiquidityEvent {
  type: 'ADD' | 'REMOVE';
  pair: string;
  token0: string;
  token1: string;
  amount0: bigint;
  amount1: bigint;
  liquidityTokens: bigint;
  sender: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  dex: DEX;
}

export interface NewPairEvent {
  pair: string;
  token0: string;
  token1: string;
  factory: string;
  dex: DEX;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  deployer: string;
}

// ============================================================================
// WHALE TRACKING TYPES
// ============================================================================

export interface TrackedWallet {
  id: string;
  address: string;
  label: string;
  type: 'WHALE' | 'SMART_MONEY' | 'INFLUENCER' | 'INSIDER' | 'CUSTOM';
  enabled: boolean;
  
  // Copy trade settings
  copyTradeEnabled: boolean;
  copyTradePercentage: number;
  copyTradeDelay: number;
  copyTradeMinAmount: number;
  copyTradeMaxAmount: number;
  
  // Filters
  tokenWhitelist: string[];
  tokenBlacklist: string[];
  minTransactionValue: number;
  
  // Stats
  profitability: number;
  winRate: number;
  totalTrades: number;
  avgHoldTime: number;
  
  // Metadata
  notes?: string;
  tags: string[];
  
  createdAt: number;
  updatedAt: number;
}

export interface WhaleTransaction {
  id: string;
  walletId: string;
  walletAddress: string;
  type: 'BUY' | 'SELL' | 'TRANSFER';
  
  token: string;
  tokenInfo: TokenInfo;
  amount: bigint;
  valueUSD: number;
  price: number;
  
  txHash: string;
  blockNumber: number;
  timestamp: number;
  
  // Copy trade
  copyTraded: boolean;
  copyTradeOrderId?: string;
}

// ============================================================================
// FLASHBOTS TYPES
// ============================================================================

export interface FlashbotsBundle {
  id: string;
  transactions: FlashbotsBundleTransaction[];
  targetBlock: number;
  minTimestamp?: number;
  maxTimestamp?: number;
  
  // Status
  status: 'PENDING' | 'SUBMITTED' | 'INCLUDED' | 'FAILED';
  bundleHash?: string;
  simulationResult?: BundleSimulationResult;
  
  // Metadata
  createdAt: number;
  submittedAt?: number;
  includedAt?: number;
}

export interface FlashbotsBundleTransaction {
  signedTransaction: string;
  hash: string;
  from: string;
  to: string;
  value: bigint;
  gasLimit: bigint;
}

export interface BundleSimulationResult {
  success: boolean;
  bundleHash: string;
  coinbaseDiff: bigint;
  gasFees: bigint;
  totalGasUsed: bigint;
  stateBlockNumber: number;
  results: TransactionSimulationResult[];
  error?: string;
}

export interface TransactionSimulationResult {
  txHash: string;
  success: boolean;
  gasUsed: bigint;
  gasPrice: bigint;
  gasFees: bigint;
  fromAddress: string;
  toAddress: string;
  value: bigint;
  error?: string;
  revert?: string;
}

// ============================================================================
// WALLET TYPES
// ============================================================================

export interface Wallet {
  id: string;
  name: string;
  address: string;
  encryptedPrivateKey: string;
  
  // Balances
  ethBalance: bigint;
  tokenBalances: Map<string, bigint>;
  
  // Settings
  enabled: boolean;
  maxGasPrice: bigint;
  defaultSlippage: number;
  
  // Stats
  totalTrades: number;
  profitLoss: number;
  winRate: number;
  
  // Nonce management
  currentNonce: number;
  pendingNonces: number[];
  
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WebSocketMessage {
  type: WSMessageType;
  payload: unknown;
  timestamp: number;
}

export enum WSMessageType {
  // Subscriptions
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  
  // Mempool events
  PENDING_TX = 'PENDING_TX',
  NEW_PAIR = 'NEW_PAIR',
  LIQUIDITY_ADDED = 'LIQUIDITY_ADDED',
  LIQUIDITY_REMOVED = 'LIQUIDITY_REMOVED',
  
  // Order events
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_SUBMITTED = 'ORDER_SUBMITTED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_FAILED = 'ORDER_FAILED',
  
  // Position events
  POSITION_OPENED = 'POSITION_OPENED',
  POSITION_UPDATED = 'POSITION_UPDATED',
  POSITION_CLOSED = 'POSITION_CLOSED',
  
  // Alerts
  WHALE_ALERT = 'WHALE_ALERT',
  PRICE_ALERT = 'PRICE_ALERT',
  SAFETY_ALERT = 'SAFETY_ALERT',
  
  // Meme Hunter
  MEME_ALERT = 'MEME_ALERT',
  MEME_TOKEN_DISCOVERED = 'MEME_TOKEN_DISCOVERED',
  MEME_SCORE_UPDATED = 'MEME_SCORE_UPDATED',
  SOCIAL_MENTION = 'SOCIAL_MENTION',
  SMART_MONEY_BUY = 'SMART_MONEY_BUY',
  
  // System
  HEARTBEAT = 'HEARTBEAT',
  ERROR = 'ERROR'
}

// ============================================================================
// CONFIG TYPES
// ============================================================================

export interface AppConfig {
  // Network
  chainId: ChainId;
  rpcUrl: string;
  wsRpcUrl: string;
  privateRpcUrl?: string;
  flashbotsRpcUrl: string;
  
  // Keys
  flashbotsAuthKey: string;
  etherscanApiKey: string;
  alchemyKey: string;
  covalentKey: string;
  
  // Contracts
  contracts: ContractAddresses;
  
  // Defaults
  defaultGasMultiplier: number;
  defaultSlippage: number;
  defaultDeadline: number;
  
  // Limits
  maxConcurrentOrders: number;
  maxGasPrice: bigint;
  minProfitThreshold: number;
  
  // Features
  features: FeatureFlags;
}

export interface ContractAddresses {
  weth: string;
  uniswapV2Router: string;
  uniswapV2Factory: string;
  uniswapV3Router: string;
  uniswapV3Factory: string;
  sushiswapRouter: string;
  sushiswapFactory: string;
  multicall3: string;
}

export interface FeatureFlags {
  flashbotsEnabled: boolean;
  antiRugEnabled: boolean;
  copyTradingEnabled: boolean;
  whaleTrackingEnabled: boolean;
  autoSellEnabled: boolean;
  telegramEnabled: boolean;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface SniperEvent {
  id: string;
  type: SniperEventType;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

export enum SniperEventType {
  // System
  SYSTEM_START = 'SYSTEM_START',
  SYSTEM_STOP = 'SYSTEM_STOP',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  
  // Trading
  SNIPE_DETECTED = 'SNIPE_DETECTED',
  SNIPE_EXECUTING = 'SNIPE_EXECUTING',
  SNIPE_SUCCESS = 'SNIPE_SUCCESS',
  SNIPE_FAILED = 'SNIPE_FAILED',
  
  // Safety
  HONEYPOT_DETECTED = 'HONEYPOT_DETECTED',
  RUG_DETECTED = 'RUG_DETECTED',
  HIGH_TAX_DETECTED = 'HIGH_TAX_DETECTED',
  
  // Position
  TAKE_PROFIT_HIT = 'TAKE_PROFIT_HIT',
  STOP_LOSS_HIT = 'STOP_LOSS_HIT',
  TRAILING_STOP_HIT = 'TRAILING_STOP_HIT',
  
  // Whale
  WHALE_BUY = 'WHALE_BUY',
  WHALE_SELL = 'WHALE_SELL',
  COPY_TRADE_EXECUTED = 'COPY_TRADE_EXECUTED'
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

export interface SniperStats {
  // Overview
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  winRate: number;
  
  // PnL
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  bestTrade: number;
  worstTrade: number;
  avgPnLPerTrade: number;
  
  // Gas
  totalGasSpent: bigint;
  avgGasPerTrade: bigint;
  
  // Timing
  avgLatencyMs: number;
  fastestSnipeMs: number;
  
  // By type
  bySnipeType: Record<SnipeType, TypeStats>;
  
  // Time series
  dailyStats: DailyStats[];
}

export interface TypeStats {
  total: number;
  successful: number;
  failed: number;
  totalPnL: number;
}

export interface DailyStats {
  date: string;
  trades: number;
  pnl: number;
  gasSpent: bigint;
}

// ============================================================================
// MEME HUNTER TYPES
// ============================================================================

/**
 * Alert tier for meme token discoveries
 */
export enum MemeAlertTier {
  /** 95%+ confidence - smart money detected */
  INSTANT = 'INSTANT',
  /** 80%+ confidence - strong social + on-chain signals */
  FAST = 'FAST',
  /** 60%+ confidence - watch list for confirmation */
  RESEARCH = 'RESEARCH'
}

export interface SocialSignals {
  // Volume metrics
  mentionCount: number;
  mentionBaseline: number;
  /** Percentage increase in mentions */
  mentionSpike: number;
  /** Rate of acceleration in mentions */
  mentionVelocity: number;
  
  // Engagement metrics
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  engagementRate: number;
  
  // Influencer signals
  influencerFollowers: number;
  influencerTiers: {
    /** 1M+ followers */
    mega: number;
    /** 100K-1M followers */
    macro: number;
    /** 10K-100K followers */
    micro: number;
    /** 1K-10K followers */
    nano: number;
  };
  influencerSentiment: number; // -1 to 1
  
  // Temporal patterns
  firstMention: number;      // timestamp
  hoursSinceFirst: number;
  peakMentionTime: number;   // timestamp
  isTrending: boolean;
  
  // Content analysis
  hasContract: boolean;
  contractAddress?: string;
  hasChart: boolean;
  hasMemes: boolean;
  rocketEmojis: number;
  sentiment: number;         // NLP sentiment score (-1 to 1)
  urgencyScore: number;      // "don't miss", "last chance", etc.
  
  // Platform breakdown
  twitterMentions: number;
  redditMentions: number;
  telegramMentions: number;
  discordMentions: number;
}

export interface OnChainSignals {
  // Liquidity metrics
  totalLiquidity: bigint;
  liquidityUSD: number;
  liquidityGrowth24h: number;
  lpLocked: boolean;
  lpLockDuration: number;
  
  // Trading metrics
  volume24h: number;
  volumeGrowth: number;
  txCount24h: number;
  buyPressure: number;       // % of buys vs sells
  avgBuySize: number;
  avgSellSize: number;
  uniqueBuyers24h: number;
  uniqueSellers24h: number;
  
  // Holder metrics
  totalHolders: number;
  holderGrowth24h: number;
  top10Concentration: number; // % held by top 10
  whaleCount: number;        // Holders with >1% supply
  freshWallets: number;      // New wallets buying
  snipedAmount: number;      // Amount bought in first block
  
  // Contract info
  contractAge: number;       // hours since creation
  isVerified: boolean;
  hasHoneypot: boolean;
  hasMintFunction: boolean;
  hasBlacklist: boolean;
  maxTxAmount: bigint;
  maxWalletAmount: bigint;
  buyTax: number;
  sellTax: number;
  isOwnershipRenounced: boolean;
  
  // Smart money
  smartWalletsBuying: string[];
  avgSmartMoneyEntry: number;
  smartMoneyPnL: number;
  copytradeScore: number;
}

export interface MemeScore {
  score: number;             // 0-100 composite score
  confidence: number;        // ML confidence (0-1)
  tier: MemeAlertTier;
  
  // Component scores
  socialScore: number;
  onChainScore: number;
  safetyScore: number;
  
  // Top contributing signals
  topSignals: Array<{
    name: string;
    value: number;
    contribution: number;    // SHAP value or similar
  }>;
  
  // Prediction
  pumpProbability: number;   // Probability of 10x within 7 days
  rugProbability: number;    // Probability of rug pull
  
  timestamp: number;
}

export interface MemeHunterToken {
  address: string;
  name: string;
  symbol: string;
  pairAddress: string;
  dex: DEX;
  
  // Signals
  socialSignals: SocialSignals;
  onChainSignals: OnChainSignals;
  memeScore: MemeScore;
  
  // Discovery info
  discoveredAt: number;
  discoverySource: 'SOCIAL' | 'ONCHAIN' | 'WHALE' | 'DEPLOYER';
  
  // Charts
  dextoolsUrl: string;
  dexscreenerUrl: string;
  
  // Status
  isActive: boolean;
  lastUpdated: number;
}

export interface MemeHunterAlert {
  id: string;
  token: MemeHunterToken;
  tier: MemeAlertTier;
  score: number;
  confidence: number;
  
  // Alert details
  title: string;
  message: string;
  topSignals: string[];
  
  // Auto-action
  autoBuyTriggered: boolean;
  autoBuyOrderId?: string;
  
  // Timing
  createdAt: number;
  expiresAt: number;        // Alerts have TTL
}

export interface MemeHunterConfig {
  enabled: boolean;
  
  // Social monitoring
  socialEnabled: boolean;
  twitterEnabled: boolean;
  redditEnabled: boolean;
  telegramEnabled: boolean;
  discordEnabled: boolean;
  
  // On-chain monitoring
  onChainEnabled: boolean;
  minLiquidityUSD: number;
  maxContractAge: number;   // hours
  
  // Scoring thresholds
  minScoreForAlert: number;
  minConfidence: number;
  
  // Alert tiers
  instantAlertThreshold: number;  // 95 default
  fastAlertThreshold: number;     // 80 default
  researchAlertThreshold: number; // 60 default
  
  // Auto-buy settings
  autoBuyEnabled: boolean;
  autoBuyMinScore: number;
  autoBuyAmount: string;
  autoBuyWalletId?: string;
  
  // Filters
  tokenBlacklist: string[];
  deployerBlacklist: string[];
  minSocialMentions: number;
  maxSellTax: number;
  maxBuyTax: number;
  requireLPLock: boolean;
  requireVerified: boolean;
  
  // Rate limiting
  maxAlertsPerHour: number;
  cooldownBetweenAlerts: number;  // ms
}

export interface MemeHunterStats {
  totalTokensScanned: number;
  totalAlertsSent: number;
  alertsByTier: {
    instant: number;
    fast: number;
    research: number;
  };
  tokensAutoBought: number;
  profitableAlerts: number;
  unprofitableAlerts: number;
  avgPnLPerAlert: number;
  bestPerformingToken: {
    address: string;
    symbol: string;
    pnl: number;
  } | null;
  
  // Social stats
  socialMentionsTracked: number;
  influencersMonitored: number;
  
  // On-chain stats
  newPairsAnalyzed: number;
  smartWalletsTracked: number;
  
  lastUpdated: number;
}

export interface SocialMention {
  id: string;
  platform: 'twitter' | 'reddit' | 'telegram' | 'discord';
  author: string;
  authorFollowers: number;
  content: string;
  contractAddress?: string;
  sentiment: number;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  timestamp: number;
  url?: string;
}

export interface SmartWallet {
  address: string;
  label: string;
  winRate: number;
  avgROI: number;
  totalTrades: number;
  avgHoldTime: number;  // hours
  lastActive: number;
  tags: string[];
}

// ============================================================================
// DEGEN RECOVERY FUND TYPES
// ============================================================================

/**
 * Insurance claim status for rug pull recovery
 */
export enum ClaimStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID'
}

/**
 * Rug pull type classification
 */
export enum RugPullType {
  LIQUIDITY_PULL = 'LIQUIDITY_PULL',
  HONEYPOT = 'HONEYPOT',
  MINT_EXPLOIT = 'MINT_EXPLOIT',
  CONTRACT_UPGRADE = 'CONTRACT_UPGRADE',
  OWNER_DUMP = 'OWNER_DUMP',
  OTHER = 'OTHER'
}

export interface RecoveryFundConfig {
  enabled: boolean;
  
  // Pool settings
  minPoolBalance: string;  // ETH
  maxClaimPercentage: number;  // Max % of pool per claim
  maxClaimAmountEth: string;  // Max ETH per claim
  claimCooldownHours: number;
  
  // Contribution settings
  contributionPercentage: number;  // % of profits to contribute
  autoContributeEnabled: boolean;
  minContributionEth: string;
  
  // Verification settings
  requireProofOfLoss: boolean;
  minHoldTimeSeconds: number;  // Min time held before rug
  maxClaimWindowHours: number;  // Hours after rug to claim
  
  // Community governance
  requireCommunityVote: boolean;
  minVotesRequired: number;
  voteTimeoutHours: number;
}

export interface RecoveryFundPool {
  totalBalance: bigint;
  availableBalance: bigint;
  pendingClaims: bigint;
  totalContributed: bigint;
  totalPaid: bigint;
  contributorCount: number;
  claimCount: number;
  successfulClaims: number;
  lastUpdated: number;
}

export interface RecoveryContributor {
  id: string;
  address: string;
  totalContributed: bigint;
  contributionCount: number;
  firstContribution: number;
  lastContribution: number;
  claimsSubmitted: number;
  claimsPaid: number;
}

export interface RecoveryClaim {
  id: string;
  claimantAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  rugPullType: RugPullType;
  status: ClaimStatus;
  
  // Loss details
  amountLostWei: bigint;
  amountLostUSD: number;
  claimAmountWei: bigint;
  paidAmountWei: bigint;
  
  // Evidence
  entryTxHash: string;
  rugTxHash?: string;
  proofDocuments: string[];
  
  // Voting
  votesFor: number;
  votesAgainst: number;
  voters: string[];
  
  // Timing
  submittedAt: number;
  reviewedAt?: number;
  paidAt?: number;
  expiresAt: number;
  
  notes?: string;
}

export interface RecoveryFundStats {
  poolBalance: string;
  totalContributed: string;
  totalPaidOut: string;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  avgClaimAmount: string;
  avgPayoutTime: number;  // hours
  contributorCount: number;
  lastUpdated: number;
}

// ============================================================================
// SMART STOP-LOSS AI TYPES
// ============================================================================

/**
 * Distribution pattern types detected by ML
 */
export enum DistributionPattern {
  WHALE_DUMP = 'WHALE_DUMP',
  GRADUAL_DISTRIBUTION = 'GRADUAL_DISTRIBUTION',
  INSIDER_SELLING = 'INSIDER_SELLING',
  LP_REMOVAL = 'LP_REMOVAL',
  COORDINATED_SELL = 'COORDINATED_SELL',
  NORMAL_VOLATILITY = 'NORMAL_VOLATILITY'
}

/**
 * Risk signal severity
 */
export enum SignalSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface SmartStopLossConfig {
  enabled: boolean;
  
  // Detection settings
  patternDetectionEnabled: boolean;
  volumeAnalysisEnabled: boolean;
  holderAnalysisEnabled: boolean;
  socialSentimentEnabled: boolean;
  
  // Thresholds
  minConfidenceToAct: number;  // 0-1
  dumpDetectionThreshold: number;  // % price drop
  volumeSpikeThreshold: number;  // x normal volume
  holderDropThreshold: number;  // % holder decrease
  
  // Action settings
  autoExitEnabled: boolean;
  autoExitMinConfidence: number;
  partialExitEnabled: boolean;
  partialExitPercentages: number[];  // [50, 25, 25]
  
  // Alert settings
  alertOnPatternDetection: boolean;
  alertCooldownMinutes: number;
  
  // ML Model settings
  modelUpdateInterval: number;  // hours
  useHistoricalData: boolean;
  lookbackPeriodHours: number;
}

export interface DistributionSignal {
  id: string;
  tokenAddress: string;
  pattern: DistributionPattern;
  severity: SignalSeverity;
  confidence: number;  // 0-1
  
  // Detection details
  indicators: PatternIndicator[];
  predictedDropPercent: number;
  timeToImpact: number;  // seconds
  
  // Market context
  currentPrice: number;
  priceChange24h: number;
  volumeChange: number;
  holderChange: number;
  
  // Recommended action
  recommendedAction: 'HOLD' | 'PARTIAL_EXIT' | 'FULL_EXIT' | 'WATCH';
  recommendedExitPercent: number;
  
  // Timing
  detectedAt: number;
  expiresAt: number;
  actedUpon: boolean;
  actionTakenAt?: number;
}

export interface PatternIndicator {
  name: string;
  value: number;
  threshold: number;
  weight: number;
  triggered: boolean;
  description: string;
}

export interface SmartStopLossStats {
  totalSignalsDetected: number;
  signalsByPattern: Record<DistributionPattern, number>;
  signalsBySeverity: Record<SignalSeverity, number>;
  autoExitsExecuted: number;
  lossesAvoided: number;  // USD
  falsePositives: number;
  avgDetectionTime: number;  // ms before dump
  modelAccuracy: number;  // 0-1
  lastModelUpdate: number;
  activeMonitoring: number;  // tokens being watched
  lastUpdated: number;
}

export interface MLModelState {
  version: string;
  trainedAt: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  samplesUsed: number;
  features: string[];
  lastPrediction: number;
}

// ============================================================================
// WHALE MIRROR TRADING TYPES
// ============================================================================

/**
 * Mirror trading strategy
 */
export enum MirrorStrategy {
  INSTANT = 'INSTANT',     // Copy immediately
  DELAYED = 'DELAYED',     // Wait for confirmation
  SCALED = 'SCALED',       // Scale position based on confidence
  FILTERED = 'FILTERED'    // Only copy if passes filters
}

export interface WhaleMirrorConfig {
  enabled: boolean;
  
  // Wallet selection
  trackTop100: boolean;
  minWalletWinRate: number;  // %
  minWalletROI: number;  // %
  minWalletTrades: number;
  maxWalletsToTrack: number;
  
  // Trade filters
  minTradeValueEth: string;
  maxTradeValueEth: string;
  tokenWhitelist: string[];
  tokenBlacklist: string[];
  dexWhitelist: string[];
  
  // Copy settings
  strategy: MirrorStrategy;
  delayBlocks: number;  // For DELAYED strategy
  positionSizePercent: number;  // % of whale's position
  maxPositionEth: string;
  minPositionEth: string;
  
  // Risk settings
  maxConcurrentMirrors: number;
  maxDailyMirrorValue: string;  // ETH
  requireSafetyCheck: boolean;
  stopOnLoss: boolean;
  maxLossPercent: number;
  
  // Scaling settings (for SCALED strategy)
  scaleByConfidence: boolean;
  scaleByWalletROI: boolean;
  minScaleFactor: number;  // 0.1 = 10%
  maxScaleFactor: number;  // 1.0 = 100%
}

export interface TopWallet {
  rank: number;
  address: string;
  label?: string;
  
  // Performance metrics
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  winRate: number;
  avgROI: number;
  totalTrades: number;
  avgHoldTimeHours: number;
  
  // Recent activity
  last7dTrades: number;
  last7dPnL: number;
  last7dWinRate: number;
  lastTradeTime: number;
  
  // Categories
  specialties: string[];  // ['memecoins', 'defi', 'nft']
  riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'DEGEN';
  
  // Mirror stats
  mirrorCount: number;
  mirrorPnL: number;
  mirrorWinRate: number;
  
  // Status
  isActive: boolean;
  lastUpdated: number;
}

export interface MirrorTrade {
  id: string;
  
  // Source trade
  sourceWallet: string;
  sourceWalletRank: number;
  sourceTxHash: string;
  sourceAction: 'BUY' | 'SELL';
  sourceAmount: bigint;
  sourceValueEth: string;
  
  // Mirror trade
  mirrorWalletId: string;
  mirrorTxHash?: string;
  mirrorAmount: bigint;
  mirrorValueEth: string;
  scaleFactor: number;
  
  // Token info
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  
  // Execution
  strategy: MirrorStrategy;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  skipReason?: string;
  error?: string;
  
  // Performance
  entryPrice?: number;
  currentPrice?: number;
  exitPrice?: number;
  pnl?: number;
  pnlPercent?: number;
  
  // Timing
  sourceDetectedAt: number;
  mirrorExecutedAt?: number;
  delayMs?: number;
  
  // Associated position
  positionId?: string;
}

export interface WhaleMirrorStats {
  // Tracking stats
  walletsTracked: number;
  top100Coverage: number;  // % of top 100 being tracked
  avgWalletWinRate: number;
  avgWalletROI: number;
  
  // Trade stats
  totalMirrorTrades: number;
  successfulMirrors: number;
  failedMirrors: number;
  skippedMirrors: number;
  
  // Performance stats
  totalMirrorPnL: number;
  mirrorWinRate: number;
  avgMirrorROI: number;
  bestMirrorTrade: {
    tokenSymbol: string;
    pnl: number;
    sourceWallet: string;
  } | null;
  worstMirrorTrade: {
    tokenSymbol: string;
    pnl: number;
    sourceWallet: string;
  } | null;
  
  // Timing stats
  avgDelayMs: number;
  fastestMirrorMs: number;
  
  // Today stats
  todayMirrors: number;
  todayPnL: number;
  todayValueEth: string;
  
  lastUpdated: number;
}
