/**
 * Guardian Portal Routes
 * 
 * Standalone API endpoints for guardian portal - no authentication required
 * Guardians access via secure tokens instead of accounts
 */

import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { prisma } from '../config/database';
import { emailService } from '../services/email.service';
import { recoveryKeyService } from '../services/recovery-key.service';
import crypto from 'crypto';

const router = Router();

// Middleware to validate guardian token
async function validateGuardianToken(req: Request, res: Response, next: Function) {
    const token = req.query.token as string || req.body.token;

    if (!token) {
        return res.status(400).json({ message: 'Guardian token required' });
    }

    try {
        const guardian = await (prisma.guardian as any).findFirst({
            where: {
                OR: [
                    { inviteToken: token },
                    { portalToken: token },
                ],
            } as any,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        displayName: true,
                    },
                },
            },
        });

        if (!guardian) {
            return res.status(404).json({ message: 'Invalid or expired token' });
        }

        // Check if invite token is expired
        if (guardian.inviteToken === token && guardian.inviteExpiresAt && guardian.inviteExpiresAt < new Date()) {
            return res.status(410).json({ message: 'Invitation has expired' });
        }

        // Attach guardian to request
        (req as any).guardian = guardian;
        next();
    } catch (error) {
        logger.error('Token validation error:', error);
        res.status(500).json({ message: 'Failed to validate token' });
    }
}

// GET /api/guardian-portal/info - Get guardian info and status
router.get('/info', validateGuardianToken, async (req: Request, res: Response) => {
    try {
        const guardian = (req as any).guardian;

        // Get guardian setup info
        const guardianSetup = await (prisma as any).guardianSetup?.findFirst?.({
            where: { userId: guardian.userId },
        }) || null;

        // Get total active guardians
        const totalGuardians = await prisma.guardian.count({
            where: {
                userId: guardian.userId,
                status: 'accepted',
            },
        });

        // Check for pending recovery requests
        const pendingRecovery = await prisma.recoveryRequest.findFirst({
            where: {
                userId: guardian.userId,
                status: 'pending',
                expiresAt: { gt: new Date() },
            },
            include: {
                guardianApprovals: {
                    where: { guardianId: guardian.id },
                },
            },
        });

        // Format response
        const response = {
            id: guardian.id,
            name: guardian.name,
            email: guardian.email,
            status: guardian.status,
            walletOwnerName: guardian.user.displayName || guardian.user.email?.split('@')[0] || 'Wallet Owner',
            walletOwnerEmail: guardian.user.email,
            vaultName: guardianSetup?.vaultName || 'Main Wallet',
            threshold: guardianSetup?.threshold || 2,
            totalGuardians: totalGuardians || guardianSetup?.totalGuardians || 3,
            acceptedAt: guardian.acceptedAt?.toISOString(),
            hasPendingRecovery: !!pendingRecovery,
            pendingRecovery: pendingRecovery ? {
                id: pendingRecovery.id,
                initiatedAt: ((pendingRecovery as any).createdAt || pendingRecovery.initiatedAt || new Date()).toISOString(),
                expiresAt: pendingRecovery.expiresAt.toISOString(),
                canExecuteAt: pendingRecovery.canExecuteAt?.toISOString(),
                status: pendingRecovery.status,
                reason: pendingRecovery.reason,
                requiredApprovals: pendingRecovery.requiredApprovals,
                currentApprovals: pendingRecovery.approvalCount,
                guardianApproved: pendingRecovery.guardianApprovals[0]?.approved,
                guardianApprovalDate: ((pendingRecovery.guardianApprovals[0] as any)?.createdAt || pendingRecovery.guardianApprovals[0]?.approvedAt)?.toISOString(),
                timeLockRemaining: pendingRecovery.canExecuteAt
                    ? Math.max(0, Math.ceil((pendingRecovery.canExecuteAt.getTime() - Date.now()) / (1000 * 60 * 60)))
                    : undefined,
            } : null,
        };

        res.json(response);
    } catch (error) {
        logger.error('Get guardian info error:', error);
        res.status(500).json({ message: 'Failed to get guardian information' });
    }
});

