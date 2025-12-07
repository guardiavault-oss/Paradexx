// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title SmartWill
 * @dev On-chain will execution system for crypto asset distribution
 * @notice Allows users to create wills with specific allocation rules that execute automatically
 */
contract SmartWill is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ State Variables ============
    
    uint256 private _nextWillId;
    mapping(address => uint256[]) private _ownerWills;
    mapping(uint256 => Will) private _wills;
    mapping(uint256 => mapping(address => bool)) private _beneficiaryClaimed;
    
    // Fee configuration
    address public feeRecipient;
    uint256 public setupFee = 0; // Can be set by owner
    uint256 public annualFee = 0; // Can be set by owner
    mapping(uint256 => uint256) private _lastFeePayment;
    
    // ============ Structs & Enums ============
    
    struct Allocation {
        address recipient;
        uint256 percentage; // Basis points (10000 = 100%)
        bool nftOnly; // If true, only NFTs go to this recipient
        address tokenAddress; // If set, specific token allocation
        bool isCharityDAO; // Special flag for charity DAOs
    }
    
    struct Will {
        address owner;
        string metadataHash; // IPFS hash of legal document
        Allocation[] allocations;
        uint256 createdAt;
        uint256 executedAt;
        bool isActive;
        bool requiresGuardianAttestation; // If true, requires guardian approval
        address[] guardians; // Optional guardians for multi-sig
        uint256 guardianThreshold; // Number of guardians required
        mapping(address => bool) guardianApproved;
    }
    
    enum AssetType {
        Native,      // ETH/BNB/MATIC
        ERC20,      // Tokens
        ERC721,     // NFTs
        All         // All assets
    }
    
    // ============ Events ============
    
    event WillCreated(
        uint256 indexed willId,
        address indexed owner,
        uint256 allocationCount,
        uint256 timestamp
    );
    
    event WillExecuted(
        uint256 indexed willId,
        address indexed executor,
        uint256 timestamp,
        uint256 totalDistributed
    );
    
    event AllocationDistributed(
        uint256 indexed willId,
        address indexed recipient,
        uint256 amount,
        AssetType assetType,
        address tokenAddress
    );
    
    event GuardianApproved(
        uint256 indexed willId,
        address indexed guardian,
        uint256 approvalCount,
        bool executed
    );
    
    event FeePaid(
        uint256 indexed willId,
        uint256 amount,
        uint256 timestamp
    );
    
    // ============ Custom Errors ============
    
    error WillNotFound();
    error Unauthorized();
    error InvalidAllocation();
    error InvalidPercentage();
    error WillAlreadyExecuted();
    error WillNotActive();
    error InsufficientBalance();
    error NotGuardian();
    error GuardianThresholdNotMet();
    error InvalidGuardianThreshold();
    
    // ============ Modifiers ============
    
    modifier willExists(uint256 willId) {
        if (_wills[willId].owner == address(0)) revert WillNotFound();
        _;
    }
    
    modifier onlyWillOwner(uint256 willId) {
        if (_wills[willId].owner != msg.sender) revert Unauthorized();
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Create a new will with allocations
     * @param recipients Array of recipient addresses
     * @param percentages Array of percentages (basis points: 10000 = 100%)
     * @param nftOnlyFlags Array of NFT-only flags
     * @param tokenAddresses Array of token addresses (0x0 for all/native)
     * @param charityDAOFlags Array of charity DAO flags
     * @param metadataHash IPFS hash of legal will document
     * @param requiresGuardianAttestation Whether guardian approval is required
     * @param guardians Array of guardian addresses (if attestation required)
     * @param guardianThreshold Number of guardians required for execution
     * @return willId The ID of the newly created will
     */
    function createWill(
        address[] calldata recipients,
        uint256[] calldata percentages,
        bool[] calldata nftOnlyFlags,
        address[] calldata tokenAddresses,
        bool[] calldata charityDAOFlags,
        string calldata metadataHash,
        bool requiresGuardianAttestation,
        address[] calldata guardians,
        uint256 guardianThreshold
    ) external payable returns (uint256 willId) {
        // Validate input arrays match
        uint256 allocationCount = recipients.length;
        if (allocationCount == 0 || 
            percentages.length != allocationCount ||
            nftOnlyFlags.length != allocationCount ||
            tokenAddresses.length != allocationCount ||
            charityDAOFlags.length != allocationCount) {
            revert InvalidAllocation();
        }
        
        // Validate allocations
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < allocationCount; i++) {
            if (recipients[i] == address(0)) revert InvalidAllocation();
            if (percentages[i] == 0 || percentages[i] > 10000) {
                revert InvalidPercentage();
            }
            totalPercentage += percentages[i];
        }
        
        // Total must equal 100%
        if (totalPercentage != 10000) revert InvalidPercentage();
        
        // Validate guardian setup
        if (requiresGuardianAttestation) {
            if (guardians.length == 0) revert InvalidGuardianThreshold();
            if (guardianThreshold == 0 || guardianThreshold > guardians.length) {
                revert InvalidGuardianThreshold();
            }
        }
        
        // Pay setup fee if required - use Checks-Effects-Interactions pattern
        uint256 refundAmount = 0;
        uint256 feeAmount = 0;
        if (setupFee > 0) {
            if (msg.value < setupFee) revert InsufficientBalance();
            feeAmount = setupFee;
            if (msg.value > setupFee) {
                refundAmount = msg.value - setupFee;
            }
        }
        
        // Update state first (Effects)
        willId = _nextWillId++;
        
        Will storage will = _wills[willId];
        will.owner = msg.sender;
        will.metadataHash = metadataHash;
        will.createdAt = block.timestamp;
        will.isActive = true;
        will.requiresGuardianAttestation = requiresGuardianAttestation;
        will.guardianThreshold = guardianThreshold;
        
        // Store allocations
        for (uint256 i = 0; i < allocationCount; i++) {
            will.allocations.push(Allocation({
                recipient: recipients[i],
                percentage: percentages[i],
                nftOnly: nftOnlyFlags[i],
                tokenAddress: tokenAddresses[i],
                isCharityDAO: charityDAOFlags[i]
            }));
        }
        
        // Store guardians
        for (uint256 i = 0; i < guardians.length; i++) {
            will.guardians.push(guardians[i]);
        }
        
        _ownerWills[msg.sender].push(willId);
        _lastFeePayment[willId] = block.timestamp;
        
        emit WillCreated(willId, msg.sender, allocationCount, block.timestamp);
        
        // External calls last (Interactions) - after state updates
        if (refundAmount > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: refundAmount}("");
            require(refundSuccess, "Refund transfer failed");
        }
        if (feeAmount > 0) {
            (bool feeSuccess, ) = payable(feeRecipient).call{value: feeAmount}("");
            require(feeSuccess, "Fee transfer failed");
        }
    }
    
    /**
     * @notice Guardian approves will execution
     * @param willId The will to approve
     */
    function approveExecution(uint256 willId) external willExists(willId) {
        Will storage will = _wills[willId];
        
        if (!will.isActive || will.executedAt > 0) {
            revert WillNotActive();
        }
        
        if (!will.requiresGuardianAttestation) {
            revert InvalidGuardianThreshold();
        }
        
        // Check if caller is a guardian
        bool isGuardian = false;
        for (uint256 i = 0; i < will.guardians.length; i++) {
            if (will.guardians[i] == msg.sender) {
                isGuardian = true;
                break;
            }
        }
        
        if (!isGuardian) revert NotGuardian();
        if (will.guardianApproved[msg.sender]) revert Unauthorized(); // Already approved
        
        will.guardianApproved[msg.sender] = true;
        
        // Count approvals
        uint256 approvalCount = 0;
        for (uint256 i = 0; i < will.guardians.length; i++) {
            if (will.guardianApproved[will.guardians[i]]) {
                approvalCount++;
            }
        }
        
        bool canExecute = approvalCount >= will.guardianThreshold;
        
        emit GuardianApproved(willId, msg.sender, approvalCount, canExecute);
    }
    
    /**
     * @notice Execute will and distribute assets
     * @param willId The will to execute
     * @param tokenAddresses Array of ERC20 token addresses to distribute
     * @param nftAddresses Array of ERC721 NFT addresses to distribute
     * @param nftTokenIds Array of NFT token IDs (must match nftAddresses length)
     */
    function executeWill(
        uint256 willId,
        address[] calldata tokenAddresses,
        address[] calldata nftAddresses,
        uint256[] calldata nftTokenIds
    ) external nonReentrant willExists(willId) {
        Will storage will = _wills[willId];
        
        if (!will.isActive || will.executedAt > 0) {
            revert WillAlreadyExecuted();
        }
        
        // Check guardian approval if required
        if (will.requiresGuardianAttestation) {
            uint256 approvalCount = 0;
            for (uint256 i = 0; i < will.guardians.length; i++) {
                if (will.guardianApproved[will.guardians[i]]) {
                    approvalCount++;
                }
            }
            if (approvalCount < will.guardianThreshold) {
                revert GuardianThresholdNotMet();
            }
        }
        
        will.executedAt = block.timestamp;
        will.isActive = false;
        
        uint256 totalDistributed = 0;
        
        // Distribute native tokens (ETH/BNB/MATIC)
        uint256 nativeBalance = address(this).balance;
        if (nativeBalance > 0) {
            for (uint256 i = 0; i < will.allocations.length; i++) {
                if (!will.allocations[i].nftOnly && 
                    will.allocations[i].tokenAddress == address(0)) {
                    uint256 amount = (nativeBalance * will.allocations[i].percentage) / 10000;
                    if (amount > 0) {
                        // Use call pattern for ETH transfer (safe for all recipients)
                        (bool success, ) = payable(will.allocations[i].recipient).call{value: amount}("");
                        require(success, "Native token transfer failed");
                        totalDistributed += amount;
                        emit AllocationDistributed(
                            willId,
                            will.allocations[i].recipient,
                            amount,
                            AssetType.Native,
                            address(0)
                        );
                    }
                }
            }
        }
        
        // Distribute ERC20 tokens
        for (uint256 t = 0; t < tokenAddresses.length; t++) {
            IERC20 token = IERC20(tokenAddresses[t]);
            uint256 tokenBalance = token.balanceOf(address(this));
            
            if (tokenBalance > 0) {
                for (uint256 i = 0; i < will.allocations.length; i++) {
                    Allocation memory alloc = will.allocations[i];
                    
                    // Skip if NFT-only or specific token mismatch
                    if (alloc.nftOnly) continue;
                    if (alloc.tokenAddress != address(0) && alloc.tokenAddress != tokenAddresses[t]) {
                        continue;
                    }
                    
                    uint256 amount = (tokenBalance * alloc.percentage) / 10000;
                    if (amount > 0) {
                        // Use SafeERC20 for token transfers
                        token.safeTransfer(alloc.recipient, amount);
                        emit AllocationDistributed(
                            willId,
                            alloc.recipient,
                            amount,
                            AssetType.ERC20,
                            tokenAddresses[t]
                        );
                    }
                }
            }
        }
        
        // Distribute NFTs
        for (uint256 n = 0; n < nftAddresses.length; n++) {
            IERC721 nft = IERC721(nftAddresses[n]);
            
            for (uint256 i = 0; i < will.allocations.length; i++) {
                Allocation memory alloc = will.allocations[i];
                
                // Skip if specific token address doesn't match (unless alloc is NFT-only)
                if (alloc.tokenAddress != address(0) && alloc.tokenAddress != nftAddresses[n]) {
                    if (!alloc.nftOnly) continue;
                }
                
                // For NFT distribution, we need a different strategy
                // This is simplified - in production, you'd need to handle NFT collections properly
                if (n < nftTokenIds.length) {
                    try nft.safeTransferFrom(address(this), alloc.recipient, nftTokenIds[n]) {
                        emit AllocationDistributed(
                            willId,
                            alloc.recipient,
                            nftTokenIds[n],
                            AssetType.ERC721,
                            nftAddresses[n]
                        );
                    } catch {
                        // NFT transfer failed, skip
                    }
                }
            }
        }
        
        emit WillExecuted(willId, msg.sender, block.timestamp, totalDistributed);
    }
    
    /**
     * @notice Pay annual maintenance fee
     * @param willId The will to pay fee for
     */
    function payAnnualFee(uint256 willId) external payable nonReentrant onlyWillOwner(willId) {
        if (annualFee == 0) revert InvalidAllocation();
        if (msg.value < annualFee) revert InsufficientBalance();
        
        // Calculate amounts
        uint256 refundAmount = 0;
        if (msg.value > annualFee) {
            refundAmount = msg.value - annualFee;
        }
        
        // Update state first (Effects)
        _lastFeePayment[willId] = block.timestamp;
        emit FeePaid(willId, annualFee, block.timestamp);
        
        // External calls last (Interactions)
        if (refundAmount > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: refundAmount}("");
            require(refundSuccess, "Refund transfer failed");
        }
        (bool feeSuccess, ) = payable(feeRecipient).call{value: annualFee}("");
        require(feeSuccess, "Fee transfer failed");
    }
    
    /**
     * @notice Update will allocations (only before execution)
     * @param willId The will to update
     * @param allocations New allocation array
     */
    function updateWill(
        uint256 willId,
        Allocation[] calldata allocations
    ) external onlyWillOwner(willId) willExists(willId) {
        Will storage will = _wills[willId];
        
        if (!will.isActive || will.executedAt > 0) {
            revert WillAlreadyExecuted();
        }
        
        // Validate allocations
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            if (allocations[i].recipient == address(0)) revert InvalidAllocation();
            if (allocations[i].percentage == 0 || allocations[i].percentage > 10000) {
                revert InvalidPercentage();
            }
            totalPercentage += allocations[i].percentage;
        }
        
        if (totalPercentage != 10000) revert InvalidPercentage();
        
        // Clear old allocations
        delete will.allocations;
        
        // Set new allocations
        for (uint256 i = 0; i < allocations.length; i++) {
            will.allocations.push(allocations[i]);
        }
    }
    
    /**
     * @notice Revoke will (deactivate)
     * @param willId The will to revoke
     */
    function revokeWill(uint256 willId) external onlyWillOwner(willId) willExists(willId) {
        Will storage will = _wills[willId];
        
        if (will.executedAt > 0) {
            revert WillAlreadyExecuted();
        }
        
        will.isActive = false;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get will information
     * @param willId The will to query
     */
    function getWill(uint256 willId) external view willExists(willId) returns (
        address owner,
        string memory metadataHash,
        Allocation[] memory allocations,
        uint256 createdAt,
        uint256 executedAt,
        bool isActive,
        bool requiresGuardianAttestation,
        address[] memory guardians,
        uint256 guardianThreshold
    ) {
        Will storage will = _wills[willId];
        return (
            will.owner,
            will.metadataHash,
            will.allocations,
            will.createdAt,
            will.executedAt,
            will.isActive,
            will.requiresGuardianAttestation,
            will.guardians,
            will.guardianThreshold
        );
    }
    
    /**
     * @notice Get all will IDs for an owner
     * @param owner The owner address
     * @return willIds Array of will IDs
     */
    function getOwnerWills(address owner) external view returns (uint256[] memory) {
        return _ownerWills[owner];
    }
    
    /**
     * @notice Check if guardian has approved execution
     * @param willId The will to check
     * @param guardian The guardian address
     * @return hasApproved True if guardian has approved
     */
    function hasGuardianApproved(uint256 willId, address guardian) external view returns (bool) {
        return _wills[willId].guardianApproved[guardian];
    }
    
    /**
     * @notice Get guardian approval count
     * @param willId The will to check
     * @return count Number of guardians who have approved
     */
    function getGuardianApprovalCount(uint256 willId) external view returns (uint256) {
        Will storage will = _wills[willId];
        uint256 count = 0;
        for (uint256 i = 0; i < will.guardians.length; i++) {
            if (will.guardianApproved[will.guardians[i]]) {
                count++;
            }
        }
        return count;
    }
}

