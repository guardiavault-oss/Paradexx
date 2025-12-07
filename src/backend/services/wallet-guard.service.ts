/**
 * Wallet Guard Service - Advanced Crypto Wallet Protection
 * Real-time threat detection, transaction simulation, and blockchain monitoring
 */

import crypto from 'crypto';
import { logger } from '../services/logger.service';
import { EventEmitter } from 'events';

// ============ Types & Interfaces ============

export enum ThreatLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export enum WalletType {
    EOA = 'eoa',
    CONTRACT = 'contract',
    MULTISIG = 'multisig',
    UNKNOWN = 'unknown',
}

export enum SecurityLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
    PARANOID = 'paranoid',
}

export enum ProtectionActionType {
    REVOKE_APPROVAL = 'revoke_approval',
    TRANSFER_ASSETS = 'transfer_assets',
    PAUSE_CONTRACT = 'pause_contract',
    BLACKLIST_ADDRESS = 'blacklist_address',
    EMERGENCY_WITHDRAWAL = 'emergency_withdrawal',
    ALERT_ONLY = 'alert_only',
}

export interface WalletInfo {
    address: string;
    walletType: WalletType;
    balance: string;
    network: string;
    firstSeen: Date;
    lastActivity: Date;
    transactionCount: number;
    riskScore: number;
    threatLevel: ThreatLevel;
    tags: string[];
    isMonitored: boolean;
}

export interface ThreatDetection {
    id: string;
    walletAddress: string;
    threatType: string;
    threatLevel: ThreatLevel;
    description: string;
    confidence: number;
    timestamp: Date;
    metadata: Record<string, any>;
    resolved: boolean;
}

export interface ProtectionAction {
    id: string;
    actionType: ProtectionActionType;
    walletAddress: string;
    description: string;
    timestamp: Date;
    success: boolean;
    transactionHash?: string;
    metadata: Record<string, any>;
}

export interface TransactionSimulation {
    id: string;
    walletAddress: string;
    transaction: {
        to: string;
        value: string;
        data: string;
        gasLimit: string;
    };
    result: {
        success: boolean;
        gasUsed: string;
        returnData: string;
        logs: any[];
        stateChanges: any[];
    };
    riskAssessment: {
        riskScore: number;
        riskLevel: ThreatLevel;
        warnings: string[];
        recommendations: string[];
    };
    timestamp: Date;
}

export interface SecurityConfig {
    securityLevel: SecurityLevel;
    requiredSigners: number;
    mpcEnabled: boolean;
    hsmEnabled: boolean;
    timeLockEnabled: boolean;
    circuitBreakerEnabled: boolean;
    zeroDayProtectionEnabled: boolean;
    whitelistEnabled: boolean;
    whitelistedAddresses: string[];
    whitelistedContracts: string[];
    alertChannels: string[];
}

export interface MonitoringConfig {
    walletAddress: string;
    network: string;
    alertChannels: string[];
    protectionLevel: SecurityLevel;
    autoProtect: boolean;
    thresholds: {
        maxTransactionValue: string;
        maxGasPrice: string;
        suspiciousActivityScore: number;
    };
}

export interface WalletAnalytics {
    walletAddress: string;
    network: string;
    timeframe: string;
    metrics: {
        totalTransactions: number;
        totalVolume: string;
        uniqueInteractions: number;
        gasSpent: string;
        threatsDetected: number;
        threatsBlocked: number;
        riskTrend: 'increasing' | 'stable' | 'decreasing';
    };
    topInteractions: {
        address: string;
        count: number;
        type: string;
    }[];
    riskHistory: {
        date: string;
        score: number;
    }[];
}

// ============ Threat Detection Patterns ============

const THREAT_PATTERNS = {
    PHISHING_CONTRACT: {
        signatures: [
            '0x095ea7b3', // approve with unlimited amount
            '0xa22cb465', // setApprovalForAll
        ],
        riskMultiplier: 2.0,
    },
    HONEYPOT: {
        indicators: ['cannotSell', 'highTax', 'blacklistFunction'],
        riskMultiplier: 3.0,
    },
    RUG_PULL: {
        indicators: ['removeLiquidity', 'ownerMint', 'pauseTrading'],
        riskMultiplier: 2.5,
    },
    FLASH_LOAN_ATTACK: {
        signatures: ['flashLoan', 'flashBorrow'],
        riskMultiplier: 2.0,
    },
    SANDWICH_ATTACK: {
        indicators: ['frontrun', 'backrun', 'mevBot'],
        riskMultiplier: 1.5,
    },
    DRAINER: {
        signatures: [
            '0x23b872dd', // transferFrom
            '0x42842e0e', // safeTransferFrom
        ],
        riskMultiplier: 3.0,
    },
};