// POST /api/guardian-portal/accept - Accept guardian invitation
router.post('/accept', validateGuardianToken, async (req: Request, res: Response) => {
    try {
        const guardian = (req as any).guardian;

        if (guardian.status !== 'pending') {
            return res.status(400).json({
                message: `Invitation already ${guardian.status}`
            });
        }

        // Generate a permanent portal token for the guardian
        const portalToken = crypto.randomBytes(32).toString('hex');

        // Update guardian status
        const updated = await prisma.guardian.update({
            where: { id: guardian.id },
            data: {
                status: 'accepted',
                acceptedAt: new Date(),
                portalToken,
                inviteToken: null,
                inviteExpiresAt: null,
            } as any,
        });

        // Assign key shard to guardian
        try {
            const user = await prisma.user.findUnique({
                where: { id: guardian.userId },
                include: { wallets: { where: { isDefault: true }, take: 1 } },
            });

            if (user?.wallets?.[0]) {
                // Get or generate shards
                const existingShards = await prisma.guardian.findMany({
                    where: {
                        userId: guardian.userId,
                        status: 'accepted',
                        shardIndex: { not: null },
                    },
                    select: { shardIndex: true },
                });

                const usedIndices = new Set(existingShards.map(g => g.shardIndex));
                let nextIndex = 0;
                while (usedIndices.has(nextIndex)) nextIndex++;

                // Generate new shard for this guardian
                const shards = await recoveryKeyService.generateKeyShards(
                    user.wallets[0].encryptedPrivateKey || '',
                    guardian.userId
                );

                if (shards[nextIndex]) {
                    await recoveryKeyService.assignShardToGuardian(updated.id, shards[nextIndex], guardian.userId);
                }
            }
        } catch (error) {
            logger.error('Error generating recovery shard:', error);
            // Don't fail acceptance if shard generation fails
        }

        // Notify wallet owner
        await emailService.sendGuardianAcceptedNotification({
            to: guardian.user.email,
            ownerName: guardian.user.displayName || 'there',
            guardianName: guardian.name || guardian.email,
            guardianEmail: guardian.email,
        });

        res.json({
            success: true,
            portalToken,
            message: 'You are now an active guardian',
        });
    } catch (error) {
        logger.error('Accept invitation error:', error);
        res.status(500).json({ message: 'Failed to accept invitation' });
    }
});

// POST /api/guardian-portal/decline - Decline guardian invitation
router.post('/decline', validateGuardianToken, async (req: Request, res: Response) => {
    try {
        const guardian = (req as any).guardian;
        const { reason } = req.body;

        if (guardian.status !== 'pending') {
            return res.status(400).json({
                message: `Cannot decline - invitation already ${guardian.status}`
            });
        }

        // Update guardian status
        await prisma.guardian.update({
            where: { id: guardian.id },
            data: {
                status: 'declined',
                declinedAt: new Date(),
                declineReason: reason,
                inviteToken: null,
                inviteExpiresAt: null,
            } as any,
        });

        // Notify wallet owner
        await emailService.sendGuardianDeclinedNotification({
            to: guardian.user.email,
            ownerName: guardian.user.displayName || 'there',
            guardianName: guardian.name || guardian.email,
            guardianEmail: guardian.email,
            reason,
        });

        res.json({
            success: true,
            message: 'Invitation declined',
        });
    } catch (error) {
        logger.error('Decline invitation error:', error);
        res.status(500).json({ message: 'Failed to decline invitation' });
    }
});

