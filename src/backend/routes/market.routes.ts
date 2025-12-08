import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { moralis } from '../services/moralis.service';
import axios from 'axios';

const router = Router();

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const PENDLE_API = 'https://api-v2.pendle.finance/core';

router.post('/prices', async (req: Request, res: Response) => {
  try {
    const { tokens, chainId = 1 } = req.body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ error: 'tokens array required' });
    }

    const prices: Record<string, any> = {};

    const nativeTokens = ['eth', 'ethereum', 'matic', 'polygon', 'bnb', 'avax'];
    const nativeAddresses = tokens.filter((t: string) => 
      nativeTokens.includes(t.toLowerCase()) || t === '0x0000000000000000000000000000000000000000'
    );
    const tokenAddresses = tokens.filter((t: string) => 
      t.startsWith('0x') && t !== '0x0000000000000000000000000000000000000000'
    );

    if (nativeAddresses.length > 0) {
      try {
        const ids = nativeAddresses.map((t: string) => {
          const lower = t.toLowerCase();
          if (lower === 'eth' || lower === 'ethereum') return 'ethereum';
          if (lower === 'matic' || lower === 'polygon') return 'matic-network';
          if (lower === 'bnb') return 'binancecoin';
          if (lower === 'avax') return 'avalanche-2';
          return 'ethereum';
        });

        const cgResponse = await axios.get(`${COINGECKO_API}/simple/price`, {
          params: {
            ids: [...new Set(ids)].join(','),
            vs_currencies: 'usd',
            include_24hr_change: true,
            include_market_cap: true,
          },
        });

        nativeAddresses.forEach((addr: string) => {
          const lower = addr.toLowerCase();
          let id = 'ethereum';
          if (lower === 'matic' || lower === 'polygon') id = 'matic-network';
          if (lower === 'bnb') id = 'binancecoin';
          if (lower === 'avax') id = 'avalanche-2';

          if (cgResponse.data[id]) {
            prices[addr] = {
              address: addr,
              price: cgResponse.data[id].usd,
              priceChange24h: cgResponse.data[id].usd_24h_change,
              marketCap: cgResponse.data[id].usd_market_cap,
              source: 'coingecko',
            };
          }
        });
      } catch (error: any) {
        logger.error('CoinGecko native price error:', error.message);
      }
    }

    for (const tokenAddress of tokenAddresses) {
      try {
        const price = await moralis.getTokenPrice(tokenAddress, chainId);
        prices[tokenAddress] = {
          address: tokenAddress,
          symbol: price.symbol,
          name: price.name,
          price: price.usdPrice,
          priceChange24h: price.priceChange24h,
          exchange: price.exchangeName,
          source: 'moralis',
        };
      } catch (error) {
        logger.error(`Failed to get price for ${tokenAddress}`);
        prices[tokenAddress] = {
          address: tokenAddress,
          price: null,
          error: 'Price not available',
        };
      }
    }

    res.json({ prices });
  } catch (error) {
    logger.error('Get market prices error:', error);
    res.status(500).json({ error: 'Failed to get market prices' });
  }
});

router.get('/trending', async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(`${COINGECKO_API}/search/trending`);

    const trending = response.data.coins?.map((item: any) => ({
      id: item.item.id,
      name: item.item.name,
      symbol: item.item.symbol,
      thumb: item.item.thumb,
      marketCapRank: item.item.market_cap_rank,
      priceChange24h: item.item.data?.price_change_percentage_24h?.usd,
      price: item.item.data?.price,
    }));

    res.json({ trending });
  } catch (error: any) {
    logger.error('Get trending error:', error.message);
    res.status(500).json({ error: 'Failed to get trending tokens' });
  }
});

