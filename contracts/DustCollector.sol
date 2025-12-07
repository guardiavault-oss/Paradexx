// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title DustCollector
 * @notice Efficiently collects and redistributes dust tokens with minimal gas costs
 */
contract DustCollector is Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;
    
    // Events
    event DustDonated(address indexed donor, address indexed token, uint256 amount, uint256 batchId);
    event BatchProcessed(uint256 indexed batchId, address indexed recipient, uint256 totalValue);
    event RecipientAdded(address indexed recipient, string verificationLevel);
    event RelayerUpdated(address indexed relayer, bool authorized);
    
    // Structs
    struct DonationCommitment {
        address donor;
        address token;
        uint256 amount;
        address recipient;
        uint256 nonce;
        uint256 deadline;
    }
    
    struct Batch {
        uint256 id;
        address[] tokens;
        uint256[] amounts;
        address recipient;
        bool processed;
        uint256 timestamp;
    }
    
    struct Recipient {
        bool isActive;
        string verificationLevel;
        uint256 totalReceived;
        uint256 lastReceived;
    }
    
    // State variables
    mapping(address => uint256) public nonces;
    mapping(address => bool) public authorizedRelayers;
    mapping(address => Recipient) public recipients;
    mapping(uint256 => Batch) public batches;
    mapping(bytes32 => bool) public processedCommitments;
    
    uint256 public batchCounter;
    uint256 public constant DUST_THRESHOLD = 1e18; // $1 worth in base units
    uint256 public constant MIN_BATCH_SIZE = 5;
    
    // EIP-712 type hash
    bytes32 public constant DONATION_TYPEHASH = keccak256(
        "DustDonation(address donor,address token,uint256 amount,address recipient,uint256 nonce,uint256 deadline)"
    );
    
    constructor() EIP712("GuardianX Dust Collection", "1") Ownable() {}
    
    /**
     * @notice Process multiple dust donations in a single transaction
     * @param commitments Array of signed donation commitments
     * @param signatures Array of signatures for each commitment
     * @param recipient Address to receive the collected dust
     */
    function processDonationBatch(
        DonationCommitment[] calldata commitments,
        bytes[] calldata signatures,
        address recipient
    ) external nonReentrant {
        require(authorizedRelayers[msg.sender] || msg.sender == owner(), "Not authorized");
        require(recipients[recipient].isActive, "Invalid recipient");
        require(commitments.length >= MIN_BATCH_SIZE, "Batch too small");
        require(commitments.length == signatures.length, "Array length mismatch");
        
        uint256 batchId = ++batchCounter;
        Batch storage batch = batches[batchId];
        batch.id = batchId;
        batch.recipient = recipient;
        batch.timestamp = block.timestamp;
        
        for (uint256 i = 0; i < commitments.length; i++) {
            DonationCommitment calldata commitment = commitments[i];
            
            // Verify signature
            require(verifyDonationSignature(commitment, signatures[i]), "Invalid signature");
            
            // Check deadline
            require(block.timestamp <= commitment.deadline, "Commitment expired");
            
            // Check nonce
            require(commitment.nonce == nonces[commitment.donor]++, "Invalid nonce");
            
            // Mark as processed to prevent replay
            bytes32 commitmentHash = hashCommitment(commitment);
            require(!processedCommitments[commitmentHash], "Already processed");
            processedCommitments[commitmentHash] = true;
            
            // Transfer tokens from donor to this contract
            IERC20(commitment.token).transferFrom(
                commitment.donor,
                address(this),
                commitment.amount
            );
            
            batch.tokens.push(commitment.token);
            batch.amounts.push(commitment.amount);
            
            emit DustDonated(commitment.donor, commitment.token, commitment.amount, batchId);
        }
        
        // Transfer collected tokens to recipient
        _transferBatchToRecipient(batch);
        
        batch.processed = true;
        recipients[recipient].totalReceived += batch.tokens.length;
        recipients[recipient].lastReceived = block.timestamp;
        
        emit BatchProcessed(batchId, recipient, batch.tokens.length);
    }
    
    /**
     * @notice Process a single donation using meta-transaction
     * @param commitment Signed donation commitment
     * @param signature Signature for the commitment
     */
    function processSingleDonation(
        DonationCommitment calldata commitment,
        bytes calldata signature
    ) external nonReentrant {
        require(authorizedRelayers[msg.sender], "Not authorized relayer");
        require(verifyDonationSignature(commitment, signature), "Invalid signature");
        require(block.timestamp <= commitment.deadline, "Commitment expired");
        require(commitment.nonce == nonces[commitment.donor]++, "Invalid nonce");
        
        bytes32 commitmentHash = hashCommitment(commitment);
        require(!processedCommitments[commitmentHash], "Already processed");
        processedCommitments[commitmentHash] = true;
        
        address recipient = commitment.recipient != address(0) 
            ? commitment.recipient 
            : selectRecipient();
            
        require(recipients[recipient].isActive, "Invalid recipient");
        
        // Direct transfer from donor to recipient
        IERC20(commitment.token).transferFrom(
            commitment.donor,
            recipient,
            commitment.amount
        );
        
        recipients[recipient].totalReceived++;
        recipients[recipient].lastReceived = block.timestamp;
        
        emit DustDonated(commitment.donor, commitment.token, commitment.amount, 0);
    }
    
    /**
     * @notice Verify a donation signature
     */
    function verifyDonationSignature(
        DonationCommitment calldata commitment,
        bytes calldata signature
    ) public view returns (bool) {
        bytes32 structHash = keccak256(abi.encode(
            DONATION_TYPEHASH,
            commitment.donor,
            commitment.token,
            commitment.amount,
            commitment.recipient,
            commitment.nonce,
            commitment.deadline
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        
        return signer == commitment.donor;
    }
    
    /**
     * @notice Hash a commitment for tracking
     */
    function hashCommitment(DonationCommitment calldata commitment) public pure returns (bytes32) {
        return keccak256(abi.encode(commitment));
    }
    
    /**
     * @notice Transfer batch tokens to recipient
     */
    function _transferBatchToRecipient(Batch storage batch) private {
        for (uint256 i = 0; i < batch.tokens.length; i++) {
            uint256 balance = IERC20(batch.tokens[i]).balanceOf(address(this));
            if (balance > 0) {
                IERC20(batch.tokens[i]).transfer(batch.recipient, balance);
            }
        }
    }
    
    /**
     * @notice Select a recipient based on fair distribution
     */
    function selectRecipient() public view returns (address) {
        // Implement fair distribution logic
        // For now, return the first active recipient
        // In production, this would use a more sophisticated algorithm
        return owner();
    }
    
    /**
     * @notice Add or update a recipient
     */
    function updateRecipient(
        address recipient,
        bool isActive,
        string calldata verificationLevel
    ) external onlyOwner {
        recipients[recipient].isActive = isActive;
        recipients[recipient].verificationLevel = verificationLevel;
        emit RecipientAdded(recipient, verificationLevel);
    }
    
    /**
     * @notice Update relayer authorization
     */
    function updateRelayer(address relayer, bool authorized) external onlyOwner {
        authorizedRelayers[relayer] = authorized;
        emit RelayerUpdated(relayer, authorized);
    }
    
    /**
     * @notice Emergency token recovery
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
    
    /**
     * @notice Get current nonce for an address
     */
    function getNonce(address donor) external view returns (uint256) {
        return nonces[donor];
    }
}
