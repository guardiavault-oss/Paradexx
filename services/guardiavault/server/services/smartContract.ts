/**
 * Smart Contract Integration Service
 * Manages deployment and interaction with GuardiaVault smart contracts
 */

import { db } from "../db";
import {
  vaultSmartContracts,
  insertVaultSmartContractSchema,
  type InsertVaultSmartContract,
} from "@shared/schema";
import { eq } from "../utils/drizzle-exports";
import { logInfo, logError } from "./logger";
import { ethers } from "ethers";

// Contract ABI (simplified - import full ABI in production)
const GUARDIA_VAULT_ABI = [
  "function createVault(uint256 checkInInterval, uint256 gracePeriod, address[] calldata beneficiaries) external returns (uint256)",
  "function checkIn(uint256 vaultId, bytes calldata signature) external",
  "function updateVaultStatus(uint256 vaultId) external",
  "function claim(uint256 vaultId) external",
  "function attestOwnerInactive(uint256 vaultId) external",
  "event VaultCreated(uint256 indexed vaultId, address indexed owner)",
  "event VaultTriggered(uint256 indexed vaultId, uint256 timestamp, uint8 status)",
  "event BeneficiaryClaimed(uint256 indexed vaultId, address indexed beneficiary)",
];

export interface DeploymentConfig {
  vaultId: string;
  ownerAddress: string;
  checkInIntervalDays: number;
  gracePeriodDays: number;
  beneficiaryAddresses: string[];
  network?: string; // ethereum, polygon, etc.
}

