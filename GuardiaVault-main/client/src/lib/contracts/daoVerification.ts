/**
 * DAO Verification Contract Integration
 * Frontend integration for DAOVerification.sol
 */

// Optimized Ethers imports - use optimized imports for better tree-shaking
import { ethers, Contract, formatUnits, parseUnits } from "@/lib/ethers-optimized";
import type { Signer, ContractTransactionReceipt } from "@/lib/ethers-optimized";
import DAOVerificationABI from "./DAOVerification.abi.json";

export interface Claim {
  vaultId: number;
  claimant: string;
  reason: string;
  createdAt: number;
  votingDeadline: number;
  approvalVotes: string;
  rejectionVotes: string;
  resolved: boolean;
  approved: boolean;
}

export interface Verifier {
  isActive: boolean;
  stake: string;
  reputation: number;
  totalVotes: number;
  correctVotes: number;
}

export async function getDAOVerificationContract(
  signer: Signer,
  contractAddress?: string
): Promise<Contract> {
  const address = contractAddress || import.meta.env.VITE_DAO_VERIFICATION_ADDRESS || "";
  if (!address) {
    throw new Error("DAOVerification contract address not configured");
  }
  // Type assertion for ABI - ABI structure matches ethers Contract interface
  const abi = (DAOVerificationABI as { abi: any[] }).abi || DAOVerificationABI;
  return new ethers.Contract(address, abi, signer);
}

export async function registerVerifier(
  contract: Contract,
  stakeAmount: string,
  tokenAddress: string
): Promise<ContractTransactionReceipt> {
  // First approve token spending
  if (!contract.runner) throw new Error("No runner available");
  
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ["function approve(address spender, uint256 amount) external returns (bool)"],
    contract.runner
  );
  
  const stakeWei = parseUnits(stakeAmount, 18);
  await tokenContract.approve(await contract.getAddress(), stakeWei);
  
  // Then register
  const tx = await contract.registerVerifier(stakeWei, { gasLimit: 300000 });
  return await tx.wait();
}

export async function createClaim(
  contract: Contract,
  vaultId: number,
  reason: string
): Promise<{ claimId: number; receipt: ContractTransactionReceipt }> {
  const tx = await contract.createClaim(vaultId, reason, { gasLimit: 200000 });
  const receipt = await tx.wait();
  
  // Extract claim ID from event
  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "ClaimCreated";
    } catch {
      return false;
    }
  });

  let claimId = 0;
  if (event) {
    try {
      const parsed = contract.interface.parseLog(event);
      if (parsed && parsed.args && parsed.args.claimId) {
        claimId = Number(parsed.args.claimId);
      }
    } catch {
      // Fallback to 0 if parsing fails
    }
  }

  return { claimId, receipt };
}

export async function vote(
  contract: Contract,
  claimId: number,
  approved: boolean
): Promise<ContractTransactionReceipt> {
  const tx = await contract.vote(claimId, approved, { gasLimit: 200000 });
  return await tx.wait();
}

export async function getClaim(
  contract: Contract,
  claimId: number
): Promise<Claim> {
  const [
    vaultId,
    claimant,
    reason,
    createdAt,
    votingDeadline,
    approvalVotes,
    rejectionVotes,
    resolved,
    approved,
  ] = await contract.getClaim(claimId);

  return {
    vaultId: Number(vaultId),
    claimant,
    reason,
    createdAt: Number(createdAt),
    votingDeadline: Number(votingDeadline),
    approvalVotes: approvalVotes.toString(),
    rejectionVotes: rejectionVotes.toString(),
    resolved,
    approved,
  };
}

export async function getVerifier(
  contract: Contract,
  verifierAddress: string
): Promise<Verifier> {
  const [isActive, stake, reputation, totalVotes, correctVotes] =
    await contract.getVerifier(verifierAddress);

  return {
    isActive,
    stake: formatUnits(stake, 18),
    reputation: Number(reputation),
    totalVotes: Number(totalVotes),
    correctVotes: Number(correctVotes),
  };
}

export async function resolveClaim(
  contract: Contract,
  claimId: number
): Promise<ContractTransactionReceipt> {
  const tx = await contract.resolveClaim(claimId, { gasLimit: 200000 });
  return await tx.wait();
}

export async function unstake(
  contract: Contract
): Promise<ContractTransactionReceipt> {
  const tx = await contract.unstake({ gasLimit: 200000 });
  return await tx.wait();
}

