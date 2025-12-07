/**
 * Market Data Routes - Real-time market data from CoinGecko/DefiLlama
 */

import { Router, Request, Response } from 'express';
import {
    coinGeckoService,
    defiLlamaService,
    gasPriceService,
    airdropTrackerService,
    getMarketOverview
} from '../services/data-integrations.service';

const router = Router();

// Get market overview (trending, top coins, global data)
router.get('/overview', async (_req: Request, res: Response) => {
    try {
        const overview = await getMarketOverview();
        res.json(overview);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get top coins by market cap
router.get('/coins', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;
        const coins = await coinGeckoService.getTopCoins(limit);
        res.json({ coins });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific coin price
router.get('/coins/:coinId', async (req: Request, res: Response) => {
    try {
        const coin = await coinGeckoService.getCoinPrice(req.params.coinId);
        if (!coin) {
            return res.status(404).json({ error: 'Coin not found' });
        }
        res.json(coin);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get trending coins
router.get('/trending', async (_req: Request, res: Response) => {
    try {
        const trending = await coinGeckoService.getTrendingCoins();
        res.json({ trending });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get global market data
router.get('/global', async (_req: Request, res: Response) => {
    try {
        const global = await coinGeckoService.getGlobalData();
        res.json(global);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get DeFi protocols
router.get('/protocols', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const protocols = await defiLlamaService.getTopProtocols(limit);
        res.json({ protocols });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get yield opportunities
router.get('/yields', async (req: Request, res: Response) => {
    try {
        const chain = req.query.chain as string;
        const yields = await defiLlamaService.getYields(chain);
        res.json({ yields });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get total DeFi TVL
router.get('/tvl', async (_req: Request, res: Response) => {
    try {
        const tvl = await defiLlamaService.getTVL();
        res.json({ tvl, formatted: `$${(tvl / 1e9).toFixed(2)}B` });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get gas prices
router.get('/gas/:chainId?', async (req: Request, res: Response) => {
    try {
        const chainId = parseInt(req.params.chainId) || 1;
        const prices = await gasPriceService.getGasPrices(chainId);
        res.json(prices);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Estimate gas cost
router.post('/gas/estimate', async (req: Request, res: Response) => {
    try {
        const { gasLimit, chainId } = req.body;
        const estimate = await gasPriceService.estimateGasCost(
            gasLimit || 21000,
            chainId || 1
        );
        res.json(estimate);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get active airdrops (real data)
router.get('/airdrops', async (_req: Request, res: Response) => {
    try {
        const airdrops = await airdropTrackerService.getActiveAirdrops();
        res.json({ airdrops });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get farming opportunities (real data)
router.get('/farming', async (_req: Request, res: Response) => {
    try {
        const opportunities = await airdropTrackerService.getFarmingOpportunities();
        res.json({ opportunities });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
