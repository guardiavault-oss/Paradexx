/**
 * Swap Fee Service - Handles platform swap fees routed to treasury
 *
 * TIERED FEE STRUCTURE (Updated Dec 2025):
 * - Free users: 0.5% (50 bps)
 * - Pro subscribers: 0.35% (35 bps)
 * - Elite subscribers: 0.2% (20 bps)
 * - Lifetime Pass holders: 0.15% (15 bps)
 */

import { ethers } from 'ethers';
import { logger } from './logger.service';
import profitRoutingService from './profit-routing.service';
import { prisma } from '../config/database';

// ============================================================
// FEE CONFIGURATION - TIERED STRUCTURE
// ============================================================

// Subscription tier types
export type SubscriptionTier = 'free' | 'pro' | 'elite' | 'lifetime';

// Tiered swap fees (basis points)
const SWAP_FEE_BPS_BY_TIER: Record<SubscriptionTier, number> = {
  free: 50, // 0.5% - reduced from 0.79%
  pro: 35, // 0.35% - Pro discount
  elite: 20, // 0.2% - Elite discount (competitive with Uniswap)
  lifetime: 15, // 0.15% - Best rate for lifetime holders
};

// Default fee for backward compatibility
const DEFAULT_SWAP_FEE_BPS = 50; // 0.5%
const DEFAULT_SWAP_FEE_PERCENTAGE = 0.005; // 0.5%

// Treasury wallet address - all fees go here
const TREASURY_WALLET =
  process.env.TREASURY_WALLET_ADDRESS ||
  process.env.PROFIT_WALLET_ADDRESS ||
  '0x7Ca8C2D3De35E3d19EDB02127CB2f41C0cD0f50E';

// Fee exemptions (e.g., certain token pairs or users)
const EXEMPT_TOKENS: string[] = []; // No exemptions by default
const EXEMPT_USERS: string[] = []; // No exempt users by default

// ============================================================
// INTERFACES
// ============================================================

interface SwapFeeCalculation {
  originalAmount: string;
  feeAmount: string;
  netAmount: string;
  feePercentage: number;
  feeBps: number;
  treasuryWallet: string;
  tier?: SubscriptionTier;
  savings?: string; // Amount saved vs free tier
}

interface FeeTransaction {
  id: string;
  userId: string;
  swapId?: string;
  fromToken: string;
  toToken: string;
  originalAmount: string;
  feeAmount: string;
  feePercentage: number;
  treasuryWallet: string;
  chainId: number;
  txHash?: string;
  status: 'pending' | 'collected' | 'failed';
  createdAt: Date;
  tier?: SubscriptionTier;
}

// ============================================================
// SWAP FEE SERVICE
// ============================================================

class SwapFeeService {
  private feeTransactions: Map<string, FeeTransaction> = new Map();

  /**
   * Get fee percentage for a specific tier
   */
  getFeePercentageByTier(tier: SubscriptionTier = 'free'): number {
    return SWAP_FEE_BPS_BY_TIER[tier] / 10000;
  }

  /**
   * Get fee in basis points for a specific tier
   */
  getFeeBpsByTier(tier: SubscriptionTier = 'free'): number {
    return SWAP_FEE_BPS_BY_TIER[tier];
  }

  /**
   * Get current fee percentage (default/free tier for backward compatibility)
   */
  getFeePercentage(): number {
    return DEFAULT_SWAP_FEE_PERCENTAGE;
  }

  /**
   * Get fee in basis points (default/free tier)
   */
  getFeeBps(): number {
    return DEFAULT_SWAP_FEE_BPS;
  }

  /**
   * Get all tier fee information
   */
  getAllTierFees(): Record<SubscriptionTier, { bps: number; percentage: string; savings: string }> {
    const freeBps = SWAP_FEE_BPS_BY_TIER.free;
    return {
      free: { bps: freeBps, percentage: '0.5%', savings: '0%' },
      pro: { bps: SWAP_FEE_BPS_BY_TIER.pro, percentage: '0.35%', savings: '30%' },
      elite: { bps: SWAP_FEE_BPS_BY_TIER.elite, percentage: '0.2%', savings: '60%' },
      lifetime: { bps: SWAP_FEE_BPS_BY_TIER.lifetime, percentage: '0.15%', savings: '70%' },
    };
  }

