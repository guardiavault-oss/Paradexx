// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title RecoveryFund
 * @notice Community insurance pool for Degen Recovery Fund
 * @dev Provides tiered coverage against rug pulls and scams
 */
contract RecoveryFund is Ownable, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Roles
    bytes32 public constant CLAIM_PROCESSOR_ROLE = keccak256("CLAIM_PROCESSOR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // Events
    event Subscribed(
        address indexed user,
        InsuranceTier tier,
        uint256 timestamp,
        uint256 expiresAt
    );
    event SubscriptionRenewed(
        address indexed user,
        InsuranceTier tier,
        uint256 newExpiresAt
    );
    event TradeFeeCollected(
        address indexed user,
        uint256 amount,
        uint256 tradeAmount
    );
    event ClaimSubmitted(
        uint256 indexed claimId,
        address indexed user,
        address indexed ruggedToken,
        uint256 lossAmount
    );
    event ClaimProcessed(
        uint256 indexed claimId,
        ClaimStatus status,
        uint256 payoutAmount
    );
    event ClaimPayout(
        uint256 indexed claimId,
        address indexed user,
        uint256 amount
    );
    event FundDeposit(
        address indexed depositor,
        uint256 amount
    );
    event TierUpdated(
        InsuranceTier tier,
        uint256 monthlyCost,
        uint256 tradeFeePercent,
        uint256 maxCoverage
    );

    // Enums
    enum InsuranceTier {
        NONE,
        BRONZE,     // $1K coverage - $5/month + 0.1% per trade
        SILVER,     // $5K coverage - $15/month + 0.2% per trade
        GOLD,       // $10K coverage - $50/month + 0.3% per trade
        PLATINUM    // $50K coverage - $200/month + 0.5% per trade
    }

    enum ClaimStatus {
        PENDING,
        UNDER_REVIEW,
        APPROVED,
        REJECTED,
        PAID,
        DISPUTED
    }

    // Structs
    struct TierConfig {
        uint256 monthlyCostWei;      // Monthly subscription cost in wei
        uint256 tradeFeePercent;     // Trade fee in basis points (100 = 1%)
        uint256 maxCoverageWei;      // Maximum coverage in wei
        uint256 coveragePercent;     // % of loss covered (usually 50%)
        uint256 cooldownPeriod;      // Cooldown between claims in seconds
        bool active;
    }

    struct Subscription {
        InsuranceTier tier;
        uint256 subscribedAt;
        uint256 expiresAt;
        uint256 totalPremiumsPaid;
        uint256 totalTradesFeesPaid;
        uint256 lastClaimTime;
        uint256 claimCount;
    }

    struct Claim {
        uint256 id;
        address user;
        address ruggedToken;
        uint256 lossAmount;
        uint256 requestedAmount;
        uint256 approvedAmount;
        ClaimStatus status;
        uint256 submittedAt;
        uint256 processedAt;
        string evidenceIpfsHash;
        string processorNotes;
        bool fraudDetected;
    }

    struct UserStats {
        uint256 totalClaimed;
        uint256 totalReceived;
        uint256 totalTradeVolume;
        uint256 lastTradeTime;
        uint256 fraudScore;
    }

    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant COVERAGE_PERCENT = 5000; // 50%
    uint256 public constant MIN_SUBSCRIPTION_PERIOD = 30 days;
    uint256 public constant CLAIM_REVIEW_PERIOD = 7 days;
    uint256 public constant MAX_CLAIMS_PER_YEAR = 3;

    // State variables
    uint256 public claimIdCounter;
    uint256 public totalFundBalance;
    uint256 public totalClaimsPaid;
    uint256 public totalPremiumsCollected;
    uint256 public totalTradeFeesCollected;
    
    // ETH pricing oracle (simplified - would use Chainlink in production)
    uint256 public ethPriceUsd = 2000 * 1e18; // $2000 per ETH

    // Mappings
    mapping(InsuranceTier => TierConfig) public tierConfigs;
    mapping(address => Subscription) public subscriptions;
    mapping(address => UserStats) public userStats;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) public userClaims;
    mapping(address => bool) public verifiedRuggedTokens;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(CLAIM_PROCESSOR_ROLE, msg.sender);
        _setupRole(VERIFIER_ROLE, msg.sender);

        // Initialize tier configurations
        _initializeTiers();
    }

    function _initializeTiers() internal {
        // Bronze: $1K coverage, $5/month, 0.1% per trade
        tierConfigs[InsuranceTier.BRONZE] = TierConfig({
            monthlyCostWei: 5 ether / uint256(ethPriceUsd / 1e18), // ~$5 in ETH
            tradeFeePercent: 10, // 0.1%
            maxCoverageWei: 1000 ether / uint256(ethPriceUsd / 1e18), // $1K
            coveragePercent: COVERAGE_PERCENT,
            cooldownPeriod: 30 days,
            active: true
        });

        // Silver: $5K coverage, $15/month, 0.2% per trade
        tierConfigs[InsuranceTier.SILVER] = TierConfig({
            monthlyCostWei: 15 ether / uint256(ethPriceUsd / 1e18),
            tradeFeePercent: 20, // 0.2%
            maxCoverageWei: 5000 ether / uint256(ethPriceUsd / 1e18),
            coveragePercent: COVERAGE_PERCENT,
            cooldownPeriod: 21 days,
            active: true
        });

        // Gold: $10K coverage, $50/month, 0.3% per trade
        tierConfigs[InsuranceTier.GOLD] = TierConfig({
            monthlyCostWei: 50 ether / uint256(ethPriceUsd / 1e18),
            tradeFeePercent: 30, // 0.3%
            maxCoverageWei: 10000 ether / uint256(ethPriceUsd / 1e18),
            coveragePercent: COVERAGE_PERCENT,
            cooldownPeriod: 14 days,
            active: true
        });

        // Platinum: $50K coverage, $200/month, 0.5% per trade
        tierConfigs[InsuranceTier.PLATINUM] = TierConfig({
            monthlyCostWei: 200 ether / uint256(ethPriceUsd / 1e18),
            tradeFeePercent: 50, // 0.5%
            maxCoverageWei: 50000 ether / uint256(ethPriceUsd / 1e18),
            coveragePercent: COVERAGE_PERCENT,
            cooldownPeriod: 7 days,
            active: true
        });
    }

    // ============================================================================
    // SUBSCRIPTION MANAGEMENT
    // ============================================================================

    /**
     * @notice Subscribe to an insurance tier
     * @param tier The tier to subscribe to
     */
    function subscribe(InsuranceTier tier) external payable nonReentrant whenNotPaused {
        require(tier != InsuranceTier.NONE, "Invalid tier");
        require(tierConfigs[tier].active, "Tier not active");
        
        TierConfig memory config = tierConfigs[tier];
        require(msg.value >= config.monthlyCostWei, "Insufficient payment");

        Subscription storage sub = subscriptions[msg.sender];
        
        // If existing subscription, must be expired or upgrading
        if (sub.tier != InsuranceTier.NONE && sub.expiresAt > block.timestamp) {
            require(tier > sub.tier, "Can only upgrade tier");
        }

        // Calculate actual payment amount (capped at subscription cost)
        uint256 actualPayment = msg.value > config.monthlyCostWei ? config.monthlyCostWei : msg.value;

        sub.tier = tier;
        sub.subscribedAt = block.timestamp;
        sub.expiresAt = block.timestamp + MIN_SUBSCRIPTION_PERIOD;
        sub.totalPremiumsPaid += actualPayment;

        totalPremiumsCollected += actualPayment;
        totalFundBalance += actualPayment;

        // Refund excess
        if (msg.value > config.monthlyCostWei) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - config.monthlyCostWei}("");
            require(success, "Refund failed");
        }

        emit Subscribed(msg.sender, tier, block.timestamp, sub.expiresAt);
    }

    /**
     * @notice Renew subscription
     */
    function renewSubscription() external payable nonReentrant whenNotPaused {
        Subscription storage sub = subscriptions[msg.sender];
        require(sub.tier != InsuranceTier.NONE, "No subscription");
        
        TierConfig memory config = tierConfigs[sub.tier];
        require(msg.value >= config.monthlyCostWei, "Insufficient payment");

        // Extend from current expiry or now if already expired
        uint256 extensionStart = sub.expiresAt > block.timestamp ? sub.expiresAt : block.timestamp;
        sub.expiresAt = extensionStart + MIN_SUBSCRIPTION_PERIOD;
        sub.totalPremiumsPaid += msg.value;

        totalPremiumsCollected += msg.value;
        totalFundBalance += msg.value;

        emit SubscriptionRenewed(msg.sender, sub.tier, sub.expiresAt);
    }

    /**
     * @notice Collect trade fee from user
     * @param tradeAmount The trade amount in wei
     */
    function collectTradeFee(uint256 tradeAmount) external payable nonReentrant whenNotPaused {
        Subscription memory sub = subscriptions[msg.sender];
        require(sub.tier != InsuranceTier.NONE, "No subscription");
        require(sub.expiresAt > block.timestamp, "Subscription expired");

        TierConfig memory config = tierConfigs[sub.tier];
        uint256 feeAmount = (tradeAmount * config.tradeFeePercent) / BASIS_POINTS;
        
        require(msg.value >= feeAmount, "Insufficient fee");

        subscriptions[msg.sender].totalTradesFeesPaid += feeAmount;
        userStats[msg.sender].totalTradeVolume += tradeAmount;
        userStats[msg.sender].lastTradeTime = block.timestamp;

        totalTradeFeesCollected += feeAmount;
        totalFundBalance += feeAmount;

        // Refund excess
        if (msg.value > feeAmount) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - feeAmount}("");
            require(success, "Refund failed");
        }

        emit TradeFeeCollected(msg.sender, feeAmount, tradeAmount);
    }

    // ============================================================================
    // CLAIM MANAGEMENT
    // ============================================================================

    /**
     * @notice Submit a claim for a rugged token
     * @param ruggedToken The address of the rugged token
     * @param lossAmount The amount lost in wei
     * @param evidenceIpfsHash IPFS hash of evidence documentation
     */
    function submitClaim(
        address ruggedToken,
        uint256 lossAmount,
        string calldata evidenceIpfsHash
    ) external nonReentrant whenNotPaused returns (uint256 claimId) {
        Subscription memory sub = subscriptions[msg.sender];
        require(sub.tier != InsuranceTier.NONE, "No subscription");
        require(sub.expiresAt > block.timestamp, "Subscription expired");

        TierConfig memory config = tierConfigs[sub.tier];

        // Check cooldown
        require(
            block.timestamp >= sub.lastClaimTime + config.cooldownPeriod,
            "Claim cooldown active"
        );

        // Check yearly claim limit
        require(
            _getClaimsThisYear(msg.sender) < MAX_CLAIMS_PER_YEAR,
            "Max yearly claims reached"
        );

        // Calculate requested amount (50% of loss, capped at tier max)
        uint256 requestedAmount = (lossAmount * config.coveragePercent) / BASIS_POINTS;
        if (requestedAmount > config.maxCoverageWei) {
            requestedAmount = config.maxCoverageWei;
        }

        // Check for potential fraud
        bool potentialFraud = _detectFraud(msg.sender, ruggedToken, lossAmount);

        claimIdCounter++;
        claimId = claimIdCounter;

        claims[claimId] = Claim({
            id: claimId,
            user: msg.sender,
            ruggedToken: ruggedToken,
            lossAmount: lossAmount,
            requestedAmount: requestedAmount,
            approvedAmount: 0,
            status: ClaimStatus.PENDING,
            submittedAt: block.timestamp,
            processedAt: 0,
            evidenceIpfsHash: evidenceIpfsHash,
            processorNotes: "",
            fraudDetected: potentialFraud
        });

        userClaims[msg.sender].push(claimId);
        subscriptions[msg.sender].claimCount++;

        emit ClaimSubmitted(claimId, msg.sender, ruggedToken, lossAmount);
    }

    /**
     * @notice Process a claim (for authorized processors only)
     * @param claimId The claim ID to process
     * @param approved Whether to approve the claim
     * @param approvedAmount The amount to approve (if approved)
     * @param notes Processor notes
     */
    function processClaim(
        uint256 claimId,
        bool approved,
        uint256 approvedAmount,
        string calldata notes
    ) external nonReentrant onlyRole(CLAIM_PROCESSOR_ROLE) {
        Claim storage claim = claims[claimId];
        require(claim.id == claimId && claimId > 0, "Invalid claim");
        require(
            claim.status == ClaimStatus.PENDING || claim.status == ClaimStatus.UNDER_REVIEW,
            "Claim not processable"
        );

        claim.processorNotes = notes;
        claim.processedAt = block.timestamp;

        if (approved) {
            require(approvedAmount <= claim.requestedAmount, "Amount exceeds requested");
            require(approvedAmount <= totalFundBalance, "Insufficient fund balance");
            
            claim.approvedAmount = approvedAmount;
            claim.status = ClaimStatus.APPROVED;
        } else {
            claim.status = ClaimStatus.REJECTED;
        }

        emit ClaimProcessed(claimId, claim.status, approvedAmount);
    }

    /**
     * @notice Distribute funds for an approved claim
     * @param claimId The claim ID to distribute funds for
     */
    function distributeFunds(uint256 claimId) external nonReentrant whenNotPaused {
        Claim storage claim = claims[claimId];
        require(claim.id == claimId && claimId > 0, "Invalid claim");
        require(claim.status == ClaimStatus.APPROVED, "Claim not approved");
        require(claim.approvedAmount > 0, "No approved amount");
        require(claim.approvedAmount <= totalFundBalance, "Insufficient funds");

        claim.status = ClaimStatus.PAID;
        totalFundBalance -= claim.approvedAmount;
        totalClaimsPaid += claim.approvedAmount;

        userStats[claim.user].totalClaimed += claim.lossAmount;
        userStats[claim.user].totalReceived += claim.approvedAmount;
        subscriptions[claim.user].lastClaimTime = block.timestamp;

        // Transfer funds to claimant
        (bool success, ) = payable(claim.user).call{value: claim.approvedAmount}("");
        require(success, "Transfer failed");

        emit ClaimPayout(claimId, claim.user, claim.approvedAmount);
    }

    /**
     * @notice Verify a token as rugged (for verifiers only)
     * @param token The token address to verify
     */
    function verifyRuggedToken(address token) external onlyRole(VERIFIER_ROLE) {
        verifiedRuggedTokens[token] = true;
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @notice Get user's subscription status
     */
    function getSubscription(address user) external view returns (
        InsuranceTier tier,
        bool isActive,
        uint256 expiresAt,
        uint256 totalPremiumsPaid,
        uint256 claimCount
    ) {
        Subscription memory sub = subscriptions[user];
        return (
            sub.tier,
            sub.expiresAt > block.timestamp,
            sub.expiresAt,
            sub.totalPremiumsPaid,
            sub.claimCount
        );
    }

    /**
     * @notice Get user's claims
     */
    function getUserClaims(address user) external view returns (Claim[] memory) {
        uint256[] memory claimIds = userClaims[user];
        Claim[] memory result = new Claim[](claimIds.length);
        
        for (uint256 i = 0; i < claimIds.length; i++) {
            result[i] = claims[claimIds[i]];
        }
        
        return result;
    }

    /**
     * @notice Get fund solvency metrics
     */
    function getSolvencyMetrics() external view returns (
        uint256 fundBalance,
        uint256 totalPremiums,
        uint256 totalTradeFees,
        uint256 totalPaid,
        uint256 solvencyRatio
    ) {
        fundBalance = totalFundBalance;
        totalPremiums = totalPremiumsCollected;
        totalTradeFees = totalTradeFeesCollected;
        totalPaid = totalClaimsPaid;
        
        // Solvency ratio = fund balance / total collected
        uint256 totalCollected = totalPremiums + totalTradeFees;
        solvencyRatio = totalCollected > 0 ? (fundBalance * BASIS_POINTS) / totalCollected : BASIS_POINTS;
    }

    /**
     * @notice Calculate estimated trade fee for amount
     */
    function calculateTradeFee(address user, uint256 tradeAmount) external view returns (uint256) {
        Subscription memory sub = subscriptions[user];
        if (sub.tier == InsuranceTier.NONE) return 0;
        
        TierConfig memory config = tierConfigs[sub.tier];
        return (tradeAmount * config.tradeFeePercent) / BASIS_POINTS;
    }

    /**
     * @notice Get tier configuration
     */
    function getTierConfig(InsuranceTier tier) external view returns (TierConfig memory) {
        return tierConfigs[tier];
    }

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================

    /**
     * @notice Deposit funds into the recovery pool
     */
    function depositFunds() external payable onlyRole(DEFAULT_ADMIN_ROLE) {
        require(msg.value > 0, "Must deposit > 0");
        totalFundBalance += msg.value;
        emit FundDeposit(msg.sender, msg.value);
    }

    /**
     * @notice Update tier configuration
     */
    function updateTierConfig(
        InsuranceTier tier,
        uint256 monthlyCostWei,
        uint256 tradeFeePercent,
        uint256 maxCoverageWei,
        uint256 cooldownPeriod,
        bool active
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tier != InsuranceTier.NONE, "Cannot update NONE tier");
        require(tradeFeePercent <= 100, "Fee too high"); // Max 1%
        
        tierConfigs[tier] = TierConfig({
            monthlyCostWei: monthlyCostWei,
            tradeFeePercent: tradeFeePercent,
            maxCoverageWei: maxCoverageWei,
            coveragePercent: COVERAGE_PERCENT,
            cooldownPeriod: cooldownPeriod,
            active: active
        });

        emit TierUpdated(tier, monthlyCostWei, tradeFeePercent, maxCoverageWei);
    }

    /**
     * @notice Update ETH price for tier calculations
     */
    function updateEthPrice(uint256 priceUsd) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(priceUsd > 0, "Invalid price");
        ethPriceUsd = priceUsd;
    }

    /**
     * @notice Emergency withdraw (owner only, for critical situations)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============================================================================
    // INTERNAL FUNCTIONS
    // ============================================================================

    /**
     * @notice Detect potential fraud patterns
     */
    function _detectFraud(
        address user,
        address token,
        uint256 amount
    ) internal view returns (bool) {
        UserStats memory stats = userStats[user];
        
        // Check if claim amount is suspiciously high relative to trade volume
        if (stats.totalTradeVolume > 0 && amount > stats.totalTradeVolume * 10) {
            return true;
        }
        
        // Check if user has high fraud score
        if (stats.fraudScore > 50) {
            return true;
        }
        
        // Check if trading just before claim
        if (block.timestamp - stats.lastTradeTime < 1 hours) {
            return true;
        }
        
        return false;
    }

    /**
     * @notice Get number of claims this year
     */
    function _getClaimsThisYear(address user) internal view returns (uint256) {
        uint256[] memory claimIds = userClaims[user];
        uint256 count = 0;
        uint256 yearAgo = block.timestamp - 365 days;
        
        for (uint256 i = 0; i < claimIds.length; i++) {
            if (claims[claimIds[i]].submittedAt >= yearAgo) {
                count++;
            }
        }
        
        return count;
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {
        totalFundBalance += msg.value;
        emit FundDeposit(msg.sender, msg.value);
    }
}
