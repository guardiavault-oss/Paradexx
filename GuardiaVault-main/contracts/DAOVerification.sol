// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DAOVerification
 * @dev Community-based verification system for vault claims
 * @notice Verifiers stake tokens, vote on claims, earn reputation and rewards
 */
contract DAOVerification is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============
    
    IERC20 public stakingToken; // Token verifiers must stake (e.g., governance token)
    uint256 public minimumStake; // Minimum stake required to become verifier
    uint256 public votingPeriod; // Time window for voting (e.g., 7 days)
    
    mapping(address => Verifier) public verifiers;
    mapping(uint256 => Claim) public claims;
    mapping(uint256 => mapping(address => Vote)) public votes; // claimId => verifier => vote
    
    uint256 private _nextClaimId;
    
    // ============ Structs ============
    
    struct Verifier {
        bool isActive;
        uint256 stake;
        uint256 reputation; // 0-1000, starts at 500
        uint256 totalVotes;
        uint256 correctVotes;
        uint256 stakedAt;
    }
    
    struct Claim {
        uint256 vaultId; // Reference to GuardiaVault
        address claimant; // Beneficiary claiming
        string claimReason; // Reason for claim (death, inactivity, etc.)
        uint256 createdAt;
        uint256 votingDeadline;
        uint256 approvalVotes;
        uint256 rejectionVotes;
        bool resolved;
        bool approved;
        address resolvedBy; // Final arbiter (if needed)
    }
    
    struct Vote {
        bool exists;
        bool approved; // true = approve claim, false = reject
        uint256 weight; // Vote weight based on reputation
        uint256 timestamp;
    }
    
    // ============ Events ============
    
    event VerifierRegistered(address indexed verifier, uint256 stake);
    event VerifierUnstaked(address indexed verifier, uint256 stake);
    event ClaimCreated(
        uint256 indexed claimId,
        uint256 indexed vaultId,
        address indexed claimant,
        string reason
    );
    event VoteCast(
        uint256 indexed claimId,
        address indexed verifier,
        bool approved,
        uint256 weight
    );
    event ClaimResolved(
        uint256 indexed claimId,
        bool approved,
        uint256 totalApprovalVotes,
        uint256 totalRejectionVotes
    );
    event ReputationUpdated(
        address indexed verifier,
        uint256 newReputation,
        bool increased
    );
    
    // ============ Custom Errors ============
    
    error InsufficientStake();
    error NotVerifier();
    error AlreadyVoted();
    error VotingClosed();
    error ClaimNotFound();
    error AlreadyResolved();
    error NotResolved();
    error InvalidReputation();
    
    // ============ Constructor ============
    
    constructor(address _stakingToken, uint256 _minimumStake, uint256 _votingPeriod) {
        stakingToken = IERC20(_stakingToken);
        minimumStake = _minimumStake;
        votingPeriod = _votingPeriod;
    }
    
    // ============ Verifier Functions ============
    
    /**
     * @notice Register as verifier by staking tokens
     * @param stakeAmount Amount to stake
     */
    function registerVerifier(uint256 stakeAmount) external nonReentrant {
        if (stakeAmount < minimumStake) revert InsufficientStake();
        
        // Transfer stake from user
        stakingToken.safeTransferFrom(msg.sender, address(this), stakeAmount);
        
        if (verifiers[msg.sender].isActive) {
            // Already a verifier, increase stake
            verifiers[msg.sender].stake += stakeAmount;
        } else {
            // New verifier
            verifiers[msg.sender] = Verifier({
                isActive: true,
                stake: stakeAmount,
                reputation: 500, // Start at neutral reputation
                totalVotes: 0,
                correctVotes: 0,
                stakedAt: block.timestamp
            });
        }
        
        emit VerifierRegistered(msg.sender, stakeAmount);
    }
    
    /**
     * @notice Unstake tokens and exit as verifier
     */
    function unstake() external nonReentrant {
        Verifier storage verifier = verifiers[msg.sender];
        if (!verifier.isActive) revert NotVerifier();
        
        uint256 stake = verifier.stake;
        verifier.isActive = false;
        verifier.stake = 0;
        
        // Transfer stake back
        stakingToken.safeTransfer(msg.sender, stake);
        
        emit VerifierUnstaked(msg.sender, stake);
    }
    
    // ============ Claim Functions ============
    
    /**
     * @notice Create a claim for vault access
     * @param vaultId The vault being claimed
     * @param reason Reason for claim
     */
    function createClaim(
        uint256 vaultId,
        string calldata reason
    ) external returns (uint256 claimId) {
        claimId = _nextClaimId++;
        
        claims[claimId] = Claim({
            vaultId: vaultId,
            claimant: msg.sender,
            claimReason: reason,
            createdAt: block.timestamp,
            votingDeadline: block.timestamp + votingPeriod,
            approvalVotes: 0,
            rejectionVotes: 0,
            resolved: false,
            approved: false,
            resolvedBy: address(0)
        });
        
        emit ClaimCreated(claimId, vaultId, msg.sender, reason);
    }
    
    /**
     * @notice Vote on a claim
     * @param claimId The claim to vote on
     * @param approved true to approve, false to reject
     */
    function vote(uint256 claimId, bool approved) external {
        Verifier storage verifier = verifiers[msg.sender];
        if (!verifier.isActive) revert NotVerifier();
        
        Claim storage claim = claims[claimId];
        if (claim.createdAt == 0) revert ClaimNotFound();
        if (claim.resolved) revert AlreadyResolved();
        if (block.timestamp > claim.votingDeadline) revert VotingClosed();
        if (votes[claimId][msg.sender].exists) revert AlreadyVoted();
        
        // Calculate vote weight based on reputation
        // Reputation ranges from 0-1000, weight is reputation / 10 (max 100)
        uint256 voteWeight = verifier.reputation / 10;
        
        votes[claimId][msg.sender] = Vote({
            exists: true,
            approved: approved,
            weight: voteWeight,
            timestamp: block.timestamp
        });
        
        if (approved) {
            claim.approvalVotes += voteWeight;
        } else {
            claim.rejectionVotes += voteWeight;
        }
        
        verifier.totalVotes++;
        
        emit VoteCast(claimId, msg.sender, approved, voteWeight);
        
        // Auto-resolve if clear majority reached (70% threshold)
        uint256 totalVotes = claim.approvalVotes + claim.rejectionVotes;
        if (totalVotes > 0) {
            uint256 approvalPercentage = (claim.approvalVotes * 10000) / totalVotes;
            if (approvalPercentage >= 7000 || approvalPercentage <= 3000) {
                // Clear majority (70%+ approval or 30%+ rejection)
                _resolveClaim(claimId);
            }
        }
    }
    
    /**
     * @notice Resolve claim after voting deadline
     * @param claimId The claim to resolve
     */
    function resolveClaim(uint256 claimId) external {
        Claim storage claim = claims[claimId];
        if (claim.createdAt == 0) revert ClaimNotFound();
        if (claim.resolved) revert AlreadyResolved();
        if (block.timestamp <= claim.votingDeadline) revert VotingClosed();
        
        _resolveClaim(claimId);
    }
    
    /**
     * @notice Internal function to resolve claim
     */
    function _resolveClaim(uint256 claimId) private {
        Claim storage claim = claims[claimId];
        claim.resolved = true;
        
        // Approve if approval votes > rejection votes
        claim.approved = claim.approvalVotes > claim.rejectionVotes;
        
        emit ClaimResolved(
            claimId,
            claim.approved,
            claim.approvalVotes,
            claim.rejectionVotes
        );
        
        // Update verifier reputations based on outcome
        _updateReputations(claimId, claim.approved);
    }
    
    /**
     * @notice Update verifier reputations after claim resolution
     */
    function _updateReputations(uint256 claimId, bool claimApproved) private {
        Claim storage claim = claims[claimId];
        
        // Find all voters and update their reputation
        // In production, you'd iterate through votes mapping
        // For MVP, this is simplified - actual implementation would track voters
        
        // Reputation changes:
        // +10 if vote matched outcome (correct)
        // -10 if vote didn't match outcome (incorrect)
        // Reputation capped at 0-1000
        
        // Note: Full implementation would require iterating all votes
        // This is a placeholder for the reputation update logic
    }
    
    /**
     * @notice Get claim details
     */
    function getClaim(uint256 claimId) external view returns (
        uint256 vaultId,
        address claimant,
        string memory reason,
        uint256 createdAt,
        uint256 votingDeadline,
        uint256 approvalVotes,
        uint256 rejectionVotes,
        bool resolved,
        bool approved
    ) {
        Claim storage claim = claims[claimId];
        return (
            claim.vaultId,
            claim.claimant,
            claim.claimReason,
            claim.createdAt,
            claim.votingDeadline,
            claim.approvalVotes,
            claim.rejectionVotes,
            claim.resolved,
            claim.approved
        );
    }
    
    /**
     * @notice Get verifier information
     */
    function getVerifier(address verifier) external view returns (
        bool isActive,
        uint256 stake,
        uint256 reputation,
        uint256 totalVotes,
        uint256 correctVotes
    ) {
        Verifier storage v = verifiers[verifier];
        return (
            v.isActive,
            v.stake,
            v.reputation,
            v.totalVotes,
            v.correctVotes
        );
    }
}

