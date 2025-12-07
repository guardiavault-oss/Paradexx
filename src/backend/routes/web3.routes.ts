import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { walletService } from '../services/wallet.service';

const router = Router();

router.use(authenticateToken);

router.post('/balance', async (req: Request, res: Response) => {
  try {
    const { address, chain } = req.body;

    if (!address || !chain) {
      return res.status(400).json({ error: 'Address and chain are required' });
    }

    const chainMap: Record<string, string> = {
      ethereum: 'ethereum',
      polygon: 'polygon',
      arbitrum: 'arbitrum',
      optimism: 'optimism',
      base: 'base',
    };

    const mappedChain = chainMap[chain.toLowerCase()] || 'ethereum';
    const balance = await walletService.getBalance(address, mappedChain);
    const balanceUSD = await walletService.getBalanceUSD(balance, mappedChain);

    res.json({
      balance: balance.toString(),
      chain: mappedChain,
      formatted: `${parseFloat(balance.toString()).toFixed(6)} ETH`,
      usd: balanceUSD,
    });
  } catch (error: any) {
    logger.error('Get balance error:', error);
    res.status(500).json({ error: error.message || 'Failed to get balance' });
  }
});

router.post('/transactions', async (req: Request, res: Response) => {
  try {
    const { address, network } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const chainMap: Record<string, string> = {
      mainnet: 'ethereum',
      ethereum: 'ethereum',
      polygon: 'polygon',
      arbitrum: 'arbitrum',
      optimism: 'optimism',
      base: 'base',
    };

    const mappedChain = chainMap[network?.toLowerCase()] || 'ethereum';
    const transactions = await walletService.getTransactions(address, mappedChain);

    res.json({ transactions });
  } catch (error: any) {
    logger.error('Get transactions error:', error);
    res.status(500).json({ error: error.message || 'Failed to get transactions' });
  }
});

router.post('/token-balances', async (req: Request, res: Response) => {
  try {
    const { address, chain } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const chainMap: Record<string, string> = {
      eth: 'ethereum',
      ethereum: 'ethereum',
      polygon: 'polygon',
      arbitrum: 'arbitrum',
      optimism: 'optimism',
      base: 'base',
    };

    const mappedChain = chainMap[chain?.toLowerCase()] || 'ethereum';
    const tokens = await walletService.getTokens(address, mappedChain);

    res.json({ balances: tokens });
  } catch (error: any) {
    logger.error('Get token balances error:', error);
    res.status(500).json({ error: error.message || 'Failed to get token balances' });
  }
});

router.post('/nfts', async (req: Request, res: Response) => {
  try {
    const { address, chain } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const chainMap: Record<string, string> = {
      eth: 'ethereum',
      ethereum: 'ethereum',
      polygon: 'polygon',
      arbitrum: 'arbitrum',
      optimism: 'optimism',
      base: 'base',
    };

    const mappedChain = chainMap[chain?.toLowerCase()] || 'ethereum';

    let nfts: any[] = [];
    try {
      if ((walletService as any).getNFTs) {
        nfts = await (walletService as any).getNFTs(address, mappedChain);
      }
    } catch (e) {
      logger.warn('NFT fetching not supported:', e);
    }

    res.json({ nfts });
  } catch (error: any) {
    logger.error('Get NFTs error:', error);
    res.status(500).json({ error: error.message || 'Failed to get NFTs' });
  }
});

router.post('/portfolio', async (req: Request, res: Response) => {
  try {
    const { address, chainId } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const chainIdToChain: Record<number, string> = {
      1: 'ethereum',
      137: 'polygon',
      42161: 'arbitrum',
      10: 'optimism',
      8453: 'base',
    };

    const chain = chainIdToChain[chainId] || 'ethereum';

    const balance = await walletService.getBalance(address, chain);
    const tokens = await walletService.getTokens(address, chain);

    let nfts: any[] = [];
    try {
      if ((walletService as any).getNFTs) {
        nfts = await (walletService as any).getNFTs(address, chain);
      }
    } catch (e) {
      logger.warn('NFT fetching not supported:', e);
    }

    const totalValue = parseFloat(balance.toString()) * 2000 +
      tokens.reduce((sum: number, t: any) => sum + (t.value || 0), 0);

    res.json({
      totalValue,
      tokens,
      nfts,
      chains: [chain],
    });
  } catch (error: any) {
    logger.error('Get portfolio error:', error);
    res.status(500).json({ error: error.message || 'Failed to get portfolio' });
  }
});

export default router;
