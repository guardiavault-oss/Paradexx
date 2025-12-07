import { logger } from '../services/logger.service';
// Trading API utilities for 1inch integration
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Helper to get auth headers
function getHeaders(accessToken?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
}

// Supported chain IDs
export const CHAINS = {
  ETHEREUM: 1,
  BSC: 56,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  AVALANCHE: 43114,
  BASE: 8453,
} as const;

export type ChainId = typeof CHAINS[keyof typeof CHAINS];

// Get list of supported tokens for a chain
export async function getTokenList(chainId: ChainId, accessToken: string) {
  try {
    const response = await fetch(`${API_BASE}/trading/tokens/${chainId}`, {
      headers: getHeaders(accessToken),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch tokens');
    }

    const data = await response.json();
    return data.tokens;
  } catch (error) {
    logger.error('Error fetching token list:', error);
    throw error;
  }
}

// Get swap quote (no transaction, just estimated output)
export async function getSwapQuote(params: {
  chainId: ChainId;
  srcToken: string;  // Source token address
  dstToken: string;  // Destination token address
  amount: string;    // Amount in token's smallest unit (wei)
  accessToken: string;
}) {
  try {
    const response = await fetch(`${API_BASE}/trading/quote`, {
      method: 'POST',
      headers: getHeaders(params.accessToken),
      body: JSON.stringify({
        chainId: params.chainId,
        src: params.srcToken,
        dst: params.dstToken,
        amount: params.amount,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get quote');
    }

    const data = await response.json();
    return data.quote;
  } catch (error) {
    logger.error('Error getting swap quote:', error);
    throw error;
  }
}

// Get swap transaction data (ready to be signed and sent)
export async function getSwapTransaction(params: {
  chainId: ChainId;
  srcToken: string;
  dstToken: string;
  amount: string;
  fromAddress: string;  // User's wallet address
  slippage?: number;    // Slippage tolerance in % (default: 1)
  accessToken: string;
}) {
  try {
    const response = await fetch(`${API_BASE}/trading/swap`, {
      method: 'POST',
      headers: getHeaders(params.accessToken),
      body: JSON.stringify({
        chainId: params.chainId,
        src: params.srcToken,
        dst: params.dstToken,
        amount: params.amount,
        from: params.fromAddress,
        slippage: params.slippage || 1,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get swap transaction');
    }

    const data = await response.json();
    return data.swap;
  } catch (error) {
    logger.error('Error getting swap transaction:', error);
    throw error;
  }
}

// Get token prices in USD
export async function getTokenPrices(
  chainId: ChainId,
  tokenAddresses: string[],
  accessToken: string
) {
  try {
    const response = await fetch(`${API_BASE}/trading/prices`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify({
        chainId,
        tokenAddresses,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get prices');
    }

    const data = await response.json();
    return data.prices;
  } catch (error) {
    logger.error('Error getting token prices:', error);
    throw error;
  }
}

// Get approve transaction for token spending
export async function getApproveTransaction(params: {
  chainId: ChainId;
  tokenAddress: string;
  amount?: string;  // Optional, defaults to infinite approval
  accessToken: string;
}) {
  try {
    const response = await fetch(`${API_BASE}/trading/approve/transaction`, {
      method: 'POST',
      headers: getHeaders(params.accessToken),
      body: JSON.stringify({
        chainId: params.chainId,
        tokenAddress: params.tokenAddress,
        amount: params.amount,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get approve transaction');
    }

    const data = await response.json();
    return data.transaction;
  } catch (error) {
    logger.error('Error getting approve transaction:', error);
    throw error;
  }
}

// Check token allowance
export async function checkTokenAllowance(params: {
  chainId: ChainId;
  tokenAddress: string;
  walletAddress: string;
  accessToken: string;
}) {
  try {
    const response = await fetch(`${API_BASE}/trading/approve/allowance`, {
      method: 'POST',
      headers: getHeaders(params.accessToken),
      body: JSON.stringify({
        chainId: params.chainId,
        tokenAddress: params.tokenAddress,
        walletAddress: params.walletAddress,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check allowance');
    }

    const data = await response.json();
    return data.allowance;
  } catch (error) {
    logger.error('Error checking token allowance:', error);
    throw error;
  }
}

// Get gas price for a chain
export async function getGasPrice(chainId: ChainId, accessToken: string) {
  try {
    const response = await fetch(`${API_BASE}/trading/gas/${chainId}`, {
      headers: getHeaders(accessToken),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get gas price');
    }

    const data = await response.json();
    return data.gasPrice;
  } catch (error) {
    logger.error('Error getting gas price:', error);
    throw error;
  }
}

// Get liquidity sources (DEXes) for a chain
export async function getLiquiditySources(chainId: ChainId, accessToken: string) {
  try {
    const response = await fetch(`${API_BASE}/trading/liquidity-sources/${chainId}`, {
      headers: getHeaders(accessToken),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get liquidity sources');
    }

    const data = await response.json();
    return data.sources;
  } catch (error) {
    logger.error('Error getting liquidity sources:', error);
    throw error;
  }
}

// Get spender address for approvals
export async function getSpenderAddress(chainId: ChainId, accessToken: string) {
  try {
    const response = await fetch(`${API_BASE}/trading/spender/${chainId}`, {
      headers: getHeaders(accessToken),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get spender address');
    }

    const data = await response.json();
    return data.spender;
  } catch (error) {
    logger.error('Error getting spender address:', error);
    throw error;
  }
}

// Get user's swap transaction history
export async function getSwapHistory(accessToken: string) {
  try {
    const response = await fetch(`${API_BASE}/trading/history`, {
      headers: getHeaders(accessToken),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get swap history');
    }

    const data = await response.json();
    return data.history;
  } catch (error) {
    logger.error('Error getting swap history:', error);
    throw error;
  }
}

// Update swap transaction status
export async function updateSwapStatus(params: {
  swapId: string;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  accessToken: string;
}) {
  try {
    const response = await fetch(`${API_BASE}/trading/update-status`, {
      method: 'POST',
      headers: getHeaders(params.accessToken),
      body: JSON.stringify({
        swapId: params.swapId,
        status: params.status,
        txHash: params.txHash,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update swap status');
    }

    const data = await response.json();
    return data.swap;
  } catch (error) {
    logger.error('Error updating swap status:', error);
    throw error;
  }
}

// Helper to convert human-readable amount to token's smallest unit (wei)
export function toTokenAmount(amount: string, decimals: number): string {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return whole + paddedFraction;
}

// Helper to convert token's smallest unit to human-readable amount
export function fromTokenAmount(amount: string, decimals: number): string {
  const paddedAmount = amount.padStart(decimals + 1, '0');
  const whole = paddedAmount.slice(0, -decimals) || '0';
  const fraction = paddedAmount.slice(-decimals);
  return `${whole}.${fraction}`.replace(/\.?0+$/, '');
}

// Format token amount for display
export function formatTokenAmount(amount: string, decimals: number, displayDecimals = 6): string {
  const humanAmount = fromTokenAmount(amount, decimals);
  const [whole, fraction = ''] = humanAmount.split('.');
  
  if (fraction.length <= displayDecimals) {
    return humanAmount;
  }
  
  return `${whole}.${fraction.slice(0, displayDecimals)}`;
}

// Common token addresses
export const COMMON_TOKENS = {
  // Ethereum
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  USDT_ETH: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  USDC_ETH: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  DAI_ETH: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  
  // BSC
  BNB: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  USDT_BSC: '0x55d398326f99059fF775485246999027B3197955',
  USDC_BSC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  
  // Polygon
  MATIC: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  USDT_POLYGON: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  USDC_POLYGON: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  
  // Arbitrum
  ETH_ARBITRUM: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  USDT_ARBITRUM: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  USDC_ARBITRUM: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  
  // Optimism
  ETH_OPTIMISM: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  USDT_OPTIMISM: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
  USDC_OPTIMISM: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
  
  // Base
  ETH_BASE: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  USDC_BASE: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const;