  /**
   * Get treasury wallet address
   */
  getTreasuryWallet(): string {
    return TREASURY_WALLET;
  }

  /**
   * Check if a swap is exempt from fees
   */
  isExemptFromFee(userId: string, fromToken: string, toToken: string): boolean {
    // Check user exemption
    if (EXEMPT_USERS.includes(userId)) {
      return true;
    }

    // Check token exemption
    if (
      EXEMPT_TOKENS.includes(fromToken.toLowerCase()) ||
      EXEMPT_TOKENS.includes(toToken.toLowerCase())
    ) {
      return true;
    }

    return false;
  }

  /**
   * Calculate swap fee with tiered pricing based on subscription level
   * The fee is taken from the input amount BEFORE the swap
   */
  calculateFee(
    amount: string,
    _decimals: number = 18,
    tier: SubscriptionTier = 'free'
  ): SwapFeeCalculation {
    const amountBigInt = BigInt(amount);
    const feeBps = SWAP_FEE_BPS_BY_TIER[tier];
    const feePercentage = feeBps / 10000;

    // Fee = amount * fee% (e.g., 0.5% for free tier)
    // Using integer math: (amount * bps) / 10000
    const feeAmountBigInt = (amountBigInt * BigInt(feeBps)) / BigInt(10000);
    const netAmountBigInt = amountBigInt - feeAmountBigInt;

    // Calculate savings vs free tier
    const freeFeeAmount = (amountBigInt * BigInt(SWAP_FEE_BPS_BY_TIER.free)) / BigInt(10000);
    const savingsAmount = freeFeeAmount - feeAmountBigInt;

    return {
      originalAmount: amount,
      feeAmount: feeAmountBigInt.toString(),
      netAmount: netAmountBigInt.toString(),
      feePercentage,
      feeBps,
      treasuryWallet: TREASURY_WALLET,
      tier,
      savings: savingsAmount.toString(),
    };
  }

  /**
   * Calculate fee with human-readable formatting
   */
  calculateFeeFormatted(
    amount: string,
    decimals: number = 18,
    tier: SubscriptionTier = 'free'
  ): {
    originalAmount: string;
    feeAmount: string;
    netAmount: string;
    originalFormatted: string;
    feeFormatted: string;
    netFormatted: string;
    feePercentage: string;
    tier: SubscriptionTier;
    savingsFormatted: string;
  } {
    const calc = this.calculateFee(amount, decimals, tier);

    return {
      originalAmount: calc.originalAmount,
      feeAmount: calc.feeAmount,
      netAmount: calc.netAmount,
      originalFormatted: ethers.formatUnits(calc.originalAmount, decimals),
      feeFormatted: ethers.formatUnits(calc.feeAmount, decimals),
      netFormatted: ethers.formatUnits(calc.netAmount, decimals),
      feePercentage: `${calc.feePercentage * 100}%`,
      tier,
      savingsFormatted: calc.savings ? ethers.formatUnits(calc.savings, decimals) : '0',
    };
  }