export class SmartContractService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private contractAddress: string | null = null;

  constructor() {
    // Initialize provider from environment
    const rpcUrl = process.env.ETHEREUM_RPC_URL;
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    const contractAddr = process.env.GUARDIAVAULT_CONTRACT_ADDRESS;

    if (rpcUrl) {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      if (privateKey) {
        this.signer = new ethers.Wallet(privateKey, this.provider);
      }
      if (contractAddr) {
        this.contractAddress = contractAddr;
      }
    }
  }

  /**
   * Get contract instance
   */
  private getContract(): ethers.Contract | null {
    if (!this.provider || !this.contractAddress) {
      return null;
    }

    return new ethers.Contract(
      this.contractAddress,
      GUARDIA_VAULT_ABI,
      this.signer || this.provider
    );
  }

  /**
   * Deploy or register a vault smart contract
   */
  async deployVaultContract(
    config: DeploymentConfig
  ): Promise<{
    contractAddress: string;
    txHash: string;
    vaultIdOnChain: string;
  } | null> {
    try {
      if (!this.provider || !this.signer) {
        logError(
          new Error("Provider or signer not configured"),
          {
            context: "SmartContractService.deployVaultContract",
          }
        );
        return null;
      }

      const contract = this.getContract();
      if (!contract) {
        throw new Error("Contract address not configured");
      }

      // Convert days to seconds for blockchain
      const checkInInterval = config.checkInIntervalDays * 24 * 60 * 60;
      const gracePeriod = config.gracePeriodDays * 24 * 60 * 60;

      // Call createVault function
      const tx = await contract.createVault(
        checkInInterval,
        gracePeriod,
        config.beneficiaryAddresses
      );

      logInfo("Vault contract deployment transaction sent", {
        txHash: tx.hash,
        vaultId: config.vaultId,
      });

      // Wait for confirmation
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error("Transaction receipt not found");
      }

      // Parse event to get vault ID
      const event = receipt.logs.find(
        (log: any) =>
          log.topics[0] ===
          ethers.id("VaultCreated(uint256,address,uint256,uint256,uint256)")
      );

      let vaultIdOnChain = "0";
      if (event) {
        // Parse vault ID from event
        const iface = new ethers.Interface(GUARDIA_VAULT_ABI);
        const decoded = iface.parseLog(event);
        if (decoded) {
          vaultIdOnChain = decoded.args[0].toString();
        }
      }

      // Save to database
      await this.saveContractDeployment(config.vaultId, {
        contractAddress: this.contractAddress!,
        network: config.network || "ethereum",
        deploymentTxHash: tx.hash,
        deploymentStatus: "deployed",
      });

      return {
        contractAddress: this.contractAddress!,
        txHash: tx.hash,
        vaultIdOnChain,
      };
    } catch (error: any) {
      logError(error, {
        context: "SmartContractService.deployVaultContract",
        vaultId: config.vaultId,
      });

      // Mark as failed in database
      await this.saveContractDeployment(config.vaultId, {
        contractAddress: null,
        network: config.network || "ethereum",
        deploymentTxHash: null,
        deploymentStatus: "failed",
      });

      return null;
    }
  }

  /**
   * Perform check-in on smart contract
   */
  async performCheckIn(
    vaultId: string,
    signature: string
  ): Promise<{ success: boolean; txHash?: string }> {
    try {
      if (!this.provider || !this.signer) {
        return { success: false };
      }

      const contractRecord = await this.getContractRecord(vaultId);
      if (!contractRecord || !contractRecord.contractAddress) {
        throw new Error("Contract not deployed for vault");
      }

      // Get vault ID on chain (need to query from contract)
      // For now, assume we store it in metadata
      const contract = new ethers.Contract(
        contractRecord.contractAddress,
        GUARDIA_VAULT_ABI,
        this.signer
      );

      // Get on-chain vault ID (simplified - would need to query)
      // This is a placeholder - actual implementation depends on contract design
      const tx = await contract.checkIn(0, signature); // 0 is placeholder

      await tx.wait();

      logInfo("Check-in performed on smart contract", {
        vaultId,
        txHash: tx.hash,
      });

      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      logError(error, {
        context: "SmartContractService.performCheckIn",
        vaultId,
      });
      return { success: false };
    }
  }

  /**
   * Trigger vault release on smart contract
   */
  async triggerVaultRelease(vaultId: string): Promise<{
    success: boolean;
    txHash?: string;
  }> {
    try {
      if (!this.provider || !this.signer) {
        return { success: false };
      }

      const contractRecord = await this.getContractRecord(vaultId);
      if (!contractRecord || !contractRecord.contractAddress) {
        throw new Error("Contract not deployed for vault");
      }

      const contract = new ethers.Contract(
        contractRecord.contractAddress,
        GUARDIA_VAULT_ABI,
        this.signer
      );

      // Update vault status first
      const statusTx = await contract.updateVaultStatus(0); // placeholder
      await statusTx.wait();

      logInfo("Vault release triggered on smart contract", {
        vaultId,
        txHash: statusTx.hash,
      });

      return { success: true, txHash: statusTx.hash };
    } catch (error: any) {
      logError(error, {
        context: "SmartContractService.triggerVaultRelease",
        vaultId,
      });
      return { success: false };
    }
  }

  /**
   * Save contract deployment record
   */
  private async saveContractDeployment(
    vaultId: string,
    deployment: {
      contractAddress: string | null;
      network: string;
      deploymentTxHash: string | null;
      deploymentStatus: "pending" | "deployed" | "failed" | "rejected";
    }
  ): Promise<string | null> {
    try {
      if (!db) {
        return null;
      }

      // Check if record exists
      const existing = await db
        .select()
        .from(vaultSmartContracts)
        .where(eq(vaultSmartContracts.vaultId, vaultId))
        .limit(1);

      let recordId: string;

      if (existing.length > 0) {
        // Update existing
        await db
          .update(vaultSmartContracts)
          .set({
            contractAddress: deployment.contractAddress,
            network: deployment.network,
            deploymentTxHash: deployment.deploymentTxHash,
            deploymentStatus: deployment.deploymentStatus,
            deployedAt:
              deployment.deploymentStatus === "deployed"
                ? new Date()
                : undefined,
            updatedAt: new Date(),
          })
          .where(eq(vaultSmartContracts.vaultId, vaultId));

        recordId = existing[0].id;
      } else {
        // Create new
        const validated = insertVaultSmartContractSchema.parse({
          vaultId,
          contractAddress: deployment.contractAddress,
          network: deployment.network,
          deploymentTxHash: deployment.deploymentTxHash,
          deploymentStatus: deployment.deploymentStatus,
        });

        const result = await db
          .insert(vaultSmartContracts)
          .values({
            ...validated,
            deployedAt:
              deployment.deploymentStatus === "deployed"
                ? new Date()
                : undefined,
          })
          .returning({ id: vaultSmartContracts.id });

        recordId = result[0]?.id || "";
      }

      return recordId;
    } catch (error: any) {
      logError(error, {
        context: "SmartContractService.saveContractDeployment",
        vaultId,
      });
      return null;
    }
  }

  /**
   * Get contract record for a vault
   */
  async getContractRecord(
    vaultId: string
  ): Promise<typeof vaultSmartContracts.$inferSelect | null> {
    try {
      if (!db) {
        return null;
      }

      const records = await db
        .select()
        .from(vaultSmartContracts)
        .where(eq(vaultSmartContracts.vaultId, vaultId))
        .limit(1);

      return records[0] || null;
    } catch (error: any) {
      logError(error, {
        context: "SmartContractService.getContractRecord",
        vaultId,
      });
      return null;
    }
  }
}

export const smartContractService = new SmartContractService();

