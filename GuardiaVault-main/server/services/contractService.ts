import { ethers } from 'ethers';
import { logInfo, logError } from './logger';

// Minimal ABI interfaces for the contracts until artifacts are compiled
const GuardiaVaultABI = [
  "function createVault(uint256 checkInInterval, uint256 gracePeriod, address[] memory guardians, address[] memory beneficiaries) external returns (uint256)",
  "function checkIn(uint256 vaultId) external",
  "function triggerVault(uint256 vaultId) external",
  "event VaultCreated(uint256 indexed vaultId, address indexed owner)"
];

const MultiSigRecoveryABI = [
  "function createRecovery(address walletAddress, address[3] memory recoveryKeys, string memory encryptedData) external returns (uint256)",
  "function attestRecovery(uint256 recoveryId) external",
  "function completeRecovery(uint256 recoveryId) external returns (string memory)",
  "function getRecovery(uint256 recoveryId) external view returns (address walletOwner, address walletAddress, uint8 status, uint256 attestationCount, uint256 requiredAttestations)",
  "event RecoveryCreated(uint256 indexed recoveryId, address indexed walletOwner, address walletAddress)",
  "event RecoveryAttested(uint256 indexed recoveryId, address indexed recoveryKey, uint256 attestationCount)",
  "event RecoveryCompleted(uint256 indexed recoveryId, address indexed beneficiary, string encryptedData)"
];

const SmartWillABI = [
  "function createWill(address[] memory beneficiaries, uint256[] memory percentages, string memory metadataHash, address[] memory guardians, uint256 guardianThreshold) external returns (uint256)",
  "function executeWill(uint256 willId) external",
  "function getWill(uint256 willId) external view returns (address owner, bool isActive, uint256 createdAt, uint256 executedAt)",
  "event WillCreated(uint256 indexed willId, address indexed owner, string metadataHash)",
  "event WillExecuted(uint256 indexed willId, address indexed executor)"
];

interface ContractConfig {
  rpcUrl: string;
  privateKey: string;
  guardiaVaultAddress: string;
  recoveryAddress: string;
  willFactoryAddress: string;
}

