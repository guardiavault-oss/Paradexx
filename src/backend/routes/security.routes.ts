// Security Routes - MEV Protection, Honeypot Detection, Security Analysis
import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireDualMode, checkModeAccess, requireDegenXElite } from '../middleware/subscription.middleware';
import { mevProtection, mevDetection } from '../services/mev-protection.service';
import { rugDetection, honeypotDetection } from '../services/rug-detection.service';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================================================
// MEV PROTECTION ROUTES
// ============================================================================

// POST /api/security/mev/analyze - Analyze transaction for MEV risk
router.post('/mev/analyze', checkModeAccess('degen'), async (req: Request, res: Response) => {
  try {
    const { from, to, data, value, chainId } = req.body;

    if (!from || !to || !data || value === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const analysis = await mevDetection.analyzeMevRisk(from, to, data, value);

    res.json(analysis);
  } catch (error: any) {
    logger.error('MEV analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze MEV risk' });
  }
});

// POST /api/security/mev/protect - Send transaction with MEV protection
router.post('/mev/protect', requireDegenXElite, async (req: Request, res: Response) => {
  try {
    const { signedTx, config } = req.body;

    if (!signedTx) {
      return res.status(400).json({ error: 'Signed transaction required' });
    }

    const protectionConfig = config || {
      enabled: true,
      privateMempool: true,
      slippageProtection: true,
      frontrunProtection: true,
      sandwichProtection: true,
      maxSlippage: 1,
    };

    const result = await mevProtection.sendProtectedTransaction(signedTx, protectionConfig);

    res.json(result);
  } catch (error: any) {
    logger.error('MEV protection error:', error);
    res.status(500).json({ error: error.message || 'Failed to send protected transaction' });
  }
});

// GET /api/security/mev/detect-sandwich/:txHash - Detect sandwich attack
router.get('/mev/detect-sandwich/:txHash', requireDegenXElite, async (req: Request, res: Response) => {
  try {
    const { txHash } = req.params;

    const isSandwich = await mevDetection.detectSandwichAttack(txHash);

    res.json({
      txHash,
      isSandwichAttack: isSandwich,
      detectedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Sandwich detection error:', error);
    res.status(500).json({ error: error.message || 'Failed to detect sandwich attack' });
  }
});

// ============================================================================
// HONEYPOT DETECTION ROUTES
// ============================================================================

// POST /api/security/honeypot/check - Check token for honeypot
router.post('/honeypot/check', async (req: Request, res: Response) => {
  try {
    const { tokenAddress, chainId } = req.body;

    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address required' });
    }

    const result = await rugDetection.checkToken(tokenAddress, chainId || 1);

    res.json(result);
  } catch (error: any) {
    logger.error('Honeypot check error:', error);
    res.status(500).json({ error: error.message || 'Failed to check honeypot' });
  }
});

// POST /api/security/honeypot/check-multiple - Check multiple tokens
router.post('/honeypot/check-multiple', async (req: Request, res: Response) => {
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
    logger.error('Batch honeypot check error:', error);
    res.status(500).json({ error: error.message || 'Failed to check tokens' });
  }
});

// GET /api/security/honeypot/safety-score/:tokenAddress - Get token safety score
router.get('/honeypot/safety-score/:tokenAddress', async (req: Request, res: Response) => {
  try {
    const { tokenAddress } = req.params;
    const chainId = parseInt(req.query.chainId as string) || 1;

    const safetyScore = await rugDetection.getTokenSafetyScore(tokenAddress, chainId);

    res.json(safetyScore);
  } catch (error: any) {
    logger.error('Safety score error:', error);
    res.status(500).json({ error: error.message || 'Failed to get safety score' });
  }
});

// ============================================================================
// SECURITY ANALYSIS ROUTES
// ============================================================================

// POST /api/security/analyze-transaction - Comprehensive transaction analysis
router.post('/analyze-transaction', async (req: Request, res: Response) => {
  try {
    const { from, to, data, value, tokenAddress, chainId } = req.body;

    if (!from || !to) {
      return res.status(400).json({ error: 'From and to addresses required' });
    }

    // Analyze MEV risk
    const mevAnalysis = await mevDetection.analyzeMevRisk(
      from,
      to,
      data || '0x',
      value || '0'
    );

    // Analyze token if provided
    let tokenAnalysis = null;
    if (tokenAddress) {
      tokenAnalysis = await rugDetection.checkToken(tokenAddress, chainId || 1);
    }

    res.json({
      mev: mevAnalysis,
      token: tokenAnalysis,
      overallRisk: calculateOverallRisk(mevAnalysis, tokenAnalysis),
      recommendations: generateRecommendations(mevAnalysis, tokenAnalysis),
    });
  } catch (error: any) {
    logger.error('Transaction analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze transaction' });
  }
});

// Helper methods
function calculateOverallRisk(mev: any, token: any): 'low' | 'medium' | 'high' | 'critical' {
  if (token && (token.riskLevel === 'critical' || token.isRugPull)) {
    return 'critical';
  }
  if (mev.riskLevel === 'high' || (token && token.riskLevel === 'high')) {
    return 'high';
  }
  if (mev.riskLevel === 'medium' || (token && token.riskLevel === 'medium')) {
    return 'medium';
  }
  return 'low';
}

function generateRecommendations(mev: any, token: any): string[] {
  const recommendations: string[] = [];

  if (mev.riskLevel === 'high') {
    recommendations.push(...mev.recommendations);
  }

  if (token && token.riskLevel !== 'safe') {
    recommendations.push(...token.recommendations);
  }

  if (recommendations.length === 0) {
    recommendations.push('Transaction appears safe');
  }

  return recommendations;
}

export default router;