  /**
   * Record fee transaction for tracking
   */
  async recordFeeTransaction(params: {
    userId: string;
    swapId?: string;
    fromToken: string;
    toToken: string;
    originalAmount: string;
    feeAmount: string;
    chainId: number;
    txHash?: string;
    tier?: SubscriptionTier;
  }): Promise<FeeTransaction> {
    const tier = params.tier || 'free';
    const feePercentage = this.getFeePercentageByTier(tier);

    const tx: FeeTransaction = {
      id: `fee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: params.userId,
      swapId: params.swapId,
      fromToken: params.fromToken,
      toToken: params.toToken,
      originalAmount: params.originalAmount,
      feeAmount: params.feeAmount,
      feePercentage,
      treasuryWallet: TREASURY_WALLET,
      chainId: params.chainId,
      txHash: params.txHash,
      status: 'pending',
      createdAt: new Date(),
      tier,
    };

    this.feeTransactions.set(tx.id, tx);

    // Also record in profit routing service
    try {
      await profitRoutingService.routeSwapProfit({
        amount: parseFloat(ethers.formatEther(params.feeAmount)),
        currency: params.fromToken,
        fromWallet: params.userId,
        txHash: params.txHash,
        metadata: {
          feeTransactionId: tx.id,
          swapId: params.swapId,
          chainId: params.chainId,
          fromToken: params.fromToken,
          toToken: params.toToken,
          feePercentage: `${feePercentage * 100}%`,
          tier,
        },
      });
    } catch (error) {
      logger.error('[SwapFee] Failed to record in profit routing:', error);
    }

    logger.info(
      `[SwapFee] Recorded fee: ${ethers.formatEther(params.feeAmount)} ETH from swap (${tier} tier - ${feePercentage * 100}%)`
    );

    return tx;
  }

  /**
   * Mark fee as collected (after on-chain transfer)
   */
  async markFeeCollected(feeId: string, txHash: string): Promise<FeeTransaction | null> {
    const tx = this.feeTransactions.get(feeId);
    if (!tx) return null;

    tx.status = 'collected';
    tx.txHash = txHash;

    this.feeTransactions.set(feeId, tx);

    logger.info(`[SwapFee] Fee collected: ${feeId} - tx: ${txHash}`);

    return tx;
  }

  /**
   * Get fee statistics
   */
  getStats(): {
    totalFeesCollected: string;
    totalTransactions: number;
    pendingFees: string;
    feeStructure: Record<SubscriptionTier, string>;
    treasuryWallet: string;
  } {
    const transactions = Array.from(this.feeTransactions.values());

    let totalCollected = BigInt(0);
    let pendingTotal = BigInt(0);

    for (const tx of transactions) {
      if (tx.status === 'collected') {
        totalCollected += BigInt(tx.feeAmount);
      } else if (tx.status === 'pending') {
        pendingTotal += BigInt(tx.feeAmount);
      }
    }

    return {
      totalFeesCollected: totalCollected.toString(),
      totalTransactions: transactions.length,
      pendingFees: pendingTotal.toString(),
      feeStructure: {
        free: '0.5%',
        pro: '0.35%',
        elite: '0.2%',
        lifetime: '0.15%',
      },
      treasuryWallet: TREASURY_WALLET,
    };
  }

  /**
   * Get fee info for display
   */
  getFeeInfo(tier: SubscriptionTier = 'free'): {
    percentage: number;
    percentageFormatted: string;
    bps: number;
    treasuryWallet: string;
    description: string;
    allTiers: Record<SubscriptionTier, { bps: number; percentage: string; savings: string }>;
  } {
    const feePercentage = this.getFeePercentageByTier(tier);
    const feeBps = this.getFeeBpsByTier(tier);

    return {
      percentage: feePercentage,
      percentageFormatted: `${feePercentage * 100}%`,
      bps: feeBps,
      treasuryWallet: TREASURY_WALLET,
      description: `Platform fee for ${tier} tier. Upgrade to reduce fees - Pro: 0.35%, Elite: 0.2%, Lifetime: 0.15%`,
      allTiers: this.getAllTierFees(),
    };
  }

  /**
   * Build transaction to transfer fee to treasury
   * (Used when fee is part of a multi-call or separate transaction)
   */
  buildFeeTransferTx(
    tokenAddress: string,
    feeAmount: string
  ): {
    to: string;
    data: string;
    value: string;
  } {
    // For native tokens (ETH)
    const NATIVE_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

    if (tokenAddress.toLowerCase() === NATIVE_TOKEN.toLowerCase()) {
      return {
        to: TREASURY_WALLET,
        data: '0x',
        value: feeAmount,
      };
    }

    // For ERC20 tokens - encode transfer call
    const transferInterface = new ethers.Interface([
      'function transfer(address to, uint256 amount) returns (bool)',
    ]);

    return {
      to: tokenAddress,
      data: transferInterface.encodeFunctionData('transfer', [TREASURY_WALLET, feeAmount]),
      value: '0',
    };
  }
}

// Export singleton
export const swapFeeService = new SwapFeeService();
export default swapFeeService;

// Export constants for use elsewhere (use default free tier for backward compatibility)
export const PLATFORM_SWAP_FEE = DEFAULT_SWAP_FEE_PERCENTAGE;
export const PLATFORM_FEE_BPS = DEFAULT_SWAP_FEE_BPS;
export const PLATFORM_TREASURY = TREASURY_WALLET;
export { SWAP_FEE_BPS_BY_TIER };
