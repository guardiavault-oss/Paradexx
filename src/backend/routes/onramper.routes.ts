import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import onramperService from '../services/onramper.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/onramper/status
 * Get Onramper service status and configuration
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = onramperService.getStatus();
    res.json(status);
  } catch (error: any) {
    logger.error('[Onramper Routes] Error getting status:', error);
    res.status(500).json({
      error: 'Failed to get Onramper status',
      message: error.message,
    });
  }
});

/**
 * GET /api/onramper/fiat-currencies
 * Get available fiat currencies
 */
router.get('/fiat-currencies', async (req: Request, res: Response) => {
  try {
    const currencies = await onramperService.getFiatCurrencies();
    res.json({ currencies });
  } catch (error: any) {
    logger.error('[Onramper Routes] Error getting fiat currencies:', error);
    res.status(500).json({
      error: 'Failed to get fiat currencies',
      message: error.message,
    });
  }
});

/**
 * GET /api/onramper/crypto-currencies
 * Get available crypto currencies
 */
router.get('/crypto-currencies', async (req: Request, res: Response) => {
  try {
    const currencies = await onramperService.getCryptoCurrencies();
    res.json({ currencies });
  } catch (error: any) {
    logger.error('[Onramper Routes] Error getting crypto currencies:', error);
    res.status(500).json({
      error: 'Failed to get crypto currencies',
      message: error.message,
    });
  }
});

/**
 * POST /api/onramper/quote
 * Get quote for fiat to crypto conversion
 * Body: { fiatCurrency, cryptoCurrency, amount, address, email? }
 */
router.post('/quote', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { fiatCurrency, cryptoCurrency, amount, address, email } = req.body;

    if (!fiatCurrency || !cryptoCurrency || !amount || !address) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['fiatCurrency', 'cryptoCurrency', 'amount', 'address'],
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than 0',
      });
    }

    const quote = await onramperService.getQuote({
      fiatCurrency,
      cryptoCurrency,
      amount,
      address,
      email,
    });

    if (!quote) {
      return res.status(404).json({
        error: 'No quotes available for this conversion',
      });
    }

    res.json({ quote });
  } catch (error: any) {
    logger.error('[Onramper Routes] Error getting quote:', error);
    res.status(500).json({
      error: 'Failed to get quote',
      message: error.message,
    });
  }
});

/**
 * GET /api/onramper/widget-url
 * Get widget URL for embedding
 * Query: { address, fiatCurrency?, cryptoCurrency?, email?, theme? }
 */
router.get('/widget-url', authenticateToken, (req: Request, res: Response) => {
  try {
    const { address, fiatCurrency, cryptoCurrency, email, theme } = req.query;

    if (!address) {
      return res.status(400).json({
        error: 'address query parameter is required',
      });
    }

    const widgetUrl = onramperService.getWidgetUrl({
      address: address as string,
      fiatCurrency: fiatCurrency as string | undefined,
      cryptoCurrency: cryptoCurrency as string | undefined,
      email: email as string | undefined,
      theme: (theme as 'light' | 'dark' | undefined) || 'dark',
    });

    res.json({ widgetUrl });
  } catch (error: any) {
    logger.error('[Onramper Routes] Error getting widget URL:', error);
    res.status(500).json({
      error: 'Failed to get widget URL',
      message: error.message,
    });
  }
});

/**
 * GET /api/onramper/transaction/:transactionId
 * Get transaction status
 */
router.get('/transaction/:transactionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({
        error: 'Transaction ID is required',
      });
    }

    const transaction = await onramperService.getTransactionStatus(transactionId);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
      });
    }

    res.json({ transaction });
  } catch (error: any) {
    logger.error('[Onramper Routes] Error getting transaction status:', error);
    res.status(500).json({
      error: 'Failed to get transaction status',
      message: error.message,
    });
  }
});

export default router;
