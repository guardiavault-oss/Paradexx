import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import axios from 'axios';

const router = Router();

// API Keys - check both possible env var names
const ONE_INCH_API_KEY = process.env.ONEINCH_API_KEY || process.env.ONE_INCH_API_KEY;
const CHANGENOW_API_KEY = process.env.CHANGENOW_API_KEY;
const PARASWAP_API = 'https://apiv5.paraswap.io';
const LIFI_API = 'https://li.quest/v1';
const ONEINCH_API = 'https://api.1inch.dev';
const CHANGENOW_API = 'https://api.changenow.io/v2';

// GET /api/swaps/tokens - Get supported tokens for a chain (public)
router.get('/tokens', async (req: Request, res: Response) => {
  try {
    const { chainId = '1' } = req.query;
    const chain = Number(chainId);
    
    const tokens = SWAP_TOKENS[chain] || SWAP_TOKENS[1];
    
    res.json({
      chainId: chain,
      tokens,
      count: tokens.length,
    });
  } catch (error) {
    logger.error('Get swap tokens error:', error);
    res.status(500).json({ error: 'Failed to get swap tokens' });
  }
});

// GET /api/swaps/quote - Get a quick swap quote (public)
router.get('/quote', async (req: Request, res: Response) => {
  try {
    const { from, to, amount, chainId = '1' } = req.query;

    if (!from || !to || !amount) {
      return res.status(400).json({
        error: 'Missing parameters',
        required: ['from', 'to', 'amount'],
        example: '/api/swaps/quote?from=ETH&to=USDC&amount=1&chainId=1',
      });
    }

    const chain = Number(chainId);
    const tokens = SWAP_TOKENS[chain] || SWAP_TOKENS[1];
    
    // Find tokens
    const fromToken = tokens.find(t => 
      t.symbol.toLowerCase() === (from as string).toLowerCase() ||
      t.address.toLowerCase() === (from as string).toLowerCase()
    );
    const toToken = tokens.find(t => 
      t.symbol.toLowerCase() === (to as string).toLowerCase() ||
      t.address.toLowerCase() === (to as string).toLowerCase()
    );

    if (!fromToken || !toToken) {
      return res.status(400).json({
        error: 'Token not found',
        supportedTokens: tokens.map(t => t.symbol),
      });
    }

    // Convert amount to wei
    const amountWei = BigInt(Math.floor(Number(amount) * Math.pow(10, fromToken.decimals))).toString();

    // Try to get quote from ParaSwap (free API)
    try {
      const paraswapResponse = await axios.get(`${PARASWAP_API}/prices`, {
        params: {
          srcToken: fromToken.address,
          destToken: toToken.address,
          amount: amountWei,
          srcDecimals: fromToken.decimals,
          destDecimals: toToken.decimals,
          side: 'SELL',
          network: chain,
        },
        timeout: 10000,
      });

      if (paraswapResponse.data?.priceRoute) {
        const route = paraswapResponse.data.priceRoute;
        const destAmount = Number(route.destAmount) / Math.pow(10, toToken.decimals);
        
        return res.json({
          from: fromToken.symbol,
          to: toToken.symbol,
          fromAmount: Number(amount),
          toAmount: destAmount,
          rate: destAmount / Number(amount),
          estimatedGas: route.gasCost,
          gasCostUSD: route.gasCostUSD,
          aggregator: 'paraswap',
          chainId: chain,
          route: route.bestRoute?.map((r: any) => r.exchange).join(' → '),
        });
      }
    } catch (error: any) {
      logger.error('ParaSwap quote error:', error.message);
    }

    // Fallback: return estimated quote based on mock rates
    const mockRates: Record<string, number> = {
      'ETH-USDC': 2400,
      'ETH-USDT': 2400,
      'USDC-ETH': 1/2400,
      'USDT-ETH': 1/2400,
      'WBTC-ETH': 15,
      'ETH-WBTC': 1/15,
      'MATIC-USDC': 0.85,
      'USDC-MATIC': 1/0.85,
    };

    const pair = `${fromToken.symbol}-${toToken.symbol}`;
    const rate = mockRates[pair] || 1;
    const toAmount = Number(amount) * rate;

    res.json({
      from: fromToken.symbol,
      to: toToken.symbol,
      fromAmount: Number(amount),
      toAmount,
      rate,
      estimatedGas: '150000',
      aggregator: 'estimate',
      chainId: chain,
      warning: 'This is an estimated quote. Actual rates may vary.',
    });
  } catch (error) {
    logger.error('Get swap quote error:', error);
    res.status(500).json({ error: 'Failed to get swap quote' });
  }
});

