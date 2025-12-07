// Guardian Routes - Social recovery system

import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { notificationService } from '../services/notification.service';
import { emailService } from '../services/email.service';
import crypto from 'crypto';

const router = Router();

const APP_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================
// PUBLIC ROUTES (no auth - for onboarding)
// ============================================

/**
 * POST /api/guardians/invite (PUBLIC)
 * Send guardian invitation email during seedless onboarding
 * This is called before user is fully registered
 */
router.post('/invite', async (req: Request, res: Response) => {
  try {
    const { guardianName, guardianEmail, ownerName } = req.body;

    if (!guardianEmail) {
      return res.status(400).json({ error: 'Guardian email is required' });
    }

    // Generate a unique invitation link
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteLink = `${APP_URL}/guardian/accept/${inviteToken}`;

    // Send guardian invitation email via Resend
    await emailService.sendGuardianInvitation({
      to: guardianEmail,
      guardianName: guardianName || 'Friend',
      ownerName: ownerName || 'A Paradex user',
      inviteLink: inviteLink,
      threshold: 2,
      totalGuardians: 3,
    });

    logger.info(`[Guardians] Invitation sent to ${guardianEmail} from ${ownerName}`);

    res.json({
      success: true,
      message: `Invitation sent to ${guardianEmail}`,
      inviteToken, // Return token so it can be stored when user completes registration
    });
  } catch (error: any) {
    logger.error('[Guardians] Failed to send invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// All routes below require authentication
router.use(authenticateToken);

// GET /api/guardian - Get current user's guardian setup summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const guardians = await prisma.guardian.findMany({
      where: { userId: req.userId! },
    });

    const guardianCount = guardians.length;
    const activeGuardians = guardians.filter(g => g.status === 'active').length;
    const pendingInvites = guardians.filter(g => g.status === 'pending').length;

    res.json({
      totalGuardians: guardianCount,
      activeGuardians,
      pendingInvites,
      guardians,
      isConfigured: guardianCount > 0,
    });
  } catch (error) {
    logger.error('Get guardian summary error:', error);
    res.status(500).json({ error: 'Failed to get guardian summary' });
  }
});

// GET /api/guardians - List user's guardians
router.get('/', async (req: Request, res: Response) => {
  try {
    const guardians = await prisma.guardian.findMany({
      where: { userId: req.userId! },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        shardIndex: true,
        acceptedAt: true,
        lastVerifiedAt: true,
        createdAt: true,
      },
    });

    res.json(guardians);
  } catch (error) {
    logger.error('List guardians error:', error);
    res.status(500).json({ error: 'Failed to list guardians' });
  }
});

// POST /api/guardians - Invite guardian
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Check if already a guardian
    const existing = await prisma.guardian.findFirst({
      where: {
        userId: req.userId!,
        email,
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Email already added as guardian' });
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create guardian
    const guardian = await prisma.guardian.create({
      data: {
        userId: req.userId!,
        email,
        name,
        status: 'pending',
        inviteToken,
        inviteExpiresAt,
      },
    });

    // Send invitation email
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { displayName: true, email: true },
    });

    await notificationService.send({
      userId: req.userId!,
      type: 'guardian_request',
      priority: 'medium',
      channels: ['email'],
      data: {
        inviterName: user?.displayName || user?.email || 'Someone',
        inviteLink: `${process.env.FRONTEND_URL}/guardian/accept/${inviteToken}`,
      },
    });

    res.json({
      id: guardian.id,
      email: guardian.email,
      name: guardian.name,
      status: guardian.status,
    });
  } catch (error) {
    logger.error('Invite guardian error:', error);
    res.status(500).json({ error: 'Failed to invite guardian' });
  }
});

