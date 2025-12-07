/**
 * Portfolio Routes - Analytics and insights
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { portfolioAnalyticsService } from '../services/portfolio-analytics.service';

const router = Router();

// Get portfolio overview
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const walletAddress = (req as any).user.walletAddress || req.query.wallet;
        const chainId = req.query.chainId ? parseInt(req.query.chainId as string) : undefined;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const portfolio = await portfolioAnalyticsService.getPortfolio(walletAddress, chainId);
        res.json(portfolio);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get performance metrics
router.get('/performance', authenticateToken, async (req: Request, res: Response) => {
    try {
        const walletAddress = (req as any).user.walletAddress || req.query.wallet;
        const timeframe = (req.query.timeframe as any) || '30d';

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const performance = await portfolioAnalyticsService.getPerformance(walletAddress, timeframe);
        res.json(performance);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get risk metrics
router.get('/risk', authenticateToken, async (req: Request, res: Response) => {
    try {
        const walletAddress = (req as any).user.walletAddress || req.query.wallet;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const risk = await portfolioAnalyticsService.getRiskMetrics(walletAddress);
        res.json(risk);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get asset allocation
router.get('/allocation', authenticateToken, async (req: Request, res: Response) => {
    try {
        const walletAddress = (req as any).user.walletAddress || req.query.wallet;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const allocation = await portfolioAnalyticsService.getAssetAllocation(walletAddress);
        res.json(allocation);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get benchmark comparison
router.get('/benchmarks', authenticateToken, async (req: Request, res: Response) => {
    try {
        const walletAddress = (req as any).user.walletAddress || req.query.wallet;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const benchmarks = await portfolioAnalyticsService.compareToBenchmarks(walletAddress);
        res.json({ benchmarks });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get historical value chart data
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
    try {
        const walletAddress = (req as any).user.walletAddress || req.query.wallet;
        const timeframe = (req.query.timeframe as any) || '30d';

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const history = await portfolioAnalyticsService.getHistoricalValue(walletAddress, timeframe);
        res.json({ history });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Generate tax report
router.get('/tax/:year', authenticateToken, async (req: Request, res: Response) => {
    try {
        const walletAddress = (req as any).user.walletAddress || req.query.wallet;
        const year = parseInt(req.params.year);

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const report = await portfolioAnalyticsService.generateTaxReport(walletAddress, year);
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
