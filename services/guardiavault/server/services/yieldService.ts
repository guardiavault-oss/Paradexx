/**
 * Yield Service
 * Service for managing yield-generating vaults with Lido and Aave integrations
 */

import { ethers } from 'ethers';
import { logInfo, logError } from './logger.js';

// Contract interfaces (would be generated from artifacts in production)
interface YieldVaultContract extends ethers.Contract {
  getVault(vaultId: bigint): Promise<YieldVaultData>;
  getVaultsByOwner(owner: string): Promise<bigint[]>;
  getEstimatedAPY(protocol: string): Promise<bigint>;
  deposit(guardiaVaultId: bigint, stakingProtocol: string, options?: { value?: bigint }): Promise<ethers.ContractTransactionResponse>;
  createYieldVault(guardiaVaultId: bigint, asset: string, amount: bigint, stakingProtocol: string): Promise<ethers.ContractTransactionResponse>;
  updateYield(vaultId: bigint, newTotalValue: bigint): Promise<ethers.ContractTransactionResponse>;
  harvest(vaultId: bigint): Promise<ethers.ContractTransactionResponse>;
}

interface YieldVaultData {
  owner: string;
  guardiaVaultId: bigint;
  asset: string;
  principal: bigint;
  yieldAccumulated: bigint;
  yieldFeeCollected: bigint;
  stakingProtocol: string;
  stakedAmount: bigint;
  createdAt: bigint;
  lastHarvest: bigint;
  isNative: boolean;
  totalValue: bigint;
}

export interface YieldStrategy {
  name: string;
  protocol: string;
  apy: number;
  tvl: number;
  riskLevel: 'low' | 'medium' | 'high';
  adapterAddress?: string;
}

export interface YieldPosition {
  vaultId: string;
  protocol: string;
  asset: string;
  principal: number;
  currentValue: number;
  yieldEarned: number;
  apy: number;
  lastUpdate: Date;
  createdAt: Date;
}

export class YieldService {
  private provider: ethers.JsonRpcProvider | null = null;
  private yieldVaultContract: YieldVaultContract | null = null;
  private lidoAdapter: ethers.Contract | null = null;
  private aaveAdapter: ethers.Contract | null = null;

