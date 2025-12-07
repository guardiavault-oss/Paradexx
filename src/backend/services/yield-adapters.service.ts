// Yield Adapters Service - Interface with Lido, Aave, and other yield protocols
import { ethers } from 'ethers';
import { logger } from '../services/logger.service';
import dotenv from 'dotenv';

dotenv.config();

const LIDO_ADAPTER_ADDRESS = process.env.LIDO_ADAPTER_ADDRESS || '0xC30F4DE8666c79757116517361dFE6764A6Dc128';
const AAVE_ADAPTER_ADDRESS = process.env.AAVE_ADAPTER_ADDRESS || '0xcc27a22d92a8B03D822974CDeD6BB74c63Ac0ae1';
const YIELD_VAULT_ADDRESS = process.env.YIELD_VAULT_ADDRESS || '0x86bE7Bf7Ef3Af62BB7e56a324a11fdBA7f3AfbBb';
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY_HERE';

// Simplified ABI for adapters (common functions)
const ADAPTER_ABI = [
  'function deposit(uint256 amount) external returns (uint256)',
  'function withdraw(uint256 amount) external returns (uint256)',
  'function getBalance(address account) external view returns (uint256)',
  'function getAPY() external view returns (uint256)',
  'function getTotalAssets() external view returns (uint256)',
];

export enum YieldStrategy {
  LIDO = 'lido',
  AAVE = 'aave',
  COMPOUND = 'compound',
  DEFAULT = 'default',
}

export interface YieldAdapterInfo {
  strategy: YieldStrategy;
  address: string;
  apy: number;
  totalAssets: string;
  name: string;
}

export interface YieldDepositResult {
  strategy: YieldStrategy;
  shares: string;
  feeAmount: string;
  netAmount: string;
}

export class YieldAdaptersService {
  private provider: ethers.JsonRpcProvider;
  private lidoAdapter: ethers.Contract;
  private aaveAdapter: ethers.Contract;
  private yieldFeePercentage = 0.01; // 1% yield fee

  constructor() {
    this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    this.lidoAdapter = new ethers.Contract(LIDO_ADAPTER_ADDRESS, ADAPTER_ABI, this.provider);
    this.aaveAdapter = new ethers.Contract(AAVE_ADAPTER_ADDRESS, ADAPTER_ABI, this.provider);
  }

  // Get adapter info
  async getAdapterInfo(strategy: YieldStrategy): Promise<YieldAdapterInfo> {
    let adapter: ethers.Contract;
    let address: string;
    let name: string;

    switch (strategy) {
      case YieldStrategy.LIDO:
        adapter = this.lidoAdapter;
        address = LIDO_ADAPTER_ADDRESS;
        name = 'Lido Staked ETH';
        break;
      case YieldStrategy.AAVE:
        adapter = this.aaveAdapter;
        address = AAVE_ADAPTER_ADDRESS;
        name = 'Aave Lending';
        break;
      default:
        throw new Error(`Unsupported strategy: ${strategy}`);
    }

    try {
      const [apy, totalAssets] = await Promise.all([
        adapter.getAPY().catch(() => BigInt(0)),
        adapter.getTotalAssets().catch(() => BigInt(0)),
      ]);

      return {
        strategy,
        address,
        apy: Number(apy) / 10000, // Convert from basis points
        totalAssets: totalAssets.toString(),
        name,
      };
    } catch (error) {
      logger.error(`Error getting adapter info for ${strategy}:`, error);
      // Return default values if contract call fails
      return {
        strategy,
        address,
        apy: 0,
        totalAssets: '0',
        name,
      };
    }
  }

  // Get all available adapters
  async getAllAdapters(): Promise<YieldAdapterInfo[]> {
    const adapters = await Promise.all([
      this.getAdapterInfo(YieldStrategy.LIDO).catch(() => null),
      this.getAdapterInfo(YieldStrategy.AAVE).catch(() => null),
    ]);

    return adapters.filter((a): a is YieldAdapterInfo => a !== null);
  }

  // Calculate yield fee (1% of yield)
  calculateYieldFee(yieldAmount: string): string {
    const yieldBigInt = BigInt(yieldAmount);
    const feeBigInt = (yieldBigInt * BigInt(Math.floor(this.yieldFeePercentage * 10000))) / BigInt(10000);
    return feeBigInt.toString();
  }

