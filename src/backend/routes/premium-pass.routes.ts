// Premium Pass Routes
// Handle Premium Pass purchases ($99/year or $199 lifetime)

import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkPremiumPass, getPremiumPassStatus, getPremiumPassPricing } from '../services/premium-pass.service';
import { prisma } from '../config/database';

const router = Router();

router.use(authenticateToken);

// GET /api/premium-pass/status - Get user's Premium Pass status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const status = await getPremiumPassStatus(userId);
    res.json(status);
  } catch (error: any) {
    logger.error('Premium Pass status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get Premium Pass status' });
  }
});

// GET /api/premium-pass/pricing - Get Premium Pass pricing
router.get('/pricing', async (req: Request, res: Response) => {
  try {
    const pricing = getPremiumPassPricing();
    res.json(pricing);
  } catch (error: any) {
    logger.error('Premium Pass pricing error:', error);
    res.status(500).json({ error: error.message || 'Failed to get pricing' });
  }
});

// POST /api/premium-pass/purchase - Create Premium Pass purchase (Stripe checkout)
router.post('/purchase', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { passType } = req.body; // 'annual' or 'lifetime'

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!passType || !['annual', 'lifetime'].includes(passType)) {
      return res.status(400).json({ error: 'Invalid pass type. Must be "annual" or "lifetime"' });
    }

    const pricing = getPremiumPassPricing();
    const price = pricing[passType].price;

    // TODO: Create Stripe checkout session
    // For now, return mock checkout URL
    const checkoutUrl = `/checkout/premium-pass?type=${passType}&price=${price}`;

    res.json({
      checkoutUrl,
      passType,
      price,
      currency: 'USD',
    });
  } catch (error: any) {
    logger.error('Premium Pass purchase error:', error);
    res.status(500).json({ error: error.message || 'Failed to create purchase' });
  }
});

// POST /api/premium-pass/activate - Activate Premium Pass (called by Stripe webhook)
router.post('/activate', async (req: Request, res: Response) => {
  try {
    const { userId, passType, stripePaymentIntentId, expiresAt } = req.body;

    if (!userId || !passType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pricing = getPremiumPassPricing();
    const price = pricing[passType].price;

    // Calculate expiration date for annual passes
    let expirationDate: Date | null = null;
    if (passType === 'annual') {
      expirationDate = expiresAt ? new Date(expiresAt) : new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    }

    // Create Premium Pass
    const premiumPass = await prisma.premiumPass.create({
      data: {
        userId,
        type: passType,
        price,
        currency: 'USD',
        expiresAt: expirationDate,
        stripePaymentIntentId,
      },
    });

    res.json({
      success: true,
      premiumPass,
      message: `Premium Pass activated successfully! ${passType === 'lifetime' ? 'Enjoy lifetime access!' : 'Valid for 1 year.'}`,
    });
  } catch (error: any) {
    logger.error('Premium Pass activation error:', error);
    res.status(500).json({ error: error.message || 'Failed to activate Premium Pass' });
  }
});

// GET /api/premium-pass/benefits - Get Premium Pass benefits
router.get('/benefits', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const status = userId ? await getPremiumPassStatus(userId) : null;

    res.json({
      free: {
        swapFee: '0.5%',
        sniperTrades: '3 per day',
        whaleTracking: 'Top 10 wallets',
        mevProtection: 'Basic',
        aiSignals: false,
        zeroFees: false,
      },
      premium: {
        swapFee: '0%',
        sniperTrades: 'Unlimited',
        whaleTracking: 'Custom tracking + real-time alerts',
        mevProtection: 'Private mempool (Flashbots/Eden)',
        aiSignals: true,
        zeroFees: true,
        earlyAccess: true,
        alphaGroup: true,
      },
      userStatus: status,
    });
  } catch (error: any) {
    logger.error('Premium Pass benefits error:', error);
    res.status(500).json({ error: error.message || 'Failed to get benefits' });
  }
});

export default router;

