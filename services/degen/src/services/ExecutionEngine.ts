// ============================================================================
// APEX SNIPER - Execution Engine
// High-speed swap execution with multiple strategies
// ============================================================================

import { ethers, Wallet, JsonRpcProvider, Contract, TransactionRequest } from 'ethers';
import EventEmitter from 'eventemitter3';
import {
  SnipeConfig,
  SnipeOrder,
  OrderStatus,
  ExecutionMethod,
  SnipeType,
  DEX,
  Position,
  PositionStatus,
  TakeProfitTarget,
  TokenInfo
} from '../types';
import { config } from '../config';
import {
  logger,
  generateId,
  checksumAddress,
  getDeadline,
  estimateGasPrice,
  getAmountOut,
  getTokenInfo,
  getTokenBalance,
  getPairInfo,
  sleep
} from '../utils';
import { flashbotsExecutor } from './FlashbotsProvider';
import { tokenAnalyzer } from './TokenAnalyzer';
import { marketRegimeDetector } from './MarketRegimeDetector';
import { portfolioAnalytics } from './PortfolioAnalytics';

// ============================================================================
// ABIs
// ============================================================================

const ROUTER_V2_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
  'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
  'function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)',
  'function WETH() external pure returns (address)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)'
];

// ============================================================================
// EVENTS
// ============================================================================

export interface ExecutionEvents {
  'order:created': (order: SnipeOrder) => void;
  'order:submitted': (order: SnipeOrder) => void;
  'order:confirmed': (order: SnipeOrder) => void;
  'order:failed': (order: SnipeOrder, error: string) => void;
  'position:opened': (position: Position) => void;
  'position:updated': (position: Position) => void;
  'position:closed': (position: Position) => void;
}

// ============================================================================
// WALLET MANAGER
// ============================================================================

interface ManagedWallet {
  id: string;
  name: string;
  wallet: Wallet;
  address: string;
  nonce: number;
  locked: boolean;
}

class WalletManager {
  private wallets: Map<string, ManagedWallet> = new Map();
  private provider: JsonRpcProvider;
  
  constructor(provider: JsonRpcProvider) {
    this.provider = provider;
  }
  
  async addWallet(id: string, name: string, privateKey: string): Promise<ManagedWallet> {
    const wallet = new Wallet(privateKey, this.provider);
    const nonce = await this.provider.getTransactionCount(wallet.address, 'pending');
    
    const managed: ManagedWallet = {
      id,
      name,
      wallet,
      address: checksumAddress(wallet.address),
      nonce,
      locked: false
    };
    
    this.wallets.set(id, managed);
    return managed;
  }
  
  getWallet(id: string): ManagedWallet | undefined {
    return this.wallets.get(id);
  }
  
  async getNextNonce(id: string): Promise<number> {
    const managed = this.wallets.get(id);
    if (!managed) throw new Error(`Wallet ${id} not found`);
    
    // Get fresh nonce and compare with tracked
    const freshNonce = await this.provider.getTransactionCount(managed.address, 'pending');
    managed.nonce = Math.max(managed.nonce, freshNonce);
    
    return managed.nonce++;
  }
  
  async lockWallet(id: string): Promise<boolean> {
    const managed = this.wallets.get(id);
    if (!managed || managed.locked) return false;
    managed.locked = true;
    return true;
  }
  
  unlockWallet(id: string): void {
    const managed = this.wallets.get(id);
    if (managed) managed.locked = false;
  }
  
  getAllWallets(): ManagedWallet[] {
    return Array.from(this.wallets.values());
  }
}

// ============================================================================
// EXECUTION ENGINE
// ============================================================================

export class ExecutionEngine extends EventEmitter<ExecutionEvents> {
  private provider: JsonRpcProvider;
  private walletManager: WalletManager;
  private pendingOrders: Map<string, SnipeOrder> = new Map();
  private positions: Map<string, Position> = new Map();
  private routers: Map<DEX, Contract>;
  
  constructor() {
    super();
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.walletManager = new WalletManager(this.provider);
    this.routers = new Map();
    
    // Initialize routers
    this.initializeRouters();
  }

  private initializeRouters(): void {
    this.routers.set(
      DEX.UNISWAP_V2,
      new Contract(config.contracts.uniswapV2Router, ROUTER_V2_ABI, this.provider)
    );
    this.routers.set(
      DEX.SUSHISWAP,
      new Contract(config.contracts.sushiswapRouter, ROUTER_V2_ABI, this.provider)
    );
  }

  // ==========================================================================
  // WALLET MANAGEMENT
  // ==========================================================================