router.get('/pendle/markets', async (req: Request, res: Response) => {
  try {
    const { chainId = 1 } = req.query;

    const response = await axios.get(`${PENDLE_API}/v1/${chainId}/markets`);

    const markets = response.data.results?.map((market: any) => ({
      address: market.address,
      name: market.name,
      symbol: market.symbol,
      expiry: market.expiry,
      pt: {
        address: market.pt?.address,
        name: market.pt?.name,
        symbol: market.pt?.symbol,
      },
      yt: {
        address: market.yt?.address,
        name: market.yt?.name,
        symbol: market.yt?.symbol,
      },
      sy: {
        address: market.sy?.address,
        name: market.sy?.name,
        symbol: market.sy?.symbol,
      },
      underlyingAsset: market.underlyingAsset,
      impliedApy: market.impliedApy,
      ptDiscount: market.ptDiscount,
      liquidity: market.liquidity?.usd,
      volume24h: market.tradingVolume?.usd,
    }));

    res.json({ markets: markets || [] });
  } catch (error: any) {
    logger.error('Get Pendle markets error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get Pendle markets' });
  }
});

router.post('/pendle/positions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { address, chainId = 1 } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'address required' });
    }

    const response = await axios.get(`${PENDLE_API}/v1/${chainId}/users/${address}/active-positions`);

    const positions = response.data.results?.map((pos: any) => ({
      market: pos.market?.address,
      marketName: pos.market?.name,
      ptBalance: pos.pt?.balance,
      ptValue: pos.pt?.value?.usd,
      ytBalance: pos.yt?.balance,
      ytValue: pos.yt?.value?.usd,
      lpBalance: pos.lp?.balance,
      lpValue: pos.lp?.value?.usd,
      totalValue: pos.totalValue?.usd,
      unrealizedPnl: pos.unrealizedPnl?.usd,
      expiry: pos.market?.expiry,
    }));

    res.json({ positions: positions || [] });
  } catch (error: any) {
    logger.error('Get Pendle positions error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get Pendle positions' });
  }
});

router.post('/pendle/hosted-sdk', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { method, params, chainId = 1 } = req.body;

    if (!method) {
      return res.status(400).json({ error: 'method required' });
    }

    const endpoints: Record<string, string> = {
      'getMarketData': `/v1/${chainId}/markets`,
      'getSwapTokensForPt': `/v1/${chainId}/swap/tokens-for-pt`,
      'getSwapPtForTokens': `/v1/${chainId}/swap/pt-for-tokens`,
      'getAddLiquidity': `/v1/${chainId}/add-liquidity`,
      'getRemoveLiquidity': `/v1/${chainId}/remove-liquidity`,
    };

    const endpoint = endpoints[method];
    if (!endpoint) {
      return res.status(400).json({ error: `Unknown method: ${method}` });
    }

    const isPost = method.includes('Swap') || method.includes('Liquidity');
    
    const response = isPost
      ? await axios.post(`${PENDLE_API}${endpoint}`, params)
      : await axios.get(`${PENDLE_API}${endpoint}`, { params });

    res.json({ result: response.data });
  } catch (error: any) {
    logger.error('Pendle SDK proxy error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to call Pendle SDK' });
  }
});

router.get('/gas', async (req: Request, res: Response) => {
  try {
    const { chainId = 1 } = req.query;

    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
    
    if (etherscanApiKey && chainId == 1) {
      const response = await axios.get('https://api.etherscan.io/api', {
        params: {
          module: 'gastracker',
          action: 'gasoracle',
          apikey: etherscanApiKey,
        },
      });

      if (response.data.status === '1') {
        return res.json({
          chainId: 1,
          unit: 'gwei',
          low: parseFloat(response.data.result.SafeGasPrice),
          average: parseFloat(response.data.result.ProposeGasPrice),
          high: parseFloat(response.data.result.FastGasPrice),
          baseFee: parseFloat(response.data.result.suggestBaseFee),
          timestamp: new Date().toISOString(),
        });
      }
    }

    res.json({
      chainId: Number(chainId),
      unit: 'gwei',
      low: 20,
      average: 30,
      high: 50,
      timestamp: new Date().toISOString(),
      source: 'estimate',
    });
  } catch (error) {
    logger.error('Get gas error:', error);
    res.status(500).json({ error: 'Failed to get gas prices' });
  }
});

