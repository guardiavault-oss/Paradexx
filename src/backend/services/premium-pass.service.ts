// Premium Pass Service
// Handles Premium Pass ($99/year or $199 lifetime) verification and benefits

import { prisma } from '../config/database';
import { logger } from '../services/logger.service';

export interface PremiumPassStatus {
  hasPremiumPass: boolean;
  passType: 'annual' | 'lifetime' | null;
  expiresAt: Date | null;
  benefits: {
    unlimitedSniperTrades: boolean;
    realTimeWhaleAlerts: boolean;
    privateMempoolMEV: boolean;
    aiAlphaSignals: boolean;
    zeroSwapFees: boolean;
    earlyAccess: boolean;
    alphaGroupAccess: boolean;
  };
}

/**
 * Check if user has active Premium Pass
 */
export async function checkPremiumPass(userId: string): Promise<boolean> {
  try {
    const pass = await prisma.premiumPass.findFirst({
      where: {
        userId,
        OR: [
          { type: 'lifetime' },
          {
            type: 'annual',
            expiresAt: { gte: new Date() }
          },
        ],
      },
    });

    return !!pass;
  } catch (error) {
    logger.error('Error checking Premium Pass:', error);
    return false;
  }
}

/**
 * Get Premium Pass status with all benefits
 */
export async function getPremiumPassStatus(userId: string): Promise<PremiumPassStatus> {
  try {
    const pass = await prisma.premiumPass.findFirst({
      where: {
        userId,
        OR: [
          { type: 'lifetime' },
          {
            type: 'annual',
            expiresAt: { gte: new Date() }
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const hasPremiumPass = !!pass;

    return {
      hasPremiumPass,
      passType: (pass?.type as 'annual' | 'lifetime') || null,
      expiresAt: pass?.expiresAt || null,
      benefits: {
        unlimitedSniperTrades: hasPremiumPass,
        realTimeWhaleAlerts: hasPremiumPass,
        privateMempoolMEV: hasPremiumPass,
        aiAlphaSignals: hasPremiumPass,
        zeroSwapFees: hasPremiumPass,
        earlyAccess: hasPremiumPass,
        alphaGroupAccess: hasPremiumPass,
      },
    };
  } catch (error) {
    logger.error('Error getting Premium Pass status:', error);
    return {
      hasPremiumPass: false,
      passType: null,
      expiresAt: null,
      benefits: {
        unlimitedSniperTrades: false,
        realTimeWhaleAlerts: false,
        privateMempoolMEV: false,
        aiAlphaSignals: false,
        zeroSwapFees: false,
        earlyAccess: false,
        alphaGroupAccess: false,
      },
    };
  }
}

/**
 * Check if user can make sniper bot trade (3/day limit for free tier)
 */
export async function canMakeSniperTrade(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const hasPremiumPass = await checkPremiumPass(userId);

  if (hasPremiumPass) {
    return { allowed: true, remaining: -1 }; // -1 means unlimited
  }

  // Check daily limit for free tier (3 trades/day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const tradesToday = await prisma.sniperTrade.count({
      where: {
        userId,
        executedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const remaining = Math.max(0, 3 - tradesToday);
    return { allowed: remaining > 0, remaining };
  } catch (error) {
    logger.error('Error checking sniper trade limit:', error);
    return { allowed: false, remaining: 0 };
  }
}

/**
 * Record sniper bot trade execution
 */
export async function recordSniperTrade(userId: string, tradeData: {
  tokenAddress: string;
  amount: string;
  tradeValue: string;
  feeAmount: string;
}) {
  try {
    await prisma.sniperTrade.create({
      data: {
        userId,
        tokenAddress: tradeData.tokenAddress,
        amount: tradeData.amount,
        tradeValue: tradeData.tradeValue,
        feeAmount: tradeData.feeAmount,
        executedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('Error recording sniper trade:', error);
  }
}

/**
 * Get Premium Pass pricing
 */
export function getPremiumPassPricing() {
  return {
    annual: {
      price: 99,
      currency: 'USD',
      duration: '1 year',
      features: [
        'Unlimited sniper bot trades',
        'Real-time whale alerts',
        'Private mempool MEV protection',
        'AI alpha signals',
        'Zero platform fees on swaps',
        'Early access to new features',
        'Discord/Telegram alpha group access',
      ],
    },
    lifetime: {
      price: 199,
      currency: 'USD',
      duration: 'lifetime',
      features: [
        'All annual features',
        'One-time payment',
        'No recurring fees',
        'Future features included',
      ],
    },
  };
}

