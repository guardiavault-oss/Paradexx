import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { moonpay, MoonPayService } from '../services/moonpay.service';
import axios from 'axios';

const router = Router();

const ONRAMPER_API_KEY = process.env.ONRAMPER_API_KEY;

router.get('/providers', async (_req: Request, res: Response) => {
  try {
    const moonpayService = new MoonPayService();
    const moonpayConfigured = moonpayService.isConfigured();
    const onramperConfigured = !!ONRAMPER_API_KEY;

    const providers = [];

    if (moonpayConfigured) {
      providers.push({
        id: 'moonpay',
        name: 'MoonPay',
        logo: 'https://assets.moonpay.com/images/moonpay-logo.svg',
        supportedFiat: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
        supportedCrypto: ['ETH', 'BTC', 'USDC', 'USDT', 'DAI', 'MATIC'],
        paymentMethods: ['card', 'bank_transfer', 'apple_pay', 'google_pay'],
        fees: {
          percentage: 4.5,
          minimum: 3.99,
        },
        limits: {
          min: 30,
          max: 10000,
        },
        available: true,
      });
    }

    if (onramperConfigured) {
      providers.push({
        id: 'onramper',
        name: 'Onramper',
        logo: 'https://onramper.com/logo.svg',
        supportedFiat: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY'],
        supportedCrypto: ['ETH', 'BTC', 'USDC', 'USDT', 'DAI', 'MATIC', 'SOL', 'AVAX'],
        paymentMethods: ['card', 'bank_transfer'],
        fees: {
          percentage: 3.5,
          minimum: 1.99,
        },
        limits: {
          min: 20,
          max: 50000,
        },
        available: true,
      });
    }

    if (providers.length === 0) {
      return res.status(503).json({
        error: 'No fiat providers configured',
        message: 'Set MOONPAY_API_KEY or ONRAMPER_API_KEY to enable fiat purchases',
        providers: [],
      });
    }

    res.json({ providers });
  } catch (error) {
    logger.error('Get fiat providers error:', error);
    res.status(500).json({ error: 'Failed to get fiat providers' });
  }
});

router.post('/quote', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { provider, cryptoCurrency, fiatCurrency, fiatAmount, cryptoAmount, paymentMethod } = req.body;

    if (!cryptoCurrency || !fiatCurrency || (!fiatAmount && !cryptoAmount)) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        required: ['cryptoCurrency', 'fiatCurrency', 'fiatAmount or cryptoAmount'],
      });
    }

    const moonpayService = new MoonPayService();
    const useMoonpay = provider === 'moonpay' || (!provider && moonpayService.isConfigured());

    if (useMoonpay && moonpayService.isConfigured()) {
      try {
        const quote = await moonpay.getBuyQuote(
          cryptoCurrency.toLowerCase(),
          fiatCurrency.toLowerCase(),
          fiatAmount || 100
        );

        return res.json({
          provider: 'moonpay',
          quote: {
            cryptoCurrency,
            fiatCurrency,
            fiatAmount: quote.baseCurrencyAmount,
            cryptoAmount: quote.quoteCurrencyAmount,
            exchangeRate: quote.quoteCurrencyAmount / quote.baseCurrencyAmount,
            fees: {
              network: quote.networkFeeAmount || 0,
              provider: quote.feeAmount || 0,
              total: (quote.networkFeeAmount || 0) + (quote.feeAmount || 0),
            },
            expiresAt: new Date(Date.now() + 60000).toISOString(),
          },
        });
      } catch (error: any) {
        logger.error('MoonPay quote error:', error);
      }
    }

    if (ONRAMPER_API_KEY) {
      try {
        const response = await axios.get('https://api.onramper.com/quotes', {
          params: {
            source: fiatCurrency,
            destination: cryptoCurrency,
            amount: fiatAmount || 100,
          },
          headers: {
            'Authorization': `Bearer ${ONRAMPER_API_KEY}`,
          },
        });

        if (response.data && response.data.length > 0) {
          const bestQuote = response.data[0];
          return res.json({
            provider: 'onramper',
            quote: {
              cryptoCurrency,
              fiatCurrency,
              fiatAmount: bestQuote.sourceAmount,
              cryptoAmount: bestQuote.destinationAmount,
              exchangeRate: bestQuote.destinationAmount / bestQuote.sourceAmount,
              fees: {
                network: bestQuote.networkFee || 0,
                provider: bestQuote.processingFee || 0,
                total: (bestQuote.networkFee || 0) + (bestQuote.processingFee || 0),
              },
              expiresAt: new Date(Date.now() + 60000).toISOString(),
            },
          });
        }
      } catch (error: any) {
        logger.error('Onramper quote error:', error.response?.data || error.message);
      }
    }

    return res.status(503).json({
      error: 'Unable to get quote',
      message: 'No fiat provider available or configured',
    });
  } catch (error) {
    logger.error('Get fiat quote error:', error);
    res.status(500).json({ error: 'Failed to get quote' });
  }
});

router.post('/buy-url', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { provider, walletAddress, cryptoCurrency, fiatCurrency, fiatAmount } = req.body;

    if (!walletAddress || !cryptoCurrency) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        required: ['walletAddress', 'cryptoCurrency'],
      });
    }

    const moonpayService = new MoonPayService();
    
    if ((provider === 'moonpay' || !provider) && moonpayService.isConfigured()) {
      const url = moonpay.generateBuyUrl({
        walletAddress,
        currencyCode: cryptoCurrency.toLowerCase(),
        baseCurrencyCode: fiatCurrency?.toLowerCase() || 'usd',
        baseCurrencyAmount: fiatAmount,
      });

      return res.json({ url, provider: 'moonpay' });
    }

    if (ONRAMPER_API_KEY) {
      const params = new URLSearchParams({
        apiKey: ONRAMPER_API_KEY,
        mode: 'buy',
        defaultCrypto: cryptoCurrency,
        defaultFiat: fiatCurrency || 'USD',
        wallets: `${cryptoCurrency}:${walletAddress}`,
      });

      return res.json({
        url: `https://buy.onramper.com?${params.toString()}`,
        provider: 'onramper',
      });
    }

    return res.status(503).json({
      error: 'No fiat provider configured',
      message: 'Set MOONPAY_API_KEY or ONRAMPER_API_KEY to enable fiat purchases',
    });
  } catch (error) {
    logger.error('Generate buy URL error:', error);
    res.status(500).json({ error: 'Failed to generate buy URL' });
  }
});

export default router;
