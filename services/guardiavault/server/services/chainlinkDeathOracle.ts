/**
 * Chainlink External Adapter for Death Certificate Verification
 * 
 * This service acts as a Chainlink External Adapter that:
 * 1. Receives requests to verify death certificates
 * 2. Queries government vital records APIs
 * 3. Returns results in Chainlink-compatible format
 * 
 * NOTE: This adapter can be deployed as a closed-source service for defensibility
 */

import axios from "axios";
import { ethers } from "ethers";
import { db } from "../db";
import { users, vaults } from "../../shared/schema";
import { eq, and } from "../utils/drizzle-exports";
import { logInfo, logError, logWarn } from "./logger";
import { deathCertificateService } from "./deathCertificateService";
import { deathConsensusEngine } from "./deathConsensusEngine";

export interface OracleRequest {
  jobId: string;
  data: {
    userAddress: string; // Ethereum address of vault owner
    userId?: string; // Optional: user ID for database lookup
    name?: string; // Optional: full name for verification
    dateOfBirth?: string; // Optional: DOB for verification
    deathDate?: string; // Optional: suspected death date
    deathLocation?: string; // Optional: suspected death location
  };
}

export interface OracleResponse {
  jobRunID: string;
  status: "success" | "errored";
  data: {
    verified: boolean;
    confidence: number;
    source?: string;
    certificateNumber?: string;
    deathDate?: string;
    error?: string;
  };
}

export class ChainlinkDeathOracle {
  private contractAddress: string;
  private privateKey: string;
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    this.contractAddress = process.env.GUARDIA_VAULT_CONTRACT_ADDRESS || "";
    this.privateKey = process.env.ORACLE_PRIVATE_KEY || "";
    
    if (!this.contractAddress) {
      logWarn("GUARDIA_VAULT_CONTRACT_ADDRESS not set, oracle will run in test mode");
    }
    
    if (!this.privateKey) {
      logWarn("ORACLE_PRIVATE_KEY not set, oracle will not be able to submit on-chain");
    }

    const rpcUrl = process.env.RPC_URL || process.env.SEPOLIA_RPC_URL || "http://localhost:8545";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    if (this.privateKey) {
      this.signer = new ethers.Wallet(this.privateKey, this.provider);
    }

    // Load contract ABI (simplified - in production, load from artifacts)
    const contractABI = [
      "function verifyDeath(address userAddress) external",
      "event DeathVerified(uint256 indexed vaultId, address indexed user, address indexed verifiedBy, uint256 timestamp, uint256 readyForClaimAt)",
    ];
    
