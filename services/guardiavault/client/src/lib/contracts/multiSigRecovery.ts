// Optimized Ethers imports - use optimized imports for better tree-shaking
import { ethers, Contract } from "@/lib/ethers-optimized";
import type { Signer, Provider } from "@/lib/ethers-optimized";
import { CONTRACTS } from "./config";
import MultiSigRecoveryABI from "./MultiSigRecovery.abi.json";

// Contract instance getter
export function getMultiSigRecoveryContract(
  signerOrProvider: Signer | Provider
): Contract {
  return new ethers.Contract(
    CONTRACTS.MultiSigRecovery.address,
    MultiSigRecoveryABI.abi,
    signerOrProvider
  );
}

// Type definitions for contract interactions
export interface RecoveryData {
  walletOwner: string;
  walletAddress: string;
  recoveryKeys: [string, string, string];
  createdAt: bigint;
  status: number; // 0: Active, 1: Triggered, 2: Completed, 3: Cancelled
  encryptedData: string;
}

export enum RecoveryStatus {
  Active = 0,
  Triggered = 1,
  Completed = 2,
  Cancelled = 3,
}

// Contract interaction functions
export async function createRecovery(
  contract: Contract,
  walletAddress: string,
  recoveryKeys: [string, string, string], // Exactly 3 recovery keys
  encryptedData: string
) {
  const tx = await contract.createRecovery(
    walletAddress,
    recoveryKeys,
    encryptedData
  );
  return await tx.wait();
}

export async function attestRecovery(
  contract: Contract,
  recoveryId: number
) {
  const tx = await contract.attestRecovery(recoveryId);
  return await tx.wait();
}

export async function completeRecovery(
  contract: Contract,
  recoveryId: number
) {
  const tx = await contract.completeRecovery(recoveryId);
  return await tx.wait();
}

export async function cancelRecovery(
  contract: Contract,
  recoveryId: number
) {
  const tx = await contract.cancelRecovery(recoveryId);
  return await tx.wait();
}

export async function getRecoveryDetails(
  contract: Contract,
  recoveryId: number
): Promise<RecoveryData> {
  const [
    walletOwner,
    walletAddress,
    recoveryKeys,
    createdAt,
    status,
    encryptedData,
  ] = await contract.getRecovery(recoveryId);

  return {
    walletOwner,
    walletAddress,
    recoveryKeys: [
      recoveryKeys[0],
      recoveryKeys[1],
      recoveryKeys[2],
    ] as [string, string, string],
    createdAt,
    status: Number(status),
    encryptedData,
  };
}

export async function getRecoveryAttestationCount(
  contract: Contract,
  recoveryId: number
): Promise<number> {
  const count = await contract.getRecoveryAttestationCount(recoveryId);
  return Number(count);
}

export async function hasRecoveryKeyAttested(
  contract: Contract,
  recoveryId: number,
  recoveryKey: string
): Promise<boolean> {
  return await contract.hasRecoveryKeyAttested(recoveryId, recoveryKey);
}

export async function getTimeUntilRecovery(
  contract: Contract,
  recoveryId: number
): Promise<number> {
  const timeRemaining = await contract.getTimeUntilRecovery(recoveryId);
  return Number(timeRemaining);
}

export async function canCompleteRecovery(
  contract: Contract,
  recoveryId: number
): Promise<{ canComplete: boolean; timeRemaining: number }> {
  const [canComplete, timeRemaining] = await contract.canCompleteRecovery(
    recoveryId
  );
  return {
    canComplete,
    timeRemaining: Number(timeRemaining),
  };
}

export async function isRecoveryKey(
  contract: Contract,
  recoveryId: number,
  address: string
): Promise<boolean> {
  return await contract.isRecoveryKey(recoveryId, address);
}