// GET /api/market/search - Search for tokens (public)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, query } = req.query;
    const searchQuery = (q || query || '') as string;

    if (!searchQuery || searchQuery.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const response = await axios.get(`${COINGECKO_API}/search`, {
      params: { query: searchQuery },
    });

    const coins = response.data.coins?.slice(0, 20).map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      thumb: coin.thumb,
      marketCapRank: coin.market_cap_rank,
    })) || [];

    res.json({ results: coins, query: searchQuery });
  } catch (error: any) {
    logger.error('Search tokens error:', error.message);
    res.status(500).json({ error: 'Failed to search tokens' });
  }
});

// GET /api/market/token/:id - Get token details (public)
router.get('/token/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const response = await axios.get(`${COINGECKO_API}/coins/${id}`, {
      params: {
        localization: false,
        tickers: false,
        community_data: false,
        developer_data: false,
        sparkline: false,
      },
    });

    const coin = response.data;
    
    res.json({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.image?.large,
      description: coin.description?.en?.substring(0, 500),
      marketData: {
        currentPrice: coin.market_data?.current_price?.usd,
        marketCap: coin.market_data?.market_cap?.usd,
        marketCapRank: coin.market_cap_rank,
        totalVolume: coin.market_data?.total_volume?.usd,
        high24h: coin.market_data?.high_24h?.usd,
        low24h: coin.market_data?.low_24h?.usd,
        priceChange24h: coin.market_data?.price_change_percentage_24h,
        priceChange7d: coin.market_data?.price_change_percentage_7d,
        priceChange30d: coin.market_data?.price_change_percentage_30d,
        circulatingSupply: coin.market_data?.circulating_supply,
        totalSupply: coin.market_data?.total_supply,
        ath: coin.market_data?.ath?.usd,
        athDate: coin.market_data?.ath_date?.usd,
        atl: coin.market_data?.atl?.usd,
        atlDate: coin.market_data?.atl_date?.usd,
      },
      links: {
        homepage: coin.links?.homepage?.[0],
        twitter: coin.links?.twitter_screen_name ? `https://twitter.com/${coin.links.twitter_screen_name}` : null,
        telegram: coin.links?.telegram_channel_identifier ? `https://t.me/${coin.links.telegram_channel_identifier}` : null,
        reddit: coin.links?.subreddit_url,
        github: coin.links?.repos_url?.github?.[0],
      },
      categories: coin.categories,
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Token not found' });
    }
    logger.error('Get token details error:', error.message);
    res.status(500).json({ error: 'Failed to get token details' });
  }
});

// GET /api/market/stats - Global market stats (public)
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(`${COINGECKO_API}/global`);
    const data = response.data.data;

    res.json({
      totalMarketCap: data.total_market_cap?.usd,
      totalVolume24h: data.total_volume?.usd,
      marketCapChange24h: data.market_cap_change_percentage_24h_usd,
      btcDominance: data.market_cap_percentage?.btc,
      ethDominance: data.market_cap_percentage?.eth,
      activeCryptocurrencies: data.active_cryptocurrencies,
      upcomingIcos: data.upcoming_icos,
      ongoingIcos: data.ongoing_icos,
      endedIcos: data.ended_icos,
      markets: data.markets,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Get market stats error:', error.message);
    res.status(500).json({ error: 'Failed to get market stats' });
  }
});

// GET /api/market/price - Get simple price for multiple tokens (public)
router.get('/price', async (req: Request, res: Response) => {
  try {
    const { ids, vs_currencies = 'usd' } = req.query;

    if (!ids) {
      return res.status(400).json({ error: 'ids parameter required (comma-separated coin ids)' });
    }

    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids,
        vs_currencies,
        include_24hr_change: true,
        include_market_cap: true,
        include_24hr_vol: true,
      },
    });

    res.json(response.data);
  } catch (error: any) {
    logger.error('Get prices error:', error.message);
    res.status(500).json({ error: 'Failed to get prices' });
  }
});

export default router;
