/**
 * Smart Gas Routes - Gas optimization API
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { smartGasService } from '../services/smart-gas.service';

const router = Router();

// Get current gas prices for all chains
router.get('/prices', async (_req: Request, res: Response) => {
    try {
        const chains = smartGasService.getSupportedChains();
        const prices: Record<number, any> = {};

        for (const chainId of chains) {
            const price = await smartGasService.getCurrentGasPrice(chainId);
            if (price) {
                prices[chainId] = {
                    slow: price.slow.toString(),
                    standard: price.standard.toString(),
                    fast: price.fast.toString(),
                    instant: price.instant.toString(),
                    baseFee: price.baseFee.toString(),
                    timestamp: price.timestamp,
                };
            }
        }

        res.json({ prices, chains });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get gas price for specific chain
router.get('/prices/:chainId', async (req: Request, res: Response) => {
    try {
        const chainId = parseInt(req.params.chainId);
        const price = await smartGasService.getCurrentGasPrice(chainId);

        if (!price) {
            return res.status(404).json({ error: 'Chain not supported' });
        }

        res.json({
            chainId,
            slow: price.slow.toString(),
            standard: price.standard.toString(),
            fast: price.fast.toString(),
            instant: price.instant.toString(),
            baseFee: price.baseFee.toString(),
            timestamp: price.timestamp,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get gas prediction
router.get('/predict/:chainId', async (req: Request, res: Response) => {
    try {
        const chainId = parseInt(req.params.chainId);
        const prediction = await smartGasService.predictGas(chainId);

        res.json({
            chainId,
            currentPrice: {
                slow: prediction.currentPrice.slow.toString(),
                standard: prediction.currentPrice.standard.toString(),
                fast: prediction.currentPrice.fast.toString(),
            },
            predictions: {
                in5min: prediction.predictions.in5min.standard.toString(),
                in15min: prediction.predictions.in15min.standard.toString(),
                in1hour: prediction.predictions.in1hour.standard.toString(),
                in4hours: prediction.predictions.in4hours.standard.toString(),
            },
            bestTimeToTransact: prediction.bestTimeToTransact,
            estimatedSavings: prediction.estimatedSavings,
            confidence: prediction.confidence,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Schedule a transaction for optimal gas
router.post('/schedule', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { chainId, transaction, targetGasGwei, maxWaitMinutes } = req.body;

        if (!chainId || !transaction || !targetGasGwei) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const scheduled = await smartGasService.scheduleTransaction(
            userId,
            chainId,
            transaction,
            targetGasGwei,
            maxWaitMinutes || 60
        );

        res.json({
            id: scheduled.id,
            status: scheduled.status,
            targetGasPrice: scheduled.targetGasPrice.toString(),
            maxWaitTime: scheduled.maxWaitTime,
            createdAt: scheduled.createdAt,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get scheduled transactions
router.get('/scheduled', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const transactions = smartGasService.getScheduledTransactions(userId);

        res.json({
            transactions: transactions.map(tx => ({
                id: tx.id,
                chainId: tx.chainId,
                status: tx.status,
                targetGasPrice: tx.targetGasPrice.toString(),
                createdAt: tx.createdAt,
                executedAt: tx.executedAt,
                savings: tx.savings,
            })),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel scheduled transaction
router.delete('/scheduled/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const success = smartGasService.cancelScheduledTransaction(req.params.id);

        if (!success) {
            return res.status(404).json({ error: 'Transaction not found or already processed' });
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get gas savings stats
router.get('/savings', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const stats = await smartGasService.getGasSavingsStats(userId);

        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
