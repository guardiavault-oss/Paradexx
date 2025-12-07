/**
 * Yield Vault Contract Integration
 * Frontend integration for YieldVault.sol
 */

// Optimized Ethers imports - use optimized imports for better tree-shaking
import { ethers, formatUnits, parseUnits, Contract } from "@/lib/ethers-optimized";
import type { Signer, ContractTransactionReceipt } from "@/lib/ethers-optimized";
import YieldVaultABI from "./YieldVault.abi.json";

export interface YieldVaultData {
  owner: string;
  guardiaVaultId: string;
  asset: string;
  principal: string;
  yieldAccumulated: string;
  yieldFeeCollected: string;
  stakingProtocol: string;
  stakedAmount: string;
  createdAt: number;
  totalValue: string;
}

export async function getYieldVaultContract(
  signer: Signer,
  contractAddress?: string
): Promise<Contract> {
  const address = contractAddress || import.meta.env.VITE_YIELD_VAULT_ADDRESS || "";
  if (!address) {
    throw new Error("YieldVault contract address not configured");
  }
  // Type assertion for ABI - ABI structure matches ethers Contract interface
  const abi = (YieldVaultABI as { abi: any[] }).abi || YieldVaultABI;
  return new ethers.Contract(address, abi, signer) as Contract;
}

export async function createYieldVault(
  contract: Contract,
  guardiaVaultId: number,
  asset: string,
  amount: string,
  stakingProtocol: string
): Promise<ContractTransactionReceipt> {
  const amountWei = parseUnits(amount, 18); // Adjust decimals based on asset
  
  const tx = await contract.createYieldVault(
    guardiaVaultId,
    asset,
    amountWei,
    stakingProtocol,
    { gasLimit: 500000 }
  );
  
  return await tx.wait();
}

export async function getVaultDetails(
  contract: Contract,
  vaultId: number
): Promise<YieldVaultData> {
  const [
    owner,
    guardiaVaultId,
    asset,
    principal,
    yieldAccumulated,
    yieldFeeCollected,
    stakingProtocol,
    stakedAmount,
    createdAt,
    totalValue,
  ] = await contract.getVault(vaultId);

  return {
    owner,
    guardiaVaultId,
    asset,
    principal: formatUnits(principal, 18),
    yieldAccumulated: formatUnits(yieldAccumulated, 18),
    yieldFeeCollected: formatUnits(yieldFeeCollected, 18),
    stakingProtocol,
    stakedAmount: formatUnits(stakedAmount, 18),
    createdAt: Number(createdAt),
    totalValue: formatUnits(totalValue, 18),
  };
}

export async function updateYield(
  contract: Contract,
  vaultId: number,
  newTotalValue: string
): Promise<ContractTransactionReceipt> {
  const valueWei = parseUnits(newTotalValue, 18);
  const tx = await contract.updateYield(vaultId, valueWei);
  return await tx.wait();
}

export async function triggerYieldVault(
  contract: Contract,
  vaultId: number
): Promise<{ totalAmount: string; receipt: ContractTransactionReceipt }> {
  const tx = await contract.triggerVault(vaultId);
  const receipt = await tx.wait();
  
  // Get total amount from events
  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "VaultTriggered";
    } catch {
      return false;
    }
  });

  const totalAmount = event && event.args
    ? formatUnits(event.args.totalAmount, 18)
    : "0";

  return { totalAmount, receipt };
}

export async function getEstimatedAPY(
  contract: Contract,
  stakingProtocol: string
): Promise<number> {
  const apyBps = await contract.getEstimatedAPY(stakingProtocol);
  return Number(apyBps) / 100; // Convert basis points to percentage
}

