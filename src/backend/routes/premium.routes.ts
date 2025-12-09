/**
 * Premium Unlock Routes
 * Handles one-time purchases for premium features
 */

import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { PREMIUM_FEATURES, PremiumFeatureId } from '../middleware/subscription.middleware';
import Stripe from 'stripe';

const router = Router();

// Premium feature pricing (in cents)
const PREMIUM_PRICING: Record<PremiumFeatureId, { price: number; name: string; description: string }> = {
    sniper_bot: { price: 4900, name: 'Sniper Bot Access', description: 'Automated token launch sniping' },
    whale_alerts: { price: 2900, name: 'Whale Alerts Pro', description: 'Real-time whale movement notifications' },
    private_node: { price: 9900, name: 'Private Node Execution', description: 'Privacy-focused transaction routing' },
    mev_plus: { price: 3900, name: 'MEV Protection Plus', description: 'Enhanced MEV protection with Flashbots' },
    inheritance: { price: 14900, name: 'Inheritance Protocol', description: 'Crypto inheritance and vault protection' },
    multisig: { price: 7900, name: 'Multi-Sig Templates', description: 'Pre-built multi-signature vault templates' },
    death_verify: { price: 19900, name: 'Manual Death Verification', description: 'Human-verified death certificate processing' },
    exit_strat: { price: 6900, name: 'Algorithmic Exit Strategies', description: 'Automated profit-taking and stop-loss' },
};

// Complete bundle pricing (40% discount)
const COMPLETE_BUNDLE_PRICE = 34900; // $349

// Initialize Stripe (use env variable in production)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2023-10-16',
});

// GET /api/premium/features - List all premium features and prices
router.get('/features', async (req: Request, res: Response) => {
    try {
        const features = Object.entries(PREMIUM_PRICING).map(([id, data]) => ({
            id,
            ...data,
            priceFormatted: `$${(data.price / 100).toFixed(0)}`,
        }));

        const bundleTotal = Object.values(PREMIUM_PRICING).reduce((sum, f) => sum + f.price, 0);

        res.json({
            features,
            bundle: {
                id: 'complete_bundle',
                name: 'Complete Bundle',
                description: 'All 8 premium features - lifetime access',
                originalPrice: bundleTotal,
                price: COMPLETE_BUNDLE_PRICE,
                discount: Math.round((1 - COMPLETE_BUNDLE_PRICE / bundleTotal) * 100),
                priceFormatted: `$${(COMPLETE_BUNDLE_PRICE / 100).toFixed(0)}`,
            },
        });
    } catch (error: any) {
        logger.error('Error listing premium features:', error);
        res.status(500).json({ error: 'Failed to list premium features' });
    }
});

// GET /api/premium/unlocked - Get user's unlocked features
router.get('/unlocked', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        // Query database for user's purchased features
        // In production, you'd query: SELECT feature_id FROM user_premium_features WHERE user_id = userId
        // For now, return empty array - features unlock after successful Stripe payment via webhook
        const unlockedFeatures: PremiumFeatureId[] = [];

        res.json({
            unlockedFeatures,
            availableFeatures: Object.keys(PREMIUM_FEATURES).filter(
                (f) => !unlockedFeatures.includes(f as PremiumFeatureId)
            ),
        });
    } catch (error: any) {
        logger.error('Error fetching unlocked features:', error);
        res.status(500).json({ error: 'Failed to fetch unlocked features' });
    }
});

// POST /api/premium/checkout - Create Stripe checkout session for feature unlock
router.post('/checkout', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { featureId, isBundle } = req.body;

        if (isBundle) {
            // Complete bundle checkout
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Complete Bundle - All Premium Features',
                            description: 'Lifetime access to all 8 premium features (40% discount)',
                        },
                        unit_amount: COMPLETE_BUNDLE_PRICE,
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/premium`,
                metadata: {
                    userId,
                    type: 'bundle',
                    features: Object.keys(PREMIUM_FEATURES).join(','),
                },
            });

            return res.json({ checkoutUrl: session.url, sessionId: session.id });
        }

        // Single feature checkout
        if (!featureId || !PREMIUM_PRICING[featureId as PremiumFeatureId]) {
            return res.status(400).json({ error: 'Invalid feature ID' });
        }

        const feature = PREMIUM_PRICING[featureId as PremiumFeatureId];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: feature.name,
                        description: feature.description,
                    },
                    unit_amount: feature.price,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/premium`,
            metadata: {
                userId,
                type: 'single',
                featureId,
            },
        });

        res.json({ checkoutUrl: session.url, sessionId: session.id });
    } catch (error: any) {
        logger.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// POST /api/premium/webhook - Stripe webhook for payment confirmation
router.post('/webhook', async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
        let event: Stripe.Event;

        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            // Dev mode - parse body directly
            event = req.body;
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const { userId, type, featureId, features } = session.metadata || {};

            if (type === 'bundle') {
                // Unlock all features for user
                const featureIds = features?.split(',') || [];
                logger.info(`Unlocking bundle for user ${userId}:`, featureIds);
                // TODO: Save to database - INSERT INTO user_premium_features (user_id, feature_id) VALUES ...
            } else if (type === 'single' && featureId) {
                // Unlock single feature
                logger.info(`Unlocking feature ${featureId} for user ${userId}`);
                // TODO: Save to database - INSERT INTO user_premium_features (user_id, feature_id) VALUES (userId, featureId)
            }
        }

        res.json({ received: true });
    } catch (error: any) {
        logger.error('Webhook error:', error);
        res.status(400).json({ error: 'Webhook error' });
    }
});

export default router;
