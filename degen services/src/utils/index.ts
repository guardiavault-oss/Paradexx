// ============================================================================
// APEX SNIPER - Utilities
// ============================================================================

import { ethers, Contract, Provider, Interface, TransactionReceipt } from 'ethers';
import { config, METHOD_SIGNATURES, KNOWN_ROUTERS } from '../config';
import { TokenInfo, DecodedMethod, DEX } from '../types';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// LOGGER
// ============================================================================

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// ============================================================================
// ID GENERATION
// ============================================================================

export const generateId = (): string => uuidv4();

export const generateShortId = (): string => uuidv4().split('-')[0];

// ============================================================================
// ADDRESS UTILITIES
// ============================================================================

export const isAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

export const checksumAddress = (address: string): string => {
  return ethers.getAddress(address);
};

export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

export const isContract = async (provider: Provider, address: string): Promise<boolean> => {
  const code = await provider.getCode(address);
  return code !== '0x';
};

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

export const formatEther = (wei: bigint): string => {
  return ethers.formatEther(wei);
};

export const parseEther = (ether: string): bigint => {
  return ethers.parseEther(ether);
};

export const formatUnits = (value: bigint, decimals: number): string => {
  return ethers.formatUnits(value, decimals);
};

export const parseUnits = (value: string, decimals: number): bigint => {
  return ethers.parseUnits(value, decimals);
};

export const formatNumber = (num: number, decimals = 2): string => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatUSD = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

export const formatPercent = (num: number): string => {
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
};

// ============================================================================
// TRANSACTION DECODING
// ============================================================================

// ABI fragments for common DEX functions
const ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
  'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
  'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
  'function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)'
];

const routerInterface = new Interface(ROUTER_ABI);

export const decodeTransactionData = (data: string): DecodedMethod | null => {
  if (!data || data === '0x') return null;
  
  const selector = data.slice(0, 10);
  
  try {
    // Try to decode with router interface
    const decoded = routerInterface.parseTransaction({ data });
    if (decoded) {
      const args: Record<string, unknown> = {};
      decoded.fragment.inputs.forEach((input, index) => {
        args[input.name] = decoded.args[index];
      });
      
      return {
        name: decoded.name,
        signature: decoded.signature,
        args
      };
    }
  } catch {
    // Not a known router function
  }
  
  // Return basic info based on selector
  for (const [name, sig] of Object.entries(METHOD_SIGNATURES)) {
    if (sig === selector) {
      return {
        name,
        signature: sig,
        args: {}
      };
    }
  }
  
  return null;
};

export const isSwapTransaction = (data: string): boolean => {
  if (!data || data === '0x') return false;
  const selector = data.slice(0, 10).toLowerCase();
  
  const swapSelectors = [
    METHOD_SIGNATURES.swapExactETHForTokens,
    METHOD_SIGNATURES.swapExactTokensForETH,
    METHOD_SIGNATURES.swapExactTokensForTokens,
    METHOD_SIGNATURES.swapETHForExactTokens,
    METHOD_SIGNATURES.swapTokensForExactETH,
    METHOD_SIGNATURES.swapTokensForExactTokens,
    METHOD_SIGNATURES.swapExactETHForTokensSupportingFeeOnTransferTokens,
    METHOD_SIGNATURES.swapExactTokensForETHSupportingFeeOnTransferTokens,
    METHOD_SIGNATURES.swapExactTokensForTokensSupportingFeeOnTransferTokens,
    METHOD_SIGNATURES.exactInputSingle,
    METHOD_SIGNATURES.exactInput,
    METHOD_SIGNATURES.exactOutputSingle,
    METHOD_SIGNATURES.exactOutput,
    METHOD_SIGNATURES.execute
  ];
  
  return swapSelectors.includes(selector);
};

export const isAddLiquidityTransaction = (data: string): boolean => {
  if (!data || data === '0x') return false;
  const selector = data.slice(0, 10).toLowerCase();
  
  return [
    METHOD_SIGNATURES.addLiquidity,
    METHOD_SIGNATURES.addLiquidityETH
  ].includes(selector);
};

export const isRemoveLiquidityTransaction = (data: string): boolean => {
  if (!data || data === '0x') return false;
  const selector = data.slice(0, 10).toLowerCase();
  
  return [
    METHOD_SIGNATURES.removeLiquidity,
    METHOD_SIGNATURES.removeLiquidityETH,
    METHOD_SIGNATURES.removeLiquidityWithPermit,
    METHOD_SIGNATURES.removeLiquidityETHWithPermit,
    METHOD_SIGNATURES.removeLiquidityETHSupportingFeeOnTransferTokens
  ].includes(selector);
};

export const isKnownRouter = (address: string): boolean => {
  return Object.keys(KNOWN_ROUTERS).map(a => a.toLowerCase()).includes(address.toLowerCase());
};

// ============================================================================
// TOKEN UTILITIES
// ============================================================================

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function owner() view returns (address)',
  'function getOwner() view returns (address)'
];

export const getTokenInfo = async (
  provider: Provider,
  tokenAddress: string
): Promise<TokenInfo | null> => {
  try {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name().catch(() => 'Unknown'),
      contract.symbol().catch(() => '???'),
      contract.decimals().catch(() => 18),
      contract.totalSupply().catch(() => 0n)
    ]);
    
    // Try to get owner
    let owner: string | undefined;
    try {
      owner = await contract.owner();
    } catch {
      try {
        owner = await contract.getOwner();
      } catch {
        // No owner function
      }
    }
    
    return {
      address: checksumAddress(tokenAddress),
      name,
      symbol,
      decimals,
      totalSupply,
      owner
    };
  } catch (error) {
    logger.error(`Failed to get token info for ${tokenAddress}:`, error);
    return null;
  }
};