// Token lists by chain for the swap interface
const SWAP_TOKENS: Record<number, any[]> = {
  1: [
    { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, icon: '💵' },
    { symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, icon: '💵' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, icon: '₿' },
    { symbol: 'DAI', name: 'Dai', address: '0x6B175474E89094C44Da98b954EescdeCB5BE3d08', decimals: 18, icon: '🟡' },
    { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, icon: '🔗' },
    { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, icon: '🦄' },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, icon: '⟠' },
  ],
  137: [
    { symbol: 'MATIC', name: 'Polygon', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '🟣' },
    { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6, icon: '💵' },
    { symbol: 'USDT', name: 'Tether', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, icon: '💵' },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18, icon: '⟠' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8, icon: '₿' },
  ],
  42161: [
    { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, icon: '💵' },
    { symbol: 'USDT', name: 'Tether', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, icon: '💵' },
    { symbol: 'ARB', name: 'Arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, icon: '🔵' },
  ],
};

router.post('/aggregators', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      fromToken,
      toToken,
      amount,
      chainId = 1,
      userAddress,
      slippage = 1,
    } = req.body;

    if (!fromToken || !toToken || !amount) {
      return res.status(400).json({
        error: 'Missing parameters',
        required: ['fromToken', 'toToken', 'amount'],
      });
    }

    const quotes: any[] = [];

    try {
      const paraswapResponse = await axios.get(`${PARASWAP_API}/prices`, {
        params: {
          srcToken: fromToken,
          destToken: toToken,
          amount,
          srcDecimals: 18,
          destDecimals: 18,
          side: 'SELL',
          network: chainId,
        },
      });

      if (paraswapResponse.data?.priceRoute) {
        const route = paraswapResponse.data.priceRoute;
        quotes.push({
          aggregator: 'paraswap',
          name: 'ParaSwap',
          toAmount: route.destAmount,
          estimatedGas: route.gasCost,
          gasCostUSD: route.gasCostUSD,
          route: route.bestRoute?.map((r: any) => ({
            protocol: r.exchange,
            fromToken: r.srcToken,
            toToken: r.destToken,
            percentage: r.percent,
          })),
        });
      }
    } catch (error: any) {
      logger.error('ParaSwap quote error:', error.response?.data || error.message);
    }

    try {
      const lifiResponse = await axios.post(`${LIFI_API}/quote`, {
        fromChain: chainId,
        toChain: chainId,
        fromToken,
        toToken,
        fromAmount: amount,
        fromAddress: userAddress || '0x0000000000000000000000000000000000000000',
        slippage: slippage / 100,
      });

      if (lifiResponse.data) {
        const quote = lifiResponse.data;
        quotes.push({
          aggregator: 'lifi',
          name: 'LI.FI',
          toAmount: quote.estimate?.toAmount,
          estimatedGas: quote.estimate?.gasCosts?.[0]?.estimate,
          gasCostUSD: quote.estimate?.gasCosts?.[0]?.amountUSD,
          executionDuration: quote.estimate?.executionDuration,
          route: quote.includedSteps?.map((step: any) => ({
            protocol: step.toolDetails?.name,
            fromToken: step.action?.fromToken?.symbol,
            toToken: step.action?.toToken?.symbol,
            type: step.type,
          })),
        });
      }
    } catch (error: any) {
      logger.error('LI.FI quote error:', error.response?.data || error.message);
    }

    if (ONE_INCH_API_KEY) {
      try {
        const oneInchResponse = await axios.get(
          `https://api.1inch.dev/swap/v6.0/${chainId}/quote`,
          {
            params: {
              src: fromToken,
              dst: toToken,
              amount,
            },
            headers: {
              'Authorization': `Bearer ${ONE_INCH_API_KEY}`,
            },
          }
        );

        if (oneInchResponse.data) {
          quotes.push({
            aggregator: '1inch',
            name: '1inch',
            toAmount: oneInchResponse.data.toAmount,
            estimatedGas: oneInchResponse.data.gas,
            route: oneInchResponse.data.protocols?.flat(2)?.map((p: any) => ({
              protocol: p.name,
              fromToken: p.fromTokenAddress,
              toToken: p.toTokenAddress,
              percentage: p.part,
            })),
          });
        }
      } catch (error: any) {
        logger.error('1inch quote error:', error.response?.data || error.message);
      }
    }

    if (quotes.length === 0) {
      return res.status(503).json({
        error: 'No quotes available',
        message: 'Unable to get quotes from any aggregator',
      });
    }

    quotes.sort((a, b) => {
      const aAmount = BigInt(a.toAmount || '0');
      const bAmount = BigInt(b.toAmount || '0');
      return bAmount > aAmount ? 1 : -1;
    });

    res.json({
      quotes,
      bestQuote: quotes[0],
      parameters: {
        fromToken,
        toToken,
        amount,
        chainId,
        slippage,
      },
    });
  } catch (error) {
    logger.error('Get swap quotes error:', error);
    res.status(500).json({ error: 'Failed to get swap quotes' });
  }
});

