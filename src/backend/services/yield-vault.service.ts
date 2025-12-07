// Yield Vault Service - Manage yield-generating vaults
import { prisma } from '../config/database';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const YIELD_FEE_PERCENTAGE = 0.01; // 1% yield fee
const YIELD_VAULT_ADDRESS = process.env.YIELD_VAULT_ADDRESS || '0x86bE7Bf7Ef3Af62BB7e56a324a11fdBA7f3AfbBb';
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/KQDdqBIVP39M0b1A_2nwMXvFAFyYNfzT';

export interface YieldVault {
  id: string;
  userId: string;
  name: string;
  address: string;
  totalDeposited: string;
  totalYield: string;
  currentAPY: number;
  strategy: string;
  status: 'active' | 'paused' | 'closed';
  createdAt: Date;
}

export interface YieldVaultDeposit {
  vaultId: string;
  amount: string;
  tokenAddress: string;
  expectedYield: string;
  feeAmount: string;
}

export class YieldVaultService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  }

  // Create a new yield vault
  async createVault(userId: string, name: string, strategy: string = 'default'): Promise<YieldVault> {
    // In production, this would deploy a new vault contract
    // For now, we'll create a database record
    const vault = await prisma.yieldVault.create({
      data: {
        userId,
        name,
        address: YIELD_VAULT_ADDRESS, // Use existing contract address
        strategy,
        status: 'active',
        totalDeposited: '0',
        totalYield: '0',
        currentAPY: 0,
      },
    });

    return {
      id: vault.id,
      userId: vault.userId,
      name: vault.name,
      address: vault.address,
      totalDeposited: vault.totalDeposited,
      totalYield: vault.totalYield,
      currentAPY: parseFloat(vault.currentAPY.toString()),
      strategy: vault.strategy,
      status: vault.status as 'active' | 'paused' | 'closed',
      createdAt: vault.createdAt,
    };
  }

  // Get user's vaults
  async getUserVaults(userId: string): Promise<YieldVault[]> {
    const vaults = await prisma.yieldVault.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return vaults.map(v => ({
      id: v.id,
      userId: v.userId,
      name: v.name,
      address: v.address,
      totalDeposited: v.totalDeposited,
      totalYield: v.totalYield,
      currentAPY: parseFloat(v.currentAPY.toString()),
      strategy: v.strategy,
      status: v.status as 'active' | 'paused' | 'closed',
      createdAt: v.createdAt,
    }));
  }

  // Get vault details
  async getVault(vaultId: string, userId: string): Promise<YieldVault | null> {
    const vault = await prisma.yieldVault.findFirst({
      where: {
        id: vaultId,
        userId,
      },
    });

    if (!vault) return null;

    return {
      id: vault.id,
      userId: vault.userId,
      name: vault.name,
      address: vault.address,
      totalDeposited: vault.totalDeposited,
      totalYield: vault.totalYield,
      currentAPY: parseFloat(vault.currentAPY.toString()),
      strategy: vault.strategy,
      status: vault.status as 'active' | 'paused' | 'closed',
      createdAt: vault.createdAt,
    };
  }

  // Calculate yield fee (1% of yield)
  calculateYieldFee(yieldAmount: string): string {
    const yieldBigInt = BigInt(yieldAmount);
    const feeBigInt = (yieldBigInt * BigInt(Math.floor(YIELD_FEE_PERCENTAGE * 10000))) / BigInt(10000);
    return feeBigInt.toString();
  }

  // Deposit into yield vault
  async deposit(vaultId: string, userId: string, amount: string, tokenAddress: string): Promise<YieldVaultDeposit> {
    const vault = await prisma.yieldVault.findFirst({
      where: {
        id: vaultId,
        userId,
      },
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    if (vault.status !== 'active') {
      throw new Error('Vault is not active');
    }

    // Calculate expected yield (simplified - in production, query contract)
    const expectedYield = this.calculateExpectedYield(amount, vault.currentAPY);
    const feeAmount = this.calculateYieldFee(expectedYield);

    // Update vault totals
    const newTotalDeposited = (BigInt(vault.totalDeposited) + BigInt(amount)).toString();

    await prisma.yieldVault.update({
      where: { id: vaultId },
      data: {
        totalDeposited: newTotalDeposited,
      },
    });

    // Create deposit record
    await prisma.yieldVaultDeposit.create({
      data: {
        vaultId,
        userId,
        amount,
        tokenAddress,
        expectedYield,
        feeAmount,
        status: 'pending',
      },
    });

    return {
      vaultId,
      amount,
      tokenAddress,
      expectedYield,
      feeAmount,
    };
  }

  // Calculate expected yield
  private calculateExpectedYield(amount: string, apy: number): string {
    // Simplified calculation: APY is annual, so daily yield = (amount * apy) / 365
    const amountBigInt = BigInt(amount);
    const apyMultiplier = BigInt(Math.floor(apy * 10000)); // Convert to basis points
    const dailyYield = (amountBigInt * apyMultiplier) / BigInt(365 * 10000);
    return dailyYield.toString();
  }

  // Withdraw from yield vault
  async withdraw(vaultId: string, userId: string, amount: string): Promise<string> {
    const vault = await prisma.yieldVault.findFirst({
      where: {
        id: vaultId,
        userId,
      },
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    const currentDeposit = BigInt(vault.totalDeposited);
    const withdrawAmount = BigInt(amount);

    if (withdrawAmount > currentDeposit) {
      throw new Error('Insufficient balance');
    }

    // Calculate yield earned
    const yieldEarned = this.calculateExpectedYield(amount, vault.currentAPY);
    const feeAmount = this.calculateYieldFee(yieldEarned);
    const netYield = (BigInt(yieldEarned) - BigInt(feeAmount)).toString();

    // Update vault
    const newTotalDeposited = (currentDeposit - withdrawAmount).toString();
    const newTotalYield = (BigInt(vault.totalYield) + BigInt(netYield)).toString();

    await prisma.yieldVault.update({
      where: { id: vaultId },
      data: {
        totalDeposited: newTotalDeposited,
        totalYield: newTotalYield,
      },
    });

    // Create withdrawal record
    await prisma.yieldVaultWithdrawal.create({
      data: {
        vaultId,
        userId,
        amount,
        yieldEarned,
        feeAmount,
        netYield,
        status: 'pending',
      },
    });

    return netYield;
  }

  // Get vault APY (in production, query from contract)
  async getVaultAPY(vaultId: string): Promise<number> {
    const vault = await prisma.yieldVault.findUnique({
      where: { id: vaultId },
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    // In production, this would query the smart contract
    // For now, return stored APY
    return parseFloat(vault.currentAPY.toString());
  }
}

export const yieldVaultService = new YieldVaultService();

