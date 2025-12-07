import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireDegenXSubscription } from '../middleware/subscription.middleware';
import { sniperService } from '../services/sniper.service';
import { canMakeSniperTrade, recordSniperTrade } from '../services/premium-pass.service';

const router = Router();

router.use(authenticateToken);

const requireProTier = requireDegenXSubscription('basic');

router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = sniperService.getStatus();
    res.json({
      ...status,
      readOnly: !status.configured,
      message: status.configured 
        ? 'Sniper service is fully configured' 
        : 'Sniper is in read-only mode - configure SNIPER_PRIVATE_KEY for trading'
    });
  } catch (error: any) {
    logger.error('Sniper status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get sniper status' });
  }
});

router.get('/analyze/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token address required' });
    }

    const analysis = await sniperService.analyzeToken(token);
    res.json(analysis);
  } catch (error: any) {
    logger.error('Token analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze token' });
  }
});

router.get('/whales', async (req: Request, res: Response) => {
  try {
    const whales = sniperService.getTrackedWhales();
    res.json({
      count: whales.length,
      whales
    });
  } catch (error: any) {
    logger.error('Get whales error:', error);
    res.status(500).json({ error: error.message || 'Failed to get tracked whales' });
  }
});

router.post('/whales', async (req: Request, res: Response) => {
  try {
    const { address, label } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const whale = await sniperService.addWhale(address, label);
    res.json({
      success: true,
      whale
    });
  } catch (error: any) {
    logger.error('Add whale error:', error);
    res.status(500).json({ error: error.message || 'Failed to add whale' });
  }
});

router.delete('/whales/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const removed = await sniperService.removeWhale(address);
    
    res.json({
      success: removed,
      message: removed ? 'Whale removed' : 'Whale not found'
    });
  } catch (error: any) {
    logger.error('Remove whale error:', error);
    res.status(500).json({ error: error.message || 'Failed to remove whale' });
  }
});

router.get('/whales/activity', async (req: Request, res: Response) => {
  try {
    const { address, limit } = req.query;
    
    const activity = await sniperService.getWhaleActivity(
      address as string | undefined,
      parseInt(limit as string) || 50
    );
    
    res.json({
      count: activity.length,
      activity
    });
  } catch (error: any) {
    logger.error('Whale activity error:', error);
    res.status(500).json({ error: error.message || 'Failed to get whale activity' });
  }
});

router.get('/meme-hunter', async (req: Request, res: Response) => {
  try {
    const { minLiquidity, maxAge, limit } = req.query;
    
    const tokens = await sniperService.discoverMemeTokens({
      minLiquidity: parseFloat(minLiquidity as string) || undefined,
      maxAge: parseInt(maxAge as string) || undefined,
      limit: parseInt(limit as string) || 20
    });
    
    res.json({
      count: tokens.length,
      tokens
    });
  } catch (error: any) {
    logger.error('Meme hunter error:', error);
    res.status(500).json({ error: error.message || 'Failed to discover tokens' });
  }
});

router.post('/buy', requireProTier as any, async (req: Request, res: Response) => {
  try {
    const { tokenAddress, amountEth, slippage, gasMultiplier } = req.body;
    const userId = (req as any).userId;

    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address required' });
    }

    if (!amountEth || parseFloat(amountEth) <= 0) {
      return res.status(400).json({ error: 'Valid ETH amount required' });
    }

    // Check sniper trade limit (3/day for free tier, unlimited for Premium Pass)
    if (userId) {
      const tradeCheck = await canMakeSniperTrade(userId);
      if (!tradeCheck.allowed) {
        return res.status(403).json({
          error: 'Daily trade limit reached',
          message: `Free tier allows 3 sniper trades per day. You have ${tradeCheck.remaining} remaining. Upgrade to Premium Pass for unlimited trades.`,
          remaining: tradeCheck.remaining,
          upgradeUrl: '/premium/pass',
        });
      }
    }

    if (!sniperService.isConfigured()) {
      return res.status(400).json({ 
        error: 'Trading not available',
        message: 'Sniper is in read-only mode. Configure SNIPER_PRIVATE_KEY for trading.'
      });
    }

    const result = await sniperService.executeBuy(tokenAddress, amountEth, {
      slippage,
      gasMultiplier
    });

    // Record trade for limit tracking (if successful)
    if (result.success && userId) {
      try {
        const tradeValue = parseFloat(amountEth) * 2000; // Approximate USD value
        const feeAmount = (tradeValue * 0.01).toString(); // 1% fee
        await recordSniperTrade(userId, {
          tokenAddress,
          amount: amountEth,
          tradeValue: tradeValue.toString(),
          feeAmount,
        });
      } catch (error) {
        logger.error('Error recording sniper trade:', error);
        // Don't fail the request if recording fails
      }
    }

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    logger.error('Buy error:', error);
    res.status(500).json({ error: error.message || 'Failed to execute buy' });
  }
});

router.post('/sell', requireProTier as any, async (req: Request, res: Response) => {
  try {
    const { tokenAddress, amountPercent, slippage, gasMultiplier } = req.body;

    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address required' });
    }

    if (!sniperService.isConfigured()) {
      return res.status(400).json({ 
        error: 'Trading not available',
        message: 'Sniper is in read-only mode. Configure SNIPER_PRIVATE_KEY for trading.'
      });
    }

    const result = await sniperService.executeSell(tokenAddress, amountPercent || 100, {
      slippage,
      gasMultiplier
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    logger.error('Sell error:', error);
    res.status(500).json({ error: error.message || 'Failed to execute sell' });
  }
});

router.get('/positions', async (req: Request, res: Response) => {
  try {
    const positions = await sniperService.getPositions();
    res.json({
      count: positions.length,
      positions
    });
  } catch (error: any) {
    logger.error('Positions error:', error);
    res.status(500).json({ error: error.message || 'Failed to get positions' });
  }
});

router.get('/balance', async (req: Request, res: Response) => {
  try {
    if (!sniperService.isConfigured()) {
      return res.status(400).json({ 
        error: 'Wallet not configured',
        message: 'Configure SNIPER_PRIVATE_KEY to view balances'
      });
    }

    const balance = await sniperService.getBalance();
    res.json(balance);
  } catch (error: any) {
    logger.error('Balance error:', error);
    res.status(500).json({ error: error.message || 'Failed to get balance' });
  }
});

export default router;
