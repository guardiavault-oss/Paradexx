// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title GainsLock
 * @notice Automatic profit-taking vault that locks profits based on user-configured rules
 * @dev Part of the DualGen Degen Mode features for protecting gains
 */
contract GainsLock is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Events
    event LockCreated(
        uint256 indexed lockId,
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 unlockTime,
        LockDuration duration
    );
    event LockWithdrawn(
        uint256 indexed lockId,
        address indexed user,
        uint256 amount
    );
    event EmergencyUnlock(
        uint256 indexed lockId,
        address indexed user,
        uint256 amount,
        uint256 penalty
    );
    event LockRuleSet(
        address indexed user,
        uint256 profitThresholdMultiplier,
        uint256 lockPercentage,
        LockDuration duration
    );
    event RoutedToBlueService(
        uint256 indexed lockId,
        address indexed user,
        BlueService service,
        uint256 amount
    );
    event TreasuryUpdated(address indexed newTreasury);
    event EmergencyPenaltyUpdated(uint256 newPenalty);

    // Enums
    enum LockDuration {
        SEVEN_DAYS,     // 7 days
        THIRTY_DAYS,    // 30 days
        NINETY_DAYS     // 90 days
    }

    enum BlueService {
        INHERITANCE_VAULT,  // Route to GuardianX inheritance
        STAKING,            // Route to staking/yield
        CONSERVATIVE_DEFI   // Route to conservative DeFi positions
    }

    // Structs
    struct Lock {
        uint256 id;
        address user;
        address token;
        uint256 amount;
        uint256 lockedAt;
        uint256 unlockTime;
        LockDuration duration;
        bool withdrawn;
        bool emergencyUnlocked;
        bool routedToBlue;
        BlueService blueService;
    }

    struct LockRule {
        uint256 profitThresholdMultiplier; // e.g., 500 = 5x, 1000 = 10x, 2000 = 20x (basis points)
        uint256 lockPercentage;            // Percentage of profits to lock (basis points, 100 = 1%)
        LockDuration duration;             // Lock duration for this rule
        bool enabled;
    }

    struct UserStats {
        uint256 totalLocked;
        uint256 totalWithdrawn;
        uint256 totalPenaltiesPaid;
        uint256 activeLockCount;
        uint256 totalRoutedToBlue;
    }

    // Constants
    uint256 public constant DURATION_7_DAYS = 7 days;
    uint256 public constant DURATION_30_DAYS = 30 days;
    uint256 public constant DURATION_90_DAYS = 90 days;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_EMERGENCY_PENALTY = 2000; // Max 20%

    // State variables
    uint256 public lockIdCounter;
    uint256 public emergencyPenaltyBps = 1000; // 10% default penalty
    address public treasury;

    // Mappings
    mapping(uint256 => Lock) public locks;
    mapping(address => uint256[]) public userLocks;
    mapping(address => LockRule[]) public userRules;
    mapping(address => UserStats) public userStats;
    mapping(address => bool) public supportedTokens;

    // Blue service addresses
    address public inheritanceVault;
    address public stakingContract;
    address public conservativeDefiVault;

    // Modifiers
    modifier onlyLockOwner(uint256 lockId) {
        require(locks[lockId].user == msg.sender, "Not lock owner");
        _;
    }

    modifier lockExists(uint256 lockId) {
        require(locks[lockId].id == lockId && lockId > 0, "Lock does not exist");
        _;
    }

    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    // ============================================================================
    // LOCK MANAGEMENT
    // ============================================================================

    /**
     * @notice Lock ERC20 token profits for a specified duration
     * @param token The token to lock (must not be address(0))
     * @param amount The amount to lock
     * @param duration The lock duration
     */
    function lockProfits(
        address token,
        uint256 amount,
        LockDuration duration
    ) external nonReentrant whenNotPaused returns (uint256 lockId) {
        require(amount > 0, "Amount must be > 0");
        require(token != address(0), "Use lockETHProfits for ETH");
        require(supportedTokens[token], "Token not supported");

        // Transfer tokens from user
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Calculate unlock time
        uint256 unlockTime = block.timestamp + _getDurationSeconds(duration);

        // Create lock
        lockIdCounter++;
        lockId = lockIdCounter;

        locks[lockId] = Lock({
            id: lockId,
            user: msg.sender,
            token: token,
            amount: amount,
            lockedAt: block.timestamp,
            unlockTime: unlockTime,
            duration: duration,
            withdrawn: false,
            emergencyUnlocked: false,
            routedToBlue: false,
            blueService: BlueService.INHERITANCE_VAULT
        });

        userLocks[msg.sender].push(lockId);
        userStats[msg.sender].totalLocked += amount;
        userStats[msg.sender].activeLockCount++;

        emit LockCreated(lockId, msg.sender, token, amount, unlockTime, duration);
    }

    /**
     * @notice Lock ETH profits
     */
    function lockETHProfits(LockDuration duration) external payable nonReentrant whenNotPaused returns (uint256) {
        require(msg.value > 0, "Amount must be > 0");
        return _lockETH(msg.sender, msg.value, duration);
    }

    /**
     * @notice Withdraw unlocked funds
     * @param lockId The lock ID to withdraw
     */
    function withdraw(uint256 lockId) 
        external 
        nonReentrant 
        whenNotPaused
        lockExists(lockId)
        onlyLockOwner(lockId)
    {
        Lock storage lock = locks[lockId];
        
        require(!lock.withdrawn, "Already withdrawn");
        require(!lock.routedToBlue, "Routed to Blue service");
        require(block.timestamp >= lock.unlockTime, "Lock not expired");

        lock.withdrawn = true;
        userStats[msg.sender].totalWithdrawn += lock.amount;
        userStats[msg.sender].activeLockCount--;

        // Transfer funds back to user
        if (lock.token == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: lock.amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(lock.token).safeTransfer(msg.sender, lock.amount);
        }

        emit LockWithdrawn(lockId, msg.sender, lock.amount);
    }

    /**
     * @notice Emergency unlock with penalty (10% fee)
     * @param lockId The lock ID to emergency unlock
     */
    function emergencyUnlock(uint256 lockId) 
        external 
        nonReentrant 
        whenNotPaused
        lockExists(lockId)
        onlyLockOwner(lockId)
    {
        Lock storage lock = locks[lockId];
        
        require(!lock.withdrawn, "Already withdrawn");
        require(!lock.emergencyUnlocked, "Already emergency unlocked");
        require(!lock.routedToBlue, "Routed to Blue service");
        require(block.timestamp < lock.unlockTime, "Use regular withdraw");

        // Calculate penalty
        uint256 penalty = (lock.amount * emergencyPenaltyBps) / BASIS_POINTS;
        uint256 userAmount = lock.amount - penalty;

        lock.emergencyUnlocked = true;
        lock.withdrawn = true;
        userStats[msg.sender].totalPenaltiesPaid += penalty;
        userStats[msg.sender].activeLockCount--;

        // Transfer penalty to treasury
        if (lock.token == address(0)) {
            (bool treasurySuccess, ) = payable(treasury).call{value: penalty}("");
            require(treasurySuccess, "Treasury ETH transfer failed");
            (bool userSuccess, ) = payable(msg.sender).call{value: userAmount}("");
            require(userSuccess, "User ETH transfer failed");
        } else {
            IERC20(lock.token).safeTransfer(treasury, penalty);
            IERC20(lock.token).safeTransfer(msg.sender, userAmount);
        }

        emit EmergencyUnlock(lockId, msg.sender, userAmount, penalty);
    }

    /**
     * @notice Route locked funds to Blue side services
     * @param lockId The lock ID to route
     * @param service The Blue service to route to
     */
    function routeToBlueServices(uint256 lockId, BlueService service) 
        external 
        nonReentrant 
        whenNotPaused
        lockExists(lockId)
        onlyLockOwner(lockId)
    {
        Lock storage lock = locks[lockId];
        
        require(!lock.withdrawn, "Already withdrawn");
        require(!lock.routedToBlue, "Already routed");
        require(block.timestamp >= lock.unlockTime, "Lock not expired");

        address serviceAddress;
        if (service == BlueService.INHERITANCE_VAULT) {
            require(inheritanceVault != address(0), "Inheritance vault not set");
            serviceAddress = inheritanceVault;
        } else if (service == BlueService.STAKING) {
            require(stakingContract != address(0), "Staking contract not set");
            serviceAddress = stakingContract;
        } else if (service == BlueService.CONSERVATIVE_DEFI) {
            require(conservativeDefiVault != address(0), "DeFi vault not set");
            serviceAddress = conservativeDefiVault;
        }

        lock.routedToBlue = true;
        lock.blueService = service;
        userStats[msg.sender].totalRoutedToBlue += lock.amount;
        userStats[msg.sender].activeLockCount--;

        // Transfer to Blue service
        if (lock.token == address(0)) {
            (bool success, ) = payable(serviceAddress).call{value: lock.amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(lock.token).safeTransfer(serviceAddress, lock.amount);
        }

        emit RoutedToBlueService(lockId, msg.sender, service, lock.amount);
    }

    // ============================================================================
    // LOCK RULES MANAGEMENT
    // ============================================================================

    /**
     * @notice Set automated lock rules for profit taking
     * @param profitThresholdMultiplier The profit multiplier threshold (e.g., 500 = 5x)
     * @param lockPercentage The percentage of profits to lock (basis points)
     * @param duration The lock duration
     */
    function setLockRule(
        uint256 profitThresholdMultiplier,
        uint256 lockPercentage,
        LockDuration duration
    ) external {
        require(profitThresholdMultiplier > 0, "Invalid multiplier");
        require(lockPercentage > 0 && lockPercentage <= BASIS_POINTS, "Invalid percentage");

        LockRule memory newRule = LockRule({
            profitThresholdMultiplier: profitThresholdMultiplier,
            lockPercentage: lockPercentage,
            duration: duration,
            enabled: true
        });

        userRules[msg.sender].push(newRule);

        emit LockRuleSet(msg.sender, profitThresholdMultiplier, lockPercentage, duration);
    }

    /**
     * @notice Enable or disable a lock rule
     * @param ruleIndex The index of the rule to toggle
     * @param enabled Whether the rule should be enabled
     */
    function toggleRule(uint256 ruleIndex, bool enabled) external {
        require(ruleIndex < userRules[msg.sender].length, "Invalid rule index");
        userRules[msg.sender][ruleIndex].enabled = enabled;
    }

    /**
     * @notice Remove a lock rule
     * @param ruleIndex The index of the rule to remove
     */
    function removeRule(uint256 ruleIndex) external {
        require(ruleIndex < userRules[msg.sender].length, "Invalid rule index");
        
        // Move last element to deleted position and pop
        uint256 lastIndex = userRules[msg.sender].length - 1;
        if (ruleIndex != lastIndex) {
            userRules[msg.sender][ruleIndex] = userRules[msg.sender][lastIndex];
        }
        userRules[msg.sender].pop();
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @notice Get all locks for a user
     */
    function getUserLocks(address user) external view returns (Lock[] memory) {
        uint256[] memory lockIds = userLocks[user];
        Lock[] memory result = new Lock[](lockIds.length);
        
        for (uint256 i = 0; i < lockIds.length; i++) {
            result[i] = locks[lockIds[i]];
        }
        
        return result;
    }

    /**
     * @notice Get active (unlocked) locks for a user
     */
    function getActiveLocks(address user) external view returns (Lock[] memory) {
        uint256[] memory lockIds = userLocks[user];
        uint256 activeCount = 0;
        
        // Count active locks
        for (uint256 i = 0; i < lockIds.length; i++) {
            Lock memory lock = locks[lockIds[i]];
            if (!lock.withdrawn && !lock.routedToBlue) {
                activeCount++;
            }
        }
        
        // Build result array
        Lock[] memory result = new Lock[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < lockIds.length; i++) {
            Lock memory lock = locks[lockIds[i]];
            if (!lock.withdrawn && !lock.routedToBlue) {
                result[index] = lock;
                index++;
            }
        }
        
        return result;
    }

    /**
     * @notice Get all lock rules for a user
     */
    function getUserRules(address user) external view returns (LockRule[] memory) {
        return userRules[user];
    }

    /**
     * @notice Calculate total locked value for a user
     */
    function calculateTotalLocked(address user) external view returns (uint256 total) {
        uint256[] memory lockIds = userLocks[user];
        
        for (uint256 i = 0; i < lockIds.length; i++) {
            Lock memory lock = locks[lockIds[i]];
            if (!lock.withdrawn && !lock.routedToBlue) {
                total += lock.amount;
            }
        }
    }

    /**
     * @notice Get time remaining until unlock
     */
    function getTimeRemaining(uint256 lockId) external view lockExists(lockId) returns (uint256) {
        Lock memory lock = locks[lockId];
        if (block.timestamp >= lock.unlockTime) {
            return 0;
        }
        return lock.unlockTime - block.timestamp;
    }

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================

    /**
     * @notice Add supported token
     */
    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }

    /**
     * @notice Remove supported token
     */
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }

    /**
     * @notice Update treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    /**
     * @notice Update emergency unlock penalty
     */
    function setEmergencyPenalty(uint256 _penaltyBps) external onlyOwner {
        require(_penaltyBps <= MAX_EMERGENCY_PENALTY, "Penalty too high");
        emergencyPenaltyBps = _penaltyBps;
        emit EmergencyPenaltyUpdated(_penaltyBps);
    }

    /**
     * @notice Set Blue service addresses
     */
    function setBlueServiceAddresses(
        address _inheritanceVault,
        address _stakingContract,
        address _conservativeDefiVault
    ) external onlyOwner {
        inheritanceVault = _inheritanceVault;
        stakingContract = _stakingContract;
        conservativeDefiVault = _conservativeDefiVault;
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

    function _getDurationSeconds(LockDuration duration) internal pure returns (uint256) {
        if (duration == LockDuration.SEVEN_DAYS) {
            return DURATION_7_DAYS;
        } else if (duration == LockDuration.THIRTY_DAYS) {
            return DURATION_30_DAYS;
        } else {
            return DURATION_90_DAYS;
        }
    }

    function _lockETH(
        address user,
        uint256 amount,
        LockDuration duration
    ) internal returns (uint256 lockId) {
        uint256 unlockTime = block.timestamp + _getDurationSeconds(duration);

        lockIdCounter++;
        lockId = lockIdCounter;

        locks[lockId] = Lock({
            id: lockId,
            user: user,
            token: address(0),
            amount: amount,
            lockedAt: block.timestamp,
            unlockTime: unlockTime,
            duration: duration,
            withdrawn: false,
            emergencyUnlocked: false,
            routedToBlue: false,
            blueService: BlueService.INHERITANCE_VAULT
        });

        userLocks[user].push(lockId);
        userStats[user].totalLocked += amount;
        userStats[user].activeLockCount++;

        emit LockCreated(lockId, user, address(0), amount, unlockTime, duration);
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}
