/**
 * Guardian Recovery Service
 * 
 * Handles the complete recovery flow when a user gets locked out:
 * 1. User initiates recovery request
 * 2. Guardians are notified via Resend email
 * 3. Guardians approve/reject via portal
 * 4. Once threshold met + timelock expires, recovery completes
 * 5. User gets access to their wallet again
 */

import crypto from 'crypto';
import { logger } from '../services/logger.service';
import { prisma } from '../config/database';
import { recoveryKeyService } from './recovery-key.service';
import { emailService } from './email.service';

const APP_URL = process.env.FRONTEND_URL || 'https://app.paradex.trade';

// Configuration
const DEFAULT_TIMELOCK_HOURS = Number(process.env.RECOVERY_TIMELOCK_HOURS) || 72;
const GUARDIAN_THRESHOLD = Number(process.env.GUARDIAN_THRESHOLD) || 2;
const RECOVERY_REQUEST_EXPIRY_DAYS = 30;

// Recovery request status
export type RecoveryStatus = 'pending' | 'approved' | 'rejected' | 'disputed' | 'completed' | 'expired' | 'cancelled';

export interface RecoveryRequestData {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  reason: string;
  status: RecoveryStatus;
  initiatedAt: Date;
  timeLockEndsAt: Date;
  expiresAt: Date;
  requiredApprovals: number;
  currentApprovals: number;
  guardianApprovals: Array<{
    guardianId: string;
    guardianName: string;
    guardianEmail: string;
    approved: boolean;
    timestamp: Date;
    notes?: string;
  }>;
  newDeviceFingerprint?: string;
  recoveryToken?: string;
}

export interface InitiateRecoveryParams {
  userEmail: string;
  reason: string;
  newDeviceFingerprint?: string;
  verificationCode?: string;
}

export interface GuardianVoteParams {
  recoveryId: string;
  guardianToken: string;
  approved: boolean;
  notes?: string;
}

class GuardianRecoveryService {
  /**
   * Step 1: Initiate recovery request
   * Called when user is locked out and wants to recover via guardians
   */
  async initiateRecovery(params: InitiateRecoveryParams): Promise<{
    success: boolean;
    recoveryId?: string;
    message: string;
    timeLockEndsAt?: Date;
    requiredApprovals?: number;
    guardiansNotified?: number;
  }> {
    const { userEmail, reason, newDeviceFingerprint } = params;

    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: userEmail.toLowerCase() },
        include: {
          guardians: {
            where: { status: 'accepted' },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          message: 'No account found with this email address.',
        };
      }

      // Check if user has enough guardians
      const activeGuardians = user.guardians.filter(g => g.status === 'accepted');
      if (activeGuardians.length < GUARDIAN_THRESHOLD) {
        return {
          success: false,
          message: `You need at least ${GUARDIAN_THRESHOLD} active guardians to recover. You have ${activeGuardians.length}.`,
        };
      }

      // Check for existing pending recovery
      const existingRecovery = await prisma.recoveryRequest.findFirst({
        where: {
          userId: user.id,
          status: 'pending',
        },
      });

      if (existingRecovery) {
        return {
          success: false,
          message: 'You already have a pending recovery request. Please wait for guardians to respond.',
          recoveryId: existingRecovery.id,
        };
      }

