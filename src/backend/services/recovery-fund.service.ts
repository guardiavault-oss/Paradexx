/**
 * Recovery Fund Service - Community Insurance Pool (PRODUCTION)
 * 
 * Features:
 * - Track community insurance pool balance
 * - Submit rug pull claims
 * - Verify and process claims
 * - Calculate coverage based on tier
 * - Distribute recovered funds
 * 
 * Tiers:
 * - Bronze: Up to $1,000 coverage
 * - Silver: Up to $5,000 coverage  
 * - Gold: Up to $10,000 coverage
 * - Platinum: Up to $25,000 coverage
 */

import { EventEmitter } from 'events';
import { logger } from '../services/logger.service';
import axios from 'axios';

const HONEYPOT_API = 'https://api.honeypot.is/v2';
const GOPLUSLABS_API = 'https://api.gopluslabs.io/api/v1';

type ClaimStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'paid';
type MemberTier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface RecoveryFundMember {
    userId: string;
    tier: MemberTier;
    contributionAmount: string;
    coverageLimit: string;
    joinedAt: Date;
    claimsSubmitted: number;
    claimsPaid: number;
    totalRecovered: string;
}

interface RugPullClaim {
    id: string;
    userId: string;
    tokenAddress: string;
    tokenSymbol: string;
    chainId: number;
    investedAmount: string;
    lostAmount: string;
    txHashes: string[];
    evidence: ClaimEvidence;
    status: ClaimStatus;
    reviewNotes?: string;
    approvedAmount?: string;
    submittedAt: Date;
    reviewedAt?: Date;
    paidAt?: Date;
}

interface ClaimEvidence {
    rugType: 'liquidity_pull' | 'honeypot' | 'dev_dump' | 'contract_exploit' | 'other';
    description: string;
    proofUrls?: string[];
    automatedCheck?: RugVerification;
}

interface RugVerification {
    isRug: boolean;
    confidence: number;
    rugType?: string;
    indicators: string[];
    liquidityRemoved?: boolean;
    devSold?: boolean;
    contractDisabled?: boolean;
}

interface FundStats {
    totalPoolBalance: string;
    totalMembers: number;
    totalClaimsPaid: number;
    totalAmountPaid: string;
    pendingClaims: number;
    avgClaimAmount: string;
}

// Coverage limits by tier
const TIER_COVERAGE: Record<MemberTier, number> = {
    bronze: 1000,
    silver: 5000,
    gold: 10000,
    platinum: 25000,
};

// Monthly contribution by tier
const TIER_CONTRIBUTION: Record<MemberTier, number> = {
    bronze: 5,
    silver: 15,
    gold: 35,
    platinum: 75,
};

class RecoveryFundService extends EventEmitter {
    private members: Map<string, RecoveryFundMember> = new Map();
    private claims: Map<string, RugPullClaim> = new Map();
    private poolBalance: number = 50000; // Starting pool balance (simulated)

    constructor() {
        super();
        logger.info('[RecoveryFund] Service initialized with $50,000 pool');
    }

    // Join the recovery fund
    async joinFund(userId: string, tier: MemberTier): Promise<RecoveryFundMember> {
        if (this.members.has(userId)) {
            throw new Error('User already a member');
        }

        const member: RecoveryFundMember = {
            userId,
            tier,
            contributionAmount: TIER_CONTRIBUTION[tier].toString(),
            coverageLimit: TIER_COVERAGE[tier].toString(),
            joinedAt: new Date(),
            claimsSubmitted: 0,
            claimsPaid: 0,
            totalRecovered: '0',
        };

        this.members.set(userId, member);
        this.poolBalance += TIER_CONTRIBUTION[tier];

        this.emit('memberJoined', member);
        logger.info(`[RecoveryFund] New ${tier} member joined, pool: $${this.poolBalance}`);

        return member;
    }

