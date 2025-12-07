import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireDegenXSubscription, requireDegenXElite } from '../middleware/subscription.middleware';
import { mevGuardService } from '../services/mev-guard.service';

const router = Router();

router.use(authenticateToken);

const requireProTier = requireDegenXSubscription('basic');
const requireEliteTier = requireDegenXElite;

router.get('/status', async (req: Request, res: Response) => {
  try {
    const health = await mevGuardService.checkHealth();
    const mempoolStats = mevGuardService.getMempoolStats();
    
    res.json({
      connected: mevGuardService.isConnectedToApi(),
      tier: mevGuardService.getTier(),
      health,
      mempool: {
        active: mevGuardService.isMempoolMonitorActive(),
        stats: mempoolStats,
      },
    });
  } catch (error: unknown) {
    logger.error('MEV Guard status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get MEV Guard status';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/protect', requireProTier, async (req: Request, res: Response) => {
  try {
    const { fromAddress, toAddress, value, data, gasPrice, chainId, protectionLevel } = req.body;

    if (!fromAddress || !toAddress || !value || !gasPrice || !chainId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await mevGuardService.protectTransaction({
      fromAddress,
      toAddress,
      value,
      data,
      gasPrice,
      chainId,
      protectionLevel: protectionLevel || 'standard',
    });

    res.json(result);
  } catch (error: unknown) {
    logger.error('MEV protection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to protect transaction';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { transactionHash, contractAddress, functionSignature, chainId } = req.body;

    if (!chainId) {
      return res.status(400).json({ error: 'Chain ID required' });
    }

    const result = await mevGuardService.analyzeMevExposure({
      transactionHash,
      contractAddress,
      functionSignature,
      chainId,
    });

    res.json(result);
  } catch (error: unknown) {
    logger.error('MEV analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze MEV exposure';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/detect/sandwich', requireProTier, async (req: Request, res: Response) => {
  try {
    const { targetTxHash, chainId, analysisWindow } = req.body;

    if (!targetTxHash || !chainId) {
      return res.status(400).json({ error: 'Transaction hash and chain ID required' });
    }

    const result = await mevGuardService.detectSandwichAttack({
      targetTxHash,
      chainId,
      analysisWindow,
    });

    res.json(result);
  } catch (error: unknown) {
    logger.error('Sandwich detection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to detect sandwich attack';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/flashbots/relay', requireEliteTier, async (req: Request, res: Response) => {
  try {
    const { transactions, targetBlock, minTimestamp, maxTimestamp } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Transactions array required' });
    }

    const result = await mevGuardService.relayViaFlashbots({
      transactions,
      targetBlock,
      minTimestamp,
      maxTimestamp,
    });

    res.json(result);
  } catch (error: unknown) {
    logger.error('Flashbots relay error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to relay via Flashbots';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/send-protected', requireProTier, async (req: Request, res: Response) => {
  try {
    const { signedTx, mode } = req.body;

    if (!signedTx) {
      return res.status(400).json({ error: 'Signed transaction required' });
    }

    const result = await mevGuardService.sendProtectedTransaction(signedTx, mode || 'fast');

    res.json(result);
  } catch (error: unknown) {
    logger.error('Send protected tx error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send protected transaction';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/preflight', async (req: Request, res: Response) => {
  try {
    const { to, value, data, from } = req.body;

    if (!to || !value) {
      return res.status(400).json({ error: 'Transaction to and value required' });
    }

    const result = await mevGuardService.preflightAnalysis({
      to,
      value,
      data: data || '0x',
      from,
    });

    res.json(result);
  } catch (error: unknown) {
    logger.error('Preflight analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to run preflight analysis';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/mempool/stats', async (req: Request, res: Response) => {
  try {
    // Get stats from both local monitor and unified system
    const localStats = mevGuardService.getMempoolStats();
    const recentAttacks = mevGuardService.getRecentSandwichAttacks(10);
    const assessment = mevGuardService.getMempoolRiskAssessment();

    // Try to get unified mempool stats
    const { unifiedMempoolService } = await import('../services/unified-mempool.service');
    let unifiedStats = null;
    try {
      unifiedStats = await unifiedMempoolService.getUnifiedStats();
    } catch (error) {
      logger.warn('[MEV Guard] Unified mempool service not available');
    }

    res.json({
      active: mevGuardService.isMempoolMonitorActive() || unifiedMempoolService.isConnectedToServices(),
      stats: localStats,
      recentAttacks,
      assessment,
      unified: unifiedStats,
    });
  } catch (error: unknown) {
    logger.error('Mempool stats error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get mempool stats';
    res.status(500).json({ error: errorMessage });
  }
});

// GET /api/mev-guard/mempool/transactions - Get pending transactions from mempool
router.get('/mempool/transactions', async (req: Request, res: Response) => {
  try {
    const { network, limit, offset, suspiciousOnly } = req.query;
    
    const { unifiedMempoolService } = await import('../services/unified-mempool.service');
    const transactions = await unifiedMempoolService.getTransactions({
      network: network as string,
      limit: limit ? parseInt(limit as string) : 100,
      offset: offset ? parseInt(offset as string) : 0,
      suspiciousOnly: suspiciousOnly === 'true',
    });

    res.json({
      transactions,
      count: transactions.length,
    });
  } catch (error: unknown) {
    logger.error('Mempool transactions error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get mempool transactions';
    res.status(500).json({ error: errorMessage });
  }
});

// GET /api/mev-guard/mempool/threats - Get detected threats
router.get('/mempool/threats', async (req: Request, res: Response) => {
  try {
    const { limit, severity, network } = req.query;
    
    const { unifiedMempoolService } = await import('../services/unified-mempool.service');
    const threats = await unifiedMempoolService.getThreats({
      limit: limit ? parseInt(limit as string) : 50,
      severity: severity as string,
      network: network as string,
    });

    res.json({
      threats,
      count: threats.length,
    });
  } catch (error: unknown) {
    logger.error('Mempool threats error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get mempool threats';
    res.status(500).json({ error: errorMessage });
  }
});

// GET /api/mev-guard/mempool/networks/:network/stats - Get network-specific stats
router.get('/mempool/networks/:network/stats', async (req: Request, res: Response) => {
  try {
    const { network } = req.params;
    
    const { unifiedMempoolService } = await import('../services/unified-mempool.service');
    const stats = await unifiedMempoolService.getNetworkStats(network);

    if (!stats) {
      return res.status(404).json({ error: 'Network stats not available' });
    }

    res.json(stats);
  } catch (error: unknown) {
    logger.error('Network stats error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get network stats';
    res.status(500).json({ error: errorMessage });
  }
});

// POST /api/mev-guard/mempool/analyze - Analyze a transaction
router.post('/mempool/analyze', async (req: Request, res: Response) => {
  try {
    const { txHash, network } = req.body;

    if (!txHash || !network) {
      return res.status(400).json({ error: 'Transaction hash and network required' });
    }

    const { unifiedMempoolService } = await import('../services/unified-mempool.service');
    const analysis = await unifiedMempoolService.analyzeTransaction(txHash, network);

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not available' });
    }

    res.json(analysis);
  } catch (error: unknown) {
    logger.error('Transaction analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze transaction';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/mev-bots', requireProTier, async (req: Request, res: Response) => {
  try {
    const bots = await mevGuardService.getMevBots();
    res.json(bots);
  } catch (error: unknown) {
    logger.error('MEV bots error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get MEV bots';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await mevGuardService.getStats();
    res.json(stats);
  } catch (error: unknown) {
    logger.error('Stats error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get stats';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/kpi', requireEliteTier, async (req: Request, res: Response) => {
  try {
    const kpi = await mevGuardService.getKpiMetrics();
    if (!kpi) {
      return res.status(503).json({ error: 'KPI metrics unavailable - MEV Guard API not connected' });
    }
    res.json(kpi);
  } catch (error: unknown) {
    logger.error('KPI metrics error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get KPI metrics';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/builders', requireEliteTier, async (req: Request, res: Response) => {
  try {
    const status = await mevGuardService.getBuilderStatus();
    if (!status) {
      return res.status(503).json({ error: 'Builder status unavailable - MEV Guard API not connected' });
    }
    res.json(status);
  } catch (error: unknown) {
    logger.error('Builder status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get builder status';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/relays', requireEliteTier, async (req: Request, res: Response) => {
  try {
    const status = await mevGuardService.getRelayStatus();
    if (!status) {
      return res.status(503).json({ error: 'Relay status unavailable - MEV Guard API not connected' });
    }
    res.json(status);
  } catch (error: unknown) {
    logger.error('Relay status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get relay status';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