      // Generate recovery ID and token
      const recoveryId = crypto.randomUUID();
      const recoveryToken = crypto.randomBytes(32).toString('hex');
      const now = new Date();
      const timeLockEndsAt = new Date(now.getTime() + DEFAULT_TIMELOCK_HOURS * 60 * 60 * 1000);
      const expiresAt = new Date(now.getTime() + RECOVERY_REQUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      // Create recovery request
      await prisma.recoveryRequest.create({
        data: {
          id: recoveryId,
          userId: user.id,
          requesterEmail: userEmail,
          reason,
          status: 'pending',
          requiredApprovals: GUARDIAN_THRESHOLD,
          approvalCount: 0,
          canExecuteAt: timeLockEndsAt,
          expiresAt,
        },
      });

      // Send notification to vault owner (in case of fraudulent request)
      if (user.email) {
        await emailService.sendRecoveryInitiatedNotification({
          to: user.email,
          ownerName: user.displayName || user.username || 'Vault Owner',
          initiatorEmail: userEmail,
          disputeLink: `${APP_URL}/recovery/dispute?id=${recoveryId}`,
          timeLockHours: DEFAULT_TIMELOCK_HOURS,
        });
      }

      // Send recovery request to all guardians
      let guardiansNotified = 0;
      for (const guardian of activeGuardians) {
        const portalLink = `${APP_URL}/guardian-portal?token=${guardian.inviteToken || ''}`;
        
        await emailService.sendRecoveryRequestToGuardian({
          to: guardian.email,
          guardianName: guardian.name || 'Guardian',
          ownerName: user.displayName || user.username || 'Vault Owner',
          reason,
          portalLink,
        });
        
        guardiansNotified++;
      }

      return {
        success: true,
        recoveryId,
        message: `Recovery request initiated. ${guardiansNotified} guardians have been notified.`,
        timeLockEndsAt,
        requiredApprovals: GUARDIAN_THRESHOLD,
        guardiansNotified,
      };
    } catch (error) {
      logger.error('Error initiating recovery:', error);
      return {
        success: false,
        message: 'Failed to initiate recovery. Please try again.',
      };
    }
  }

  /**
   * Step 2: Guardian votes on recovery request
   */
  async guardianVote(params: GuardianVoteParams): Promise<{
    success: boolean;
    message: string;
    currentApprovals?: number;
    requiredApprovals?: number;
    recoveryStatus?: RecoveryStatus;
    canComplete?: boolean;
  }> {
    const { recoveryId, guardianToken, approved, notes } = params;

    try {
      // Find guardian by token
      const guardian = await prisma.guardian.findFirst({
        where: { inviteToken: guardianToken },
      });

      if (!guardian) {
        return { success: false, message: 'Invalid guardian token.' };
      }

      // Find recovery request
      const recovery = await prisma.recoveryRequest.findUnique({
        where: { id: recoveryId },
        include: { guardianApprovals: true },
      });

      if (!recovery) {
        return { success: false, message: 'Recovery request not found.' };
      }

      if (recovery.status !== 'pending') {
        return { success: false, message: `Recovery is no longer pending. Status: ${recovery.status}` };
      }

      if (recovery.userId !== guardian.userId) {
        return { success: false, message: 'This recovery request is not for your vault owner.' };
      }

      // Check if guardian already voted
      const existingVote = recovery.guardianApprovals.find(
        a => a.guardianId === guardian.id
      );

      if (existingVote) {
        return { success: false, message: 'You have already voted on this recovery request.' };
      }

      // Record the vote
      await prisma.guardianApproval.create({
        data: {
          recoveryRequestId: recoveryId,
          guardianId: guardian.id,
          approved,
        },
      });

      // Update approval count
      const newApprovalCount = approved ? recovery.approvalCount + 1 : recovery.approvalCount;
      let newStatus: RecoveryStatus = 'pending';

      // Check if threshold reached
      if (newApprovalCount >= recovery.requiredApprovals) {
        newStatus = 'approved';
      }

      // Check if all guardians rejected (can't reach threshold)
      const totalVotes = recovery.guardianApprovals.length + 1;
      const totalGuardians = await prisma.guardian.count({
        where: { userId: recovery.userId, status: 'accepted' },
      });
      const remainingVotes = totalGuardians - totalVotes;
      const maxPossibleApprovals = newApprovalCount + remainingVotes;
      
      if (maxPossibleApprovals < recovery.requiredApprovals) {
        newStatus = 'rejected';
      }

      await prisma.recoveryRequest.update({
        where: { id: recoveryId },
        data: {
          approvalCount: newApprovalCount,
          status: newStatus,
        },
      });

      // Send notification to vault owner - get user from prisma
      const vaultOwner = await prisma.user.findUnique({
        where: { id: guardian.userId },
      });

      if (vaultOwner?.email) {
        await emailService.sendGuardianVotedNotification({
          to: vaultOwner.email,
          ownerName: vaultOwner.displayName || vaultOwner.username || 'Vault Owner',
          guardianName: guardian.name || 'Guardian',
          approved,
          currentApprovals: newApprovalCount,
          requiredApprovals: recovery.requiredApprovals,
        });

        // If approved, send final notification
        if (newStatus === 'approved') {
          await emailService.sendRecoveryApprovedNotification({
            to: vaultOwner.email,
            ownerName: vaultOwner.displayName || vaultOwner.username || 'Vault Owner',
            canExecuteAt: recovery.canExecuteAt || undefined,
          });
        }
      }

      const canComplete = newStatus === 'approved' && 
        recovery.canExecuteAt && 
        new Date() >= recovery.canExecuteAt;

      return {
        success: true,
        message: approved ? 'Recovery request approved.' : 'Recovery request rejected.',
        currentApprovals: newApprovalCount,
        requiredApprovals: recovery.requiredApprovals,
        recoveryStatus: newStatus,
        canComplete,
      };
    } catch (error) {
      logger.error('Error processing guardian vote:', error);
      return { success: false, message: 'Failed to process vote. Please try again.' };
    }
  }

  /**
   * Step 3: Complete recovery (after threshold + timelock)
   */
  async completeRecovery(recoveryId: string, recoveryToken: string): Promise<{
    success: boolean;
    message: string;
    recoveredKey?: string;
    newAccessToken?: string;
  }> {
    try {
      const recovery = await prisma.recoveryRequest.findUnique({
        where: { id: recoveryId },
        include: {
          user: true,
          guardianApprovals: {
            where: { approved: true },
            include: { guardian: true },
          },
        },
      });

      if (!recovery) {
        return { success: false, message: 'Recovery request not found.' };
      }

      // Note: recoveryToken validation would need to be added to RecoveryRequest model
      // For now, just validate by recovery ID

      if (recovery.status !== 'approved') {
        return { success: false, message: `Recovery is not approved. Status: ${recovery.status}` };
      }

      // Check timelock
      if (recovery.canExecuteAt && new Date() < recovery.canExecuteAt) {
        const hoursRemaining = Math.ceil(
          (recovery.canExecuteAt.getTime() - Date.now()) / (1000 * 60 * 60)
        );
        return {
          success: false,
          message: `Timelock not expired. ${hoursRemaining} hours remaining.`,
        };
      }

      // Get guardian shards
      const approvedGuardianIds = recovery.guardianApprovals.map(a => a.guardianId);
      const shards = await recoveryKeyService.getGuardianShards(
        recovery.userId,
        approvedGuardianIds
      );

      if (shards.length < recovery.requiredApprovals) {
        return {
          success: false,
          message: 'Not enough guardian shards available for recovery.',
        };
      }

      // Reconstruct private key from shards
      const recoveredKey = await recoveryKeyService.recoverKeyFromShards(
        shards,
        recovery.userId
      );

      // Mark recovery as completed
      await prisma.recoveryRequest.update({
        where: { id: recoveryId },
        data: {
          status: 'completed',
        },
      });

      // Generate new access token for the user
      const newAccessToken = crypto.randomBytes(32).toString('hex');

      // Notify user of successful recovery
      if (recovery.user.email) {
        await emailService.sendRecoveryCompletedNotification({
          to: recovery.user.email,
          ownerName: recovery.user.displayName || recovery.user.username || 'Vault Owner',
        });
      }

      return {
        success: true,
        message: 'Recovery completed successfully! Your wallet access has been restored.',
        recoveredKey,
        newAccessToken,
      };
    } catch (error) {
      logger.error('Error completing recovery:', error);
      return { success: false, message: 'Failed to complete recovery. Please contact support.' };
    }
  }

  /**
   * Dispute recovery (owner proves they're not locked out)
   */
  async disputeRecovery(
    recoveryId: string,
    recoveryToken: string,
    reason: string,
    ownerSignature: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const recovery = await prisma.recoveryRequest.findUnique({
        where: { id: recoveryId },
        include: {
          user: true,
          guardianApprovals: {
            include: { guardian: true },
          },
        },
      });

      if (!recovery) {
        return { success: false, message: 'Recovery request not found.' };
      }

      // Note: recoveryToken validation would need to be added to RecoveryRequest model

      if (recovery.status !== 'pending' && recovery.status !== 'approved') {
        return { success: false, message: 'Recovery cannot be disputed in current status.' };
      }

      // TODO: Verify owner signature (biometric, wallet signature, etc.)

      // Cancel the recovery
      await prisma.recoveryRequest.update({
        where: { id: recoveryId },
        data: {
          status: 'disputed',
          disputedAt: new Date(),
          disputeReason: reason,
        },
      });

      // Notify all guardians
      const guardianEmails = recovery.guardianApprovals.map(a => a.guardian.email);
      if (guardianEmails.length > 0) {
        await emailService.sendRecoveryDisputedNotification({
          to: guardianEmails,
          ownerName: recovery.user.displayName || recovery.user.username || 'Vault Owner',
          reason,
        });
      }

      return {
        success: true,
        message: 'Recovery request has been disputed and cancelled. Guardians have been notified.',
      };
    } catch (error) {
      logger.error('Error disputing recovery:', error);
      return { success: false, message: 'Failed to dispute recovery.' };
    }
  }

  /**
   * Get recovery status
   */
  async getRecoveryStatus(recoveryId: string): Promise<RecoveryRequestData | null> {
    const recovery = await prisma.recoveryRequest.findUnique({
      where: { id: recoveryId },
      include: {
        user: true,
        guardianApprovals: {
          include: { guardian: true },
        },
      },
    });

    if (!recovery) return null;

    return {
      id: recovery.id,
      userId: recovery.userId,
      userEmail: this.maskEmail(recovery.user.email),
      userName: recovery.user.displayName || recovery.user.username || 'Unknown',
      reason: recovery.reason || '',
      status: recovery.status as RecoveryStatus,
      initiatedAt: recovery.initiatedAt,
      timeLockEndsAt: recovery.canExecuteAt,
      expiresAt: recovery.expiresAt,
      requiredApprovals: recovery.requiredApprovals,
      currentApprovals: recovery.approvalCount,
      guardianApprovals: recovery.guardianApprovals.map(a => ({
        guardianId: a.guardianId,
        guardianName: a.guardian.name || 'Guardian',
        guardianEmail: this.maskEmail(a.guardian.email),
        approved: a.approved,
        timestamp: a.approvedAt,
      })),
    };
  }

  // ==================== HELPERS ====================

  private maskEmail(email: string | null): string {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const maskedLocal = local.length > 2 
      ? local[0] + '***' + local[local.length - 1]
      : local[0] + '***';
    return `${maskedLocal}@${domain}`;
  }
}

export const guardianRecoveryService = new GuardianRecoveryService();
