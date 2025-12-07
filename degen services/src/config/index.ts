// ============================================================================
// APEX SNIPER - Configuration
// ============================================================================

import { ChainId, AppConfig, ContractAddresses, FeatureFlags } from '../types';
import 'dotenv/config';

// ============================================================================
// CONTRACT ADDRESSES BY CHAIN
// ============================================================================

const ETHEREUM_CONTRACTS: ContractAddresses = {
  weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  uniswapV2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  uniswapV2Factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  uniswapV3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  sushiswapRouter: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
  sushiswapFactory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11'
};

const SEPOLIA_CONTRACTS: ContractAddresses = {
  weth: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
  uniswapV2Router: '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008',
  uniswapV2Factory: '0x7E0987E5b3a30e3f2828572Bb659A548460a3003',
  uniswapV3Router: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
  uniswapV3Factory: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c',
  sushiswapRouter: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
  sushiswapFactory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11'
};

// ============================================================================
// KNOWN DEX ROUTERS FOR DETECTION
// ============================================================================

export const KNOWN_ROUTERS: Record<string, string> = {
  // Uniswap
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': 'Uniswap V2',
  '0xE592427A0AEce92De3Edee1F18E0157C05861564': 'Uniswap V3',
  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45': 'Uniswap Universal',
  '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD': 'Uniswap Universal Router 2',
  
  // Sushiswap
  '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F': 'SushiSwap',
  
  // 1inch
  '0x1111111254EEB25477B68fb85Ed929f73A960582': '1inch v5',
  '0x111111125421cA6dc452d289314280a0f8842A65': '1inch v6',
  
  // 0x
  '0xDef1C0ded9bec7F1a1670819833240f027b25EfF': '0x Exchange',
  
  // Banana Gun
  '0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49': 'Banana Gun',
  
  // Maestro
  '0x80a64c6D7f12C47B7c66c5B4E20E72bc0FCd5CF2': 'Maestro'
};

// ============================================================================
// KNOWN FACTORIES FOR PAIR DETECTION  
// ============================================================================

export const KNOWN_FACTORIES: Record<string, { name: string; dex: string }> = {
  '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f': { name: 'Uniswap V2', dex: 'UNISWAP_V2' },
  '0x1F98431c8aD98523631AE4a59f267346ea31F984': { name: 'Uniswap V3', dex: 'UNISWAP_V3' },
  '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac': { name: 'SushiSwap', dex: 'SUSHISWAP' }
};

// ============================================================================
// METHOD SIGNATURES FOR DECODING
// ============================================================================

export const METHOD_SIGNATURES = {
  // ERC20
  transfer: '0xa9059cbb',
  transferFrom: '0x23b872dd',
  approve: '0x095ea7b3',
  
  // Uniswap V2 Router
  swapExactETHForTokens: '0x7ff36ab5',
  swapExactTokensForETH: '0x18cbafe5',
  swapExactTokensForTokens: '0x38ed1739',
  swapETHForExactTokens: '0xfb3bdb41',
  swapTokensForExactETH: '0x4a25d94a',
  swapTokensForExactTokens: '0x8803dbee',
  swapExactETHForTokensSupportingFeeOnTransferTokens: '0xb6f9de95',
  swapExactTokensForETHSupportingFeeOnTransferTokens: '0x791ac947',
  swapExactTokensForTokensSupportingFeeOnTransferTokens: '0x5c11d795',
  addLiquidity: '0xe8e33700',
  addLiquidityETH: '0xf305d719',
  removeLiquidity: '0xbaa2abde',
  removeLiquidityETH: '0x02751cec',
  removeLiquidityWithPermit: '0x2195995c',
  removeLiquidityETHWithPermit: '0xded9382a',
  removeLiquidityETHSupportingFeeOnTransferTokens: '0xaf2979eb',
  
  // Uniswap V3
  exactInputSingle: '0x414bf389',
  exactInput: '0xc04b8d59',
  exactOutputSingle: '0xdb3e2198',
  exactOutput: '0xf28c0498',
  multicall: '0xac9650d8',
  
  // Universal Router
  execute: '0x3593564c',
  
  // Factory
  createPair: '0xc9c65396'
};

// ============================================================================
// FLASHBOTS CONFIGURATION
// ============================================================================

export const FLASHBOTS_CONFIG = {
  mainnet: {
    relayUrl: 'https://relay.flashbots.net',
    protectUrl: 'https://rpc.flashbots.net',
    builderUrls: [
      'https://relay.flashbots.net',
      'https://builder0x69.io',
      'https://rpc.beaverbuild.org',
      'https://rsync-builder.xyz',
      'https://rpc.titanbuilder.xyz'
    ]
  },
  sepolia: {
    relayUrl: 'https://relay-sepolia.flashbots.net',
    protectUrl: 'https://rpc-sepolia.flashbots.net'
  }
};

// ============================================================================
// SAFETY THRESHOLDS
// ============================================================================

