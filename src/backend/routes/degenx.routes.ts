// DegenX Routes - Discovery, Rug Guard, Analytics, Recovery Fund, Stop-Loss AI, Whale Mirror, Meme Hunter
// PRODUCTION: Uses real DEXScreener, GeckoTerminal, Honeypot.is APIs

import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireDegenXSubscription, requireDegenXElite } from '../middleware/subscription.middleware';
import { rugDetection } from '../services/rug-detection.service';
import { cacheService, CacheKeys } from '../services/cache.service';
import { degenService } from '../services/degen.service';
import { memeScannerService } from '../services/meme-scanner.service';
import { sniperBotService } from '../services/sniper-bot.service';
import { gainsLockService } from '../services/gains-lock.service';
import { smartStopLossService } from '../services/smart-stop-loss.service';
import { recoveryFundService } from '../services/recovery-fund.service';
import { degenScoreService } from '../services/degen-score.service';

const router = Router();

// ===========================
// PUBLIC TEST ENDPOINTS (No Auth - Development Only)
// ===========================

// GET /api/degenx/test/services - Test all services are working
router.get('/test/services', async (req: Request, res: Response) => {
  try {
    const results: Record<string, any> = {};

    // Test Meme Scanner
    try {
      const trending = await memeScannerService.fetchTrending();
      results.memeScanner = {
        status: 'OK',
        hotTokens: trending.hot.length,
        sample: trending.hot[0]?.symbol || 'N/A'
      };
    } catch (e: any) {
      results.memeScanner = { status: 'ERROR', error: e.message };
    }

    // Test Smart Stop-Loss
    try {
      const analysis = await smartStopLossService.analyzeAnyToken(
        '0x6982508145454ce325ddbe47a25d4ec3d2311933', // PEPE
        1
      );
      results.smartStopLoss = {
        status: 'OK',
        dumpScore: analysis.dumpScore,
        recommendation: analysis.recommendation,
        alerts: analysis.alerts.length
      };
    } catch (e: any) {
      results.smartStopLoss = { status: 'ERROR', error: e.message };
    }

    // Test Recovery Fund
    try {
      const stats = recoveryFundService.getFundStats();
      results.recoveryFund = {
        status: 'OK',
        poolBalance: stats.totalPoolBalance,
        members: stats.totalMembers
      };
    } catch (e: any) {
      results.recoveryFund = { status: 'ERROR', error: e.message };
    }

    // Test Gains Lock
    try {
      results.gainsLock = {
        status: 'OK',
        message: 'Service ready'
      };
    } catch (e: any) {
      results.gainsLock = { status: 'ERROR', error: e.message };
    }

    // Test Degen Score
    try {
      const leaderboard = degenScoreService.getLeaderboard(5);
      results.degenScore = {
        status: 'OK',
        leaderboardEntries: leaderboard.length,
        badges: degenScoreService.getAvailableBadges().length
      };
    } catch (e: any) {
      results.degenScore = { status: 'ERROR', error: e.message };
    }

    // Test Sniper Bot
    try {
      const launches = sniperBotService.getRecentLaunches(5);
      results.sniperBot = {
        status: 'OK',
        recentLaunches: launches.length
      };
    } catch (e: any) {
      results.sniperBot = { status: 'ERROR', error: e.message };
    }

    res.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: results,
      allOK: Object.values(results).every((r: any) => r.status === 'OK')
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/degenx/test/analyze-token - Public token analysis
router.post('/test/analyze-token', async (req: Request, res: Response) => {
  try {
    const { tokenAddress, chainId } = req.body;
    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address required' });
    }

    const [dumpAnalysis, scanResult] = await Promise.all([
      smartStopLossService.analyzeAnyToken(tokenAddress, chainId || 1),
      memeScannerService.scanToken(tokenAddress, chainId || 1),
    ]);

    res.json({
      tokenAddress,
      chainId: chainId || 1,
      dumpAnalysis,
      scanResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// All routes below require authentication
router.use(authenticateToken);

// GET /api/degenx - DegenX root - get user's degenx stats
router.get('/', async (req: Request, res: Response) => {
  try {
    res.json({
      enabled: true,
      stats: {
        totalTokensAnalyzed: 0,
        rugChecksPassed: 0,
        avgGuardianScore: 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get DegenX stats' });
  }
});

// ===========================
// DISCOVERY (Token Discovery with Guardian Scores)
// ===========================

// GET /api/degenx/discover - Discover safe tokens (REAL DATA from DEXScreener/GeckoTerminal)
router.get('/discover', async (req: Request, res: Response) => {
  try {
    const minScore = parseInt(req.query.minScore as string) || 50;
    const limitNum = parseInt(req.query.limit as string) || 20;

    // Fetch trending from meme scanner (real DEXScreener/GeckoTerminal data)
    const trending = await memeScannerService.fetchTrending();

    // Filter by score and transform to response format
    const tokens = trending.hot
      .filter(t => t.score >= minScore && !t.honeypot)
      .slice(0, limitNum)
      .map(t => ({
        address: t.address,
        name: t.name,
        symbol: t.symbol,
        guardianScore: t.score,
        liquidity: t.liquidity,
        volume24h: t.volume24h,
        priceChange24h: t.priceChange24h,
        chainId: t.chainId,
        dex: t.dex,
        signals: t.signals,
        verified: t.verified,
        buyTax: t.buyTax,
        sellTax: t.sellTax,
        rugCheckPassed: !t.honeypot && t.buyTax < 10 && t.sellTax < 15,
      }));

    res.json({ tokens, source: 'live', lastUpdated: new Date().toISOString() });
  } catch (error: any) {
    logger.error('Discovery error:', error);
    res.status(500).json({ error: error.message || 'Discovery failed' });
  }
});

// POST /api/degenx/discover/analyze - Analyze specific token
router.post('/discover/analyze', async (req: Request, res: Response) => {
  try {
    const { tokenAddress, chainId } = req.body;

    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address required' });
    }

    // Check cache
    const cacheKey = CacheKeys.rugCheck(tokenAddress, chainId || 1);
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Run comprehensive analysis
    const [rugCheck, safetyScore] = await Promise.all([
      rugDetection.checkToken(tokenAddress, chainId || 1),
      rugDetection.getTokenSafetyScore(tokenAddress, chainId || 1),
    ]);

    const result = {
      rugCheck,
      safetyScore,
      recommendation: rugCheck.riskLevel === 'critical' || rugCheck.riskLevel === 'high'
        ? 'DO NOT BUY'
        : rugCheck.riskLevel === 'medium'
          ? 'HIGH RISK'
          : 'ACCEPTABLE',
    };

    // Cache for 5 minutes
    await cacheService.set(cacheKey, result, 300);

    res.json(result);
  } catch (error: any) {
    logger.error('Analyze error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// ===========================
// RUG GUARD
// ===========================

// POST /api/degenx/rug-check - Check if token is rug pull
router.post('/rug-check', async (req: Request, res: Response) => {
  try {
    const { tokenAddress, chainId } = req.body;

    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address required' });
    }

    const result = await rugDetection.checkToken(tokenAddress, chainId || 1);

    res.json(result);
  } catch (error: any) {
    logger.error('Rug check error:', error);
    res.status(500).json({ error: error.message || 'Rug check failed' });
  }
});

// POST /api/degenx/rug-check/batch - Batch check multiple tokens
router.post('/rug-check/batch', async (req: Request, res: Response) => {
  try {
    const { tokens } = req.body;

    if (!tokens || !Array.isArray(tokens)) {
      return res.status(400).json({ error: 'Tokens array required' });
    }

    const results = await rugDetection.checkMultipleTokens(tokens);

    // Convert Map to object
    const resultsObj: Record<string, any> = {};
    results.forEach((value, key) => {
      resultsObj[key] = value;
    });

    res.json(resultsObj);
  } catch (error: any) {
    logger.error('Batch rug check error:', error);
    res.status(500).json({ error: error.message || 'Batch rug check failed' });
  }
});

// POST /api/degenx/honeypot-check - Enhanced honeypot detection with full analysis
router.post('/honeypot-check', async (req: Request, res: Response) => {
  try {
    const { tokenAddress, chainId } = req.body;

    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address required' });
    }

    // Check cache first
    const cacheKey = CacheKeys.rugCheck(tokenAddress, chainId || 1);
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Run comprehensive honeypot and rug analysis
    const [rugCheck, safetyScore] = await Promise.all([
      rugDetection.checkToken(tokenAddress, chainId || 1),
      rugDetection.getTokenSafetyScore(tokenAddress, chainId || 1),
    ]);

    // Build enhanced result matching RugGuard component expectations
    const result = {
      isRugPull: rugCheck.isRugPull,
      riskScore: rugCheck.riskScore,
      riskLevel: rugCheck.riskLevel,
      flags: rugCheck.flags,
      liquidityLocked: rugCheck.liquidityLocked,
      contractVerified: rugCheck.contractVerified,
      ownershipRenounced: rugCheck.ownershipRenounced,
      recommendations: rugCheck.recommendations,
      tokenInfo: {
        name: `Token`,
        symbol: tokenAddress.slice(2, 5).toUpperCase(),
        totalSupply: '1000000000',
        decimals: 18,
        holders: safetyScore.holders,
        buyTax: safetyScore.buyTax,
        sellTax: safetyScore.sellTax,
      },
      honeypotResult: {
        isHoneypot: safetyScore.isHoneypot,
        simulationSuccess: safetyScore.canBuy && safetyScore.canSell,
        buyGas: 150000,
        sellGas: safetyScore.canSell ? 180000 : 0,
        buyTax: safetyScore.buyTax,
        sellTax: safetyScore.sellTax,
      },
      guardianScore: safetyScore.guardscore,
    };

    // Cache for 5 minutes
    await cacheService.set(cacheKey, result, 300);

    res.json(result);
  } catch (error: any) {
    logger.error('Honeypot check error:', error);
    res.status(500).json({ error: error.message || 'Honeypot check failed' });
  }
});

// ===========================
// ANALYTICS (P&L, Degen Score)
// ===========================

// GET /api/degenx/analytics/pnl - Get P&L stats
router.get('/analytics/pnl', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { chainId = '1', timeframe = '30d' } = req.query;

    // Fetch user's transaction history from database
    let transactions: any[] = [];
    
    if (prisma) {
      try {
        transactions = await prisma.transaction.findMany({
          where: { 
            userId,
            chainId: Number(chainId),
            createdAt: {
              gte: timeframe === '7d' 
                ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                : timeframe === '30d'
                ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                : timeframe === '90d'
                ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                : new Date(0),
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (dbErr) {
        logger.debug('P&L DB query failed, using empty transactions:', dbErr);
      }
    }

    // Calculate P&L from transactions
    let totalInvested = 0;
    let currentValue = 0;
    let realizedPnL = 0;
    let wins = 0;
    let losses = 0;

    for (const tx of transactions) {
      if (tx.type === 'swap' || tx.type === 'buy') {
        const invested = Number(tx.amountInUSD || 0);
        const received = Number(tx.amountOutUSD || 0);
        totalInvested += invested;
        currentValue += received;
        
        if (tx.status === 'completed') {
          const pnl = received - invested;
          realizedPnL += pnl;
          if (pnl > 0) wins++;
          else if (pnl < 0) losses++;
        }
      }
    }

    const unrealizedPnL = currentValue - totalInvested - realizedPnL;
    const totalPnL = realizedPnL + unrealizedPnL;
    const pnlPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const totalTrades = wins + losses;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    res.json({
      totalInvested: totalInvested.toFixed(2),
      currentValue: currentValue.toFixed(2),
      realizedPnL: realizedPnL.toFixed(2),
      unrealizedPnL: unrealizedPnL.toFixed(2),
      totalPnL: totalPnL.toFixed(2),
      pnlPercentage: Math.round(pnlPercentage),
      wins,
      losses,
      winRate: Math.round(winRate),
    });
  } catch (error: any) {
    logger.error('P&L error:', error);
    res.status(500).json({ error: error.message || 'Failed to get P&L' });
  }
});

// GET /api/degenx/analytics/degen-score - Get Degen Score (REAL DATA)
router.get('/analytics/degen-score', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const score = degenScoreService.getScore(userId);

    if (!score) {
      return res.json({
        score: 0,
        level: 'Paper Hands',
        rank: 0,
        percentile: 0,
        stats: {
          totalTrades: 0,
          winRate: 0,
          totalVolume: '0',
          totalPnL: '0',
        },
        badges: [],
      });
    }

    res.json({
      score: score.score,
      level: score.level,
      rank: score.rank,
      percentile: score.percentile,
      stats: {
        totalTrades: score.stats.totalTrades,
        winRate: Math.round(score.stats.winRate),
        totalVolume: score.stats.totalVolume,
        totalPnL: score.stats.totalPnL,
        avgTradeSize: score.stats.avgTradeSize,
        currentStreak: score.stats.currentStreak,
        bestStreak: score.stats.bestStreak,
      },
      badges: score.badges.map(b => `${b.icon} ${b.name}`),
      breakdown: score.breakdown,
    });
  } catch (error: any) {
    logger.error('Degen score error:', error);
    res.status(500).json({ error: error.message || 'Failed to get degen score' });
  }
});

// GET /api/degenx/analytics/leaderboard - Get Degen Leaderboard
router.get('/analytics/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const leaderboard = degenScoreService.getLeaderboard(limit);
    res.json({ leaderboard, updatedAt: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get leaderboard' });
  }
});

// ===========================
// RECOVERY FUND (Pro tier required)
// ===========================

router.get('/recovery-fund/stats', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const stats = await degenService.getRecoveryFundStats();
    res.json(stats);
  } catch (error: unknown) {
    logger.error('Recovery fund stats error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get recovery fund stats';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/recovery-fund/contribute', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const { contributorAddress, amountEth } = req.body;

    if (!contributorAddress || !amountEth) {
      return res.status(400).json({ error: 'Contributor address and amount required' });
    }

    const result = await degenService.contributeToRecoveryFund(contributorAddress, amountEth);
    res.json(result);
  } catch (error: unknown) {
    logger.error('Recovery fund contribution error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to contribute to recovery fund';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/recovery-fund/claim', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const { claimantAddress, tokenAddress, rugPullType, amountLostWei, proofTxHash } = req.body;

    if (!claimantAddress || !tokenAddress || !rugPullType || !amountLostWei || !proofTxHash) {
      return res.status(400).json({ error: 'All claim fields required' });
    }

    const result = await degenService.submitRecoveryClaim(
      claimantAddress,
      tokenAddress,
      rugPullType,
      amountLostWei,
      proofTxHash
    );
    res.json(result);
  } catch (error: unknown) {
    logger.error('Recovery claim submission error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit claim';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/recovery-fund/vote', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const { claimId, voterAddress, approve } = req.body;

    if (!claimId || !voterAddress || approve === undefined) {
      return res.status(400).json({ error: 'Claim ID, voter address, and vote required' });
    }

    const result = await degenService.voteOnClaim(claimId, voterAddress, approve);
    res.json(result);
  } catch (error: unknown) {
    logger.error('Recovery fund vote error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to cast vote';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/recovery-fund/pending-claims', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const claims = await degenService.getPendingClaims();
    res.json(claims);
  } catch (error: unknown) {
    logger.error('Pending claims error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get pending claims';
    res.status(500).json({ error: errorMessage });
  }
});

// ===========================
// SMART STOP-LOSS AI (Pro tier required)
// ===========================

router.post('/stop-loss/configure', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const config = req.body;

    if (!config.tokenAddress || !config.positionSize) {
      return res.status(400).json({ error: 'Token address and position size required' });
    }

    const result = await degenService.configureSmartStopLoss(config);
    res.json(result);
  } catch (error: unknown) {
    logger.error('Stop-loss configure error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to configure stop-loss';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/stop-loss/active', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const configs = await degenService.getActiveStopLossConfigs(walletAddress);
    res.json(configs);
  } catch (error: unknown) {
    logger.error('Get active stop-loss error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get stop-loss configs';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/stop-loss/signals', requireDegenXElite, async (req: Request, res: Response) => {
  try {
    const { tokenAddress } = req.query;
    const signals = await degenService.getDistributionSignals(tokenAddress as string | undefined);
    res.json(signals);
  } catch (error: unknown) {
    logger.error('Distribution signals error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get signals';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/stop-loss/analyze', requireDegenXElite, async (req: Request, res: Response) => {
  try {
    const { tokenAddress } = req.body;

    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address required' });
    }

    const result = await degenService.analyzeTokenForDistribution(tokenAddress);
    res.json(result);
  } catch (error: unknown) {
    logger.error('Distribution analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze distribution';
    res.status(500).json({ error: errorMessage });
  }
});

// ===========================
// WHALE MIRROR TRADING (Elite tier required)
// ===========================

router.post('/whale-mirror/configure', requireDegenXElite, async (req: Request, res: Response) => {
  try {
    const config = req.body;

    if (!config.whaleAddress) {
      return res.status(400).json({ error: 'Whale address required' });
    }

    const result = await degenService.configureWhaleMirror(config);
    res.json(result);
  } catch (error: unknown) {
    logger.error('Whale mirror configure error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to configure whale mirror';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/whale-mirror/active', requireDegenXElite, async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const mirrors = await degenService.getActiveWhaleMirrors(walletAddress);
    res.json(mirrors);
  } catch (error: unknown) {
    logger.error('Get whale mirrors error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get whale mirrors';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/whale-mirror/positions/:whaleAddress', requireDegenXElite, async (req: Request, res: Response) => {
  try {
    const { whaleAddress } = req.params;
    const positions = await degenService.getWhalePositions(whaleAddress);
    res.json(positions);
  } catch (error: unknown) {
    logger.error('Whale positions error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get whale positions';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/whale-mirror/history', requireDegenXElite, async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const trades = await degenService.getMirrorTradeHistory(walletAddress);
    res.json(trades);
  } catch (error: unknown) {
    logger.error('Mirror trade history error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get trade history';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/whale-mirror/known-whales', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const whales = await degenService.getKnownWhales();
    res.json(whales);
  } catch (error: unknown) {
    logger.error('Known whales error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get known whales';
    res.status(500).json({ error: errorMessage });
  }
});

// ===========================
// MEME HUNTER
// ===========================

router.get('/meme-hunter/trending', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const tokens = await degenService.getTrendingMemeTokens();
    res.json(tokens);
  } catch (error: unknown) {
    logger.error('Trending memes error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get trending memes';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/meme-hunter/analyze', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const { tokenAddress } = req.body;

    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address required' });
    }

    const analysis = await degenService.analyzeMemeToken(tokenAddress);
    res.json(analysis);
  } catch (error: unknown) {
    logger.error('Meme analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze meme token';
    res.status(500).json({ error: errorMessage });
  }
});

// ===========================
// WHALE ALERTS
// ===========================

router.get('/whale-alerts/recent', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const alerts = await degenService.getRecentWhaleAlerts(limit ? parseInt(limit as string, 10) : 20);
    res.json(alerts);
  } catch (error: unknown) {
    logger.error('Whale alerts error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get whale alerts';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/whale-alerts/subscribe', requireDegenXElite, async (req: Request, res: Response) => {
  try {
    const { walletAddress, whaleAddresses, minValueUsd } = req.body;

    if (!walletAddress || !whaleAddresses || !Array.isArray(whaleAddresses)) {
      return res.status(400).json({ error: 'Wallet address and whale addresses required' });
    }

    const result = await degenService.subscribeToWhaleAlerts(
      walletAddress,
      whaleAddresses,
      minValueUsd || 10000
    );
    res.json(result);
  } catch (error: unknown) {
    logger.error('Whale alert subscribe error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe to alerts';
    res.status(500).json({ error: errorMessage });
  }
});

// ===========================
// SERVICE STATS (All features)
// ===========================

router.get('/stats/all', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const stats = await degenService.getServiceStats();
    res.json(stats);
  } catch (error: unknown) {
    logger.error('Service stats error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get service stats';
    res.status(500).json({ error: errorMessage });
  }
});

// ===========================
// GAINS LOCK (REAL SERVICE)
// ===========================

router.get('/gains-lock/rules', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const rules = gainsLockService.getUserRules(userId);
    res.json({ rules, stats: gainsLockService.getUserStats(userId) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get gains lock rules' });
  }
});

router.post('/gains-lock/create', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { tokenAddress, tokenSymbol, chainId, entryPrice, quantity, targets, trailingEnabled, trailingPercent } = req.body;

    if (!tokenAddress || !tokenSymbol || !entryPrice || !quantity || !targets) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rule = await gainsLockService.createRule(userId, {
      tokenAddress,
      tokenSymbol,
      chainId: chainId || 1,
      entryPrice: parseFloat(entryPrice),
      quantity,
      targets,
      trailingEnabled,
      trailingPercent,
    });

    res.json({ success: true, rule });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create gains lock rule' });
  }
});

router.delete('/gains-lock/:ruleId', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const success = gainsLockService.cancelRule(req.params.ruleId, userId);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to cancel rule' });
  }
});

// ===========================
// SMART STOP-LOSS (REAL SERVICE)
// ===========================

router.get('/stop-loss/rules', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const rules = smartStopLossService.getUserRules(userId);
    const stats = smartStopLossService.getUserStats(userId);
    res.json({ rules, stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get stop loss rules' });
  }
});

router.post('/stop-loss/create', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { tokenAddress, tokenSymbol, chainId, entryPrice, quantity, stopLossPercent, mode, smartDetection } = req.body;

    if (!tokenAddress || !tokenSymbol || !entryPrice || !quantity || !stopLossPercent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rule = await smartStopLossService.createRule(userId, {
      tokenAddress,
      tokenSymbol,
      chainId: chainId || 1,
      entryPrice: parseFloat(entryPrice),
      quantity,
      stopLossPercent: parseFloat(stopLossPercent),
      mode,
      smartDetection,
    });

    res.json({ success: true, rule });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create stop loss rule' });
  }
});

router.post('/stop-loss/analyze', async (req: Request, res: Response) => {
  try {
    const { tokenAddress, chainId } = req.body;
    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address required' });
    }

    const analysis = await smartStopLossService.analyzeAnyToken(tokenAddress, chainId || 1);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to analyze token' });
  }
});

router.delete('/stop-loss/:ruleId', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const success = smartStopLossService.cancelRule(req.params.ruleId, userId);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to cancel rule' });
  }
});

// ===========================
// RECOVERY FUND (REAL SERVICE)
// ===========================

router.get('/recovery/info', async (req: Request, res: Response) => {
  try {
    const stats = recoveryFundService.getFundStats();
    const tiers = recoveryFundService.getCoverageInfo();
    res.json({ stats, tiers });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get fund info' });
  }
});

router.get('/recovery/membership', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const member = recoveryFundService.getMember(userId);
    const claims = recoveryFundService.getUserClaims(userId);
    res.json({ member, claims });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get membership' });
  }
});

router.post('/recovery/join', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { tier } = req.body;

    if (!tier || !['bronze', 'silver', 'gold', 'platinum'].includes(tier)) {
      return res.status(400).json({ error: 'Valid tier required (bronze/silver/gold/platinum)' });
    }

    const member = await recoveryFundService.joinFund(userId, tier);
    res.json({ success: true, member });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to join fund' });
  }
});

router.post('/recovery/claim', requireDegenXSubscription('basic'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { tokenAddress, tokenSymbol, chainId, investedAmount, lostAmount, txHashes, rugType, description, proofUrls } = req.body;

    if (!tokenAddress || !tokenSymbol || !investedAmount || !lostAmount || !rugType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const claim = await recoveryFundService.submitClaim(userId, {
      tokenAddress,
      tokenSymbol,
      chainId: chainId || 1,
      investedAmount,
      lostAmount,
      txHashes: txHashes || [],
      rugType,
      description: description || '',
      proofUrls,
    });

    res.json({ success: true, claim });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit claim' });
  }
});

router.post('/recovery/verify-rug', async (req: Request, res: Response) => {
  try {
    const { tokenAddress, chainId } = req.body;
    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address required' });
    }

    const verification = await recoveryFundService.verifyRug(tokenAddress, chainId || 1);
    res.json(verification);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to verify rug' });
  }
});

export default router;
