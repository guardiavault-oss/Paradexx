// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SubscriptionEscrow
 * @dev Prepaid time-locked subscription escrow for GuardiaVault platform
 * @notice Users prepay for N months of service. Payments release monthly.
 * When vault triggers (death detected), subscription auto-extends 6 months.
 */
contract SubscriptionEscrow is ReentrancyGuard, Pausable {
    
    // ============ State Variables ============
    
    struct Subscription {
        address subscriber;
        uint256 monthlyRate;        // Monthly payment amount in wei
        uint256 prepaidMonths;      // Number of months prepaid
        uint256 monthsConsumed;     // Months already paid out
        uint256 lastPaymentTime;    // Timestamp of last monthly payment
        uint256 depositAmount;      // Total deposited amount
        bool active;
        bool vaultTriggered;        // Death detected flag
        uint256 triggerTime;        // When vault was triggered
    }
    
    mapping(address => Subscription) public subscriptions;
    address public platform;        // GuardiaVault platform address
    
    // ============ Constants ============
    
    uint256 public constant DEATH_EXTENSION_MONTHS = 6;
    uint256 public constant MONTH_DURATION = 30 days;
    uint256 public constant MIN_PREPAID_MONTHS = 1;
    uint256 public constant MAX_PREPAID_MONTHS = 24;
    
    // ============ Events ============
    
    event SubscriptionCreated(
        address indexed subscriber,
        uint256 monthlyRate,
        uint256 prepaidMonths,
        uint256 depositAmount
    );
    
    event PaymentReleased(
        address indexed subscriber,
        uint256 amount,
        uint256 monthNumber,
        uint256 timestamp
    );
    
    event VaultTriggered(
        address indexed subscriber,
        uint256 extensionMonths,
        uint256 triggerTime
    );
    
    event SubscriptionCancelled(
        address indexed subscriber,
        uint256 refundAmount,
        uint256 timestamp
    );
    
    event SubscriptionExtended(
        address indexed subscriber,
        uint256 additionalMonths,
        uint256 newTotalMonths
    );
    
    event PlatformUpdated(
        address indexed oldPlatform,
        address indexed newPlatform
    );
    
    // ============ Custom Errors ============
    
    error Unauthorized();
    error InvalidMonthlyRate();
    error InvalidPrepaidMonths();
    error InsufficientPayment();
    error SubscriptionAlreadyExists();
    error SubscriptionNotFound();
    error SubscriptionNotActive();
    error PaymentNotDue();
    error NoPaymentsAvailable();
    error VaultAlreadyTriggered();
    error InvalidPlatformAddress();
    error NoRefundAvailable();
    
    // ============ Modifiers ============
    
    modifier onlyPlatform() {
        if (msg.sender != platform) revert Unauthorized();
        _;
    }
    
    modifier subscriptionExists(address subscriber) {
        if (!subscriptions[subscriber].active && subscriptions[subscriber].subscriber == address(0)) {
            revert SubscriptionNotFound();
        }
        _;
    }
    
    // ============ Constructor ============
    
    /**
     * @notice Initialize the escrow contract
     * @param _platform Address that can mark vaults as triggered
     */
    constructor(address _platform) {
        if (_platform == address(0)) revert InvalidPlatformAddress();
        platform = _platform;
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Create a new prepaid subscription
     * @param monthlyRate Monthly payment amount in wei
     * @param prepaidMonths Number of months to prepay (1-24)
     * @dev Requires exact payment: monthlyRate * prepaidMonths
     */
    function createSubscription(
        uint256 monthlyRate,
        uint256 prepaidMonths
    ) external payable whenNotPaused nonReentrant {
        // Validate inputs
        if (monthlyRate == 0) revert InvalidMonthlyRate();
        if (prepaidMonths < MIN_PREPAID_MONTHS || prepaidMonths > MAX_PREPAID_MONTHS) {
            revert InvalidPrepaidMonths();
        }
        
        // Check subscription doesn't already exist
        if (subscriptions[msg.sender].active) revert SubscriptionAlreadyExists();
        
        // Calculate and validate payment
        uint256 requiredPayment = monthlyRate * prepaidMonths;
        if (msg.value != requiredPayment) revert InsufficientPayment();
        
        // Create subscription
        subscriptions[msg.sender] = Subscription({
            subscriber: msg.sender,
            monthlyRate: monthlyRate,
            prepaidMonths: prepaidMonths,
            monthsConsumed: 0,
            lastPaymentTime: block.timestamp,
            depositAmount: msg.value,
            active: true,
            vaultTriggered: false,
            triggerTime: 0
        });
        
        emit SubscriptionCreated(msg.sender, monthlyRate, prepaidMonths, msg.value);
    }
    
    /**
     * @notice Release monthly payment to platform
     * @param subscriber Address of the subscriber
     * @dev Can be called by anyone (Chainlink Keeper or manual)
     * Only releases if payment is due and funds available
     */
    function releaseMonthlyPayment(address subscriber)
        external
        whenNotPaused
        nonReentrant
        subscriptionExists(subscriber)
    {
        Subscription storage sub = subscriptions[subscriber];
        
        if (!sub.active) revert SubscriptionNotActive();
        
        // Check if payment is due (at least MONTH_DURATION has passed)
        if (block.timestamp < sub.lastPaymentTime + MONTH_DURATION) {
            revert PaymentNotDue();
        }
        
        // Calculate available months (prepaid + extension if triggered)
        uint256 totalAvailableMonths = sub.prepaidMonths;
        if (sub.vaultTriggered) {
            totalAvailableMonths += DEATH_EXTENSION_MONTHS;
        }
        
        // Check if payments are still available
        if (sub.monthsConsumed >= totalAvailableMonths) {
            revert NoPaymentsAvailable();
        }
        
        // Release payment
        sub.monthsConsumed++;
        sub.lastPaymentTime = block.timestamp;
        
        // Transfer payment to platform
        (bool success, ) = platform.call{value: sub.monthlyRate}("");
        require(success, "Payment transfer failed");
        
        emit PaymentReleased(subscriber, sub.monthlyRate, sub.monthsConsumed, block.timestamp);
        
        // Check if all payments have been consumed
        if (sub.monthsConsumed >= totalAvailableMonths) {
            sub.active = false;
        }
    }
    
    /**
     * @notice Mark vault as triggered (death detected) and extend subscription
     * @param subscriber Address of the subscriber whose vault triggered
     * @dev Only callable by platform. Auto-extends by DEATH_EXTENSION_MONTHS
     */
    function markVaultTriggered(address subscriber)
        external
        onlyPlatform
        subscriptionExists(subscriber)
    {
        Subscription storage sub = subscriptions[subscriber];
        
        if (!sub.active) revert SubscriptionNotActive();
        if (sub.vaultTriggered) revert VaultAlreadyTriggered();
        
        // Mark as triggered
        sub.vaultTriggered = true;
        sub.triggerTime = block.timestamp;
        
        emit VaultTriggered(subscriber, DEATH_EXTENSION_MONTHS, block.timestamp);
        emit SubscriptionExtended(
            subscriber,
            DEATH_EXTENSION_MONTHS,
            sub.prepaidMonths + DEATH_EXTENSION_MONTHS
        );
    }
    
    /**
     * @notice Cancel subscription and refund unused balance
     * @dev Calculates refund based on unconsumed months
     * If vault triggered, no refund for extension months
     */
    function cancelSubscription()
        external
        nonReentrant
        subscriptionExists(msg.sender)
    {
        Subscription storage sub = subscriptions[msg.sender];
        
        if (!sub.active) revert SubscriptionNotActive();
        
        // Calculate refund
        uint256 remainingMonths = 0;
        if (sub.monthsConsumed < sub.prepaidMonths) {
            remainingMonths = sub.prepaidMonths - sub.monthsConsumed;
        }
        
        uint256 refundAmount = remainingMonths * sub.monthlyRate;
        
        if (refundAmount == 0) revert NoRefundAvailable();
        
        // Mark as inactive
        sub.active = false;
        
        // Transfer refund
        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund transfer failed");
        
        emit SubscriptionCancelled(msg.sender, refundAmount, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get subscription details
     * @param subscriber Address to query
     * @return Subscription struct
     */
    function getSubscriptionStatus(address subscriber)
        external
        view
        returns (Subscription memory)
    {
        return subscriptions[subscriber];
    }
    
    /**
     * @notice Calculate remaining prepaid months
     * @param subscriber Address to query
     * @return Remaining months available for payment
     */
    function getRemainingMonths(address subscriber)
        external
        view
        subscriptionExists(subscriber)
        returns (uint256)
    {
        Subscription memory sub = subscriptions[subscriber];
        
        uint256 totalMonths = sub.prepaidMonths;
        if (sub.vaultTriggered) {
            totalMonths += DEATH_EXTENSION_MONTHS;
        }
        
        if (sub.monthsConsumed >= totalMonths) return 0;
        return totalMonths - sub.monthsConsumed;
    }
    
    /**
     * @notice Check if monthly payment can be released
     * @param subscriber Address to query
     * @return True if payment is due and available
     */
    function canReleasePayment(address subscriber)
        external
        view
        returns (bool)
    {
        Subscription memory sub = subscriptions[subscriber];
        
        if (!sub.active) return false;
        
        // Check if enough time has passed
        if (block.timestamp < sub.lastPaymentTime + MONTH_DURATION) {
            return false;
        }
        
        // Check if payments are available
        uint256 totalMonths = sub.prepaidMonths;
        if (sub.vaultTriggered) {
            totalMonths += DEATH_EXTENSION_MONTHS;
        }
        
        return sub.monthsConsumed < totalMonths;
    }
    
    /**
     * @notice Get time until next payment is due
     * @param subscriber Address to query
     * @return Seconds until next payment (0 if already due)
     */
    function getTimeUntilNextPayment(address subscriber)
        external
        view
        subscriptionExists(subscriber)
        returns (uint256)
    {
        Subscription memory sub = subscriptions[subscriber];
        
        uint256 nextPaymentTime = sub.lastPaymentTime + MONTH_DURATION;
        
        if (block.timestamp >= nextPaymentTime) return 0;
        return nextPaymentTime - block.timestamp;
    }
    
    /**
     * @notice Get total months available (including extension)
     * @param subscriber Address to query
     * @return Total months available for this subscription
     */
    function getTotalAvailableMonths(address subscriber)
        external
        view
        subscriptionExists(subscriber)
        returns (uint256)
    {
        Subscription memory sub = subscriptions[subscriber];
        
        uint256 total = sub.prepaidMonths;
        if (sub.vaultTriggered) {
            total += DEATH_EXTENSION_MONTHS;
        }
        
        return total;
    }
    
    /**
     * @notice Check if subscription is active
     * @param subscriber Address to query
     * @return True if subscription exists and is active
     */
    function isSubscriptionActive(address subscriber)
        external
        view
        returns (bool)
    {
        return subscriptions[subscriber].active;
    }
    
    /**
     * @notice Get refund amount if subscription was cancelled now
     * @param subscriber Address to query
     * @return Refund amount in wei
     */
    function getRefundAmount(address subscriber)
        external
        view
        subscriptionExists(subscriber)
        returns (uint256)
    {
        Subscription memory sub = subscriptions[subscriber];
        
        if (!sub.active) return 0;
        
        uint256 remainingMonths = 0;
        if (sub.monthsConsumed < sub.prepaidMonths) {
            remainingMonths = sub.prepaidMonths - sub.monthsConsumed;
        }
        
        return remainingMonths * sub.monthlyRate;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update platform address
     * @param newPlatform New platform address
     * @dev Only callable by current platform
     */
    function updatePlatform(address newPlatform) external onlyPlatform {
        if (newPlatform == address(0)) revert InvalidPlatformAddress();
        
        address oldPlatform = platform;
        platform = newPlatform;
        
        emit PlatformUpdated(oldPlatform, newPlatform);
    }
    
    /**
     * @notice Pause contract (emergency use)
     * @dev Only callable by platform
     */
    function pause() external onlyPlatform {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     * @dev Only callable by platform
     */
    function unpause() external onlyPlatform {
        _unpause();
    }
    
    /**
     * @notice Get contract balance
     * @return Contract balance in wei
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
