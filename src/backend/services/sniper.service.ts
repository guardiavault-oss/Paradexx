import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { logger } from '../services/logger.service';
import { EventEmitter } from 'events';

function validateRpcUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Use reliable public RPCs with fallbacks
const DEFAULT_ETH_RPC = 'https://ethereum-rpc.publicnode.com';
const rpcUrl = process.env.ETH_RPC_URL || DEFAULT_ETH_RPC;
if (!validateRpcUrl(rpcUrl)) {
  logger.error('[SniperService] Invalid RPC URL configured, using default');
}

const config = {
  rpc: {
    mainnet: validateRpcUrl(rpcUrl) ? rpcUrl : DEFAULT_ETH_RPC,
    websocket: process.env.ETH_WS_URL || ''
  },
  wallet: {
    // Use SNIPER_PRIVATE_KEY if set, otherwise fall back to TREASURY_PRIVATE_KEY
    privateKey: process.env.SNIPER_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY || ''
  },
  dex: {
    uniswapV2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    uniswapV3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    uniswapV2Factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  },
  trading: {
    defaultSlippage: parseFloat(process.env.SNIPER_SLIPPAGE || '5'),
    defaultGasMultiplier: parseFloat(process.env.SNIPER_GAS_MULTIPLIER || '1.2'),
    maxGasPrice: process.env.SNIPER_MAX_GAS_GWEI || '100',
    transactionTimeout: parseInt(process.env.SNIPER_TX_TIMEOUT || '300000')
  },
  analysis: {
    minLiquidity: parseFloat(process.env.SNIPER_MIN_LIQUIDITY || '1'),
    honeypotCheckEnabled: process.env.SNIPER_HONEYPOT_CHECK !== 'false'
  }
};

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function owner() view returns (address)',
  'function getOwner() view returns (address)'
];

const PAIR_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function totalSupply() view returns (uint256)'
];

const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns (address pair)'
];

const ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
  'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
  'function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)',
  'function WETH() view returns (address)'
];

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  owner?: string;
}

export interface TokenSafetyAnalysis {
  tokenAddress: string;
  tokenInfo: TokenInfo | null;
  isHoneypot: boolean;
  honeypotReason?: string;
  hasMintFunction: boolean;
  hasOwnershipRenounced: boolean;
  buyTax: number;
  sellTax: number;
  maxTransactionAmount?: string;
  maxWalletAmount?: string;
  liquidityLocked: boolean;
  lockDuration?: number;
  isVerified: boolean;
  safetyScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  timestamp: number;
}

export interface WhaleWallet {
  address: string;
  label?: string;
  pnl24h?: number;
  winRate?: number;
  tradesCount?: number;
  isActive: boolean;
}

export interface WhaleActivity {
  wallet: string;
  action: 'buy' | 'sell';
  tokenAddress: string;
  tokenSymbol: string;
  amount: string;
  value: string;
  txHash: string;
  timestamp: number;
}

export interface MemeToken {
  address: string;
  name: string;
  symbol: string;
  launchTime: number;
  liquidity: string;
  price: string;
  priceChange24h: number;
  volume24h: string;
  holders: number;
  socialScore: number;
  isNew: boolean;
}

export interface Position {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  entryPrice: string;
  currentPrice: string;
  amount: string;
  value: string;
  pnl: string;
  pnlPercent: number;
  txHash: string;
  openedAt: number;
}

export interface TradeResult {
  success: boolean;
  txHash?: string;
  error?: string;
  tokenAmount?: string;
  ethAmount?: string;
  gasUsed?: string;
  effectivePrice?: string;
}

export class SniperService extends EventEmitter {
  private provider: JsonRpcProvider;
  private wallet: Wallet | null = null;
  private initialized: boolean = false;
  private trackedWhales: Map<string, WhaleWallet> = new Map();
  private positions: Map<string, Position> = new Map();
  private discoveredTokens: Map<string, MemeToken> = new Map();

  constructor() {
    super();
    this.provider = new JsonRpcProvider(config.rpc.mainnet);

    if (config.wallet.privateKey) {
      try {
        this.wallet = new Wallet(config.wallet.privateKey, this.provider);
        this.initialized = true;
        logger.info('[SniperService] Initialized with wallet:', this.wallet.address);
      } catch (error) {
        logger.warn('[SniperService] Invalid private key, running in read-only mode');
      }
    } else {
      logger.info('[SniperService] No private key configured, running in read-only mode');
    }
  }

