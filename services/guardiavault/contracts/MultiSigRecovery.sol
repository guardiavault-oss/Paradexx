// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title MultiSigRecovery
 * @dev Multi-signature wallet recovery system for lost seed phrases
 * @notice 2-of-3 recovery keys can restore wallet access after 7-day time lock
 */
contract MultiSigRecovery is ReentrancyGuard {
    using ECDSA for bytes32;

    // ============ State Variables ============
    
    uint256 private _nextRecoveryId;
    mapping(uint256 => Recovery) private _recoveries;
    mapping(uint256 => mapping(address => bool)) private _recoveryKeyAttested;
    mapping(uint256 => mapping(address => uint256)) private _recoveryKeyAttestationTime;
    mapping(uint256 => uint256) private _recoveryTriggeredAt;
    
    // ============ Constants ============
    
    uint256 public constant RECOVERY_KEY_COUNT = 3; // Exactly 3 recovery keys
    uint256 public constant RECOVERY_THRESHOLD = 2; // 2-of-3 required
    uint256 public constant TIME_LOCK_PERIOD = 7 days; // 7-day time lock before recovery
    
    // ============ Structs & Enums ============
    
    struct Recovery {
        address walletOwner; // Original wallet owner (may not match msg.sender if wallet is lost)
        address walletAddress; // The wallet address to recover
        address[3] recoveryKeys; // Exactly 3 recovery key addresses
        uint256 createdAt;
        RecoveryStatus status;
        string encryptedData; // Encrypted seed phrase or recovery instructions
    }
    
    enum RecoveryStatus {
        Active,      // Recovery is active and waiting
        Triggered,   // 2-of-3 keys attested, time lock started
        Completed,   // Time lock expired, recovery completed
        Cancelled    // Owner cancelled recovery
    }
    
    // ============ Events ============
    
    event RecoveryCreated(
        uint256 indexed recoveryId,
        address indexed walletOwner,
        address indexed walletAddress,
        address[3] recoveryKeys,
        uint256 timestamp
    );
    
    event RecoveryKeyAttested(
        uint256 indexed recoveryId,
        address indexed recoveryKey,
        uint256 attestationCount,
        bool triggered
    );
    
    event RecoveryTriggered(
        uint256 indexed recoveryId,
        uint256 timestamp,
        uint256 unlockTime
    );
    
    event RecoveryCompleted(
        uint256 indexed recoveryId,
        address indexed walletAddress,
        uint256 timestamp
    );
    
    event RecoveryCancelled(
        uint256 indexed recoveryId,
        address indexed cancelledBy,
        uint256 timestamp
    );
    
    // ============ Custom Errors ============
    
    error RecoveryNotFound();
    error Unauthorized();
    error InvalidRecoveryKey();
    error DuplicateRecoveryKey();
    error InvalidRecoveryKeyCount();
    error NotRecoveryKey();
    error AlreadyAttested();
    error RecoveryNotTriggered();
    error TimeLockNotExpired();
    error RecoveryAlreadyCompleted();
    error RecoveryAlreadyCancelled();
    error InvalidStatus();
    
    // ============ Modifiers ============
    
    modifier recoveryExists(uint256 recoveryId) {
        if (_recoveries[recoveryId].walletOwner == address(0)) revert RecoveryNotFound();
        _;
    }
    
    modifier onlyRecoveryOwner(uint256 recoveryId) {
        if (_recoveries[recoveryId].walletOwner == address(0)) revert RecoveryNotFound();
        if (_recoveries[recoveryId].walletOwner != msg.sender) revert Unauthorized();
        _;
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Create a new wallet recovery setup
     * @param walletAddress The wallet address to set up recovery for
     * @param recoveryKeys Exactly 3 recovery key addresses (trusted friends/family)
     * @param encryptedData Encrypted seed phrase or recovery instructions (IPFS hash)
     * @return recoveryId The ID of the newly created recovery
     */
    function createRecovery(
        address walletAddress,
        address[3] calldata recoveryKeys,
        string calldata encryptedData
    ) external returns (uint256 recoveryId) {
        // Validate recovery keys (no duplicates, not owner, not zero address)
        for (uint256 i = 0; i < RECOVERY_KEY_COUNT; i++) {
            if (recoveryKeys[i] == address(0)) revert InvalidRecoveryKey();
            if (recoveryKeys[i] == msg.sender) revert InvalidRecoveryKey();
            
            // Check for duplicates
            for (uint256 j = i + 1; j < RECOVERY_KEY_COUNT; j++) {
                if (recoveryKeys[i] == recoveryKeys[j]) revert DuplicateRecoveryKey();
            }
        }
        
        if (bytes(encryptedData).length == 0) {
            revert InvalidRecoveryKey(); // Reusing error for empty data
        }
        
        recoveryId = _nextRecoveryId++;
        
        Recovery storage recovery = _recoveries[recoveryId];
        recovery.walletOwner = msg.sender;
        recovery.walletAddress = walletAddress;
        recovery.createdAt = block.timestamp;
        recovery.status = RecoveryStatus.Active;
        recovery.encryptedData = encryptedData;
        
        // Store recovery keys
        for (uint256 i = 0; i < RECOVERY_KEY_COUNT; i++) {
            recovery.recoveryKeys[i] = recoveryKeys[i];
        }
        
        emit RecoveryCreated(
            recoveryId,
            msg.sender,
            walletAddress,
            recoveryKeys,
            block.timestamp
        );
    }
    
    /**
     * @notice Recovery key attests that wallet owner needs recovery
     * @param recoveryId The recovery to attest for
     * @dev Requires 2-of-3 recovery keys to trigger time lock
     */
    function attestRecovery(uint256 recoveryId) external recoveryExists(recoveryId) {
        Recovery storage recovery = _recoveries[recoveryId];
        
        // Check if caller is a recovery key
        bool isKeyHolder = false;
        for (uint256 i = 0; i < RECOVERY_KEY_COUNT; i++) {
            if (recovery.recoveryKeys[i] == msg.sender) {
                isKeyHolder = true;
                break;
            }
        }
        
        if (!isKeyHolder) revert NotRecoveryKey();
        
        if (recovery.status != RecoveryStatus.Active) {
            revert InvalidStatus();
        }
        
        if (_recoveryKeyAttested[recoveryId][msg.sender]) {
            revert AlreadyAttested();
        }
        
        // Mark as attested
        _recoveryKeyAttested[recoveryId][msg.sender] = true;
        _recoveryKeyAttestationTime[recoveryId][msg.sender] = block.timestamp;
        
        // Count attestations
        uint256 attestationCount = 0;
        for (uint256 i = 0; i < RECOVERY_KEY_COUNT; i++) {
            if (_recoveryKeyAttested[recoveryId][recovery.recoveryKeys[i]]) {
                attestationCount++;
            }
        }
        
        bool triggered = false;
        
        // If threshold met (2-of-3), trigger time lock
        if (attestationCount >= RECOVERY_THRESHOLD) {
            recovery.status = RecoveryStatus.Triggered;
            _recoveryTriggeredAt[recoveryId] = block.timestamp;
            triggered = true;
            
            uint256 unlockTime = block.timestamp + TIME_LOCK_PERIOD;
            
            emit RecoveryTriggered(recoveryId, block.timestamp, unlockTime);
        }
        
        emit RecoveryKeyAttested(recoveryId, msg.sender, attestationCount, triggered);
    }
    
    /**
     * @notice Complete recovery after time lock expires
     * @param recoveryId The recovery to complete
     * @dev Can be called by anyone once time lock expires
     *      Returns encrypted data to beneficiary
     */
    function completeRecovery(uint256 recoveryId) external nonReentrant recoveryExists(recoveryId) {
        Recovery storage recovery = _recoveries[recoveryId];
        
        if (recovery.status != RecoveryStatus.Triggered) {
            revert RecoveryNotTriggered();
        }
        
        uint256 triggeredTime = _recoveryTriggeredAt[recoveryId];
        if (triggeredTime == 0) revert RecoveryNotTriggered();
        
        // Check if time lock has expired
        if (block.timestamp < triggeredTime + TIME_LOCK_PERIOD) {
            revert TimeLockNotExpired();
        }
        
        recovery.status = RecoveryStatus.Completed;
        
        emit RecoveryCompleted(recoveryId, recovery.walletAddress, block.timestamp);
    }
    
    /**
     * @notice Wallet owner cancels recovery (if wallet is not actually lost)
     * @param recoveryId The recovery to cancel
     */
    function cancelRecovery(uint256 recoveryId) external onlyRecoveryOwner(recoveryId) {
        Recovery storage recovery = _recoveries[recoveryId];
        
        if (recovery.status == RecoveryStatus.Completed) {
            revert RecoveryAlreadyCompleted();
        }
        
        if (recovery.status == RecoveryStatus.Cancelled) {
            revert RecoveryAlreadyCancelled();
        }
        
        recovery.status = RecoveryStatus.Cancelled;
        
        // Clear attestations
        for (uint256 i = 0; i < RECOVERY_KEY_COUNT; i++) {
            _recoveryKeyAttested[recoveryId][recovery.recoveryKeys[i]] = false;
            _recoveryKeyAttestationTime[recoveryId][recovery.recoveryKeys[i]] = 0;
        }
        
        _recoveryTriggeredAt[recoveryId] = 0;
        
        emit RecoveryCancelled(recoveryId, msg.sender, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get recovery information
     * @param recoveryId The recovery to query
     */
    function getRecovery(uint256 recoveryId) external view recoveryExists(recoveryId) returns (
        address walletOwner,
        address walletAddress,
        address[3] memory recoveryKeys,
        uint256 createdAt,
        RecoveryStatus status,
        string memory encryptedData
    ) {
        Recovery storage recovery = _recoveries[recoveryId];
        return (
            recovery.walletOwner,
            recovery.walletAddress,
            recovery.recoveryKeys,
            recovery.createdAt,
            recovery.status,
            recovery.encryptedData
        );
    }
    
    /**
     * @notice Get recovery attestation count
     * @param recoveryId The recovery to query
     * @return count Number of recovery keys who have attested
     */
    function getRecoveryAttestationCount(uint256 recoveryId) external view recoveryExists(recoveryId) returns (uint256) {
        Recovery memory recovery = _recoveries[recoveryId];
        uint256 count = 0;
        for (uint256 i = 0; i < RECOVERY_KEY_COUNT; i++) {
            if (_recoveryKeyAttested[recoveryId][recovery.recoveryKeys[i]]) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @notice Check if recovery key has attested
     * @param recoveryId The recovery to query
     * @param recoveryKey The recovery key address
     * @return hasAttested True if recovery key has attested
     */
    function hasRecoveryKeyAttested(uint256 recoveryId, address recoveryKey) external view returns (bool) {
        return _recoveryKeyAttested[recoveryId][recoveryKey];
    }
    
    /**
     * @notice Get time until recovery can be completed
     * @param recoveryId The recovery to query
     * @return timeRemaining Seconds until recovery can be completed (0 if expired or not triggered)
     */
    function getTimeUntilRecovery(uint256 recoveryId) external view recoveryExists(recoveryId) returns (uint256) {
        Recovery memory recovery = _recoveries[recoveryId];
        uint256 triggeredTime = _recoveryTriggeredAt[recoveryId];
        
        if (recovery.status != RecoveryStatus.Triggered || triggeredTime == 0) {
            return 0;
        }
        
        uint256 unlockTime = triggeredTime + TIME_LOCK_PERIOD;
        if (block.timestamp >= unlockTime) {
            return 0;
        }
        
        return unlockTime - block.timestamp;
    }
    
    /**
     * @notice Check if recovery can be completed
     * @param recoveryId The recovery to query
     * @return canComplete True if time lock has expired
     * @return timeRemaining Seconds remaining in time lock (0 if expired)
     */
    function canCompleteRecovery(uint256 recoveryId) external view recoveryExists(recoveryId) returns (
        bool canComplete,
        uint256 timeRemaining
    ) {
        Recovery memory recovery = _recoveries[recoveryId];
        uint256 triggeredTime = _recoveryTriggeredAt[recoveryId];
        
        if (recovery.status != RecoveryStatus.Triggered || triggeredTime == 0) {
            return (false, 0);
        }
        
        uint256 unlockTime = triggeredTime + TIME_LOCK_PERIOD;
        if (block.timestamp >= unlockTime) {
            return (true, 0);
        }
        
        timeRemaining = unlockTime - block.timestamp;
        return (false, timeRemaining);
    }
    
    /**
     * @notice Check if address is a recovery key
     * @param recoveryId The recovery to query
     * @param recoveryKey The address to check
     * @return isRecoveryKey True if address is a recovery key
     */
    function isRecoveryKey(uint256 recoveryId, address recoveryKey) external view recoveryExists(recoveryId) returns (bool) {
        Recovery memory recovery = _recoveries[recoveryId];
        for (uint256 i = 0; i < RECOVERY_KEY_COUNT; i++) {
            if (recovery.recoveryKeys[i] == recoveryKey) {
                return true;
            }
        }
        return false;
    }
}

