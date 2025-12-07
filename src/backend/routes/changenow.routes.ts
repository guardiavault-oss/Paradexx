import { Router, Request, Response } from 'express';
import changenowService from '../services/changenow.service';
import profitRoutingService from '../services/profit-routing.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/changenow/status
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = changenowService.getStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/changenow/currencies
 */
router.get('/currencies', async (req: Request, res: Response) => {
  try {
    const currencies = await changenowService.getAvailableCurrencies();
    res.json({ currencies });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/changenow/quote
 */
router.post('/quote', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { from, to, amount, address } = req.body;

    if (!from || !to || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: from, to, amount',
      });
    }

    const quote = await changenowService.getQuote({
      from,
      to,
      amount,
      address,
    });

    if (!quote) {
      return res.status(404).json({ error: 'No quote available' });
    }

    res.json({ quote });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/changenow/exchange
 */
router.post('/exchange', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { from, to, amount, address } = req.body;

    if (!from || !to || !amount || !address) {
      return res.status(400).json({
        error: 'Missing required fields: from, to, amount, address',
      });
    }

    const transaction = await changenowService.createExchange({
      from,
      to,
      amount,
      address,
    });

    if (!transaction) {
      return res.status(500).json({ error: 'Failed to create exchange' });
    }

    // Route profit if configured
    if (profitRoutingService.isConfigured()) {
      await profitRoutingService.routeSwapProfit({
        amount: amount * 0.01, // 1% fee example
        currency: from,
        metadata: {
          exchangeId: transaction.id,
          fromCurrency: from,
          toCurrency: to,
        },
      });
    }

    res.json({ transaction });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/changenow/transaction/:id
 */
router.get('/transaction/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await changenowService.getTransactionStatus(id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
