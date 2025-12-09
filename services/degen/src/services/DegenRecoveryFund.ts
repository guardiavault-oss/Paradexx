// ============================================================================
// DEGEN RECOVERY FUND - Insurance Pool for Rug Pulls
// Community-funded insurance system that provides partial recovery
// for verified rug pull victims
// ============================================================================

import { ethers, JsonRpcProvider } from 'ethers';
import EventEmitter from 'eventemitter3';
import {
  RecoveryFundConfig,
  RecoveryFundPool,
  RecoveryContributor,
  RecoveryClaim,
  RecoveryFundStats,
  ClaimStatus,
  RugPullType
} from '../types';
import { config as appConfig } from '../config';
import { logger, generateId, checksumAddress, formatEther, parseEther } from '../utils';
import { tokenAnalyzer } from './TokenAnalyzer';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: RecoveryFundConfig = {
  enabled: true,
  
  // Pool settings
  minPoolBalance: '1',  // 1 ETH minimum pool
  maxClaimPercentage: 10,  // Max 10% of pool per claim
  maxClaimAmountEth: '0.5',  // Max 0.5 ETH per claim
  claimCooldownHours: 168,  // 7 days between claims per address
  
  // Contribution settings
  contributionPercentage: 5,  // 5% of profits to pool
  autoContributeEnabled: false,
  minContributionEth: '0.01',
  
  // Verification settings
  requireProofOfLoss: true,
  minHoldTimeSeconds: 60,  // Must have held at least 1 minute
  maxClaimWindowHours: 72,  // 3 days to file claim after rug
  
  // Community governance
  requireCommunityVote: true,
  minVotesRequired: 5,
  voteTimeoutHours: 24
};

// ============================================================================
// EVENTS
// ============================================================================

export interface DegenRecoveryFundEvents {
  'contribution:received': (contributor: RecoveryContributor, amount: bigint) => void;
  'claim:submitted': (claim: RecoveryClaim) => void;
  'claim:approved': (claim: RecoveryClaim) => void;
  'claim:rejected': (claim: RecoveryClaim, reason: string) => void;
  'claim:paid': (claim: RecoveryClaim) => void;
  'vote:cast': (claimId: string, voter: string, vote: boolean) => void;
  'pool:updated': (pool: RecoveryFundPool) => void;
  'stats:updated': (stats: RecoveryFundStats) => void;
}

// ============================================================================
// DEGEN RECOVERY FUND SERVICE
// ============================================================================

export class DegenRecoveryFund extends EventEmitter<DegenRecoveryFundEvents> {
  private config: RecoveryFundConfig;
  private provider: JsonRpcProvider;
  private isRunning: boolean = false;
  
  // Data stores
  private pool: RecoveryFundPool;
  private contributors: Map<string, RecoveryContributor> = new Map();
  private claims: Map<string, RecoveryClaim> = new Map();
  private claimHistory: RecoveryClaim[] = [];
  private lastClaimTime: Map<string, number> = new Map();  // address -> timestamp
  
  // Stats
  private stats: RecoveryFundStats;
  
  // Monitoring
  private monitorInterval: NodeJS.Timeout | null = null;
  private voteCheckInterval: NodeJS.Timeout | null = null;

  constructor(customConfig?: Partial<RecoveryFundConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
    this.provider = new JsonRpcProvider(appConfig.rpcUrl);
    
    // Initialize pool
    this.pool = {
      totalBalance: 0n,
      availableBalance: 0n,
      pendingClaims: 0n,
      totalContributed: 0n,
      totalPaid: 0n,
      contributorCount: 0,
      claimCount: 0,
      successfulClaims: 0,
      lastUpdated: Date.now()
    };
    
    // Initialize stats
    this.stats = this.initializeStats();
  }

  private initializeStats(): RecoveryFundStats {
    return {
      poolBalance: '0',
      totalContributed: '0',
      totalPaidOut: '0',
      pendingClaims: 0,
      approvedClaims: 0,
      rejectedClaims: 0,
      avgClaimAmount: '0',
      avgPayoutTime: 0,
      contributorCount: 0,
      lastUpdated: Date.now()
    };
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('[RecoveryFund] Already running');
      return;
    }

