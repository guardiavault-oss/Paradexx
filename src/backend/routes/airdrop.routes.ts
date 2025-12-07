/**
 * Airdrop Routes - Airdrop hunting and farming
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { airdropHunterService } from '../services/airdrop-hunter.service';

const router = Router();

// Get active airdrops
router.get('/', async (req: Request, res: Response) => {
    try {
        const { chainId, status, category } = req.query;

        const airdrops = await airdropHunterService.getActiveAirdrops({
            chainId: chainId ? parseInt(chainId as string) : undefined,
            status: status as any,
            category: category as string,
        });

        res.json({ airdrops });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Check eligibility for specific airdrop
router.get('/:id/eligibility', authenticateToken, async (req: Request, res: Response) => {
    try {
        const walletAddress = (req as any).user.walletAddress || req.query.wallet;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const eligibility = await airdropHunterService.checkEligibility(
            req.params.id,
            walletAddress
        );

        res.json(eligibility);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Check all eligible airdrops for wallet
router.get('/check-all', authenticateToken, async (req: Request, res: Response) => {
    try {
        const walletAddress = (req as any).user.walletAddress || req.query.wallet;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const eligible = await airdropHunterService.checkAllEligibility(walletAddress);
        res.json({ eligible });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Claim airdrop
router.post('/:id/claim', authenticateToken, async (req: Request, res: Response) => {
    try {
        const walletAddress = (req as any).user.walletAddress || req.body.wallet;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const claim = await airdropHunterService.claimAirdrop(req.params.id, walletAddress);
        res.json(claim);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get farming opportunities
router.get('/farming', async (req: Request, res: Response) => {
    try {
        const { difficulty, minConfidence } = req.query;

        const opportunities = airdropHunterService.getFarmingOpportunities({
            difficulty: difficulty as any,
            minConfidence: minConfidence ? parseFloat(minConfidence as string) : undefined,
        });

        res.json({ opportunities });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get personalized farming plan
router.get('/farming/plan', authenticateToken, async (req: Request, res: Response) => {
    try {
        const walletAddress = (req as any).user.walletAddress || req.query.wallet;
        const budget = parseInt(req.query.budget as string) || 100;
        const riskTolerance = (req.query.risk as any) || 'medium';

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const plan = await airdropHunterService.getPersonalizedFarmingPlan(
            walletAddress,
            budget,
            riskTolerance
        );

        res.json(plan);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get claim history
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
    try {
        const walletAddress = (req as any).user.walletAddress || req.query.wallet;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const history = airdropHunterService.getClaimHistory(walletAddress);
        res.json({ history });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get airdrop stats
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
    try {
        const walletAddress = (req as any).user.walletAddress || req.query.wallet;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const stats = await airdropHunterService.getAirdropStats(walletAddress);
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Subscribe to airdrop alerts
router.post('/subscribe', authenticateToken, async (req: Request, res: Response) => {
    try {
        const walletAddress = (req as any).user.walletAddress || req.body.wallet;
        const { minEstimatedValue, categories, notifyUpcoming, notifyEligible } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const result = await airdropHunterService.subscribeToAlerts(walletAddress, {
            minEstimatedValue,
            categories,
            notifyUpcoming,
            notifyEligible,
        });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