    // Upgrade tier
    async upgradeTier(userId: string, newTier: MemberTier): Promise<RecoveryFundMember> {
        const member = this.members.get(userId);
        if (!member) throw new Error('Not a member');

        const tierOrder: MemberTier[] = ['bronze', 'silver', 'gold', 'platinum'];
        const currentIndex = tierOrder.indexOf(member.tier);
        const newIndex = tierOrder.indexOf(newTier);

        if (newIndex <= currentIndex) {
            throw new Error('Can only upgrade to a higher tier');
        }

        // Add difference to pool
        const additionalContribution = TIER_CONTRIBUTION[newTier] - TIER_CONTRIBUTION[member.tier];
        this.poolBalance += additionalContribution;

        member.tier = newTier;
        member.contributionAmount = TIER_CONTRIBUTION[newTier].toString();
        member.coverageLimit = TIER_COVERAGE[newTier].toString();

        return member;
    }

    // Submit a rug pull claim
    async submitClaim(
        userId: string,
        params: {
            tokenAddress: string;
            tokenSymbol: string;
            chainId: number;
            investedAmount: string;
            lostAmount: string;
            txHashes: string[];
            rugType: ClaimEvidence['rugType'];
            description: string;
            proofUrls?: string[];
        }
    ): Promise<RugPullClaim> {
        const member = this.members.get(userId);
        if (!member) throw new Error('Must be a member to submit claims');

        const claimId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Auto-verify the rug
        const verification = await this.verifyRug(params.tokenAddress, params.chainId);

        const claim: RugPullClaim = {
            id: claimId,
            userId,
            tokenAddress: params.tokenAddress,
            tokenSymbol: params.tokenSymbol,
            chainId: params.chainId,
            investedAmount: params.investedAmount,
            lostAmount: params.lostAmount,
            txHashes: params.txHashes,
            evidence: {
                rugType: params.rugType,
                description: params.description,
                proofUrls: params.proofUrls,
                automatedCheck: verification,
            },
            status: 'pending',
            submittedAt: new Date(),
        };

        // Auto-approve if high confidence rug detected
        if (verification.isRug && verification.confidence >= 80) {
            claim.status = 'approved';
            claim.approvedAmount = this.calculateApprovedAmount(member, params.lostAmount);
            claim.reviewedAt = new Date();
            claim.reviewNotes = 'Auto-approved: High confidence rug detected';
        }

        this.claims.set(claimId, claim);
        member.claimsSubmitted++;

        this.emit('claimSubmitted', claim);
        logger.info(`[RecoveryFund] Claim ${claimId} submitted for ${params.tokenSymbol}`);

        return claim;
    }

    // Verify if a token is actually a rug
    async verifyRug(tokenAddress: string, chainId: number): Promise<RugVerification> {
        const indicators: string[] = [];
        let isRug = false;
        let confidence = 0;

        try {
            // Check Honeypot.is
            const honeypotRes = await axios.get(
                `${HONEYPOT_API}/IsHoneypot?address=${tokenAddress}&chainID=${chainId}`,
                { timeout: 5000 }
            ).catch(() => null);

            if (honeypotRes?.data) {
                const hp = honeypotRes.data;

                if (hp.honeypotResult?.isHoneypot) {
                    indicators.push('Honeypot detected');
                    isRug = true;
                    confidence += 40;
                }

                if (hp.simulationResult?.sellTax > 50) {
                    indicators.push(`Extreme sell tax: ${hp.simulationResult.sellTax}%`);
                    isRug = true;
                    confidence += 30;
                }

                if (hp.pair?.liquidity?.usd < 100) {
                    indicators.push('Liquidity removed (near zero)');
                    isRug = true;
                    confidence += 30;
                }
            }

            // Check GoPlus Security
            const goplusRes = await axios.get(
                `${GOPLUSLABS_API}/token_security/${chainId}?contract_addresses=${tokenAddress}`,
                { timeout: 5000 }
            ).catch(() => null);

            if (goplusRes?.data?.result?.[tokenAddress.toLowerCase()]) {
                const gp = goplusRes.data.result[tokenAddress.toLowerCase()];

                if (gp.is_honeypot === '1') {
                    indicators.push('GoPlus: Honeypot');
                    confidence += 20;
                }

                if (gp.cannot_sell_all === '1') {
                    indicators.push('GoPlus: Cannot sell');
                    confidence += 15;
                }

                if (gp.owner_change_balance === '1') {
                    indicators.push('GoPlus: Owner can change balance');
                    confidence += 15;
                }
            }

        } catch (error) {
            logger.warn('[RecoveryFund] Verification API error:', error);
        }

        return {
            isRug,
            confidence: Math.min(100, confidence),
            indicators,
            liquidityRemoved: indicators.some(i => i.includes('Liquidity')),
            devSold: indicators.some(i => i.includes('Owner')),
            contractDisabled: indicators.some(i => i.includes('Honeypot')),
        };
    }

