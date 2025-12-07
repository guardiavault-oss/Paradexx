/**
 * Seedless Wallet Routes
 * 
 * API endpoints for the seedless wallet system:
 * - Create seedless wallet with guardian enrollment
 * - Manage session keys for daily transactions
 * - Sign transactions using session keys
 * - Check wallet status
 */

import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { seedlessWalletService } from '../services/seedless-wallet.service';

const router = Router();

router.use(authenticateToken);

/**
 * POST /api/seedless-wallet/create
 * Create a new seedless wallet with guardians
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { guardianEmails, chain } = req.body;

    if (!guardianEmails || !Array.isArray(guardianEmails)) {
      return res.status(400).json({
        error: 'guardianEmails is required and must be an array',
      });
    }

    const result = await seedlessWalletService.createSeedlessWallet(req.userId!, {
      guardianEmails,
      chain,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      address: result.address,
      guardiansNotified: result.guardiansNotified,
      message: 'Seedless wallet created successfully. Guardians have been notified.',
    });
  } catch (error: any) {
    logger.error('[SeedlessWallet Route] Create error:', error.message);
    res.status(500).json({ error: 'Failed to create seedless wallet' });
  }
});

/**
 * POST /api/seedless-wallet/enroll-guardians
 * Add additional guardians to an existing seedless wallet
 */
router.post('/enroll-guardians', async (req: Request, res: Response) => {
  try {
    const { guardianEmails } = req.body;

    if (!guardianEmails || !Array.isArray(guardianEmails)) {
      return res.status(400).json({
        error: 'guardianEmails is required and must be an array',
      });
    }

    const result = await seedlessWalletService.enrollGuardians(req.userId!, guardianEmails);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      guardiansAdded: result.guardiansAdded,
      totalGuardians: result.totalGuardians,
      message: 'Guardians enrolled successfully.',
    });
  } catch (error: any) {
    logger.error('[SeedlessWallet Route] Enroll guardians error:', error.message);
    res.status(500).json({ error: 'Failed to enroll guardians' });
  }
});

/**
 * POST /api/seedless-wallet/session
 * Create a new session key for transactions
 */
router.post('/session', async (req: Request, res: Response) => {
  try {
    const { durationHours, spendingLimitEth } = req.body;

    const result = await seedlessWalletService.createSessionKey(
      req.userId!,
      durationHours || 24,
      spendingLimitEth || 1.0
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      sessionToken: result.sessionToken,
      expiresAt: result.expiresAt,
      spendingLimit: result.spendingLimit,
      message: 'Session key created successfully.',
    });
  } catch (error: any) {
    logger.error('[SeedlessWallet Route] Create session error:', error.message);
    res.status(500).json({ error: 'Failed to create session key' });
  }
});

/**
 * GET /api/seedless-wallet/session/:sessionToken
 * Get session key information
 */
router.get('/session/:sessionToken', async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.params;

    const result = await seedlessWalletService.getSessionInfo(req.userId!, sessionToken);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json({
      success: true,
      isActive: result.isActive,
      expiresAt: result.expiresAt,
      spendingLimit: result.spendingLimit,
      remainingLimit: result.remainingLimit,
    });
  } catch (error: any) {
    logger.error('[SeedlessWallet Route] Get session error:', error.message);
    res.status(500).json({ error: 'Failed to get session info' });
  }
});

/**
 * DELETE /api/seedless-wallet/session/:sessionToken
 * Revoke a session key
 */
router.delete('/session/:sessionToken', async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.params;

    const result = await seedlessWalletService.revokeSessionKey(req.userId!, sessionToken);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Session key revoked successfully.',
    });
  } catch (error: any) {
    logger.error('[SeedlessWallet Route] Revoke session error:', error.message);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

/**
 * DELETE /api/seedless-wallet/sessions
 * Revoke all session keys
 */
router.delete('/sessions', async (req: Request, res: Response) => {
  try {
    const result = await seedlessWalletService.revokeAllSessions(req.userId!);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      revokedCount: result.revokedCount,
      message: 'All session keys revoked successfully.',
    });
  } catch (error: any) {
    logger.error('[SeedlessWallet Route] Revoke all sessions error:', error.message);
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
});

/**
 * POST /api/seedless-wallet/sign
 * Sign a transaction using a session key
 */
router.post('/sign', async (req: Request, res: Response) => {
  try {
    const { sessionToken, to, value, data, gasLimit, maxFeePerGas, maxPriorityFeePerGas, nonce, chain } = req.body;

    if (!sessionToken) {
      return res.status(400).json({ error: 'sessionToken is required' });
    }

    if (!to) {
      return res.status(400).json({ error: 'to address is required' });
    }

    const result = await seedlessWalletService.signTransaction(req.userId!, sessionToken, {
      to,
      value: value || '0',
      data,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
      chain,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      signedTransaction: result.signedTransaction,
      transactionHash: result.transactionHash,
    });
  } catch (error: any) {
    logger.error('[SeedlessWallet Route] Sign transaction error:', error.message);
    res.status(500).json({ error: 'Failed to sign transaction' });
  }
});

/**
 * GET /api/seedless-wallet/address
 * Get the user's seedless wallet address
 */
router.get('/address', async (req: Request, res: Response) => {
  try {
    const result = await seedlessWalletService.getWalletAddress(req.userId!);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json({
      success: true,
      address: result.address,
      chain: result.chain,
    });
  } catch (error: any) {
    logger.error('[SeedlessWallet Route] Get address error:', error.message);
    res.status(500).json({ error: 'Failed to get wallet address' });
  }
});

/**
 * GET /api/seedless-wallet/status
 * Check the seedless wallet setup status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await seedlessWalletService.getWalletStatus(req.userId!);

    res.json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    logger.error('[SeedlessWallet Route] Get status error:', error.message);
    res.status(500).json({ error: 'Failed to get wallet status' });
  }
});

export default router;
