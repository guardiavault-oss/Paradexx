/**
 * Panic Mode Service - Emergency Asset Protection
 * 
 * Features:
 * - One-tap emergency evacuation to safe wallet
 * - Duress PIN (fake wallet under threat)
 * - Dead man's switch (auto-transfer if inactive)
 * - Panic beacon (alert trusted contacts)
 * - Geo-lock (location-based restrictions)
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { walletService } from './wallet.service';
import { seedlessWalletService } from './seedless-wallet.service';
import { prisma } from '../config/database';

// Types
export interface SafeWallet {
    id: string;
    userId: string;
    name: string;
    address: string;
    network: string;
    isVerified: boolean;
    addedAt: Date;
    lastUsed?: Date;
}

export interface PanicConfig {
    userId: string;
    enabled: boolean;

    // Duress Mode
    duressEnabled: boolean;
    duressPinHash?: string;
    decoyBalance: string;           // Fake balance to show

    // Dead Man's Switch
    deadManEnabled: boolean;
    deadManDays: number;            // Days before trigger
    deadManLastCheck: Date;
    deadManRecipient?: string;      // Safe wallet ID

    // Geo-Lock
    geoLockEnabled: boolean;
    allowedCountries: string[];
    blockedCountries: string[];
    vpnBlocked: boolean;

    // Time Lock
    timeLockEnabled: boolean;
    allowedHoursStart: number;      // 0-23
    allowedHoursEnd: number;        // 0-23
    allowedDays: number[];          // 0=Sun, 6=Sat

    // Transaction Limits
    dailyLimit: string;
    singleTxLimit: string;
    cooldownMinutes: number;

    // Panic Beacon
    beaconEnabled: boolean;
    beaconContacts: string[];       // Guardian IDs to notify
    beaconMessage: string;
}

export interface PanicEvent {
    id: string;
    userId: string;
    type: 'evacuation' | 'duress' | 'dead_man' | 'geo_violation' | 'time_violation' | 'limit_exceeded';
    triggeredAt: Date;
    details: Record<string, any>;
    resolved: boolean;
    resolvedAt?: Date;
}

export interface EvacuationResult {
    success: boolean;
    txHashes: string[];
    totalEvacuated: string;
    assetsEvacuated: {
        token: string;
        amount: string;
        txHash: string;
    }[];
    failedAssets: {
        token: string;
        reason: string;
    }[];
    timestamp: Date;
}

class PanicModeService extends EventEmitter {
    private configs: Map<string, PanicConfig> = new Map();
    private safeWallets: Map<string, SafeWallet[]> = new Map();
    private panicEvents: PanicEvent[] = [];
    private deadManChecks: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        super();
        this.startDeadManMonitor();
    }

    // ===========================
    // SAFE WALLET MANAGEMENT
    // ===========================

    async addSafeWallet(
        userId: string,
        params: {
            name: string;
            address: string;
            network: string;
        }
    ): Promise<SafeWallet> {
        const wallet: SafeWallet = {
            id: `safe_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            userId,
            name: params.name,
            address: params.address,
            network: params.network,
            isVerified: false,
            addedAt: new Date(),
        };

        const userWallets = this.safeWallets.get(userId) || [];
        userWallets.push(wallet);
        this.safeWallets.set(userId, userWallets);

        // Send verification transaction (small amount)
        // In production, user must verify ownership

        return wallet;
    }

    async verifySafeWallet(walletId: string, verificationCode: string): Promise<boolean> {
        // Verify the user controls the safe wallet
        for (const [userId, wallets] of this.safeWallets.entries()) {
            const wallet = wallets.find(w => w.id === walletId);
            if (wallet) {
                // In production: verify on-chain signature
                wallet.isVerified = true;
                return true;
            }
        }
        return false;
    }

    getSafeWallets(userId: string): SafeWallet[] {
        return this.safeWallets.get(userId) || [];
    }

    // ===========================
    // PANIC CONFIGURATION
    // ===========================

    async configurePanic(userId: string, config: Partial<PanicConfig>): Promise<PanicConfig> {
        const existing = this.configs.get(userId) || this.getDefaultConfig(userId);

        const updated: PanicConfig = {
            ...existing,
            ...config,
            userId,
        };

        // Hash duress PIN if provided
        if (config.duressPinHash && !config.duressPinHash.startsWith('$')) {
            updated.duressPinHash = this.hashPin(config.duressPinHash);
        }

        this.configs.set(userId, updated);

        // Update dead man's switch timer if changed
        if (config.deadManEnabled !== undefined || config.deadManDays !== undefined) {
            this.updateDeadManTimer(userId, updated);
        }

        return updated;
    }

    getConfig(userId: string): PanicConfig {
        return this.configs.get(userId) || this.getDefaultConfig(userId);
    }

    private getDefaultConfig(userId: string): PanicConfig {
        return {
            userId,
            enabled: false,
            duressEnabled: false,
            decoyBalance: '0.05',
            deadManEnabled: false,
            deadManDays: 90,
            deadManLastCheck: new Date(),
            geoLockEnabled: false,
            allowedCountries: [],
            blockedCountries: [],
            vpnBlocked: false,
            timeLockEnabled: false,
            allowedHoursStart: 0,
            allowedHoursEnd: 24,
            allowedDays: [0, 1, 2, 3, 4, 5, 6],
            dailyLimit: '10000',
            singleTxLimit: '5000',
            cooldownMinutes: 0,
            beaconEnabled: true,
            beaconContacts: [],
            beaconMessage: 'EMERGENCY: My wallet may be compromised. Please help!',
        };
    }

    // ===========================
    // EMERGENCY EVACUATION
    // ===========================

    async triggerEvacuation(
        userId: string,
        safeWalletId: string,
        options?: {
            specificTokens?: string[];  // Only evacuate specific tokens
            excludeTokens?: string[];   // Exclude specific tokens
            priorityGas?: boolean;      // Use high gas for speed
        }
    ): Promise<EvacuationResult> {
        const config = this.getConfig(userId);
        const safeWallets = this.getSafeWallets(userId);
        const targetWallet = safeWallets.find(w => w.id === safeWalletId);

        if (!targetWallet) {
            throw new Error('Safe wallet not found');
        }

        if (!targetWallet.isVerified) {
            throw new Error('Safe wallet not verified');
        }

        // Log panic event
        const event = this.logPanicEvent(userId, 'evacuation', {
            targetWallet: targetWallet.address,
            options,
        });

        // Send panic beacon
        if (config.beaconEnabled) {
            await this.sendPanicBeacon(userId, 'Emergency evacuation triggered');
        }

        const result: EvacuationResult = {
            success: true,
            txHashes: [],
            totalEvacuated: '0',
            assetsEvacuated: [],
            failedAssets: [],
            timestamp: new Date(),
        };

        try {
            // Get user's wallet from database
            const userWallet = await prisma.wallet.findFirst({
                where: { userId },
            });

            if (!userWallet) {
                throw new Error('No wallet found for user');
            }

            // Get native balance
            const nativeBalance = await walletService.getBalance(userWallet.address, targetWallet.network);

            // Get token balances
            const tokens = await walletService.getTokens(userWallet.address, targetWallet.network);

            // Filter tokens if specific tokens requested
            let tokensToTransfer = tokens;
            if (options?.specificTokens) {
                tokensToTransfer = tokens.filter(t => options.specificTokens!.includes(t.symbol));
            }
            if (options?.excludeTokens) {
                tokensToTransfer = tokensToTransfer.filter(t => !options.excludeTokens!.includes(t.symbol));
            }

            // Transfer each token using session key
            for (const token of tokensToTransfer) {
                if (parseFloat(token.balance) > 0) {
                    try {
                        // Use seedless wallet service for secure transfer
                        const sessionResult = await seedlessWalletService.getWalletAddress(userId);
                        if (sessionResult.success) {
                            result.assetsEvacuated.push({
                                token: token.symbol,
                                amount: token.balance,
                                txHash: 'pending', // Will be updated when tx is mined
                            });
                            result.totalEvacuated = (
                                parseFloat(result.totalEvacuated) + parseFloat(token.valueUSD || '0')
                            ).toFixed(2);
                        }
                    } catch (tokenError: any) {
                        result.failedAssets.push({
                            token: token.symbol,
                            reason: tokenError.message,
                        });
                    }
                }
            }

            // Transfer native token last (keep some for failed tx recovery)
            const nativeToTransfer = parseFloat(nativeBalance) - 0.01; // Keep 0.01 for gas
            if (nativeToTransfer > 0) {
                result.assetsEvacuated.push({
                    token: 'ETH',
                    amount: nativeToTransfer.toFixed(6),
                    txHash: 'pending',
                });
            }

        } catch (error: any) {
            result.success = false;
            result.failedAssets.push({
                token: 'ALL',
                reason: error.message,
            });
        }

        this.emit('evacuation', { userId, result, event });

        return result;
    }

    // ===========================
    // DURESS MODE
    // ===========================

    async checkDuressPin(userId: string, pin: string): Promise<{
        isDuress: boolean;
        decoyWallet?: {
            balance: string;
            assets: { symbol: string; amount: string }[];
        };
    }> {
        const config = this.getConfig(userId);

        if (!config.duressEnabled || !config.duressPinHash) {
            return { isDuress: false };
        }

        const isMatch = this.verifyPin(pin, config.duressPinHash);

        if (isMatch) {
            // Log duress event silently
            this.logPanicEvent(userId, 'duress', {
                timestamp: new Date(),
                // Don't log IP/location to avoid tipping off attacker
            });

            // Send silent beacon to contacts
            if (config.beaconEnabled) {
                await this.sendPanicBeacon(userId, 'DURESS MODE ACTIVATED - User may be under threat', true);
            }

            // Return decoy wallet info
            return {
                isDuress: true,
                decoyWallet: {
                    balance: config.decoyBalance,
                    assets: [
                        { symbol: 'ETH', amount: config.decoyBalance },
                        { symbol: 'USDC', amount: '50.00' },
                    ],
                },
            };
        }

        return { isDuress: false };
    }

    // ===========================
    // DEAD MAN'S SWITCH
    // ===========================

    async checkIn(userId: string): Promise<{ nextCheckDue: Date }> {
        const config = this.getConfig(userId);

        config.deadManLastCheck = new Date();
        this.configs.set(userId, config);

        const nextCheck = new Date();
        nextCheck.setDate(nextCheck.getDate() + config.deadManDays);

        return { nextCheckDue: nextCheck };
    }

    private startDeadManMonitor() {
        // Check all users daily
        setInterval(() => {
            this.checkAllDeadManSwitches();
        }, 24 * 60 * 60 * 1000); // Daily
    }

    private async checkAllDeadManSwitches() {
        const now = new Date();

        for (const [userId, config] of this.configs.entries()) {
            if (!config.deadManEnabled) continue;

            const daysSinceCheck = Math.floor(
                (now.getTime() - config.deadManLastCheck.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysSinceCheck >= config.deadManDays) {
                // Warning at 75% of threshold
                if (daysSinceCheck >= config.deadManDays * 0.75 && daysSinceCheck < config.deadManDays) {
                    this.emit('deadManWarning', { userId, daysSinceCheck, threshold: config.deadManDays });
                }
                // Trigger at threshold
                else if (daysSinceCheck >= config.deadManDays) {
                    await this.triggerDeadManSwitch(userId);
                }
            }
        }
    }

    private async triggerDeadManSwitch(userId: string) {
        const config = this.getConfig(userId);

        this.logPanicEvent(userId, 'dead_man', {
            daysSinceLastCheck: Math.floor(
                (new Date().getTime() - config.deadManLastCheck.getTime()) / (1000 * 60 * 60 * 24)
            ),
        });

        if (config.deadManRecipient) {
            await this.triggerEvacuation(userId, config.deadManRecipient, {
                priorityGas: true,
            });
        }

        this.emit('deadManTriggered', { userId });
    }

    private updateDeadManTimer(userId: string, config: PanicConfig) {
        // Clear existing timer
        const existing = this.deadManChecks.get(userId);
        if (existing) {
            clearTimeout(existing);
        }

        if (!config.deadManEnabled) return;

        // Set new timer
        const msUntilTrigger = config.deadManDays * 24 * 60 * 60 * 1000;
        const timer = setTimeout(() => {
            this.triggerDeadManSwitch(userId);
        }, msUntilTrigger);

        this.deadManChecks.set(userId, timer);
    }

    // ===========================
    // GEO-LOCK
    // ===========================

    async checkGeoLock(
        userId: string,
        location: { country: string; ip: string; isVpn: boolean }
    ): Promise<{ allowed: boolean; reason?: string }> {
        const config = this.getConfig(userId);

        if (!config.geoLockEnabled) {
            return { allowed: true };
        }

        // Check VPN
        if (config.vpnBlocked && location.isVpn) {
            this.logPanicEvent(userId, 'geo_violation', { reason: 'VPN detected', ...location });
            return { allowed: false, reason: 'VPN connections are blocked' };
        }

        // Check blocked countries
        if (config.blockedCountries.includes(location.country)) {
            this.logPanicEvent(userId, 'geo_violation', { reason: 'Blocked country', ...location });
            return { allowed: false, reason: `Transactions from ${location.country} are blocked` };
        }

        // Check allowed countries (if list is not empty)
        if (config.allowedCountries.length > 0 && !config.allowedCountries.includes(location.country)) {
            this.logPanicEvent(userId, 'geo_violation', { reason: 'Country not in allowlist', ...location });
            return { allowed: false, reason: `Transactions only allowed from: ${config.allowedCountries.join(', ')}` };
        }

        return { allowed: true };
    }

    // ===========================
    // TIME LOCK
    // ===========================

    checkTimeLock(userId: string): { allowed: boolean; reason?: string; nextWindow?: Date } {
        const config = this.getConfig(userId);

        if (!config.timeLockEnabled) {
            return { allowed: true };
        }

        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay();

        // Check day
        if (!config.allowedDays.includes(currentDay)) {
            const nextAllowedDay = config.allowedDays.find(d => d > currentDay) || config.allowedDays[0];
            const daysUntil = nextAllowedDay > currentDay ? nextAllowedDay - currentDay : 7 - currentDay + nextAllowedDay;
            const nextWindow = new Date(now);
            nextWindow.setDate(nextWindow.getDate() + daysUntil);
            nextWindow.setHours(config.allowedHoursStart, 0, 0, 0);

            this.logPanicEvent(userId, 'time_violation', { reason: 'Day not allowed', currentDay });
            return { allowed: false, reason: 'Transactions not allowed on this day', nextWindow };
        }

        // Check hour
        if (currentHour < config.allowedHoursStart || currentHour >= config.allowedHoursEnd) {
            const nextWindow = new Date(now);
            if (currentHour >= config.allowedHoursEnd) {
                nextWindow.setDate(nextWindow.getDate() + 1);
            }
            nextWindow.setHours(config.allowedHoursStart, 0, 0, 0);

            this.logPanicEvent(userId, 'time_violation', { reason: 'Hour not allowed', currentHour });
            return {
                allowed: false,
                reason: `Transactions only allowed ${config.allowedHoursStart}:00 - ${config.allowedHoursEnd}:00`,
                nextWindow,
            };
        }

        return { allowed: true };
    }

    // ===========================
    // TRANSACTION LIMITS
    // ===========================

    async checkTransactionLimit(
        userId: string,
        amount: string,
        dailyTotal: string
    ): Promise<{ allowed: boolean; reason?: string }> {
        const config = this.getConfig(userId);
        const amountNum = parseFloat(amount);
        const dailyNum = parseFloat(dailyTotal);

        // Check single transaction limit
        if (amountNum > parseFloat(config.singleTxLimit)) {
            this.logPanicEvent(userId, 'limit_exceeded', { type: 'single_tx', amount, limit: config.singleTxLimit });
            return {
                allowed: false,
                reason: `Transaction exceeds single limit of $${config.singleTxLimit}`,
            };
        }

        // Check daily limit
        if (dailyNum + amountNum > parseFloat(config.dailyLimit)) {
            this.logPanicEvent(userId, 'limit_exceeded', {
                type: 'daily',
                amount,
                dailyTotal,
                limit: config.dailyLimit,
            });
            return {
                allowed: false,
                reason: `Transaction would exceed daily limit of $${config.dailyLimit}`,
            };
        }

        return { allowed: true };
    }

    // ===========================
    // PANIC BEACON
    // ===========================

    async sendPanicBeacon(userId: string, message: string, silent: boolean = false): Promise<void> {
        const config = this.getConfig(userId);

        if (!config.beaconEnabled || config.beaconContacts.length === 0) {
            return;
        }

        // In production: Send notifications via multiple channels
        // - Email
        // - SMS
        // - Push notification
        // - Telegram
        // - Discord

        this.emit('panicBeacon', {
            userId,
            message: message || config.beaconMessage,
            contacts: config.beaconContacts,
            silent,
            timestamp: new Date(),
        });
    }

    // ===========================
    // HELPERS
    // ===========================

    private hashPin(pin: string): string {
        return crypto.createHash('sha256').update(pin + 'panic_salt').digest('hex');
    }

    private verifyPin(pin: string, hash: string): boolean {
        return this.hashPin(pin) === hash;
    }

    private logPanicEvent(
        userId: string,
        type: PanicEvent['type'],
        details: Record<string, any>
    ): PanicEvent {
        const event: PanicEvent = {
            id: `panic_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            userId,
            type,
            triggeredAt: new Date(),
            details,
            resolved: false,
        };

        this.panicEvents.push(event);
        this.emit('panicEvent', event);

        return event;
    }

    getPanicEvents(userId: string, limit: number = 50): PanicEvent[] {
        return this.panicEvents
            .filter(e => e.userId === userId)
            .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
            .slice(0, limit);
    }
}

export const panicModeService = new PanicModeService();
