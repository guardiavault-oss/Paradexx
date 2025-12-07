import { prisma } from '../config/database';
import { logger } from '../services/logger.service';
import { emailService } from './email.service';
import crypto from 'crypto';

const INACTIVITY_OPTIONS = [30, 90, 180, 365];
const TIER_LIMITS = {
  essential: { maxBeneficiaries: 1, checkInReminders: false },
  premium: { maxBeneficiaries: Infinity, checkInReminders: true },
};
const TIER_PRICES = {
  essential: 14900, // $149
  premium: 29900, // $299
};

export interface CreateVaultInput {
  userId: string;
  name: string;
  description?: string;
  tier?: 'essential' | 'premium';
  inactivityDays?: number;
  walletAddresses?: string[];
  distributionMethod?: 'automatic' | 'manual';
  requiresGuardianApproval?: boolean;
}

export interface AddBeneficiaryInput {
  vaultId: string;
  name: string;
  email: string;
  walletAddress?: string;
  relationship?: string;
  percentage: number;
}

export interface AddGuardianInput {
  vaultId: string;
  name: string;
  email: string;
  walletAddress?: string;
  relationship?: string;
}

export interface UpdateVaultInput {
  name?: string;
  description?: string;
  inactivityDays?: number;
  distributionMethod?: 'automatic' | 'manual';
  requiresGuardianApproval?: boolean;
  walletAddresses?: string[];
  enableCheckInReminders?: boolean;
}

export class InheritanceService {
  async createVault(input: CreateVaultInput) {
    const { userId, name, description, tier = 'essential', inactivityDays = 365, walletAddresses, distributionMethod, requiresGuardianApproval } = input;

    if (!INACTIVITY_OPTIONS.includes(inactivityDays)) {
      throw new Error(`Invalid inactivity period. Must be one of: ${INACTIVITY_OPTIONS.join(', ')}`);
    }

    const existingVaults = await prisma.inheritanceVault.count({
      where: { userId, status: { not: 'cancelled' } },
    });

    if (existingVaults > 0) {
      throw new Error('User already has an active inheritance vault. Upgrade or cancel existing vault first.');
    }

    const vault = await prisma.inheritanceVault.create({
      data: {
        userId,
        name,
        description,
        tier,
        inactivityDays,
        walletAddresses: walletAddresses ? JSON.stringify(walletAddresses) : null,
        distributionMethod: distributionMethod || 'automatic',
        requiresGuardianApproval: requiresGuardianApproval || false,
        enableCheckInReminders: tier === 'premium',
        lastActivityAt: new Date(),
      },
      include: { beneficiaries: true },
    });

    await this.recordActivity(vault.id, 'vault_created', 'Inheritance vault created');

    return vault;
  }

