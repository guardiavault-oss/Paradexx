/**
 * Trading Routes - Limit orders, DCA, and advanced trading
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { limitOrdersService } from '../services/limit-orders.service';
import { dcaBotService } from '../services/dca-bot.service';

const router = Router();

// ============== LIMIT ORDERS ==============

// Create limit order
router.post('/orders', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { chainId, type, tokenIn, tokenOut, amountIn, triggerPrice, limitPrice, slippage, expiresIn } = req.body;

        if (!chainId || !type || !tokenIn || !tokenOut || !amountIn || !triggerPrice) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const order = await limitOrdersService.createLimitOrder({
            userId,
            chainId,
            type,
            tokenIn,
            tokenOut,
            amountIn,
            triggerPrice,
            limitPrice,
            slippage,
            expiresIn,
        });

        res.json({ order });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create OCO (One-Cancels-Other) order
router.post('/orders/oco', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { chainId, tokenIn, tokenOut, amountIn, takeProfitPrice, stopLossPrice, slippage } = req.body;

        if (!chainId || !tokenIn || !tokenOut || !amountIn || !takeProfitPrice || !stopLossPrice) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const orders = await limitOrdersService.createOCOOrder({
            userId,
            chainId,
            tokenIn,
            tokenOut,
            amountIn,
            takeProfitPrice,
            stopLossPrice,
            slippage,
        });

        res.json({ orders });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create trailing stop order
router.post('/orders/trailing-stop', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { chainId, tokenIn, tokenOut, amountIn, trailingPercent, slippage } = req.body;

        if (!chainId || !tokenIn || !tokenOut || !amountIn || !trailingPercent) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const order = await limitOrdersService.createTrailingStop({
            userId,
            chainId,
            tokenIn,
            tokenOut,
            amountIn,
            trailingPercent,
            slippage,
        });

        res.json({ order });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's orders
router.get('/orders', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { status } = req.query;

        const orders = limitOrdersService.getOrders(userId, status as any);
        res.json({ orders });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel order
router.delete('/orders/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const success = limitOrdersService.cancelOrder(req.params.id, userId);

        if (!success) {
            return res.status(404).json({ error: 'Order not found or cannot be cancelled' });
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get order stats
router.get('/orders/stats', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const stats = limitOrdersService.getOrderStats(userId);
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============== PRICE ALERTS ==============

router.post('/alerts', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { tokenAddress, tokenSymbol, targetPrice, direction } = req.body;

        const alert = await limitOrdersService.createPriceAlert({
            userId,
            tokenAddress,
            tokenSymbol,
            targetPrice,
            direction,
        });

        res.json({ alert });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/alerts', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const alerts = limitOrdersService.getPriceAlerts(userId);
        res.json({ alerts });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/alerts/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const success = limitOrdersService.deletePriceAlert(req.params.id);
        res.json({ success });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============== DCA BOT ==============

// Create DCA plan
router.post('/dca', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { chainId, tokenAddress, tokenSymbol, sourceToken, amountPerPurchase, frequency, strategy, totalBudget, endDate } = req.body;

        if (!chainId || !tokenAddress || !tokenSymbol || !amountPerPurchase || !frequency) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const plan = await dcaBotService.createPlan({
            userId,
            chainId,
            tokenAddress,
            tokenSymbol,
            sourceToken,
            amountPerPurchase,
            frequency,
            strategy,
            totalBudget,
            endDate: endDate ? new Date(endDate) : undefined,
        });

        res.json({ plan });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create quick DCA plan
router.post('/dca/quick', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { chainId, preset } = req.body;

        if (!chainId || !preset) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const plan = await dcaBotService.createQuickPlan(userId, chainId, preset);
        res.json({ plan });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's DCA plans
router.get('/dca', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { status } = req.query;

        const plans = dcaBotService.getPlans(userId, status as any);
        res.json({ plans });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get DCA plan stats
router.get('/dca/:id/stats', authenticateToken, async (req: Request, res: Response) => {
    try {
        const stats = dcaBotService.getPlanStats(req.params.id);

        if (!stats) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Pause DCA plan
router.post('/dca/:id/pause', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const success = dcaBotService.pausePlan(req.params.id, userId);

        if (!success) {
            return res.status(404).json({ error: 'Plan not found or cannot be paused' });
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Resume DCA plan
router.post('/dca/:id/resume', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const success = dcaBotService.resumePlan(req.params.id, userId);

        if (!success) {
            return res.status(404).json({ error: 'Plan not found or cannot be resumed' });
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel DCA plan
router.delete('/dca/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const success = dcaBotService.cancelPlan(req.params.id, userId);

        if (!success) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
