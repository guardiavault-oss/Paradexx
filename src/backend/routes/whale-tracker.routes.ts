/**
 * Whale Tracker Routes - Smart money tracking API
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { whaleTrackerService } from '../services/whale-tracker.service';

const router = Router();

// Get list of known whales
router.get('/whales', async (req: Request, res: Response) => {
    try {
        const { category, minWinRate, followingOnly } = req.query;

        const whales = whaleTrackerService.getWhales({
            category: category as string,
            minWinRate: minWinRate ? parseFloat(minWinRate as string) : undefined,
            followingOnly: followingOnly === 'true',
        });

        res.json({ whales });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get whale portfolio
router.get('/whales/:address/portfolio', async (req: Request, res: Response) => {
    try {
        const portfolio = await whaleTrackerService.getWhalePortfolio(req.params.address);
        res.json(portfolio);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get whale transactions
router.get('/transactions', async (req: Request, res: Response) => {
    try {
        const { address, limit } = req.query;
        const transactions = whaleTrackerService.getWhaleTransactions(
            address as string,
            limit ? parseInt(limit as string) : 50
        );

        res.json({ transactions });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get whale alerts
router.get('/alerts', async (req: Request, res: Response) => {
    try {
        const { limit } = req.query;
        const alerts = whaleTrackerService.getAlerts(
            limit ? parseInt(limit as string) : 50
        );

        res.json({ alerts });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Follow a whale
router.post('/follow/:address', authenticateToken, async (req: Request, res: Response) => {
    try {
        const success = whaleTrackerService.followWhale(req.params.address);

        if (!success) {
            return res.status(404).json({ error: 'Whale not found' });
        }

        res.json({ success: true, message: 'Now following whale' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Unfollow a whale
router.delete('/follow/:address', authenticateToken, async (req: Request, res: Response) => {
    try {
        const success = whaleTrackerService.unfollowWhale(req.params.address);

        if (!success) {
            return res.status(404).json({ error: 'Not following this whale' });
        }

        res.json({ success: true, message: 'Unfollowed whale' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Add custom whale to track
router.post('/whales', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { address, label, category } = req.body;

        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        const whale = await whaleTrackerService.addCustomWhale(
            address,
            label || 'Custom Whale',
            category || 'unknown'
        );

        res.json({ whale });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get copy trading signals
router.get('/signals', authenticateToken, async (req: Request, res: Response) => {
    try {
        const signals = whaleTrackerService.getCopySignals();
        res.json({ signals });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
