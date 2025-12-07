/**
 * Social Vault Service - Shared Wallets & Family Features
 * 
 * Features:
 * - Family Vault (shared wallet with spending controls)
 * - Group Vault (friends/team shared investments)
 * - Allowance System (kids/dependents)
 * - Approval Workflows (multi-sig for families)
 * - Gift Crypto (scheduled gifting with messages)
 * - Savings Goals (collaborative saving targets)
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { walletService } from './wallet.service';
import { prisma } from '../config/database';

// Types
export interface SocialVault {
    id: string;
    name: string;
    type: 'family' | 'group' | 'couple';
    creatorId: string;
    members: VaultMember[];
    address: string;
    totalBalance: string;

    // Settings
    settings: VaultSettings;

    // Goals
    savingsGoals: SavingsGoal[];

    createdAt: Date;
    updatedAt: Date;
}

export interface VaultMember {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member' | 'child';

    // Permissions
    permissions: MemberPermissions;

    // Allowance (for children/dependents)
    allowance?: AllowanceConfig;

    joinedAt: Date;
    lastActive?: Date;
}

export interface MemberPermissions {
    canDeposit: boolean;
    canWithdraw: boolean;
    withdrawLimit: string;           // Per transaction
    dailyLimit: string;
    requiresApproval: boolean;
    approvalThreshold: string;       // Amount requiring approval
    canInviteMembers: boolean;
    canModifySettings: boolean;
    canViewAllTransactions: boolean;
}

export interface VaultSettings {
    // Approval Settings
    approvalRequired: boolean;
    minApprovers: number;            // M of N approval
    approvalTimeout: number;         // Hours before auto-reject

    // Spending Rules
    globalDailyLimit: string;
    globalMonthlyLimit: string;
    restrictedAddresses: string[];   // Blacklisted addresses
    allowedAddresses: string[];      // Whitelist (if not empty)

    // Categories
    categoryLimits: {
        category: string;              // 'entertainment', 'education', etc.
        dailyLimit: string;
        monthlyLimit: string;
    }[];

    // Notifications
    notifyOnDeposit: boolean;
    notifyOnWithdraw: boolean;
    notifyOnLowBalance: boolean;
    lowBalanceThreshold: string;
}

export interface AllowanceConfig {
    enabled: boolean;
    amount: string;
    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
    nextPayment: Date;
    autoTopUp: boolean;
    maxBalance: string;              // Don't top up above this

    // Restrictions
    restrictedCategories: string[];
    allowedMerchants: string[];
    requiresReceipt: boolean;        // Must explain spending
}

export interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: string;
    currentAmount: string;
    deadline?: Date;

    // Contributors
    contributors: {
        memberId: string;
        contributed: string;
        targetContribution?: string;
    }[];

    // Milestones
    milestones: {
        percent: number;
        message: string;
        reached: boolean;
        reachedAt?: Date;
    }[];

    status: 'active' | 'completed' | 'cancelled';
    createdAt: Date;
    completedAt?: Date;
}

export interface CryptoGift {
    id: string;
    fromUserId: string;
    toEmail: string;
    toName: string;

    // Gift Details
    asset: string;
    amount: string;
    message: string;
    occasion?: 'birthday' | 'holiday' | 'graduation' | 'wedding' | 'other';

    // Scheduling
    scheduledFor?: Date;
    recurring?: {
        frequency: 'yearly' | 'monthly';
        endDate?: Date;
    };

    // Status
    status: 'scheduled' | 'sent' | 'claimed' | 'expired' | 'cancelled';
    sentAt?: Date;
    claimedAt?: Date;
    claimCode?: string;

    // NFT Gift Card (optional)
    giftCardNftId?: string;

    createdAt: Date;
}

export interface VaultTransaction {
    id: string;
    vaultId: string;
    initiatorId: string;

    // Transaction Details
    type: 'deposit' | 'withdraw' | 'internal_transfer' | 'allowance' | 'gift';
    asset: string;
    amount: string;
    recipient?: string;
    category?: string;
    note?: string;

    // Approval
    approvalStatus: 'pending' | 'approved' | 'rejected' | 'not_required';
    approvals: {
        memberId: string;
        approved: boolean;
        timestamp: Date;
        note?: string;
    }[];
    requiredApprovals: number;

    // Execution
    executed: boolean;
    executedAt?: Date;
    txHash?: string;

    createdAt: Date;
}

class SocialVaultService extends EventEmitter {
    private vaults: Map<string, SocialVault> = new Map();
    private transactions: Map<string, VaultTransaction[]> = new Map();
    private gifts: Map<string, CryptoGift[]> = new Map();
    private allowanceTimers: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        super();
        this.startAllowanceScheduler();
    }

    // ===========================
    // VAULT MANAGEMENT
    // ===========================

    async createVault(
        creatorId: string,
        params: {
            name: string;
            type: 'family' | 'group' | 'couple';
            initialMembers?: { email: string; name: string; role: VaultMember['role'] }[];
        }
    ): Promise<SocialVault> {
        const vaultId = `vault_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        // Create actual wallet for the vault using wallet service
        const vaultWallet = await walletService.createWallet('ethereum');
        const address = vaultWallet.address;

        // Store encrypted private key in database for vault
        const encryptedKey = walletService.encryptPrivateKey(vaultWallet.privateKey, creatorId);

        // Save vault wallet to database
        await prisma.wallet.create({
            data: {
                userId: creatorId,
                address: vaultWallet.address,
                publicKey: vaultWallet.publicKey,
                encryptedPrivateKey: encryptedKey,
                walletType: 'social_vault',
                chain: 'ethereum',
                name: `${params.name} Vault`,
            },
        });

        const vault: SocialVault = {
            id: vaultId,
            name: params.name,
            type: params.type,
            creatorId,
            address,
            totalBalance: '0',
            members: [{
                id: `member_${Date.now()}`,
                userId: creatorId,
                name: 'Creator',
                email: '',
                role: 'owner',
                permissions: this.getDefaultPermissions('owner'),
                joinedAt: new Date(),
            }],
            settings: this.getDefaultSettings(params.type),
            savingsGoals: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Add initial members
        if (params.initialMembers) {
            for (const member of params.initialMembers) {
                await this.inviteMember(vaultId, creatorId, member);
            }
        }

        this.vaults.set(vaultId, vault);
        this.emit('vaultCreated', { vault });

        return vault;
    }

    getVault(vaultId: string): SocialVault | null {
        return this.vaults.get(vaultId) || null;
    }

    getUserVaults(userId: string): SocialVault[] {
        const userVaults: SocialVault[] = [];
        for (const vault of this.vaults.values()) {
            if (vault.members.some(m => m.userId === userId)) {
                userVaults.push(vault);
            }
        }
        return userVaults;
    }

    // ===========================
    // MEMBER MANAGEMENT
    // ===========================

    async inviteMember(
        vaultId: string,
        inviterId: string,
        member: {
            email: string;
            name: string;
            role: VaultMember['role'];
            allowance?: AllowanceConfig;
        }
    ): Promise<VaultMember> {
        const vault = this.vaults.get(vaultId);
        if (!vault) throw new Error('Vault not found');

        const inviter = vault.members.find(m => m.userId === inviterId);
        if (!inviter || !inviter.permissions.canInviteMembers) {
            throw new Error('No permission to invite members');
        }

        const newMember: VaultMember = {
            id: `member_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            userId: '',  // Filled when they accept
            name: member.name,
            email: member.email,
            role: member.role,
            permissions: this.getDefaultPermissions(member.role),
            allowance: member.allowance,
            joinedAt: new Date(),
        };

        vault.members.push(newMember);
        vault.updatedAt = new Date();

        this.emit('memberInvited', { vaultId, member: newMember, inviterId });

        return newMember;
    }

    async updateMemberPermissions(
        vaultId: string,
        memberId: string,
        permissions: Partial<MemberPermissions>
    ): Promise<VaultMember | null> {
        const vault = this.vaults.get(vaultId);
        if (!vault) return null;

        const member = vault.members.find(m => m.id === memberId);
        if (!member) return null;

        member.permissions = { ...member.permissions, ...permissions };
        vault.updatedAt = new Date();

        return member;
    }

    async setAllowance(
        vaultId: string,
        memberId: string,
        allowance: AllowanceConfig
    ): Promise<VaultMember | null> {
        const vault = this.vaults.get(vaultId);
        if (!vault) return null;

        const member = vault.members.find(m => m.id === memberId);
        if (!member) return null;

        member.allowance = allowance;
        vault.updatedAt = new Date();

        // Schedule allowance payments
        this.scheduleAllowance(vaultId, memberId);

        this.emit('allowanceSet', { vaultId, memberId, allowance });

        return member;
    }

    private getDefaultPermissions(role: VaultMember['role']): MemberPermissions {
        switch (role) {
            case 'owner':
                return {
                    canDeposit: true,
                    canWithdraw: true,
                    withdrawLimit: '1000000',
                    dailyLimit: '1000000',
                    requiresApproval: false,
                    approvalThreshold: '1000000',
                    canInviteMembers: true,
                    canModifySettings: true,
                    canViewAllTransactions: true,
                };
            case 'admin':
                return {
                    canDeposit: true,
                    canWithdraw: true,
                    withdrawLimit: '10000',
                    dailyLimit: '50000',
                    requiresApproval: false,
                    approvalThreshold: '5000',
                    canInviteMembers: true,
                    canModifySettings: false,
                    canViewAllTransactions: true,
                };
            case 'member':
                return {
                    canDeposit: true,
                    canWithdraw: true,
                    withdrawLimit: '1000',
                    dailyLimit: '5000',
                    requiresApproval: true,
                    approvalThreshold: '500',
                    canInviteMembers: false,
                    canModifySettings: false,
                    canViewAllTransactions: false,
                };
            case 'child':
                return {
                    canDeposit: true,
                    canWithdraw: false, // Only through allowance
                    withdrawLimit: '0',
                    dailyLimit: '0',
                    requiresApproval: true,
                    approvalThreshold: '0',
                    canInviteMembers: false,
                    canModifySettings: false,
                    canViewAllTransactions: false,
                };
        }
    }

    private getDefaultSettings(type: SocialVault['type']): VaultSettings {
        return {
            approvalRequired: type !== 'couple',
            minApprovers: type === 'family' ? 1 : 2,
            approvalTimeout: 48,
            globalDailyLimit: '10000',
            globalMonthlyLimit: '50000',
            restrictedAddresses: [],
            allowedAddresses: [],
            categoryLimits: [
                { category: 'entertainment', dailyLimit: '500', monthlyLimit: '2000' },
                { category: 'education', dailyLimit: '1000', monthlyLimit: '5000' },
                { category: 'groceries', dailyLimit: '200', monthlyLimit: '2000' },
            ],
            notifyOnDeposit: true,
            notifyOnWithdraw: true,
            notifyOnLowBalance: true,
            lowBalanceThreshold: '100',
        };
    }

    // ===========================
    // TRANSACTIONS & APPROVALS
    // ===========================

    async initiateTransaction(
        vaultId: string,
        initiatorId: string,
        params: {
            type: VaultTransaction['type'];
            asset: string;
            amount: string;
            recipient?: string;
            category?: string;
            note?: string;
        }
    ): Promise<VaultTransaction> {
        const vault = this.vaults.get(vaultId);
        if (!vault) throw new Error('Vault not found');

        const member = vault.members.find(m => m.userId === initiatorId);
        if (!member) throw new Error('Not a member of this vault');

        // Check permissions
        if (params.type === 'withdraw' && !member.permissions.canWithdraw) {
            throw new Error('No withdrawal permission');
        }

        // Determine if approval needed
        const amount = parseFloat(params.amount);
        const needsApproval =
            member.permissions.requiresApproval ||
            amount > parseFloat(member.permissions.approvalThreshold) ||
            vault.settings.approvalRequired;

        const tx: VaultTransaction = {
            id: `vtx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            vaultId,
            initiatorId,
            ...params,
            approvalStatus: needsApproval ? 'pending' : 'not_required',
            approvals: [],
            requiredApprovals: needsApproval ? vault.settings.minApprovers : 0,
            executed: !needsApproval,
            executedAt: needsApproval ? undefined : new Date(),
            createdAt: new Date(),
        };

        const vaultTxs = this.transactions.get(vaultId) || [];
        vaultTxs.push(tx);
        this.transactions.set(vaultId, vaultTxs);

        if (!needsApproval) {
            // Execute immediately
            await this.executeTransaction(tx.id);
        } else {
            // Notify approvers
            this.emit('approvalNeeded', { vault, transaction: tx });
        }

        return tx;
    }

    async approveTransaction(
        txId: string,
        approverId: string,
        approved: boolean,
        note?: string
    ): Promise<VaultTransaction | null> {
        for (const [vaultId, txs] of this.transactions.entries()) {
            const tx = txs.find(t => t.id === txId);
            if (tx) {
                const vault = this.vaults.get(vaultId);
                if (!vault) return null;

                const approver = vault.members.find(m => m.userId === approverId);
                if (!approver || approver.role === 'child') {
                    throw new Error('No approval permission');
                }

                // Add approval
                tx.approvals.push({
                    memberId: approver.id,
                    approved,
                    timestamp: new Date(),
                    note,
                });

                // Check if enough approvals
                const approvedCount = tx.approvals.filter(a => a.approved).length;
                const rejectedCount = tx.approvals.filter(a => !a.approved).length;

                if (approvedCount >= tx.requiredApprovals) {
                    tx.approvalStatus = 'approved';
                    await this.executeTransaction(tx.id);
                } else if (rejectedCount > vault.members.length - tx.requiredApprovals) {
                    tx.approvalStatus = 'rejected';
                }

                this.emit('transactionApproval', { tx, approverId, approved });

                return tx;
            }
        }
        return null;
    }

    private async executeTransaction(txId: string): Promise<boolean> {
        for (const [vaultId, txs] of this.transactions.entries()) {
            const tx = txs.find(t => t.id === txId);
            if (tx && !tx.executed) {
                // In production: Execute actual blockchain transaction
                tx.executed = true;
                tx.executedAt = new Date();
                tx.txHash = '0x' + crypto.randomBytes(32).toString('hex');

                // Update vault balance
                const vault = this.vaults.get(vaultId);
                if (vault) {
                    const amount = parseFloat(tx.amount);
                    const currentBalance = parseFloat(vault.totalBalance);

                    if (tx.type === 'deposit') {
                        vault.totalBalance = (currentBalance + amount).toFixed(2);
                    } else if (tx.type === 'withdraw') {
                        vault.totalBalance = (currentBalance - amount).toFixed(2);
                    }
                }

                this.emit('transactionExecuted', { tx });
                return true;
            }
        }
        return false;
    }

    getVaultTransactions(vaultId: string, limit: number = 50): VaultTransaction[] {
        return (this.transactions.get(vaultId) || [])
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }

    getPendingApprovals(userId: string): VaultTransaction[] {
        const pending: VaultTransaction[] = [];

        for (const [vaultId, txs] of this.transactions.entries()) {
            const vault = this.vaults.get(vaultId);
            if (!vault) continue;

            const member = vault.members.find(m => m.userId === userId);
            if (!member || member.role === 'child') continue;

            for (const tx of txs) {
                if (
                    tx.approvalStatus === 'pending' &&
                    !tx.approvals.some(a => a.memberId === member.id)
                ) {
                    pending.push(tx);
                }
            }
        }

        return pending;
    }

    // ===========================
    // SAVINGS GOALS
    // ===========================

    async createSavingsGoal(
        vaultId: string,
        creatorId: string,
        params: {
            name: string;
            targetAmount: string;
            deadline?: Date;
            memberTargets?: { memberId: string; target: string }[];
        }
    ): Promise<SavingsGoal> {
        const vault = this.vaults.get(vaultId);
        if (!vault) throw new Error('Vault not found');

        const goal: SavingsGoal = {
            id: `goal_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            name: params.name,
            targetAmount: params.targetAmount,
            currentAmount: '0',
            deadline: params.deadline,
            contributors: vault.members.map(m => ({
                memberId: m.id,
                contributed: '0',
                targetContribution: params.memberTargets?.find(t => t.memberId === m.id)?.target,
            })),
            milestones: [
                { percent: 25, message: '25% reached! Keep going!', reached: false },
                { percent: 50, message: 'Halfway there!', reached: false },
                { percent: 75, message: '75% complete!', reached: false },
                { percent: 100, message: 'Goal reached! 🎉', reached: false },
            ],
            status: 'active',
            createdAt: new Date(),
        };

        vault.savingsGoals.push(goal);
        vault.updatedAt = new Date();

        this.emit('savingsGoalCreated', { vaultId, goal });

        return goal;
    }

    async contributeToGoal(
        vaultId: string,
        goalId: string,
        memberId: string,
        amount: string
    ): Promise<SavingsGoal | null> {
        const vault = this.vaults.get(vaultId);
        if (!vault) return null;

        const goal = vault.savingsGoals.find(g => g.id === goalId);
        if (!goal || goal.status !== 'active') return null;

        const contributor = goal.contributors.find(c => c.memberId === memberId);
        if (contributor) {
            contributor.contributed = (parseFloat(contributor.contributed) + parseFloat(amount)).toFixed(2);
        }

        goal.currentAmount = (parseFloat(goal.currentAmount) + parseFloat(amount)).toFixed(2);

        // Check milestones
        const progressPercent = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
        for (const milestone of goal.milestones) {
            if (!milestone.reached && progressPercent >= milestone.percent) {
                milestone.reached = true;
                milestone.reachedAt = new Date();
                this.emit('milestoneReached', { vaultId, goalId, milestone });
            }
        }

        // Check completion
        if (parseFloat(goal.currentAmount) >= parseFloat(goal.targetAmount)) {
            goal.status = 'completed';
            goal.completedAt = new Date();
            this.emit('savingsGoalCompleted', { vaultId, goal });
        }

        return goal;
    }

    // ===========================
    // CRYPTO GIFTS
    // ===========================

    async createGift(
        fromUserId: string,
        params: {
            toEmail: string;
            toName: string;
            asset: string;
            amount: string;
            message: string;
            occasion?: CryptoGift['occasion'];
            scheduledFor?: Date;
            recurring?: CryptoGift['recurring'];
        }
    ): Promise<CryptoGift> {
        const claimCode = crypto.randomBytes(16).toString('hex');

        const gift: CryptoGift = {
            id: `gift_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            fromUserId,
            toEmail: params.toEmail,
            toName: params.toName,
            asset: params.asset,
            amount: params.amount,
            message: params.message,
            occasion: params.occasion,
            scheduledFor: params.scheduledFor,
            recurring: params.recurring,
            status: params.scheduledFor && params.scheduledFor > new Date() ? 'scheduled' : 'sent',
            sentAt: !params.scheduledFor ? new Date() : undefined,
            claimCode,
            createdAt: new Date(),
        };

        const userGifts = this.gifts.get(fromUserId) || [];
        userGifts.push(gift);
        this.gifts.set(fromUserId, userGifts);

        if (gift.status === 'sent') {
            // In production: Send notification email
            this.emit('giftSent', { gift });
        } else {
            // Schedule gift
            this.scheduleGift(gift);
        }

        return gift;
    }

    async claimGift(claimCode: string, claimerAddress: string): Promise<CryptoGift | null> {
        for (const [userId, gifts] of this.gifts.entries()) {
            const gift = gifts.find(g => g.claimCode === claimCode && g.status === 'sent');
            if (gift) {
                // In production: Transfer assets to claimer
                gift.status = 'claimed';
                gift.claimedAt = new Date();

                this.emit('giftClaimed', { gift, claimerAddress });

                return gift;
            }
        }
        return null;
    }

    getUserGifts(userId: string, type: 'sent' | 'received'): CryptoGift[] {
        if (type === 'sent') {
            return this.gifts.get(userId) || [];
        }
        // For received, would need to track by email/userId mapping
        return [];
    }

    private scheduleGift(gift: CryptoGift) {
        if (!gift.scheduledFor) return;

        const delay = gift.scheduledFor.getTime() - Date.now();
        if (delay <= 0) {
            this.sendGift(gift);
            return;
        }

        setTimeout(() => {
            this.sendGift(gift);
        }, delay);
    }

    private async sendGift(gift: CryptoGift) {
        gift.status = 'sent';
        gift.sentAt = new Date();

        // In production: Execute transfer and send notification
        this.emit('giftSent', { gift });

        // Schedule next if recurring
        if (gift.recurring) {
            const nextGift = { ...gift };
            nextGift.id = `gift_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
            nextGift.status = 'scheduled';

            const nextDate = new Date(gift.scheduledFor!);
            if (gift.recurring.frequency === 'yearly') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            } else {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }

            if (!gift.recurring.endDate || nextDate <= gift.recurring.endDate) {
                nextGift.scheduledFor = nextDate;
                const userGifts = this.gifts.get(gift.fromUserId) || [];
                userGifts.push(nextGift);
                this.scheduleGift(nextGift);
            }
        }
    }

    // ===========================
    // ALLOWANCE SCHEDULER
    // ===========================

    private startAllowanceScheduler() {
        // Check every hour for allowance payments
        setInterval(() => {
            this.processAllowances();
        }, 60 * 60 * 1000);
    }

    private scheduleAllowance(vaultId: string, memberId: string) {
        const key = `${vaultId}_${memberId}`;

        // Clear existing timer
        const existing = this.allowanceTimers.get(key);
        if (existing) {
            clearTimeout(existing);
        }

        // Set new timer
        const vault = this.vaults.get(vaultId);
        if (!vault) return;

        const member = vault.members.find(m => m.id === memberId);
        if (!member?.allowance?.enabled) return;

        const nextPayment = member.allowance.nextPayment.getTime() - Date.now();
        if (nextPayment > 0) {
            const timer = setTimeout(() => {
                this.payAllowance(vaultId, memberId);
            }, nextPayment);
            this.allowanceTimers.set(key, timer);
        }
    }

    private async processAllowances() {
        const now = new Date();

        for (const vault of this.vaults.values()) {
            for (const member of vault.members) {
                if (member.allowance?.enabled && member.allowance.nextPayment <= now) {
                    await this.payAllowance(vault.id, member.id);
                }
            }
        }
    }

    private async payAllowance(vaultId: string, memberId: string) {
        const vault = this.vaults.get(vaultId);
        if (!vault) return;

        const member = vault.members.find(m => m.id === memberId);
        if (!member?.allowance) return;

        // Check if would exceed max balance
        // In production: Check actual balance

        // Create allowance transaction
        await this.initiateTransaction(vaultId, vault.creatorId, {
            type: 'allowance',
            asset: 'USDC',
            amount: member.allowance.amount,
            recipient: member.userId,
            note: `Scheduled allowance for ${member.name}`,
        });

        // Set next payment date
        const nextPayment = new Date(member.allowance.nextPayment);
        switch (member.allowance.frequency) {
            case 'daily':
                nextPayment.setDate(nextPayment.getDate() + 1);
                break;
            case 'weekly':
                nextPayment.setDate(nextPayment.getDate() + 7);
                break;
            case 'bi-weekly':
                nextPayment.setDate(nextPayment.getDate() + 14);
                break;
            case 'monthly':
                nextPayment.setMonth(nextPayment.getMonth() + 1);
                break;
        }
        member.allowance.nextPayment = nextPayment;

        this.emit('allowancePaid', { vaultId, member, amount: member.allowance.amount });

        // Reschedule
        this.scheduleAllowance(vaultId, memberId);
    }
}

export const socialVaultService = new SocialVaultService();