  isConfigured(): boolean {
    return this.initialized && this.wallet !== null;
  }

  getWalletAddress(): string | null {
    return this.wallet?.address || null;
  }

  private async getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name().catch(() => 'Unknown'),
        contract.symbol().catch(() => '???'),
        contract.decimals().catch(() => 18),
        contract.totalSupply().catch(() => 0n)
      ]);

      let owner: string | undefined;
      try {
        owner = await contract.owner();
      } catch {
        try {
          owner = await contract.getOwner();
        } catch { }
      }

      return {
        address: ethers.getAddress(tokenAddress),
        name,
        symbol,
        decimals,
        totalSupply,
        owner
      };
    } catch (error) {
      logger.error(`[SniperService] Failed to get token info for ${tokenAddress}:`, error);
      return null;
    }
  }

  async analyzeToken(tokenAddress: string): Promise<TokenSafetyAnalysis> {
    const timestamp = Date.now();
    const warnings: string[] = [];

    try {
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      const tokenInfo = await this.getTokenInfo(tokenAddress);

      if (!tokenInfo) {
        return {
          tokenAddress,
          tokenInfo: null,
          isHoneypot: true,
          honeypotReason: 'Failed to fetch token info',
          hasMintFunction: false,
          hasOwnershipRenounced: false,
          buyTax: 0,
          sellTax: 0,
          liquidityLocked: false,
          isVerified: false,
          safetyScore: 0,
          riskLevel: 'critical',
          warnings: ['Could not analyze token - contract may not be a valid ERC20'],
          timestamp
        };
      }

      const factory = new ethers.Contract(config.dex.uniswapV2Factory, FACTORY_ABI, this.provider);
      const pairAddress = await factory.getPair(tokenAddress, config.dex.weth);

      let liquidity = 0n;
      let hasLiquidity = false;

      if (pairAddress !== ethers.ZeroAddress) {
        try {
          const pair = new ethers.Contract(pairAddress, PAIR_ABI, this.provider);
          const [token0, reserves] = await Promise.all([
            pair.token0(),
            pair.getReserves()
          ]);

          const wethReserve = token0.toLowerCase() === config.dex.weth.toLowerCase()
            ? reserves[0]
            : reserves[1];

          liquidity = wethReserve;
          hasLiquidity = wethReserve > ethers.parseEther('0.1');
        } catch (e) {
          warnings.push('Could not fetch liquidity info');
        }
      } else {
        warnings.push('No Uniswap V2 pair found');
      }

      const hasOwnershipRenounced = !tokenInfo.owner ||
        tokenInfo.owner === ethers.ZeroAddress ||
        tokenInfo.owner === '0x000000000000000000000000000000000000dEaD';

      if (!hasOwnershipRenounced) {
        warnings.push('Ownership not renounced - owner could modify contract');
      }

      if (!hasLiquidity) {
        warnings.push('Low liquidity - high slippage expected');
      }

      let isHoneypot = false;
      let buyTax = 0;
      let sellTax = 0;

      if (config.analysis.honeypotCheckEnabled && hasLiquidity) {
        try {
          const router = new ethers.Contract(config.dex.uniswapV2Router, ROUTER_ABI, this.provider);
          const testAmount = ethers.parseEther('0.01');

          const amountsOut = await router.getAmountsOut(testAmount, [config.dex.weth, tokenAddress]);
          const expectedTokens = amountsOut[1];

          if (expectedTokens === 0n) {
            isHoneypot = true;
            warnings.push('Honeypot detected: Cannot buy tokens');
          } else {
            const amountsBack = await router.getAmountsOut(expectedTokens, [tokenAddress, config.dex.weth]);
            const ethBack = amountsBack[1];

            const totalTax = ((Number(testAmount) - Number(ethBack)) / Number(testAmount)) * 100;
            buyTax = Math.max(0, Math.min(50, totalTax / 2));
            sellTax = Math.max(0, Math.min(50, totalTax / 2));

            if (totalTax > 80) {
              isHoneypot = true;
              warnings.push(`Honeypot detected: ${totalTax.toFixed(1)}% total tax`);
            } else if (totalTax > 20) {
              warnings.push(`High tax detected: ~${totalTax.toFixed(1)}% round trip`);
            }
          }
        } catch (e) {
          warnings.push('Could not simulate trade - possible honeypot');
          isHoneypot = true;
        }
      }

      let safetyScore = 100;
      if (isHoneypot) safetyScore -= 100;
      if (!hasOwnershipRenounced) safetyScore -= 20;
      if (!hasLiquidity) safetyScore -= 30;
      if (buyTax > 5) safetyScore -= buyTax;
      if (sellTax > 5) safetyScore -= sellTax;
      safetyScore = Math.max(0, safetyScore);

      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (safetyScore >= 80) riskLevel = 'low';
      else if (safetyScore >= 60) riskLevel = 'medium';
      else if (safetyScore >= 30) riskLevel = 'high';
      else riskLevel = 'critical';

      return {
        tokenAddress: ethers.getAddress(tokenAddress),
        tokenInfo,
        isHoneypot,
        hasMintFunction: false,
        hasOwnershipRenounced,
        buyTax,
        sellTax,
        liquidityLocked: false,
        isVerified: false,
        safetyScore,
        riskLevel,
        warnings,
        timestamp
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        tokenAddress,
        tokenInfo: null,
        isHoneypot: true,
        honeypotReason: errorMessage,
        hasMintFunction: false,
        hasOwnershipRenounced: false,
        buyTax: 0,
        sellTax: 0,
        liquidityLocked: false,
        isVerified: false,
        safetyScore: 0,
        riskLevel: 'critical',
        warnings: [`Analysis failed: ${errorMessage}`],
        timestamp
      };
    }
  }

  async addWhale(address: string, label?: string): Promise<WhaleWallet> {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid wallet address');
    }

    const whale: WhaleWallet = {
      address: ethers.getAddress(address),
      label,
      isActive: true,
      tradesCount: 0
    };

    this.trackedWhales.set(address.toLowerCase(), whale);
    this.emit('whale:added', whale);

    return whale;
  }

  async removeWhale(address: string): Promise<boolean> {
    const normalized = address.toLowerCase();
    const existed = this.trackedWhales.has(normalized);
    this.trackedWhales.delete(normalized);

    if (existed) {
      this.emit('whale:removed', address);
    }

    return existed;
  }

  getTrackedWhales(): WhaleWallet[] {
    return Array.from(this.trackedWhales.values());
  }

  async getWhaleActivity(address?: string, limit: number = 50): Promise<WhaleActivity[]> {
    const activities: WhaleActivity[] = [];
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;

    if (!etherscanApiKey) {
      logger.warn('[SniperService] No Etherscan API key configured for whale tracking');
      return activities;
    }

    const walletsToTrack = address
      ? [address.toLowerCase()]
      : Array.from(this.trackedWhales.keys());

    if (walletsToTrack.length === 0) {
      return activities;
    }

    try {
      for (const walletAddress of walletsToTrack.slice(0, 5)) {
        const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${walletAddress}&page=1&offset=${limit}&sort=desc&apikey=${etherscanApiKey}`;

        const response = await fetch(url);
        const data = await response.json() as { status: string; result?: Array<{ to: string; contractAddress: string; tokenSymbol?: string; tokenDecimal?: string; value: string; hash: string; timeStamp: string }> };

        if (data.status === '1' && Array.isArray(data.result)) {
          for (const tx of data.result) {
            const isReceive = tx.to.toLowerCase() === walletAddress.toLowerCase();
            const action: 'buy' | 'sell' = isReceive ? 'buy' : 'sell';

            const decimals = parseInt(tx.tokenDecimal || '18');
            const amount = ethers.formatUnits(tx.value, decimals);

            const valueInEth = parseFloat(amount) * 0.001;

            activities.push({
              wallet: walletAddress,
              action,
              tokenAddress: tx.contractAddress,
              tokenSymbol: tx.tokenSymbol || 'UNKNOWN',
              amount: amount,
              value: valueInEth.toFixed(4) + ' ETH',
              txHash: tx.hash,
              timestamp: parseInt(tx.timeStamp) * 1000
            });
          }
        }
      }

      activities.sort((a, b) => b.timestamp - a.timestamp);

      return activities.slice(0, limit);
    } catch (error) {
      logger.error('[SniperService] Error fetching whale activity:', error);
      return activities;
    }
  }

  async discoverMemeTokens(options: {
    minLiquidity?: number;
    maxAge?: number;
    limit?: number;
  } = {}): Promise<MemeToken[]> {
    return Array.from(this.discoveredTokens.values())
      .slice(0, options.limit || 20);
  }

  async executeBuy(
    tokenAddress: string,
    amountEth: string,
    options: {
      slippage?: number;
      gasMultiplier?: number;
      deadline?: number;
    } = {}
  ): Promise<TradeResult> {
    if (!this.wallet) {
      return {
        success: false,
        error: 'Wallet not configured - trading is disabled'
      };
    }

    try {
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      const slippage = options.slippage || config.trading.defaultSlippage;
      const gasMultiplier = options.gasMultiplier || config.trading.defaultGasMultiplier;
      const deadline = options.deadline || Math.floor(Date.now() / 1000) + 300;

      const amountIn = ethers.parseEther(amountEth);
      const router = new ethers.Contract(config.dex.uniswapV2Router, ROUTER_ABI, this.wallet);
      const path = [config.dex.weth, tokenAddress];

      const amountsOut = await router.getAmountsOut(amountIn, path);
      const minAmountOut = amountsOut[1] * BigInt(Math.floor((100 - slippage) * 100)) / 10000n;

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice
        ? BigInt(Math.floor(Number(feeData.gasPrice) * gasMultiplier))
        : ethers.parseUnits('30', 'gwei');

      logger.info(`[SniperService] Executing BUY: token=${tokenAddress}, amount=${amountEth} ETH, slippage=${slippage}%`);

      const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
        minAmountOut,
        path,
        this.wallet.address,
        deadline,
        {
          value: amountIn,
          gasPrice
        }
      );

      logger.info(`[SniperService] BUY tx submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      logger.info(`[SniperService] BUY tx confirmed: ${tx.hash}, gasUsed=${receipt.gasUsed}`);

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const tokenInfo = await this.getTokenInfo(tokenAddress);
      const balance = await tokenContract.balanceOf(this.wallet.address);

      const position: Position = {
        id: tx.hash,
        tokenAddress,
        tokenSymbol: tokenInfo?.symbol || '???',
        entryPrice: amountEth,
        currentPrice: amountEth,
        amount: ethers.formatUnits(balance, tokenInfo?.decimals || 18),
        value: amountEth,
        pnl: '0',
        pnlPercent: 0,
        txHash: tx.hash,
        openedAt: Date.now()
      };

      this.positions.set(tokenAddress.toLowerCase(), position);
      this.emit('position:opened', position);

      return {
        success: true,
        txHash: tx.hash,
        tokenAmount: ethers.formatUnits(balance, tokenInfo?.decimals || 18),
        ethAmount: amountEth,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async executeSell(
    tokenAddress: string,
    amountPercent: number = 100,
    options: {
      slippage?: number;
      gasMultiplier?: number;
      deadline?: number;
    } = {}
  ): Promise<TradeResult> {
    if (!this.wallet) {
      return {
        success: false,
        error: 'Wallet not configured - trading is disabled'
      };
    }

    try {
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      const slippage = options.slippage || config.trading.defaultSlippage;
      const gasMultiplier = options.gasMultiplier || config.trading.defaultGasMultiplier;
      const deadline = options.deadline || Math.floor(Date.now() / 1000) + 300;

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
      const tokenInfo = await this.getTokenInfo(tokenAddress);
      const balance = await tokenContract.balanceOf(this.wallet.address);

      if (balance === 0n) {
        return {
          success: false,
          error: 'No tokens to sell'
        };
      }

      const amountToSell = (balance * BigInt(Math.floor(amountPercent))) / 100n;
      const router = new ethers.Contract(config.dex.uniswapV2Router, ROUTER_ABI, this.wallet);
      const path = [tokenAddress, config.dex.weth];

      const allowance = await tokenContract.allowance(this.wallet.address, config.dex.uniswapV2Router);
      if (allowance < amountToSell) {
        const approveTx = await tokenContract.approve(
          config.dex.uniswapV2Router,
          ethers.MaxUint256
        );
        await approveTx.wait();
      }

      const amountsOut = await router.getAmountsOut(amountToSell, path);
      const minAmountOut = amountsOut[1] * BigInt(Math.floor((100 - slippage) * 100)) / 10000n;

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice
        ? BigInt(Math.floor(Number(feeData.gasPrice) * gasMultiplier))
        : ethers.parseUnits('30', 'gwei');

      logger.info(`[SniperService] Executing SELL: token=${tokenAddress}, amount=${amountPercent}%, slippage=${slippage}%`);

      const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        amountToSell,
        minAmountOut,
        path,
        this.wallet.address,
        deadline,
        {
          gasPrice
        }
      );

      logger.info(`[SniperService] SELL tx submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      logger.info(`[SniperService] SELL tx confirmed: ${tx.hash}, gasUsed=${receipt.gasUsed}`);

      if (amountPercent >= 100) {
        this.positions.delete(tokenAddress.toLowerCase());
        this.emit('position:closed', tokenAddress);
      }

      return {
        success: true,
        txHash: tx.hash,
        tokenAmount: ethers.formatUnits(amountToSell, tokenInfo?.decimals || 18),
        ethAmount: ethers.formatEther(amountsOut[1]),
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getPositions(): Promise<Position[]> {
    if (!this.wallet) {
      return [];
    }

    const positions: Position[] = [];

    for (const [address, position] of this.positions) {
      try {
        const tokenContract = new ethers.Contract(address, ERC20_ABI, this.provider);
        const balance = await tokenContract.balanceOf(this.wallet.address);

        if (balance > 0n) {
          const factory = new ethers.Contract(config.dex.uniswapV2Factory, FACTORY_ABI, this.provider);
          const pairAddress = await factory.getPair(address, config.dex.weth);

          let currentValue = '0';
          if (pairAddress !== ethers.ZeroAddress) {
            const router = new ethers.Contract(config.dex.uniswapV2Router, ROUTER_ABI, this.provider);
            try {
              const amounts = await router.getAmountsOut(balance, [address, config.dex.weth]);
              currentValue = ethers.formatEther(amounts[1]);
            } catch { }
          }

          const entryValue = parseFloat(position.entryPrice);
          const current = parseFloat(currentValue);
          const pnl = current - entryValue;
          const pnlPercent = entryValue > 0 ? ((current - entryValue) / entryValue) * 100 : 0;

          positions.push({
            ...position,
            currentPrice: currentValue,
            value: currentValue,
            pnl: pnl.toFixed(6),
            pnlPercent
          });
        }
      } catch (error) {
        logger.error(`[SniperService] Error updating position for ${address}:`, error);
      }
    }

    return positions;
  }

  async getBalance(): Promise<{ eth: string; tokens: Array<{ address: string; symbol: string; balance: string; value?: string }> }> {
    if (!this.wallet) {
      return { eth: '0', tokens: [] };
    }

    const ethBalance = await this.provider.getBalance(this.wallet.address);
    const tokens: Array<{ address: string; symbol: string; balance: string; value?: string }> = [];

    for (const [address] of this.positions) {
      try {
        const contract = new ethers.Contract(address, ERC20_ABI, this.provider);
        const [balance, symbol, decimals] = await Promise.all([
          contract.balanceOf(this.wallet.address),
          contract.symbol().catch(() => '???'),
          contract.decimals().catch(() => 18)
        ]);

        if (balance > 0n) {
          tokens.push({
            address,
            symbol,
            balance: ethers.formatUnits(balance, decimals)
          });
        }
      } catch { }
    }

    return {
      eth: ethers.formatEther(ethBalance),
      tokens
    };
  }

  getStatus(): {
    configured: boolean;
    walletAddress: string | null;
    trackedWhales: number;
    openPositions: number;
    discoveredTokens: number;
  } {
    return {
      configured: this.isConfigured(),
      walletAddress: this.getWalletAddress(),
      trackedWhales: this.trackedWhales.size,
      openPositions: this.positions.size,
      discoveredTokens: this.discoveredTokens.size
    };
  }
}

export const sniperService = new SniperService();