  async addWallet(id: string, name: string, privateKey: string): Promise<string> {
    const managed = await this.walletManager.addWallet(id, name, privateKey);
    logger.info(`Wallet added: ${name} (${managed.address})`);
    return managed.address;
  }

  getWallets(): Array<{ id: string; name: string; address: string }> {
    return this.walletManager.getAllWallets().map(w => ({
      id: w.id,
      name: w.name,
      address: w.address
    }));
  }

  // ==========================================================================
  // ORDER EXECUTION
  // ==========================================================================

  async executeSnipe(snipeConfig: SnipeConfig): Promise<SnipeOrder[]> {
    const orders: SnipeOrder[] = [];
    
    // Safety check if enabled
    if (snipeConfig.safetyCheckEnabled && snipeConfig.targetToken) {
      const safetyCheck = await tokenAnalyzer.quickSafetyCheck(snipeConfig.targetToken);
      if (!safetyCheck.safe) {
        logger.warn(`Safety check failed: ${safetyCheck.reason}`);
        throw new Error(`Safety check failed: ${safetyCheck.reason}`);
      }
    }
    
    // Adaptive position sizing based on market regime
    let adjustedAmount = snipeConfig.amountInWei;
    const regime = marketRegimeDetector.getLastAnalysis();
    
    if (regime) {
      const multiplier = regime.recommendedAction.positionSizeMultiplier;
      adjustedAmount = BigInt(Math.floor(Number(snipeConfig.amountInWei) * multiplier));
      
      if (multiplier !== 1.0) {
        logger.info(`[Execution] Adjusted position size by ${(multiplier * 100).toFixed(0)}% based on ${regime.currentRegime} market regime`);
      }
    }
    
    // Portfolio risk check
    if (snipeConfig.targetToken) {
      const amountETH = Number(ethers.formatEther(adjustedAmount));
      const canOpen = portfolioAnalytics.canOpenPosition(amountETH, snipeConfig.targetToken);
      
      if (!canOpen.allowed) {
        logger.warn(`Portfolio risk check failed: ${canOpen.reason}`);
        throw new Error(`Portfolio risk check failed: ${canOpen.reason}`);
      }
    }
    
    // Update config with adjusted amount
    const adjustedConfig = { ...snipeConfig, amountInWei: adjustedAmount };
    
    // Execute for each wallet
    for (const walletId of snipeConfig.walletIds) {
      try {
        const order = await this.createAndExecuteOrder(adjustedConfig, walletId);
        orders.push(order);
      } catch (error) {
        logger.error(`Failed to execute for wallet ${walletId}:`, error);
      }
    }
    
    return orders;
  }

