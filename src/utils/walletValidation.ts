// Wallet validation utilities - CRITICAL SECURITY

import { isAddress, getAddress, parseEther, formatEther, Contract, MaxUint256 } from 'ethers';
import { logger } from '../services/logger.service';
import type { Provider, TransactionRequest } from 'ethers';

// Address validation with checksum
export function isValidEthereumAddress(address: string): boolean {
  try {
    return isAddress(address);
  } catch {
    return false;
  }
}

// Validate checksum (case-sensitive)
export function isChecksumValid(address: string): boolean {
  try {
    return getAddress(address) === address;
  } catch {
    return false;
  }
}

// Get checksummed address
export function getChecksumAddress(address: string): string | null {
  try {
    return getAddress(address);
  } catch {
    return null;
  }
}

// Check if address has transaction history (to warn about new addresses)
export async function hasTransactionHistory(
  address: string,
  provider: Provider
): Promise<boolean> {
  try {
    const txCount = await provider.getTransactionCount(address);
    return txCount > 0;
  } catch {
    return false; // Assume safe if can't check
  }
}

// Detect exchange addresses (common patterns)
export function isLikelyExchangeAddress(address: string): boolean {
  // Known exchange addresses or patterns
  const knownExchanges = [
    '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE', // Binance
    '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance 2
    '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', // Binance 3
    '0xD551234Ae421e3BCBA99A0Da6d736074f22192FF', // Binance 4
    // Add more known addresses
  ];

  return knownExchanges.includes(getAddress(address));
}

// Insufficient balance check
export interface BalanceCheckResult {
  hasEnough: boolean;
  deficit?: string;
  reason?: string;
}

export async function checkSufficientBalance(
  address: string,
  amount: string, // Amount to send
  gasEstimate: string, // Gas cost in ETH
  provider: Provider,
  tokenAddress?: string // If sending token, not ETH
): Promise<BalanceCheckResult> {
  try {
    const amountWei = parseEther(amount || '0');
    const gasWei = parseEther(gasEstimate || '0');

    if (tokenAddress) {
      // Check token balance + ETH for gas
      const tokenContract = new Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );

      const [tokenBalance, ethBalance] = await Promise.all([
        tokenContract.balanceOf(address),
        provider.getBalance(address)
      ]);

      // Check token balance (ethers v6 uses native bigint)
      if (tokenBalance < amountWei) {
        return {
          hasEnough: false,
          deficit: formatEther(amountWei - tokenBalance),
          reason: 'Insufficient token balance'
        };
      }

      // Check ETH for gas
      if (ethBalance < gasWei) {
        return {
          hasEnough: false,
          deficit: formatEther(gasWei - ethBalance),
          reason: 'Insufficient ETH for gas'
        };
      }

      return { hasEnough: true };
    } else {
      // Sending ETH - need amount + gas
      const totalNeeded = amountWei + gasWei;
      const balance = await provider.getBalance(address);

      if (balance < totalNeeded) {
        return {
          hasEnough: false,
          deficit: formatEther(totalNeeded - balance),
          reason: 'Insufficient balance (need amount + gas)'
        };
      }

      return { hasEnough: true };
    }
  } catch (err) {
    logger.error('Balance check failed:', err);
    return {
      hasEnough: false,
      reason: 'Unable to verify balance'
    };
  }
}

// Validate send amount
export interface AmountValidation {
  valid: boolean;
  error?: string;
  warning?: string;
}

