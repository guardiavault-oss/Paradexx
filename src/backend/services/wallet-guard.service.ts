/**
 * Wallet Guard Service - Advanced Crypto Wallet Protection
 * Real-time threat detection, transaction simulation, and blockchain monitoring
 */

import crypto from 'crypto';
import { logger } from '../services/logger.service';
import { EventEmitter } from 'events';
import axios from 'axios';

// API Configuration
const ETHERSCAN_API = 'https://api.etherscan.io/api';
const GOPLUSLABS_API = 'https://api.gopluslabs.io/api/v1';

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

        // Fetch real analytics from Etherscan
        let txCount = 0;
        let uniqueInteractions = 0;
        let topInteractions: WalletAnalytics['topInteractions'] = [];

        try {
            const response = await axios.get(ETHERSCAN_API, {
                params: {
                    module: 'account',
                    action: 'txlist',
                    address: walletAddress,
                    startblock: 0,
                    endblock: 99999999,
                    page: 1,
                    offset: 100,
                    sort: 'desc',
                    apikey: process.env['ETHERSCAN_API_KEY'] || '',
                },
                timeout: 5000,
            });

            if (response.data?.result && Array.isArray(response.data.result)) {
                const txs = response.data.result;
                txCount = txs.length;

                // Calculate unique interactions
                const addressCounts = new Map<string, number>();
                for (const tx of txs) {
                    const addr = (tx.to || '').toLowerCase();
                    if (addr) {
                        addressCounts.set(addr, (addressCounts.get(addr) || 0) + 1);
                    }
                }
                uniqueInteractions = addressCounts.size;

                // Get top interactions
                topInteractions = Array.from(addressCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([address, count]) => ({
                        address,
                        count,
                        type: this.classifyAddress(address),
                    }));
            }
        } catch (error) {
            logger.debug('[WalletGuard] Error fetching analytics:', error);
        }

        return {
            walletAddress,
            network,
            timeframe,
            metrics: {
                totalTransactions: txCount || wallet?.transactionCount || 0,
                totalVolume: wallet?.balance || '0',
                uniqueInteractions,
                gasSpent: '0', // Would calculate from tx receipts
                threatsDetected: threats.length,
                threatsBlocked: threats.filter(t => t.resolved).length,
                riskTrend: this.calculateRiskTrend(walletAddress),
            },
            topInteractions,
            riskHistory: this.generateRiskHistoryFromThreats(walletAddress, timeframe),
        };
    }

    private classifyAddress(address: string): string {
        const lowerAddr = address.toLowerCase();
        // Known DEX routers
        const dexAddresses = [
            '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2
            '0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3
            '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f', // SushiSwap
        ];
        if (dexAddresses.includes(lowerAddr)) return 'DEX';

        // Known tokens
        const tokens = [
            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
            '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
        ];
        if (tokens.includes(lowerAddr)) return 'Token';

        return 'Contract';
    }

    private generateRiskHistoryFromThreats(walletAddress: string, timeframe: string): WalletAnalytics['riskHistory'] {
        const hours = this.timeframeToHours(timeframe);
        const days = Math.min(Math.ceil(hours / 24), 30);
        const history: WalletAnalytics['riskHistory'] = [];

        // Get threats for this wallet in the timeframe
        const cutoff = Date.now() - hours * 60 * 60 * 1000;
        const threatsByDay = new Map<string, number>();

        for (const threat of this.threatDetections) {
            if (threat.walletAddress.toLowerCase() === walletAddress.toLowerCase() &&
                threat.timestamp.getTime() >= cutoff) {
                const day = threat.timestamp.toISOString().split('T')[0];
                threatsByDay.set(day, (threatsByDay.get(day) || 0) + 1);
            }
        }

        // Generate history based on actual threats
        for (let i = days; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const threatCount = threatsByDay.get(dateStr) || 0;
            // Base score of 10, +15 per threat
            const score = Math.min(100, 10 + threatCount * 15);
            history.push({ date: dateStr, score });
        }

        return history;
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
            return Math.min(100, score);
        }

        try {
            // Use GoPlus Labs API for address risk assessment
            const response = await axios.get(`${GOPLUSLABS_API}/address_security/${address}`, {
                params: { chain_id: network === 'ethereum' ? '1' : '1' },
                timeout: 5000,
            });

            if (response.data?.result) {
                const result = response.data.result;
                // Check risk indicators
                if (result.blacklist_doubt === '1') score += 50;
                if (result.honeypot_related_address === '1') score += 40;
                if (result.phishing_activities === '1') score += 60;
                if (result.stealing_attack === '1') score += 70;
                if (result.fake_kyc === '1') score += 30;
                if (result.blackmail_activities === '1') score += 50;
                if (result.sanctioned === '1') score += 80;
                if (result.malicious_mining_activities === '1') score += 40;
                if (result.mixer === '1') score += 20;
                if (result.cybercrime === '1') score += 60;
            }
        } catch (error) {
            logger.debug('[WalletGuard] Error fetching risk score from GoPlus:', error);
            // Fallback: check transaction history from Etherscan
            try {
                const etherscanRes = await axios.get(ETHERSCAN_API, {
                    params: {
                        module: 'account',
                        action: 'txlist',
                        address,
                        startblock: 0,
                        endblock: 99999999,
                        page: 1,
                        offset: 10,
                        sort: 'desc',
                        apikey: process.env['ETHERSCAN_API_KEY'] || '',
                    },
                    timeout: 5000,
                });

                if (etherscanRes.data?.result?.length > 0) {
                    // Check for suspicious patterns
                    const txs = etherscanRes.data.result;
                    const failedTxs = txs.filter((tx: any) => tx.isError === '1').length;
                    if (failedTxs > txs.length / 2) score += 20; // High failure rate
                }
            } catch {
                // Keep base score if API fails
            }
        }

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

        try {
            // Fetch recent transactions from Etherscan
            const response = await axios.get(ETHERSCAN_API, {
                params: {
                    module: 'account',
                    action: 'txlist',
                    address: walletAddress,
                    startblock: 0,
                    endblock: 99999999,
                    page: 1,
                    offset: 20,
                    sort: 'desc',
                    apikey: process.env['ETHERSCAN_API_KEY'] || '',
                },
                timeout: 5000,
            });

            if (response.data?.result && Array.isArray(response.data.result)) {
                const txs = response.data.result;
                
                // Analyze transaction patterns
                const uniqueContacts = new Set(txs.map((tx: any) => tx.to?.toLowerCase()).filter(Boolean));
                const failedTxs = txs.filter((tx: any) => tx.isError === '1');
                const recentTxs = txs.filter((tx: any) => {
                    const txTime = Number.parseInt(tx.timeStamp, 10) * 1000;
                    return Date.now() - txTime < 3600000; // Last hour
                });

                // Detect unusual activity: many transactions in short time
                if (recentTxs.length > 5) {
                    threats.push(this.createThreat(
                        walletAddress,
                        'UNUSUAL_ACTIVITY',
                        ThreatLevel.MEDIUM,
                        `High transaction frequency: ${recentTxs.length} transactions in the last hour`,
                        0.75,
                        { network, txCount: recentTxs.length }
                    ));
                }

                // Detect high failure rate
                if (failedTxs.length > txs.length * 0.3 && txs.length > 5) {
                    threats.push(this.createThreat(
                        walletAddress,
                        'HIGH_FAILURE_RATE',
                        ThreatLevel.MEDIUM,
                        `High transaction failure rate: ${((failedTxs.length / txs.length) * 100).toFixed(1)}%`,
                        0.8,
                        { network, failedCount: failedTxs.length, totalCount: txs.length }
                    ));
                }

                // Detect interactions with many new addresses
                if (uniqueContacts.size > txs.length * 0.8 && txs.length > 10) {
                    threats.push(this.createThreat(
                        walletAddress,
                        'MANY_NEW_INTERACTIONS',
                        ThreatLevel.LOW,
                        `Interacting with many unique addresses (${uniqueContacts.size} unique in ${txs.length} txs)`,
                        0.6,
                        { network, uniqueAddresses: uniqueContacts.size }
                    ));
                }

                // Check for large value transfers
                const highValueTxs = txs.filter((tx: any) => {
                    const value = Number.parseFloat(tx.value) / 1e18;
                    return value > 10; // More than 10 ETH
                });

                if (highValueTxs.length > 0) {
                    threats.push(this.createThreat(
                        walletAddress,
                        'HIGH_VALUE_TRANSFERS',
                        ThreatLevel.LOW,
                        `${highValueTxs.length} high-value transfers detected (>10 ETH)`,
                        0.7,
                        { network, count: highValueTxs.length }
                    ));
                }
            }
        } catch (error) {
            logger.debug('[WalletGuard] Error analyzing transaction patterns:', error);
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

    private startBackgroundMonitoring(): void {
        if (this.monitoringInterval) return;

        this.monitoringInterval = setInterval(async () => {
            for (const [, wallet] of this.monitoredWallets) {
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