// Known malicious addresses (sample - would be much larger in production)
const KNOWN_MALICIOUS_ADDRESSES = new Set([
    '0x0000000000000000000000000000000000000000', // Null address abuse
]);

// ============ Wallet Guard Service ============

class WalletGuardService extends EventEmitter {
    private monitoredWallets: Map<string, WalletInfo> = new Map();
    private threatDetections: ThreatDetection[] = [];
    private protectionActions: ProtectionAction[] = [];
    private securityConfigs: Map<string, SecurityConfig> = new Map();
    private monitoringConfigs: Map<string, MonitoringConfig> = new Map();
    private simulationCache: Map<string, TransactionSimulation> = new Map();

    private isInitialized = false;
    private monitoringInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
        logger.info('[WalletGuard] Service instantiated');
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        logger.info('[WalletGuard] Initializing service...');

        // Start background monitoring
        this.startBackgroundMonitoring();

        this.isInitialized = true;
        logger.info('[WalletGuard] Service initialized successfully');
    }

    // ============ Wallet Monitoring ============

    async startMonitoring(config: MonitoringConfig): Promise<WalletInfo> {
        const { walletAddress, network } = config;
        const key = `${walletAddress.toLowerCase()}-${network}`;

        // Check if already monitoring
        if (this.monitoredWallets.has(key)) {
            const existing = this.monitoredWallets.get(key)!;
            existing.isMonitored = true;
            return existing;
        }

        // Create wallet info
        const walletInfo: WalletInfo = {
            address: walletAddress,
            walletType: await this.detectWalletType(walletAddress, network),
            balance: '0',
            network,
            firstSeen: new Date(),
            lastActivity: new Date(),
            transactionCount: 0,
            riskScore: 0,
            threatLevel: ThreatLevel.LOW,
            tags: [],
            isMonitored: true,
        };

        // Perform initial risk assessment
        walletInfo.riskScore = await this.calculateRiskScore(walletAddress, network);
        walletInfo.threatLevel = this.riskScoreToThreatLevel(walletInfo.riskScore);

        // Store configs
        this.monitoredWallets.set(key, walletInfo);
        this.monitoringConfigs.set(key, config);

        // Set default security config
        this.securityConfigs.set(key, this.getDefaultSecurityConfig(config.protectionLevel));

        logger.info(`[WalletGuard] Started monitoring ${walletAddress} on ${network}`);
        this.emit('monitoring:started', walletInfo);

        return walletInfo;
    }

    async stopMonitoring(walletAddress: string, network: string): Promise<boolean> {
        const key = `${walletAddress.toLowerCase()}-${network}`;

        const wallet = this.monitoredWallets.get(key);
        if (wallet) {
            wallet.isMonitored = false;
            this.monitoringConfigs.delete(key);
            logger.info(`[WalletGuard] Stopped monitoring ${walletAddress} on ${network}`);
            this.emit('monitoring:stopped', { walletAddress, network });
            return true;
        }

        return false;
    }

    async getWalletStatus(walletAddress: string, network?: string): Promise<WalletInfo | null> {
        const normalizedAddress = walletAddress.toLowerCase();

        // If network specified, look for exact match
        if (network) {
            const key = `${normalizedAddress}-${network}`;
            return this.monitoredWallets.get(key) || null;
        }

        // Otherwise, find any matching wallet
        for (const [key, wallet] of this.monitoredWallets) {
            if (key.startsWith(normalizedAddress)) {
                return wallet;
            }
        }

        return null;
    }

    getMonitoredWallets(): WalletInfo[] {
        return Array.from(this.monitoredWallets.values()).filter(w => w.isMonitored);
    }

    // ============ Threat Detection ============

    async detectThreats(walletAddress: string, network: string): Promise<ThreatDetection[]> {
        const threats: ThreatDetection[] = [];
        const normalizedAddress = walletAddress.toLowerCase();

        // Check against known malicious addresses
        if (KNOWN_MALICIOUS_ADDRESSES.has(normalizedAddress)) {
            threats.push(this.createThreat(
                walletAddress,
                'KNOWN_MALICIOUS',
                ThreatLevel.CRITICAL,
                'Address is in known malicious addresses database',
                1.0
            ));
        }

        // Simulate recent transaction patterns (mock for now)
        const suspiciousPatterns = await this.analyzeTransactionPatterns(walletAddress, network);
        threats.push(...suspiciousPatterns);

        // Store threats
        this.threatDetections.push(...threats);

        // Emit events for critical threats
        for (const threat of threats) {
            if (threat.threatLevel === ThreatLevel.CRITICAL || threat.threatLevel === ThreatLevel.HIGH) {
                this.emit('threat:detected', threat);
            }
        }

        return threats;
    }

    async getRecentThreats(options: {
        hours?: number;
        walletAddress?: string;
        network?: string;
        minLevel?: ThreatLevel;
    } = {}): Promise<ThreatDetection[]> {
        const { hours = 24, walletAddress, network, minLevel } = options;
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

        let threats = this.threatDetections.filter(t => t.timestamp >= cutoff);

        if (walletAddress) {
            threats = threats.filter(t => t.walletAddress.toLowerCase() === walletAddress.toLowerCase());
        }

        if (network) {
            threats = threats.filter(t => t.metadata.network === network);
        }

        if (minLevel) {
            const levelOrder = [ThreatLevel.LOW, ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL];
            const minIndex = levelOrder.indexOf(minLevel);
            threats = threats.filter(t => levelOrder.indexOf(t.threatLevel) >= minIndex);
        }

        return threats.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    // ============ Transaction Simulation ============

    async simulateTransaction(
        walletAddress: string,
        transaction: {
            to: string;
            value: string;
            data: string;
            gasLimit?: string;
        },
        network: string
    ): Promise<TransactionSimulation> {
        const simulationId = crypto.randomUUID();

        // Analyze transaction data
        const riskAssessment = await this.assessTransactionRisk(transaction, network);

        const simulation: TransactionSimulation = {
            id: simulationId,
            walletAddress,
            transaction: {
                to: transaction.to,
                value: transaction.value,
                data: transaction.data,
                gasLimit: transaction.gasLimit || '21000',
            },
            result: {
                success: riskAssessment.riskScore < 70,
                gasUsed: '21000',
                returnData: '0x',
                logs: [],
                stateChanges: [],
            },
            riskAssessment,
            timestamp: new Date(),
        };

        // Cache simulation
        this.simulationCache.set(simulationId, simulation);

        // Emit warning for risky transactions
        if (riskAssessment.riskLevel === ThreatLevel.HIGH || riskAssessment.riskLevel === ThreatLevel.CRITICAL) {
            this.emit('simulation:risky', simulation);
        }

        return simulation;
    }

    // ============ Protection Actions ============

    async applyProtection(
        walletAddress: string,
        actionType: ProtectionActionType,
        network: string,
        metadata: Record<string, any> = {}
    ): Promise<ProtectionAction> {
        const action: ProtectionAction = {
            id: crypto.randomUUID(),
            actionType,
            walletAddress,
            description: this.getActionDescription(actionType),
            timestamp: new Date(),
            success: false,
            metadata: { ...metadata, network },
        };

        try {
            // Execute protection action based on type
            switch (actionType) {
                case ProtectionActionType.REVOKE_APPROVAL:
                    action.success = await this.executeRevokeApproval(walletAddress, network, metadata);
                    break;
                case ProtectionActionType.TRANSFER_ASSETS:
                    action.success = await this.executeTransferAssets(walletAddress, network, metadata);
                    break;
                case ProtectionActionType.BLACKLIST_ADDRESS:
                    action.success = await this.executeBlacklistAddress(walletAddress, network, metadata);
                    break;
                case ProtectionActionType.EMERGENCY_WITHDRAWAL:
                    action.success = await this.executeEmergencyWithdrawal(walletAddress, network, metadata);
                    break;
                case ProtectionActionType.ALERT_ONLY:
                    action.success = true;
                    break;
                default:
                    action.success = false;
                    action.metadata.error = 'Unknown action type';
            }

            this.protectionActions.push(action);
            this.emit('protection:applied', action);

            logger.info(`[WalletGuard] Protection action ${actionType} ${action.success ? 'succeeded' : 'failed'} for ${walletAddress}`);

        } catch (error: any) {
            action.success = false;
            action.metadata.error = error.message;
            this.protectionActions.push(action);
        }

        return action;
    }

    getProtectionHistory(walletAddress?: string): ProtectionAction[] {
        let actions = [...this.protectionActions];

        if (walletAddress) {
            actions = actions.filter(a => a.walletAddress.toLowerCase() === walletAddress.toLowerCase());
        }

        return actions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    // ============ Analytics ============

    async getAnalytics(
        walletAddress: string,
        network: string,
        timeframe: string = '7d'
    ): Promise<WalletAnalytics> {
        const wallet = await this.getWalletStatus(walletAddress, network);
        const threats = await this.getRecentThreats({ walletAddress, hours: this.timeframeToHours(timeframe) });

        return {
            walletAddress,
            network,
            timeframe,
            metrics: {
                totalTransactions: wallet?.transactionCount || 0,
                totalVolume: wallet?.balance || '0',
                uniqueInteractions: Math.floor(Math.random() * 50) + 10, // Mock
                gasSpent: '0.05',
                threatsDetected: threats.length,
                threatsBlocked: threats.filter(t => t.resolved).length,
                riskTrend: this.calculateRiskTrend(walletAddress),
            },
            topInteractions: this.getMockTopInteractions(),
            riskHistory: this.generateRiskHistory(timeframe),
        };
    }

    // ============ Security Configuration ============

    async updateSecurityConfig(
        walletAddress: string,
        network: string,
        config: Partial<SecurityConfig>
    ): Promise<SecurityConfig> {
        const key = `${walletAddress.toLowerCase()}-${network}`;
        const existing = this.securityConfigs.get(key) || this.getDefaultSecurityConfig(SecurityLevel.MEDIUM);

        const updated: SecurityConfig = {
            ...existing,
            ...config,
        };

        this.securityConfigs.set(key, updated);
        this.emit('config:updated', { walletAddress, network, config: updated });

        return updated;
    }

    getSecurityConfig(walletAddress: string, network: string): SecurityConfig | null {
        const key = `${walletAddress.toLowerCase()}-${network}`;
        return this.securityConfigs.get(key) || null;
    }

    // ============ Private Helper Methods ============

    private async detectWalletType(address: string, network: string): Promise<WalletType> {
        // In production, this would check on-chain if address is a contract
        // For now, return EOA as default
        return WalletType.EOA;
    }

    private async calculateRiskScore(address: string, network: string): Promise<number> {
        let score = 0;

        // Check if address is in known malicious list
        if (KNOWN_MALICIOUS_ADDRESSES.has(address.toLowerCase())) {
            score += 100;
        }

        // Add random factor for demo (in production, this would be real analysis)
        score += Math.random() * 20;

        return Math.min(100, Math.max(0, score));
    }

    private riskScoreToThreatLevel(score: number): ThreatLevel {
        if (score >= 80) return ThreatLevel.CRITICAL;
        if (score >= 60) return ThreatLevel.HIGH;
        if (score >= 40) return ThreatLevel.MEDIUM;
        return ThreatLevel.LOW;
    }

    private createThreat(
        walletAddress: string,
        threatType: string,
        threatLevel: ThreatLevel,
        description: string,
        confidence: number,
        metadata: Record<string, any> = {}
    ): ThreatDetection {
        return {
            id: crypto.randomUUID(),
            walletAddress,
            threatType,
            threatLevel,
            description,
            confidence,
            timestamp: new Date(),
            metadata,
            resolved: false,
        };
    }

    private async analyzeTransactionPatterns(
        walletAddress: string,
        network: string
    ): Promise<ThreatDetection[]> {
        const threats: ThreatDetection[] = [];

        // Mock pattern analysis - in production, this would analyze real transactions
        const patterns = [
            { type: 'UNUSUAL_ACTIVITY', probability: 0.1 },
            { type: 'HIGH_VALUE_TRANSFER', probability: 0.05 },
            { type: 'NEW_CONTRACT_INTERACTION', probability: 0.15 },
        ];

        for (const pattern of patterns) {
            if (Math.random() < pattern.probability) {
                threats.push(this.createThreat(
                    walletAddress,
                    pattern.type,
                    ThreatLevel.MEDIUM,
                    `Detected ${pattern.type.toLowerCase().replace(/_/g, ' ')}`,
                    0.7 + Math.random() * 0.3,
                    { network, pattern: pattern.type }
                ));
            }
        }

        return threats;
    }

    private async assessTransactionRisk(
        transaction: { to: string; value: string; data: string },
        network: string
    ): Promise<TransactionSimulation['riskAssessment']> {
        let riskScore = 0;
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Check for approval patterns
        if (transaction.data.startsWith('0x095ea7b3')) {
            riskScore += 30;
            warnings.push('Transaction includes token approval');
            recommendations.push('Verify the spender address before approving');
        }

        // Check for unlimited approval
        if (transaction.data.includes('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')) {
            riskScore += 40;
            warnings.push('Unlimited token approval detected');
            recommendations.push('Consider setting a specific approval amount instead');
        }

        // Check recipient
        if (KNOWN_MALICIOUS_ADDRESSES.has(transaction.to.toLowerCase())) {
            riskScore += 100;
            warnings.push('Recipient is a known malicious address');
            recommendations.push('DO NOT proceed with this transaction');
        }

        // High value check
        const valueInEth = parseFloat(transaction.value) / 1e18;
        if (valueInEth > 1) {
            riskScore += 10;
            warnings.push('High value transaction');
            recommendations.push('Double-check the recipient address');
        }

        return {
            riskScore: Math.min(100, riskScore),
            riskLevel: this.riskScoreToThreatLevel(riskScore),
            warnings,
            recommendations,
        };
    }

    private getDefaultSecurityConfig(level: SecurityLevel): SecurityConfig {
        const configs: Record<SecurityLevel, SecurityConfig> = {
            [SecurityLevel.LOW]: {
                securityLevel: SecurityLevel.LOW,
                requiredSigners: 1,
                mpcEnabled: false,
                hsmEnabled: false,
                timeLockEnabled: false,
                circuitBreakerEnabled: false,
                zeroDayProtectionEnabled: false,
                whitelistEnabled: false,
                whitelistedAddresses: [],
                whitelistedContracts: [],
                alertChannels: ['email'],
            },
            [SecurityLevel.MEDIUM]: {
                securityLevel: SecurityLevel.MEDIUM,
                requiredSigners: 1,
                mpcEnabled: false,
                hsmEnabled: false,
                timeLockEnabled: true,
                circuitBreakerEnabled: true,
                zeroDayProtectionEnabled: false,
                whitelistEnabled: false,
                whitelistedAddresses: [],
                whitelistedContracts: [],
                alertChannels: ['email', 'push'],
            },
            [SecurityLevel.HIGH]: {
                securityLevel: SecurityLevel.HIGH,
                requiredSigners: 2,
                mpcEnabled: true,
                hsmEnabled: false,
                timeLockEnabled: true,
                circuitBreakerEnabled: true,
                zeroDayProtectionEnabled: true,
                whitelistEnabled: true,
                whitelistedAddresses: [],
                whitelistedContracts: [],
                alertChannels: ['email', 'push', 'sms'],
            },
            [SecurityLevel.CRITICAL]: {
                securityLevel: SecurityLevel.CRITICAL,
                requiredSigners: 3,
                mpcEnabled: true,
                hsmEnabled: true,
                timeLockEnabled: true,
                circuitBreakerEnabled: true,
                zeroDayProtectionEnabled: true,
                whitelistEnabled: true,
                whitelistedAddresses: [],
                whitelistedContracts: [],
                alertChannels: ['email', 'push', 'sms', 'webhook'],
            },
            [SecurityLevel.PARANOID]: {
                securityLevel: SecurityLevel.PARANOID,
                requiredSigners: 5,
                mpcEnabled: true,
                hsmEnabled: true,
                timeLockEnabled: true,
                circuitBreakerEnabled: true,
                zeroDayProtectionEnabled: true,
                whitelistEnabled: true,
                whitelistedAddresses: [],
                whitelistedContracts: [],
                alertChannels: ['email', 'push', 'sms', 'webhook', 'telegram'],
            },
        };

        return configs[level];
    }

    private getActionDescription(actionType: ProtectionActionType): string {
        const descriptions: Record<ProtectionActionType, string> = {
            [ProtectionActionType.REVOKE_APPROVAL]: 'Revoke token approval to prevent unauthorized transfers',
            [ProtectionActionType.TRANSFER_ASSETS]: 'Transfer assets to a safe wallet',
            [ProtectionActionType.PAUSE_CONTRACT]: 'Pause contract interactions',
            [ProtectionActionType.BLACKLIST_ADDRESS]: 'Add address to blacklist',
            [ProtectionActionType.EMERGENCY_WITHDRAWAL]: 'Emergency withdrawal of all assets',
            [ProtectionActionType.ALERT_ONLY]: 'Send alert notification only',
        };
        return descriptions[actionType];
    }

    // Protection action executors (mock implementations)
    private async executeRevokeApproval(walletAddress: string, network: string, metadata: any): Promise<boolean> {
        logger.info(`[WalletGuard] Executing revoke approval for ${walletAddress}`);
        return true;
    }

    private async executeTransferAssets(walletAddress: string, network: string, metadata: any): Promise<boolean> {
        logger.info(`[WalletGuard] Executing transfer assets for ${walletAddress}`);
        return true;
    }

    private async executeBlacklistAddress(walletAddress: string, network: string, metadata: any): Promise<boolean> {
        logger.info(`[WalletGuard] Executing blacklist for ${walletAddress}`);
        return true;
    }

    private async executeEmergencyWithdrawal(walletAddress: string, network: string, metadata: any): Promise<boolean> {
        logger.info(`[WalletGuard] Executing emergency withdrawal for ${walletAddress}`);
        return true;
    }

    private timeframeToHours(timeframe: string): number {
        const match = timeframe.match(/^(\d+)([hdwm])$/);
        if (!match) return 24;

        const [, value, unit] = match;
        const num = parseInt(value);

        switch (unit) {
            case 'h': return num;
            case 'd': return num * 24;
            case 'w': return num * 24 * 7;
            case 'm': return num * 24 * 30;
            default: return 24;
        }
    }

    private calculateRiskTrend(walletAddress: string): 'increasing' | 'stable' | 'decreasing' {
        const recentThreats = this.threatDetections.filter(
            t => t.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        );

        if (recentThreats.length === 0) return 'stable';
        if (recentThreats.length > 5) return 'increasing';
        return 'stable';
    }

    private getMockTopInteractions(): WalletAnalytics['topInteractions'] {
        return [
            { address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', count: 15, type: 'DEX' },
            { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', count: 12, type: 'Token' },
            { address: '0x6B175474E89094C44Da98b954EescdeCB5f8f4', count: 8, type: 'Token' },
        ];
    }

    private generateRiskHistory(timeframe: string): WalletAnalytics['riskHistory'] {
        const hours = this.timeframeToHours(timeframe);
        const points = Math.min(hours / 24, 30);
        const history: WalletAnalytics['riskHistory'] = [];

        for (let i = points; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            history.push({
                date: date.toISOString().split('T')[0],
                score: Math.floor(Math.random() * 30) + 10,
            });
        }

        return history;
    }

    private startBackgroundMonitoring(): void {
        if (this.monitoringInterval) return;

        this.monitoringInterval = setInterval(async () => {
            for (const [key, wallet] of this.monitoredWallets) {
                if (!wallet.isMonitored) continue;

                try {
                    // Update risk score
                    wallet.riskScore = await this.calculateRiskScore(wallet.address, wallet.network);
                    wallet.threatLevel = this.riskScoreToThreatLevel(wallet.riskScore);
                    wallet.lastActivity = new Date();

                    // Detect new threats
                    await this.detectThreats(wallet.address, wallet.network);

                } catch (error) {
                    logger.error(`[WalletGuard] Error monitoring ${wallet.address}:`, error);
                }
            }
        }, 60000); // Check every minute

        logger.info('[WalletGuard] Background monitoring started');
    }

    async shutdown(): Promise<void> {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        logger.info('[WalletGuard] Service shut down');
    }
}

// Export singleton instance
export const walletGuardService = new WalletGuardService();

// Initialize on import
walletGuardService.initialize().catch(console.error);
