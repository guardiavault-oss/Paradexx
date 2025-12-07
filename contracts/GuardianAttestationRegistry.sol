// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title GuardianAttestationRegistry
 * @notice On-chain registry for GuardianX safety attestations
 * @dev Stores attestation hashes on-chain (lightweight). Actual attestation data stored off-chain (IPFS/Ceramic).
 */
interface IGuardianAttestation {
    event AttestationPublished(
        address indexed issuer,
        bytes32 indexed attestationHash,
        uint256 timestamp
    );
    
    event AttestationRevoked(
        address indexed issuer,
        bytes32 indexed attestationHash,
        uint256 timestamp
    );
    
    /**
     * @notice Publish an attestation hash to the registry
     * @param attestationHash The hash of the attestation (off-chain)
     */
    function publishAttestation(bytes32 attestationHash) external;
    
    /**
     * @notice Revoke an attestation
     * @param attestationHash The hash of the attestation to revoke
     */
    function revokeAttestation(bytes32 attestationHash) external;
    
    /**
     * @notice Check if an attestation is valid (published and not revoked)
     * @param issuer The address that issued the attestation
     * @param attestationHash The hash of the attestation
     * @return true if the attestation is valid, false otherwise
     */
    function isAttestationValid(address issuer, bytes32 attestationHash) external view returns (bool);
}

/**
 * @title GuardianAttestationRegistry
 * @notice On-chain registry for GuardianX safety attestations
 * @dev Stores attestation hashes on-chain (lightweight). Actual attestation data stored off-chain (IPFS/Ceramic).
 */
contract GuardianAttestationRegistry is IGuardianAttestation {
    // Mapping: issuer => attestationHash => isPublished
    mapping(address => mapping(bytes32 => bool)) public attestations;
    
    // Mapping: issuer => attestationHash => isRevoked
    mapping(address => mapping(bytes32 => bool)) public revokedAttestations;
    
    /**
     * @notice Publish an attestation hash to the registry
     * @param attestationHash The hash of the attestation (off-chain)
     * @dev Reverts if attestation already published
     */
    function publishAttestation(bytes32 attestationHash) external override {
        require(
            !attestations[msg.sender][attestationHash],
            "GuardianAttestationRegistry: Attestation already published"
        );
        
        attestations[msg.sender][attestationHash] = true;
        
        emit AttestationPublished(msg.sender, attestationHash, block.timestamp);
    }
    
    /**
     * @notice Revoke an attestation
     * @param attestationHash The hash of the attestation to revoke
     * @dev Reverts if attestation not found or already revoked
     */
    function revokeAttestation(bytes32 attestationHash) external override {
        require(
            attestations[msg.sender][attestationHash],
            "GuardianAttestationRegistry: Attestation not found"
        );
        require(
            !revokedAttestations[msg.sender][attestationHash],
            "GuardianAttestationRegistry: Attestation already revoked"
        );
        
        revokedAttestations[msg.sender][attestationHash] = true;
        
        emit AttestationRevoked(msg.sender, attestationHash, block.timestamp);
    }
    
    /**
     * @notice Check if an attestation is valid (published and not revoked)
     * @param issuer The address that issued the attestation
     * @param attestationHash The hash of the attestation
     * @return true if the attestation is valid, false otherwise
     */
    function isAttestationValid(address issuer, bytes32 attestationHash) external view override returns (bool) {
        return attestations[issuer][attestationHash] && !revokedAttestations[issuer][attestationHash];
    }
    
    /**
     * @notice Batch check multiple attestations
     * @param issuers Array of issuer addresses
     * @param attestationHashes Array of attestation hashes
     * @return Array of boolean values indicating validity
     */
    function batchIsAttestationValid(
        address[] calldata issuers,
        bytes32[] calldata attestationHashes
    ) external view returns (bool[] memory) {
        require(
            issuers.length == attestationHashes.length,
            "GuardianAttestationRegistry: Arrays length mismatch"
        );
        
        bool[] memory results = new bool[](issuers.length);
        
        for (uint256 i = 0; i < issuers.length; i++) {
            results[i] = attestations[issuers[i]][attestationHashes[i]] && 
                        !revokedAttestations[issuers[i]][attestationHashes[i]];
        }
        
        return results;
    }
}