    if (this.contractAddress && this.signer) {
      this.contract = new ethers.Contract(this.contractAddress, contractABI, this.signer);
    }
  }

  /**
   * Process a Chainlink oracle request
   * This is the main entry point for Chainlink External Adapters
   */
  async processRequest(request: OracleRequest): Promise<OracleResponse> {
    const { jobId, data } = request;
    logInfo("Processing oracle request", { jobId, userAddress: data.userAddress });

    try {
      // Step 1: Lookup user information if not provided
      let userInfo = await this.getUserInfo(data.userAddress, data.userId);
      
      if (!userInfo) {
        return {
          jobRunID: jobId,
          status: "errored",
          data: {
            verified: false,
            confidence: 0,
            error: "User not found",
          },
        };
      }

      // Step 2: Query government vital records API
      const verificationResult = await this.verifyDeathCertificate({
        full_name: userInfo.fullName,
        date_of_birth: userInfo.dateOfBirth,
      }, data.deathDate || new Date(), data.deathLocation || "Unknown");

      // Step 3: Return Chainlink-compatible response
      if (verificationResult.found) {
        return {
          jobRunID: jobId,
          status: "success",
          data: {
            verified: true,
            confidence: verificationResult.confidence || 1.0,
            source: verificationResult.source || "death_certificate_official",
            certificateNumber: verificationResult.certificateNumber,
            deathDate: verificationResult.deathDate?.toString(),
          },
        };
      } else {
        return {
          jobRunID: jobId,
          status: "success",
          data: {
            verified: false,
            confidence: 0,
            error: verificationResult.error || "Death certificate not found",
          },
        };
      }
    } catch (error: any) {
      logError(error, { jobId, userAddress: data.userAddress });
      return {
        jobRunID: jobId,
        status: "errored",
        data: {
          verified: false,
          confidence: 0,
          error: error.message,
        },
      };
    }
  }

  /**
   * Submit verified death on-chain
   * Called after API verification confirms death
   */
  async submitOnChainVerification(userAddress: string): Promise<string> {
    if (!this.contract || !this.signer) {
      throw new Error("Oracle not configured with contract and signer");
    }

    try {
      logInfo("Submitting death verification on-chain", { userAddress });
      
      const tx = await this.contract.verifyDeath(userAddress);
      logInfo("Death verification transaction sent", { txHash: tx.hash, userAddress });
      
      const receipt = await tx.wait();
      logInfo("Death verification confirmed", { txHash: receipt.hash, userAddress });
      
      return receipt.hash;
    } catch (error: any) {
      logError(error, { userAddress, type: "onchain_verification" });
      throw error;
    }
  }

  /**
   * Get user information from database
   */
  private async getUserInfo(
    userAddress: string,
    userId?: string
  ): Promise<{ fullName: string; dateOfBirth: Date | null; userId: string } | null> {
    try {
      let user;
      
      if (userId) {
        const userRows = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        if (userRows.length > 0) {
          user = userRows[0];
        }
      } else {
        // Try to find user by wallet address
        // Note: This assumes users table has a walletAddress column
        // If not, you'll need to add it or use a different lookup method
        const userRows = await db
          .select()
          .from(users)
          .where(eq(users.id, userId || ""))
          .limit(1);
        
        // For now, return null if we can't find by address
        // In production, add walletAddress column or use separate mapping
        return null;
      }

      if (!user) {
        return null;
      }

      return {
        fullName: user.fullName || "",
        dateOfBirth: user.dateOfBirth || null,
        userId: user.id,
      };
    } catch (error: any) {
      logError(error, { userAddress, userId });
      return null;
    }
  }

  /**
   * Verify death certificate using government API
   */
  private async verifyDeathCertificate(
    user: { full_name: string; date_of_birth?: Date | string | null },
    deathDate: Date | string,
    deathLocation: string
  ): Promise<{
    found: boolean;
    confidence?: number;
    source?: string;
    certificateNumber?: string;
    deathDate?: Date;
    error?: string;
  }> {
    try {
      // Use existing death certificate service
      const result = await deathCertificateService.verifyDeathCertificate(
        {
          id: "", // Will be filled by service
          full_name: user.full_name,
          date_of_birth: user.date_of_birth,
        },
        deathDate,
        deathLocation
      );

      return {
        found: result.found,
        confidence: result.found ? 1.0 : 0,
        source: result.source || "death_certificate_official",
        certificateNumber: result.certificateNumber,
        deathDate: result.deathDate ? new Date(result.deathDate) : undefined,
        error: result.error,
      };
    } catch (error: any) {
      logError(error, { type: "death_cert_verification" });
      return {
        found: false,
        error: error.message,
      };
    }
  }

  /**
   * HTTP handler for Chainlink External Adapter requests
   * Chainlink sends POST requests to this endpoint
   */
  async handleHttpRequest(req: any, res: any): Promise<void> {
    try {
      const request: OracleRequest = req.body;
      
      if (!request.jobId || !request.data) {
        res.status(400).json({
          status: "errored",
          error: "Invalid request format",
        });
        return;
      }

      const response = await this.processRequest(request);
      
      if (response.status === "success" && response.data.verified) {
        // If verified, submit on-chain
        try {
          await this.submitOnChainVerification(request.data.userAddress);
        } catch (error: any) {
          logError(error, { 
            userAddress: request.data.userAddress,
            type: "onchain_submission_failed"
          });
          // Continue anyway - the API verification succeeded
        }
      }

      res.status(200).json(response);
    } catch (error: any) {
      logError(error, { type: "oracle_http_handler" });
      res.status(500).json({
        status: "errored",
        error: error.message,
      });
    }
  }

  /**
   * Flag a vault for death verification
   * Called when vault enters Warning or Triggered state
   */
  async flagVaultForVerification(vaultId: number, userAddress: string): Promise<void> {
    logInfo("Flagging vault for death verification", { vaultId, userAddress });

    try {
      // In production, this would:
      // 1. Create a Chainlink job request
      // 2. Queue it for processing
      // 3. The oracle node would pick it up and process it
      
      // For now, we'll directly process the verification
      // In production, use Chainlink's job creation API
      
      const request: OracleRequest = {
        jobId: `death-verify-${vaultId}-${Date.now()}`,
        data: {
          userAddress,
          userId: undefined, // Will be looked up
        },
      };

      const response = await this.processRequest(request);
      
      if (response.status === "success" && response.data.verified) {
        await this.submitOnChainVerification(userAddress);
      }
    } catch (error: any) {
      logError(error, { vaultId, userAddress, type: "flag_verification" });
    }
  }
}

// Export singleton instance
export const chainlinkDeathOracle = new ChainlinkDeathOracle();
export default chainlinkDeathOracle;






