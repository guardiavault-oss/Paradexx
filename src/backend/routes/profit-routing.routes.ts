import { Router, Request, Response } from 'express';
import profitRoutingService from '../services/profit-routing.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/profit-routing/status
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = profitRoutingService.getStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/profit-routing/stats
 */
router.get('/stats', authenticateToken, (req: Request, res: Response) => {
  try {
    const stats = profitRoutingService.getStats();
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/profit-routing/transactions
 */
router.get('/transactions', authenticateToken, (req: Request, res: Response) => {
  try {
    const transactions = profitRoutingService.getAllTransactions();
    res.json({ transactions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/profit-routing/transaction/:id
 */
router.get('/transaction/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = profitRoutingService.getTransaction(id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/profit-routing/complete/:id
 * Mark a profit transaction as completed
 */
router.post('/complete/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { txHash } = req.body;

    if (!txHash) {
      return res.status(400).json({ error: 'txHash is required' });
    }

    const transaction = await profitRoutingService.completeTransaction(id, txHash);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
