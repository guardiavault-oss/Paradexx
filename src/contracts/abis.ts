/**
 * DualGen Smart Contract ABIs
 * Simplified ABIs for frontend integration
 */

// GuardiaVault ABI - Core inheritance vault
export const GUARDIA_VAULT_ABI = [
  // Read Functions
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "getUserVault",
    "outputs": [
      { "name": "owner", "type": "address" },
      { "name": "beneficiaries", "type": "address[]" },
      { "name": "allocations", "type": "uint256[]" },
      { "name": "timelockDays", "type": "uint256" },
      { "name": "lastCheckIn", "type": "uint256" },
      { "name": "isActive", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "getVaultBalance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "getLastCheckIn",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "canClaimVault",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Write Functions
  {
    "inputs": [
      { "name": "beneficiaries", "type": "address[]" },
      { "name": "allocations", "type": "uint256[]" },
      { "name": "timelockDays", "type": "uint256" }
    ],
    "name": "createVault",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "checkIn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "timelockDays", "type": "uint256" }],
    "name": "updateTimelock",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "beneficiary", "type": "address" },
      { "name": "allocation", "type": "uint256" }
    ],
    "name": "addBeneficiary",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "beneficiary", "type": "address" }],
    "name": "removeBeneficiary",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "vaultOwner", "type": "address" }],
    "name": "claimVault",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "owner", "type": "address" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "VaultCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "owner", "type": "address" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "CheckIn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "vaultOwner", "type": "address" },
      { "indexed": true, "name": "beneficiary", "type": "address" },
      { "indexed": false, "name": "amount", "type": "uint256" }
    ],
    "name": "VaultClaimed",
    "type": "event"
  }
] as const;

// MultiSigRecovery ABI - Guardian recovery system
export const MULTI_SIG_RECOVERY_ABI = [
  // Constants
  {
    "inputs": [],
    "name": "RECOVERY_KEY_COUNT",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "RECOVERY_THRESHOLD",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TIME_LOCK_PERIOD",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Read Functions
  {
    "inputs": [{ "name": "recoveryId", "type": "uint256" }],
    "name": "getRecovery",
    "outputs": [
      { "name": "walletOwner", "type": "address" },
      { "name": "walletAddress", "type": "address" },
      { "name": "recoveryKeys", "type": "address[3]" },
      { "name": "createdAt", "type": "uint256" },
      { "name": "status", "type": "uint8" },
      { "name": "encryptedData", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "recoveryId", "type": "uint256" }],
    "name": "getRecoveryAttestationCount",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "recoveryId", "type": "uint256" },
      { "name": "recoveryKey", "type": "address" }
    ],
    "name": "hasRecoveryKeyAttested",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "recoveryId", "type": "uint256" }],
    "name": "getTimeUntilRecovery",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "recoveryId", "type": "uint256" }],
    "name": "canCompleteRecovery",
    "outputs": [
      { "name": "canComplete", "type": "bool" },
      { "name": "timeRemaining", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "recoveryId", "type": "uint256" },
      { "name": "recoveryKey", "type": "address" }
    ],
    "name": "isRecoveryKey",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Write Functions
  {
    "inputs": [
      { "name": "walletAddress", "type": "address" },
      { "name": "recoveryKeys", "type": "address[3]" },
      { "name": "encryptedData", "type": "string" }
    ],
    "name": "createRecovery",
    "outputs": [{ "name": "recoveryId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "recoveryId", "type": "uint256" }],
    "name": "attestRecovery",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "recoveryId", "type": "uint256" }],
    "name": "completeRecovery",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "recoveryId", "type": "uint256" }],
    "name": "cancelRecovery",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "recoveryId", "type": "uint256" },
      { "indexed": true, "name": "walletOwner", "type": "address" },
      { "indexed": true, "name": "walletAddress", "type": "address" },
      { "indexed": false, "name": "recoveryKeys", "type": "address[3]" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "RecoveryCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "recoveryId", "type": "uint256" },
      { "indexed": true, "name": "recoveryKey", "type": "address" },
      { "indexed": false, "name": "attestationCount", "type": "uint256" },
      { "indexed": false, "name": "triggered", "type": "bool" }
    ],
    "name": "RecoveryKeyAttested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "recoveryId", "type": "uint256" },
      { "indexed": false, "name": "timestamp", "type": "uint256" },
      { "indexed": false, "name": "unlockTime", "type": "uint256" }
    ],
    "name": "RecoveryTriggered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "recoveryId", "type": "uint256" },
      { "indexed": true, "name": "walletAddress", "type": "address" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "RecoveryCompleted",
    "type": "event"
  }
] as const;

// GuardianAttestationRegistry ABI
export const GUARDIAN_ATTESTATION_ABI = [
  {
    "inputs": [{ "name": "attestationHash", "type": "bytes32" }],
    "name": "publishAttestation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "attestationHash", "type": "bytes32" }],
    "name": "revokeAttestation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "issuer", "type": "address" },
      { "name": "attestationHash", "type": "bytes32" }
    ],
    "name": "isAttestationValid",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "issuers", "type": "address[]" },
      { "name": "attestationHashes", "type": "bytes32[]" }
    ],
    "name": "batchIsAttestationValid",
    "outputs": [{ "name": "", "type": "bool[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "issuer", "type": "address" },
      { "indexed": true, "name": "attestationHash", "type": "bytes32" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "AttestationPublished",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "issuer", "type": "address" },
      { "indexed": true, "name": "attestationHash", "type": "bytes32" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "AttestationRevoked",
    "type": "event"
  }
] as const;

// YieldVault ABI
export const YIELD_VAULT_ABI = [
  {
    "inputs": [{ "name": "amount", "type": "uint256" }],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "amount", "type": "uint256" }],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "getBalance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "getPendingYield",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimYield",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalDeposits",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentAPY",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
