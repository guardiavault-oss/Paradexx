// Optimized Ethers imports - use optimized imports for better tree-shaking
import { ethers, Contract } from "@/lib/ethers-optimized";
import type { Signer, Provider } from "@/lib/ethers-optimized";
import { CONTRACTS } from "./config";
import GuardiaVaultABI from "./GuardiaVault.abi.json";

// Contract instance getter
export function getGuardiaVaultContract(
  signerOrProvider: Signer | Provider
): Contract {
  return new ethers.Contract(
    CONTRACTS.GuardiaVault.address,
    GuardiaVaultABI.abi,
    signerOrProvider
  );
}

// Type definitions for contract interactions
export interface VaultData {
  owner: string;
  checkInInterval: bigint;
  gracePeriod: bigint;
  lastCheckIn: bigint;
  beneficiaries: string[];
  guardians: string[];
  metadataHash: string;
  status: number; // 0: Active, 1: Warning, 2: Triggered, 3: Claimed
}

export enum VaultStatus {
  Active = 0,
  Warning = 1,
  Triggered = 2,
  Claimed = 3,
}

// Contract interaction functions
export async function createVault(
  contract: Contract,
  checkInInterval: number, // in seconds
  gracePeriod: number, // in seconds
  beneficiaries: string[],
  guardians: [string, string, string], // Exactly 3 guardians
  metadataHash: string
) {
  const tx = await contract.createVault(
    checkInInterval,
    gracePeriod,
    beneficiaries,
    guardians,
    metadataHash
  );
  return await tx.wait();
}

export async function performCheckIn(contract: Contract, vaultId: number) {
  const tx = await contract.checkIn(vaultId);
  return await tx.wait();
}

export async function getVaultDetails(
  contract: Contract,
  vaultId: number
): Promise<VaultData> {
  const [
    owner,
    checkInInterval,
    gracePeriod,
    lastCheckIn,
    beneficiaries,
    guardians,
    status,
    metadataHash,
  ] = await contract.getVault(vaultId);
  
  return {
    owner,
    checkInInterval,
    gracePeriod,
    lastCheckIn,
    beneficiaries,
    guardians,
    status: Number(status),
    metadataHash,
  };
}

export async function getVaultStatus(
  contract: Contract,
  vaultId: number
): Promise<VaultStatus> {
  return await contract.getVaultStatus(vaultId);
}

// Note: Guardians are set at vault creation and cannot be modified
// Note: Beneficiaries are set at vault creation and cannot be modified

export async function attestDeath(
  contract: Contract,
  vaultId: number
) {
  const tx = await contract.attestDeath(vaultId);
  return await tx.wait();
}

export async function claim(
  contract: Contract,
  vaultId: number
) {
  const tx = await contract.claim(vaultId);
  return await tx.wait();
}

export async function updateVaultStatus(
  contract: Contract,
  vaultId: number
) {
  const tx = await contract.updateVaultStatus(vaultId);
  return await tx.wait();
}

export async function emergencyRevoke(
  contract: Contract,
  vaultId: number
) {
  const tx = await contract.emergencyRevoke(vaultId);
  return await tx.wait();
}

export async function updateMetadata(
  contract: Contract,
  vaultId: number,
  newMetadataHash: string
) {
  const tx = await contract.updateMetadata(vaultId, newMetadataHash);
  return await tx.wait();
}

// View functions for guardian-related queries
export async function getGuardians(
  contract: Contract,
  vaultId: number
): Promise<string[]> {
  return await contract.getGuardians(vaultId);
}

export async function getGuardianAttestationCount(
  contract: Contract,
  vaultId: number
): Promise<number> {
  const count = await contract.getGuardianAttestationCount(vaultId);
  return Number(count);
}

export async function hasGuardianAttested(
  contract: Contract,
  vaultId: number,
  guardian: string
): Promise<boolean> {
  return await contract.hasGuardianAttested(vaultId, guardian);
}

export async function isGuardian(
  contract: Contract,
  vaultId: number,
  guardian: string
): Promise<boolean> {
  return await contract.isGuardian(vaultId, guardian);
}

export async function canRevoke(
  contract: Contract,
  vaultId: number
): Promise<{ canRevoke: boolean; timeRemaining: bigint }> {
  const [canRevokeStatus, timeRemaining] = await contract.canRevoke(vaultId);
  return {
    canRevoke: canRevokeStatus,
    timeRemaining,
  };
}

// Helper functions
export function secondsToDays(seconds: bigint): number {
  return Number(seconds) / (24 * 60 * 60);
}

export function daysToSeconds(days: number): number {
  return days * 24 * 60 * 60;
}

export function getVaultStatusString(status: VaultStatus): string {
  switch (status) {
    case VaultStatus.Active:
      return "Active";
    case VaultStatus.Warning:
      return "Warning";
    case VaultStatus.Triggered:
      return "Triggered";
    case VaultStatus.Claimed:
      return "Claimed";
    default:
      return "Unknown";
  }
}
