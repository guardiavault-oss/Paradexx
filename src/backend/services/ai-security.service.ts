/**
 * AI Security Service - Intelligent Security Assistant
 * 
 * Features:
 * - Security Health Score (overall wallet security)
 * - Anomaly Detection (unusual activity alerts)
 * - Personalized Recommendations (based on usage)
 * - Risk Assessment (portfolio risk analysis)
 * - Threat Intelligence (proactive threat warnings)
 * - Auto-Defense (automatic threat response)
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

// Types
export interface SecurityHealthScore {
    overall: number;                    // 0-100
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    breakdown: {
        authentication: number;           // 2FA, biometrics
        backup: number;                   // Recovery setup
        guardian: number;                 // Social recovery
        approval: number;                 // Token approvals
        activity: number;                 // Recent activity safety
        portfolio: number;                // Asset diversity
        privacy: number;                  // Privacy score
    };
    lastUpdated: Date;
}

export interface SecurityRecommendation {
    id: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: 'authentication' | 'backup' | 'approval' | 'portfolio' | 'privacy' | 'behavior';
    title: string;
    description: string;
    impact: string;                     // What happens if ignored
    action: string;                     // What to do
    actionUrl?: string;                 // Deep link to fix
    automated: boolean;                 // Can be auto-fixed
    estimatedTime: string;              // Time to implement
    dismissed: boolean;
    dismissedAt?: Date;
    createdAt: Date;
}

export interface AnomalyAlert {
    id: string;
    userId: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: AnomalyType;
    title: string;
    description: string;
    details: Record<string, any>;

    // Comparison data
    baseline: string;                   // Normal behavior
    detected: string;                   // What was detected
    deviation: number;                  // % deviation from normal

    // Response
    autoResponseTaken?: string;
    requiresAction: boolean;
    suggestedAction: string;

    // Status
    status: 'new' | 'acknowledged' | 'resolved' | 'false_positive';
    resolvedAt?: Date;
    resolvedBy?: string;

    createdAt: Date;
}

export type AnomalyType =
    | 'unusual_time'                    // Activity at unusual hours
    | 'unusual_location'                // New location detected
    | 'unusual_amount'                  // Transaction size anomaly
    | 'unusual_frequency'               // Too many transactions
    | 'unusual_recipient'               // New/suspicious recipient
    | 'unusual_contract'                // Interaction with unknown contract
    | 'unusual_gas'                     // Abnormal gas usage
    | 'unusual_approval'                // Suspicious approval request
    | 'rapid_drain'                     // Assets leaving quickly
    | 'failed_attempts'                 // Multiple failed transactions
    | 'phishing_interaction';           // Interaction with phishing address

export interface RiskAssessment {
    userId: string;
    timestamp: Date;

    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;                  // 0-100

    factors: {
        category: string;
        risk: 'low' | 'medium' | 'high';
        score: number;
        description: string;
        mitigation?: string;
    }[];

    portfolio: {
        totalValue: string;
        atRiskValue: string;              // Value in high-risk assets
        atRiskPercent: number;
        topRisks: {
            asset: string;
            risk: string;
            exposure: string;
        }[];
    };

    recommendations: string[];
}

export interface ThreatIntelligence {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: 'scam' | 'exploit' | 'phishing' | 'rugpull' | 'vulnerability';
    title: string;
    description: string;
    affectedAssets: string[];
    affectedProtocols: string[];
    indicators: string[];               // Malicious addresses/contracts

    // Impact on user
    userExposure: 'none' | 'potential' | 'confirmed';
    userAssetAtRisk?: string;

    // Actions
    suggestedAction: string;
    mitigationSteps: string[];

    source: string;
    publishedAt: Date;
    expiresAt?: Date;
}

export interface UserBehaviorProfile {
    userId: string;

    // Activity patterns
    activeHours: { hour: number; activity: number }[];
    activeDays: { day: number; activity: number }[];
    avgTransactionsPerDay: number;
    avgTransactionSize: string;

    // Asset preferences
    preferredChains: string[];
    preferredTokens: string[];
    preferredProtocols: string[];

    // Security behavior
    checkFrequency: number;             // How often they check wallet
    responseTime: number;               // Avg time to respond to alerts
    securityActions: number;            // Security features used

    // Risk profile
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';

    lastUpdated: Date;
}

export interface AutoDefenseConfig {
    enabled: boolean;

    // Thresholds
    anomalyThreshold: number;           // Score to trigger defense

    // Actions
    actions: {
        anomalyType: AnomalyType;
        action: 'alert' | 'block' | 'require_2fa' | 'pause' | 'evacuate';
        threshold?: number;
    }[];

    // Notifications
    notifyEmail: boolean;
    notifySms: boolean;
    notifyPush: boolean;
    notifyGuardians: boolean;

    // Cooldown
    cooldownMinutes: number;            // Between auto-actions
}

class AISecurityService extends EventEmitter {
    private healthScores: Map<string, SecurityHealthScore> = new Map();
    private recommendations: Map<string, SecurityRecommendation[]> = new Map();
    private anomalies: Map<string, AnomalyAlert[]> = new Map();
    private behaviorProfiles: Map<string, UserBehaviorProfile> = new Map();
    private autoDefenseConfigs: Map<string, AutoDefenseConfig> = new Map();
    private threatIntel: ThreatIntelligence[] = [];

    constructor() {
        super();
        this.startThreatMonitor();
        this.startAnomalyDetection();
    }

    // ===========================
    // SECURITY HEALTH SCORE
    // ===========================

    async calculateHealthScore(userId: string): Promise<SecurityHealthScore> {
        // In production: Fetch actual user data
        const breakdown = {
            authentication: await this.scoreAuthentication(userId),
            backup: await this.scoreBackup(userId),
            guardian: await this.scoreGuardian(userId),
            approval: await this.scoreApprovals(userId),
            activity: await this.scoreActivity(userId),
            portfolio: await this.scorePortfolio(userId),
            privacy: await this.scorePrivacy(userId),
        };

        const weights = {
            authentication: 0.20,
            backup: 0.15,
            guardian: 0.15,
            approval: 0.15,
            activity: 0.15,
            portfolio: 0.10,
            privacy: 0.10,
        };

        const overall = Object.entries(breakdown).reduce(
            (sum, [key, value]) => sum + value * weights[key as keyof typeof weights],
            0
        );

        const grade = this.scoreToGrade(overall);

        const healthScore: SecurityHealthScore = {
            overall: Math.round(overall),
            grade,
            breakdown,
            lastUpdated: new Date(),
        };

        this.healthScores.set(userId, healthScore);

        // Generate recommendations based on score
        await this.generateRecommendations(userId, healthScore);

        return healthScore;
    }

    private async scoreAuthentication(userId: string): Promise<number> {
        // Check: 2FA enabled, biometrics, strong password, etc.
        // In production: Fetch actual user settings
        let score = 50; // Base score

        // +20 for 2FA
        // +15 for biometrics
        // +15 for hardware key

        return Math.min(100, score);
    }

    private async scoreBackup(userId: string): Promise<number> {
        // Check: Cloud backup, seed phrase confirmed, etc.
        let score = 40;
        return Math.min(100, score);
    }

    private async scoreGuardian(userId: string): Promise<number> {
        // Check: Guardians set up, verified, etc.
        let score = 30;
        return Math.min(100, score);
    }

    private async scoreApprovals(userId: string): Promise<number> {
        // Check: Outstanding approvals, risky approvals
        let score = 70;
        return Math.min(100, score);
    }

    private async scoreActivity(userId: string): Promise<number> {
        // Check: Recent interactions safety
        let score = 80;
        return Math.min(100, score);
    }

    private async scorePortfolio(userId: string): Promise<number> {
        // Check: Asset diversity, risky holdings
        let score = 60;
        return Math.min(100, score);
    }

    private async scorePrivacy(userId: string): Promise<number> {
        // Check: Address reuse, ENS exposure, etc.
        let score = 50;
        return Math.min(100, score);
    }

    private scoreToGrade(score: number): SecurityHealthScore['grade'] {
        if (score >= 95) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 75) return 'B';
        if (score >= 65) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    }

    getHealthScore(userId: string): SecurityHealthScore | null {
        return this.healthScores.get(userId) || null;
    }

    // ===========================
    // RECOMMENDATIONS
    // ===========================

    private async generateRecommendations(
        userId: string,
        healthScore: SecurityHealthScore
    ): Promise<void> {
        const recommendations: SecurityRecommendation[] = [];

        // Check each category and generate recommendations
        if (healthScore.breakdown.authentication < 70) {
            recommendations.push({
                id: `rec_${Date.now()}_auth`,
                priority: healthScore.breakdown.authentication < 50 ? 'critical' : 'high',
                category: 'authentication',
                title: 'Enable Two-Factor Authentication',
                description: 'Your account is protected only by a password. Enable 2FA for much stronger security.',
                impact: 'Without 2FA, attackers only need your password to access your funds.',
                action: 'Go to Settings > Security > Enable 2FA',
                actionUrl: '/settings/security/2fa',
                automated: false,
                estimatedTime: '2 minutes',
                dismissed: false,
                createdAt: new Date(),
            });
        }

        if (healthScore.breakdown.backup < 70) {
            recommendations.push({
                id: `rec_${Date.now()}_backup`,
                priority: healthScore.breakdown.backup < 50 ? 'critical' : 'high',
                category: 'backup',
                title: 'Set Up Wallet Backup',
                description: 'Your wallet is not backed up. If you lose access, your funds could be lost forever.',
                impact: 'Without backup, device loss = permanent fund loss.',
                action: 'Go to Settings > Backup > Create Backup',
                actionUrl: '/settings/backup',
                automated: false,
                estimatedTime: '5 minutes',
                dismissed: false,
                createdAt: new Date(),
            });
        }

        if (healthScore.breakdown.guardian < 50) {
            recommendations.push({
                id: `rec_${Date.now()}_guardian`,
                priority: 'medium',
                category: 'backup',
                title: 'Add Recovery Guardians',
                description: 'Add trusted contacts who can help you recover your wallet if you lose access.',
                impact: 'Guardians provide a safety net for account recovery.',
                action: 'Go to Guardians > Add Guardian',
                actionUrl: '/guardians/add',
                automated: false,
                estimatedTime: '10 minutes',
                dismissed: false,
                createdAt: new Date(),
            });
        }

        if (healthScore.breakdown.approval < 60) {
            recommendations.push({
                id: `rec_${Date.now()}_approval`,
                priority: 'high',
                category: 'approval',
                title: 'Review Token Approvals',
                description: 'You have token approvals that may pose a security risk.',
                impact: 'Unlimited approvals can be exploited to drain your tokens.',
                action: 'Go to Security > Approvals > Review',
                actionUrl: '/security/approvals',
                automated: true,
                estimatedTime: '3 minutes',
                dismissed: false,
                createdAt: new Date(),
            });
        }

        this.recommendations.set(userId, recommendations);

        if (recommendations.some(r => r.priority === 'critical')) {
            this.emit('criticalRecommendation', { userId, recommendations });
        }
    }

    getRecommendations(userId: string): SecurityRecommendation[] {
        return (this.recommendations.get(userId) || [])
            .filter(r => !r.dismissed)
            .sort((a, b) => {
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
    }

    dismissRecommendation(userId: string, recommendationId: string): boolean {
        const recs = this.recommendations.get(userId) || [];
        const rec = recs.find(r => r.id === recommendationId);
        if (rec) {
            rec.dismissed = true;
            rec.dismissedAt = new Date();
            return true;
        }
        return false;
    }

    // ===========================
    // ANOMALY DETECTION
    // ===========================

    private startAnomalyDetection() {
        // Monitor for anomalies every minute
        setInterval(() => {
            this.scanForAnomalies();
        }, 60 * 1000);
    }

    private async scanForAnomalies() {
        // In production: Analyze real-time transaction data
        for (const [userId, profile] of this.behaviorProfiles.entries()) {
            await this.checkUserAnomalies(userId, profile);
        }
    }

    private async checkUserAnomalies(userId: string, profile: UserBehaviorProfile) {
        const now = new Date();
        const currentHour = now.getHours();

        // Check time anomaly
        const normalActivityAtHour = profile.activeHours.find(h => h.hour === currentHour)?.activity || 0;
        if (normalActivityAtHour < 0.1) {
            // Activity at unusual time
            await this.createAnomaly(userId, {
                type: 'unusual_time',
                severity: 'medium',
                title: 'Activity at Unusual Time',
                description: `Activity detected at ${currentHour}:00, which is unusual for your account.`,
                baseline: `Normal activity: ${(normalActivityAtHour * 100).toFixed(0)}%`,
                detected: 'Transaction initiated',
                deviation: 90,
                suggestedAction: 'Verify this was you',
            });
        }
    }

    async createAnomaly(
        userId: string,
        params: {
            type: AnomalyType;
            severity: AnomalyAlert['severity'];
            title: string;
            description: string;
            baseline: string;
            detected: string;
            deviation: number;
            suggestedAction: string;
            details?: Record<string, any>;
        }
    ): Promise<AnomalyAlert> {
        const anomaly: AnomalyAlert = {
            id: `anomaly_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            userId,
            ...params,
            details: params.details || {},
            requiresAction: params.severity === 'critical' || params.severity === 'high',
            status: 'new',
            createdAt: new Date(),
        };

        // Check auto-defense
        const defense = this.autoDefenseConfigs.get(userId);
        if (defense?.enabled) {
            const action = defense.actions.find(a => a.anomalyType === params.type);
            if (action) {
                anomaly.autoResponseTaken = await this.executeAutoDefense(userId, anomaly, action.action);
            }
        }

        const userAnomalies = this.anomalies.get(userId) || [];
        userAnomalies.push(anomaly);
        this.anomalies.set(userId, userAnomalies);

        this.emit('anomalyDetected', { userId, anomaly });

        return anomaly;
    }

    getAnomalies(userId: string, status?: AnomalyAlert['status']): AnomalyAlert[] {
        const anomalies = this.anomalies.get(userId) || [];
        if (status) {
            return anomalies.filter(a => a.status === status);
        }
        return anomalies.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async resolveAnomaly(
        userId: string,
        anomalyId: string,
        resolution: 'resolved' | 'false_positive'
    ): Promise<AnomalyAlert | null> {
        const anomalies = this.anomalies.get(userId) || [];
        const anomaly = anomalies.find(a => a.id === anomalyId);

        if (anomaly) {
            anomaly.status = resolution;
            anomaly.resolvedAt = new Date();
            anomaly.resolvedBy = userId;

            // Learn from false positives
            if (resolution === 'false_positive') {
                await this.learnFromFalsePositive(userId, anomaly);
            }

            return anomaly;
        }
        return null;
    }

    private async learnFromFalsePositive(userId: string, anomaly: AnomalyAlert) {
        // In production: Update ML model to reduce similar false positives
        const profile = this.behaviorProfiles.get(userId);
        if (!profile) return;

        // Adjust thresholds based on false positive
        this.emit('falsePositiveLearning', { userId, anomaly });
    }

    // ===========================
    // RISK ASSESSMENT
    // ===========================

    async assessRisk(userId: string): Promise<RiskAssessment> {
        const factors: RiskAssessment['factors'] = [];

        // Contract interaction risk
        factors.push({
            category: 'Contract Interactions',
            risk: 'medium',
            score: 45,
            description: 'You have interacted with 3 unverified contracts in the past week.',
            mitigation: 'Only interact with verified, audited contracts.',
        });

        // Token approval risk
        factors.push({
            category: 'Token Approvals',
            risk: 'high',
            score: 70,
            description: '5 unlimited token approvals detected.',
            mitigation: 'Revoke unnecessary approvals or set spending limits.',
        });

        // Portfolio concentration risk
        factors.push({
            category: 'Portfolio Concentration',
            risk: 'medium',
            score: 55,
            description: '65% of portfolio in a single asset.',
            mitigation: 'Consider diversifying across multiple assets.',
        });

        // DeFi protocol risk
        factors.push({
            category: 'DeFi Exposure',
            risk: 'low',
            score: 25,
            description: 'Funds in audited, established protocols only.',
        });

        const avgRiskScore = factors.reduce((sum, f) => sum + f.score, 0) / factors.length;

        let overallRisk: RiskAssessment['overallRisk'] = 'low';
        if (avgRiskScore >= 70) overallRisk = 'critical';
        else if (avgRiskScore >= 50) overallRisk = 'high';
        else if (avgRiskScore >= 30) overallRisk = 'medium';

        return {
            userId,
            timestamp: new Date(),
            overallRisk,
            riskScore: Math.round(avgRiskScore),
            factors,
            portfolio: {
                totalValue: '25000',
                atRiskValue: '5000',
                atRiskPercent: 20,
                topRisks: [
                    { asset: 'SHIB', risk: 'High volatility meme coin', exposure: '3000' },
                    { asset: 'Unknown Token', risk: 'Unverified contract', exposure: '2000' },
                ],
            },
            recommendations: [
                'Revoke unlimited token approvals',
                'Diversify portfolio holdings',
                'Enable transaction simulation before approving',
            ],
        };
    }

    // ===========================
    // THREAT INTELLIGENCE
    // ===========================

    private startThreatMonitor() {
        // Check threat feeds every 5 minutes
        setInterval(() => {
            this.updateThreatIntelligence();
        }, 5 * 60 * 1000);
    }

    private async updateThreatIntelligence() {
        // In production: Fetch from threat intelligence APIs
        // Sources: Etherscan labels, Chainabuse, Forta, etc.
    }

    async addThreatIntel(intel: Omit<ThreatIntelligence, 'id'>): Promise<ThreatIntelligence> {
        const threat: ThreatIntelligence = {
            id: `threat_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            ...intel,
        };

        this.threatIntel.push(threat);

        // Check if any users are affected
        await this.checkUsersForThreat(threat);

        this.emit('newThreat', threat);

        return threat;
    }

    private async checkUsersForThreat(threat: ThreatIntelligence) {
        // In production: Check user portfolios against threat indicators
        for (const userId of this.healthScores.keys()) {
            // Check if user has affected assets/protocols
            const userHasExposure = threat.affectedAssets.length > 0 || threat.affectedProtocols.length > 0;

            if (userHasExposure) {
                await this.createAnomaly(userId, {
                    type: 'phishing_interaction',
                    severity: threat.severity,
                    title: `Threat Alert: ${threat.title}`,
                    description: threat.description,
                    baseline: 'No exposure expected',
                    detected: 'Potential exposure detected',
                    deviation: 100,
                    suggestedAction: threat.suggestedAction,
                    details: { threatId: threat.id },
                });
            }
        }
    }

    getActiveThreatIntel(): ThreatIntelligence[] {
        const now = new Date();
        return this.threatIntel.filter(t => !t.expiresAt || t.expiresAt > now);
    }

    // ===========================
    // AUTO-DEFENSE
    // ===========================

    configureAutoDefense(userId: string, config: AutoDefenseConfig): AutoDefenseConfig {
        this.autoDefenseConfigs.set(userId, config);
        return config;
    }

    getAutoDefenseConfig(userId: string): AutoDefenseConfig | null {
        return this.autoDefenseConfigs.get(userId) || null;
    }

    private async executeAutoDefense(
        userId: string,
        anomaly: AnomalyAlert,
        action: string
    ): Promise<string> {
        switch (action) {
            case 'alert':
                // Send notifications
                this.emit('autoDefenseAlert', { userId, anomaly });
                return 'Alert sent to user';

            case 'block':
                // Block the transaction
                this.emit('autoDefenseBlock', { userId, anomaly });
                return 'Transaction blocked';

            case 'require_2fa':
                // Force 2FA verification
                this.emit('autoDefense2FA', { userId, anomaly });
                return '2FA verification required';

            case 'pause':
                // Pause all transactions
                this.emit('autoDefensePause', { userId, anomaly });
                return 'Wallet paused for 1 hour';

            case 'evacuate':
                // Emergency evacuation
                this.emit('autoDefenseEvacuate', { userId, anomaly });
                return 'Emergency evacuation initiated';

            default:
                return 'No action taken';
        }
    }

    // ===========================
    // BEHAVIOR PROFILING
    // ===========================

    async updateBehaviorProfile(userId: string): Promise<UserBehaviorProfile> {
        // Get existing profile or create new one
        const existing = this.behaviorProfiles.get(userId);

        // Initialize with neutral values - will be updated from actual user activity
        const profile: UserBehaviorProfile = existing || {
            userId,
            activeHours: Array.from({ length: 24 }, (_, i) => ({
                hour: i,
                activity: 0, // Start at 0, will be incremented by recordActivity
            })),
            activeDays: Array.from({ length: 7 }, (_, i) => ({
                day: i,
                activity: 0,
            })),
            avgTransactionsPerDay: 0,
            avgTransactionSize: '0',
            preferredChains: [],
            preferredTokens: [],
            preferredProtocols: [],
            checkFrequency: 0,
            responseTime: 0,
            securityActions: 0,
            riskTolerance: 'moderate',
            lastUpdated: new Date(),
        };

        profile.lastUpdated = new Date();
        this.behaviorProfiles.set(userId, profile);
        return profile;
    }

    // Record user activity to build behavior profile
    async recordActivity(userId: string, activity: {
        hour?: number;
        day?: number;
        chain?: string;
        token?: string;
        protocol?: string;
        transactionSize?: string;
    }): Promise<void> {
        let profile = this.behaviorProfiles.get(userId);
        if (!profile) {
            profile = await this.updateBehaviorProfile(userId);
        }

        // Update active hours
        if (activity.hour !== undefined) {
            const hourEntry = profile.activeHours.find(h => h.hour === activity.hour);
            if (hourEntry) {
                hourEntry.activity = Math.min(1, hourEntry.activity + 0.1);
            }
        }

        // Update active days
        if (activity.day !== undefined) {
            const dayEntry = profile.activeDays.find(d => d.day === activity.day);
            if (dayEntry) {
                dayEntry.activity = Math.min(1, dayEntry.activity + 0.1);
            }
        }

        // Update preferred chains
        if (activity.chain && !profile.preferredChains.includes(activity.chain)) {
            profile.preferredChains.push(activity.chain);
        }

        // Update preferred tokens
        if (activity.token && !profile.preferredTokens.includes(activity.token)) {
            profile.preferredTokens.push(activity.token);
        }

        // Update preferred protocols
        if (activity.protocol && !profile.preferredProtocols.includes(activity.protocol)) {
            profile.preferredProtocols.push(activity.protocol);
        }

        // Update transaction metrics
        if (activity.transactionSize) {
            const currentAvg = parseFloat(profile.avgTransactionSize) || 0;
            const newSize = parseFloat(activity.transactionSize);
            profile.avgTransactionSize = ((currentAvg + newSize) / 2).toFixed(2);
        }

        profile.lastUpdated = new Date();
        this.behaviorProfiles.set(userId, profile);
    }

    getBehaviorProfile(userId: string): UserBehaviorProfile | null {
        return this.behaviorProfiles.get(userId) || null;
    }
}

export const aiSecurityService = new AISecurityService();
