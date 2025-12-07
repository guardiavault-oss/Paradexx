/**
 * Yield API Routes
 * Handles yield strategy queries, position management, and APY tracking
 */

import { Router } from 'express';
import { z } from 'zod';
import { yieldService } from './services/yieldService.js';
import { achievementService } from './services/achievementService.js';
import { logInfo, logError } from './services/logger.js';

// Auth middleware - matches pattern from routes.ts
function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

const router = Router();

// Validation schemas
const createPositionSchema = z.object({
  guardiaVaultId: z.number(),
  asset: z.string(),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid amount format'),
  protocol: z.string(),
});

/**
 * @swagger
 * /api/yield/strategies:
 *   get:
 *     summary: Get available yield strategies
 *     tags: [Yield]
 *     responses:
 *       200:
 *         description: List of available yield strategies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 strategies:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       protocol:
 *                         type: string
 *                       apy:
 *                         type: number
 *                       tvl:
 *                         type: number
 *                       riskLevel:
 *                         type: string
 */
router.get('/strategies', async (req, res) => {
  try {
    const strategies = await yieldService.getAvailableStrategies();
    res.json({ strategies });
  } catch (error) {
    logError(error as Error, { context: 'yield.strategies' });
    res.status(500).json({ error: 'Failed to fetch yield strategies' });
  }
});

/**
 * @swagger
 * /api/yield/positions:
 *   get:
 *     summary: Get user's yield positions
 *     tags: [Yield]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: User's yield positions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 positions:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/positions', requireAuth, async (req, res) => {
  try {
    const userAddress = (req as any).user?.walletAddress || (req.session as any)?.walletAddress;
    
    if (!userAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const positions = await yieldService.getUserPositions(userAddress);
    res.json({ positions });
  } catch (error) {
    logError(error as Error, { context: 'yield.positions.get' });
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

/**
 * @swagger
 * /api/yield/positions:
 *   post:
 *     summary: Create new yield position
 *     tags: [Yield]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guardiaVaultId
 *               - asset
 *               - amount
 *               - protocol
 *             properties:
 *               guardiaVaultId:
 *                 type: number
 *               asset:
 *                 type: string
 *               amount:
 *                 type: string
 *               protocol:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction data for creating position
 */
router.post('/positions', requireAuth, async (req, res) => {
  try {
    const userAddress = (req as any).user?.walletAddress || (req.session as any)?.walletAddress;
    
    if (!userAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const validatedData = createPositionSchema.parse(req.body);

    const txData = await yieldService.createYieldPosition(
      userAddress,
      validatedData.guardiaVaultId,
      validatedData.asset,
      validatedData.amount,
      validatedData.protocol
    );

    // Check deposit achievements (async, don't block response)
    const userId = (req.session as any)?.userId;
    if (userId) {
      achievementService.checkDepositAchievements(userId, validatedData.amount).catch((err) => {
        logError(err as Error, { context: 'checkDepositAchievements' });
      });
    }

    res.json({ 
      success: true,
      txData: {
        to: txData.to,
        data: txData.data,
        value: txData.value?.toString(),
        gasLimit: txData.gasLimit?.toString(),
      },
      message: 'Transaction data ready for signing',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    logError(error as Error, { context: 'yield.positions.create' });
    res.status(500).json({ error: 'Failed to create position' });
  }
});

/**
 * @swagger
 * /api/yield/positions/{vaultId}/update:
 *   post:
 *     summary: Update yield for a vault (admin/keeper only)
 *     tags: [Yield]
 *     parameters:
 *       - in: path
 *         name: vaultId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Yield updated successfully
 */
router.post('/positions/:vaultId/update', async (req, res) => {
  try {
    const { vaultId } = req.params;

    // In production, add admin/keeper authentication
    // const isAdmin = (req as any).user?.isAdmin;
    // const isKeeper = req.headers['x-keeper-secret'] === process.env.KEEPER_SECRET;
    // if (!isAdmin && !isKeeper) {
    //   return res.status(403).json({ error: 'Admin or keeper access required' });
    // }

    await yieldService.updateVaultYield(vaultId);
    res.json({ 
      success: true,
      message: 'Yield update initiated' 
    });
  } catch (error) {
    logError(error as Error, { context: 'yield.positions.update', vaultId: req.params.vaultId });
    res.status(500).json({ error: 'Failed to update yield' });
  }
});

/**
 * @swagger
 * /api/yield/update-all:
 *   post:
 *     summary: Manually trigger yield calculation for all vaults (admin/keeper only)
 *     tags: [Yield]
 *     responses:
 *       200:
 *         description: Yield calculation triggered successfully
 */
router.post('/update-all', async (req, res) => {
  try {
    // In production, add admin/keeper authentication
    // const isAdmin = (req as any).user?.isAdmin;
    // const isKeeper = req.headers['x-keeper-secret'] === process.env.KEEPER_SECRET;
    // if (!isAdmin && !isKeeper) {
    //   return res.status(403).json({ error: 'Admin or keeper access required' });
    // }

    const { triggerYieldCalculation } = await import('./jobs/yield-calculator.js');
    await triggerYieldCalculation();

    res.json({ 
      success: true,
      message: 'Yield calculation for all vaults triggered' 
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already running')) {
      return res.status(409).json({ 
        error: 'Yield calculation is already running',
        message: error.message 
      });
    }
    logError(error as Error, { context: 'yield.update-all' });
    res.status(500).json({ error: 'Failed to trigger yield calculation' });
  }
});

/**
 * @swagger
 * /api/yield/positions/{vaultId}/harvest:
 *   post:
 *     summary: Harvest yield manually for a vault
 *     tags: [Yield]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: vaultId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Yield harvested successfully
 */
router.post('/positions/:vaultId/harvest', requireAuth, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const userAddress = (req as any).user?.walletAddress || (req.session as any)?.walletAddress;

    if (!userAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // Note: This requires a signer, so it should typically be done client-side
    // This endpoint provides transaction data for client-side signing
    res.json({ 
      success: true,
      message: 'Harvest must be done client-side with wallet connection',
      note: 'Use contract.harvest(vaultId) from frontend',
    });
  } catch (error) {
    logError(error as Error, { context: 'yield.positions.harvest', vaultId: req.params.vaultId });
    res.status(500).json({ error: 'Failed to harvest yield' });
  }
});

/**
 * @swagger
 * /api/yield/apy/{protocol}:
 *   get:
 *     summary: Get current APY for a protocol
 *     tags: [Yield]
 *     parameters:
 *       - in: path
 *         name: protocol
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current APY for the protocol
 */
router.get('/apy/:protocol', async (req, res) => {
  try {
    const { protocol } = req.params;

    // Get current APY from the protocol
    const strategies = await yieldService.getAvailableStrategies();
    const strategy = strategies.find(s => s.protocol === protocol.toLowerCase());

    if (!strategy) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    res.json({ 
      protocol: strategy.protocol,
      apy: strategy.apy,
      name: strategy.name,
      riskLevel: strategy.riskLevel,
    });
  } catch (error) {
    logError(error as Error, { context: 'yield.apy', protocol: req.params.protocol });
    res.status(500).json({ error: 'Failed to fetch APY' });
  }
});

export default router;

