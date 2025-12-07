/**
 * Swap Fee Service - Handles platform swap fees (0.79%) routed to treasury
 * All platform usage is FREE except for this swap fee
 */

import { ethers } from 'ethers';
import { logger } from './logger.service';
import profitRoutingService from './profit-routing.service';
import { prisma } from '../config/database';

// ============================================================
// FEE CONFIGURATION
// ============================================================

// Platform swap fee: 0.79%
const SWAP_FEE_PERCENTAGE = 0.0079; // 0.79%
const SWAP_FEE_BPS = 79; // 79 basis points

// Treasury wallet address - all fees go here
const TREASURY_WALLET = process.env.TREASURY_WALLET_ADDRESS || process.env.PROFIT_WALLET_ADDRESS || '0x7Ca8C2D3De35E3d19EDB02127CB2f41C0cD0f50E';

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
}

// ============================================================
// SWAP FEE SERVICE
// ============================================================

class SwapFeeService {
    private feeTransactions: Map<string, FeeTransaction> = new Map();

    /**
     * Get current fee percentage
     */
    getFeePercentage(): number {
        return SWAP_FEE_PERCENTAGE;
    }

    /**
     * Get fee in basis points
     */
    getFeeBps(): number {
        return SWAP_FEE_BPS;
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
        if (EXEMPT_TOKENS.includes(fromToken.toLowerCase()) ||
            EXEMPT_TOKENS.includes(toToken.toLowerCase())) {
            return true;
        }

        return false;
    }

    /**
     * Calculate swap fee
     * The fee is taken from the input amount BEFORE the swap
     */
    calculateFee(amount: string, decimals: number = 18): SwapFeeCalculation {
        const amountBigInt = BigInt(amount);

        // Fee = amount * 0.79%
        // Using integer math: (amount * 79) / 10000
        const feeAmountBigInt = (amountBigInt * BigInt(SWAP_FEE_BPS)) / BigInt(10000);
        const netAmountBigInt = amountBigInt - feeAmountBigInt;

        return {
            originalAmount: amount,
            feeAmount: feeAmountBigInt.toString(),
            netAmount: netAmountBigInt.toString(),
            feePercentage: SWAP_FEE_PERCENTAGE,
            feeBps: SWAP_FEE_BPS,
            treasuryWallet: TREASURY_WALLET,
        };
    }

    /**
     * Calculate fee with human-readable formatting
     */
    calculateFeeFormatted(amount: string, decimals: number = 18): {
        originalAmount: string;
        feeAmount: string;
        netAmount: string;
        originalFormatted: string;
        feeFormatted: string;
        netFormatted: string;
        feePercentage: string;
    } {
        const calc = this.calculateFee(amount, decimals);

        return {
            originalAmount: calc.originalAmount,
            feeAmount: calc.feeAmount,
            netAmount: calc.netAmount,
            originalFormatted: ethers.formatUnits(calc.originalAmount, decimals),
            feeFormatted: ethers.formatUnits(calc.feeAmount, decimals),
            netFormatted: ethers.formatUnits(calc.netAmount, decimals),
            feePercentage: `${SWAP_FEE_PERCENTAGE * 100}%`,
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
    }): Promise<FeeTransaction> {
        const tx: FeeTransaction = {
            id: `fee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: params.userId,
            swapId: params.swapId,
            fromToken: params.fromToken,
            toToken: params.toToken,
            originalAmount: params.originalAmount,
            feeAmount: params.feeAmount,
            feePercentage: SWAP_FEE_PERCENTAGE,
            treasuryWallet: TREASURY_WALLET,
            chainId: params.chainId,
            txHash: params.txHash,
            status: 'pending',
            createdAt: new Date(),
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
                    feePercentage: `${SWAP_FEE_PERCENTAGE * 100}%`,
                },
            });
        } catch (error) {
            logger.error('[SwapFee] Failed to record in profit routing:', error);
        }

        logger.info(`[SwapFee] Recorded fee: ${ethers.formatEther(params.feeAmount)} ETH from swap`);

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
        feePercentage: string;
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
            feePercentage: `${SWAP_FEE_PERCENTAGE * 100}%`,
            treasuryWallet: TREASURY_WALLET,
        };
    }

    /**
     * Get fee info for display
     */
    getFeeInfo(): {
        percentage: number;
        percentageFormatted: string;
        bps: number;
        treasuryWallet: string;
        description: string;
    } {
        return {
            percentage: SWAP_FEE_PERCENTAGE,
            percentageFormatted: `${SWAP_FEE_PERCENTAGE * 100}%`,
            bps: SWAP_FEE_BPS,
            treasuryWallet: TREASURY_WALLET,
            description: 'Platform fee applied to all swaps. Supports ongoing development and maintenance.',
        };
    }

    /**
     * Build transaction to transfer fee to treasury
     * (Used when fee is part of a multi-call or separate transaction)
     */
    buildFeeTransferTx(tokenAddress: string, feeAmount: string): {
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

// Export constants for use elsewhere
export const PLATFORM_SWAP_FEE = SWAP_FEE_PERCENTAGE;
export const PLATFORM_FEE_BPS = SWAP_FEE_BPS;
export const PLATFORM_TREASURY = TREASURY_WALLET;
