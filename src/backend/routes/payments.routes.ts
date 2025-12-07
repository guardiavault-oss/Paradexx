import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { stripeService } from '../stripe/stripeService';
import { stripeStorage } from '../stripe/storage';
import { getUncachableStripeClient, getStripePublishableKey } from '../stripe/stripeClient';

const router = Router();

router.get('/products', async (req: Request, res: Response) => {
  try {
    const rows = await stripeStorage.listProductsWithPrices();

    const productsMap = new Map();
    for (const row of rows) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          active: row.product_active,
          metadata: row.product_metadata,
          prices: []
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
          active: row.price_active,
          metadata: row.price_metadata,
        });
      }
    }

    res.json({ products: Array.from(productsMap.values()) });
  } catch (error: any) {
    logger.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/publishable-key', async (req: Request, res: Response) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (error: any) {
    logger.error('Error fetching publishable key:', error);
    res.status(500).json({ error: 'Failed to fetch publishable key' });
  }
});

router.post('/create-checkout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { priceId, product, tier } = req.body;
    const userId = req.userId;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: targetPriceId, quantity: 1 }],
      mode: mode,
      success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription/cancel`,
      metadata: {
        userId: user.id,
        product: product || '',
        tier: tier || '',
      },
    });

    res.json({
      session: {
        id: session.id,
        url: session.url,
      },
    });
  } catch (error: any) {
    logger.error('Payment checkout error:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
});

router.post('/create-portal-session', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const user = await (prisma.user as any).findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!(user as any)?.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found for this user' });
    }

    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : process.env.FRONTEND_URL || 'http://localhost:5000';

    const stripe = await getUncachableStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: (user as any).stripeCustomerId,
      return_url: `${baseUrl}/settings/subscription`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    logger.error('Portal session error:', error);
    res.status(500).json({ error: error.message || 'Failed to create portal session' });
  }
});

router.get('/subscription', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const user = await (prisma.user as any).findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    });

    if (!(user as any)?.stripeSubscriptionId) {
      return res.json({ subscription: null });
    }

    const subscription = await stripeStorage.getSubscription((user as any).stripeSubscriptionId);
    res.json({ subscription });
  } catch (error: any) {
    logger.error('Subscription fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch subscription' });
  }
});

export default router;