router.post('/build-tx', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      aggregator,
      fromToken,
      toToken,
      amount,
      chainId = 1,
      userAddress,
      slippage = 1,
      destAddress,
    } = req.body;

    if (!aggregator || !fromToken || !toToken || !amount || !userAddress) {
      return res.status(400).json({
        error: 'Missing parameters',
        required: ['aggregator', 'fromToken', 'toToken', 'amount', 'userAddress'],
      });
    }

    if (aggregator === 'paraswap') {
      const priceResponse = await axios.get(`${PARASWAP_API}/prices`, {
        params: {
          srcToken: fromToken,
          destToken: toToken,
          amount,
          srcDecimals: 18,
          destDecimals: 18,
          side: 'SELL',
          network: chainId,
        },
      });

      const txResponse = await axios.post(`${PARASWAP_API}/transactions/${chainId}`, {
        srcToken: fromToken,
        destToken: toToken,
        srcAmount: amount,
        slippage: slippage * 100,
        priceRoute: priceResponse.data.priceRoute,
        userAddress,
        receiver: destAddress || userAddress,
      });

      return res.json({
        transaction: {
          to: txResponse.data.to,
          data: txResponse.data.data,
          value: txResponse.data.value,
          gasLimit: txResponse.data.gas,
          chainId,
        },
      });
    }

    if (aggregator === 'lifi') {
      const quoteResponse = await axios.post(`${LIFI_API}/quote`, {
        fromChain: chainId,
        toChain: chainId,
        fromToken,
        toToken,
        fromAmount: amount,
        fromAddress: userAddress,
        toAddress: destAddress || userAddress,
        slippage: slippage / 100,
      });

      return res.json({
        transaction: {
          to: quoteResponse.data.transactionRequest?.to,
          data: quoteResponse.data.transactionRequest?.data,
          value: quoteResponse.data.transactionRequest?.value,
          gasLimit: quoteResponse.data.transactionRequest?.gasLimit,
          chainId,
        },
      });
    }

    return res.status(400).json({ error: 'Unsupported aggregator' });
  } catch (error: any) {
    logger.error('Build swap tx error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to build swap transaction' });
  }
});

// GET /api/swaps/tokens - Get available tokens for swap (public)
router.get('/tokens', async (req: Request, res: Response) => {
  try {
    const { chainId = '1' } = req.query;
    const chain = parseInt(chainId as string, 10);

    const tokens = SWAP_TOKENS[chain] || SWAP_TOKENS[1];
    res.json({ tokens, chainId: chain });
  } catch (error: any) {
    logger.error('Get tokens error:', error);
    res.status(500).json({ error: 'Failed to get tokens' });
  }
});