export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private guardiaVault: ethers.Contract;
  private recovery: ethers.Contract;
  private willFactory: ethers.Contract;

  constructor(config: ContractConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.signer = new ethers.Wallet(config.privateKey, this.provider);

    this.guardiaVault = new ethers.Contract(
      config.guardiaVaultAddress,
      GuardiaVaultABI,
      this.signer
    );

    this.recovery = new ethers.Contract(
      config.recoveryAddress,
      MultiSigRecoveryABI,
      this.signer
    );

    this.willFactory = new ethers.Contract(
      config.willFactoryAddress,
      SmartWillABI,
      this.signer
    );
  }

  async deploySmartWill(
    beneficiaries: string[],
    shares: number[],
    encryptedData: string,
    releaseConditions: {
      requiredGuardianApprovals: number;
      timelock: number;
    }
  ): Promise<{ contractAddress: string; transactionHash: string }> {
    try {
      logInfo('Deploying smart will contract', { beneficiaries: beneficiaries.length });

      // Validate inputs
      if (beneficiaries.length !== shares.length) {
        throw new Error('Beneficiaries and shares length mismatch');
      }
      if (shares.reduce((a, b) => a + b, 0) !== 100) {
        throw new Error('Shares must sum to 100%');
      }

      // Convert percentages to basis points (1% = 100 basis points)
      const percentagesInBasisPoints = shares.map(share => share * 100);

      // Create will on-chain
      const tx = await this.willFactory.createWill(
        beneficiaries,
        percentagesInBasisPoints,
        encryptedData,
        [], // guardians (empty for now, can be added later)
        releaseConditions.requiredGuardianApprovals
      );

      const receipt = await tx.wait();

      // Parse the WillCreated event to get the will ID
      let willId = 0;
      let contractAddress = this.willFactory.target as string;

      for (const log of receipt.logs) {
        try {
          const parsed = this.willFactory.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          if (parsed && parsed.name === 'WillCreated') {
            willId = Number(parsed.args[0]);
            break;
          }
        } catch (e) {
          // Skip logs that don't match our ABI
          continue;
        }
      }

      logInfo('Smart will deployed successfully', {
        contractAddress,
        willId,
        transactionHash: receipt.hash
      });

      return {
        contractAddress,
        transactionHash: receipt.hash
      };
    } catch (error: any) {
      logError(error, { context: 'deploySmartWill' });
      throw new Error(`Failed to deploy smart will: ${error.message}`);
    }
  }

  async initiateRecovery(
    vaultId: string,
    beneficiaryAddress: string,
    encryptedShares: string[],
    requiredApprovals: number
  ): Promise<{ recoveryId: string; transactionHash: string }> {
    try {
      logInfo('Initiating recovery on-chain', { vaultId, beneficiaryAddress });

      // For recovery, we need exactly 3 recovery keys
      if (encryptedShares.length !== 3) {
        throw new Error('Exactly 3 recovery keys required for 2-of-3 multisig');
      }

      // Convert encryptedShares to recovery key addresses
      // In production, these would be the actual guardian addresses
      const recoveryKeys: [string, string, string] = [
        encryptedShares[0] || ethers.ZeroAddress,
        encryptedShares[1] || ethers.ZeroAddress,
        encryptedShares[2] || ethers.ZeroAddress
      ];

      const tx = await this.recovery.createRecovery(
        beneficiaryAddress,
        recoveryKeys,
        vaultId // Store vaultId as encrypted data for now
      );

      const receipt = await tx.wait();

      // Parse event to get recovery ID
      let recoveryId = '0';
      for (const log of receipt.logs) {
        try {
          const parsed = this.recovery.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          if (parsed && parsed.name === 'RecoveryCreated') {
            recoveryId = parsed.args[0].toString();
            break;
          }
        } catch (e) {
          continue;
        }
      }

      logInfo('Recovery initiated successfully', {
        recoveryId,
        transactionHash: receipt.hash
      });

      return {
        recoveryId,
        transactionHash: receipt.hash
      };
    } catch (error: any) {
      logError(error, { context: 'initiateRecovery' });
      throw new Error(`Failed to initiate recovery: ${error.message}`);
    }
  }

  async attestRecovery(
    recoveryId: string,
    guardianAddress: string,
    signature: string
  ): Promise<{ transactionHash: string; approvalsCount: number }> {
    try {
      logInfo('Attesting recovery on-chain', { recoveryId, guardianAddress });

      const tx = await this.recovery.attestRecovery(recoveryId);
      const receipt = await tx.wait();

      // Get current approval count from the event or by querying the contract
      let approvalsCount = 0;
      for (const log of receipt.logs) {
        try {
          const parsed = this.recovery.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          if (parsed && parsed.name === 'RecoveryAttested') {
            approvalsCount = Number(parsed.args[2]); // attestationCount from event
            break;
          }
        } catch (e) {
          continue;
        }
      }

      logInfo('Recovery attested successfully', {
        transactionHash: receipt.hash,
        approvalsCount
      });

      return {
        transactionHash: receipt.hash,
        approvalsCount
      };
    } catch (error: any) {
      logError(error, { context: 'attestRecovery' });
      throw new Error(`Failed to attest recovery: ${error.message}`);
    }
  }

  async completeRecovery(
    recoveryId: string,
    beneficiaryAddress: string
  ): Promise<{ transactionHash: string; vaultData: string }> {
    try {
      logInfo('Completing recovery on-chain', { recoveryId, beneficiaryAddress });

      // Verify sufficient approvals
      const recoveryData = await this.recovery.getRecovery(recoveryId);
      const [, , status, attestationCount, requiredAttestations] = recoveryData;

      if (Number(attestationCount) < Number(requiredAttestations)) {
        throw new Error(`Insufficient guardian approvals: ${attestationCount}/${requiredAttestations}`);
      }

      const tx = await this.recovery.completeRecovery(recoveryId);
      const receipt = await tx.wait();

      // Get vault data from event
      let vaultData = '';
      for (const log of receipt.logs) {
        try {
          const parsed = this.recovery.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          if (parsed && parsed.name === 'RecoveryCompleted') {
            vaultData = parsed.args[2]; // encryptedData from event
            break;
          }
        } catch (e) {
          continue;
        }
      }

      logInfo('Recovery completed successfully', {
        transactionHash: receipt.hash
      });

      return {
        transactionHash: receipt.hash,
        vaultData
      };
    } catch (error: any) {
      logError(error, { context: 'completeRecovery' });
      throw new Error(`Failed to complete recovery: ${error.message}`);
    }
  }

  async verifyRecoveryStatus(recoveryId: string): Promise<{
    isActive: boolean;
    approvalsCount: number;
    requiredApprovals: number;
    beneficiary: string;
  }> {
    try {
      const recoveryData = await this.recovery.getRecovery(recoveryId);
      const [, walletAddress, status, attestationCount, requiredAttestations] = recoveryData;

      return {
        isActive: Number(status) === 0 || Number(status) === 1, // Active or Triggered
        approvalsCount: Number(attestationCount),
        requiredApprovals: Number(requiredAttestations),
        beneficiary: walletAddress
      };
    } catch (error: any) {
      logError(error, { context: 'verifyRecoveryStatus' });
      throw new Error(`Failed to verify recovery status: ${error.message}`);
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    contract: ethers.Contract,
    method: string,
    args: any[]
  ): Promise<bigint> {
    try {
      const gasEstimate = await contract[method].estimateGas(...args);
      // Add 20% buffer for safety
      return (gasEstimate * 120n) / 100n;
    } catch (error: any) {
      logError(error, { context: 'estimateGas', method });
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }

  /**
   * Get current gas price with multiplier
   */
  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || 0n;
      // Add 10% buffer for faster confirmation
      return (gasPrice * 110n) / 100n;
    } catch (error: any) {
      logError(error, { context: 'getGasPrice' });
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  }
}

// Singleton instance
let contractServiceInstance: ContractService | null = null;

export function getContractService(): ContractService {
  if (!contractServiceInstance) {
    const config: ContractConfig = {
      rpcUrl: process.env.RPC_URL || '',
      privateKey: process.env.CONTRACT_DEPLOYER_PRIVATE_KEY || '',
      guardiaVaultAddress: process.env.GUARDIA_VAULT_ADDRESS || '',
      recoveryAddress: process.env.RECOVERY_CONTRACT_ADDRESS || '',
      willFactoryAddress: process.env.WILL_FACTORY_ADDRESS || ''
    };

    // Validate config
    if (!config.rpcUrl || !config.privateKey) {
      throw new Error('Missing required contract service configuration: RPC_URL and CONTRACT_DEPLOYER_PRIVATE_KEY are required');
    }

    if (!config.guardiaVaultAddress || !config.recoveryAddress || !config.willFactoryAddress) {
      throw new Error('Missing required contract addresses: GUARDIA_VAULT_ADDRESS, RECOVERY_CONTRACT_ADDRESS, and WILL_FACTORY_ADDRESS are required');
    }

    contractServiceInstance = new ContractService(config);
  }

  return contractServiceInstance;
}
