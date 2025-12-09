import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service';
import { prisma } from '../config/database';

const DEV_MODE = process.env.NODE_ENV === 'development';

// Premium feature IDs (one-time unlocks)
export const PREMIUM_FEATURES = {
  SNIPER_BOT: 'sniper_bot',
  WHALE_ALERTS: 'whale_alerts',
  PRIVATE_NODE: 'private_node',
  MEV_PROTECTION_PLUS: 'mev_plus',
  INHERITANCE: 'inheritance',
  MULTISIG_TEMPLATES: 'multisig',
  DEATH_VERIFICATION: 'death_verify',
  EXIT_STRATEGIES: 'exit_strat',
} as const;

export type PremiumFeatureId = typeof PREMIUM_FEATURES[keyof typeof PREMIUM_FEATURES];

export interface ModeAccessRequest extends Request {
  userId?: string;
  walletMode?: 'degen' | 'regen' | 'dual';
  hasDualModeAccess?: boolean;
  unlockedFeatures?: PremiumFeatureId[];
}

// Query database for user's purchased premium features
async function getUserUnlockedFeatures(userId: string): Promise<PremiumFeatureId[]> {
  // In dev mode, unlock all features for testing
  if (DEV_MODE) {
    return Object.values(PREMIUM_FEATURES);
  }

  try {
    const features = await prisma.userPremiumFeature.findMany({
      where: { userId },
      select: { featureId: true },
    });
    return features.map((f: { featureId: string }) => f.featureId as PremiumFeatureId);
  } catch (error) {
    logger.error('Error fetching user premium features:', error);
    return [];
  }
}

/**
 * Check if user has unlocked a specific premium feature (one-time purchase)
 */
export function requirePremiumFeature(featureId: PremiumFeatureId) {
  return async (req: ModeAccessRequest, res: Response, next: NextFunction) => {
    if (DEV_MODE) {
      req.unlockedFeatures = Object.values(PREMIUM_FEATURES);
      return next();
    }

    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const unlockedFeatures = await getUserUnlockedFeatures(userId);
      req.unlockedFeatures = unlockedFeatures;

      if (!unlockedFeatures.includes(featureId)) {
        return res.status(403).json({
          error: 'Premium feature required',
          feature: featureId,
          message: `This feature requires a one-time unlock. Purchase "${featureId}" to access.`,
          unlockUrl: `/premium/unlock/${featureId}`,
        });
      }

      next();
    } catch (error: any) {
      logger.error('Premium feature check error:', error);
      res.status(500).json({ error: 'Failed to verify premium access' });
    }
  };
}

// Legacy compatibility aliases (map old subscription checks to premium unlocks)
export const requireDegenXSubscription = (tier: 'basic' | 'pro') => {
  // Basic tier features are now free - just require auth
  if (tier === 'basic') {
    return (req: ModeAccessRequest, res: Response, next: NextFunction) => {
      if (!req.userId && !DEV_MODE) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      next();
    };
  }
  // Pro tier maps to sniper bot unlock
  return requirePremiumFeature(PREMIUM_FEATURES.SNIPER_BOT);
};

// Elite tier = requires sniper bot unlock (primary elite feature)
export const requireDegenXElite = requirePremiumFeature(PREMIUM_FEATURES.SNIPER_BOT);

// GuardianX subscription maps to inheritance unlock
export const requireGuardianXSubscription = (tier: 'essential' | 'advanced') => {
  if (tier === 'essential') {
    return requirePremiumFeature(PREMIUM_FEATURES.INHERITANCE);
  }
  return requirePremiumFeature(PREMIUM_FEATURES.DEATH_VERIFICATION);
};

export const requireGuardianXElite = requirePremiumFeature(PREMIUM_FEATURES.DEATH_VERIFICATION);

export function requireDualMode() {
  return async (req: ModeAccessRequest, res: Response, next: NextFunction) => {
    if (DEV_MODE) {
      req.hasDualModeAccess = true;
      req.walletMode = 'dual';
      return next();
    }

    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      req.hasDualModeAccess = true;
      req.walletMode = 'dual';

      next();
    } catch (error: any) {
      logger.error('Mode access check error:', error);
      res.status(500).json({ error: 'Failed to verify mode access' });
    }
  };
}

export function checkModeAccess(requiredMode: 'degen' | 'regen') {
  return async (req: ModeAccessRequest, res: Response, next: NextFunction) => {
    if (DEV_MODE) {
      req.walletMode = 'dual';
      req.hasDualModeAccess = true;
      return next();
    }

    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      req.walletMode = 'dual';
      req.hasDualModeAccess = true;

      next();
    } catch (error: any) {
      logger.error('Mode access check error:', error);
      res.status(500).json({ error: 'Failed to verify mode access' });
    }
  };
}
