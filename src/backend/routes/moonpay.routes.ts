import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { moonpay, MoonPayService } from '../services/moonpay.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/status', async (_req: Request, res: Response) => {
  try {
    const service = new MoonPayService();
    const isConfigured = service.isConfigured();
    
    res.json({
      configured: isConfigured,
      message: isConfigured 
        ? 'MoonPay is configured and ready' 
        : 'MoonPay API keys not configured. Set MOONPAY_API_KEY and MOONPAY_SECRET_KEY to enable fiat purchases.',
      provider: 'MoonPay',
      capabilities: isConfigured ? ['buy', 'sell', 'quote'] : []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to check MoonPay status' });
  }
});

router.get('/currencies', async (_req: Request, res: Response) => {
  try {
    const service = new MoonPayService();
    if (!service.isConfigured()) {
      return res.status(503).json({ 
        error: 'MoonPay not configured',
        message: 'Set MOONPAY_API_KEY and MOONPAY_SECRET_KEY environment variables'
      });
    }

    const currencies = await moonpay.getSupportedCurrencies();
    res.json({ currencies });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get currencies' });
  }
});

router.get('/quote', async (req: Request, res: Response) => {
  try {
    const { crypto, fiat, amount } = req.query;

    if (!crypto || !fiat || !amount) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        required: ['crypto', 'fiat', 'amount']
      });
    }

    const service = new MoonPayService();
    if (!service.isConfigured()) {
      return res.status(503).json({ 
        error: 'MoonPay not configured',
        message: 'Set MOONPAY_API_KEY and MOONPAY_SECRET_KEY environment variables'
      });
    }

    const quote = await moonpay.getBuyQuote(
      crypto as string,
      fiat as string,
      parseFloat(amount as string)
    );

    res.json({ quote });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get quote' });
  }
});

router.post('/buy-url', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { walletAddress, currencyCode, baseCurrencyCode, baseCurrencyAmount, email } = req.body;

    if (!walletAddress || !currencyCode) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        required: ['walletAddress', 'currencyCode']
      });
    }

    const service = new MoonPayService();
    if (!service.isConfigured()) {
      return res.status(503).json({ 
        error: 'MoonPay not configured',
        message: 'Set MOONPAY_API_KEY and MOONPAY_SECRET_KEY environment variables'
      });
    }

    const url = moonpay.generateBuyUrl({
      walletAddress,
      currencyCode,
      baseCurrencyCode,
      baseCurrencyAmount,
      email
    });

    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate buy URL' });
  }
});

router.post('/sell-url', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { walletAddress, currencyCode, baseCurrencyCode, email } = req.body;

    if (!walletAddress || !currencyCode) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        required: ['walletAddress', 'currencyCode']
      });
    }

    const service = new MoonPayService();
    if (!service.isConfigured()) {
      return res.status(503).json({ 
        error: 'MoonPay not configured',
        message: 'Set MOONPAY_API_KEY and MOONPAY_SECRET_KEY environment variables'
      });
    }

    const url = moonpay.generateSellUrl({
      walletAddress,
      currencyCode,
      baseCurrencyCode,
      email
    });

    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate sell URL' });
  }
});

router.get('/transaction/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const service = new MoonPayService();
    if (!service.isConfigured()) {
      return res.status(503).json({ 
        error: 'MoonPay not configured',
        message: 'Set MOONPAY_API_KEY and MOONPAY_SECRET_KEY environment variables'
      });
    }

    const transaction = await moonpay.getTransaction(id);
    res.json({ transaction });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get transaction' });
  }
});

router.get('/limits/:currency', async (req: Request, res: Response) => {
  try {
    const { currency } = req.params;
    const { baseCurrency } = req.query;

    const service = new MoonPayService();
    if (!service.isConfigured()) {
      return res.status(503).json({ 
        error: 'MoonPay not configured',
        message: 'Set MOONPAY_API_KEY and MOONPAY_SECRET_KEY environment variables'
      });
    }

    const limits = await moonpay.getCurrencyLimits(
      currency,
      (baseCurrency as string) || 'usd'
    );

    res.json({ limits });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get limits' });
  }
});

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['moonpay-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    const service = new MoonPayService();
    const isValid = service.verifyWebhookSignature(signature, JSON.stringify(req.body));

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    logger.info('[MoonPay Webhook]', req.body.type, req.body.data?.id);

    res.json({ received: true });
  } catch (error: any) {
    logger.error('[MoonPay Webhook Error]', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