export const SAFETY_THRESHOLDS = {
  maxBuyTax: 10, // percentage
  maxSellTax: 15, // percentage
  minLiquidityUSD: 5000,
  maxOwnerHoldings: 20, // percentage
  maxTopHolderConcentration: 50, // percentage
  minLockDuration: 30 * 24 * 60 * 60, // 30 days in seconds
  maxDeployAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms for warning
  honeypotGasMultiplier: 3, // if sell gas > buy gas * this, likely honeypot
};

// ============================================================================
// GAS SETTINGS
// ============================================================================

export const GAS_SETTINGS = {
  defaultGasLimit: 300000n,
  approveGasLimit: 60000n,
  swapGasLimit: 250000n,
  addLiquidityGasLimit: 200000n,
  
  // Priority fee settings (in gwei)
  lowPriorityFee: 1n,
  mediumPriorityFee: 2n,
  highPriorityFee: 5n,
  urgentPriorityFee: 10n,
  
  // Gas multipliers
  defaultMultiplier: 1.1,
  aggressiveMultiplier: 1.3,
  ultraMultiplier: 1.5
};

// ============================================================================
// TIMING SETTINGS
// ============================================================================

export const TIMING_SETTINGS = {
  mempoolCheckInterval: 100, // ms
  priceUpdateInterval: 5000, // ms
  positionCheckInterval: 10000, // ms
  balanceCheckInterval: 30000, // ms
  
  // Transaction timing
  txTimeout: 60000, // ms
  bundleTimeout: 30000, // ms
  simulationTimeout: 10000, // ms
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 1000 // ms
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  etherscan: {
    mainnet: 'https://api.etherscan.io/api',
    sepolia: 'https://api-sepolia.etherscan.io/api'
  },
  dexscreener: 'https://api.dexscreener.com/latest',
  coingecko: 'https://api.coingecko.com/api/v3',
  goplusLabs: 'https://api.gopluslabs.io/api/v1',
  honeypotIs: 'https://api.honeypot.is/v2',
  covalent: 'https://api.covalenthq.com/v1',
  alchemy: {
    mainnet: 'https://eth-mainnet.g.alchemy.com/v2',
    getNFTsForOwner: '/getNFTsForOwner',
    getTokenBalances: '/v2/{key}/getTokenBalances'
  }
};

// ============================================================================
// BUILD CONFIG
// ============================================================================

function buildConfig(): AppConfig {
  const chainId = (parseInt(process.env.CHAIN_ID || '1') as ChainId);
  
  const contracts = chainId === ChainId.ETHEREUM 
    ? ETHEREUM_CONTRACTS 
    : SEPOLIA_CONTRACTS;
  
  const flashbotsConfig = chainId === ChainId.ETHEREUM
    ? FLASHBOTS_CONFIG.mainnet
    : FLASHBOTS_CONFIG.sepolia;
  
  const features: FeatureFlags = {
    flashbotsEnabled: process.env.FLASHBOTS_ENABLED === 'true',
    antiRugEnabled: process.env.ANTI_RUG_ENABLED !== 'false',
    copyTradingEnabled: process.env.COPY_TRADING_ENABLED === 'true',
    whaleTrackingEnabled: process.env.WHALE_TRACKING_ENABLED === 'true',
    autoSellEnabled: process.env.AUTO_SELL_ENABLED !== 'false',
    telegramEnabled: process.env.TELEGRAM_ENABLED === 'true'
  };
  
  return {
    chainId,
    rpcUrl: process.env.RPC_URL || 'https://eth.llamarpc.com',
    wsRpcUrl: process.env.WS_RPC_URL || 'wss://eth.llamarpc.com',
    privateRpcUrl: process.env.PRIVATE_RPC_URL,
    flashbotsRpcUrl: flashbotsConfig.relayUrl,
    
    flashbotsAuthKey: process.env.FLASHBOTS_AUTH_KEY || '',
    etherscanApiKey: process.env.ETHERSCAN_API_KEY || '',
    alchemyKey: process.env.ALCHEMY_KEY || '',
    covalentKey: process.env.COVALENT_KEY || '',
    
    contracts,
    
    defaultGasMultiplier: parseFloat(process.env.DEFAULT_GAS_MULTIPLIER || '1.1'),
    defaultSlippage: parseFloat(process.env.DEFAULT_SLIPPAGE || '5'),
    defaultDeadline: parseInt(process.env.DEFAULT_DEADLINE || '300'),
    
    maxConcurrentOrders: parseInt(process.env.MAX_CONCURRENT_ORDERS || '5'),
    maxGasPrice: BigInt(process.env.MAX_GAS_PRICE || '100000000000'), // 100 gwei
    minProfitThreshold: parseFloat(process.env.MIN_PROFIT_THRESHOLD || '0.01'),
    
    features
  };
}

export const config = buildConfig();

// ============================================================================
// EXPORT ALL
// ============================================================================

export {
  ETHEREUM_CONTRACTS,
  SEPOLIA_CONTRACTS
};