  async getVault(userId: string) {
    const vault = await prisma.inheritanceVault.findFirst({
      where: { userId, status: { not: 'cancelled' } },
      include: {
        beneficiaries: {
          orderBy: { createdAt: 'asc' },
        },
        activities: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        notifications: {
          take: 10,
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (vault) {
      return {
        ...vault,
        walletAddresses: vault.walletAddresses ? JSON.parse(vault.walletAddresses) : [],
        daysUntilTrigger: this.calculateDaysUntilTrigger(vault),
        tierLimits: TIER_LIMITS[vault.tier as keyof typeof TIER_LIMITS],
      };
    }

    return null;
  }

  async updateVault(vaultId: string, userId: string, updates: UpdateVaultInput) {
    const vault = await prisma.inheritanceVault.findFirst({
      where: { id: vaultId, userId },
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    if (vault.status !== 'active') {
      throw new Error('Can only update active vaults');
    }

    if (updates.inactivityDays && !INACTIVITY_OPTIONS.includes(updates.inactivityDays)) {
      throw new Error(`Invalid inactivity period. Must be one of: ${INACTIVITY_OPTIONS.join(', ')}`);
    }

    if (updates.enableCheckInReminders && vault.tier !== 'premium') {
      throw new Error('Check-in reminders are only available for Premium tier');
    }

    const updatedVault = await prisma.inheritanceVault.update({
      where: { id: vaultId },
      data: {
        ...updates,
        walletAddresses: updates.walletAddresses ? JSON.stringify(updates.walletAddresses) : undefined,
        updatedAt: new Date(),
      },
      include: { beneficiaries: true },
    });

    await this.recordActivity(vaultId, 'vault_updated', 'Vault settings updated');

    return updatedVault;
  }

  async upgradeTier(vaultId: string, userId: string, newTier: 'essential' | 'premium') {
    const vault = await prisma.inheritanceVault.findFirst({
      where: { id: vaultId, userId },
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    if (vault.tier === newTier) {
      throw new Error(`Vault is already on ${newTier} tier`);
    }

    const updatedVault = await prisma.inheritanceVault.update({
      where: { id: vaultId },
      data: {
        tier: newTier,
        enableCheckInReminders: newTier === 'premium',
      },
      include: { beneficiaries: true },
    });

    await this.recordActivity(vaultId, 'tier_upgraded', `Upgraded to ${newTier} tier`);

    return updatedVault;
  }

  async addBeneficiary(input: AddBeneficiaryInput, userId: string) {
    const { vaultId, name, email, walletAddress, relationship, percentage } = input;

    const vault = await prisma.inheritanceVault.findFirst({
      where: { id: vaultId, userId },
      include: { beneficiaries: true },
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    if (vault.status !== 'active') {
      throw new Error('Can only add beneficiaries to active vaults');
    }

    const tierLimits = TIER_LIMITS[vault.tier as keyof typeof TIER_LIMITS];
    if (vault.beneficiaries.length >= tierLimits.maxBeneficiaries) {
      throw new Error(`${vault.tier} tier allows only ${tierLimits.maxBeneficiaries} beneficiary. Upgrade to Premium for unlimited beneficiaries.`);
    }

    const existingBeneficiary = vault.beneficiaries.find(b => b.email === email);
    if (existingBeneficiary) {
      throw new Error('This email is already added as a beneficiary');
    }

    const totalPercentage = vault.beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
    if (totalPercentage + percentage > 100) {
      throw new Error(`Total allocation would exceed 100%. Current: ${totalPercentage}%, Adding: ${percentage}%`);
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const beneficiary = await prisma.vaultBeneficiary.create({
      data: {
        vaultId,
        name,
        email,
        walletAddress,
        relationship,
        percentage,
        verificationToken,
      },
    });

    await this.recordActivity(vaultId, 'beneficiary_added', `Added beneficiary: ${name}`);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    await emailService.sendInheritanceBeneficiaryNotification({
      to: email,
      beneficiaryName: name,
      ownerName: user?.displayName || user?.email || 'Someone',
      verificationLink: `${process.env.FRONTEND_URL}/inheritance/verify/${verificationToken}`,
    });

    return beneficiary;
  }

  async updateBeneficiary(beneficiaryId: string, userId: string, updates: Partial<AddBeneficiaryInput>) {
    const beneficiary = await prisma.vaultBeneficiary.findUnique({
      where: { id: beneficiaryId },
      include: { vault: { include: { beneficiaries: true } } },
    });

    if (!beneficiary || beneficiary.vault.userId !== userId) {
      throw new Error('Beneficiary not found');
    }

    if (beneficiary.vault.status !== 'active') {
      throw new Error('Can only update beneficiaries in active vaults');
    }

    if (updates.percentage !== undefined) {
      const otherBeneficiaries = beneficiary.vault.beneficiaries.filter(b => b.id !== beneficiaryId);
      const totalOtherPercentage = otherBeneficiaries.reduce((sum, b) => sum + b.percentage, 0);
      if (totalOtherPercentage + updates.percentage > 100) {
        throw new Error(`Total allocation would exceed 100%. Other beneficiaries: ${totalOtherPercentage}%, New: ${updates.percentage}%`);
      }
    }

    const updatedBeneficiary = await prisma.vaultBeneficiary.update({
      where: { id: beneficiaryId },
      data: {
        name: updates.name,
        email: updates.email,
        walletAddress: updates.walletAddress,
        relationship: updates.relationship,
        percentage: updates.percentage,
      },
    });

    await this.recordActivity(beneficiary.vaultId, 'beneficiary_updated', `Updated beneficiary: ${updates.name || beneficiary.name}`);

    return updatedBeneficiary;
  }

  async removeBeneficiary(beneficiaryId: string, userId: string) {
    const beneficiary = await prisma.vaultBeneficiary.findUnique({
      where: { id: beneficiaryId },
      include: { vault: true },
    });

    if (!beneficiary || beneficiary.vault.userId !== userId) {
      throw new Error('Beneficiary not found');
    }

    if (beneficiary.vault.status !== 'active') {
      throw new Error('Can only remove beneficiaries from active vaults');
    }

    await prisma.vaultBeneficiary.delete({
      where: { id: beneficiaryId },
    });

    await this.recordActivity(beneficiary.vaultId, 'beneficiary_removed', `Removed beneficiary: ${beneficiary.name}`);

    return { success: true };
  }

  async verifyBeneficiary(verificationToken: string) {
    const beneficiary = await prisma.vaultBeneficiary.findUnique({
      where: { verificationToken },
      include: { vault: true },
    });

    if (!beneficiary) {
      throw new Error('Invalid verification token');
    }

    if (beneficiary.isVerified) {
      throw new Error('Beneficiary already verified');
    }

    const updated = await prisma.vaultBeneficiary.update({
      where: { id: beneficiary.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verificationToken: null,
      },
    });

    await this.recordActivity(beneficiary.vaultId, 'beneficiary_verified', `Beneficiary verified: ${beneficiary.name}`);

    return updated;
  }

  async recordActivity(vaultId: string, activityType: string, description?: string, ipAddress?: string, userAgent?: string) {
    await prisma.vaultActivity.create({
      data: {
        vaultId,
        activityType,
        description,
        ipAddress,
        userAgent,
      },
    });

    await prisma.inheritanceVault.update({
      where: { id: vaultId },
      data: {
        lastActivityAt: new Date(),
        triggerWarningAt: null,
        warningNotificationsSent: 0,
      },
    });
  }

  async checkIn(vaultId: string, userId: string) {
    const vault = await prisma.inheritanceVault.findFirst({
      where: { id: vaultId, userId },
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    await this.recordActivity(vaultId, 'check_in', 'Manual check-in performed');

    return { success: true, lastActivityAt: new Date() };
  }

  async cancelVault(vaultId: string, userId: string) {
    const vault = await prisma.inheritanceVault.findFirst({
      where: { id: vaultId, userId },
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    await prisma.inheritanceVault.update({
      where: { id: vaultId },
      data: { status: 'cancelled' },
    });

    await this.recordActivity(vaultId, 'vault_cancelled', 'Inheritance vault cancelled');

    return { success: true };
  }

  async processInactivityCheck() {
    logger.info('[InheritanceService] Running inactivity check...');
    const now = new Date();

    const activeVaults = await prisma.inheritanceVault.findMany({
      where: { status: 'active' },
      include: {
        beneficiaries: true,
      },
    });

    for (const vault of activeVaults) {
      try {
        const daysSinceActivity = Math.floor((now.getTime() - vault.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysUntilTrigger = vault.inactivityDays - daysSinceActivity;

        const user = await prisma.user.findUnique({ where: { id: vault.userId } });
        if (!user?.email) continue;

        if (daysUntilTrigger <= 0) {
          await this.triggerVault(vault.id, user.email, user.displayName || user.email);
        } else if (daysUntilTrigger <= 1 && vault.warningNotificationsSent < 2) {
          await this.sendWarningNotification(vault.id, user.email, user.displayName || user.email, 1);
        } else if (daysUntilTrigger <= 7 && vault.warningNotificationsSent < 1) {
          await this.sendWarningNotification(vault.id, user.email, user.displayName || user.email, 7);
        }

        if (vault.enableCheckInReminders && vault.tier === 'premium') {
          const daysSinceReminder = vault.lastCheckInReminder
            ? Math.floor((now.getTime() - vault.lastCheckInReminder.getTime()) / (1000 * 60 * 60 * 24))
            : 366;

          if (daysSinceReminder >= 365) {
            await this.sendCheckInReminder(vault.id, user.email, user.displayName || user.email);
          }
        }
      } catch (error) {
        logger.error(`[InheritanceService] Error processing vault ${vault.id}:`, error);
      }
    }

    const triggeredVaults = await prisma.inheritanceVault.findMany({
      where: { status: 'triggered', distributionMethod: 'automatic' },
      include: { beneficiaries: true },
    });

    for (const vault of triggeredVaults) {
      if (vault.canDistributeAt && vault.canDistributeAt <= now) {
        await this.processDistribution(vault.id);
      }
    }

    logger.info(`[InheritanceService] Processed ${activeVaults.length} active vaults, ${triggeredVaults.length} triggered vaults`);
  }

  private async sendWarningNotification(vaultId: string, userEmail: string, userName: string, daysRemaining: number) {
    await emailService.sendInheritanceWarning({
      to: userEmail,
      userName,
      daysRemaining,
      checkInLink: `${process.env.FRONTEND_URL}/inheritance/check-in`,
    });

    await prisma.vaultNotification.create({
      data: {
        vaultId,
        type: daysRemaining === 1 ? 'warning_24_hours' : 'warning_7_days',
        recipientEmail: userEmail,
        recipientType: 'owner',
        subject: `Inheritance Vault - ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} until trigger`,
      },
    });

    await prisma.inheritanceVault.update({
      where: { id: vaultId },
      data: {
        triggerWarningAt: new Date(),
        warningNotificationsSent: { increment: 1 },
      },
    });
  }

  private async sendCheckInReminder(vaultId: string, userEmail: string, userName: string) {
    await emailService.sendInheritanceCheckInReminder({
      to: userEmail,
      userName,
      checkInLink: `${process.env.FRONTEND_URL}/inheritance/check-in`,
    });

    await prisma.vaultNotification.create({
      data: {
        vaultId,
        type: 'check_in_reminder',
        recipientEmail: userEmail,
        recipientType: 'owner',
        subject: 'Annual Inheritance Vault Check-in Reminder',
      },
    });

    await prisma.inheritanceVault.update({
      where: { id: vaultId },
      data: { lastCheckInReminder: new Date() },
    });
  }

  private async triggerVault(vaultId: string, userEmail: string, userName: string) {
    const timelockDays = 7;
    const canDistributeAt = new Date(Date.now() + timelockDays * 24 * 60 * 60 * 1000);

    await prisma.inheritanceVault.update({
      where: { id: vaultId },
      data: {
        status: 'triggered',
        timelockStartAt: new Date(),
        canDistributeAt,
      },
    });

    await emailService.sendInheritanceTriggered({
      to: userEmail,
      userName,
      timelockDays,
      cancelLink: `${process.env.FRONTEND_URL}/inheritance/cancel-trigger`,
    });

    await prisma.vaultNotification.create({
      data: {
        vaultId,
        type: 'timelock_started',
        recipientEmail: userEmail,
        recipientType: 'owner',
        subject: 'Inheritance Vault Triggered - Timelock Started',
      },
    });

    const vault = await prisma.inheritanceVault.findUnique({
      where: { id: vaultId },
      include: { beneficiaries: true },
    });

    if (vault) {
      for (const beneficiary of vault.beneficiaries) {
        await emailService.sendInheritanceBeneficiaryAlert({
          to: beneficiary.email,
          beneficiaryName: beneficiary.name,
          ownerName: userName,
          timelockDays,
          claimLink: `${process.env.FRONTEND_URL}/inheritance/claim/${beneficiary.id}`,
        });

        await prisma.vaultNotification.create({
          data: {
            vaultId,
            type: 'beneficiary_notification',
            recipientEmail: beneficiary.email,
            recipientType: 'beneficiary',
            subject: 'Inheritance Vault - Asset Transfer Pending',
          },
        });
      }
    }

    await this.recordActivity(vaultId, 'vault_triggered', 'Vault triggered due to inactivity');
  }

  async cancelTrigger(vaultId: string, userId: string) {
    const vault = await prisma.inheritanceVault.findFirst({
      where: { id: vaultId, userId, status: 'triggered' },
    });

    if (!vault) {
      throw new Error('Triggered vault not found');
    }

    await prisma.inheritanceVault.update({
      where: { id: vaultId },
      data: {
        status: 'active',
        timelockStartAt: null,
        canDistributeAt: null,
        lastActivityAt: new Date(),
        warningNotificationsSent: 0,
        triggerWarningAt: null,
      },
    });

    await this.recordActivity(vaultId, 'trigger_cancelled', 'Vault trigger cancelled by owner');

    return { success: true };
  }

  private async processDistribution(vaultId: string) {
    const vault = await prisma.inheritanceVault.findUnique({
      where: { id: vaultId },
      include: { beneficiaries: true },
    });

    if (!vault) return;

    await prisma.inheritanceVault.update({
      where: { id: vaultId },
      data: {
        status: 'distributed',
        distributedAt: new Date(),
      },
    });

    const user = await prisma.user.findUnique({ where: { id: vault.userId } });

    for (const beneficiary of vault.beneficiaries) {
      await emailService.sendInheritanceDistributionComplete({
        to: beneficiary.email,
        beneficiaryName: beneficiary.name,
        ownerName: user?.displayName || user?.email || 'The vault owner',
        percentage: beneficiary.percentage,
        claimLink: `${process.env.FRONTEND_URL}/inheritance/claim/${beneficiary.id}`,
      });
    }

    await this.recordActivity(vaultId, 'distribution_complete', 'Assets distributed to beneficiaries');
  }

  private calculateDaysUntilTrigger(vault: { lastActivityAt: Date; inactivityDays: number }) {
    const now = new Date();
    const daysSinceActivity = Math.floor((now.getTime() - vault.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, vault.inactivityDays - daysSinceActivity);
  }

  getTierPrices() {
    return TIER_PRICES;
  }

  getTierLimits() {
    return TIER_LIMITS;
  }

  getInactivityOptions() {
    return INACTIVITY_OPTIONS;
  }

  // Guardian Management Methods
  async addGuardian(input: AddGuardianInput, userId: string) {
    const { vaultId, name, email, walletAddress, relationship } = input;

    const vault = await prisma.inheritanceVault.findFirst({
      where: { id: vaultId, userId },
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    if (vault.status !== 'active') {
      throw new Error('Can only add guardians to active vaults');
    }

    // Check if guardian already exists
    const existingGuardian = await prisma.vaultGuardian.findFirst({
      where: { vaultId, email },
    });

    if (existingGuardian) {
      throw new Error('This email is already added as a guardian');
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const guardian = await prisma.vaultGuardian.create({
      data: {
        vaultId,
        name,
        email,
        walletAddress,
        relationship,
        inviteToken,
        inviteExpiresAt: expiresAt,
        status: 'invited',
      },
    });

    await this.recordActivity(vaultId, 'guardian_invited', `Invited guardian: ${name}`);

    // Send guardian invitation email via Resend
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const currentGuardians = await prisma.vaultGuardian.count({ where: { vaultId } });

    await emailService.sendGuardianInvitation({
      to: email,
      guardianName: name,
      ownerName: user?.displayName || user?.email || 'A Paradex user',
      inviteLink: `${process.env.FRONTEND_URL}/inheritance/guardian/accept/${inviteToken}`,
      threshold: vault.requiresGuardianApproval ? 2 : 1,
      totalGuardians: currentGuardians,
    });

    return guardian;
  }

  async getGuardians(vaultId: string, userId: string) {
    const vault = await prisma.inheritanceVault.findFirst({
      where: { id: vaultId, userId },
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    const guardians = await prisma.vaultGuardian.findMany({
      where: { vaultId },
      orderBy: { createdAt: 'asc' },
    });

    return guardians;
  }

  async removeGuardian(guardianId: string, userId: string) {
    const guardian = await prisma.vaultGuardian.findUnique({
      where: { id: guardianId },
      include: { vault: true },
    });

    if (!guardian?.vault || guardian.vault.userId !== userId) {
      throw new Error('Guardian not found');
    }

    if (guardian.vault.status !== 'active') {
      throw new Error('Can only remove guardians from active vaults');
    }

    await prisma.vaultGuardian.delete({
      where: { id: guardianId },
    });

    await this.recordActivity(guardian.vaultId, 'guardian_removed', `Removed guardian: ${guardian.name}`);

    return { success: true };
  }

  async acceptGuardianInvite(inviteToken: string) {
    const guardian = await prisma.vaultGuardian.findFirst({
      where: { inviteToken },
      include: { vault: { include: { user: true } } },
    });

    if (!guardian) {
      throw new Error('Invalid invitation token');
    }

    if (guardian.status !== 'invited') {
      throw new Error('Invitation has already been processed');
    }

    if (guardian.inviteExpiresAt && guardian.inviteExpiresAt < new Date()) {
      throw new Error('Invitation has expired');
    }

    const updated = await prisma.vaultGuardian.update({
      where: { id: guardian.id },
      data: {
        status: 'active',
        acceptedAt: new Date(),
        inviteToken: null,
        inviteExpiresAt: null,
      },
    });

    await this.recordActivity(guardian.vaultId, 'guardian_accepted', `Guardian accepted: ${guardian.name}`);

    // Notify owner that guardian accepted
    if (guardian.vault.user?.email) {
      await emailService.sendGuardianAcceptedNotification({
        to: guardian.vault.user.email,
        ownerName: guardian.vault.user.displayName || guardian.vault.user.email,
        guardianName: guardian.name,
        guardianEmail: guardian.email,
      });
    }

    return updated;
  }

  async declineGuardianInvite(inviteToken: string, reason?: string) {
    const guardian = await prisma.vaultGuardian.findFirst({
      where: { inviteToken },
      include: { vault: { include: { user: true } } },
    });

    if (!guardian) {
      throw new Error('Invalid invitation token');
    }

    if (guardian.status !== 'invited') {
      throw new Error('Invitation has already been processed');
    }

    const updated = await prisma.vaultGuardian.update({
      where: { id: guardian.id },
      data: {
        status: 'declined',
        declinedAt: new Date(),
        inviteToken: null,
        inviteExpiresAt: null,
      },
    });

    await this.recordActivity(guardian.vaultId, 'guardian_declined', `Guardian declined: ${guardian.name}`);

    // Notify owner that guardian declined
    if (guardian.vault.user?.email) {
      await emailService.sendGuardianDeclinedNotification({
        to: guardian.vault.user.email,
        ownerName: guardian.vault.user.displayName || guardian.vault.user.email,
        guardianName: guardian.name,
        guardianEmail: guardian.email,
        reason,
      });
    }

    return updated;
  }

  async resendGuardianInvite(guardianId: string, userId: string) {
    const guardian = await prisma.vaultGuardian.findUnique({
      where: { id: guardianId },
      include: { vault: true },
    });

    if (!guardian?.vault || guardian.vault.userId !== userId) {
      throw new Error('Guardian not found');
    }

    if (guardian.status !== 'invited') {
      throw new Error('Can only resend to pending guardians');
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.vaultGuardian.update({
      where: { id: guardianId },
      data: {
        inviteToken,
        inviteExpiresAt: expiresAt,
      },
    });

    const currentGuardians = await prisma.vaultGuardian.count({ where: { vaultId: guardian.vaultId } });
    const user = await prisma.user.findUnique({ where: { id: guardian.vault.userId } });

    await emailService.sendGuardianInvitation({
      to: guardian.email,
      guardianName: guardian.name,
      ownerName: user?.displayName || user?.email || 'A Paradex user',
      inviteLink: `${process.env.FRONTEND_URL}/inheritance/guardian/accept/${inviteToken}`,
      threshold: guardian.vault.requiresGuardianApproval ? 2 : 1,
      totalGuardians: currentGuardians,
    });

    await this.recordActivity(guardian.vaultId, 'guardian_invite_resent', `Resent invite to: ${guardian.name}`);

    return { success: true };
  }

  // Notify all guardians when vault is triggered
  async notifyGuardiansOfTrigger(vaultId: string) {
    const vault = await prisma.inheritanceVault.findUnique({
      where: { id: vaultId },
      include: {
        beneficiaries: true,
      },
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    const user = await prisma.user.findUnique({ where: { id: vault.userId } });
    const guardians = await prisma.vaultGuardian.findMany({
      where: { vaultId, status: 'active' },
    });

    const ownerName = user?.displayName || user?.email || 'The vault owner';

    for (const guardian of guardians) {
      try {
        await emailService.sendInheritanceGuardianVaultTriggeredNotification({
          to: guardian.email,
          guardianName: guardian.name,
          ownerName,
          vaultName: vault.name,
          timelockDays: 7,
          actionLink: `${process.env.FRONTEND_URL}/inheritance/guardian/review/${vaultId}`,
        });

        await prisma.vaultNotification.create({
          data: {
            vaultId,
            type: 'guardian_vault_triggered',
            recipientEmail: guardian.email,
            recipientType: 'guardian',
            subject: `Inheritance Vault Triggered - Action Required`,
          },
        });

        logger.info(`[InheritanceService] Notified guardian ${guardian.email} of vault trigger`);
      } catch (error) {
        logger.error(`[InheritanceService] Failed to notify guardian ${guardian.email}:`, error);
      }
    }

    return { notifiedCount: guardians.length };
  }
}

export const inheritanceService = new InheritanceService();