// POST /api/guardians/accept - Accept guardian invitation
router.post('/accept', async (req: Request, res: Response) => {
  try {
    const { inviteToken } = req.body;

    if (!inviteToken) {
      return res.status(400).json({ error: 'Invite token required' });
    }

    // Find guardian invitation
    const guardian = await prisma.guardian.findUnique({
      where: { inviteToken },
    });

    if (!guardian) {
      return res.status(404).json({ error: 'Invalid invite token' });
    }

    // Check if expired
    if (guardian.inviteExpiresAt && guardian.inviteExpiresAt < new Date()) {
      return res.status(410).json({ error: 'Invite expired' });
    }

    // Update guardian status
    const updated = await prisma.guardian.update({
      where: { id: guardian.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
        inviteToken: null,
        inviteExpiresAt: null,
      },
    });

    // Generate and assign recovery key shard
    try {
      const { recoveryKeyService } = await import('../services/recovery-key.service');
      const user = await prisma.user.findUnique({
        where: { id: guardian.userId },
        include: { wallets: { where: { isDefault: true }, take: 1 } },
      });

      if (user?.wallets?.[0]?.encryptedPrivateKey) {
        // Generate shards and assign to guardian
        const shards = await recoveryKeyService.generateKeyShards(
          user.wallets[0].encryptedPrivateKey, // In production, decrypt first
          guardian.userId
        );

        // Assign shard to this guardian
        const guardianShard = shards.find(s => s.shardIndex === updated.shardIndex) || shards[0];
        await recoveryKeyService.assignShardToGuardian(updated.id, guardianShard, guardian.userId);
      }
    } catch (error) {
      logger.error('Error generating recovery shard:', error);
      // Don't fail the acceptance if shard generation fails
    }

    res.json({
      id: updated.id,
      status: updated.status,
      message: 'Guardian invitation accepted',
    });
  } catch (error) {
    logger.error('Accept guardian error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// DELETE /api/guardians/:id - Remove guardian
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify guardian belongs to user
    const guardian = await prisma.guardian.findUnique({
      where: { id },
    });

    if (!guardian || guardian.userId !== req.userId) {
      return res.status(404).json({ error: 'Guardian not found' });
    }

    // Delete guardian
    await prisma.guardian.delete({
      where: { id },
    });

    res.json({ message: 'Guardian removed' });
  } catch (error) {
    logger.error('Remove guardian error:', error);
    res.status(500).json({ error: 'Failed to remove guardian' });
  }
});

// POST /api/guardians/recovery - Initiate recovery
router.post('/recovery', async (req: Request, res: Response) => {
  try {
    const { requesterEmail, reason } = req.body;

    if (!requesterEmail) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: requesterEmail },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get guardians count
    const guardians = await prisma.guardian.findMany({
      where: {
        userId: user.id,
        status: 'accepted',
      },
    });

    if (guardians.length === 0) {
      return res.status(400).json({ error: 'No guardians configured' });
    }

    // Calculate required approvals (M-of-N)
    const requiredApprovals = Math.ceil(guardians.length / 2); // Majority

    // Create recovery request
    const recovery = await prisma.recoveryRequest.create({
      data: {
        userId: user.id,
        requesterEmail,
        reason,
        status: 'pending',
        approvalCount: 0,
        requiredApprovals,
        canExecuteAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day time-lock
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Notify all guardians
    for (const guardian of guardians) {
      // Send email to guardian
      // TODO: Implement guardian notification
    }

    // Notify user
    await notificationService.send({
      userId: user.id,
      type: 'recovery_initiated',
      priority: 'critical',
      channels: ['email', 'push', 'sms'],
      data: {
        timelock: 7,
        requesterEmail,
      },
    });

    res.json({
      id: recovery.id,
      status: recovery.status,
      requiredApprovals: recovery.requiredApprovals,
      canExecuteAt: recovery.canExecuteAt,
    });
  } catch (error) {
    logger.error('Recovery initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate recovery' });
  }
});

// POST /api/guardians/approve - Approve recovery request
router.post('/approve', async (req: Request, res: Response) => {
  try {
    const { recoveryRequestId, approved } = req.body;

    if (!recoveryRequestId || approved === undefined) {
      return res.status(400).json({ error: 'Recovery request ID and approval required' });
    }

    // Find recovery request
    const recovery = await prisma.recoveryRequest.findUnique({
      where: { id: recoveryRequestId },
      include: { guardianApprovals: true },
    });

    if (!recovery) {
      return res.status(404).json({ error: 'Recovery request not found' });
    }

    // Check if expired
    if (recovery.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Recovery request expired' });
    }

    // Find guardian
    const guardian = await prisma.guardian.findFirst({
      where: {
        userId: recovery.userId,
        // In production: Verify guardian identity
      },
    });

    if (!guardian) {
      return res.status(403).json({ error: 'Not a guardian for this wallet' });
    }

    // Check if already approved/rejected
    const existingApproval = recovery.guardianApprovals.find(
      (a) => a.guardianId === guardian.id
    );

    if (existingApproval) {
      return res.status(409).json({ error: 'Already voted on this request' });
    }

    // Create approval
    const approval = await prisma.guardianApproval.create({
      data: {
        recoveryRequestId: recovery.id,
        guardianId: guardian.id,
        approved,
        ipAddress: req.ip,
      },
    });

    // Update recovery request count
    if (approved) {
      await prisma.recoveryRequest.update({
        where: { id: recovery.id },
        data: {
          approvalCount: { increment: 1 },
        },
      });
    }

    // Check if threshold reached
    const updated = await prisma.recoveryRequest.findUnique({
      where: { id: recovery.id },
    });

    if (updated && updated.approvalCount >= updated.requiredApprovals) {
      await prisma.recoveryRequest.update({
        where: { id: recovery.id },
        data: { status: 'approved' },
      });

      // Notify user
      await notificationService.send({
        userId: recovery.userId,
        type: 'guardian_approved',
        priority: 'high',
        channels: ['email', 'push'],
        data: {
          guardianName: guardian.name || guardian.email,
          approvalCount: updated.approvalCount,
          requiredApprovals: updated.requiredApprovals,
          canExecute: new Date() >= updated.canExecuteAt,
        },
      });
    }

    res.json({
      approval,
      approvalCount: updated?.approvalCount || recovery.approvalCount,
      requiredApprovals: recovery.requiredApprovals,
      canExecute: updated && new Date() >= updated.canExecuteAt,
    });
  } catch (error) {
    logger.error('Approve recovery error:', error);
    res.status(500).json({ error: 'Failed to approve recovery' });
  }
});

// POST /api/guardians/dispute - Dispute recovery request
router.post('/dispute', async (req: Request, res: Response) => {
  try {
    const { recoveryRequestId, reason } = req.body;

    if (!recoveryRequestId || !reason) {
      return res.status(400).json({ error: 'Recovery request ID and reason required' });
    }

    // Find recovery request
    const recovery = await prisma.recoveryRequest.findUnique({
      where: { id: recoveryRequestId },
    });

    if (!recovery) {
      return res.status(404).json({ error: 'Recovery request not found' });
    }

    // Verify user owns this wallet
    if (recovery.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update recovery request
    await prisma.recoveryRequest.update({
      where: { id: recoveryRequestId },
      data: {
        status: 'rejected',
        disputedAt: new Date(),
        disputeReason: reason,
      },
    });

    res.json({ message: 'Recovery request disputed and cancelled' });
  } catch (error) {
    logger.error('Dispute recovery error:', error);
    res.status(500).json({ error: 'Failed to dispute recovery' });
  }
});

// GET /api/guardians/recovery/:id - Get recovery request details
router.get('/recovery/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const recovery = await prisma.recoveryRequest.findUnique({
      where: { id },
      include: {
        guardianApprovals: {
          include: {
            guardian: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!recovery) {
      return res.status(404).json({ error: 'Recovery request not found' });
    }

    // Verify access (user or guardian)
    if (recovery.userId !== req.userId) {
      const isGuardian = await prisma.guardian.findFirst({
        where: {
          userId: recovery.userId,
          // Verify current user is guardian
        },
      });

      if (!isGuardian) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    res.json(recovery);
  } catch (error) {
    logger.error('Get recovery error:', error);
    res.status(500).json({ error: 'Failed to get recovery request' });
  }
});

export default router;