export function validateSendAmount(
  amount: string,
  balance: string,
  decimals: number = 18
): AmountValidation {
  try {
    if (!amount || amount === '0') {
      return { valid: false, error: 'Amount must be greater than 0' };
    }

    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(balance);

    if (isNaN(amountNum)) {
      return { valid: false, error: 'Invalid amount' };
    }

    if (amountNum <= 0) {
      return { valid: false, error: 'Amount must be positive' };
    }

    if (amountNum > balanceNum) {
      return { valid: false, error: 'Amount exceeds balance' };
    }

    // Check decimal places
    const decimalPlaces = (amount.split('.')[1] || '').length;
    if (decimalPlaces > decimals) {
      return {
        valid: false,
        error: `Maximum ${decimals} decimal places allowed`
      };
    }

    // Warning if sending >90% of balance
    if (amountNum > balanceNum * 0.9) {
      return {
        valid: true,
        warning: 'You are sending over 90% of your balance'
      };
    }

    // Warning if very small amount (dust)
    if (amountNum < 0.0001) {
      return {
        valid: true,
        warning: 'This is a very small amount (dust)'
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid amount format' };
  }
}

// Validate token approval
export interface ApprovalValidation {
  isUnlimited: boolean;
  amount: string;
  warning?: string;
  risk: 'low' | 'medium' | 'high';
}

export function validateTokenApproval(
  approvalAmount: string,
  spenderAddress: string,
  tokenSymbol: string
): ApprovalValidation {
  const MAX_UINT256_STR = MaxUint256.toString();
  const isUnlimitedApproval = approvalAmount === MAX_UINT256_STR;

  // Check if spender is verified contract
  const knownContracts = [
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
    '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
    // Add more trusted contracts
  ];

  const isKnownContract = knownContracts.includes(spenderAddress);

  if (isUnlimitedApproval) {
    return {
      isUnlimited: true,
      amount: 'Unlimited',
      warning: ` UNLIMITED ${tokenSymbol} approval requested. The contract can spend all your tokens.`,
      risk: isKnownContract ? 'medium' : 'high'
    };
  }

  const amountNum = parseFloat(formatEther(approvalAmount));

  if (amountNum > 1000000) {
    return {
      isUnlimited: false,
      amount: approvalAmount,
      warning: `Large approval amount: ${amountNum.toLocaleString()} ${tokenSymbol}`,
      risk: isKnownContract ? 'low' : 'high'
    };
  }

  return {
    isUnlimited: false,
    amount: approvalAmount,
    risk: isKnownContract ? 'low' : 'medium'
  };
}

// ENS resolution
export async function resolveENS(
  nameOrAddress: string,
  provider: Provider
): Promise<string | null> {
  try {
    if (nameOrAddress.endsWith('.eth')) {
      // Resolve ENS to address
      const address = await provider.resolveName(nameOrAddress);
      return address;
    } else if (isAddress(nameOrAddress)) {
      // Reverse resolve address to ENS
      const name = await provider.lookupAddress(nameOrAddress);
      return name;
    }
    return null;
  } catch {
    return null;
  }
}

// Transaction simulation (basic)
export interface SimulationResult {
  willSucceed: boolean;
  gasEstimate?: string;
  error?: string;
  warning?: string;
}

export async function simulateTransaction(
  tx: TransactionRequest,
  provider: Provider
): Promise<SimulationResult> {
  try {
    // Estimate gas - if this fails, transaction will fail
    const gasEstimate = await provider.estimateGas(tx);

    // Try to call the transaction (doesn't send it)
    try {
      await provider.call(tx);

      return {
        willSucceed: true,
        gasEstimate: gasEstimate.toString()
      };
    } catch (callErr: any) {
      return {
        willSucceed: false,
        error: `Transaction will fail: ${callErr.reason || callErr.message}`,
        gasEstimate: gasEstimate.toString()
      };
    }
  } catch (err: any) {
    return {
      willSucceed: false,
      error: `Cannot estimate gas: ${err.reason || err.message}`
    };
  }
}

// Nonce collision detection
export async function checkNonceCollision(
  address: string,
  provider: Provider
): Promise<{ hasCollision: boolean; pendingNonce?: number }> {
  try {
    const [currentNonce, pendingNonce] = await Promise.all([
      provider.getTransactionCount(address, 'latest'),
      provider.getTransactionCount(address, 'pending')
    ]);

    if (pendingNonce > currentNonce) {
      return {
        hasCollision: true,
        pendingNonce: currentNonce
      };
    }

    return { hasCollision: false };
  } catch {
    return { hasCollision: false };
  }
}