    private calculateApprovedAmount(member: RecoveryFundMember, lostAmount: string): string {
        const lost = parseFloat(lostAmount);
        const coverage = TIER_COVERAGE[member.tier];

        // Pay up to coverage limit, or 80% of loss, whichever is lower
        const maxPayout = Math.min(coverage, lost * 0.8);

        // Also limited by pool balance (max 10% of pool per claim)
        const poolLimit = this.poolBalance * 0.1;

        return Math.min(maxPayout, poolLimit).toFixed(2);
    }

    // Process approved claim (pay out)
    async processClaim(claimId: string): Promise<RugPullClaim> {
        const claim = this.claims.get(claimId);
        if (!claim) throw new Error('Claim not found');
        if (claim.status !== 'approved') throw new Error('Claim not approved');

        const member = this.members.get(claim.userId);
        if (!member) throw new Error('Member not found');

        const payoutAmount = parseFloat(claim.approvedAmount || '0');

        if (payoutAmount > this.poolBalance) {
            throw new Error('Insufficient pool balance');
        }

        // Deduct from pool
        this.poolBalance -= payoutAmount;

        // Update claim
        claim.status = 'paid';
        claim.paidAt = new Date();

        // Update member stats
        member.claimsPaid++;
        member.totalRecovered = (parseFloat(member.totalRecovered) + payoutAmount).toFixed(2);

        this.emit('claimPaid', { claim, amount: payoutAmount });
        logger.info(`[RecoveryFund] Paid $${payoutAmount} for claim ${claimId}`);

        return claim;
    }

    // Get member info
    getMember(userId: string): RecoveryFundMember | null {
        return this.members.get(userId) || null;
    }

    // Get user claims
    getUserClaims(userId: string): RugPullClaim[] {
        return Array.from(this.claims.values()).filter(c => c.userId === userId);
    }

    // Get fund stats
    getFundStats(): FundStats {
        const allClaims = Array.from(this.claims.values());
        const paidClaims = allClaims.filter(c => c.status === 'paid');
        const pendingClaims = allClaims.filter(c => c.status === 'pending' || c.status === 'under_review');

        const totalPaid = paidClaims.reduce((sum, c) => sum + parseFloat(c.approvedAmount || '0'), 0);
        const avgClaim = paidClaims.length > 0 ? totalPaid / paidClaims.length : 0;

        return {
            totalPoolBalance: this.poolBalance.toFixed(2),
            totalMembers: this.members.size,
            totalClaimsPaid: paidClaims.length,
            totalAmountPaid: totalPaid.toFixed(2),
            pendingClaims: pendingClaims.length,
            avgClaimAmount: avgClaim.toFixed(2),
        };
    }

    // Get coverage info for display
    getCoverageInfo(): { tier: MemberTier; coverage: number; monthlyFee: number }[] {
        return [
            { tier: 'bronze', coverage: TIER_COVERAGE.bronze, monthlyFee: TIER_CONTRIBUTION.bronze },
            { tier: 'silver', coverage: TIER_COVERAGE.silver, monthlyFee: TIER_CONTRIBUTION.silver },
            { tier: 'gold', coverage: TIER_COVERAGE.gold, monthlyFee: TIER_CONTRIBUTION.gold },
            { tier: 'platinum', coverage: TIER_COVERAGE.platinum, monthlyFee: TIER_CONTRIBUTION.platinum },
        ];
    }
}

export const recoveryFundService = new RecoveryFundService();
export type { RecoveryFundMember, RugPullClaim, FundStats, MemberTier };
