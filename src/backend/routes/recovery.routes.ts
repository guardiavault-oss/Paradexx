// Recovery Routes - Public endpoints for wallet recovery (no auth required)

import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { prisma } from '../config/database';
import { emailService } from '../services/email.service';
import crypto from 'crypto';

const router = Router();

const verificationCodes = new Map<string, { code: string; expiresAt: Date; attempts: number }>();

// POST /api/recovery/send-verification - Send verification code
router.post('/send-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.json({ success: true, message: 'If account exists, verification code sent' });
    }

    const code = Math.random().toString().slice(2, 8);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    verificationCodes.set(email.toLowerCase(), { code, expiresAt, attempts: 0 });

    try {
      await (emailService as any).sendRecoveryCode?.({
        to: email,
        code,
        userName: user.displayName || 'User',
      });
    } catch (emailError) {
      logger.error('Failed to send recovery email:', emailError);
    }

    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    logger.error('Send verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification code' });
  }
});

// POST /api/recovery/resend-code - Resend verification code
router.post('/resend-code', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    const existing = verificationCodes.get(email.toLowerCase());
    if (existing && existing.expiresAt > new Date()) {
      const cooldownRemaining = Math.ceil((existing.expiresAt.getTime() - Date.now() - 9 * 60 * 1000) / 1000);
      if (cooldownRemaining > 0) {
        return res.status(429).json({
          success: false,
          message: 'Please wait before requesting a new code',
          cooldownRemaining
        });
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.json({ success: true, message: 'If account exists, new code sent' });
    }

    const code = Math.random().toString().slice(2, 8);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    verificationCodes.set(email.toLowerCase(), { code, expiresAt, attempts: 0 });

    try {
      await (emailService as any).sendRecoveryCode?.({
        to: email,
        code,
        userName: user.displayName || 'User',
      });
    } catch (emailError) {
      logger.error('Failed to send recovery email:', emailError);
    }

    res.json({ success: true, message: 'New verification code sent' });
  } catch (error) {
    logger.error('Resend code error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend code' });
  }
});

// POST /api/recovery/verify-code - Verify the code
router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code required' });
    }

    const stored = verificationCodes.get(email.toLowerCase());

    if (!stored) {
      return res.status(400).json({ success: false, message: 'No verification code found. Please request a new one.' });
    }

    if (stored.expiresAt < new Date()) {
      verificationCodes.delete(email.toLowerCase());
      return res.status(400).json({ success: false, message: 'Code expired. Please request a new one.' });
    }

    stored.attempts++;
    if (stored.attempts > 5) {
      verificationCodes.delete(email.toLowerCase());
      return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new code.' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    res.json({ success: true, message: 'Code verified successfully' });
  } catch (error) {
    logger.error('Verify code error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify code' });
  }
});

// POST /api/recovery/initiate - Start recovery process
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { email, reason, verificationCode } = req.body;

    if (!email || !reason || !verificationCode) {
      return res.status(400).json({ success: false, message: 'Email, reason, and verification code required' });
    }

    const stored = verificationCodes.get(email.toLowerCase());
    if (!stored || stored.code !== verificationCode || stored.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        guardians: {
          where: { status: 'active' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const activeGuardians = user.guardians.length;
    if (activeGuardians === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active guardians found. Please contact support for alternative recovery options.'
      });
    }

    const requiredApprovals = Math.max(1, Math.ceil(activeGuardians / 2));
    const timeLockHours = 24;
    const canExecuteAt = new Date(Date.now() + timeLockHours * 60 * 60 * 1000);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const recovery = await (prisma.recoveryRequest as any).create({
      data: {
        user: { connect: { id: user.id } },
        reason,
        status: 'pending',
        requiredApprovals,
        canExecuteAt,
        expiresAt,
      } as any,
    });

    for (const guardian of user.guardians) {
      try {
        await ((emailService as any).sendGuardianRecoveryNotification || emailService.sendGuardianVotedNotification)({
          to: guardian.email,
          guardianName: guardian.name || 'Guardian',
          userName: user.displayName || user.email,
          reason,
          recoveryId: recovery.id,
          approvalLink: `${process.env.FRONTEND_URL}/guardian/approve/${recovery.id}?token=${crypto.randomBytes(32).toString('hex')}`,
        });
      } catch (emailError) {
        logger.error(`Failed to notify guardian ${guardian.email}:`, emailError);
      }
    }

    verificationCodes.delete(email.toLowerCase());

    res.json({
      success: true,
      recoveryId: recovery.id,
      message: 'Recovery initiated. Guardians have been notified.',
      requiredApprovals,
      timeLockEndsAt: canExecuteAt.toISOString(),
    });
  } catch (error) {
    logger.error('Initiate recovery error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate recovery' });
  }
});

// GET /api/recovery/status - Check recovery status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Recovery ID required' });
    }

    const recovery = await prisma.recoveryRequest.findUnique({
      where: { id },
      include: {
        guardianApprovals: {
          include: {
            guardian: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!recovery) {
      return res.status(404).json({ success: false, message: 'Recovery request not found' });
    }

    const canComplete =
      recovery.status === 'approved' &&
      recovery.canExecuteAt <= new Date() &&
      recovery.expiresAt > new Date();

    res.json({
      success: true,
      recovery: {
        id: recovery.id,
        status: recovery.status,
        reason: recovery.reason,
        initiatedAt: ((recovery as any).createdAt || recovery.initiatedAt || new Date()).toISOString(),
        timeLockEndsAt: recovery.canExecuteAt.toISOString(),
        expiresAt: recovery.expiresAt.toISOString(),
        requiredApprovals: recovery.requiredApprovals,
        currentApprovals: recovery.approvalCount,
        guardianApprovals: recovery.guardianApprovals.map((a: any) => ({
          guardianId: a.guardianId,
          guardianName: a.guardian?.name || 'Guardian',
          approved: a.approved,
          timestamp: ((a as any).createdAt || a.approvedAt || new Date()).toISOString(),
        })),
        canComplete,
      },
    });
  } catch (error) {
    logger.error('Get recovery status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get recovery status' });
  }
});

// POST /api/recovery/complete - Complete recovery
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { recoveryId, token } = req.body;

    if (!recoveryId) {
      return res.status(400).json({ success: false, message: 'Recovery ID required' });
    }

    const recovery = await prisma.recoveryRequest.findUnique({
      where: { id: recoveryId },
      include: { user: true },
    });

    if (!recovery) {
      return res.status(404).json({ success: false, message: 'Recovery request not found' });
    }

    if (recovery.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Recovery not yet approved by guardians' });
    }

    if (recovery.canExecuteAt > new Date()) {
      return res.status(400).json({ success: false, message: 'Time lock not yet expired' });
    }

    if (recovery.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Recovery request expired' });
    }

    await prisma.recoveryRequest.update({
      where: { id: recoveryId },
      data: { status: 'completed' },
    });

    const jwt = await import('jsonwebtoken');
    const accessToken = jwt.default.sign(
      { userId: recovery.userId, email: recovery.user.email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Recovery completed successfully',
      accessToken,
    });
  } catch (error) {
    logger.error('Complete recovery error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete recovery' });
  }
});

export default router;