// POST /api/guardian-portal/approve-recovery - Approve or reject recovery request
router.post('/approve-recovery', validateGuardianToken, async (req: Request, res: Response) => {
    try {
        const guardian = (req as any).guardian;
        const { recoveryRequestId, approved, notes } = req.body;

        if (guardian.status !== 'accepted') {
            return res.status(403).json({
                message: 'Only active guardians can vote on recovery requests'
            });
        }

        // Find recovery request
        const recoveryRequest = await prisma.recoveryRequest.findFirst({
            where: {
                id: recoveryRequestId,
                userId: guardian.userId,
                status: 'pending',
            },
        });

        if (!recoveryRequest) {
            return res.status(404).json({ message: 'Recovery request not found or already processed' });
        }

        if (recoveryRequest.expiresAt < new Date()) {
            return res.status(410).json({ message: 'Recovery request has expired' });
        }

        // Check if already voted
        const existingApproval = await prisma.guardianApproval.findFirst({
            where: {
                recoveryRequestId: recoveryRequest.id,
                guardianId: guardian.id,
            },
        });

        if (existingApproval) {
            return res.status(409).json({ message: 'You have already voted on this request' });
        }

        // Create approval record
        await prisma.guardianApproval.create({
            data: {
                recoveryRequestId: recoveryRequest.id,
                guardianId: guardian.id,
                approved,
                notes,
                ipAddress: req.ip || 'unknown',
            } as any,
        });

        // Update approval count if approved
        if (approved) {
            const updated = await prisma.recoveryRequest.update({
                where: { id: recoveryRequest.id },
                data: {
                    approvalCount: { increment: 1 },
                },
            });

            // Check if threshold reached
            if (updated.approvalCount >= updated.requiredApprovals) {
                await prisma.recoveryRequest.update({
                    where: { id: recoveryRequest.id },
                    data: { status: 'approved' },
                });

                // Notify wallet owner
                await emailService.sendRecoveryApprovedNotification({
                    to: guardian.user.email,
                    ownerName: guardian.user.displayName || 'there',
                    canExecuteAt: recoveryRequest.canExecuteAt,
                });
            }
        }

        // Notify wallet owner of this vote
        await emailService.sendGuardianVotedNotification({
            to: guardian.user.email,
            ownerName: guardian.user.displayName || 'there',
            guardianName: guardian.name || guardian.email,
            approved,
            currentApprovals: approved ? recoveryRequest.approvalCount + 1 : recoveryRequest.approvalCount,
            requiredApprovals: recoveryRequest.requiredApprovals,
        });

        res.json({
            success: true,
            message: approved ? 'Recovery approved' : 'Recovery rejected',
        });
    } catch (error) {
        logger.error('Approve recovery error:', error);
        res.status(500).json({ message: 'Failed to process vote' });
    }
});

// POST /api/guardian-portal/contact-owner - Send message to wallet owner
router.post('/contact-owner', validateGuardianToken, async (req: Request, res: Response) => {
    try {
        const guardian = (req as any).guardian;
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Send email to owner
        await emailService.sendGuardianMessageToOwner({
            to: guardian.user.email,
            ownerName: guardian.user.displayName || 'there',
            guardianName: guardian.name || guardian.email,
            guardianEmail: guardian.email,
            message: message.trim(),
        });

        res.json({
            success: true,
            message: 'Message sent to wallet owner',
        });
    } catch (error) {
        logger.error('Contact owner error:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
});

// GET /api/guardian-portal/dashboard - Get guardian dashboard data
router.get('/dashboard', validateGuardianToken, async (req: Request, res: Response) => {
    try {
        const guardian = (req as any).guardian;

        if (guardian.status !== 'accepted') {
            return res.status(403).json({ message: 'Guardian not active' });
        }

        // Get all pending recovery requests
        const pendingRecoveries = await prisma.recoveryRequest.findMany({
            where: {
                userId: guardian.userId,
                status: 'pending',
                expiresAt: { gt: new Date() },
            },
            include: {
                guardianApprovals: {
                    where: { guardianId: guardian.id },
                },
            },
            orderBy: { initiatedAt: 'desc' } as any,
        });

        // Format pending actions
        const pendingActions = pendingRecoveries.map(recovery => ({
            claimId: recovery.id,
            status: recovery.status,
            myDecision: recovery.guardianApprovals[0]?.approved !== undefined
                ? (recovery.guardianApprovals[0].approved ? 'approve' : 'reject')
                : 'pending',
            createdAt: ((recovery as any).createdAt || recovery.initiatedAt || new Date()).toISOString(),
            reason: recovery.reason,
            approvalCount: recovery.approvalCount,
            requiredApprovals: recovery.requiredApprovals,
        }));

        res.json({
            party: {
                id: guardian.id,
                name: guardian.name,
                email: guardian.email,
                status: guardian.status,
            },
            vault: {
                id: guardian.userId,
                name: 'Main Wallet',
                status: 'active',
            },
            pendingActions,
            totalPendingClaims: pendingActions.filter(a => a.myDecision === 'pending').length,
        });
    } catch (error) {
        logger.error('Get dashboard error:', error);
        res.status(500).json({ message: 'Failed to load dashboard' });
    }
});

export default router;
