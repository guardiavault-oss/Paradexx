// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IYieldVault
 * @notice Interface for YieldVault integration
 */
interface IYieldVault {
    function triggerVault(uint256 vaultId, address beneficiary) external returns (uint256);
    function getYieldVaultForGuardiaVault(uint256 guardiaVaultId) external view returns (uint256);
}

/**
 * @title GuardiaVault
 * @dev Simplified dead man's switch vault system for secure inheritance
 * @notice Streamlined version: 2-of-3 guardian attestation + time-based backup
 */
contract GuardiaVault is ReentrancyGuard {
    
    // ============ State Variables ============
    
    constructor() {
        oracle = msg.sender; // Initialize with deployer, can be updated
        deathVerificationDelay = DEFAULT_DEATH_VERIFICATION_DELAY;
    }
    
    uint256 private _nextVaultId;
    mapping(uint256 => Vault) private _vaults;
    mapping(uint256 => mapping(address => bool)) private _beneficiaryClaimed;
    mapping(uint256 => mapping(address => bool)) private _isBeneficiary;
    mapping(uint256 => mapping(address => bool)) private _isGuardian;
    mapping(uint256 => mapping(address => bool)) private _guardianAttested;
    mapping(uint256 => mapping(address => uint256)) private _lastGuardianAttestation;
    mapping(uint256 => uint256) private _guardianAttestationCount;
    mapping(uint256 => uint256) private _triggeredAt;
    
    // ============ EmailHash-Based Guardians ============
    // Support for email-based guardians (emailHash = SHA-256 hash of email)
    mapping(uint256 => mapping(bytes32 => bool)) private _isGuardianByEmailHash;
    mapping(uint256 => bytes32[]) private _guardianEmailHashes;
    mapping(uint256 => mapping(bytes32 => bool)) private _guardianAttestedByEmailHash;
    mapping(uint256 => mapping(bytes32 => uint256)) private _lastGuardianAttestationByEmailHash;
    // Mapping to link emailHash to address when guardian connects wallet during recovery
    mapping(uint256 => mapping(bytes32 => address)) private _emailHashToAddress;
    
    // ============ Constants ============
    
    uint256 public constant MIN_CHECK_IN_INTERVAL = 30 days;
    uint256 public constant MAX_CHECK_IN_INTERVAL = 365 days;
    uint256 public constant MIN_GRACE_PERIOD = 7 days;
    uint256 public constant MAX_GRACE_PERIOD = 90 days;
    uint256 public constant MAX_BENEFICIARIES = 10;
    uint256 public constant GUARDIAN_COUNT = 3; // Exactly 3 guardians
    uint256 public constant GUARDIAN_TRIGGER_THRESHOLD = 2; // 2-of-3 required
    uint256 public constant GUARDIAN_ATTESTATION_COOLDOWN = 24 hours; // 24h between attestations
    uint256 public constant REVOKE_WINDOW = 7 days; // 7 days to revoke false trigger
    uint256 public constant DEFAULT_DEATH_VERIFICATION_DELAY = 7 days; // Delay before vault becomes ready for claim after death verification
    
    // ============ Oracle Death Verification ============
    address public oracle; // Chainlink oracle address (or authorized oracle node)
    mapping(uint256 => DeathVerification) private _deathVerifications;
    mapping(uint256 => uint256) private _deathVerifiedAt; // Timestamp when death was verified
    uint256 public deathVerificationDelay; // Configurable delay before vault transitions to ReadyForClaim
    
    // ============ YieldVault Integration ============
    address public yieldVault; // YieldVault contract address
    mapping(uint256 => uint256) private _vaultToYieldVault; // guardiaVaultId => yieldVaultId
    
    struct DeathVerification {
        bool verified;
        uint256 verifiedAt;
        address verifiedBy; // Oracle address
    }
    
    // ============ Structs & Enums ============
    
    struct Vault {
        address owner;
        uint256 checkInInterval;
        uint256 gracePeriod;
        uint256 lastCheckIn;
        address[] beneficiaries;
        address[] guardians; // Address-based guardians (legacy + primary)
        bytes32[] guardianEmailHashes; // EmailHash-based guardians (new email-only mode)
        VaultStatus status;
        string metadataHash;
    }
    
    enum VaultStatus { 
        Active,           // Vault is active, check-ins up to date
        Warning,          // Check-in overdue but within grace period
        Triggered,       // Grace period expired or guardians attested
        DeathVerified,   // Death verified by oracle, waiting for delay period
        ReadyForClaim,   // Death verified and delay elapsed, beneficiaries can claim
        Claimed          // All beneficiaries have claimed
    }
    
    // ============ Events ============
    
    event VaultCreated(
        uint256 indexed vaultId, 
        address indexed owner,
        uint256 checkInInterval,
        uint256 gracePeriod,
        uint256 beneficiaryCount,
        address[] guardians
    );
    
    event CheckInPerformed(
        uint256 indexed vaultId, 
        uint256 timestamp,
        uint256 nextDeadline
    );
    
    event VaultTriggered(
        uint256 indexed vaultId, 
        uint256 timestamp,
        VaultStatus newStatus,
        string reason // "time_expired" or "guardian_attestation"
    );
    
    event GuardianAttested(
        uint256 indexed vaultId,
        address indexed guardian,
        uint256 attestationCount,
        bool triggered
    );
    
    event GuardianAttestedByEmailHash(
        uint256 indexed vaultId,
        bytes32 indexed emailHash,
        address guardianAddress, // Address used for attestation (may be zero if email-only)
        uint256 attestationCount,
        bool triggered
    );
    
    event GuardianEmailHashAdded(
        uint256 indexed vaultId,
        bytes32 indexed emailHash,
        address indexed addedBy
    );
    
    event GuardianEmailHashLinked(
        uint256 indexed vaultId,
        bytes32 indexed emailHash,
        address indexed walletAddress
    );
    
    event BeneficiaryClaimed(
        uint256 indexed vaultId, 
        address indexed beneficiary,
        uint256 timestamp,
        string metadataHash
    );
    
    event VaultRevoked(
        uint256 indexed vaultId,
        address indexed owner,
        uint256 timestamp
    );
    
    event MetadataUpdated(
        uint256 indexed vaultId,
        string newMetadataHash
    );
    
    event YieldVaultWithdrawn(
        uint256 indexed vaultId,
        uint256 indexed yieldVaultId,
        address indexed beneficiary,
        uint256 amount
    );
    
    event DeathVerified(
        uint256 indexed vaultId,
        address indexed user,
        address indexed verifiedBy,
        uint256 timestamp,
        uint256 readyForClaimAt
    );
    
    event VaultReadyForClaim(
        uint256 indexed vaultId,
        uint256 timestamp
    );
    
    // ============ Custom Errors ============
    
    error VaultNotFound();
    error Unauthorized();
    error InvalidCheckInInterval();
    error InvalidGracePeriod();
    error InvalidGuardianCount();
    error InvalidBeneficiaryCount();
    error NoBeneficiaries();
    error DuplicateBeneficiary();
    error DuplicateGuardian();
    error InvalidBeneficiary();
    error InvalidGuardian();
    error BeneficiaryCannotBeGuardian();
    error VaultNotTriggered();
    error AlreadyClaimed();
    error NotBeneficiary();
    error NotGuardian();
    error InvalidEmailHash();
    error EmailHashNotGuardian();
    error AlreadyAttested();
    error AttestationCooldown();
    error EmailHashAlreadyLinked();
    error CannotModifyDuringWarning();
    error RevokeWindowExpired();
    error CannotRevokeBeforeWindow();
    error InvalidStatus();
    error OnlyOracle();
    error DeathAlreadyVerified();
    error DeathNotVerified();
    error NotReadyForClaim();
    
    // ============ Modifiers ============
    
    modifier onlyVaultOwner(uint256 vaultId) {
        if (_vaults[vaultId].owner == address(0)) revert VaultNotFound();
        if (_vaults[vaultId].owner != msg.sender) revert Unauthorized();
        _;
    }
    
    modifier vaultExists(uint256 vaultId) {
        if (_vaults[vaultId].owner == address(0)) revert VaultNotFound();
        _;
    }
    
    modifier onlyOracle() {
        if (msg.sender != oracle && oracle != address(0)) revert OnlyOracle();
        _;
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Create a new vault with dead man's switch functionality
     * @param checkInInterval Seconds between required check-ins (30-365 days)
     * @param gracePeriod Additional time before vault triggers (7-90 days)
     * @param beneficiaries Addresses who can claim when triggered (1-10)
     * @param guardians Exactly 3 guardian addresses who can attest to death
     * @param metadataHash IPFS hash containing encrypted vault data
     * @return vaultId The ID of the newly created vault
     */
    function createVault(
        uint256 checkInInterval,
        uint256 gracePeriod,
        address[] calldata beneficiaries,
        address[3] calldata guardians,
        string calldata metadataHash
    ) external returns (uint256 vaultId) {
        // Validate inputs
        if (checkInInterval < MIN_CHECK_IN_INTERVAL || checkInInterval > MAX_CHECK_IN_INTERVAL) {
            revert InvalidCheckInInterval();
        }
        if (gracePeriod < MIN_GRACE_PERIOD || gracePeriod > MAX_GRACE_PERIOD) {
            revert InvalidGracePeriod();
        }
        if (beneficiaries.length == 0 || beneficiaries.length > MAX_BENEFICIARIES) {
            revert InvalidBeneficiaryCount();
        }
        if (bytes(metadataHash).length == 0) {
            revert InvalidBeneficiary(); // Reusing error for empty metadata
        }
        
        // Validate guardians (exactly 3, no duplicates, not owner)
        for (uint256 i = 0; i < GUARDIAN_COUNT; i++) {
            if (guardians[i] == address(0)) revert InvalidGuardian();
            if (guardians[i] == msg.sender) revert InvalidGuardian();
            
            // Check for duplicate guardians
            for (uint256 j = i + 1; j < GUARDIAN_COUNT; j++) {
                if (guardians[i] == guardians[j]) revert DuplicateGuardian();
            }
        }
        
        // Validate beneficiaries (no duplicates, not owner, cannot be guardians)
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (beneficiaries[i] == address(0)) revert InvalidBeneficiary();
            if (beneficiaries[i] == msg.sender) revert InvalidBeneficiary();
            
            // Check beneficiary is not a guardian
            for (uint256 j = 0; j < GUARDIAN_COUNT; j++) {
                if (beneficiaries[i] == guardians[j]) {
                    revert BeneficiaryCannotBeGuardian();
                }
            }
            
            // Check for duplicate beneficiaries
            for (uint256 j = i + 1; j < beneficiaries.length; j++) {
                if (beneficiaries[i] == beneficiaries[j]) revert DuplicateBeneficiary();
            }
        }
        
        vaultId = _nextVaultId++;
        
        Vault storage vault = _vaults[vaultId];
        vault.owner = msg.sender;
        vault.checkInInterval = checkInInterval;
        vault.gracePeriod = gracePeriod;
        vault.lastCheckIn = block.timestamp;
        vault.metadataHash = metadataHash;
        vault.status = VaultStatus.Active;
        
        // Store beneficiaries
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            vault.beneficiaries.push(beneficiaries[i]);
            _isBeneficiary[vaultId][beneficiaries[i]] = true;
        }
        
        // Store guardians (exactly 3) - address-based
        for (uint256 i = 0; i < GUARDIAN_COUNT; i++) {
            vault.guardians.push(guardians[i]);
            _isGuardian[vaultId][guardians[i]] = true;
        }
        
        // Initialize guardianEmailHashes array (can be populated later via addGuardianByEmailHash)
        // vault.guardianEmailHashes starts empty for backward compatibility
        
        // Convert fixed array to dynamic for event emission
        address[] memory guardiansArray = new address[](GUARDIAN_COUNT);
        for (uint256 i = 0; i < GUARDIAN_COUNT; i++) {
            guardiansArray[i] = guardians[i];
        }
        
        emit VaultCreated(
            vaultId,
            msg.sender,
            checkInInterval,
            gracePeriod,
            beneficiaries.length,
            guardiansArray
        );
    }
    
    /**
     * @notice Owner checks in to reset the vault timer
     * @param vaultId The vault to check in to
     */
    function checkIn(uint256 vaultId) external onlyVaultOwner(vaultId) {
        Vault storage vault = _vaults[vaultId];
        
        // CANNOT check in if vault is Triggered or Claimed
        if (vault.status == VaultStatus.Triggered || vault.status == VaultStatus.Claimed) {
            revert InvalidStatus();
        }
        
        // Update status first to ensure we're not in warning
        updateVaultStatus(vaultId);
        
        // If somehow triggered, cannot check in
        if (vault.status == VaultStatus.Triggered) {
            revert InvalidStatus();
        }
        
        vault.lastCheckIn = block.timestamp;
        vault.status = VaultStatus.Active;
        
        // Clear guardian attestations on successful check-in
        _guardianAttestationCount[vaultId] = 0;
        
        // Clear attestation flags for all guardians
        for (uint256 i = 0; i < vault.guardians.length; i++) {
            _guardianAttested[vaultId][vault.guardians[i]] = false;
        }
        
        uint256 nextDeadline = block.timestamp + vault.checkInInterval;
        
        emit CheckInPerformed(vaultId, block.timestamp, nextDeadline);
    }
    
    /**
     * @notice Guardian attests to owner's death/incapacitation (address-based)
     * @param vaultId The vault to attest for
     * @dev Requires 2-of-3 guardians to trigger vault immediately
     *      Has 24-hour cooldown between attestations per guardian
     */
    function attestDeath(uint256 vaultId) external vaultExists(vaultId) {
        if (!_isGuardian[vaultId][msg.sender]) revert NotGuardian();
        
        // Check cooldown (24 hours between attestations)
        uint256 lastAttestation = _lastGuardianAttestation[vaultId][msg.sender];
        if (lastAttestation > 0 && block.timestamp < lastAttestation + GUARDIAN_ATTESTATION_COOLDOWN) {
            revert AttestationCooldown();
        }
        
        // Check if already attested (and cooldown passed)
        if (_guardianAttested[vaultId][msg.sender]) {
            revert AlreadyAttested();
        }
        
        Vault storage vault = _vaults[vaultId];
        
        // Cannot attest if already triggered or claimed
        if (vault.status == VaultStatus.Triggered || vault.status == VaultStatus.Claimed) {
            revert InvalidStatus();
        }
        
        // Mark guardian as attested
        _guardianAttested[vaultId][msg.sender] = true;
        _lastGuardianAttestation[vaultId][msg.sender] = block.timestamp;
        _guardianAttestationCount[vaultId]++;
        
        bool triggered = false;
        
        // If threshold met (2-of-3), trigger vault immediately
        if (_guardianAttestationCount[vaultId] >= GUARDIAN_TRIGGER_THRESHOLD) {
            vault.status = VaultStatus.Triggered;
            _triggeredAt[vaultId] = block.timestamp;
            triggered = true;
            
            emit VaultTriggered(vaultId, block.timestamp, VaultStatus.Triggered, "guardian_attestation");
        }
        
        emit GuardianAttested(vaultId, msg.sender, _guardianAttestationCount[vaultId], triggered);
    }
    
    /**
     * @notice EmailHash-based guardian attests to owner's death/incapacitation
     * @param vaultId The vault to attest for
     * @param emailHash SHA-256 hash of guardian's email address (bytes32)
     * @param signature ECDSA signature proving ownership of emailHash (signed message: "GuardiaVault:Attest:{vaultId}:{emailHash}")
     * @dev Guardian must sign a message with their wallet to prove they control the email
     *      Has 24-hour cooldown between attestations per emailHash
     *      Requires 2-of-3 guardians (address OR emailHash) to trigger vault
     */
    function attestDeathByEmailHash(
        uint256 vaultId,
        bytes32 emailHash,
        bytes calldata signature
    ) external vaultExists(vaultId) {
        if (emailHash == bytes32(0)) revert InvalidEmailHash();
        if (!_isGuardianByEmailHash[vaultId][emailHash]) revert EmailHashNotGuardian();
        
        // Verify signature - guardian signs message proving they control the emailHash
        // Message format: "GuardiaVault:Attest:{vaultId}:{emailHash}"
        // Calculate message hash with proper Ethereum signed message prefix
        bytes memory message = abi.encodePacked("GuardiaVault:Attest:", vaultId, ":", emailHash);
        bytes32 messageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n", _toString(message.length), message)
        );
        address signer = _recoverSigner(messageHash, signature);
        
        // Check if emailHash is already linked to an address
        address linkedAddress = _emailHashToAddress[vaultId][emailHash];
        if (linkedAddress != address(0)) {
            // If linked, use the linked address (must match signer)
            if (signer != linkedAddress) revert Unauthorized();
        } else {
            // If not linked, link it now (first attestation links emailHash to wallet)
            _emailHashToAddress[vaultId][emailHash] = signer;
            emit GuardianEmailHashLinked(vaultId, emailHash, signer);
        }
        
        // Check cooldown (24 hours between attestations)
        uint256 lastAttestation = _lastGuardianAttestationByEmailHash[vaultId][emailHash];
        if (lastAttestation > 0 && block.timestamp < lastAttestation + GUARDIAN_ATTESTATION_COOLDOWN) {
            revert AttestationCooldown();
        }
        
        // Check if already attested
        if (_guardianAttestedByEmailHash[vaultId][emailHash]) {
            revert AlreadyAttested();
        }
        
        Vault storage vault = _vaults[vaultId];
        
        // Cannot attest if already triggered or claimed
        if (vault.status == VaultStatus.Triggered || vault.status == VaultStatus.Claimed) {
            revert InvalidStatus();
        }
        
        // Mark guardian as attested
        _guardianAttestedByEmailHash[vaultId][emailHash] = true;
        _lastGuardianAttestationByEmailHash[vaultId][emailHash] = block.timestamp;
        _guardianAttestationCount[vaultId]++;
        
        bool triggered = false;
        
        // If threshold met (2-of-3), trigger vault immediately
        if (_guardianAttestationCount[vaultId] >= GUARDIAN_TRIGGER_THRESHOLD) {
            vault.status = VaultStatus.Triggered;
            _triggeredAt[vaultId] = block.timestamp;
            triggered = true;
            
            emit VaultTriggered(vaultId, block.timestamp, VaultStatus.Triggered, "guardian_attestation");
        }
        
        emit GuardianAttestedByEmailHash(vaultId, emailHash, signer, _guardianAttestationCount[vaultId], triggered);
    }
    
    /**
     * @notice Add emailHash-based guardian to vault (owner only)
     * @param vaultId The vault to add guardian to
     * @param emailHash SHA-256 hash of guardian's email (bytes32)
     * @dev Can mix address-based and emailHash-based guardians
     *      Maximum 5 guardians total (address + emailHash combined)
     */
    function addGuardianByEmailHash(
        uint256 vaultId,
        bytes32 emailHash
    ) external onlyVaultOwner(vaultId) vaultExists(vaultId) {
        if (emailHash == bytes32(0)) revert InvalidEmailHash();
        if (_isGuardianByEmailHash[vaultId][emailHash]) revert DuplicateGuardian();
        
        Vault storage vault = _vaults[vaultId];
        
        // Check total guardian count (address + emailHash)
        uint256 totalGuardians = vault.guardians.length + vault.guardianEmailHashes.length;
        if (totalGuardians >= 5) {
            revert InvalidGuardianCount(); // Max 5 guardians
        }
        
        // Check if emailHash already exists
        for (uint256 i = 0; i < vault.guardianEmailHashes.length; i++) {
            if (vault.guardianEmailHashes[i] == emailHash) {
                revert DuplicateGuardian();
            }
        }
        
        // Add emailHash guardian
        vault.guardianEmailHashes.push(emailHash);
        _isGuardianByEmailHash[vaultId][emailHash] = true;
        
        emit GuardianEmailHashAdded(vaultId, emailHash, msg.sender);
    }
    
    /**
     * @notice Link emailHash to wallet address (for emailHash-based guardians)
     * @param vaultId The vault ID
     * @param emailHash SHA-256 hash of guardian's email
     * @param signature Signature proving ownership of emailHash
     * @dev Called by guardian to link their emailHash to their wallet address
     *      Message format: "GuardiaVault:Link:{vaultId}:{emailHash}:{address}"
     */
    function linkEmailHashToAddress(
        uint256 vaultId,
        bytes32 emailHash,
        bytes calldata signature
    ) external vaultExists(vaultId) {
        if (emailHash == bytes32(0)) revert InvalidEmailHash();
        if (!_isGuardianByEmailHash[vaultId][emailHash]) revert EmailHashNotGuardian();
        
        address existingLink = _emailHashToAddress[vaultId][emailHash];
        if (existingLink != address(0)) revert EmailHashAlreadyLinked();
        
        // Verify signature
        bytes memory message = abi.encodePacked("GuardiaVault:Link:", vaultId, ":", emailHash, ":", msg.sender);
        bytes32 messageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n", _toString(message.length), message)
        );
        address signer = _recoverSigner(messageHash, signature);
        
        if (signer != msg.sender) revert Unauthorized();
        
        // Link emailHash to address
        _emailHashToAddress[vaultId][emailHash] = msg.sender;
        
        emit GuardianEmailHashLinked(vaultId, emailHash, msg.sender);
    }
    
    /**
     * @notice Internal function to recover signer from signature
     * @param messageHash Hash of the signed message
     * @param signature ECDSA signature
     * @return signer Address that signed the message
     */
    function _recoverSigner(bytes32 messageHash, bytes calldata signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        // Split signature into r, s, v
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 0x20))
            v := byte(0, calldataload(add(signature.offset, 0x40)))
        }
        
        // Adjust v value if needed (should be 27 or 28)
        if (v < 27) {
            v += 27;
        }
        
        require(v == 27 || v == 28, "Invalid signature");
        
        // Recover signer
        return ecrecover(messageHash, v, r, s);
    }
    
    /**
     * @notice Internal function to convert uint to string (for message prefix)
     * @param value The number to convert
     * @return The string representation
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    /**
     * @notice Update vault status based on current time
     * @param vaultId The vault to update
     * @dev Can be called by anyone to update vault status
     */
    function updateVaultStatus(uint256 vaultId) public vaultExists(vaultId) {
        Vault storage vault = _vaults[vaultId];
        
        // Don't update if already in a terminal or oracle-verified state
        if (vault.status == VaultStatus.Claimed || 
            vault.status == VaultStatus.Triggered ||
            vault.status == VaultStatus.DeathVerified ||
            vault.status == VaultStatus.ReadyForClaim) return;
        
        uint256 deadline = vault.lastCheckIn + vault.checkInInterval;
        uint256 triggerTime = deadline + vault.gracePeriod;
        
        VaultStatus oldStatus = vault.status;
        VaultStatus newStatus = oldStatus;
        string memory reason = "";
        
        if (block.timestamp > triggerTime) {
            newStatus = VaultStatus.Triggered;
            reason = "time_expired";
            if (_triggeredAt[vaultId] == 0) {
                _triggeredAt[vaultId] = block.timestamp;
            }
        } else if (block.timestamp > deadline) {
            newStatus = VaultStatus.Warning;
        } else {
            newStatus = VaultStatus.Active;
        }
        
        if (newStatus != oldStatus) {
            vault.status = newStatus;
            if (newStatus == VaultStatus.Triggered && bytes(reason).length > 0) {
                emit VaultTriggered(vaultId, block.timestamp, newStatus, reason);
            }
        }
    }
    
    /**
     * @notice Beneficiary claims access to vault data
     * @param vaultId The vault to claim from
     */
    function claim(uint256 vaultId) external nonReentrant vaultExists(vaultId) {
        if (!_isBeneficiary[vaultId][msg.sender]) revert NotBeneficiary();
        if (_beneficiaryClaimed[vaultId][msg.sender]) revert AlreadyClaimed();
        
        // Update status first
        updateVaultStatus(vaultId);
        updateDeathVerificationStatus(vaultId);
        
        Vault storage vault = _vaults[vaultId];
        
        // Allow claiming if vault is ReadyForClaim or Triggered (backward compatibility)
        if (vault.status != VaultStatus.ReadyForClaim && vault.status != VaultStatus.Triggered) {
            revert NotReadyForClaim();
        }
        
        _beneficiaryClaimed[vaultId][msg.sender] = true;
        
        // Check if all beneficiaries have claimed
        bool allClaimed = true;
        for (uint256 i = 0; i < vault.beneficiaries.length; i++) {
            if (!_beneficiaryClaimed[vaultId][vault.beneficiaries[i]]) {
                allClaimed = false;
                break;
            }
        }
        
        if (allClaimed) {
            vault.status = VaultStatus.Claimed;
        }
        
        // If vault has associated YieldVault, trigger it and transfer yield to beneficiary
        uint256 yieldVaultId = _vaultToYieldVault[vaultId];
        if (yieldVaultId > 0 && yieldVault != address(0)) {
            IYieldVault yieldVaultContract = IYieldVault(yieldVault);
            try yieldVaultContract.triggerVault(yieldVaultId, msg.sender) returns (uint256 amount) {
                // Yield already transferred in triggerVault, emit event
                emit YieldVaultWithdrawn(vaultId, yieldVaultId, msg.sender, amount);
            } catch {
                // If yield vault fails, continue with regular claim
            }
        }
        
        emit BeneficiaryClaimed(vaultId, msg.sender, block.timestamp, vault.metadataHash);
    }
    
    /**
     * @notice Owner can revoke false trigger within 7-day window
     * @param vaultId The vault to revoke
     * @dev Owner sending the transaction proves they are alive
     *      Can only revoke within 7 days of trigger
     */
    function emergencyRevoke(
        uint256 vaultId
    ) external onlyVaultOwner(vaultId) vaultExists(vaultId) {
        Vault storage vault = _vaults[vaultId];
        
        if (vault.status != VaultStatus.Triggered) {
            revert VaultNotTriggered(); // Cannot revoke if not triggered
        }
        
        uint256 triggeredTime = _triggeredAt[vaultId];
        if (triggeredTime == 0) revert VaultNotTriggered();
        
        // Check revoke window (must be within 7 days of trigger)
        if (block.timestamp > triggeredTime + REVOKE_WINDOW) {
            revert RevokeWindowExpired();
        }
        
        // Reset vault to active
        vault.status = VaultStatus.Active;
        vault.lastCheckIn = block.timestamp;
        
        // Clear guardian attestations (address-based)
        _guardianAttestationCount[vaultId] = 0;
        for (uint256 i = 0; i < vault.guardians.length; i++) {
            _guardianAttested[vaultId][vault.guardians[i]] = false;
            _lastGuardianAttestation[vaultId][vault.guardians[i]] = 0;
        }
        
        // Clear guardian attestations (emailHash-based)
        for (uint256 i = 0; i < vault.guardianEmailHashes.length; i++) {
            bytes32 emailHash = vault.guardianEmailHashes[i];
            _guardianAttestedByEmailHash[vaultId][emailHash] = false;
            _lastGuardianAttestationByEmailHash[vaultId][emailHash] = 0;
        }
        
        _triggeredAt[vaultId] = 0;
        
        emit VaultRevoked(vaultId, msg.sender, block.timestamp);
        emit CheckInPerformed(vaultId, block.timestamp, block.timestamp + vault.checkInInterval);
    }
    
    /**
     * @notice Update vault metadata (IPFS hash)
     * @param vaultId The vault to update
     * @param newMetadataHash New IPFS hash or reference
     * @dev Cannot update metadata when vault is in Warning, Triggered, or Claimed status
     */
    function updateMetadata(
        uint256 vaultId,
        string calldata newMetadataHash
    ) external onlyVaultOwner(vaultId) vaultExists(vaultId) {
        // Update status first to ensure we have current state
        updateVaultStatus(vaultId);
        
        Vault storage vault = _vaults[vaultId];
        
        // Cannot modify if vault is not in Active status
        if (vault.status != VaultStatus.Active) {
            revert CannotModifyDuringWarning();
        }
        
        if (bytes(newMetadataHash).length == 0) {
            revert InvalidBeneficiary(); // Reusing error
        }
        
        vault.metadataHash = newMetadataHash;
        
        emit MetadataUpdated(vaultId, newMetadataHash);
    }
    
    /**
     * @notice Oracle verifies death on-chain
     * @param userAddress Address of the vault owner whose death is being verified
     * @dev Only callable by authorized oracle node
     * @dev Marks death as verified and transitions vault to DeathVerified status
     * @dev After deathVerificationDelay, vault will transition to ReadyForClaim
     */
    function verifyDeath(address userAddress) external onlyOracle {
        // Find vault by owner address (assuming one vault per owner for simplicity)
        // In production, you might want to pass vaultId directly or use a mapping
        uint256 vaultId = _findVaultByOwner(userAddress);
        if (vaultId == type(uint256).max) revert VaultNotFound();
        
        Vault storage vault = _vaults[vaultId];
        DeathVerification storage verification = _deathVerifications[vaultId];
        
        // Check if already verified
        if (verification.verified) revert DeathAlreadyVerified();
        
        // Cannot verify if vault is already claimed
        if (vault.status == VaultStatus.Claimed) revert InvalidStatus();
        
        // Mark death as verified
        verification.verified = true;
        verification.verifiedAt = block.timestamp;
        verification.verifiedBy = msg.sender;
        _deathVerifiedAt[vaultId] = block.timestamp;
        
        // Transition vault to DeathVerified status
        if (vault.status != VaultStatus.Triggered && vault.status != VaultStatus.ReadyForClaim) {
            vault.status = VaultStatus.DeathVerified;
        }
        
        uint256 readyForClaimAt = block.timestamp + deathVerificationDelay;
        
        emit DeathVerified(vaultId, userAddress, msg.sender, block.timestamp, readyForClaimAt);
        
        // If delay is 0, immediately transition to ReadyForClaim
        if (deathVerificationDelay == 0) {
            vault.status = VaultStatus.ReadyForClaim;
            emit VaultReadyForClaim(vaultId, block.timestamp);
        }
    }
    
    /**
     * @notice Update vault status based on death verification delay
     * @param vaultId The vault to update
     * @dev Transitions DeathVerified → ReadyForClaim after delay period
     */
    function updateDeathVerificationStatus(uint256 vaultId) public vaultExists(vaultId) {
        Vault storage vault = _vaults[vaultId];
        DeathVerification storage verification = _deathVerifications[vaultId];
        
        // If death is verified and delay has passed, transition to ReadyForClaim
        if (verification.verified && vault.status == VaultStatus.DeathVerified) {
            uint256 verifiedAt = verification.verifiedAt;
            if (block.timestamp >= verifiedAt + deathVerificationDelay) {
                vault.status = VaultStatus.ReadyForClaim;
                emit VaultReadyForClaim(vaultId, block.timestamp);
            }
        }
    }
    
    /**
     * @notice Find vault ID by owner address
     * @dev Simple linear search - in production, use a mapping
     */
    function _findVaultByOwner(address owner) internal view returns (uint256) {
        // Note: This is inefficient for large vault counts
        // In production, maintain a mapping(address => uint256[]) of vaults per owner
        for (uint256 i = 0; i < _nextVaultId; i++) {
            if (_vaults[i].owner == owner && _vaults[i].status != VaultStatus.Claimed) {
                return i;
            }
        }
        return type(uint256).max; // Not found
    }
    
    /**
     * @notice Set oracle address (admin function)
     * @param newOracle Address of the oracle node
     */
    function setOracle(address newOracle) external {
        // In production, add access control (e.g., onlyOwner)
        if (newOracle == address(0)) revert InvalidGuardian();
        oracle = newOracle;
    }
    
    /**
     * @notice Set death verification delay (admin function)
     * @param newDelay Delay in seconds before vault becomes ready for claim
     */
    function setDeathVerificationDelay(uint256 newDelay) external {
        // In production, add access control (e.g., onlyOwner)
        // Max delay: 90 days to prevent excessive delays
        require(newDelay <= 90 days, "Delay too long");
        deathVerificationDelay = newDelay;
    }
    
    /**
     * @notice Set YieldVault contract address (admin function)
     * @param _yieldVault Address of YieldVault contract
     */
    function setYieldVault(address _yieldVault) external {
        // In production, add access control (e.g., onlyOwner)
        yieldVault = _yieldVault;
    }
    
    /**
     * @notice Link a GuardiaVault to a YieldVault
     * @param guardiaVaultId GuardiaVault ID
     * @param yieldVaultId YieldVault ID
     */
    function linkYieldVault(uint256 guardiaVaultId, uint256 yieldVaultId) external onlyVaultOwner(guardiaVaultId) {
        _vaultToYieldVault[guardiaVaultId] = yieldVaultId;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get vault information
     * @param vaultId The vault to query
     * @return owner The vault owner address
     * @return checkInInterval The check-in interval in seconds
     * @return gracePeriod The grace period in seconds
     * @return lastCheckIn The timestamp of last check-in
     * @return beneficiaries Array of beneficiary addresses
     * @return guardians Array of guardian addresses
     * @return status Current vault status
     * @return metadataHash IPFS hash of vault metadata
     */
    function getVault(uint256 vaultId) external view vaultExists(vaultId) returns (
        address owner,
        uint256 checkInInterval,
        uint256 gracePeriod,
        uint256 lastCheckIn,
        address[] memory beneficiaries,
        address[] memory guardians,
        VaultStatus status,
        string memory metadataHash
    ) {
        Vault storage vault = _vaults[vaultId];
        return (
            vault.owner,
            vault.checkInInterval,
            vault.gracePeriod,
            vault.lastCheckIn,
            vault.beneficiaries,
            vault.guardians,
            vault.status,
            vault.metadataHash
        );
    }
    
    /**
     * @notice Get vault information including emailHash guardians
     * @param vaultId The vault to query
     * @return owner The vault owner address
     * @return checkInInterval The check-in interval in seconds
     * @return gracePeriod The grace period in seconds
     * @return lastCheckIn The timestamp of last check-in
     * @return beneficiaries Array of beneficiary addresses
     * @return guardians Array of guardian addresses
     * @return guardianEmailHashes Array of guardian email hashes (bytes32)
     * @return status Current vault status
     * @return metadataHash IPFS hash of vault metadata
     */
    function getVaultWithEmailHashes(uint256 vaultId) external view vaultExists(vaultId) returns (
        address owner,
        uint256 checkInInterval,
        uint256 gracePeriod,
        uint256 lastCheckIn,
        address[] memory beneficiaries,
        address[] memory guardians,
        bytes32[] memory guardianEmailHashes,
        VaultStatus status,
        string memory metadataHash
    ) {
        Vault storage vault = _vaults[vaultId];
        return (
            vault.owner,
            vault.checkInInterval,
            vault.gracePeriod,
            vault.lastCheckIn,
            vault.beneficiaries,
            vault.guardians,
            vault.guardianEmailHashes,
            vault.status,
            vault.metadataHash
        );
    }
    
    /**
     * @notice Get current vault status (with automatic update)
     * @param vaultId The vault to query
     * @return status Current status of the vault
     */
    function getVaultStatus(uint256 vaultId) external view vaultExists(vaultId) returns (VaultStatus) {
        Vault memory vault = _vaults[vaultId];
        
        // Check if death verified and delay has passed
        DeathVerification memory verification = _deathVerifications[vaultId];
        if (verification.verified && vault.status == VaultStatus.DeathVerified) {
            if (block.timestamp >= verification.verifiedAt + deathVerificationDelay) {
                return VaultStatus.ReadyForClaim;
            }
            return VaultStatus.DeathVerified;
        }
        
        if (vault.status == VaultStatus.Claimed || vault.status == VaultStatus.ReadyForClaim) {
            return vault.status;
        }
        
        if (vault.status == VaultStatus.Triggered) {
            return vault.status;
        }
        
        uint256 deadline = vault.lastCheckIn + vault.checkInInterval;
        uint256 triggerTime = deadline + vault.gracePeriod;
        
        if (block.timestamp > triggerTime) {
            return VaultStatus.Triggered;
        } else if (block.timestamp > deadline) {
            return VaultStatus.Warning;
        } else {
            return VaultStatus.Active;
        }
    }
    
    /**
     * @notice Get time until next check-in deadline
     * @param vaultId The vault to query
     * @return timeRemaining Seconds until deadline (0 if overdue)
     */
    function getTimeUntilDeadline(uint256 vaultId) external view vaultExists(vaultId) returns (uint256) {
        Vault memory vault = _vaults[vaultId];
        uint256 deadline = vault.lastCheckIn + vault.checkInInterval;
        
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }
    
    /**
     * @notice Get time until vault triggers
     * @param vaultId The vault to query
     * @return timeRemaining Seconds until trigger (0 if already triggered)
     */
    function getTimeUntilTrigger(uint256 vaultId) external view vaultExists(vaultId) returns (uint256) {
        Vault memory vault = _vaults[vaultId];
        uint256 triggerTime = vault.lastCheckIn + vault.checkInInterval + vault.gracePeriod;
        
        if (block.timestamp >= triggerTime) return 0;
        return triggerTime - block.timestamp;
    }
    
    /**
     * @notice Check if address is a beneficiary
     * @param vaultId The vault to query
     * @param beneficiary Address to check
     * @return isBeneficiary True if address is a beneficiary
     */
    function isBeneficiary(uint256 vaultId, address beneficiary) external view returns (bool) {
        return _isBeneficiary[vaultId][beneficiary];
    }
    
    /**
     * @notice Check if beneficiary has claimed
     * @param vaultId The vault to query
     * @param beneficiary Address to check
     * @return hasClaimed True if beneficiary has claimed
     */
    function hasClaimed(uint256 vaultId, address beneficiary) external view returns (bool) {
        return _beneficiaryClaimed[vaultId][beneficiary];
    }
    
    /**
     * @notice Check if address is a guardian
     * @param vaultId The vault to query
     * @param guardian Address to check
     * @return isGuardian True if address is a guardian
     */
    function isGuardian(uint256 vaultId, address guardian) external view returns (bool) {
        return _isGuardian[vaultId][guardian];
    }
    
    /**
     * @notice Check if emailHash is a guardian
     * @param vaultId The vault to query
     * @param emailHash Email hash (SHA-256) to check
     * @return isGuardian True if emailHash is a guardian
     */
    function isGuardianByEmailHash(uint256 vaultId, bytes32 emailHash) external view returns (bool) {
        return _isGuardianByEmailHash[vaultId][emailHash];
    }
    
    /**
     * @notice Get wallet address linked to emailHash guardian
     * @param vaultId The vault to query
     * @param emailHash Email hash (SHA-256) to check
     * @return linkedAddress Wallet address linked to emailHash (zero if not linked)
     */
    function getEmailHashLinkedAddress(uint256 vaultId, bytes32 emailHash) external view returns (address) {
        return _emailHashToAddress[vaultId][emailHash];
    }
    
    /**
     * @notice Get all guardian email hashes for a vault
     * @param vaultId The vault to query
     * @return emailHashes Array of guardian email hashes
     */
    function getGuardianEmailHashes(uint256 vaultId) external view vaultExists(vaultId) returns (bytes32[] memory) {
        return _vaults[vaultId].guardianEmailHashes;
    }
    
    /**
     * @notice Check if emailHash guardian has attested
     * @param vaultId The vault to query
     * @param emailHash Email hash (SHA-256) to check
     * @return hasAttested True if emailHash guardian has attested
     */
    function hasGuardianAttestedByEmailHash(uint256 vaultId, bytes32 emailHash) external view returns (bool) {
        return _guardianAttestedByEmailHash[vaultId][emailHash];
    }
    
    /**
     * @notice Get guardian attestation count
     * @param vaultId The vault to query
     * @return count Number of guardians who have attested
     */
    function getGuardianAttestationCount(uint256 vaultId) external view vaultExists(vaultId) returns (uint256) {
        return _guardianAttestationCount[vaultId];
    }
    
    /**
     * @notice Check if guardian has attested
     * @param vaultId The vault to query
     * @param guardian Address to check
     * @return hasAttested True if guardian has attested
     */
    function hasGuardianAttested(uint256 vaultId, address guardian) external view returns (bool) {
        return _guardianAttested[vaultId][guardian];
    }
    
    /**
     * @notice Get guardians for a vault (address-based only)
     * @param vaultId The vault to query
     * @return guardians Array of guardian addresses
     */
    function getGuardians(uint256 vaultId) external view vaultExists(vaultId) returns (address[] memory) {
        return _vaults[vaultId].guardians;
    }
    
    /**
     * @notice Get total guardian count (address + emailHash)
     * @param vaultId The vault to query
     * @return totalCount Total number of guardians (address + emailHash)
     * @return addressCount Number of address-based guardians
     * @return emailHashCount Number of emailHash-based guardians
     */
    function getGuardianCount(uint256 vaultId) external view vaultExists(vaultId) returns (
        uint256 totalCount,
        uint256 addressCount,
        uint256 emailHashCount
    ) {
        Vault storage vault = _vaults[vaultId];
        addressCount = vault.guardians.length;
        emailHashCount = vault.guardianEmailHashes.length;
        totalCount = addressCount + emailHashCount;
    }
    
    /**
     * @notice Get beneficiaries for a vault
     * @param vaultId The vault to query
     * @return beneficiaries Array of beneficiary addresses
     */
    function getBeneficiaries(uint256 vaultId) external view vaultExists(vaultId) returns (address[] memory) {
        return _vaults[vaultId].beneficiaries;
    }
    
    /**
     * @notice Get next vault ID
     * @return nextId The next vault ID that will be assigned
     */
    function getNextVaultId() external view returns (uint256) {
        return _nextVaultId;
    }
    
    /**
     * @notice Check if revoke window is still open
     * @param vaultId The vault to query
     * @return canRevokeStatus True if within 7-day revoke window
     * @return timeRemaining Seconds remaining in revoke window (0 if expired)
     */
    function canRevoke(uint256 vaultId) external view vaultExists(vaultId) returns (bool canRevokeStatus, uint256 timeRemaining) {
        Vault memory vault = _vaults[vaultId];
        uint256 triggeredTime = _triggeredAt[vaultId];
        
        if (vault.status != VaultStatus.Triggered || triggeredTime == 0) {
            return (false, 0);
        }
        
        uint256 revokeDeadline = triggeredTime + REVOKE_WINDOW;
        if (block.timestamp > revokeDeadline) {
            return (false, 0);
        }
        
        timeRemaining = revokeDeadline - block.timestamp;
        canRevokeStatus = true;
        return (canRevokeStatus, timeRemaining);
    }
    
    /**
     * @notice Check if death is verified for a vault
     * @param vaultId The vault to query
     * @return verified True if death is verified
     * @return verifiedAt Timestamp when death was verified (0 if not verified)
     * @return verifiedBy Address that verified the death
     */
    function getDeathVerification(uint256 vaultId) external view vaultExists(vaultId) returns (
        bool verified,
        uint256 verifiedAt,
        address verifiedBy
    ) {
        DeathVerification memory verification = _deathVerifications[vaultId];
        return (
            verification.verified,
            verification.verifiedAt,
            verification.verifiedBy
        );
    }
    
    /**
     * @notice Get timestamp when vault will be ready for claim
     * @param vaultId The vault to query
     * @return readyAt Timestamp when vault becomes ready for claim (0 if not applicable)
     */
    function getReadyForClaimAt(uint256 vaultId) external view vaultExists(vaultId) returns (uint256) {
        DeathVerification memory verification = _deathVerifications[vaultId];
        if (!verification.verified) return 0;
        return verification.verifiedAt + deathVerificationDelay;
    }
}