// GET /api/swaps/quote - Get swap quote (public - for preview)
router.get('/quote', async (req: Request, res: Response) => {
  try {
    const { fromToken, toToken, amount, chainId = '1', slippage = '1' } = req.query;

    if (!fromToken || !toToken || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const chain = parseInt(chainId as string, 10);
    const slip = parseFloat(slippage as string);
    let quote = null;

    // Try 1inch first (best rates usually)
    if (ONE_INCH_API_KEY) {
      try {
        const response = await axios.get(`${ONEINCH_API}/swap/v6.0/${chain}/quote`, {
          params: {
            src: fromToken,
            dst: toToken,
            amount,
          },
          headers: {
            'Authorization': `Bearer ${ONE_INCH_API_KEY}`,
          },
        });

        if (response.data) {
          const tokens = SWAP_TOKENS[chain] || SWAP_TOKENS[1];
          const fromTokenInfo = tokens.find(t => t.address.toLowerCase() === (fromToken as string).toLowerCase());
          const toTokenInfo = tokens.find(t => t.address.toLowerCase() === (toToken as string).toLowerCase());

          quote = {
            fromToken: fromTokenInfo || { address: fromToken, symbol: 'UNKNOWN', decimals: 18 },
            toToken: toTokenInfo || { address: toToken, symbol: 'UNKNOWN', decimals: 18 },
            fromAmount: amount,
            toAmount: response.data.toAmount,
            exchangeRate: parseFloat(response.data.toAmount) / parseFloat(amount as string),
            estimatedGas: response.data.gas,
            priceImpact: 0, // 1inch doesn't return this directly
            slippage: slip,
            protocols: response.data.protocols?.flat(2)?.map((p: any) => p.name) || ['1inch'],
            source: '1inch',
          };
        }
      } catch (error: any) {
        logger.warn('1inch quote failed:', error.response?.data || error.message);
      }
    }

    // Fallback to ParaSwap
    if (!quote) {
      try {
        const response = await axios.get(`${PARASWAP_API}/prices`, {
          params: {
            srcToken: fromToken,
            destToken: toToken,
            amount,
            srcDecimals: 18,
            destDecimals: 18,
            side: 'SELL',
            network: chain,
          },
        });

        if (response.data?.priceRoute) {
          const route = response.data.priceRoute;
          quote = {
            fromToken: { address: fromToken, symbol: route.srcToken, decimals: route.srcDecimals },
            toToken: { address: toToken, symbol: route.destToken, decimals: route.destDecimals },
            fromAmount: amount,
            toAmount: route.destAmount,
            exchangeRate: parseFloat(route.destAmount) / parseFloat(amount as string),
            estimatedGas: route.gasCost,
            estimatedGasUSD: route.gasCostUSD,
            priceImpact: route.priceImpact || 0,
            slippage: slip,
            protocols: route.bestRoute?.map((r: any) => r.exchange) || ['ParaSwap'],
            source: 'paraswap',
          };
        }
      } catch (error: any) {
        logger.warn('ParaSwap quote failed:', error.response?.data || error.message);
      }
    }

    if (!quote) {
      return res.status(503).json({ error: 'Unable to get quote from any provider' });
    }

    res.json({ quote });
  } catch (error: any) {
    logger.error('Get quote error:', error);
    res.status(500).json({ error: 'Failed to get swap quote' });
  }
});

// POST /api/swaps/execute - Execute swap with 1inch (authenticated)
router.post('/execute', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { fromToken, toToken, amount, chainId = 1, userAddress, slippage = 1 } = req.body;

    if (!fromToken || !toToken || !amount || !userAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!ONE_INCH_API_KEY) {
      return res.status(503).json({ error: '1inch API not configured' });
    }

    // Get swap transaction from 1inch
    const response = await axios.get(`${ONEINCH_API}/swap/v6.0/${chainId}/swap`, {
      params: {
        src: fromToken,
        dst: toToken,
        amount,
        from: userAddress,
        slippage,
        disableEstimate: false,
        allowPartialFill: false,
      },
      headers: {
        'Authorization': `Bearer ${ONE_INCH_API_KEY}`,
      },
    });

    if (!response.data?.tx) {
      return res.status(503).json({ error: 'Failed to build swap transaction' });
    }

    res.json({
      transaction: {
        to: response.data.tx.to,
        data: response.data.tx.data,
        value: response.data.tx.value,
        gasLimit: response.data.tx.gas,
        gasPrice: response.data.tx.gasPrice,
        chainId,
      },
      quote: {
        fromAmount: amount,
        toAmount: response.data.toAmount,
        fromToken: response.data.srcToken,
        toToken: response.data.dstToken,
      },
    });
  } catch (error: any) {
    logger.error('Execute swap error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to execute swap' });
  }
});

export default router;