  private async createAndExecuteOrder(
    snipeConfig: SnipeConfig,
    walletId: string
  ): Promise<SnipeOrder> {
    const wallet = this.walletManager.getWallet(walletId);
    if (!wallet) throw new Error(`Wallet ${walletId} not found`);
    
    const router = this.routers.get(snipeConfig.targetDex);
    if (!router) throw new Error(`Router not found for ${snipeConfig.targetDex}`);
    
    // Build order
    const order: SnipeOrder = {
      id: generateId(),
      configId: snipeConfig.id,
      type: snipeConfig.type,
      status: OrderStatus.PENDING,
      tokenIn: config.contracts.weth,
      tokenOut: snipeConfig.targetToken!,
      pair: snipeConfig.targetPair || '',
      dex: snipeConfig.targetDex,
      amountIn: snipeConfig.amountInWei,
      amountOutMin: 0n,
      expectedAmountOut: 0n,
      walletId,
      walletAddress: wallet.address,
      executionMethod: snipeConfig.executionMethod,
      detectedAt: Date.now(),
      retryCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.pendingOrders.set(order.id, order);
    this.emit('order:created', order);
    
    try {
      // Calculate expected output
      const path = [config.contracts.weth, snipeConfig.targetToken!];
      const amounts = await router.getAmountsOut(order.amountIn, path);
      order.expectedAmountOut = amounts[1];
      
      // Apply slippage
      const slippageMultiplier = BigInt(Math.floor((100 - snipeConfig.slippagePercent) * 100));
      order.amountOutMin = (order.expectedAmountOut * slippageMultiplier) / 10000n;
      
      // Build transaction
      const deadline = getDeadline(snipeConfig.deadline);
      const gasData = await estimateGasPrice(this.provider, snipeConfig.gasMultiplier);
      
      const txData = router.interface.encodeFunctionData(
        'swapExactETHForTokensSupportingFeeOnTransferTokens',
        [order.amountOutMin, path, wallet.address, deadline]
      );
      
      const nonce = await this.walletManager.getNextNonce(walletId);
      
      const tx: TransactionRequest = {
        to: await router.getAddress(),
        data: txData,
        value: order.amountIn,
        gasLimit: 300000n,
        maxFeePerGas: gasData.maxFeePerGas,
        maxPriorityFeePerGas: snipeConfig.priorityFee || gasData.maxPriorityFeePerGas,
        nonce,
        chainId: config.chainId,
        type: 2
      };
      
      // Cap gas price
      if (BigInt(tx.maxFeePerGas!) > snipeConfig.maxGasPrice) {
        tx.maxFeePerGas = snipeConfig.maxGasPrice;
      }
      
      order.status = OrderStatus.EXECUTING;
      order.submittedAt = Date.now();
      order.updatedAt = Date.now();
      this.emit('order:submitted', order);
      
      // Execute based on method
      const result = await flashbotsExecutor.executeSwap(
        wallet.wallet,
        tx,
        snipeConfig.executionMethod
      );
      
      if (result.success) {
        order.status = OrderStatus.CONFIRMED;
        order.txHash = result.txHash;
        order.blockNumber = result.blockNumber;
        order.confirmedAt = Date.now();
        order.latencyMs = order.confirmedAt - order.detectedAt;
        
        // Get actual output
        const balance = await getTokenBalance(
          this.provider,
          snipeConfig.targetToken!,
          wallet.address
        );
        order.actualAmountOut = balance; // Simplified - should track delta
        
        this.emit('order:confirmed', order);
        
        // Create position if auto-sell enabled
        if (snipeConfig.autoSellEnabled) {
          await this.createPosition(order, snipeConfig);
        }
        
        logger.info(`Order ${order.id} confirmed: ${result.txHash}`);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      order.status = OrderStatus.FAILED;
      order.error = (error as Error).message;
      order.updatedAt = Date.now();
      
      this.emit('order:failed', order, order.error);
      logger.error(`Order ${order.id} failed:`, error);
      
      // Retry logic
      if (order.retryCount < snipeConfig.retries) {
        order.retryCount++;
        logger.info(`Retrying order ${order.id} (attempt ${order.retryCount})`);
        return this.createAndExecuteOrder(snipeConfig, walletId);
      }
    }
    
    order.updatedAt = Date.now();
    return order;
  }

  // ==========================================================================
  // BUY TOKEN (SIMPLIFIED INTERFACE)
  // ==========================================================================

  async buyToken(
    tokenAddress: string,
    amountEth: string,
    walletId: string,
    options: {
      slippage?: number;
      dex?: DEX;
      method?: ExecutionMethod;
      safetyCheck?: boolean;
    } = {}
  ): Promise<SnipeOrder> {
    const snipeConfig: SnipeConfig = {
      id: generateId(),
      type: SnipeType.LIMIT_ORDER,
      enabled: true,
      targetToken: checksumAddress(tokenAddress),
      targetDex: options.dex || DEX.UNISWAP_V2,
      executionMethod: options.method || ExecutionMethod.FLASHBOTS,
      walletIds: [walletId],
      amountInWei: ethers.parseEther(amountEth),
      amountType: 'FIXED',
      blockDelay: 0,
      maxBlocks: 5,
      gasMultiplier: 1.2,
      maxGasPrice: ethers.parseUnits('100', 'gwei'),
      priorityFee: ethers.parseUnits('2', 'gwei'),
      minLiquidity: 1000,
      maxBuyTax: 10,
      maxSellTax: 15,
      safetyCheckEnabled: options.safetyCheck ?? true,
      antiRugEnabled: true,
      autoSellEnabled: false,
      takeProfitPercentages: [],
      stopLossPercentage: 0,
      trailingStopEnabled: false,
      trailingStopPercentage: 0,
      slippagePercent: options.slippage || 5,
      deadline: 300,
      retries: 2,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const orders = await this.executeSnipe(snipeConfig);
    return orders[0];
  }

  // ==========================================================================
  // SELL TOKEN
  // ==========================================================================

  async sellToken(
    tokenAddress: string,
    amountOrPercent: string | number,
    walletId: string,
    options: {
      slippage?: number;
      dex?: DEX;
      method?: ExecutionMethod;
      isPercent?: boolean;
    } = {}
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const wallet = this.walletManager.getWallet(walletId);
    if (!wallet) throw new Error(`Wallet ${walletId} not found`);
    
    const router = this.routers.get(options.dex || DEX.UNISWAP_V2)!;
    const token = new Contract(tokenAddress, ERC20_ABI, this.provider);
    
    // Get balance and calculate amount
    const balance = await token.balanceOf(wallet.address);
    let sellAmount: bigint;
    
    if (options.isPercent) {
      const percent = typeof amountOrPercent === 'string' 
        ? parseFloat(amountOrPercent) 
        : amountOrPercent;
      sellAmount = (balance * BigInt(Math.floor(percent * 100))) / 10000n;
    } else {
      const tokenInfo = await getTokenInfo(this.provider, tokenAddress);
      sellAmount = ethers.parseUnits(amountOrPercent.toString(), tokenInfo?.decimals || 18);
    }
    
    if (sellAmount > balance) {
      return { success: false, error: 'Insufficient balance' };
    }
    
    // Check and approve if needed
    const allowance = await token.allowance(wallet.address, await router.getAddress());
    if (allowance < sellAmount) {
      const tokenWithSigner = new Contract(tokenAddress, ERC20_ABI, wallet.wallet);
      const approveTx = await tokenWithSigner.approve(
        await router.getAddress(),
        ethers.MaxUint256
      );
      await approveTx.wait();
      logger.info(`Approved ${tokenAddress} for router`);
    }
    
    // Calculate output
    const path = [tokenAddress, config.contracts.weth];
    const amounts = await router.getAmountsOut(sellAmount, path);
    const expectedOut = amounts[1];
    
    // Apply slippage
    const slippage = options.slippage || 10;
    const minOut = (expectedOut * BigInt(100 - slippage)) / 100n;
    
    // Build sell tx
    const deadline = getDeadline(300);
    const gasData = await estimateGasPrice(this.provider, 1.2);
    const nonce = await this.walletManager.getNextNonce(walletId);
    
    const txData = router.interface.encodeFunctionData(
      'swapExactTokensForETHSupportingFeeOnTransferTokens',
      [sellAmount, minOut, path, wallet.address, deadline]
    );
    
    const tx: TransactionRequest = {
      to: await router.getAddress(),
      data: txData,
      gasLimit: 350000n,
      maxFeePerGas: gasData.maxFeePerGas,
      maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
      nonce,
      chainId: config.chainId,
      type: 2
    };
    
    // Execute
    const result = await flashbotsExecutor.executeSwap(
      wallet.wallet,
      tx,
      options.method || ExecutionMethod.FLASHBOTS
    );
    
    return result;
  }

  // ==========================================================================
  // POSITION MANAGEMENT
  // ==========================================================================

  private async createPosition(order: SnipeOrder, config: SnipeConfig): Promise<Position> {
    const tokenInfo = await getTokenInfo(this.provider, order.tokenOut);
    
    const takeProfitTargets: TakeProfitTarget[] = config.takeProfitPercentages.map((pct, i) => ({
      id: generateId(),
      percentage: pct,
      sellPercentage: 100 / config.takeProfitPercentages.length,
      triggered: false
    }));
    
    const position: Position = {
      id: generateId(),
      orderId: order.id,
      status: PositionStatus.OPEN,
      token: order.tokenOut,
      tokenInfo: tokenInfo!,
      entryPrice: 0, // Calculate from amounts
      entryAmountIn: order.amountIn,
      entryAmountOut: order.actualAmountOut || order.expectedAmountOut,
      entryTxHash: order.txHash!,
      entryBlock: order.blockNumber!,
      entryTimestamp: order.confirmedAt!,
      currentBalance: order.actualAmountOut || order.expectedAmountOut,
      currentPrice: 0,
      currentValueUSD: 0,
      unrealizedPnL: 0,
      unrealizedPnLPercentage: 0,
      exits: [],
      realizedPnL: 0,
      totalSold: 0n,
      takeProfitTargets,
      stopLoss: config.stopLossPercentage > 0 ? {
        percentage: config.stopLossPercentage,
        triggered: false
      } : undefined,
      trailingStop: config.trailingStopEnabled ? {
        percentage: config.trailingStopPercentage,
        highestPrice: 0,
        triggerPrice: 0,
        triggered: false
      } : undefined,
      walletId: order.walletId,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.positions.set(position.id, position);
    this.emit('position:opened', position);
    
    logger.info(`Position opened: ${position.id} for ${tokenInfo?.symbol}`);
    
    return position;
  }

  getPosition(id: string): Position | undefined {
    return this.positions.get(id);
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getOpenPositions(): Position[] {
    return this.getPositions().filter(p => p.status === PositionStatus.OPEN);
  }

  // ==========================================================================
  // ORDER RETRIEVAL
  // ==========================================================================

  getOrder(id: string): SnipeOrder | undefined {
    return this.pendingOrders.get(id);
  }

  getOrders(): SnipeOrder[] {
    return Array.from(this.pendingOrders.values());
  }

  getPendingOrders(): SnipeOrder[] {
    return this.getOrders().filter(o => 
      o.status === OrderStatus.PENDING || o.status === OrderStatus.EXECUTING
    );
  }

  // ==========================================================================
  // POSITION MONITORING (BACKGROUND)
  // ==========================================================================

  async startPositionMonitor(): Promise<void> {
    logger.info('Starting position monitor...');
    
    setInterval(async () => {
      for (const position of this.getOpenPositions()) {
        try {
          await this.updatePosition(position);
          await this.checkPositionTriggers(position);
        } catch (error) {
          logger.error(`Error updating position ${position.id}:`, error);
        }
      }
    }, 10000); // Every 10 seconds
  }

  private async updatePosition(position: Position): Promise<void> {
    const wallet = this.walletManager.getWallet(position.walletId);
    if (!wallet) return;
    
    // Update balance
    position.currentBalance = await getTokenBalance(
      this.provider,
      position.token,
      wallet.address
    );
    
    // Get current price
    const router = this.routers.get(DEX.UNISWAP_V2)!;
    try {
      const path = [position.token, config.contracts.weth];
      const amounts = await router.getAmountsOut(position.currentBalance, path);
      const currentValueEth = amounts[1];
      
      // Calculate PnL
      const entryValue = position.entryAmountIn;
      position.unrealizedPnL = Number(currentValueEth - entryValue) / 1e18;
      position.unrealizedPnLPercentage = 
        (Number(currentValueEth - entryValue) / Number(entryValue)) * 100;
      
      position.updatedAt = Date.now();
      this.emit('position:updated', position);
    } catch {
      // Price fetch failed, likely no liquidity
    }
  }

  private async checkPositionTriggers(position: Position): Promise<void> {
    // Check take profits
    for (const tp of position.takeProfitTargets) {
      if (!tp.triggered && position.unrealizedPnLPercentage >= tp.percentage) {
        await this.executeTakeProfit(position, tp);
      }
    }
    
    // Check stop loss
    if (position.stopLoss && !position.stopLoss.triggered) {
      if (position.unrealizedPnLPercentage <= -position.stopLoss.percentage) {
        await this.executeStopLoss(position);
      }
    }
    
    // Check trailing stop
    if (position.trailingStop && !position.trailingStop.triggered) {
      // Update highest price
      if (position.unrealizedPnLPercentage > position.trailingStop.highestPrice) {
        position.trailingStop.highestPrice = position.unrealizedPnLPercentage;
        position.trailingStop.triggerPrice = 
          position.trailingStop.highestPrice - position.trailingStop.percentage;
      }
      
      // Check if triggered
      if (position.unrealizedPnLPercentage <= position.trailingStop.triggerPrice) {
        await this.executeTrailingStop(position);
      }
    }
  }

  private async executeTakeProfit(position: Position, tp: TakeProfitTarget): Promise<void> {
    logger.info(`Executing take profit for position ${position.id} at ${tp.percentage}%`);
    
    const result = await this.sellToken(
      position.token,
      tp.sellPercentage,
      position.walletId,
      { isPercent: true, slippage: 10 }
    );
    
    if (result.success) {
      tp.triggered = true;
      tp.triggeredAt = Date.now();
      tp.txHash = result.txHash;
    }
  }

  private async executeStopLoss(position: Position): Promise<void> {
    logger.info(`Executing stop loss for position ${position.id}`);
    
    const result = await this.sellToken(
      position.token,
      100,
      position.walletId,
      { isPercent: true, slippage: 15 }
    );
    
    if (result.success && position.stopLoss) {
      position.stopLoss.triggered = true;
      position.stopLoss.triggeredAt = Date.now();
      position.stopLoss.txHash = result.txHash;
      position.status = PositionStatus.CLOSED;
      this.emit('position:closed', position);
    }
  }

  private async executeTrailingStop(position: Position): Promise<void> {
    logger.info(`Executing trailing stop for position ${position.id}`);
    
    const result = await this.sellToken(
      position.token,
      100,
      position.walletId,
      { isPercent: true, slippage: 15 }
    );
    
    if (result.success && position.trailingStop) {
      position.trailingStop.triggered = true;
      position.trailingStop.triggeredAt = Date.now();
      position.trailingStop.txHash = result.txHash;
      position.status = PositionStatus.CLOSED;
      this.emit('position:closed', position);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const executionEngine = new ExecutionEngine();