  constructor() {
    // Initialize provider
    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.MAINNET_RPC_URL;
    if (!rpcUrl) {
      // Don't throw error - YieldService can work without RPC in development
      // Only log info - will operate in limited mode
      logInfo('YieldService: No RPC URL configured - operating in limited mode (mock data only)', { 
        context: 'YieldService.init' 
      });
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Initialize contract if address is available
    const yieldVaultAddress = process.env.YIELD_VAULT_ADDRESS;
    if (yieldVaultAddress) {
      // In production, load ABI from artifacts
      // For now, use minimal interface
      try {
        this.yieldVaultContract = new ethers.Contract(
          yieldVaultAddress,
          [
            'function getVault(uint256) view returns (address,uint256,address,uint256,uint256,uint256,address,uint256,uint256,uint256,bool,uint256)',
            'function getVaultsByOwner(address) view returns (uint256[])',
            'function getEstimatedAPY(address) view returns (uint256)',
            'function deposit(uint256,address) payable returns (uint256)',
            'function createYieldVault(uint256,address,uint256,address) returns (uint256)',
            'function updateYield(uint256,uint256)',
            'function harvest(uint256)',
            'function protocolTypes(address) view returns (uint8)',
          ],
          this.provider
        ) as unknown as YieldVaultContract;
      } catch (error) {
        logError(error as Error, { context: 'YieldService.init.contract' });
      }
    }

    // Initialize adapter contracts
    const lidoAdapterAddress = process.env.LIDO_ADAPTER_ADDRESS;
    const aaveAdapterAddress = process.env.AAVE_ADAPTER_ADDRESS;

    if (lidoAdapterAddress && this.provider) {
      this.lidoAdapter = new ethers.Contract(
        lidoAdapterAddress,
        [
          'function getBalance(address) view returns (uint256)',
          'function getETHValue(uint256) view returns (uint256)',
          'function getCurrentAPY() view returns (uint256)',
        ],
        this.provider
      );
    }

    if (aaveAdapterAddress && this.provider) {
      this.aaveAdapter = new ethers.Contract(
        aaveAdapterAddress,
        [
          'function getBalance(address,address) view returns (uint256)',
          'function getCurrentAPY(address) view returns (uint256)',
          'function getAToken(address) view returns (address)',
        ],
        this.provider
      );
    }
  }

  /**
   * Get available yield strategies
   */
  async getAvailableStrategies(): Promise<YieldStrategy[]> {
    try {
      const strategies: YieldStrategy[] = [
        {
          name: 'Lido Staking',
          protocol: 'lido',
          apy: 5.2,
          tvl: 32_000_000_000, // $32B
          riskLevel: 'low',
          adapterAddress: process.env.LIDO_ADAPTER_ADDRESS,
        },
        {
          name: 'Aave USDC',
          protocol: 'aave',
          apy: 4.1,
          tvl: 8_500_000_000, // $8.5B
          riskLevel: 'low',
          adapterAddress: process.env.AAVE_ADAPTER_ADDRESS,
        },
        {
          name: 'Aave ETH',
          protocol: 'aave',
          apy: 3.8,
          tvl: 2_100_000_000, // $2.1B
          riskLevel: 'low',
          adapterAddress: process.env.AAVE_ADAPTER_ADDRESS,
        },
      ];

      // If contract is available, get real APY estimates
      if (this.yieldVaultContract) {
        for (const strategy of strategies) {
          if (strategy.adapterAddress) {
            try {
              const apyBps = await this.yieldVaultContract.getEstimatedAPY(strategy.adapterAddress);
              strategy.apy = Number(apyBps) / 100; // Convert basis points to percentage
            } catch (error) {
              logError(error as Error, { context: 'getAvailableStrategies', protocol: strategy.protocol });
            }
          }
        }
      }

      return strategies;
    } catch (error) {
      logError(error as Error, { context: 'getAvailableStrategies' });
      throw error;
    }
  }

  /**
   * Get current yield positions for a user
   */
  async getUserPositions(userAddress: string): Promise<YieldPosition[]> {
    try {
      if (!this.yieldVaultContract) {
        throw new Error('YieldVault contract not initialized');
      }

      // Get user's vault IDs
      const vaultIds = await this.yieldVaultContract.getVaultsByOwner(userAddress);

      const positions: YieldPosition[] = [];

      for (const vaultId of vaultIds) {
        try {
          const vaultData = await this.yieldVaultContract.getVault(vaultId);

          // Query actual protocol value
          const currentValue = await this.getCurrentVaultValue(vaultId.toString(), vaultData);

          // Get protocol name
          const protocolName = await this.getProtocolName(vaultData.stakingProtocol);

          // Get APY (with asset for Aave)
          const assetSymbol = vaultData.asset === ethers.ZeroAddress ? 'ETH' : await this.getTokenSymbol(vaultData.asset);
          const apy = await this.getProtocolAPY(vaultData.stakingProtocol, assetSymbol);

          positions.push({
            vaultId: vaultId.toString(),
            protocol: protocolName,
            asset: vaultData.asset === ethers.ZeroAddress ? 'ETH' : await this.getTokenSymbol(vaultData.asset),
            principal: parseFloat(ethers.formatEther(vaultData.principal)),
            currentValue: parseFloat(ethers.formatEther(currentValue)),
            yieldEarned: parseFloat(ethers.formatEther(vaultData.yieldAccumulated)),
            apy,
            lastUpdate: new Date(Number(vaultData.lastHarvest) * 1000),
            createdAt: new Date(Number(vaultData.createdAt) * 1000),
          });
        } catch (error) {
          logError(error as Error, { context: 'getUserPositions', vaultId: vaultId.toString() });
          // Continue with other vaults
        }
      }

      return positions;
    } catch (error) {
      logError(error as Error, { context: 'getUserPositions' });
      throw error;
    }
  }

  /**
   * Create a new yield position
   */
  async createYieldPosition(
    userAddress: string,
    guardiaVaultId: number,
    asset: string,
    amount: string,
    protocol: string
  ): Promise<ethers.TransactionRequest> {
    try {
      if (!this.yieldVaultContract) {
        throw new Error('YieldVault contract not initialized');
      }

      const protocolAddress = await this.getProtocolAddress(protocol);
      if (!protocolAddress) {
        throw new Error(`Protocol ${protocol} not found`);
      }

      const amountWei = ethers.parseEther(amount);
      const guardiaVaultIdBig = BigInt(guardiaVaultId);

      let txRequest: ethers.TransactionRequest;

      if (asset === 'ETH' || asset === ethers.ZeroAddress) {
        // Native ETH deposit
        txRequest = await (this.yieldVaultContract as unknown as ethers.Contract).deposit.populateTransaction(
          guardiaVaultIdBig,
          protocolAddress
        );
        txRequest.value = amountWei;
      } else {
        // ERC20 token deposit
        txRequest = await (this.yieldVaultContract as unknown as ethers.Contract).createYieldVault.populateTransaction(
          guardiaVaultIdBig,
          asset,
          amountWei,
          protocolAddress
        );
      }

      return txRequest;
    } catch (error) {
      logError(error as Error, { context: 'createYieldPosition' });
      throw error;
    }
  }

  /**
   * Update yield for a vault (called by cron job)
   * If KEEPER_PRIVATE_KEY is set, will update on-chain
   * Otherwise, just logs the calculated value
   */
  async updateVaultYield(vaultId: string): Promise<void> {
    try {
      if (!this.yieldVaultContract || !this.provider) {
        throw new Error('YieldVault contract not initialized');
      }

      const vaultData = await this.yieldVaultContract.getVault(BigInt(vaultId));
      const currentValue = await this.getCurrentVaultValue(vaultId, vaultData);

      logInfo(`Yield update for vault ${vaultId}`, {
        vaultId,
        currentValue: ethers.formatEther(currentValue),
        principal: ethers.formatEther(vaultData.principal),
        yieldAccumulated: ethers.formatEther(vaultData.yieldAccumulated),
      });

      // Update on-chain if keeper private key is configured
      const keeperPrivateKey = process.env.KEEPER_PRIVATE_KEY;
      if (keeperPrivateKey && keeperPrivateKey !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        try {
          const signer = new ethers.Wallet(keeperPrivateKey, this.provider);
          const contractWithSigner = this.yieldVaultContract.connect(signer) as YieldVaultContract;
          
          logInfo(`Updating yield on-chain for vault ${vaultId}`, {
            vaultId,
            currentValue: ethers.formatEther(currentValue),
          });

          const tx = await contractWithSigner.updateYield(BigInt(vaultId), currentValue);
          const receipt = await tx.wait();

          logInfo(`Yield updated on-chain for vault ${vaultId}`, {
            vaultId,
            txHash: receipt?.hash,
            blockNumber: receipt?.blockNumber,
          });
        } catch (onChainError) {
          // Log but don't throw - allow cron to continue with other vaults
          logError(onChainError as Error, {
            context: 'updateVaultYield.onchain',
            vaultId,
            note: 'Failed to update on-chain, but value calculated successfully',
          });
        }
      } else {
        logInfo(`Keeper private key not configured, skipping on-chain update for vault ${vaultId}`, {
          vaultId,
          note: 'Set KEEPER_PRIVATE_KEY in environment to enable on-chain updates',
        });
      }
    } catch (error) {
      logError(error as Error, { context: 'updateVaultYield', vaultId });
      throw error;
    }
  }

  /**
   * Harvest yield manually for a vault
   */
  async harvestVault(vaultId: string, signer?: ethers.Signer): Promise<string> {
    try {
      if (!this.yieldVaultContract) {
        throw new Error('Contract not initialized');
      }

      const contract = signer
        ? (this.yieldVaultContract.connect(signer) as YieldVaultContract)
        : this.yieldVaultContract;

      // Call harvest function (queries protocol and updates yield)
      const tx = await contract.harvest(BigInt(vaultId));
      const receipt = await tx.wait();

      logInfo(`Harvested yield for vault ${vaultId}`, {
        vaultId,
        txHash: receipt?.hash,
      });

      return receipt?.hash || '';
    } catch (error) {
      logError(error as Error, { context: 'harvestVault', vaultId });
      throw error;
    }
  }

  /**
   * Get current vault value from protocol
   */
  private async getCurrentVaultValue(vaultId: string, vaultData: YieldVaultData): Promise<bigint> {
    try {
      const protocolName = await this.getProtocolName(vaultData.stakingProtocol);

      switch (protocolName.toLowerCase()) {
        case 'lido':
          return await this.getLidoValue(vaultData);
        case 'aave':
          return await this.getAaveValue(vaultData);
        default:
          // Fallback: return total value from contract
          return vaultData.totalValue || vaultData.principal;
      }
    } catch (error) {
      logError(error as Error, { context: 'getCurrentVaultValue', vaultId });
      return vaultData.principal; // Fallback to principal
    }
  }

  /**
   * Get Lido stETH value
   */
  private async getLidoValue(vaultData: YieldVaultData): Promise<bigint> {
    if (!this.lidoAdapter) {
      // Fallback calculation
      const timeElapsed = Date.now() / 1000 - Number(vaultData.createdAt);
      const yearlyGrowth = 0.052; // 5.2% APY
      const growth = (timeElapsed / (365 * 24 * 3600)) * yearlyGrowth;
      return vaultData.principal + BigInt(Math.floor(Number(vaultData.principal) * growth));
    }

    try {
      // Get stETH balance for this contract
      const stETHBalance = await this.lidoAdapter.getBalance(this.yieldVaultContract?.target as string);
      
      if (stETHBalance > 0n) {
        // Convert stETH to ETH value
        return await this.lidoAdapter.getETHValue(stETHBalance);
      }

      return vaultData.principal;
    } catch (error) {
      logError(error as Error, { context: 'getLidoValue' });
      return vaultData.principal;
    }
  }

  /**
   * Get Aave aToken value
   */
  private async getAaveValue(vaultData: YieldVaultData): Promise<bigint> {
    if (!this.aaveAdapter || vaultData.asset === ethers.ZeroAddress) {
      // Fallback calculation
      const timeElapsed = Date.now() / 1000 - Number(vaultData.createdAt);
      const yearlyGrowth = 0.041; // 4.1% APY
      const growth = (timeElapsed / (365 * 24 * 3600)) * yearlyGrowth;
      return vaultData.principal + BigInt(Math.floor(Number(vaultData.principal) * growth));
    }

    try {
      // Get aToken balance - balance is already in underlying terms with interest
      const aTokenBalance = await this.aaveAdapter.getBalance(
        vaultData.asset,
        this.yieldVaultContract?.target as string
      );

      return aTokenBalance > 0n ? aTokenBalance : vaultData.principal;
    } catch (error) {
      logError(error as Error, { context: 'getAaveValue' });
      return vaultData.principal;
    }
  }

  /**
   * Helper functions
   */
  private async getProtocolName(protocolAddress: string): Promise<string> {
    if (!this.yieldVaultContract || !this.provider) return 'Unknown';

    try {
      // Check protocol type enum from contract
      const protocolType = await this.yieldVaultContract.protocolTypes(protocolAddress);
      
      // ProtocolType enum: 0 = NONE, 1 = LIDO, 2 = AAVE
      if (protocolType === 1n) return 'lido';
      if (protocolType === 2n) return 'aave';
      
      return 'Unknown';
    } catch {
      // Check if it's a known adapter address
      if (protocolAddress.toLowerCase() === process.env.LIDO_ADAPTER_ADDRESS?.toLowerCase()) {
        return 'lido';
      }
      if (protocolAddress.toLowerCase() === process.env.AAVE_ADAPTER_ADDRESS?.toLowerCase()) {
        return 'aave';
      }
      return 'Unknown';
    }
  }

  private async getProtocolAddress(protocolName: string): Promise<string> {
    const protocolMap: Record<string, string> = {
      'lido': process.env.LIDO_ADAPTER_ADDRESS || '',
      'aave': process.env.AAVE_ADAPTER_ADDRESS || '',
    };

    return protocolMap[protocolName.toLowerCase()] || '';
  }

  private async getProtocolAPY(protocolAddress: string, asset?: string): Promise<number> {
    // First try to get from contract if available (real on-chain data)
    if (this.yieldVaultContract) {
      try {
        const apyBps = await this.yieldVaultContract.getEstimatedAPY(protocolAddress);
        const apy = Number(apyBps) / 100; // Convert basis points to percentage
        if (apy <= 0) {
          throw new Error(`Contract returned invalid APY: ${apy}`);
        }
        return apy;
      } catch (error) {
        logError(error as Error, { context: 'getProtocolAPY.contract', protocolAddress });
        // Continue to API fallback if contract query fails
      }
    }

    // Real API calls - MUST succeed or throw error
    const protocolName = await this.getProtocolName(protocolAddress);
    
      if (protocolName.toLowerCase() === 'lido') {
        // Real Lido API
      try {
        const response = await fetch("https://api.lido.fi/v1/steth/apr");
        if (!response.ok) {
          throw new Error(`Lido API returned status ${response.status}`);
        }
          const data = await response.json();
        if (!data.apr && data.apr !== 0) {
          throw new Error("Lido API response missing APR data");
        }
        const apy = parseFloat(data.apr) * 100;
        if (apy <= 0) {
          throw new Error(`Invalid APY from Lido API: ${apy}`);
        }
        return apy;
      } catch (error) {
        const err = error as Error;
        logError(err, { 
          context: 'getProtocolAPY.api',
          protocolName,
          message: "CRITICAL: Cannot fetch real Lido APY - system cannot operate with fake data"
        });
        throw new Error(
          `Failed to fetch Lido APY: ${err.message}. ` +
          `Cannot proceed without real data. Check network connectivity and DNS resolution.`
        );
      }
      }

      if (protocolName.toLowerCase() === 'aave') {
        // Real Aave API
      try {
        const response = await fetch("https://api.aave.com/v3/protocol-data");
        if (!response.ok) {
          throw new Error(`Aave API returned status ${response.status}`);
        }
          const data = await response.json();
          const assetLower = asset?.toLowerCase();
          const reserves = data.reserves || [];
        
        if (reserves.length === 0) {
          throw new Error("Aave API returned empty reserves data");
        }
          
          for (const reserve of reserves) {
            const symbol = reserve.symbol?.toLowerCase();
            if (symbol === assetLower || 
                (assetLower === "usdc" && symbol === "usdc.e") ||
                (assetLower === "usdt" && symbol === "usdt")) {
              const liquidityRate = parseFloat(reserve.liquidityRate || "0");
            if (liquidityRate <= 0) {
              throw new Error(`Invalid liquidity rate for ${asset}: ${liquidityRate}`);
            }
              const apy = (liquidityRate / 1e25) * 100;
            if (apy <= 0) {
              throw new Error(`Calculated APY for ${asset} is invalid: ${apy}`);
            }
            return apy;
          }
        }
        
        throw new Error(`Asset ${asset} not found in Aave reserves`);
      } catch (error) {
        const err = error as Error;
        logError(err, { 
          context: 'getProtocolAPY.api',
          protocolName,
          asset,
          message: "CRITICAL: Cannot fetch real Aave APY - system cannot operate with fake data"
        });
        throw new Error(
          `Failed to fetch Aave APY for ${asset}: ${err.message}. ` +
          `Cannot proceed without real data. Check network connectivity and DNS resolution.`
        );
      }
    }

    // Unknown protocol - cannot return fake data
    throw new Error(
      `Protocol ${protocolName} (${protocolAddress}) not supported or not implemented. ` +
      `Cannot return fake APY data for real money.`
    );
  }

  private async getTokenSymbol(tokenAddress: string): Promise<string> {
    if (!this.provider || tokenAddress === ethers.ZeroAddress) return 'ETH';

    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function symbol() view returns (string)'],
        this.provider
      );
      return await tokenContract.symbol();
    } catch {
      return 'UNKNOWN';
    }
  }
}

export const yieldService = new YieldService();

