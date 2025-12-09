/**
 * Smart Will Contract Integration Service
 * Handles on-chain will initialization and deployment
 */

import { ethers } from "ethers";
import { logInfo, logError } from "./logger";

// SmartWill contract ABI (simplified - use full ABI in production)
const SMARTWILL_ABI = [
  "function createWill(address[] calldata recipients, uint256[] calldata percentages, bool[] calldata nftOnlyFlags, address[] calldata tokenAddresses, bool[] calldata charityDAOFlags, string calldata metadataHash, bool requiresGuardianAttestation, address[] calldata guardians, uint256 guardianThreshold) external payable returns (uint256 willId)",
  "function getWill(uint256 willId) external view returns (address owner, string memory metadataHash, tuple(address recipient, uint256 percentage, bool nftOnly, address tokenAddress, bool isCharityDAO)[] allocations, uint256 createdAt, uint256 executedAt, bool isActive, bool requiresGuardianAttestation, address[] guardians, uint256 guardianThreshold)",
  "event WillCreated(uint256 indexed willId, address indexed owner, uint256 allocationCount, uint256 timestamp)",
];

export interface WillDeploymentParams {
  recipients: string[];
  percentages: number[]; // Basis points (10000 = 100%)
  nftOnlyFlags: boolean[];
  tokenAddresses: string[];
  charityDAOFlags: boolean[];
  metadataHash: string;
  requiresGuardianAttestation: boolean;
  guardians: string[];
  guardianThreshold: number;
}

export interface WillDeploymentResult {
  willId: number;
  transactionHash: string;
  contractAddress: string;
  blockNumber: number;
}

/**
 * Initialize will on-chain via SmartWill contract
 */
export async function initializeWillOnChain(
  params: WillDeploymentParams,
  walletPrivateKey?: string
): Promise<WillDeploymentResult> {
  try {
    const contractAddress = process.env.SMARTWILL_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error("SMARTWILL_CONTRACT_ADDRESS not configured");
    }

    // Get provider (use environment variables for RPC)
    const rpcUrl = process.env.ETH_RPC_URL || process.env.JSON_RPC_URL || "http://localhost:8545";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Get signer (use operator wallet or provided private key)
    let signer: ethers.Wallet;
    if (walletPrivateKey) {
      signer = new ethers.Wallet(walletPrivateKey, provider);
    } else if (process.env.OPERATOR_PRIVATE_KEY) {
      signer = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
    } else {
      throw new Error("No wallet available for signing. Provide walletPrivateKey or set OPERATOR_PRIVATE_KEY");
    }

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, SMARTWILL_ABI, signer);

    // Validate arrays match
    const { recipients, percentages, nftOnlyFlags, tokenAddresses, charityDAOFlags } = params;
    if (
      recipients.length !== percentages.length ||
      percentages.length !== nftOnlyFlags.length ||
      nftOnlyFlags.length !== tokenAddresses.length ||
      tokenAddresses.length !== charityDAOFlags.length
    ) {
      throw new Error("Array lengths do not match");
    }

    // Validate percentages sum to 10000 (100%)
    const totalPercent = percentages.reduce((sum, p) => sum + p, 0);
    if (totalPercent !== 10000) {
      throw new Error(`Total percentage must equal 10000 (100%), got ${totalPercent}`);
    }

    // Call createWill
    logInfo("Initializing will on-chain", {
      contractAddress,
      recipientCount: recipients.length,
      hasGuardians: params.guardians.length > 0,
    });

    const tx = await contract.createWill(
      recipients,
      percentages,
      nftOnlyFlags,
      tokenAddresses,
      charityDAOFlags,
      params.metadataHash,
      params.requiresGuardianAttestation,
      params.guardians,
      params.guardianThreshold,
      {
        value: 0, // No ETH required for will creation (unless contract has setup fee)
      }
    );

    // Wait for transaction
    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Transaction receipt not found");
    }

    // Parse event to get willId
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "WillCreated";
      } catch {
        return false;
      }
    });

    let willId: number;
    if (event) {
      const parsed = contract.interface.parseLog(event);
      willId = Number(parsed?.args.willId || 0);
    } else {
      // Fallback: query the contract for the latest will
      // This is a simplified approach - in production, use proper event parsing
      willId = 0; // Will need to be determined from contract state
      logError(new Error("WillCreated event not found"), { context: "will_initialization" });
    }

    logInfo("Will initialized on-chain", {
      willId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });

    return {
      willId,
      transactionHash: receipt.hash,
      contractAddress,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    logError(error as Error, { context: "initialize_will_onchain", params });
    throw error;
  }
}

/**
 * Get will information from contract
 */
export async function getWillFromContract(
  willId: number,
  contractAddress: string
): Promise<any> {
  try {
    const rpcUrl = process.env.ETH_RPC_URL || process.env.JSON_RPC_URL || "http://localhost:8545";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, SMARTWILL_ABI, provider);

    const will = await contract.getWill(willId);
    return {
      owner: will[0],
      metadataHash: will[1],
      allocations: will[2],
      createdAt: Number(will[3]),
      executedAt: Number(will[4]),
      isActive: will[5],
      requiresGuardianAttestation: will[6],
      guardians: will[7],
      guardianThreshold: Number(will[8]),
    };
  } catch (error) {
    logError(error as Error, { context: "get_will_from_contract", willId });
    throw error;
  }
}