  // Deposit into yield adapter
  async deposit(
    strategy: YieldStrategy,
    amount: string,
    signer: ethers.Signer
  ): Promise<YieldDepositResult> {
    let adapter: any;

    switch (strategy) {
      case YieldStrategy.LIDO:
        adapter = this.lidoAdapter.connect(signer) as any;
        break;
      case YieldStrategy.AAVE:
        adapter = this.aaveAdapter.connect(signer) as any;
        break;
      default:
        throw new Error(`Unsupported strategy: ${strategy}`);
    }

    try {
      // Estimate shares before deposit
      const totalAssets = await adapter.getTotalAssets();
      const totalSupply = await adapter.getBalance(await signer.getAddress()).catch(() => BigInt(0));

      // Calculate expected shares (simplified)
      const amountBigInt = BigInt(amount);
      const expectedShares = totalSupply > 0
        ? (amountBigInt * totalSupply) / totalAssets
        : amountBigInt;

      // Calculate fee on expected yield
      const adapterInfo = await this.getAdapterInfo(strategy);
      const annualYield = (amountBigInt * BigInt(Math.floor(adapterInfo.apy * 10000))) / BigInt(10000);
      const dailyYield = annualYield / BigInt(365);
      const feeAmount = this.calculateYieldFee(dailyYield.toString());

      // Execute deposit
      const tx = await adapter.deposit(amountBigInt);
      await tx.wait();

      // Get actual shares received
      const newBalance = await adapter.getBalance(await signer.getAddress());
      const shares = (newBalance - totalSupply).toString();

      return {
        strategy,
        shares,
        feeAmount,
        netAmount: (BigInt(amount) - BigInt(feeAmount)).toString(),
      };
    } catch (error: any) {
      logger.error(`Deposit error for ${strategy}:`, error);
      throw new Error(`Failed to deposit into ${strategy}: ${error.message}`);
    }
  }

  // Withdraw from yield adapter
  async withdraw(
    strategy: YieldStrategy,
    amount: string,
    signer: ethers.Signer
  ): Promise<{ withdrawn: string; feeAmount: string; netAmount: string }> {
    let adapter: any;

    switch (strategy) {
      case YieldStrategy.LIDO:
        adapter = this.lidoAdapter.connect(signer) as any;
        break;
      case YieldStrategy.AAVE:
        adapter = this.aaveAdapter.connect(signer) as any;
        break;
      default:
        throw new Error(`Unsupported strategy: ${strategy}`);
    }

    try {
      // Calculate yield earned (simplified - in production, track deposits)
      const adapterInfo = await this.getAdapterInfo(strategy);
      const amountBigInt = BigInt(amount);
      const annualYield = (amountBigInt * BigInt(Math.floor(adapterInfo.apy * 10000))) / BigInt(10000);
      const dailyYield = annualYield / BigInt(365);
      const feeAmount = this.calculateYieldFee(dailyYield.toString());

      // Execute withdrawal
      const tx = await adapter.withdraw(amountBigInt);
      const receipt = await tx.wait();

      const netAmount = (amountBigInt - BigInt(feeAmount)).toString();

      return {
        withdrawn: amount,
        feeAmount,
        netAmount,
      };
    } catch (error: any) {
      logger.error(`Withdraw error for ${strategy}:`, error);
      throw new Error(`Failed to withdraw from ${strategy}: ${error.message}`);
    }
  }

  // Get user balance in adapter
  async getBalance(strategy: YieldStrategy, userAddress: string): Promise<string> {
    let adapter: ethers.Contract;

    switch (strategy) {
      case YieldStrategy.LIDO:
        adapter = this.lidoAdapter;
        break;
      case YieldStrategy.AAVE:
        adapter = this.aaveAdapter;
        break;
      default:
        throw new Error(`Unsupported strategy: ${strategy}`);
    }

    try {
      const balance = await adapter.getBalance(userAddress);
      return balance.toString();
    } catch (error) {
      logger.error(`Error getting balance for ${strategy}:`, error);
      return '0';
    }
  }
}

export const yieldAdaptersService = new YieldAdaptersService();