    logger.info('╔════════════════════════════════════════╗');
    logger.info('║     DEGEN RECOVERY FUND - Starting     ║');
    logger.info('╚════════════════════════════════════════╝');

    this.isRunning = true;

    // Start monitoring for expired claims
    this.startClaimMonitoring();
    
    // Start vote checking for pending claims
    this.startVoteChecking();

    logger.info('[RecoveryFund] ✓ Recovery Fund started');
    logger.info(`[RecoveryFund] Pool Balance: ${formatEther(this.pool.totalBalance)} ETH`);
  }

  async stop(): Promise<void> {
    logger.info('[RecoveryFund] Stopping Recovery Fund...');
    
    this.isRunning = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    if (this.voteCheckInterval) {
      clearInterval(this.voteCheckInterval);
      this.voteCheckInterval = null;
    }

    logger.info('[RecoveryFund] Recovery Fund stopped');
  }

  // ==========================================================================
  // CONTRIBUTIONS
  // ==========================================================================

  async contribute(
    contributorAddress: string,
    amountWei: bigint,
    txHash?: string
  ): Promise<RecoveryContributor> {
    const address = checksumAddress(contributorAddress);
    const normalizedAddress = address.toLowerCase();
    
    // Get or create contributor
    let contributor = this.contributors.get(normalizedAddress);
    
    if (!contributor) {
      contributor = {
        id: generateId(),
        address,
        totalContributed: 0n,
        contributionCount: 0,
        firstContribution: Date.now(),
        lastContribution: Date.now(),
        claimsSubmitted: 0,
        claimsPaid: 0
      };
      this.contributors.set(normalizedAddress, contributor);
      this.pool.contributorCount++;
    }
    
    // Update contributor
    contributor.totalContributed += amountWei;
    contributor.contributionCount++;
    contributor.lastContribution = Date.now();
    
    // Update pool
    this.pool.totalBalance += amountWei;
    this.pool.availableBalance += amountWei;
    this.pool.totalContributed += amountWei;
    this.pool.lastUpdated = Date.now();
    
    // Update stats
    this.updateStats();
    
    this.emit('contribution:received', contributor, amountWei);
    this.emit('pool:updated', this.pool);
    
    logger.info(`[RecoveryFund] Contribution received: ${formatEther(amountWei)} ETH from ${address}`);
    
    return contributor;
  }

  // Auto-contribute from profits
  async autoContribute(
    profitWei: bigint,
    walletAddress: string
  ): Promise<bigint | null> {
    if (!this.config.autoContributeEnabled) return null;
    
    const contributionAmount = (profitWei * BigInt(this.config.contributionPercentage)) / 100n;
    const minContribution = parseEther(this.config.minContributionEth);
    
    if (contributionAmount < minContribution) {
      logger.debug('[RecoveryFund] Profit too small for auto-contribution');
      return null;
    }
    
    await this.contribute(walletAddress, contributionAmount);
    return contributionAmount;
  }

  // ==========================================================================
  // CLAIMS
  // ==========================================================================

  async submitClaim(
    claimantAddress: string,
    tokenAddress: string,
    rugPullType: RugPullType,
    amountLostWei: bigint,
    entryTxHash: string,
    rugTxHash?: string,
    proofDocuments: string[] = []
  ): Promise<RecoveryClaim | null> {
    const address = checksumAddress(claimantAddress);
    const normalizedAddress = address.toLowerCase();
    
    // Check cooldown
    const lastClaim = this.lastClaimTime.get(normalizedAddress);
    if (lastClaim) {
      const cooldownMs = this.config.claimCooldownHours * 60 * 60 * 1000;
      if (Date.now() - lastClaim < cooldownMs) {
        logger.warn(`[RecoveryFund] Claim rejected - cooldown active for ${address}`);
        return null;
      }
    }
    
    // Verify the token was indeed rugged
    const isVerifiedRug = await this.verifyRugPull(tokenAddress, rugPullType);
    if (!isVerifiedRug) {
      logger.warn(`[RecoveryFund] Claim rejected - cannot verify rug pull for ${tokenAddress}`);
      return null;
    }
    
    // Calculate claim amount (capped at max percentage of pool and max ETH)
    const maxFromPool = (this.pool.availableBalance * BigInt(this.config.maxClaimPercentage)) / 100n;
    const maxEth = parseEther(this.config.maxClaimAmountEth);
    const maxClaim = maxFromPool < maxEth ? maxFromPool : maxEth;
    
    // Claim is 50% of actual loss, up to the maximum
    const claimAmount = (amountLostWei / 2n) < maxClaim ? (amountLostWei / 2n) : maxClaim;
    
    // Get token info
    const tokenInfo = await tokenAnalyzer.quickSafetyCheck(tokenAddress);
    
    const claim: RecoveryClaim = {
      id: generateId(),
      claimantAddress: address,
      tokenAddress: checksumAddress(tokenAddress),
      tokenSymbol: 'UNKNOWN',  // Would fetch from token analyzer
      rugPullType,
      status: ClaimStatus.PENDING,
      
      amountLostWei,
      amountLostUSD: 0,  // Would calculate from price
      claimAmountWei: claimAmount,
      paidAmountWei: 0n,
      
      entryTxHash,
      rugTxHash,
      proofDocuments,
      
      votesFor: 0,
      votesAgainst: 0,
      voters: [],
      
      submittedAt: Date.now(),
      expiresAt: Date.now() + (this.config.voteTimeoutHours * 60 * 60 * 1000)
    };
    
    this.claims.set(claim.id, claim);
    this.pool.claimCount++;
    this.pool.pendingClaims += claimAmount;
    
    // Update contributor claims count
    const contributor = this.contributors.get(normalizedAddress);
    if (contributor) {
      contributor.claimsSubmitted++;
    }
    
    this.emit('claim:submitted', claim);
    this.emit('pool:updated', this.pool);
    
    logger.info(`[RecoveryFund] Claim submitted: ${claim.id} for ${formatEther(claimAmount)} ETH`);
    
    // If community vote not required, auto-approve
    if (!this.config.requireCommunityVote) {
      await this.approveClaim(claim.id);
    }
    
    return claim;
  }

  async voteOnClaim(
    claimId: string,
    voterAddress: string,
    approve: boolean
  ): Promise<boolean> {
    const claim = this.claims.get(claimId);
    if (!claim) {
      logger.warn(`[RecoveryFund] Vote failed - claim not found: ${claimId}`);
      return false;
    }
    
    if (claim.status !== ClaimStatus.PENDING && claim.status !== ClaimStatus.UNDER_REVIEW) {
      logger.warn(`[RecoveryFund] Vote failed - claim not in voting state: ${claimId}`);
      return false;
    }
    
    const voter = checksumAddress(voterAddress).toLowerCase();
    
    // Check if already voted
    if (claim.voters.includes(voter)) {
      logger.warn(`[RecoveryFund] Vote failed - already voted: ${voter}`);
      return false;
    }
    
    // Only contributors can vote
    if (!this.contributors.has(voter)) {
      logger.warn(`[RecoveryFund] Vote failed - not a contributor: ${voter}`);
      return false;
    }
    
    // Cast vote
    claim.voters.push(voter);
    if (approve) {
      claim.votesFor++;
    } else {
      claim.votesAgainst++;
    }
    
    claim.status = ClaimStatus.UNDER_REVIEW;
    
    this.emit('vote:cast', claimId, voter, approve);
    
    // Check if voting threshold reached
    const totalVotes = claim.votesFor + claim.votesAgainst;
    if (totalVotes >= this.config.minVotesRequired) {
      if (claim.votesFor > claim.votesAgainst) {
        await this.approveClaim(claimId);
      } else {
        await this.rejectClaim(claimId, 'Community vote rejected');
      }
    }
    
    return true;
  }

  private async approveClaim(claimId: string): Promise<void> {
    const claim = this.claims.get(claimId);
    if (!claim) return;
    
    claim.status = ClaimStatus.APPROVED;
    claim.reviewedAt = Date.now();
    
    this.emit('claim:approved', claim);
    
    logger.info(`[RecoveryFund] Claim approved: ${claimId}`);
    
    // Auto-pay if funds available
    if (this.pool.availableBalance >= claim.claimAmountWei) {
      await this.payClaim(claimId);
    }
  }

  private async rejectClaim(claimId: string, reason: string): Promise<void> {
    const claim = this.claims.get(claimId);
    if (!claim) return;
    
    claim.status = ClaimStatus.REJECTED;
    claim.reviewedAt = Date.now();
    claim.notes = reason;
    
    // Return pending claim amount to available
    this.pool.pendingClaims -= claim.claimAmountWei;
    
    this.emit('claim:rejected', claim, reason);
    this.emit('pool:updated', this.pool);
    
    logger.info(`[RecoveryFund] Claim rejected: ${claimId} - ${reason}`);
  }

  private async payClaim(claimId: string): Promise<void> {
    const claim = this.claims.get(claimId);
    if (!claim || claim.status !== ClaimStatus.APPROVED) return;
    
    // Deduct from pool
    this.pool.availableBalance -= claim.claimAmountWei;
    this.pool.pendingClaims -= claim.claimAmountWei;
    this.pool.totalPaid += claim.claimAmountWei;
    this.pool.successfulClaims++;
    
    // Update claim
    claim.status = ClaimStatus.PAID;
    claim.paidAmountWei = claim.claimAmountWei;
    claim.paidAt = Date.now();
    
    // Update claimant
    const claimant = this.contributors.get(claim.claimantAddress.toLowerCase());
    if (claimant) {
      claimant.claimsPaid++;
    }
    
    // Record cooldown
    this.lastClaimTime.set(claim.claimantAddress.toLowerCase(), Date.now());
    
    // Move to history
    this.claimHistory.push(claim);
    
    this.emit('claim:paid', claim);
    this.emit('pool:updated', this.pool);
    
    this.updateStats();
    
    logger.info(`[RecoveryFund] Claim paid: ${claimId} - ${formatEther(claim.paidAmountWei)} ETH`);
  }

  // ==========================================================================
  // VERIFICATION
  // ==========================================================================

  private async verifyRugPull(
    tokenAddress: string,
    rugType: RugPullType
  ): Promise<boolean> {
    try {
      // Check if token is now a honeypot or has suspicious activity
      const analysis = await tokenAnalyzer.analyzeToken(tokenAddress);
      
      // Verify based on rug type
      switch (rugType) {
        case RugPullType.HONEYPOT:
          return analysis.honeypotTest.isHoneypot;
          
        case RugPullType.LIQUIDITY_PULL:
          return analysis.liquidityAnalysis.totalLiquidityUSD < 100;
          
        case RugPullType.OWNER_DUMP:
          return analysis.ownerAnalysis.ownerPercentage < 1;  // Owner dumped holdings
          
        case RugPullType.MINT_EXPLOIT:
          return analysis.contractAnalysis.hasMintFunction;
          
        default:
          // For other types, assume verified if token analysis shows danger
          return analysis.riskLevel === 'HONEYPOT' || analysis.riskLevel === 'CRITICAL';
      }
    } catch {
      // If we can't analyze, be conservative
      return false;
    }
  }

  // ==========================================================================
  // MONITORING
  // ==========================================================================

  private startClaimMonitoring(): void {
    // Check for expired claims every hour
    this.monitorInterval = setInterval(() => {
      this.processExpiredClaims();
    }, 60 * 60 * 1000);
  }

  private startVoteChecking(): void {
    // Check votes every 15 minutes
    this.voteCheckInterval = setInterval(() => {
      this.processVotingClaims();
    }, 15 * 60 * 1000);
  }

  private processExpiredClaims(): void {
    const now = Date.now();
    
    for (const [id, claim] of this.claims) {
      if (claim.status === ClaimStatus.PENDING || claim.status === ClaimStatus.UNDER_REVIEW) {
        if (claim.expiresAt < now) {
          this.rejectClaim(id, 'Voting period expired');
        }
      }
    }
  }

  private processVotingClaims(): void {
    for (const [id, claim] of this.claims) {
      if (claim.status === ClaimStatus.UNDER_REVIEW) {
        const totalVotes = claim.votesFor + claim.votesAgainst;
        
        // If enough votes collected, finalize
        if (totalVotes >= this.config.minVotesRequired) {
          if (claim.votesFor > claim.votesAgainst) {
            this.approveClaim(id);
          } else {
            this.rejectClaim(id, 'Community vote rejected');
          }
        }
      }
    }
  }

  private updateStats(): void {
    // Calculate average claim amount
    let totalClaimAmount = 0n;
    let paidCount = 0;
    let totalPayoutTime = 0;
    
    for (const claim of this.claimHistory) {
      if (claim.status === ClaimStatus.PAID && claim.paidAt && claim.submittedAt) {
        totalClaimAmount += claim.paidAmountWei;
        paidCount++;
        totalPayoutTime += (claim.paidAt - claim.submittedAt);
      }
    }
    
    const pendingCount = Array.from(this.claims.values())
      .filter(c => c.status === ClaimStatus.PENDING || c.status === ClaimStatus.UNDER_REVIEW)
      .length;
    
    const approvedCount = Array.from(this.claims.values())
      .filter(c => c.status === ClaimStatus.APPROVED || c.status === ClaimStatus.PAID)
      .length;
    
    const rejectedCount = Array.from(this.claims.values())
      .filter(c => c.status === ClaimStatus.REJECTED)
      .length;
    
    this.stats = {
      poolBalance: formatEther(this.pool.totalBalance),
      totalContributed: formatEther(this.pool.totalContributed),
      totalPaidOut: formatEther(this.pool.totalPaid),
      pendingClaims: pendingCount,
      approvedClaims: approvedCount,
      rejectedClaims: rejectedCount,
      avgClaimAmount: paidCount > 0 ? formatEther(totalClaimAmount / BigInt(paidCount)) : '0',
      avgPayoutTime: paidCount > 0 ? (totalPayoutTime / paidCount) / (1000 * 60 * 60) : 0,
      contributorCount: this.pool.contributorCount,
      lastUpdated: Date.now()
    };
    
    this.emit('stats:updated', this.stats);
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  getConfig(): RecoveryFundConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<RecoveryFundConfig>): void {
    this.config = { ...this.config, ...updates };
    logger.info('[RecoveryFund] Configuration updated');
  }

  getPool(): RecoveryFundPool {
    return { ...this.pool };
  }

  getStats(): RecoveryFundStats {
    return { ...this.stats };
  }

  getContributor(address: string): RecoveryContributor | undefined {
    return this.contributors.get(address.toLowerCase());
  }

  getAllContributors(): RecoveryContributor[] {
    return Array.from(this.contributors.values())
      .sort((a, b) => Number(b.totalContributed - a.totalContributed));
  }

  getClaim(claimId: string): RecoveryClaim | undefined {
    return this.claims.get(claimId);
  }

  getPendingClaims(): RecoveryClaim[] {
    return Array.from(this.claims.values())
      .filter(c => c.status === ClaimStatus.PENDING || c.status === ClaimStatus.UNDER_REVIEW)
      .sort((a, b) => a.submittedAt - b.submittedAt);
  }

  getClaimHistory(limit: number = 100): RecoveryClaim[] {
    return this.claimHistory.slice(-limit).reverse();
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const degenRecoveryFund = new DegenRecoveryFund();

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createDegenRecoveryFund(
  config?: Partial<RecoveryFundConfig>
): DegenRecoveryFund {
  return new DegenRecoveryFund(config);
}