export const getTokenBalance = async (
  provider: Provider,
  tokenAddress: string,
  walletAddress: string
): Promise<bigint> => {
  try {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    return await contract.balanceOf(walletAddress);
  } catch {
    return 0n;
  }
};

// ============================================================================
// PAIR UTILITIES
// ============================================================================

const PAIR_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function totalSupply() view returns (uint256)'
];

const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns (address pair)',
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint)'
];

export const getPairInfo = async (
  provider: Provider,
  pairAddress: string
): Promise<{ token0: string; token1: string; reserves: [bigint, bigint] } | null> => {
  try {
    const contract = new Contract(pairAddress, PAIR_ABI, provider);
    
    const [token0, token1, reserves] = await Promise.all([
      contract.token0(),
      contract.token1(),
      contract.getReserves()
    ]);
    
    return {
      token0: checksumAddress(token0),
      token1: checksumAddress(token1),
      reserves: [reserves[0], reserves[1]]
    };
  } catch {
    return null;
  }
};

export const getPairAddress = async (
  provider: Provider,
  factoryAddress: string,
  token0: string,
  token1: string
): Promise<string | null> => {
  try {
    const factory = new Contract(factoryAddress, FACTORY_ABI, provider);
    const pair = await factory.getPair(token0, token1);
    
    if (pair === ethers.ZeroAddress) return null;
    return checksumAddress(pair);
  } catch {
    return null;
  }
};

// ============================================================================
// PRICE UTILITIES
// ============================================================================

export const calculatePriceImpact = (
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number => {
  // Price impact = 1 - (reserveOut - amountOut) / reserveOut
  // Simplified: amountIn / reserveIn * 100
  const impact = Number(amountIn) / Number(reserveIn) * 100;
  return Math.min(impact, 100);
};

export const getAmountOut = (
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  fee: number = 0.003 // 0.3% default Uniswap fee
): bigint => {
  const amountInWithFee = amountIn * BigInt(Math.floor((1 - fee) * 10000)) / 10000n;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn + amountInWithFee;
  return numerator / denominator;
};

export const getAmountIn = (
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  fee: number = 0.003
): bigint => {
  const numerator = reserveIn * amountOut * 10000n;
  const denominator = (reserveOut - amountOut) * BigInt(Math.floor((1 - fee) * 10000));
  return (numerator / denominator) + 1n;
};

// ============================================================================
// GAS UTILITIES
// ============================================================================

export const estimateGasPrice = async (
  provider: Provider,
  multiplier: number = 1.1
): Promise<{ gasPrice: bigint; maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> => {
  const feeData = await provider.getFeeData();
  
  const gasPrice = feeData.gasPrice 
    ? BigInt(Math.floor(Number(feeData.gasPrice) * multiplier))
    : parseEther('0.00000002'); // 20 gwei fallback
    
  const maxFeePerGas = feeData.maxFeePerGas
    ? BigInt(Math.floor(Number(feeData.maxFeePerGas) * multiplier))
    : gasPrice;
    
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
    ? BigInt(Math.floor(Number(feeData.maxPriorityFeePerGas) * multiplier))
    : parseEther('0.000000002'); // 2 gwei fallback
    
  return { gasPrice, maxFeePerGas, maxPriorityFeePerGas };
};

// ============================================================================
// TIME UTILITIES
// ============================================================================

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const getDeadline = (seconds: number = 300): number => {
  return Math.floor(Date.now() / 1000) + seconds;
};

export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toISOString();
};

export const getTimeDiff = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  
  if (diff < 1000) return `${diff}ms`;
  if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
};

// ============================================================================
// RETRY UTILITIES
// ============================================================================

export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(backoff, i));
      }
    }
  }
  
  throw lastError;
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const validateSnipeConfig = (config: Record<string, unknown>): string[] => {
  const errors: string[] = [];
  
  if (!config.targetDex) errors.push('Target DEX is required');
  if (!config.walletIds || (config.walletIds as string[]).length === 0) {
    errors.push('At least one wallet is required');
  }
  if (!config.amountInWei || BigInt(config.amountInWei as string) <= 0n) {
    errors.push('Amount must be greater than 0');
  }
  if ((config.slippagePercent as number) < 0 || (config.slippagePercent as number) > 100) {
    errors.push('Slippage must be between 0 and 100');
  }
  
  return errors;
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  logger,
  generateId,
  generateShortId,
  isAddress,
  checksumAddress,
  shortenAddress,
  isContract,
  formatEther,
  parseEther,
  formatUnits,
  parseUnits,
  formatNumber,
  formatUSD,
  formatPercent,
  decodeTransactionData,
  isSwapTransaction,
  isAddLiquidityTransaction,
  isRemoveLiquidityTransaction,
  isKnownRouter,
  getTokenInfo,
  getTokenBalance,
  getPairInfo,
  getPairAddress,
  calculatePriceImpact,
  getAmountOut,
  getAmountIn,
  estimateGasPrice,
  sleep,
  getDeadline,
  formatTimestamp,
  getTimeDiff,
  retry,
  validateSnipeConfig
};
