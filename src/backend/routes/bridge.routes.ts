// Bridge Routes - Cross-chain asset bridging
import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireDegenXElite } from '../middleware/subscription.middleware';
import { bridgeService, SupportedChain } from '../services/bridge.service';

const router = Router();

// All routes require authentication
router.use(authenticateToken as any);

// GET /api/bridge/chains - Get supported chains
router.get('/chains', async (req: Request, res: Response) => {
  try {
    const chains = bridgeService.getSupportedChains();
    
    const chainInfo = chains.map(chainId => ({
      chainId,
      name: getChainName(chainId),
      logo: getChainLogo(chainId),
    }));

    res.json(chainInfo);
  } catch (error: any) {
    logger.error('Get chains error:', error);
    res.status(500).json({ error: error.message || 'Failed to get chains' });
  }
});

// POST /api/bridge/quote - Get bridge quote
router.post('/quote', async (req: Request, res: Response) => {
  try {
    const { fromChain, toChain, fromToken, toToken, amount, recipient } = req.body;

    if (!fromChain || !toChain || !fromToken || !toToken || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const quote = await bridgeService.getBridgeQuote(
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      recipient || req.userId
    );

    res.json(quote);
  } catch (error: any) {
    logger.error('Bridge quote error:', error);
    res.status(500).json({ error: error.message || 'Failed to get bridge quote' });
  }
});

// POST /api/bridge/build - Build bridge transaction
router.post('/build', async (req: Request, res: Response) => {
  try {
    const { bridgeId, fromChain, toChain, fromToken, toToken, amount, recipient } = req.body;

    if (!bridgeId || !fromChain || !toChain || !fromToken || !toToken || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const transaction = await bridgeService.buildBridgeTransaction(
      bridgeId,
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      recipient || req.userId
    );

    res.json(transaction);
  } catch (error: any) {
    logger.error('Build bridge transaction error:', error);
    res.status(500).json({ error: error.message || 'Failed to build bridge transaction' });
  }
});

// GET /api/bridge/status/:bridgeId/:txHash - Get bridge status
router.get('/status/:bridgeId/:txHash', async (req: Request, res: Response) => {
  try {
    const { bridgeId, txHash } = req.params;

    const status = await bridgeService.getBridgeStatus(bridgeId, txHash);

    res.json(status);
  } catch (error: any) {
    logger.error('Bridge status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get bridge status' });
  }
});

// Helper functions
function getChainName(chainId: number): string {
  const names: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    56: 'BNB Chain',
    42161: 'Arbitrum',
    10: 'Optimism',
    43114: 'Avalanche',
    8453: 'Base',
    250: 'Fantom',
  };
  return names[chainId] || `Chain ${chainId}`;
}

function getChainLogo(chainId: number): string {
  const logos: Record<number, string> = {
    1: '⟠',
    137: '🔷',
    56: '🟡',
    42161: '🔵',
    10: '🔴',
    43114: '❄️',
    8453: '🔷',
    250: '👻',
  };
  return logos[chainId] || '⛓️';
}

export default router;

